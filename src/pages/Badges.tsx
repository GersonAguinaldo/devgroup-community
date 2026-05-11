import Layout from "@/components/Layout";
import { useAllBadges } from "@/hooks/useBadges";
import { badgeIcon, TIER_STYLES } from "@/lib/badges";
import { Award, Loader2 } from "lucide-react";

const Badges = () => {
  const { data: badges = [], isLoading } = useAllBadges();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold font-mono text-foreground">Badges</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Récompenses attribuées automatiquement selon votre activité.
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {badges.map((b) => {
              const Icon = badgeIcon(b.icon);
              return (
                <div
                  key={b.code}
                  className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors animate-fade-in"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-md border ${
                        TIER_STYLES[b.tier] || TIER_STYLES.bronze
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-foreground">{b.name}</h3>
                        <span className="text-[10px] font-mono uppercase text-muted-foreground">
                          {b.tier}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{b.description}</p>
                      <p className="text-[10px] font-mono text-muted-foreground mt-2">
                        {b.holders} détenteur{b.holders > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Badges;
