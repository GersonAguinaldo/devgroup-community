import { ReactNode } from "react";
import { Navigate, NavLink, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useRole";
import { BarChart3, Users, Flag, Shield, MessageSquare, Tag, Loader2, ShieldAlert } from "lucide-react";

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const { data: role, isLoading } = useUserRole();
  const location = useLocation();

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;
  if (role !== "admin" && role !== "super_admin") return <Navigate to="/" replace />;

  const isSuper = role === "super_admin";

  const links = [
    { to: "/admin", icon: BarChart3, label: "Dashboard", end: true },
    { to: "/admin/content", icon: MessageSquare, label: "Contenu" },
    { to: "/admin/reports", icon: Flag, label: "Signalements" },
    { to: "/admin/users", icon: Users, label: "Utilisateurs" },
    { to: "/admin/tags", icon: Tag, label: "Tags" },
    ...(isSuper ? [{ to: "/admin/admins", icon: Shield, label: "Admins" }] : []),
  ];

  return (
    <Layout>
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-20 md:self-start">
          <div className="rounded-md border border-border bg-card p-3">
            <div className="mb-3 flex items-center gap-2 px-2 py-1.5 text-xs font-mono uppercase tracking-wider text-primary">
              {isSuper ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              <span>{isSuper ? "Super Admin" : "Admin"}</span>
            </div>
            <nav className="flex flex-col gap-0.5">
              {links.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </Layout>
  );
};

export default AdminLayout;
