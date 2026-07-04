import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Check, X, Lightbulb } from "lucide-react";
import { toast } from "sonner";

interface Props {
  title: string;
  body: string;
  postType: "question" | "news" | "discussion";
  onApply: (next: { title: string; body: string }) => void;
}

type Result = {
  improvedTitle: string;
  improvedBody: string;
  suggestions: string[];
};

export default function AIAssistPanel({ title, body, postType, onApply }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [open, setOpen] = useState(false);

  const run = async () => {
    if (title.trim().length < 5 && body.trim().length < 20) {
      toast.error("Ajoutez un peu de contenu avant de demander de l'aide.");
      return;
    }
    setLoading(true);
    setOpen(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-improve-question", {
        body: { title, body, postType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult({
        improvedTitle: data?.improvedTitle || title,
        improvedBody: data?.improvedBody || body,
        suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
      });
    } catch (e: any) {
      toast.error(e?.message || "L'assistant IA n'a pas répondu.");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Assistant IA</span>
          <span className="text-[11px] text-muted-foreground">
            Reformule le titre, structure le corps et signale ce qu'il manque.
          </span>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Améliorer avec l'IA
        </button>
      </div>

      {open && result && (
        <div className="mt-3 space-y-3">
          {result.suggestions.length > 0 && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-primary" />
                Suggestions
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-4">
                {result.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Titre proposé</p>
            <p className="text-sm font-mono text-foreground rounded-md border border-border bg-muted p-2">
              {result.improvedTitle}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Corps proposé</p>
            <pre className="whitespace-pre-wrap text-xs font-mono text-foreground/90 rounded-md border border-border bg-muted p-2 max-h-64 overflow-auto">
              {result.improvedBody}
            </pre>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onApply({ title: result.improvedTitle, body: result.improvedBody });
                toast.success("Suggestion appliquée");
                setOpen(false);
              }}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Check className="h-3.5 w-3.5" />
              Appliquer
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Ignorer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
