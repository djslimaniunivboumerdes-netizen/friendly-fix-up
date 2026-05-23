import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Newspaper, TrendingUp, BarChart3, RefreshCw, Globe,
  AlertTriangle, Clock, Wifi, WifiOff, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/contexts/I18nContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/* ─── Types ─── */
interface PriceItem {
  label: string; value: string; unit: string;
  trend: "up" | "down" | "flat"; change?: string; note?: string;
}
interface StatItem {
  label: string; value: string; unit: string; trend?: "up" | "down" | "flat";
}
interface NewsItem {
  title: string; title_fr: string;
  summary: string; summary_fr: string;
  date: string; source: string; url: string; category: string;
}
interface NewsData {
  lng_prices: PriceItem[]; sonatrach_prices: PriceItem[];
  lng_stats: StatItem[]; sonatrach_stats: StatItem[];
  lng_news: NewsItem[]; sonatrach_news: NewsItem[];
  fetched_at: string;
  _cache_hit?: boolean; _cache_age_h?: number;
}

/* ─── Constants ─── */
const CACHE_TTL_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
const EMPTY_DATA: NewsData = {
  lng_prices: [], sonatrach_prices: [],
  lng_stats: [], sonatrach_stats: [],
  lng_news: [], sonatrach_news: [],
  fetched_at: new Date().toISOString(),
};

/* ─── Helpers ─── */
function formatAge(ms: number): string {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just refreshed";
}

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function normalizeData(raw: unknown): NewsData {
  const d = (raw ?? {}) as Partial<NewsData>;
  return {
    lng_prices:        safeArray<PriceItem>(d.lng_prices),
    sonatrach_prices:  safeArray<PriceItem>(d.sonatrach_prices),
    lng_stats:         safeArray<StatItem>(d.lng_stats),
    sonatrach_stats:   safeArray<StatItem>(d.sonatrach_stats),
    lng_news:          safeArray<NewsItem>(d.lng_news),
    sonatrach_news:    safeArray<NewsItem>(d.sonatrach_news),
    fetched_at:        d.fetched_at ?? new Date().toISOString(),
    _cache_hit:        d._cache_hit,
    _cache_age_h:      d._cache_age_h,
  };
}

async function loadFromCache(): Promise<{ data: NewsData; ageMs: number } | null> {
  try {
    const { data: row, error } = await supabase
      .from("news_cache")
      .select("data, fetched_at")
      .eq("id", "singleton")
      .maybeSingle();
    if (error || !row?.data || !row.fetched_at) return null;
    const ageMs = Date.now() - new Date(row.fetched_at).getTime();
    return { data: normalizeData(row.data), ageMs };
  } catch {
    return null;
  }
}

async function fetchFresh(
  signal: AbortSignal,
  force = false,
): Promise<{ data: NewsData; fromCache: boolean; ageMs: number }> {
  // 1 — Try shared Supabase cache first (unless forced)
  if (!force) {
    const cached = await loadFromCache();
    if (cached && cached.ageMs < CACHE_TTL_MS) {
      return { data: cached.data, fromCache: true, ageMs: cached.ageMs };
    }
  }

  // 2 — Call edge function
  try {
    const { data, error } = await supabase.functions.invoke("news-feed", {
      body: {},
      ...(force ? { headers: { "x-force": "1" } } : {}),
    });
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    if (error) throw new Error(error.message ?? "Edge function error");
    if (!data) throw new Error("Empty response from edge function");
    if ((data as { error?: string }).error) throw new Error((data as { error: string }).error);
    return { data: normalizeData(data), fromCache: false, ageMs: 0 };
  } catch (e) {
    if (signal.aborted) throw e; // re-throw AbortError
    // 3 — Final fallback: stale cache is better than nothing
    const stale = await loadFromCache();
    if (stale) {
      toast({ title: "Using cached data", description: "Edge function unavailable; showing last known data.", variant: "default" });
      return { data: stale.data, fromCache: true, ageMs: stale.ageMs };
    }
    // 4 — Nothing at all
    toast({ title: "News unavailable", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    return { data: EMPTY_DATA, fromCache: false, ageMs: 0 };
  }
}

/* ─── Sub-components ─── */
function TrendBadge({ trend }: { trend?: "up" | "down" | "flat" }) {
  if (!trend) return null;
  const cls = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-muted-foreground";
  return <span className={`text-xs font-mono ${cls}`}>{trend === "up" ? "▲" : trend === "down" ? "▼" : "—"}</span>;
}

function StatGrid({ items }: { items: StatItem[] }) {
  if (items.length === 0) return (
    <p className="text-sm text-muted-foreground flex items-center gap-2">
      <AlertTriangle className="h-4 w-4" /> No data available
    </p>
  );
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((s) => (
        <div key={s.label} className="border border-border rounded p-3 bg-secondary/30">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{s.label}</div>
          <div className="text-xl font-display font-bold mt-1 flex items-baseline gap-1">
            {s.value}
            {s.unit && <span className="text-sm font-normal text-muted-foreground">{s.unit}</span>}
          </div>
          <TrendBadge trend={s.trend} />
        </div>
      ))}
    </div>
  );
}

function PriceGrid({ items }: { items: PriceItem[] }) {
  if (items.length === 0) return (
    <p className="text-sm text-muted-foreground flex items-center gap-2">
      <AlertTriangle className="h-4 w-4" /> No price data available
    </p>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((p) => (
        <div key={p.label} className="border border-border rounded p-4 bg-secondary/30">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{p.label}</span>
            {p.note && <Badge variant="outline" className="text-[10px] font-mono">{p.note}</Badge>}
          </div>
          <div className="text-2xl font-display font-bold mt-2 flex items-baseline gap-1">
            {p.value}
            {p.unit && <span className="text-sm font-normal text-muted-foreground">{p.unit}</span>}
          </div>
          {p.change && (
            <div className={`text-xs font-mono mt-1 flex items-center gap-1 ${p.trend === "up" ? "text-emerald-400" : p.trend === "down" ? "text-rose-400" : "text-muted-foreground"}`}>
              <TrendBadge trend={p.trend} /> {p.change}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function NewsList({ items, lang, limit }: { items: NewsItem[]; lang: string; limit?: number }) {
  const shown = limit ? items.slice(0, limit) : items;
  if (shown.length === 0) return (
    <p className="text-sm text-muted-foreground py-4">{lang === "en" ? "No news found." : "Aucune actualité trouvée."}</p>
  );
  return (
    <div className="divide-y divide-border">
      {shown.map((n) => (
        <a
          key={n.url + n.title}
          href={n.url || "#"}
          target="_blank" rel="noopener noreferrer"
          className="block py-3.5 hover:bg-accent/5 transition-colors px-1 rounded"
        >
          <div className="font-medium text-sm leading-snug line-clamp-2">
            {lang === "en" ? n.title : (n.title_fr || n.title)}
          </div>
          {(n.summary || n.summary_fr) && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {lang === "en" ? n.summary : (n.summary_fr || n.summary)}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="outline" className="text-[10px] font-mono">{n.source}</Badge>
            <span className="text-[10px] text-muted-foreground font-mono">{n.date}</span>
            {n.category && <Badge variant="secondary" className="text-[10px]">{n.category}</Badge>}
          </div>
        </a>
      ))}
    </div>
  );
}

/* ─── Page ─── */
export default function News() {
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  const [q, setQ] = useState("");
  const [data, setData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [ageMs, setAgeMs] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const result = await fetchFresh(ctrl.signal, force);
      if (!ctrl.signal.aborted) {
        setData(result.data);
        setFromCache(result.fromCache);
        setAgeMs(result.ageMs);
      }
    } catch (e) {
      if (!ctrl.signal.aborted) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg !== "Aborted") setError(msg);
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    return () => abortRef.current?.abort();
  }, [load]);

  // Auto-refresh after 5 days
  useEffect(() => {
    if (!data || ageMs < CACHE_TTL_MS) return;
    const id = setTimeout(() => load(true), 2000);
    return () => clearTimeout(id);
  }, [data, ageMs, load]);

  const filter = (items: NewsItem[]) =>
    q.trim()
      ? items.filter(
          (n) =>
            [n.title, n.title_fr, n.summary, n.summary_fr]
              .join(" ")
              .toLowerCase()
              .includes(q.toLowerCase()),
        )
      : items;

  const lngNews = filter(data?.lng_news ?? []);
  const sonNews = filter(data?.sonatrach_news ?? []);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-[10px] uppercase tracking-widest text-accent font-mono mb-1">/ {t("news")}</div>
      <div className="flex items-center gap-3 mb-2">
        <Newspaper className="h-7 w-7 text-accent" />
        <h1 className="text-3xl md:text-4xl font-display font-bold">{t("news")}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        {lang === "en"
          ? "LNG market intelligence, Sonatrach updates, and price trends. Shared cache refreshes every 5 days."
          : "Intelligence marché GNL, actualités Sonatrach et tendances de prix. Cache partagé rafraîchi tous les 5 jours."}
      </p>

      {/* Search + controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-5 items-start">
        <div className="relative flex-1">
          <Newspaper className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={lang === "en" ? "Search news…" : "Rechercher des actualités…"}
            className="pl-9 h-11" />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Button variant="outline" size="sm" onClick={() => load(true)} disabled={loading} className="gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {lang === "en" ? "Refresh" : "Actualiser"}
          </Button>
          {data && !loading && (
            <Badge variant="outline" className={`font-mono text-[10px] gap-1.5 ${fromCache ? "border-green-500/40 text-green-400" : "border-accent/40 text-accent"}`}>
              {fromCache ? <CheckCircle2 className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
              {fromCache ? formatAge(ageMs) : (lang === "en" ? "Live" : "Direct")}
            </Badge>
          )}
          {loading && (
            <Badge variant="outline" className="font-mono text-[10px] gap-1.5 animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin" />
              {lang === "en" ? "Fetching…" : "Chargement…"}
            </Badge>
          )}
        </div>
      </div>

      {/* Cache info banner */}
      {fromCache && data && (
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-4 bg-secondary/40 rounded-lg px-4 py-2 border border-border">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
          {lang === "en"
            ? `Showing shared cache (${formatAge(ageMs)}). Any user can refresh — data updates for everyone.`
            : `Données partagées en cache (${formatAge(ageMs)}). Tout utilisateur peut rafraîchir pour tous.`}
        </div>
      )}

      {/* Error state */}
      {error && !data && (
        <div className="border border-rose-500/30 bg-rose-500/10 rounded-lg p-5 text-sm text-rose-300 flex items-start gap-3 mb-4">
          <WifiOff className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">{lang === "en" ? "Could not load news" : "Impossible de charger les actualités"}</div>
            <div className="text-rose-400/80 font-mono text-xs">{error}</div>
            <Button size="sm" variant="outline" className="mt-3 border-rose-400/40 text-rose-300" onClick={() => load(true)}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {lang === "en" ? "Retry" : "Réessayer"}
            </Button>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && !data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-64" />
        </div>
      )}

      {/* Main content */}
      {data && (
        <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-secondary/60 p-1">
            <TabsTrigger value="overview">{lang === "en" ? "Overview" : "Vue d'ensemble"}</TabsTrigger>
            <TabsTrigger value="lng">{lang === "en" ? "LNG Market" : "Marché GNL"}</TabsTrigger>
            <TabsTrigger value="sonatrach">Sonatrach</TabsTrigger>
            <TabsTrigger value="prices">{lang === "en" ? "Prices" : "Prix"}</TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  <h2 className="font-display font-semibold text-sm uppercase tracking-wider">
                    {lang === "en" ? "LNG Market Stats" : "Stats Marché GNL"}
                  </h2>
                </div>
                <StatGrid items={data.lng_stats} />
              </div>
              <div className="border border-border rounded-lg bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="h-4 w-4 text-accent" />
                  <h2 className="font-display font-semibold text-sm uppercase tracking-wider">
                    {lang === "en" ? "Sonatrach Highlights" : "Faits marquants Sonatrach"}
                  </h2>
                </div>
                <StatGrid items={data.sonatrach_stats} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg bg-card p-5">
                <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-3">
                  {lang === "en" ? "Latest LNG News" : "Dernières actus GNL"}
                </h3>
                <NewsList items={lngNews} lang={lang} limit={5} />
              </div>
              <div className="border border-border rounded-lg bg-card p-5">
                <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-3">
                  {lang === "en" ? "Latest Sonatrach News" : "Dernières actus Sonatrach"}
                </h3>
                <NewsList items={sonNews} lang={lang} limit={5} />
              </div>
            </div>
          </TabsContent>

          {/* ── LNG Market ── */}
          <TabsContent value="lng" className="space-y-6">
            <div className="border border-border rounded-lg bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-accent" />
                <h2 className="font-display font-semibold text-sm uppercase tracking-wider">
                  {lang === "en" ? "LNG Prices" : "Prix GNL"}
                </h2>
              </div>
              <PriceGrid items={data.lng_prices} />
            </div>
            <div className="border border-border rounded-lg bg-card p-5">
              <h2 className="font-display font-semibold text-sm uppercase tracking-wider mb-4">
                {lang === "en" ? "LNG News" : "Actualités GNL"}
              </h2>
              <NewsList items={lngNews} lang={lang} />
            </div>
          </TabsContent>

          {/* ── Sonatrach ── */}
          <TabsContent value="sonatrach" className="space-y-6">
            <div className="border border-border rounded-lg bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-accent" />
                <h2 className="font-display font-semibold text-sm uppercase tracking-wider">
                  {lang === "en" ? "Sonatrach Prices" : "Prix Sonatrach"}
                </h2>
              </div>
              <PriceGrid items={data.sonatrach_prices} />
            </div>
            <div className="border border-border rounded-lg bg-card p-5">
              <h2 className="font-display font-semibold text-sm uppercase tracking-wider mb-4">Sonatrach News</h2>
              <NewsList items={sonNews} lang={lang} />
            </div>
          </TabsContent>

          {/* ── Prices ── */}
          <TabsContent value="prices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <h2 className="font-display font-semibold text-sm uppercase tracking-wider">
                    {lang === "en" ? "LNG Prices" : "Prix GNL"}
                  </h2>
                </div>
                {data.lng_prices.length === 0 ? (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {lang === "en" ? "No price data available" : "Aucune donnée de prix"}
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {data.lng_prices.map((p) => (
                      <div key={p.label} className="flex items-center justify-between py-3">
                        <div>
                          <div className="font-medium text-sm">{p.label}</div>
                          {p.note && <div className="text-xs text-muted-foreground">{p.note}</div>}
                        </div>
                        <div className="text-right">
                          <div className="font-display font-bold">{p.value} {p.unit}</div>
                          {p.change && (
                            <div className={`text-xs font-mono flex items-center justify-end gap-1 ${p.trend === "up" ? "text-emerald-400" : p.trend === "down" ? "text-rose-400" : "text-muted-foreground"}`}>
                              <TrendBadge trend={p.trend} /> {p.change}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border border-border rounded-lg bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <h2 className="font-display font-semibold text-sm uppercase tracking-wider">
                    {lang === "en" ? "Sonatrach Prices" : "Prix Sonatrach"}
                  </h2>
                </div>
                {data.sonatrach_prices.length === 0 ? (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {lang === "en" ? "No price data available" : "Aucune donnée de prix"}
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {data.sonatrach_prices.map((p) => (
                      <div key={p.label} className="flex items-center justify-between py-3">
                        <div>
                          <div className="font-medium text-sm">{p.label}</div>
                          {p.note && <div className="text-xs text-muted-foreground">{p.note}</div>}
                        </div>
                        <div className="text-right">
                          <div className="font-display font-bold">{p.value} {p.unit}</div>
                          {p.change && (
                            <div className={`text-xs font-mono flex items-center justify-end gap-1 ${p.trend === "up" ? "text-emerald-400" : p.trend === "down" ? "text-rose-400" : "text-muted-foreground"}`}>
                              <TrendBadge trend={p.trend} /> {p.change}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
