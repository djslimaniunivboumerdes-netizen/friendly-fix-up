export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          app: "GNL1Z",
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    let response = await env.ASSETS.fetch(request);

    if (response.status === 404) {
      response = await env.ASSETS.fetch(
        new Request(new URL("/index.html", request.url).toString(), request)
      );
    }

    const res = new Response(response.body, response);

    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return res;
  },
} satisfies ExportedHandler<Env>;