import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useTags } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { X, AlertCircle, Info, LogIn, MessageSquare, Newspaper, MessagesSquare, BarChart3, Plus, Trash2, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import MarkdownEditor from "@/components/MarkdownEditor";
import AIAssistPanel from "@/components/AIAssistPanel";
import { useDraft } from "@/hooks/useDraft";

type PostType = "question" | "news" | "discussion";

const AskQuestion = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const communityId = params.get("community");
  const { user } = useAuth();
  const { data: tags = [] } = useTags();

  const draftKey = `devflow.draft.ask${communityId ? `.c-${communityId}` : ""}`;
  const { value: draft, setValue: setDraft, restored, dismissRestored, clear: clearDraft } = useDraft(draftKey, {
    postType: "question" as PostType,
    title: "",
    body: "",
    selectedTags: [] as string[],
    pollEnabled: false,
    pollTitle: "",
    pollOptions: ["", ""] as string[],
    pollEndsAt: "",
  });
  const { postType, title, body, selectedTags, pollEnabled, pollTitle, pollOptions, pollEndsAt } = draft;
  const setPostType = (v: PostType) => setDraft((d) => ({ ...d, postType: v }));
  const setTitle = (v: string) => setDraft((d) => ({ ...d, title: v }));
  const setBody = (v: string) => setDraft((d) => ({ ...d, body: v }));
  const setSelectedTags = (v: string[]) => setDraft((d) => ({ ...d, selectedTags: v }));
  const setPollEnabled = (v: boolean) => setDraft((d) => ({ ...d, pollEnabled: v }));
  const setPollTitle = (v: string) => setDraft((d) => ({ ...d, pollTitle: v }));
  const setPollOptions = (v: string[]) => setDraft((d) => ({ ...d, pollOptions: v }));
  const setPollEndsAt = (v: string) => setDraft((d) => ({ ...d, pollEndsAt: v }));

  const [tagSearch, setTagSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const filteredTags = tags
    .map((t) => t.name)
    .filter((t) => t.includes(tagSearch.toLowerCase()) && !selectedTags.includes(t));

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
      setTagSearch("");
    }
  };

  const suggestTags = async () => {
    if (title.trim().length < 5 && body.trim().length < 20) {
      toast.error("Ajoutez un titre et un peu de contenu.");
      return;
    }
    setSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-suggest-tags", {
        body: { title, body, availableTags: tags.map((t) => t.name) },
      });
      if (error) throw error;
      const suggested: string[] = Array.isArray(data?.tags) ? data.tags : [];
      const toAdd = suggested.filter((t) => !selectedTags.includes(t)).slice(0, 5 - selectedTags.length);
      if (toAdd.length === 0) {
        toast.info("Aucun nouveau tag pertinent trouvé.");
      } else {
        setSelectedTags([...selectedTags, ...toAdd]);
        toast.success(`${toAdd.length} tag(s) ajouté(s)`);
      }
    } catch (e: any) {
      toast.error(e?.message || "L'assistant n'a pas répondu.");
    } finally {
      setSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("questions")
      .insert({ author_id: user.id, title: title.trim(), body: body.trim(), post_type: postType, community_id: communityId || null } as any)
      .select("id")
      .single();
    if (error || !data) {
      setSubmitting(false);
      toast.error("Impossible de publier.");
      return;
    }
    if (selectedTags.length > 0) {
      const rows = selectedTags.map((tag_name) => ({ question_id: data.id, tag_name }));
      await supabase.from("question_tags").insert(rows);
    }
    if (pollEnabled && postType !== "question") {
      const cleanOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (pollTitle.trim() && cleanOptions.length >= 2) {
        const { data: poll } = await supabase
          .from("polls")
          .insert({
            question_id: data.id,
            author_id: user.id,
            title: pollTitle.trim(),
            ends_at: pollEndsAt ? new Date(pollEndsAt).toISOString() : null,
          })
          .select("id")
          .single();
        if (poll) {
          await supabase.from("poll_options").insert(
            cleanOptions.map((label, i) => ({ poll_id: poll.id, label, position: i }))
          );
        }
      }
    }
    setSubmitting(false);
    clearDraft();
    toast.success(
      postType === "news" ? "Actualité publiée !" :
      postType === "discussion" ? "Discussion publiée !" :
      "Question publiée !"
    );
    navigate(`/question/${data.id}`);
  };

  const isQuestion = postType === "question";
  const isDiscussion = postType === "discussion";
  const typeLabel = postType === "news" ? "actualité" : postType === "discussion" ? "discussion" : "question";
  const isValid =
    title.trim().length >= 15 &&
    body.trim().length >= 30 &&
    (isQuestion ? selectedTags.length >= 1 : true);

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center py-16 animate-fade-in">
          <LogIn className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold font-mono text-foreground mb-2">Connexion requise</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Vous devez être connecté pour poser une question.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold font-mono text-foreground mb-1">
          {isQuestion ? "Poser une question" : isDiscussion ? "Lancer une discussion" : "Publier une actualité"}
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          {isQuestion
            ? "Décrivez votre problème clairement pour obtenir les meilleures réponses."
            : isDiscussion
            ? "Lancez un débat, un retour d'expérience ou un show & tell avec la communauté."
            : "Partagez une actualité, une annonce ou un événement avec la communauté."}
        </p>

        <div className="mb-6 inline-flex items-center gap-1 rounded-lg bg-muted p-1">
          {([
            { key: "question" as PostType, icon: MessageSquare, label: "Question" },
            { key: "discussion" as PostType, icon: MessagesSquare, label: "Discussion" },
            { key: "news" as PostType, icon: Newspaper, label: "Actualité" },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPostType(key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                postType === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-primary/5 p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
            <Info className="h-4 w-4 text-primary" />
            {isQuestion ? "Comment poser une bonne question" : isDiscussion ? "Comment lancer une bonne discussion" : "Comment rédiger une bonne actualité"}
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1.5 ml-5 list-disc">
            <li>Résumez {isQuestion ? "le problème" : isDiscussion ? "le sujet" : "l'actualité"} dans le titre (min. 15 caractères)</li>
            <li>{isQuestion ? "Décrivez en détail ce que vous avez essayé" : isDiscussion ? "Donnez du contexte et lancez le débat avec une vraie question ouverte" : "Détaillez le contexte et les informations clés"} (min. 30 caractères)</li>
            <li>Utilisez le Markdown et les blocs de code avec ```</li>
            <li>{isQuestion ? "Ajoutez 1 à 5 tags pertinents" : "Ajoutez jusqu'à 5 tags (optionnel)"}</li>
            {!isQuestion && <li>Vous pouvez ajouter un sondage pour recueillir l'avis de la communauté</li>}
          </ul>
        </div>

        {restored && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground">
            <span>Brouillon restauré automatiquement.</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={dismissRestored}
                className="text-muted-foreground hover:text-foreground"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => {
                  clearDraft();
                  setDraft({
                    postType: "question",
                    title: "",
                    body: "",
                    selectedTags: [],
                    pollEnabled: false,
                    pollTitle: "",
                    pollOptions: ["", ""],
                    pollEndsAt: "",
                  });
                }}
                className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="h-3 w-3" />
                Repartir de zéro
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Comment optimiser les re-renders dans React ?"
              className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              required
            />
            {title.length > 0 && title.length < 15 && (
              <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Le titre doit contenir au moins 15 caractères ({title.length}/15)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Description</label>
            <MarkdownEditor
              value={body}
              onChange={setBody}
              placeholder="Décrivez votre problème en détail. Utilisez du Markdown et des blocs de code ```"
              minHeight={220}
              storageKey="devflow.mdmode.ask"
            />
            {body.length > 0 && body.length < 30 && (
              <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                La description doit contenir au moins 30 caractères ({body.length}/30)
              </p>
            )}
          </div>

          <AIAssistPanel
            title={title}
            body={body}
            postType={postType}
            onApply={({ title: t, body: b }) => {
              setTitle(t);
              setBody(b);
            }}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-foreground">
                Tags <span className="text-muted-foreground font-normal">{isQuestion ? "(1-5 tags)" : "(optionnel, max 5)"}</span>
              </label>
              <button
                type="button"
                onClick={suggestTags}
                disabled={suggesting || selectedTags.length >= 5}
                className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-foreground hover:border-primary/40 hover:text-primary disabled:opacity-50"
              >
                {suggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Suggérer avec l'IA
              </button>
            </div>


            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="flex items-center gap-1 rounded-sm bg-primary/15 px-2 py-0.5 text-xs font-mono font-medium text-primary hover:bg-primary/25 transition-colors"
                  >
                    {tag}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Rechercher un tag..."
              className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />

            {tagSearch && filteredTags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1 p-2 rounded-md border border-border bg-card">
                {filteredTags.slice(0, 8).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="rounded-sm bg-tag px-2 py-0.5 text-xs font-mono font-medium text-tag-foreground hover:bg-primary/20 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Optional poll for news/discussion */}
          {!isQuestion && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pollEnabled}
                  onChange={(e) => setPollEnabled(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Ajouter un sondage</span>
              </label>
              {pollEnabled && (
                <div className="space-y-3 pl-6">
                  <input
                    type="text"
                    value={pollTitle}
                    onChange={(e) => setPollTitle(e.target.value)}
                    placeholder="Question du sondage"
                    className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="space-y-2">
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...pollOptions];
                            next[i] = e.target.value;
                            setPollOptions(next);
                          }}
                          placeholder={`Option ${i + 1}`}
                          className="flex-1 rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 6 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions([...pollOptions, ""])}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Plus className="h-3 w-3" /> Ajouter une option
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Date de clôture (optionnel)</label>
                    <input
                      type="datetime-local"
                      value={pollEndsAt}
                      onChange={(e) => setPollEndsAt(e.target.value)}
                      className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Publication…" : `Publier la ${typeLabel}`}
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AskQuestion;
