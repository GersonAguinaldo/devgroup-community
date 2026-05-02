import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Users, MessageSquare, MessageCircle, ThumbsUp, Tag, AlertTriangle, TrendingUp, Loader2, Trophy, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface Stats {
  total_users: number;
  total_questions: number;
  total_answers: number;
  total_votes: number;
  total_tags: number;
  questions_last_7d: number;
  users_last_7d: number;
  unanswered_questions: number;
  pending_reports: number;
}

const StatCard = ({ icon: Icon, label, value, hint, accent = false }: any) => (
  <div className={`rounded-md border p-4 ${accent ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
    </div>
    <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
    {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
  </div>
);

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["platform_stats"],
    queryFn: async (): Promise<Stats | null> => {
      const { data, error } = await supabase.from("platform_stats").select("*").maybeSingle();
      if (error) throw error;
      return data as Stats | null;
    },
  });

  const { data: topContributors = [] } = useQuery({
    queryKey: ["top_contributors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar, reputation")
        .order("reputation", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: topTags = [] } = useQuery({
    queryKey: ["top_tags"],
    queryFn: async () => {
      const { data } = await supabase.from("question_tags").select("tag_name");
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => { counts[r.tag_name] = (counts[r.tag_name] || 0) + 1; });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count }));
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Vue d'ensemble de la plateforme</p>
        </div>

        {isLoading || !stats ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Users} label="Utilisateurs" value={stats.total_users} hint={`+${stats.users_last_7d} cette semaine`} />
              <StatCard icon={MessageSquare} label="Questions" value={stats.total_questions} hint={`+${stats.questions_last_7d} cette semaine`} />
              <StatCard icon={MessageCircle} label="Réponses" value={stats.total_answers} />
              <StatCard icon={ThumbsUp} label="Votes" value={stats.total_votes} />
              <StatCard icon={Tag} label="Tags" value={stats.total_tags} />
              <StatCard icon={HelpCircle} label="Sans réponse" value={stats.unanswered_questions} />
              <StatCard
                icon={AlertTriangle}
                label="Signalements"
                value={stats.pending_reports}
                hint={stats.pending_reports > 0 ? "à traiter" : "tout est traité"}
                accent={stats.pending_reports > 0}
              />
              <StatCard icon={TrendingUp} label="Activité 7j" value={stats.questions_last_7d + stats.users_last_7d} hint="questions + nouveaux users" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border border-border bg-card p-4">
                <h2 className="mb-3 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-foreground">
                  <Trophy className="h-4 w-4 text-primary" /> Top contributeurs
                </h2>
                <div className="space-y-2">
                  {topContributors.map((u: any, i: number) => (
                    <Link key={u.id} to={`/user/${u.id}`} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-secondary">
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-xs font-mono text-muted-foreground">#{i + 1}</span>
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">{u.avatar}</span>
                        <span className="text-sm font-medium text-foreground">{u.username}</span>
                      </div>
                      <span className="font-mono text-xs text-primary">{u.reputation}</span>
                    </Link>
                  ))}
                  {topContributors.length === 0 && <p className="text-xs text-muted-foreground">Aucun utilisateur.</p>}
                </div>
              </div>

              <div className="rounded-md border border-border bg-card p-4">
                <h2 className="mb-3 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-foreground">
                  <Tag className="h-4 w-4 text-primary" /> Tags populaires
                </h2>
                <div className="flex flex-wrap gap-2">
                  {topTags.map((t) => (
                    <Link key={t.name} to={`/?tag=${t.name}`} className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 text-xs hover:border-primary/40">
                      <span className="font-mono text-foreground">{t.name}</span>
                      <span className="text-muted-foreground">×{t.count}</span>
                    </Link>
                  ))}
                  {topTags.length === 0 && <p className="text-xs text-muted-foreground">Aucun tag utilisé.</p>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
