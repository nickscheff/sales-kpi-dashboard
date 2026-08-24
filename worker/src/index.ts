/**
 * Sales-KPI-Dashboard API Worker.
 *
 * Liefert die gebaute SPA aus (Static Assets, siehe wrangler.jsonc) und
 * stellt unter /api/data den kompletten Dashboard-Datenblob als JSON in
 * einem einzigen KV-Key bereit. Kein Login - Schutz nur über einen
 * Shared-Secret-Header, der gegen das Worker-Secret API_SECRET geprüft wird.
 */

const KV_KEY = "dashboard:v1";
const SECRET_HEADER = "X-Shared-Secret";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": `Content-Type, ${SECRET_HEADER}`,
};

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(JSON.stringify(data), { ...init, headers });
}

function isAuthorized(request: Request, env: Env): boolean {
  const provided = request.headers.get(SECRET_HEADER);
  return Boolean(env.API_SECRET) && provided === env.API_SECRET;
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname !== "/api/data") {
      return json({ error: "Not found" }, { status: 404 });
    }

    if (!isAuthorized(request, env)) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    if (request.method === "GET") {
      const stored = await env.DASHBOARD_KV.get(KV_KEY);
      return json(stored ? JSON.parse(stored) : null);
    }

    if (request.method === "PUT") {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, { status: 400 });
      }
      await env.DASHBOARD_KV.put(KV_KEY, JSON.stringify(body));
      return json({ ok: true });
    }

    return json({ error: "Method not allowed" }, { status: 405 });
  },
} satisfies ExportedHandler<Env>;
