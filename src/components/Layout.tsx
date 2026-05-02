import { Link, useLocation, useNavigate } from "react-router-dom";
import { Code2, MessageSquare, Plus, Search, TrendingUp, Users, Menu, X, LogOut, LogIn, User as UserIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/");
    }
  }, [searchQuery, navigate]);

  const handleAsk = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      navigate("/auth");
    }
  };

  const navLinks = [
    { to: "/", icon: MessageSquare, label: "Questions", match: "/" },
    { to: "/tags", icon: TrendingUp, label: "Tags", match: "/tags" },
    { to: "/users", icon: Users, label: "Utilisateurs", match: "/users" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo vert.png" alt="DevGroup Community" className="h-8 w-auto" />
            <span className="font-mono text-lg font-bold text-foreground hidden sm:inline">
              DevGroup Community
            </span>
          </Link>

          <form onSubmit={handleSearch} className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher des questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-muted pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </form>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, icon: Icon, label, match }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  location.pathname === match
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <Link
            to="/ask"
            onClick={handleAsk}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Poser</span>
          </Link>

          {user && profile ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-secondary transition-colors"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                  {profile.avatar}
                </span>
                <span className="hidden sm:inline text-xs font-medium text-foreground max-w-[100px] truncate">
                  {profile.username}
                </span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-card shadow-lg overflow-hidden animate-fade-in">
                  <Link
                    to={`/user/${profile.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <UserIcon className="h-4 w-4" />
                    Mon profil
                  </Link>
                  <button
                    onClick={async () => { await signOut(); navigate("/"); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Connexion
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card p-3 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {navLinks.map(({ to, icon: Icon, label, match }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === match
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              {!user && (
                <Link
                  to="/auth"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Connexion
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="container py-6 flex-1">{children}</main>

      <footer className="border-t border-border bg-card/95 backdrop-blur-sm mt-auto">
        <div className="container py-6">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
              <div className="flex items-center gap-2">
                <img src="/logo vert.png" alt="DevGroup Community" className="h-6 w-auto" />
                <span className="font-mono text-sm font-bold text-foreground">DevGroup Community</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <Link to="/" className="hover:text-foreground transition-colors">Questions</Link>
                <Link to="/tags" className="hover:text-foreground transition-colors">Tags</Link>
                <Link to="/users" className="hover:text-foreground transition-colors">Utilisateurs</Link>
              </div>
            </div>
            
            <div className="w-full border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <p>© 2026 DevGroup Community. Tous droits réservés.</p>
              <p className="flex items-center gap-1">
                Développé avec ❤️ par{" "}
                <a 
                  href="https://devgroup.ga" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline transition-colors"
                >
                  DevGroup Africa
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
