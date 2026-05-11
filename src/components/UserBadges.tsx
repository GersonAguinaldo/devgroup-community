import { useUserBadges } from "@/hooks/useBadges";
import { badgeIcon, TIER_STYLES } from "@/lib/badges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  userId: string;
  size?: "sm" | "md";
  limit?: number;
}

const UserBadges = ({ userId, size = "md", limit }: Props) => {
  const { data: badges = [] } = useUserBadges(userId);
  if (!badges.length) return null;
  const list = limit ? badges.slice(0, limit) : badges;
  const dim = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-wrap items-center gap-1">
        {list.map((b) => {
          const Icon = badgeIcon(b.icon);
          return (
            <Tooltip key={b.code}>
              <TooltipTrigger asChild>
                <span
                  className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                    TIER_STYLES[b.tier] || TIER_STYLES.bronze
                  }`}
                >
                  <Icon className={dim} />
                  {b.name}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-xs">
                {b.description}
              </TooltipContent>
            </Tooltip>
          );
        })}
        {limit && badges.length > limit && (
          <span className="text-[10px] font-mono text-muted-foreground">+{badges.length - limit}</span>
        )}
      </div>
    </TooltipProvider>
  );
};

export default UserBadges;
