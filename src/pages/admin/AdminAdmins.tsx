import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, ShieldOff, Loader2, ShieldAlert, Search } from "lucide-react";
import { toast } from "sonner";

const AdminAdmins = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: roles = [], isLoading: rl } = useQuery({
    queryKey: ["admin", "all_roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role, created_at");
      return data || [];
    },
  });

  const { data: users = [], isLoading: ul } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, username, avatar").order("username");
      return data || [];
    },
  });

  const adminIds = new Set(roles.filter((r: any) => r.role === "admin" || r.role === "super_admin").map((r: any) => r.user_id));

  const promote = async (uid: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: "admin", granted_by: user!.id });
    if (error) return toast.error("Erreur (déjà admin ?)");
    toast.success("Promu admin");
    qc.invalidateQueries({ queryKey: ["admin", "all_roles"] });
  };

  const demote = async (uid: string) => {
    if (!confirm("Retirer le rôle admin ?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "admin");
    if (error) return toast.error("Erreur");
    toast.success("Rôle retiré");
    qc.invalidateQueries({ queryKey: ["admin", "all_roles"] });
  };

  const adminUsers = users.filter((u: any) => adminIds.has(u.id));
  const candidates = users.filter((u: any) => !adminIds.has(u.id) && u.username.toLowerCase().includes(search.toLowerCase()));

  if (rl || ul) return <AdminLayout><Loader2 className="mx-auto my-12 h-6 w-6 animate-spin text-primary" /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground">Gestion des admins</h1>
          <p className="text-sm text-muted-foreground">Réservé aux super-admins</p>
        </div>

        <section>
          <h2 className="mb-2 font-mono text-sm uppercase tracking-wider text-muted-foreground">Administrateurs actuels</h2>
          <div className="rounded-md border border-border bg-card divide-y divide-border">
            {adminUsers.map((u: any) => {
              const role = roles.find((r: any) => r.user_id === u.id && (r.role === "admin" || r.role === "super_admin"))?.role;
              const isSuper = roles.some((r: any) => r.user_id === u.id && r.role === "super_admin");
              return (
                <div key={u.id} className="flex items-center gap-3 p-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{u.avatar}</span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/user/${u.id}`} className="text-sm font-medium text-foreground hover:text-primary">{u.username}</Link>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {isSuper ? <ShieldAlert className="h-3 w-3 text-primary" /> : <Shield className="h-3 w-3" />}
                      {role?.replace("_", " ")}
                    </div>
                  </div>
                  {!isSuper && (
                    <button onClick={() => demote(u.id)} className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/20">
                      <ShieldOff className="h-3.5 w-3.5" /> Retirer
                    </button>
                  )}
                </div>
              );
            })}
            {adminUsers.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Aucun admin.</p>}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-mono text-sm uppercase tracking-wider text-muted-foreground">Promouvoir un utilisateur</h2>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="h-9 w-full rounded-md border border-border bg-muted pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="rounded-md border border-border bg-card divide-y divide-border max-h-96 overflow-y-auto">
            {candidates.slice(0, 30).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 p-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">{u.avatar}</span>
                <span className="flex-1 text-sm text-foreground">{u.username}</span>
                <button onClick={() => promote(u.id)} className="flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20">
                  <Shield className="h-3.5 w-3.5" /> Promouvoir
                </button>
              </div>
            ))}
            {candidates.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Aucun candidat.</p>}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminAdmins;
