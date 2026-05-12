import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useTags } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { X, AlertCircle, Info, LogIn, MessageSquare, Newspaper, MessagesSquare, BarChart3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type PostType = "question" | "news" | "discussion";

const AskQuestion = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tags = [] } = useTags();

  const [postType, setPostType] = useState<PostType>("question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Poll (optional, only for news/discussion)
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollTitle, setPollTitle] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollEndsAt, setPollEndsAt] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("questions")
      .insert({ author_id: user.id, title: title.trim(), body: body.trim(), post_type: postType } as any)
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
    setSubmitting(false);
    toast.success(postType === "news" ? "Actualité publiée !" : "Question publiée !");
    navigate(`/question/${data.id}`);
  };

  const isQuestion = postType === "question";
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
          {isQuestion ? "Poser une question" : "Publier une actualité"}
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          {isQuestion
            ? "Décrivez votre problème clairement pour obtenir les meilleures réponses."
            : "Partagez une actualité, une annonce ou un événement avec la communauté."}
        </p>

        <div className="mb-6 inline-flex items-center gap-1 rounded-lg bg-muted p-1">
          {([
            { key: "question" as PostType, icon: MessageSquare, label: "Question" },
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
            {isQuestion ? "Comment poser une bonne question" : "Comment rédiger une bonne actualité"}
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1.5 ml-5 list-disc">
            <li>Résumez {isQuestion ? "le problème" : "l'actualité"} dans le titre (min. 15 caractères)</li>
            <li>{isQuestion ? "Décrivez en détail ce que vous avez essayé" : "Détaillez le contexte et les informations clés"} (min. 30 caractères)</li>
            <li>Utilisez le Markdown et les blocs de code avec ```</li>
            <li>{isQuestion ? "Ajoutez 1 à 5 tags pertinents" : "Ajoutez jusqu'à 5 tags (optionnel)"}</li>
          </ul>
        </div>

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
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Décrivez votre problème en détail. Utilisez du Markdown et des blocs de code ```"
              className="w-full h-48 rounded-md border border-border bg-muted p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y transition-colors font-mono"
              required
            />
            {body.length > 0 && body.length < 30 && (
              <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                La description doit contenir au moins 30 caractères ({body.length}/30)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Tags <span className="text-muted-foreground font-normal">{isQuestion ? "(1-5 tags)" : "(optionnel, max 5)"}</span>
            </label>

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

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Publication…" : isQuestion ? "Publier la question" : "Publier l'actualité"}
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
