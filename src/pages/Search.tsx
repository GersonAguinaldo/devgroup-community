import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import Seo from "@/components/Seo";
import QuestionCard from "@/components/QuestionCard";
import { supabase } from "@/integrations/supabase/client";
import { useTags } from "@/hooks/useData";
import type { QuestionRow } from "@/hooks/useData";
import { Search as SearchIcon, Loader2, X } from "lucide-react";

type SortKey = "relevance" | "recent" | "votes";
type TypeKey = "" | "question" | "news" | "discussion";
type ResolvedKey = "" | "true" | "false";
type PeriodKey = "" | "24h" | "7d" | "30d";

const PAGE = 30;

const periodToDate = (p: PeriodKey) => {
  if (!p) return null;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (p === "24h") return new Date(now - day).toISOString();
  if (p === "7d") return new Date(now - 7 * day).toISOString();
  if (p === "30d") return new Date(now - 30 * day).toISOString();
  return null;
};

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const { data: tags = [] } = useTags();

  const [q, setQ] = useState(params.get("q") || "");
  const [type, setType] = useState<TypeKey>((params.get("type") as TypeKey) || "");
  const [resolved, setResolved] = useState<ResolvedKey>(
    (params.get("resolved") as ResolvedKey) || "",
  );
  const [tag, setTag] = useState(params.get("tag") || "");
  const [period, setPeriod] = useState<PeriodKey>((params.get("period") as PeriodKey) || "");
  const [sort, setSort] = useState<SortKey>((params.get("sort") as SortKey) || "relevance");
  const [page, setPage] = useState(0);

  const [rows, setRows] = useState<QuestionWithMeta[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync URL
  useEffect(() => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (type) next.set("type", type);
    if (resolved) next.set("resolved", resolved);
    if (tag) next.set("tag", tag);
    if (period) next.set("period", period);
    if (sort) next.set("sort", sort);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, resolved, tag, period, sort]);

  useEffect(() => {
    let cancel = false;
    const run = async () => {
      setLoading(true);
      const { data, error } = await (supabase as any).rpc("search_questions", {
        _q: q || null,
        _type: type || null,
        _resolved: resolved === "" ? null : resolved === "true",
        _tag: tag || null,
        _author: null,
        _since: periodToDate(period),
        _sort: sort,
        _limit: PAGE,
        _offset: page * PAGE,
      });
      if (cancel) return;
      if (error) {
        setRows([]);
      } else {
        setRows((data || []) as QuestionWithMeta[]);
      }
      setLoading(false);
    };
    const t = window.setTimeout(run, 250);
    return () => {
      cancel = true;
      window.clearTimeout(t);
    };
  }, [q, type, resolved, tag, period, sort, page]);

  const reset = () => {
    setQ(""); setType(""); setResolved(""); setTag(""); setPeriod(""); setSort("relevance"); setPage(0);
  };

  const activeCount = useMemo(
    () => [type, resolved, tag, period].filter(Boolean).length,
    [type, resolved, tag, period],
  );

  return (
    <>
      <Seo
        title={q ? `Recherche : ${q}` : "Recherche"}
        description="Recherchez parmi les questions, discussions et actualités de la communauté."
        path="/search"
      />
      <Layout>
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-2xl font-bold font-mono text-foreground mb-4 flex items-center gap-2">
            <SearchIcon className="h-5 w-5 text-primary" />
            Recherche
          </h1>

          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(0); }}
              placeholder="Mots-clés, titre, contenu…"
              className="h-11 w-full rounded-md border border-border bg-muted pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="mb-5 rounded-lg border border-border bg-card p-3 flex flex-wrap gap-2 items-center">
            <select value={type} onChange={(e) => { setType(e.target.value as TypeKey); setPage(0); }}
              className="rounded-md border border-border bg-muted px-2 py-1.5 text-xs">
              <option value="">Tous les types</option>
              <option value="question">Questions</option>
              <option value="discussion">Discussions</option>
              <option value="news">Actualités</option>
            </select>

            <select value={resolved} onChange={(e) => { setResolved(e.target.value as ResolvedKey); setPage(0); }}
              className="rounded-md border border-border bg-muted px-2 py-1.5 text-xs">
              <option value="">Résolu / non résolu</option>
              <option value="true">Résolues</option>
              <option value="false">Non résolues</option>
            </select>

            <select value={tag} onChange={(e) => { setTag(e.target.value); setPage(0); }}
              className="rounded-md border border-border bg-muted px-2 py-1.5 text-xs max-w-[160px]">
              <option value="">Tous les tags</option>
              {tags.slice(0, 200).map((t) => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>

            <select value={period} onChange={(e) => { setPeriod(e.target.value as PeriodKey); setPage(0); }}
              className="rounded-md border border-border bg-muted px-2 py-1.5 text-xs">
              <option value="">Toute période</option>
              <option value="24h">24 heures</option>
              <option value="7d">7 jours</option>
              <option value="30d">30 jours</option>
            </select>

            <div className="ml-auto flex items-center gap-1 rounded-lg bg-muted p-1">
              {(["relevance", "recent", "votes"] as SortKey[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { setSort(s); setPage(0); }}
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    sort === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "relevance" ? "Pertinence" : s === "recent" ? "Récent" : "Votes"}
                </button>
              ))}
            </div>

            {(activeCount > 0 || q) && (
              <button onClick={reset} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                <X className="h-3 w-3" />
                Réinitialiser
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">Aucun résultat.</p>
              <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-block">
                Retour à l'accueil
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-2">{rows.length} résultat(s){rows.length === PAGE ? " (paginés)" : ""}</p>
              <div className="flex flex-col gap-2">
                {rows.map((r) => (
                  <QuestionCard key={r.id} question={r} />
                ))}
              </div>
              {(page > 0 || rows.length === PAGE) && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => { setPage((p) => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary disabled:opacity-40"
                  >
                    ← Précédent
                  </button>
                  <span className="text-sm text-muted-foreground font-mono">Page {page + 1}</span>
                  <button
                    disabled={rows.length < PAGE}
                    onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary disabled:opacity-40"
                  >
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </>
  );
}
