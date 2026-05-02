import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Link } from "react-router-dom";
import { Trash2, MessageSquare, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/timeAgo";

const AdminContent = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"questions" | "answers">("questions");

  const { data: questions = [], isLoading: ql } = useQuery({
    queryKey: ["admin", "questions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("questions_with_meta")
        .select("id, title, author_username, votes, answers_count, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const { data: answers = [], isLoading: al } = useQuery({
    queryKey: ["admin", "answers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("answers_with_meta")
        .select("id, question_id, body, author_username, votes, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const deleteQuestion = async (id: string) => {
    if (!confirm("Supprimer définitivement cette question ?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) return toast.error("Suppression impossible");
    toast.success("Question supprimée");
    qc.invalidateQueries({ queryKey: ["admin", "questions"] });
    qc.invalidateQueries({ queryKey: ["questions"] });
  };

  const deleteAnswer = async (id: string) => {
    if (!confirm("Supprimer définitivement cette réponse ?")) return;
    const { error } = await supabase.from("answers").delete().eq("id", id);
    if (error) return toast.error("Suppression impossible");
    toast.success("Réponse supprimée");
    qc.invalidateQueries({ queryKey: ["admin", "answers"] });
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="font-mono text-2xl font-bold text-foreground">Modération du contenu</h1>

        <div className="flex gap-1 border-b border-border">
          {[
            { id: "questions", label: "Questions", icon: MessageSquare },
            { id: "answers", label: "Réponses", icon: MessageCircle },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "questions" ? (
          ql ? <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-primary" /> : (
            <div className="rounded-md border border-border bg-card divide-y divide-border">
              {questions.map((q: any) => (
                <div key={q.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <Link to={`/question/${q.id}`} className="block truncate text-sm font-medium text-foreground hover:text-primary">
                      {q.title}
                    </Link>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      par {q.author_username} • {q.votes} votes • {q.answers_count} rép. • {formatDate(q.created_at)}
                    </div>
                  </div>
                  <button onClick={() => deleteQuestion(q.id)} className="rounded-md p-2 text-destructive hover:bg-destructive/10" title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {questions.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Aucune question.</p>}
            </div>
          )
        ) : (
          al ? <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-primary" /> : (
            <div className="rounded-md border border-border bg-card divide-y divide-border">
              {answers.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <Link to={`/question/${a.question_id}`} className="block text-sm text-foreground hover:text-primary line-clamp-2">
                      {a.body.substring(0, 200)}{a.body.length > 200 ? "…" : ""}
                    </Link>
                    <div className="mt-1 text-xs text-muted-foreground">
                      par {a.author_username} • {a.votes} votes • {formatDate(a.created_at)}
                    </div>
                  </div>
                  <button onClick={() => deleteAnswer(a.id)} className="rounded-md p-2 text-destructive hover:bg-destructive/10" title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {answers.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Aucune réponse.</p>}
            </div>
          )
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminContent;
