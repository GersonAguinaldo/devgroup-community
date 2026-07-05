import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Layout from "@/components/Layout";
import VoteButton from "@/components/VoteButton";
import CopyButton from "@/components/CopyButton";
import { CheckCircle2, ArrowLeft, Eye, Bookmark, Share2, MessageSquare, Clock, Loader2 } from "lucide-react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { useQuestion, useAnswers, useQuestions } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { timeAgo } from "@/lib/timeAgo";
import CommentList from "@/components/CommentList";
import ReportButton from "@/components/ReportButton";
import MentionTextarea from "@/components/MentionTextarea";
import { useDraft } from "@/hooks/useDraft";
import { RotateCcw } from "lucide-react";
import PollBlock from "@/components/PollBlock";
import { extractMentions, resolveMentions } from "@/lib/mentions";
import { notify, notifyMany } from "@/lib/notify";
import Seo from "@/components/Seo";
import { getSiteUrl } from "@/lib/seo";

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [answerSort, setAnswerSort] = useState<"votes" | "recent">("votes");
  const answerDraft = useDraft(`devflow.draft.answer.${id || "unknown"}`, { body: "" });
  const answerBody = answerDraft.value.body;
  const setAnswerBody = (v: string) => answerDraft.setValue((d) => ({ ...d, body: v }));
  const [submitting, setSubmitting] = useState(false);

  const { data: question, isLoading } = useQuestion(id);
  const { data: answers = [] } = useAnswers(id);
  const { data: allQuestions = [] } = useQuestions();

  // Increment views once on load
  const [viewIncremented, setViewIncremented] = useState(false);
  useEffect(() => {
    if (!id || !question || viewIncremented) return;
    setViewIncremented(true);
    supabase.from("questions").update({ views: question.views + 1 }).eq("id", id).then(() => {
      qc.invalidateQueries({ queryKey: ["question", id] });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, question?.id]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!question) {
    return (
      <>
        <Seo title="Publication introuvable" description="Cette publication est introuvable." noIndex />
        <Layout>
          <div className="text-center py-20">
            <p className="text-muted-foreground">Question introuvable.</p>
            <Link to="/" className="text-primary hover:underline mt-2 inline-block">
              ← Retour aux questions
            </Link>
          </div>
        </Layout>
      </>
    );
  }

  const sortedAnswers = [...answers].sort((a, b) => {
    if (answerSort === "votes") {
      if (a.accepted && !b.accepted) return -1;
      if (!a.accepted && b.accepted) return 1;
      return b.votes - a.votes;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const related = allQuestions
    .filter((q) => q.id !== question.id && q.tags.some((t) => question.tags.includes(t)))
    .slice(0, 4);

  const isQuestionAuthor = user?.id === question.author_id;
  const seoDescription = question.body.replace(/[#*_`>\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  const questionUrl = `/question/${question.id}`;
  const absoluteQuestionUrl = `${getSiteUrl()}${questionUrl}`;
  const questionJsonLd =
    question.post_type === "question"
      ? {
          "@context": "https://schema.org",
          "@type": "QAPage",
          mainEntity: {
            "@type": "Question",
            name: question.title,
            text: question.body,
            dateCreated: question.created_at,
            author: { "@type": "Person", name: question.author_username },
            answerCount: answers.length,
            upvoteCount: question.votes,
            url: absoluteQuestionUrl,
            suggestedAnswer: answers.map((answer) => ({
              "@type": "Answer",
              text: answer.body,
              dateCreated: answer.created_at,
              upvoteCount: answer.votes,
              url: absoluteQuestionUrl,
              author: { "@type": "Person", name: answer.author_username },
            })),
          },
        }
      : {
          "@context": "https://schema.org",
          "@type": question.post_type === "news" ? "NewsArticle" : "DiscussionForumPosting",
          headline: question.title,
          articleBody: question.body,
          datePublished: question.created_at,
          author: { "@type": "Person", name: question.author_username },
          commentCount: answers.length,
          keywords: question.tags.join(", "),
          url: absoluteQuestionUrl,
        };

  const handleAcceptAnswer = async (answerId: string, currentlyAccepted: boolean, answerAuthorId: string) => {
    await supabase.from("answers").update({ accepted: false }).eq("question_id", question.id);
    if (!currentlyAccepted) {
      const { error } = await supabase.from("answers").update({ accepted: true }).eq("id", answerId);
      if (error) {
        toast.error("Impossible d'accepter cette réponse.");
        return;
      }
      toast.success("Réponse acceptée !");
      if (user && answerAuthorId !== user.id) {
        notify({
          user_id: answerAuthorId,
          actor_id: user.id,
          type: "accepted",
          target_type: "answer",
          target_id: answerId,
          question_id: question.id,
        });
      }
    }
    qc.invalidateQueries({ queryKey: ["answers", question.id] });
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      navigate("/auth");
      return;
    }
    if (answerBody.trim().length < 20) {
      toast.error("Votre réponse doit contenir au moins 20 caractères.");
      return;
    }
    setSubmitting(true);
    const { data: inserted, error } = await supabase
      .from("answers")
      .insert({
        question_id: question.id,
        author_id: user.id,
        body: answerBody.trim(),
      })
      .select("id")
      .single();
    setSubmitting(false);
    if (error) {
      toast.error("Impossible de publier la réponse.");
      return;
    }
    // Notify question author
    if (question.author_id !== user.id) {
      notify({
        user_id: question.author_id,
        actor_id: user.id,
        type: "answer",
        target_type: "answer",
        target_id: inserted.id,
        question_id: question.id,
        payload: { excerpt: answerBody.trim().slice(0, 120) },
      });
    }
    // Notify mentioned users
    const mentions = extractMentions(answerBody);
    const mentioned = await resolveMentions(mentions);
    await notifyMany(
      mentioned
        .filter((m) => m.id !== user.id && m.id !== question.author_id)
        .map((m) => ({
          user_id: m.id,
          actor_id: user.id,
          type: "mention" as const,
          target_type: "answer" as const,
          target_id: inserted.id,
          question_id: question.id,
          payload: { excerpt: answerBody.trim().slice(0, 120) },
        }))
    );
    setAnswerBody("");
    answerDraft.clear();
    toast.success("Réponse publiée !");
    qc.invalidateQueries({ queryKey: ["answers", question.id] });
    qc.invalidateQueries({ queryKey: ["questions"] });
  };

  return (
    <>
      <Seo
        title={question.title}
        description={seoDescription || "Consultez cette publication sur DevGroup Community."}
        path={questionUrl}
        type="article"
        jsonLd={questionJsonLd}
      />
      <Layout>
      <div className="max-w-5xl mx-auto" ref={contentRef}>
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>

            <div className="rounded-lg border border-border bg-card p-4 sm:p-6 animate-fade-in">
              <div className="flex gap-4 sm:gap-5">
                <div className="hidden sm:block">
                  <VoteButton totalVotes={question.votes} targetType="question" targetId={question.id} />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold font-mono text-foreground leading-tight">
                    {question.post_type === "news" && (
                      <span className="mr-2 inline-block rounded-sm bg-primary/15 px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-primary align-middle">
                        News
                      </span>
                    )}
                    {question.title}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                    <Link
                      to={`/user/${question.author_id}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                        {question.author_avatar}
                      </span>
                      {question.author_username}
                    </Link>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(question.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {question.views} vues
                    </span>
                  </div>

                  <div className="sm:hidden mt-3">
                    <VoteButton totalVotes={question.votes} targetType="question" targetId={question.id} />
                  </div>

                  <div className="mt-4 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {renderBody(question.body)}
                  </div>

                  <PollBlock questionId={question.id} />

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {question.tags.map((tag) => (
                      <Link
                        key={tag}
                        to={`/?tag=${tag}`}
                        className="rounded-sm bg-tag px-2 py-0.5 text-xs font-mono font-medium text-tag-foreground hover:bg-primary/20 transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-3 pt-3 border-t border-border">
                    <button
                      onClick={() => setBookmarked(!bookmarked)}
                      className={`flex items-center gap-1 text-xs transition-colors ${
                        bookmarked ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} />
                      {bookmarked ? "Enregistrée" : "Enregistrer"}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Lien copié !");
                      }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Partager
                    </button>
                    <ReportButton targetType="question" targetId={question.id} />
                  </div>

                  <CommentList
                    targetType="question"
                    targetId={question.id}
                    questionId={question.id}
                    parentAuthorId={question.author_id}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-mono text-foreground">
                  {answers.length} réponse{answers.length !== 1 ? "s" : ""}
                </h2>
                {answers.length > 1 && (
                  <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                    <button
                      onClick={() => setAnswerSort("votes")}
                      className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                        answerSort === "votes" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Votes
                    </button>
                    <button
                      onClick={() => setAnswerSort("recent")}
                      className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                        answerSort === "recent" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Récent
                    </button>
                  </div>
                )}
              </div>

              {answers.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Pas encore de réponse. Soyez le premier à répondre !
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {sortedAnswers.map((answer) => (
                  <div
                    key={answer.id}
                    className={`rounded-lg border bg-card p-4 sm:p-5 animate-fade-in ${
                      answer.accepted ? "border-primary/40 bg-primary/[0.02]" : "border-border"
                    }`}
                  >
                    <div className="flex gap-4 sm:gap-5">
                      <div className="hidden sm:flex flex-col items-center gap-2">
                        <VoteButton totalVotes={answer.votes} targetType="answer" targetId={answer.id} />
                        {isQuestionAuthor ? (
                          <button
                            onClick={() => handleAcceptAnswer(answer.id, answer.accepted, answer.author_id)}
                            title={answer.accepted ? "Retirer l'acceptation" : "Accepter cette réponse"}
                            className={`rounded-md p-1 transition-colors ${
                              answer.accepted
                                ? "text-primary"
                                : "text-muted-foreground hover:text-primary"
                            }`}
                          >
                            <CheckCircle2 className="h-6 w-6" />
                          </button>
                        ) : (
                          answer.accepted && <CheckCircle2 className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex sm:hidden items-center gap-3 mb-3">
                          <VoteButton totalVotes={answer.votes} targetType="answer" targetId={answer.id} />
                          {answer.accepted && (
                            <span className="flex items-center gap-1 text-xs text-primary font-medium">
                              <CheckCircle2 className="h-4 w-4" />
                              Acceptée
                            </span>
                          )}
                          {isQuestionAuthor && !answer.accepted && (
                            <button
                              onClick={() => handleAcceptAnswer(answer.id, false, answer.author_id)}
                              className="text-xs text-muted-foreground hover:text-primary"
                            >
                              Accepter
                            </button>
                          )}
                        </div>

                        <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                          {renderBody(answer.body)}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
                          <Link
                            to={`/user/${answer.author_id}`}
                            className="flex items-center gap-1.5 hover:text-primary transition-colors"
                          >
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                              {answer.author_avatar}
                            </span>
                            <span className="font-medium text-foreground">{answer.author_username}</span>
                          </Link>
                          <span>· {timeAgo(answer.created_at)}</span>
                          <div className="ml-auto flex items-center gap-2">
                            {answer.accepted && (
                              <span className="hidden sm:inline rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                Acceptée
                              </span>
                            )}
                            <ReportButton targetType="answer" targetId={answer.id} />
                          </div>
                        </div>
                        <CommentList
                          targetType="answer"
                          targetId={answer.id}
                          questionId={question.id}
                          parentAuthorId={answer.author_id}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-border bg-card p-4 sm:p-6 animate-fade-in">
              <h3 className="text-base font-bold font-mono text-foreground mb-3">
                Votre réponse
              </h3>
              {!user && (
                <div className="mb-3 rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
                  <Link to="/auth" className="text-primary hover:underline font-medium">Connectez-vous</Link> pour publier une réponse.
                </div>
              )}
              <form onSubmit={handleSubmitAnswer}>
                <MentionTextarea
                  value={answerBody}
                  onChange={setAnswerBody}
                  disabled={!user}
                  rows={6}
                  placeholder="Écrivez votre réponse... (Markdown supporté, @ pour mentionner)"
                  className="w-full h-32 rounded-md border border-border bg-muted p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y transition-colors font-mono disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!user || submitting || answerBody.trim().length < 20}
                  className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Publication…" : "Publier la réponse"}
                </button>
              </form>
            </div>
          </div>

          {related.length > 0 && (
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-20 rounded-lg border border-border bg-card overflow-hidden">
                <div className="bg-secondary px-4 py-2.5 border-b border-border">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-secondary-foreground">
                    Questions liées
                  </h3>
                </div>
                <div className="p-2">
                  {related.map((q) => (
                    <Link
                      key={q.id}
                      to={`/question/${q.id}`}
                      className="block rounded-md px-3 py-2 text-xs text-foreground/80 hover:text-primary hover:bg-secondary/50 transition-colors leading-snug"
                    >
                      <span className="font-mono text-primary mr-1.5">{q.votes}</span>
                      {q.title.length > 55 ? q.title.slice(0, 55) + "…" : q.title}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
      </Layout>
    </>
  );
};

function renderBody(text: string) {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const langMatch = part.match(/```(\w+)/);
      const lang = langMatch ? langMatch[1] : "";
      const code = part.replace(/```\w*\n?/, "").replace(/```$/, "");
      return (
        <div key={i} className="relative group my-3">
          {lang && (
            <span className="absolute top-0 left-0 rounded-tl-md rounded-br-md bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              {lang}
            </span>
          )}
          <CopyButton text={code.trim()} />
          <pre className="overflow-x-auto rounded-md bg-code p-3 pt-6 text-xs font-mono border border-border">
            <code className="!bg-transparent !p-0">{code.trim()}</code>
          </pre>
        </div>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-code px-1.5 py-0.5 text-xs font-mono text-primary">
          {part.slice(1, -1)}
        </code>
      );
    }
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, j) => {
      if (bp.startsWith("**") && bp.endsWith("**")) {
        return <strong key={`${i}-${j}`} className="font-semibold text-foreground">{bp.slice(2, -2)}</strong>;
      }
      return <span key={`${i}-${j}`}>{bp}</span>;
    });
  });
}

export default QuestionDetail;
