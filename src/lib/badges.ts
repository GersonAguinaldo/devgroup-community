import {
  Award,
  CheckCheck,
  CheckCircle2,
  Flame,
  MessageCircleQuestion,
  MessageSquare,
  Shield,
  ThumbsUp,
} from "lucide-react";

export const BADGE_ICONS: Record<string, typeof Award> = {
  award: Award,
  "check-check": CheckCheck,
  "check-circle-2": CheckCircle2,
  flame: Flame,
  "message-circle-question": MessageCircleQuestion,
  "message-square": MessageSquare,
  shield: Shield,
  "thumbs-up": ThumbsUp,
};

export const TIER_STYLES: Record<string, string> = {
  bronze: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  silver: "text-slate-300 border-slate-300/30 bg-slate-300/10",
  gold: "text-primary border-primary/40 bg-primary/10",
};

export function badgeIcon(name: string) {
  return BADGE_ICONS[name] || Award;
}
