import { timeAgo } from "@/lib/timeAgo";

interface Props {
  lastSeenAt?: string | null;
  showLabel?: boolean;
  className?: string;
}

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

const OnlineDot = ({ lastSeenAt, showLabel = false, className = "" }: Props) => {
  if (!lastSeenAt) return null;
  const isOnline = Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} title={isOnline ? "En ligne" : `Vu ${timeAgo(lastSeenAt)}`}>
      <span
        className={`h-2 w-2 rounded-full ${isOnline ? "bg-primary animate-pulse" : "bg-muted-foreground/40"}`}
      />
      {showLabel && (
        <span className="text-[10px] font-mono text-muted-foreground">
          {isOnline ? "En ligne" : `Vu ${timeAgo(lastSeenAt)}`}
        </span>
      )}
    </span>
  );
};

export default OnlineDot;
