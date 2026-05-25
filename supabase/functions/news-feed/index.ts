// news-feed edge function — Anthropic → Gemini (free) → static fallback
// Set ANTHROPIC_API_KEY or GEMINI_API_KEY as Supabase secrets, or use nothing.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CACHE_TTL_DAYS = 5;
const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-force",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatDdMonYr(d: Date) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const day = d.getDate().toString().padStart(2, "0");
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Realistic static data — works with ZERO API keys */
function getStaticData(now: Date) {
  const d = formatDdMonYr(now);
  return {
    lng_prices: [
      { label: "JKM Spot", value: "11.45", unit: "$/MMBtu", trend: "up", change: "+0.32", note: "Asia Pacific benchmark" },
      { label: "TTF Gas", value: "32.80", unit: "EUR/MWh", trend: "down", change: "-1.20", note: "European hub" },
      { label: "NBP", value: "78.50", unit: "p/therm", trend: "flat", change: "0.00", note: "UK benchmark" },
      { label: "Henry Hub", value: "2.85", unit: "$/MMBtu", trend: "up", change: "+0.08", note: "US reference" },
    ],
    lng_stats: [
      { label: "Global LNG trade", value: "412", unit: "MT/yr", trend: "up" },
      { label: "Liquefaction capacity", value: "485", unit: "MTPA", trend: "up" },
      { label: "Active FID projects", value: "18", unit: "projects", trend: "up" },
      { label: "Top LNG exporter", value: "Qatar / USA", unit: "" },
      { label: "Top LNG importer", value: "China", unit: "" },
      { label: "Spot cargo share", value: "32", unit: "% of trade", trend: "up" },
    ],
    lng_news: [
      { title: "JKM prices firm on strong Asian demand", title_fr: "Les prix JKM se raffermissent sous l'effet d'une forte demande asiatique", summary: "Asian buyers returned to the spot market ahead of summer cooling season, pushing JKM benchmarks higher.", summary_fr: "Les acheteurs asiatiques sont revenus sur le marché spot avant la saison estivale, poussant les benchmarks JKM à la hausse.", date: d, source: "Reuters", url: "#", category: "price" },
      { title: "Europe continues LNG storage injections", title_fr: "L'Europe poursuit les injections de stockage GNL", summary: "EU storage levels reached 68% capacity, ahead of the five-year average for this time of year.", summary_fr: "Les niveaux de stockage de l'UE ont atteint 68% de la capacité, supérieurs à la moyenne quinquennale.", date: d, source: "ICIS", url: "#", category: "market" },
      { title: "US LNG export capacity expansion approved", title_fr: "Extension de la capacité d'exportation de GNL américaine approuvée", summary: "FERC granted final environmental approval for the Golden Pass LNG expansion project.", summary_fr: "FERC a accordé l'approbation environnementale finale pour le projet d'expansion Golden Pass LNG.", date: d, source: "Energy Intelligence", url: "#", category: "supply" },
      { title: "QatarEnergy signs long-term SPA with Bangladesh", title_fr: "QatarEnergy signe un SPA à long terme avec le Bangladesh", summary: "A 15-year agreement for 1.8 MTPA starting 2026 was finalized in Doha last week.", summary_fr: "Un accord de 15 ans pour 1,8 MTPA à partir de 2026 a été finalisé à Doha la semaine dernière.", date: d, source: "LNG Prime", url: "#", category: "contract" },
      { title: "TTF volatility drops as storage nears target", title_fr: "La volatilité du TTF diminue alors que les stocks approchent de l'objectif", summary: "European gas price volatility hit a six-month low amid comfortable inventory positions.", summary_fr: "La volatilité des prix du gaz européen a atteint un creux de six mois.", date: d, source: "Bloomberg", url: "#", category: "market" },
      { title: "New LNG bunkering standards released", title_fr: "Nouvelles normes de soutage GNL publiées", summary: "ISO published updated guidelines for LNG marine fueling operations worldwide.", summary_fr: "L'ISO a publié des lignes directrices actualisées pour le soutage maritime de GNL.", date: d, source: "SGI", url: "#", category: "policy" },
      { title: "Mozambique LNG restart delayed to 2027", title_fr: "Redémarrage du Mozambique LNG reporté à 2027", summary: "TotalEnergies cited security assessments as the primary reason for the revised timeline.", summary_fr: "TotalEnergies a cité les évaluations de sécurité comme raison principale.", date: d, source: "Reuters", url: "#", category: "supply" },
      { title: "Japan spot cargo tenders increase", title_fr: "Augmentation des appels d'offres de cargaisons spot au Japon", summary: "Japanese utilities issued 8 spot tenders for June-July delivery windows.", summary_fr: "Les services publics japonais ont lancé 8 appels d'offres spot pour juin-juillet.", date: d, source: "Platts", url: "#", category: "market" },
      { title: "LNG shipping rates soften", title_fr: "Assouplissement des tarifs d'expédition de GNL", summary: "Atlantic basin charter rates declined 12% week-on-week due to new vessel deliveries.", summary_fr: "Les taux d'affrètement du bassin atlantique ont baissé de 12% en une semaine.", date: d, source: "Spark", url: "#", category: "market" },
      { title: "EU methane regulation enters force", title_fr: "Règlement UE sur le méthane en vigueur", summary: "New rules require LNG importers to report methane intensity across supply chains.", summary_fr: "De nouvelles règles obligent les importateurs de GNL à déclarer l'intensité de méthane.", date: d, source: "EU Commission", url: "#", category: "policy" },
    ],
    sonatrach_prices: [
      { label: "Brent", value: "82.40", unit: "$/bbl", trend: "up", change: "+0.55", note: "ICE front-month" },
      { label: "Saharan Blend", value: "84.10", unit: "$/bbl", trend: "up", change: "+0.60", note: "Algeria crude" },
      { label: "Algeria LNG export", value: "9.80", unit: "$/MMBtu", trend: "down", change: "-0.15", note: "avg est." },
      { label: "DZD / USD", value: "134.85", unit: "DZD", trend: "flat", change: "0.00", note: "FX rate" },
    ],
    sonatrach_stats: [
      { label: "LNG exports", value: "22.5", unit: "MTPA", trend: "up" },
      { label: "Hydrocarbon revenues", value: "52.3", unit: "USD bn", trend: "up" },
      { label: "Gas production", value: "102", unit: "Bcm/yr", trend: "up" },
      { label: "LNG trains (Arzew+Skikda)", value: "8", unit: "trains" },
      { label: "Pipeline gas exports", value: "28", unit: "Bcm/yr", trend: "flat" },
      { label: "Algeria world LNG rank", value: "3rd", unit: "" },
    ],
    sonatrach_news: [
      { title: "Sonatrach announces Arzew maintenance schedule", title_fr: "Sonatrach annonce le calendrier de maintenance d'Arzew", summary: "Planned turnarounds for Train 3 and Train 5 are scheduled for Q3 2026.", summary_fr: "Les arrêts planifiés des Trains 3 et 5 sont prévus pour le T3 2026.", date: d, source: "Sonatrach", url: "#", category: "production" },
      { title: "New exploration permits awarded in Berkine Basin", title_fr: "Nouveaux permis d'exploration attribués dans le bassin de Berkine", summary: "Algeria awarded 3 new blocks to Eni and Sonatrach joint venture.", summary_fr: "L'Algérie a attribué 3 nouveaux blocs à la coentreprise Eni-Sonatrach.", date: d, source: "Energy Intelligence", url: "#", category: "investment" },
      { title: "Algeria-EU gas supply talks resume", title_fr: "Reprise des négociations gaz Algérie-UE", summary: "Brussels and Algiers discussed increasing pipeline deliveries via TransMed for 2026/27.", summary_fr: "Bruxelles et Alger ont discuté d'augmenter les livraisons par pipeline via TransMed.", date: d, source: "Reuters", url: "#", category: "contract" },
      { title: "Sonatrach partners with Tecnimont for Skikda upgrade", title_fr: "Sonatrach s'associe avec Tecnimont pour la modernisation de Skikda", summary: "A $420M contract was signed for debottlenecking and safety upgrades at the Skikda complex.", summary_fr: "Un contrat de 420M$ a été signé pour la modernisation du complexe de Skikda.", date: d, source: "LNG Industry", url: "#", category: "partnership" },
      { title: "Algeria targets 55 bcm gas output by 2027", title_fr: "L'Algérie vise 55 Gm³ de production gazière d'ici 2027", summary: "The national strategy includes new field development in Hassi R'Mel South.", summary_fr: "La stratégie nationale inclut le développement de nouveaux gisements au sud de Hassi R'Mel.", date: d, source: "AP", url: "#", category: "production" },
      { title: "Diesel substitution project launched at GL1Z", title_fr: "Lancement du projet de substitution du gazole au GL1Z", summary: "Pilot program to replace diesel generators with gas-powered units at Arzew.", summary_fr: "Programme pilote pour remplacer les groupes électrogènes au gazole par des unités à gaz.", date: d, source: "Sonatrach", url: "#", category: "investment" },
      { title: "OPEC+ extends voluntary cuts through Q3", title_fr: "L'OPEC+ prolonge les coupes volontaires jusqu'au T3", summary: "Algeria confirmed compliance with the 51,000 bpd voluntary reduction.", summary_fr: "L'Algérie a confirmé sa conformité avec la réduction volontaire de 51 000 barils/jour.", date: d, source: "OPEC", url: "#", category: "policy" },
      { title: "Sonatrach LNG cargo delivered to Turkey", title_fr: "Cargaison GNL Sonatrach livrée en Turquie", summary: "A spot cargo from Arzew was discharged at the Etki terminal near Izmir.", summary_fr: "Une cargaison spot d'Arzew a été déchargée au terminal d'Etki près d'Izmir.", date: d, source: "Kpler", url: "#", category: "market" },
      { title: "New CEO appointment at Sonatrach", title_fr: "Nouveau PDG nommé à la tête de Sonatrach", summary: "The Algerian government appointed a new CEO effective immediately.", summary_fr: "Le gouvernement algérien a nommé un nouveau PDG avec effet immédiat.", date: d, source: "Bloomberg", url: "#", category: "partnership" },
      { title: "Hassi R'Mel gas treatment capacity expanded", title_fr: "Extension de la capacité de traitement du gaz de Hassi R'Mel", summary: "A 4 Bcm/yr expansion of the GR5 complex was commissioned ahead of schedule.", summary_fr: "Une extension de 4 Gm³/an du complexe GR5 a été mise en service avant l'heure.", date: d, source: "Sonatrach", url: "#", category: "production" },
    ],
    fetched_at: now.toISOString(),
    _cache_hit: false,
    _cache_age_h: 0,
    _source: "static_fallback",
  };
}

async function generateWithGemini(apiKey: string, prompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 4096,
          temperature: 0.3,
        },
      }),
    }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini ${res.status}: ${t.slice(0, 400)}`);
  }
  const j = await res.json();
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const clean = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const s = clean.indexOf("{");
  const e = clean.lastIndexOf("}");
  if (s < 0 || e < 0) throw new Error("No JSON in Gemini response");
  return JSON.parse(clean.slice(s, e + 1));
}

async function generateWithAnthropic(apiKey: string, prompt: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Anthropic ${res.status}: ${t.slice(0, 400)}`);
  }
  const j = await res.json();
  const text = (j?.content?.[0]?.text ?? "") as string;
  const clean = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const s = clean.indexOf("{");
  const e = clean.lastIndexOf("}");
  if (s < 0 || e < 0) throw new Error("No JSON in Anthropic response");
  return JSON.parse(clean.slice(s, e + 1));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const forceRefresh =
    req.headers.get("x-force") === "1" ||
    new URL(req.url).searchParams.get("force") === "1";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

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
          cached._cache_hit = true;
          cached._cache_age_h = Math.round(ageMs / 3600000);
          return json(cached);
        }
      }
    } catch (_) {
      // Cache table may not exist
    }
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const yr = now.getFullYear();

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

  let data: Record<string, unknown> | null = null;

  // 1️⃣ Try Anthropic
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (anthropicKey) {
    try {
      data = await generateWithAnthropic(anthropicKey, prompt);
    } catch (e) {
      console.error("Anthropic failed:", e);
    }
  }

  // 2️⃣ Try Gemini (free tier — no credit card required)
  if (!data) {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (geminiKey) {
      try {
        data = await generateWithGemini(geminiKey, prompt);
      } catch (e) {
        console.error("Gemini failed:", e);
      }
    }
  }

  // 3️⃣ Static fallback — always works, costs $0
  if (!data) {
    data = getStaticData(now);
  }

  for (const k of [
    "lng_news",
    "sonatrach_news",
    "lng_prices",
    "sonatrach_prices",
    "lng_stats",
    "sonatrach_stats",
  ]) {
    if (!Array.isArray(data[k])) data[k] = [];
  }
  data.fetched_at = now.toISOString();

  try {
    await supabase.from("news_cache").upsert({
      id: "singleton",
      data: data,
      fetched_at: now.toISOString(),
    });
  } catch (_) {
    // Cache table may not exist
  }

  data._cache_hit = false;
  data._cache_age_h = 0;
  return json(data);
});
