import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import QuestionCard from "@/components/QuestionCard";
import Layout from "@/components/Layout";
import RightSidebar from "@/components/RightSidebar";
import WelcomeBanner from "@/components/WelcomeBanner";
import { Flame, Clock, TrendingUp, MessageSquare, Loader2, Newspaper, LayoutGrid, UserCheck, MessagesSquare } from "lucide-react";
import { useQuestions } from "@/hooks/useData";
import { useFollowingIds } from "@/hooks/useFollow";
import { useAuth } from "@/contexts/AuthContext";

type SortBy = "votes" | "recent" | "trending";
type TypeFilter = "all" | "question" | "news" | "discussion" | "following";

const PAGE_SIZE = 10;

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tagFromUrl = searchParams.get("tag");
  const searchFromUrl = searchParams.get("search");
  const typeFromUrl = (searchParams.get("type") as TypeFilter) || "all";

  const [activeTag, setActiveTag] = useState<string | null>(tagFromUrl);
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(typeFromUrl);
  const [page, setPage] = useState(1);

  const { data: questions = [], isLoading } = useQuestions();
  
  const { user } = useAuth();
  const { data: followingIds = [] } = useFollowingIds();

  useEffect(() => {
    setActiveTag(tagFromUrl);
  }, [tagFromUrl]);

  useEffect(() => {
    setTypeFilter(typeFromUrl);
  }, [typeFromUrl]);

  const updateType = (t: TypeFilter) => {
    setTypeFilter(t);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (t === "all") params.delete("type"); else params.set("type", t);
    setSearchParams(params, { replace: true });
  };

  const filtered = useMemo(() => {
    return questions
      .filter((q) => {
        if (typeFilter === "all") return true;
        if (typeFilter === "following") return followingIds.includes(q.author_id);
        return q.post_type === typeFilter;
      })
      .filter((q) => !activeTag || q.tags.includes(activeTag))
      .filter((q) => {
        if (!searchFromUrl) return true;
        const search = searchFromUrl.toLowerCase();
        return (
          q.title.toLowerCase().includes(search) ||
          q.body.toLowerCase().includes(search) ||
          q.tags.some((t) => t.toLowerCase().includes(search)) ||
          q.author_username.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => {
        if (sortBy === "votes") return b.votes - a.votes;
        if (sortBy === "trending") return b.views - a.views;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [questions, activeTag, searchFromUrl, sortBy, typeFilter, followingIds]);

  useEffect(() => {
    setPage(1);
  }, [questions, activeTag, searchFromUrl, sortBy, typeFilter]);

  const popularTags = tags.slice(0, 12);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Layout>
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">

          <WelcomeBanner />
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold font-mono text-foreground">
                {searchFromUrl ? (
                  <>Résultats pour "<span className="text-primary">{searchFromUrl}</span>"</>
                ) : activeTag ? (
                  <><span className="text-primary">#</span>{activeTag}</>
                ) : typeFilter === "news" ? (
                  "Actualités"
                ) : typeFilter === "discussion" ? (
                  "Discussions"
                ) : typeFilter === "question" ? (
                  "Questions"
                ) : (
                  "Publications"
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {filtered.length} {typeFilter === "news" ? "actualité" : typeFilter === "discussion" ? "discussion" : "publication"}{filtered.length > 1 ? "s" : ""}
              </p>

              <div className="mt-3 flex items-center gap-1 rounded-lg bg-muted p-1 w-fit">
                {([
                  { key: "all" as TypeFilter, icon: LayoutGrid, label: "Tout", show: true },
                  { key: "question" as TypeFilter, icon: MessageSquare, label: "Questions", show: true },
                  { key: "discussion" as TypeFilter, icon: MessagesSquare, label: "Discussions", show: true },
                  { key: "news" as TypeFilter, icon: Newspaper, label: "News", show: true },
                  { key: "following" as TypeFilter, icon: UserCheck, label: "Suivis", show: !!user },
                ]).filter((b) => b.show).map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => updateType(key)}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      typeFilter === key
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-muted p-1 self-start">
              {([
                { key: "recent" as SortBy, icon: Clock, label: "Récent" },
                { key: "votes" as SortBy, icon: Flame, label: "Top" },
                { key: "trending" as SortBy, icon: TrendingUp, label: "Trending" },
              ]).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    sortBy === key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {paginated.map((q) => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="mt-12 text-center py-12 rounded-lg border border-dashed border-border">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Aucune question trouvée.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Soyez le premier à poser une question !
              </p>
            </div>
          )}

          {!isLoading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                disabled={page === 1}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Précédent
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => { setPage(p as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          page === p
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>
              <button
                onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                disabled={page === totalPages}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant →
              </button>
            </div>
          )}
        </div>

        <RightSidebar />
      </div>
    </Layout>
  );
};

export default Index;
