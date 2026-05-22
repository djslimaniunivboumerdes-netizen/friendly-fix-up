/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Worker — serves the GNL1Z React SPA.
 * Handles SPA routing fallback, caching, and security headers.
 */


export interface Env {
  ASSETS: Fetcher;
  APP_NAME: string;
  APP_VERSION: string;
  APP_ENV: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // ── CORS preflight ───────────────────────────────────────────
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // ── Health check ─────────────────────────────────────────────
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          app: env.APP_NAME,
          version: env.APP_VERSION,
          env: env.APP_ENV,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        }
      );
    }

    // ── Serve static assets ──────────────────────────────────────
    let response = await env.ASSETS.fetch(request);

    // ── SPA fallback: 404 → index.html (react-router-dom) ────────
    if (response.status === 404) {
      const indexReq = new Request(new URL("/index.html", request.url).toString(), request);
      response = await env.ASSETS.fetch(indexReq);
    }

    // ── Clone to mutate headers ──────────────────────────────────
    const res = new Response(response.body, response);
    const ct  = res.headers.get("Content-Type") ?? "";
    const isHtml   = ct.includes("text/html") || url.pathname === "/";
    const isHashed = url.pathname.startsWith("/assets/");

    // ── Cache-Control ────────────────────────────────────────────
    if (isHtml) {
      res.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    } else if (isHashed) {
      res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (url.pathname.match(/\.(woff2?|ttf|otf|png|jpg|jpeg|svg|ico|webp)$/)) {
      res.headers.set("Cache-Control", "public, max-age=86400");
    }

    // ── Security headers ─────────────────────────────────────────
    res.headers.set("X-Content-Type-Options",   "nosniff");
    res.headers.set("X-Frame-Options",           "SAMEORIGIN");
    res.headers.set("X-XSS-Protection",         "1; mode=block");
    res.headers.set("Referrer-Policy",           "strict-origin-when-cross-origin");
    res.headers.set("Permissions-Policy",
      "camera=(self), microphone=(), geolocation=(), payment=()"
    );
    res.headers.set("Content-Security-Policy", [
      "default-src 'self'",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co",
      "font-src 'self' https://fonts.gstatic.com data:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "script-src 'self' 'unsafe-eval'",
      "img-src 'self' data: blob: https://*.supabase.co https://storage.googleapis.com",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "));

    return res;
  },
} satisfies ExportedHandler<Env>;
