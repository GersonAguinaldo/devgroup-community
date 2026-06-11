import { Link, useLocation, useSearchParams } from "react-router-dom";
import { MessageSquare, MessagesSquare, Newspaper, TrendingUp, Users, Heart, Award, LayoutGrid } from "lucide-react";

type Item = {
  to: string;
  icon: typeof MessageSquare;
  label: string;
  isActive: (pathname: string, search: URLSearchParams) => boolean;
};

const items: Item[] = [
  {
    to: "/",
    icon: LayoutGrid,
    label: "Accueil",
    isActive: (p, s) => p === "/" && !s.get("type") && !s.get("tag") && !s.get("search"),
  },
  {
    to: "/?type=question",
    icon: MessageSquare,
    label: "Questions",
    isActive: (p, s) => p === "/" && s.get("type") === "question",
  },
  {
    to: "/?type=discussion",
    icon: MessagesSquare,
    label: "Discussions",
    isActive: (p, s) => p === "/" && s.get("type") === "discussion",
  },
  {
    to: "/?type=news",
    icon: Newspaper,
    label: "News",
    isActive: (p, s) => p === "/" && s.get("type") === "news",
  },
  {
    to: "/tags",
    icon: TrendingUp,
    label: "Tags",
    isActive: (p) => p === "/tags",
  },
  {
    to: "/users",
    icon: Users,
    label: "Utilisateurs",
    isActive: (p) => p === "/users" || p.startsWith("/user/"),
  },
  {
    to: "/badges",
    icon: Award,
    label: "Badges",
    isActive: (p) => p === "/badges",
  },
  {
    to: "/community",
    icon: Heart,
    label: "Communauté",
    isActive: (p) => p === "/community",
  },
];

const LeftNav = ({ variant = "sidebar" }: { variant?: "sidebar" | "mobile" }) => {
  const { pathname } = useLocation();
  const [search] = useSearchParams();

  return (
    <nav className={variant === "sidebar" ? "flex flex-col gap-0.5" : "flex flex-col gap-1"}>
      {items.map(({ to, icon: Icon, label, isActive }) => {
        const active = isActive(pathname, search);
        return (
          <Link
            key={label}
            to={to}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default LeftNav;
