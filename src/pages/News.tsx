import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Newspaper, TrendingUp, BarChart3, RefreshCw, Globe, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/contexts/I18nContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/* ─── Types matching edge function output ─── */
interface PriceItem {
  label: string;
  value: string;
  unit: string;
  trend: "up" | "down" | "flat";
  change?: string;
  note?: string;
}

interface StatItem {
  label: string;
  value: string;
  unit: string;
  trend?: "up" | "down" | "flat";
}

interface NewsItem {
  title: string;
  title_fr: string;
  summary: string;
  summary_fr: string;
  date: string;
  source: string;
  url: string;
  category: string;
}

interface NewsData {
  lng_prices: PriceItem[];
  sonatrach_prices: PriceItem[];
  lng_stats: StatItem[];
  sonatrach_stats: StatItem[];
  lng_news: NewsItem[];
  sonatrach_news: NewsItem[];
  fetched_at: string;
  _cache_hit?: boolean;
  _cache_age_h?: number;
}

/* ─── Constants ─── */
const CACHE_TTL_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

/* ─── Helpers ─── */
function formatAge(ms: number): string {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

async function loadFromCache(): Promise<{ data: NewsData; ageMs: number } | null> {
  try {
    const { data: row } = await supabase
      .from("news_cache")
      .select("data, fetched_at")
      .eq("id", "singleton")
      .maybeSingle();
    if (!row || !row.data || !row.fetched_at) return null;
    const ageMs = Date.now() - new Date(row.fetched_at).getTime();
    return { data: row.data as NewsData, ageMs };
  } catch {
    return null;
  }
}

/* Safe fetch that never crashes the page */
async function safeFetchWithSearch(
  signal: AbortSignal,
  force = false
): Promise<{ data: NewsData; fromCache: boolean; ageMs: number }> {
  // 1. Try cache first
  if (!force) {
    try {
      const cached = await loadFromCache();
      if (cached && cached.ageMs < CACHE_TTL_MS) {
        return { data: cached.data, fromCache: true, ageMs: cached.ageMs };
      }
    } catch (e) {
      console.warn("Cache read failed:", e);
    }
  }

  // 2. Try edge function
  try {
    const { data, error } = await supabase.functions.invoke("news-feed", {
      body: {},
      ...(force ? { headers: { "x-force": "1" } } : {}),
    });
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    if (error) throw new Error(error.message || "Edge function failed");
    if (!data || data.error) throw new Error(data?.error || "Empty response");

    const parsed = data as NewsData;
    // Ensure arrays exist so downstream UI never crashes
    for (const k of [
      "lng_news",
      "sonatrach_news",
      "lng_prices",
      "sonatrach_prices",
      "lng_stats",
      "sonatrach_stats",
    ] as const) {
      if (!Array.isArray(parsed[k])) (parsed as any)[k] = [];
    }
    return { data: parsed, fromCache: false, ageMs: 0 };
  } catch (e) {
    // 3. Final fallback: return empty data so UI doesn't crash
    console.error("News fetch failed:", e);
    toast({
      title: "News load failed",
      description: e instanceof Error ? e.message : "Unknown error",
      variant: "destructive",
    });
    return {
      data: {
        lng_prices: [],
        sonatrach_prices: [],
        lng_stats: [],
        sonatrach_stats: [],
        lng_news: [],
        sonatrach_news: [],
        fetched_at: new Date().toISOString(),
      },
      fromCache: false,
      ageMs: 0,
    };
  }
}

/* ─── Page ─── */
export default function News() {
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  const [q, setQ] = useState("");
  const [data, setData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [ageMs, setAgeMs] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const fetchWithSearch = useCallback(
    async (force = false) => {
      setLoading(true);
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const result = await safeFetchWithSearch(ctrl.signal, force);
      if (!ctrl.signal.aborted) {
        setData(result.data);
        setFromCache(result.fromCache);
        setAgeMs(result.ageMs);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    fetchWithSearch(false);
    return () => abortRef.current?.abort();
  }, [fetchWithSearch]);

  // Auto-refresh after 5 days
  useEffect(() => {
    if (!data || ageMs < CACHE_TTL_MS) return;
    const id = setTimeout(() => fetchWithSearch(true), 1000);
    return () => clearTimeout(id);
  }, [data, ageMs, fetchWithSearch]);

  const filteredLng = (data?.lng_news ?? []).filter(
    (n) =>
      n.title.toLowerCase().includes(q.toLowerCase()) ||
      n.summary.toLowerCase().includes(q.toLowerCase()) ||
      n.title_fr.toLowerCase().includes(q.toLowerCase())
  );
  const filteredSonatrach = (data?.sonatrach_news ?? []).filter(
    (n) =>
      n.title.toLowerCase().includes(q.toLowerCase()) ||
      n.summary.toLowerCase().includes(q.toLowerCase()) ||
      n.title_fr.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
      <div className="text-[10px] uppercase tracking-widest text-accent font-mono mb-1">/ {t("news")}</div>
      <div className="flex items-center gap-3 mb-2">
        <Newspaper className="h-7 w-7 text-accent" />
        <h1 className="text-3xl md:text-4xl font-display font-bold">{t("news")}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        {lang === "en"
          ? "Live LNG market intelligence, Sonatrach updates, and price trends."
          : "Intelligence marché GNL en direct, actualités Sonatrach et tendances de prix."}
      </p>

      <div className="flex flex-col md:flex-row gap-3 mb-5 items-start">
        <div className="relative flex-1">
          <Newspaper className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={lang === "en" ? "Search news…" : "Rechercher des actualités…"}
            className="pl-9 h-11"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchWithSearch(true)}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {lang === "en" ? "Refresh" : "Actualiser"}
          </Button>
          {data && (
            <Badge variant="outline" className="font-mono text-[10px] gap-1">
              <Clock className="h-3 w-3" />
              {fromCache ? `${formatAge(ageMs)} old` : "Just now"}
            </Badge>
          )}
        </div>
      </div>

      {!data || loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        <Tabs
          value={tab}
          onValueChange={(v) => setSearchParams({ tab: v })}
          className="space-y-6"
        >
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">{lang === "en" ? "Overview" : "Vue d'ensemble"}</TabsTrigger>
            <TabsTrigger value="lng">{lang === "en" ? "LNG Market" : "Marché GNL"}</TabsTrigger>
            <TabsTrigger value="sonatrach">Sonatrach</TabsTrigger>
            <TabsTrigger value="prices">{lang === "en" ? "Prices" : "Prix"}</TabsTrigger>
          </TabsList>

          {/* ─── Overview ─── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LNG Stats */}
              <div className="border border-border rounded-lg bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  <h2 className="font-display font-semibold text-sm uppercase tracking-wider">
                    {lang === "en" ? "LNG Market Stats" : "Stats Marché GNL"}
                  </h2>
                </div>
                {data.lng_stats.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    {lang === "en" ? "No data available" : "Aucune donnée disponible"}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {data.lng_stats.map((s) => (
                      <div key={s.label} className="border border-border rounded p-3">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{s.label}</div>
                        <div className="text-xl font-display font-bold mt-1">{s.value} <span className="text-sm font-normal text-muted-foreground">{s.unit}</span></div>
                        {s.trend && (
                          <div className={`text-xs font-mono mt-0.5 ${s.trend === "up" ? "text-emerald-500" : s.trend === "down" ? "text-rose-500" : "text-muted-foreground"}`}>
                            {s.trend === "up" ? "▲" : s.trend === "down" ? "▼" : "—"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sonatrach Stats */}
              <div className="border border-border rounded-lg bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4 text-accent" />
                  <h2 className="font-display font-semibold text-sm uppercase tracking-wider">
                    {lang === "en" ? "Sonatrach Highlights" : "Faits marquants Sonatrach"}
                  </h2>
                </div>
                {data.sonatrach_stats.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    {lang === "en" ? "No data available" : "Aucune donnée disponible"}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {data.sonatrach_stats.map((s) => (
                      <div key={s.label} className="border border-border rounded p-3">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{s.label}</div>
                        <div className="text-xl font-display font-bold mt-1">{s.value} <span className="text-sm font-normal text-muted-foreground">{s.unit}</span></div>
                        {s.trend && (
                          <div className={`text-xs font-mono mt-0.5 ${s.trend === "up" ? "text-emerald-500" : s.trend === "down" ? "text-rose-500" : "text-muted-foreground"}`}>
                            {s.trend === "up" ? "▲" : s.trend === "down" ? "▼" : "—"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Latest headlines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg bg-card p-5">
                <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-3">
                  {lang === "en" ? "Latest LNG News" : "Dernières actus GNL"}
                </h3>
                {filteredLng.slice(0, 5).map((n) => (
                  <a
                    key={n.url + n.title}
                    href={n.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border-b border-border last:border-0 py-3 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium line-clamp-2">{lang === "en" ? n.title : n.title_fr || n.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] font-mono">{n.source}</Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">{n.date}</span>
                          <Badge variant="secondary" className="text-[10px]">{n.category}</Badge>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
                {filteredLng.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4">{lang === "en" ? "No news found." : "Aucune actualité trouvée."}</p>
                )}
              </div>

              <div className="border border-border rounded-lg bg-card p-5">
                <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-3">
                  {lang === "en" ? "Latest Sonatrach News" : "Dernières actus Sonatrach"}
                </h3>
                {filteredSonatrach.slice(0, 5).map((n) => (
                  <a
                    key={n.url + n.title}
                    href={n.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border-b border-border last:border-0 py-3 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium line-clamp-2">{lang === "en" ? n.title : n.title_fr || n.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] font-mono">{n.source}</Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">{n.date}</span>
                          <Badge variant="secondary" className="text-[10px]">{n.category}</Badge>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
                {filteredSonatrach.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4">{lang === "en" ? "No news found." : "Aucune actualité trouvée."}</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ─── LNG Market ─── */}
          <TabsContent value="lng" className="space-y-6">
            {/* LNG Prices */}
            <div className="border border-border rounded-lg bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-accent" />
                <h2 className="font-display font-semibold text-sm uppercase tracking-wider">
                  {lang === "en" ? "LNG Prices" : "Prix GNL"}
                </h2>
              </div>
              {data.lng_prices.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  {lang === "en" ? "No price data available" : "Aucune donnée de prix disponible"}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.lng_prices.map((p) => (
                    <div key={p.label} className="border border-border rounded p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{p.label}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{p.note}</Badge>
                      </div>
                      <div className="text-2xl font-display font-bold mt-2">{p.value} <span className="text-sm font-normal text-muted-foreground">{p.unit}</span></div>
                      {p.change && (
                        <div className={`text-xs font-mono mt-1 ${p.trend === "up" ? "text-emerald-500" : p.trend === "down" ? "text-rose-500" : "text-muted-foreground"}`}>
                          {p.trend === "up" ? "▲" : p.trend === "down" ? "▼" : "—"} {p.change}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LNG News */}
            <div className="border border-border rounded-lg bg-card p-5">
              <h2 className="font-display font-semibold text-sm uppercase tracking-wider mb-3">
                {lang === "en" ? "LNG News" : "Actualités GNL"}
              </h2>
              {filteredLng.map((n) => (
                <a
                  key={n.url + n.title}
                  href={n.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border-b border-border last:border-0 py-4 hover:bg-accent/5 transition-colors"
                >
                  <div>
                    <div className="font-medium">{lang === "en" ? n.title : n.title_fr || n.title}</div>
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{lang === "en" ? n.summary : n.summary_fr || n.summary}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px] font-mono">{n.source}</Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">{n.date}</span>
                      <Badge variant="secondary" className="text-[10px]">{n.category}</Badge>
                    </div>
                  </div>
                </a>
              ))}
              {filteredLng.length === 0 && (
                <p className="text-sm text-muted-foreground py-4">{lang === "en" ? "No news found." : "Aucune actualité trouvée."}</p>
              )}
            </div>
          </TabsContent>

          {/* ─── Sonatrach ─── */}
          <TabsContent value="sonatrach" className="space-y-6">
            {/* Sonatrach Prices */}
            <div className="border border-border rounded-lg bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-accent" />
                <h2 className="font-display font-semibold text-sm uppercase tracking-wider">
                  {lang === "en" ? "Sonatrach Prices" : "Prix Sonatrach"}
                </h2>
              </div>
              {data.sonatrach_prices.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  {lang === "en" ? "No price data available" : "Aucune donnée de prix disponible"}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.sonatrach_prices.map((p) => (
                    <div key={p.label} className="border border-border rounded p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{p.label}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{p.note}</Badge>
                      </div>
                      <div className="text-2xl font-display font-bold mt-2">{p.value} <span className="text-sm font-normal text-muted-foreground">{p.unit}</span></div>
                      {p.change && (
                        <div className={`text-xs font-mono mt-1 ${p.trend === "up" ? "text-emerald-500" : p.trend === "down" ? "text-rose-500" : "text-muted-foreground"}`}>
                          {p.trend === "up" ? "▲" : p.trend === "down" ? "▼" : "—"} {p.change}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sonatrach News */}
            <div className="border border-border rounded-lg bg-card p-5">
              <h2 className="font-display font-semibold text-sm uppercase tracking-wider mb-3">Sonatrach News</h2>
              {filteredSonatrach.map((n) => (
                <a
                  key={n.url + n.title}
                  href={n.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border-b border-border last:border-0 py-4 hover:bg-accent/5 transition-colors"
                >
                  <div>
                    <div className="font-medium">{lang === "en" ? n.title : n.title_fr || n.title}</div>
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{lang === "en" ? n.summary : n.summary_fr || n.summary}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px] font-mono">{n.source}</Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">{n.date}</span>
                      <Badge variant="secondary" className="text-[10px]">{n.category}</Badge>
                    </div>
                  </div>
                </a>
              ))}
              {filteredSonatrach.length === 0 && (
                <p className="text-sm text-muted-foreground py-4">{lang === "en" ? "No news found." : "Aucune actualité trouvée."}</p>
              )}
            </div>
          </TabsContent>

          {/* ─── Prices ─── */}
          <TabsContent value="prices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <h2 className="font-display font-semibold text-sm uppercase tracking-wider">
                    {lang === "en" ? "LNG Prices" : "Prix GNL"}
                  </h2>
                </div>
                {data.lng_prices.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    {lang === "en" ? "No price data available" : "Aucune donnée de prix disponible"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.lng_prices.map((p) => (
                      <div key={p.label} className="flex items-center justify-between border-b border-border last:border-0 py-3">
                        <div>
                          <div className="font-medium text-sm">{p.label}</div>
                          <div className="text-xs text-muted-foreground">{p.note}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-display font-bold">{p.value} {p.unit}</div>
                          {p.change && (
                            <div className={`text-xs font-mono ${p.trend === "up" ? "text-emerald-500" : p.trend === "down" ? "text-rose-500" : "text-muted-foreground"}`}>
                              {p.trend === "up" ? "▲" : p.trend === "down" ? "▼" : "—"} {p.change}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-border rounded-lg bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <h2 className="font-display font-semibold text-sm uppercase tracking-wider">
                    {lang === "en" ? "Sonatrach Prices" : "Prix Sonatrach"}
                  </h2>
                </div>
                {data.sonatrach_prices.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    {lang === "en" ? "No price data available" : "Aucune donnée de prix disponible"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.sonatrach_prices.map((p) => (
                      <div key={p.label} className="flex items-center justify-between border-b border-border last:border-0 py-3">
                        <div>
                          <div className="font-medium text-sm">{p.label}</div>
                          <div className="text-xs text-muted-foreground">{p.note}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-display font-bold">{p.value} {p.unit}</div>
                          {p.change && (
                            <div className={`text-xs font-mono ${p.trend === "up" ? "text-emerald-500" : p.trend === "down" ? "text-rose-500" : "text-muted-foreground"}`}>
                              {p.trend === "up" ? "▲" : p.trend === "down" ? "▼" : "—"} {p.change}
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
