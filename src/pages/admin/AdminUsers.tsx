import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Ban, ShieldCheck, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

const AdminUsers = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar, reputation, location, created_at")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin", "all_roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role");
      return data || [];
    },
  });

  const { data: bans = [] } = useQuery({
    queryKey: ["admin", "bans"],
    queryFn: async () => {
      const { data } = await supabase.from("user_bans").select("user_id, reason");
      return data || [];
    },
  });

  const ban = async (uid: string) => {
    const reason = prompt("Raison du bannissement ?");
    if (reason === null) return;
    const { error } = await supabase.from("user_bans").insert({ user_id: uid, reason, banned_by: user!.id });
    if (error) return toast.error("Erreur");
    toast.success("Utilisateur banni");
    qc.invalidateQueries({ queryKey: ["admin", "bans"] });
  };

  const unban = async (uid: string) => {
    const { error } = await supabase.from("user_bans").delete().eq("user_id", uid);
    if (error) return toast.error("Erreur");
    toast.success("Bannissement levé");
    qc.invalidateQueries({ queryKey: ["admin", "bans"] });
  };

  const roleOf = (uid: string) => {
    const r = roles.filter((x: any) => x.user_id === uid).map((x: any) => x.role);
    if (r.includes("super_admin")) return "super_admin";
    if (r.includes("admin")) return "admin";
    return "user";
  };
  const isBanned = (uid: string) => bans.some((b: any) => b.user_id === uid);

  const filtered = users.filter((u: any) => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="font-mono text-2xl font-bold text-foreground">Utilisateurs</h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="h-9 w-full rounded-md border border-border bg-muted pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /> : (
          <div className="rounded-md border border-border bg-card divide-y divide-border">
            {filtered.map((u: any) => {
              const role = roleOf(u.id);
              const banned = isBanned(u.id);
              return (
                <div key={u.id} className="flex items-center gap-3 p-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{u.avatar}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/user/${u.id}`} className="text-sm font-medium text-foreground hover:text-primary">{u.username}</Link>
                      {role !== "user" && (
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase ${role === "super_admin" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent-foreground"}`}>
                          {role.replace("_", " ")}
                        </span>
                      )}
                      {banned && <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-mono uppercase text-destructive">banni</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.reputation} rép • {u.location || "—"}</div>
                  </div>
                  {role === "super_admin" ? (
                    <span className="text-xs text-muted-foreground">protégé</span>
                  ) : banned ? (
                    <button onClick={() => unban(u.id)} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary">
                      <ShieldCheck className="h-3.5 w-3.5" /> Débannir
                    </button>
                  ) : (
                    <button onClick={() => ban(u.id)} className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/20">
                      <Ban className="h-3.5 w-3.5" /> Bannir
                    </button>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Aucun utilisateur.</p>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
