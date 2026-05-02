import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Check, X, ExternalLink, Loader2, Flag } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/timeAgo";

const AdminReports = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const resolve = async (id: string, status: "resolved" | "dismissed") => {
    const { error } = await supabase
      .from("reports")
      .update({ status, resolved_by: user!.id, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error("Erreur");
    toast.success(status === "resolved" ? "Signalement traité" : "Rejeté");
    qc.invalidateQueries({ queryKey: ["admin", "reports"] });
    qc.invalidateQueries({ queryKey: ["platform_stats"] });
  };

  const pending = reports.filter((r: any) => r.status === "pending");
  const handled = reports.filter((r: any) => r.status !== "pending");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground">Signalements</h1>
          <p className="text-sm text-muted-foreground">{pending.length} en attente</p>
        </div>

        {isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /> : (
          <>
            <section>
              <h2 className="mb-2 font-mono text-sm uppercase tracking-wider text-muted-foreground">En attente</h2>
              <div className="rounded-md border border-border bg-card divide-y divide-border">
                {pending.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Aucun signalement en attente 🎉</p>}
                {pending.map((r: any) => (
                  <div key={r.id} className="flex items-start gap-3 p-3">
                    <Flag className="mt-1 h-4 w-4 shrink-0 text-destructive" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="rounded bg-secondary px-1.5 py-0.5 font-mono uppercase text-foreground">{r.target_type}</span>
                        <span className="text-muted-foreground">{formatDate(r.created_at)}</span>
                      </div>
                      <p className="mt-1 text-sm text-foreground">{r.reason}</p>
                      {r.target_type === "question" && (
                        <Link to={`/question/${r.target_id}`} className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          Voir la question <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => resolve(r.id, "resolved")} className="rounded-md bg-primary/10 p-2 text-primary hover:bg-primary/20" title="Marquer traité">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => resolve(r.id, "dismissed")} className="rounded-md bg-secondary p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Rejeter">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {handled.length > 0 && (
              <section>
                <h2 className="mb-2 font-mono text-sm uppercase tracking-wider text-muted-foreground">Historique</h2>
                <div className="rounded-md border border-border bg-card divide-y divide-border">
                  {handled.slice(0, 20).map((r: any) => (
                    <div key={r.id} className="flex items-center gap-3 p-3 text-sm">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-mono uppercase ${r.status === "resolved" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        {r.status}
                      </span>
                      <span className="flex-1 truncate text-muted-foreground">{r.reason}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
