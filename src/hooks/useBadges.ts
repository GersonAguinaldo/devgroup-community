import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BadgeDef {
  code: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
}

export interface UserBadge extends BadgeDef {
  awarded_at: string;
}

export const useAllBadges = () =>
  useQuery({
    queryKey: ["badges", "all"],
    queryFn: async (): Promise<(BadgeDef & { holders: number })[]> => {
      const [{ data: badges }, { data: holders }] = await Promise.all([
        supabase.from("badges").select("*").order("tier"),
        supabase.from("user_badges").select("badge_code"),
      ]);
      const counts = new Map<string, number>();
      (holders || []).forEach((h: any) => counts.set(h.badge_code, (counts.get(h.badge_code) || 0) + 1));
      return (badges || []).map((b: any) => ({ ...b, holders: counts.get(b.code) || 0 }));
    },
  });

export const useUserBadges = (userId?: string) =>
  useQuery({
    queryKey: ["user_badges", userId],
    enabled: !!userId,
    queryFn: async (): Promise<UserBadge[]> => {
      const { data } = await supabase
        .from("user_badges")
        .select("awarded_at, badges:badge_code(code, name, description, icon, tier)")
        .eq("user_id", userId!);
      return (data || []).map((row: any) => ({ ...row.badges, awarded_at: row.awarded_at }));
    },
  });
