import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plus, Search, Menu, X, LogOut, LogIn, User as UserIcon, Shield, Sun, Moon, Palette } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useRole";
import { useTheme } from "@/contexts/ThemeContext";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import NotificationBell from "./NotificationBell";
import LeftNav from "./LeftNav";
import OnboardingWizard from "./OnboardingWizard";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { data: role } = useUserRole();
  const isAdmin = role === "admin" || role === "super_admin";
  const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();
  useHeartbeat();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Close color picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const PRESET_COLORS = [
    { label: "Vert", value: "#10b981" },
    { label: "Bleu", value: "#3b82f6" },
    { label: "Violet", value: "#8b5cf6" },
    { label: "Rose", value: "#ec4899" },
    { label: "Orange", value: "#f97316" },
    { label: "Rouge", value: "#ef4444" },
    { label: "Cyan", value: "#06b6d4" },
    { label: "Jaune", value: "#eab308" },
  ];
  
  const isAdminPage = location.pathname.startsWith("/admin");
  const isAuthPage = location.pathname === "/auth";

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/search");
    }
  }, [searchQuery, navigate]);

  const handleAsk = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OnboardingWizard />
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo-vert.png" alt="DevGroup Community" className="h-8 w-auto" />
            <span className="font-mono text-lg font-bold text-foreground hidden sm:inline">
              DevGroup Community
            </span>
          </Link>

          <form onSubmit={handleSearch} className="relative flex-1 max-w-xl ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher des publications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-muted pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </form>


          <Link
            to="/ask"
            onClick={handleAsk}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Publier</span>
          </Link>

          {user && profile && <NotificationBell />}

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
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-secondary transition-colors border-t border-border"
                    >
                      <Shield className="h-4 w-4" />
                      Espace admin
                    </Link>
                  )}
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

          {/* Color picker */}
          <div className="relative" ref={colorPickerRef}>
            <button
              onClick={() => setColorPickerOpen(!colorPickerOpen)}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Changer la couleur d'accent"
            >
              <Palette className="h-5 w-5" style={{ color: accentColor }} />
            </button>
            {colorPickerOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-md border border-border bg-card shadow-lg p-3 animate-fade-in z-50">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Couleur d'accent</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => { setAccentColor(c.value); setColorPickerOpen(false); }}
                      className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c.value,
                        borderColor: accentColor === c.value ? "white" : "transparent",
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Personnalisé</label>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-7 w-10 cursor-pointer rounded border border-border bg-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Changer le thème"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card p-3 animate-fade-in">
            <LeftNav variant="mobile" />
            {!user && (
              <Link
                to="/auth"
                className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Connexion
              </Link>
            )}
          </div>
        )}
      </header>

      <div className="container flex gap-6 flex-1 py-6">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20">
            <LeftNav />
          </div>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>


      {!isAdminPage && !isAuthPage && (
        <footer className="border-t border-border bg-card mt-auto">
          <div className="container py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

              {/* Colonne marque */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <img src="/logo-vert.png" alt="DevGroup Community" className="h-7 w-auto" />
                  <span className="font-mono text-sm font-bold text-foreground">DevGroup Community</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Un espace ouvert pour partager des idées, poser des questions, découvrir des projets et créer des liens.
                </p>
                <p className="text-xs text-muted-foreground">
                  Une initiative de{" "}
                  <a
                    href="https://devgroup.ga"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    DevGroup Africa
                  </a>
                </p>
              </div>

              {/* Colonne communauté */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Communauté</h3>
                <ul className="flex flex-col gap-2">
                  <li><Link to="/" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Questions</Link></li>
                  <li><Link to="/?type=discussion" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Discussions</Link></li>
                  <li><Link to="/?type=news" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Actualités</Link></li>
                  <li><Link to="/tags" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Tags</Link></li>
                  <li><Link to="/users" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Membres</Link></li>
                  <li><Link to="/community" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Communauté</Link></li>
                  <li><Link to="/badges" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Badges</Link></li>
                </ul>
              </div>

              {/* Colonne participer */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Participer</h3>
                <ul className="flex flex-col gap-2">
                  <li><Link to="/ask" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Poser une question</Link></li>
                  <li><Link to="/auth" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Créer un compte</Link></li>
                  <li><Link to="/auth" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Se connecter</Link></li>
                </ul>
              </div>

              {/* Colonne ressources */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ressources</h3>
                <ul className="flex flex-col gap-2">
                  <li>
                    <a href="https://devgroup.ga" target="_blank" rel="noopener noreferrer" className="text-sm text-foreground/70 hover:text-foreground transition-colors">
                      DevGroup Africa
                    </a>
                  </li>
                </ul>
              </div>

            </div>
          </div>

          {/* Barre de bas de page */}
          <div className="border-t border-border">
            <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} DevGroup Community. Tous droits réservés.
              </p>
              <p className="text-xs text-muted-foreground">
                Imaginé pour une communauté curieuse, créative et engagée.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
