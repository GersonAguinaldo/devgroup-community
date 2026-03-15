import { useParams, Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { questions } from "@/data/mockData";
import Layout from "@/components/Layout";
import VoteButton from "@/components/VoteButton";
import { CheckCircle2, ArrowLeft, Eye } from "lucide-react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

const QuestionDetail = () => {
  const { id } = useParams();
  const question = questions.find((q) => q.id === id);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  });

  if (!question) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Question introuvable.</p>
          <Link to="/" className="text-primary hover:underline mt-2 inline-block">
            ← Retour aux questions
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto" ref={contentRef}>
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        {/* Question */}
        <div className="rounded-lg border border-border bg-card p-6 animate-fade-in">
          <div className="flex gap-5">
            <VoteButton initialVotes={question.votes} />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold font-mono text-foreground leading-tight">
                {question.title}
              </h1>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                    {question.authorAvatar}
                  </span>
                  {question.author}
                </span>
                <span>{question.createdAt}</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {question.views} vues
                </span>
              </div>
              <div className="mt-4 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {renderBody(question.body)}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {question.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm bg-tag px-2 py-0.5 text-xs font-mono font-medium text-tag-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="mt-8">
          <h2 className="text-lg font-bold font-mono text-foreground mb-4">
            {question.answers.length} réponse{question.answers.length !== 1 ? "s" : ""}
          </h2>

          {question.answers.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
              <p className="text-muted-foreground">
                Pas encore de réponse. Soyez le premier à répondre !
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {question.answers.map((answer) => (
              <div
                key={answer.id}
                className={`rounded-lg border bg-card p-5 animate-fade-in ${
                  answer.accepted ? "border-primary/40" : "border-border"
                }`}
              >
                <div className="flex gap-5">
                  <div className="flex flex-col items-center gap-2">
                    <VoteButton initialVotes={answer.votes} />
                    {answer.accepted && (
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {renderBody(answer.body)}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                        {answer.authorAvatar}
                      </span>
                      <span className="font-medium text-foreground">{answer.author}</span>
                      <span>· {answer.createdAt}</span>
                      {answer.accepted && (
                        <span className="ml-auto rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          Acceptée
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Answer form */}
        <div className="mt-8 rounded-lg border border-border bg-card p-6 animate-fade-in">
          <h3 className="text-base font-bold font-mono text-foreground mb-3">
            Votre réponse
          </h3>
          <textarea
            placeholder="Écrivez votre réponse... (Markdown supporté)"
            className="w-full h-32 rounded-md border border-border bg-muted p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y transition-colors"
          />
          <button className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Publier la réponse
          </button>
        </div>
      </div>
    </Layout>
  );
};

function renderBody(text: string) {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const code = part.replace(/```\w*\n?/, "").replace(/```$/, "");
      return (
        <pre key={i} className="my-3 overflow-x-auto rounded-md bg-code p-3 text-xs font-mono border border-border">
          <code className="!bg-transparent !p-0">{code.trim()}</code>
        </pre>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-code px-1.5 py-0.5 text-xs font-mono text-primary">
          {part.slice(1, -1)}
        </code>
      );
    }
    // Bold
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
