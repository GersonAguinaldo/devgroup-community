import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const WINDOW_HOURS = 48;

const WelcomeBanner = () => {
  const { data: newcomers = [] } = useQuery({
    queryKey: ["newcomers"],
    queryFn: async () => {
      const since = new Date(Date.now() - WINDOW_HOURS * 3600 * 1000).toISOString();
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!newcomers.length) return null;

  return (
    <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-3 animate-fade-in">
      <div className="flex items-center gap-2 flex-wrap">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-mono text-muted-foreground">
          Bienvenue à {newcomers.length === 1 ? "notre nouveau membre" : "nos nouveaux membres"} :
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {newcomers.map((u) => (
            <Link
              key={u.id}
              to={`/user/${u.id}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-card border border-border px-2 py-0.5 text-xs hover:border-primary/40 transition-colors"
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-[8px] font-bold text-primary">
                {u.avatar}
              </span>
              <span className="font-mono text-foreground">@{u.username}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
