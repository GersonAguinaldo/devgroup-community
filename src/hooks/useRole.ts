import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "user" | "admin" | "super_admin";

export const useUserRole = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["role", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AppRole> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      const roles = (data || []).map((r) => r.role as AppRole);
      if (roles.includes("super_admin")) return "super_admin";
      if (roles.includes("admin")) return "admin";
      return "user";
    },
  });
};

export const useIsAdmin = () => {
  const { data: role } = useUserRole();
  return role === "admin" || role === "super_admin";
};

export const useIsSuperAdmin = () => {
  const { data: role } = useUserRole();
  return role === "super_admin";
};
