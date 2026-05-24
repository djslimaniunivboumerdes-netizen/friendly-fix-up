// news-feed edge function — uses Anthropic Claude to generate fresh market data.
// Serves Supabase-cached data if < 5 days old; regenerates otherwise.
// Set ANTHROPIC_API_KEY as a Supabase project secret.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CACHE_TTL_DAYS = 5;
const CACHE_TTL_MS   = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-force",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const forceRefresh =
    req.headers.get("x-force") === "1" ||
    new URL(req.url).searchParams.get("force") === "1";

  // ── Supabase client (service role for cache writes) ──────────────────────
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // ── Check cache ───────────────────────────────────────────────────────────
  if (!forceRefresh) {
    try {
      const { data: row, error } = await supabase
        .from("news_cache")
        .select("data, fetched_at")
        .eq("id", "singleton")
        .maybeSingle();

      if (!error && row?.data && row.fetched_at) {
        const ageMs = Date.now() - new Date(row.fetched_at).getTime();
        if (ageMs < CACHE_TTL_MS) {
          const cached = row.data as Record<string, unknown>;
          cached._cache_hit  = true;
          cached._cache_age_h = Math.round(ageMs / 3_600_000);
          return json(cached);
        }
      }
    } catch (_) {
      // Cache table may not exist yet — proceed to generate fresh data
    }
  }

  // ── Generate fresh data via Anthropic Claude ──────────────────────────────
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) {
    return json({ error: "ANTHROPIC_API_KEY secret not set in Supabase project" }, 500);
  }

  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const yr      = now.getFullYear();

  const prompt = `You are a real-time energy-market intelligence assistant for the GNL1Z LNG plant (Sonatrach, Arzew, Algeria). Today: ${dateStr}.
Return ONLY a valid JSON object — no markdown, no extra text.
Provide EXACTLY 10 lng_news items and EXACTLY 10 sonatrach_news items.
Every news item MUST have: title, title_fr, summary, summary_fr, date (DD Mon ${yr}), source, url (or "#"), category.

{
  "lng_prices":[
    {"label":"JKM Spot","value":"","unit":"$/MMBtu","trend":"up|down|flat","change":"","note":"Asia Pacific benchmark"},
    {"label":"TTF Gas","value":"","unit":"EUR/MWh","trend":"up|down|flat","change":"","note":"European hub"},
    {"label":"NBP","value":"","unit":"p/therm","trend":"up|down|flat","change":"","note":"UK benchmark"},
    {"label":"Henry Hub","value":"","unit":"$/MMBtu","trend":"up|down|flat","change":"","note":"US reference"}
  ],
  "lng_stats":[
    {"label":"Global LNG trade","value":"","unit":"MT/yr","trend":"up|down|flat"},
    {"label":"Liquefaction capacity","value":"","unit":"MTPA","trend":"up|down|flat"},
    {"label":"Active FID projects","value":"","unit":"projects","trend":"up|down|flat"},
    {"label":"Top LNG exporter","value":"","unit":""},
    {"label":"Top LNG importer","value":"","unit":""},
    {"label":"Spot cargo share","value":"","unit":"% of trade","trend":"up|down|flat"}
  ],
  "lng_news":[{"title":"","title_fr":"","summary":"","summary_fr":"","date":"DD Mon ${yr}","source":"","url":"","category":"price|market|policy|supply|contract"}],
  "sonatrach_prices":[
    {"label":"Brent","value":"","unit":"$/bbl","trend":"up|down|flat","change":"","note":"ICE front-month"},
    {"label":"Saharan Blend","value":"","unit":"$/bbl","trend":"up|down|flat","change":"","note":"Algeria crude"},
    {"label":"Algeria LNG export","value":"","unit":"$/MMBtu","trend":"up|down|flat","change":"","note":"avg est."},
    {"label":"DZD / USD","value":"","unit":"DZD","trend":"up|down|flat","change":"","note":"FX rate"}
  ],
  "sonatrach_stats":[
    {"label":"LNG exports","value":"","unit":"MTPA","trend":"up|down|flat"},
    {"label":"Hydrocarbon revenues","value":"","unit":"USD bn","trend":"up|down|flat"},
    {"label":"Gas production","value":"","unit":"Bcm/yr","trend":"up|down|flat"},
    {"label":"LNG trains (Arzew+Skikda)","value":"","unit":"trains"},
    {"label":"Pipeline gas exports","value":"","unit":"Bcm/yr","trend":"up|down|flat"},
    {"label":"Algeria world LNG rank","value":"","unit":""}
  ],
  "sonatrach_news":[{"title":"","title_fr":"","summary":"","summary_fr":"","date":"DD Mon ${yr}","source":"","url":"","category":"contract|production|investment|partnership|policy|market"}],
  "fetched_at":"${now.toISOString()}"
}`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return json({ error: `Anthropic API ${r.status}: ${t.slice(0, 400)}` }, 502);
    }

    const j    = await r.json();
    const text = (j?.content?.[0]?.text ?? "") as string;
    const clean = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    const s = clean.indexOf("{"); const e = clean.lastIndexOf("}");
    if (s < 0 || e < 0) {
      return json({ error: "No JSON in AI response", preview: clean.slice(0, 300) }, 502);
    }

    const data = JSON.parse(clean.slice(s, e + 1)) as Record<string, unknown>;
    for (const k of ["lng_news","sonatrach_news","lng_prices","sonatrach_prices","lng_stats","sonatrach_stats"]) {
      if (!Array.isArray(data[k])) data[k] = [];
    }
    data.fetched_at = now.toISOString();

    // ── Persist to cache ───────────────────────────────────────────────────
    try {
      await supabase.from("news_cache").upsert({
        id:         "singleton",
        data:       data,
        fetched_at: now.toISOString(),
      });
    } catch (_) {
      // Cache table may not exist — continue without caching
    }

    data._cache_hit   = false;
    data._cache_age_h = 0;
    return json(data);

  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
