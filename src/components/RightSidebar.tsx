import { Link } from "react-router-dom";
import { Flame, Award, Zap } from "lucide-react";
import { useQuestions, useProfiles } from "@/hooks/useData";
import OnlineDot from "./OnlineDot";

const RightSidebar = () => {
  const { data: questions = [] } = useQuestions();
  const { data: profiles = [] } = useProfiles();

  const totalAnswers = questions.reduce((acc, q) => acc + q.answers_count, 0);
  const unanswered = questions.filter((q) => q.answers_count === 0).length;

  const hotQuestions = [...questions].sort((a, b) => b.views - a.views).slice(0, 4);
  const topUsers = [...profiles].sort((a, b) => b.reputation - a.reputation).slice(0, 3);

  return (
    <aside className="hidden xl:block w-72 shrink-0">
      <div className="sticky top-20 space-y-5 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 scrollbar-hide">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="bg-primary/10 px-4 py-2.5 border-b border-border">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
              <Zap className="h-3 w-3" />
              Statistiques
            </h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <StatItem value={questions.length} label="Questions" />
            <StatItem value={totalAnswers} label="Réponses" />
            <StatItem value={profiles.length} label="Utilisateurs" />
            <StatItem value={unanswered} label="Sans réponse" />
          </div>
        </div>

        {hotQuestions.length > 0 && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="bg-destructive/10 px-4 py-2.5 border-b border-border">
              <h3 className="text-xs font-bold uppercase tracking-widest text-destructive flex items-center gap-1.5">
                <Flame className="h-3 w-3" />
                Questions populaires
              </h3>
            </div>
            <div className="p-2">
              {hotQuestions.map((q) => (
                <Link
                  key={q.id}
                  to={`/question/${q.id}`}
                  className="block rounded-md px-3 py-2 text-xs text-foreground/80 hover:text-primary hover:bg-secondary/50 transition-colors leading-snug"
                >
                  <span className="font-mono text-primary mr-1.5">{q.votes}</span>
                  {q.title.length > 60 ? q.title.slice(0, 60) + "…" : q.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {topUsers.length > 0 && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="bg-accent/10 px-4 py-2.5 border-b border-border">
              <h3 className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-1.5">
                <Award className="h-3 w-3" />
                Top contributeurs
              </h3>
            </div>
            <div className="p-2">
              {topUsers.map((user) => (
                <Link
                  key={user.id}
                  to={`/user/${user.id}`}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 hover:bg-secondary/50 transition-colors"
                >
                  <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground shrink-0">
                    {user.avatar}
                    <span className="absolute -bottom-0.5 -right-0.5">
                      <OnlineDot lastSeenAt={(user as any).last_seen_at} />
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{user.username}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{formatReputation(user.reputation)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold font-mono text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}

export function formatReputation(rep: number): string {
  if (rep >= 1000) return `${(rep / 1000).toFixed(1)}k`;
  return rep.toString();
}

export default RightSidebar;
