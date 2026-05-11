import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const INTERVAL = 60_000;

export const useHeartbeat = () => {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const ping = () => {
      supabase.rpc("heartbeat" as any).then(() => {});
    };
    ping();
    const id = setInterval(ping, INTERVAL);
    const onVis = () => { if (document.visibilityState === "visible") ping(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user]);
};
