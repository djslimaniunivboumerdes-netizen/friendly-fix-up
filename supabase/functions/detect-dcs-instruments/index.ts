// Edge function: AI vision OCR to extract DCS instrument tags from a screenshot
// Uses Lovable AI Gateway (Gemini Flash — strong vision + free tier).
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

interface ReqBody {
  panel_id: string;
  image_url: string; // public Drive thumbnail
  force?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { panel_id, image_url, force }: ReqBody = await req.json();
    if (!panel_id || !image_url) {
      return json({ error: "panel_id and image_url required" }, 400);
    }

    // Cache check
    if (!force) {
      const cached = await fetch(`${SUPABASE_URL}/rest/v1/dcs_detected_instruments?panel_id=eq.${encodeURIComponent(panel_id)}&select=*`, {
        headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      }).then((r) => r.json());
      if (Array.isArray(cached) && cached.length && Array.isArray(cached[0].tags) && cached[0].tags.length) {
        return json({ tags: cached[0].tags, cached: true });
      }
    }

    // Call Lovable AI Gateway with vision
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an industrial DCS screenshot reader. Extract every visible instrument tag. Tags follow patterns like FT-1234, PIC-501A, TT-22, LV-100, FIC-1503, PT-501, XV-22, AS-100, HS-200, etc. (loop letters: F/P/T/L/A/X/H + I/T/V/C/S/Y + number + optional suffix). Return ONLY a strict JSON array of unique uppercase tag strings, no prose, no code fences. Example: [\"FT-1503\",\"PIC-501A\",\"TT-22\"]. If none, return [].",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all instrument tags visible on this DCS screen. Return JSON array only." },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
      }),
    });

    if (aiRes.status === 429) return json({ error: "Rate limit. Try again shortly." }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted. Add credits in Cloud → AI." }, 402);
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return json({ error: `AI gateway error: ${txt}` }, 500);
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content ?? "[]";
    let tags: string[] = [];
    try {
      const cleaned = String(raw).replace(/```json|```/g, "").trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      tags = JSON.parse(match ? match[0] : cleaned);
      tags = [...new Set(tags.filter((t) => typeof t === "string" && t.length > 1).map((t) => t.toUpperCase().trim()))];
    } catch {
      tags = [];
    }

    // Cache
    await fetch(`${SUPABASE_URL}/rest/v1/dcs_detected_instruments`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({ panel_id, tags, model: "google/gemini-2.5-flash" }),
    });

    return json({ tags, cached: false });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
