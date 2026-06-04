/**
 * Cicatrix Audit Log — Cloudflare Pages Function
 * Endpoint: /audit
 *
 * POST /audit  — called by the app on every session event (no auth required)
 * GET  /audit  — returns all stored events as a JSON array
 *
 * One-time setup in the Cloudflare dashboard:
 *   Pages → isenberginsight → Settings → Functions → KV namespace bindings
 *   Add binding:  Variable name = CICATRIX_AUDIT  (create a new KV namespace)
 *
 * Without the KV binding, POST and GET both return 503 and the app falls back
 * to showing only the current browser session in the audit log.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequest(context) {
  const { request, env } = context;

  /* Pre-flight */
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  /* ── POST /audit — receive an event from any app session ── */
  if (request.method === "POST") {
    if (!env.CICATRIX_AUDIT) {
      /* KV not yet configured — fail silently so the app keeps working */
      return new Response("KV not configured", { status: 503, headers: CORS });
    }
    try {
      const body = await request.json();
      const key = `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 9)}`;
      const entry = {
        ...body,
        server_ts: new Date().toISOString(),
        ip_hash: await hashIp(request.headers.get("cf-connecting-ip") || ""),
        country: request.headers.get("cf-ipcountry") || "",
      };
      await env.CICATRIX_AUDIT.put(key, JSON.stringify(entry), {
        /* Keep events for 2 years */
        expirationTtl: 60 * 60 * 24 * 730,
      });
      return new Response("ok", { status: 200, headers: CORS });
    } catch {
      return new Response("bad request", { status: 400, headers: CORS });
    }
  }

  /* ── GET /audit — return all events ── */
  if (request.method === "GET") {
    if (!env.CICATRIX_AUDIT) {
      return new Response("KV not configured", { status: 503, headers: CORS });
    }
    try {
      const all = [];
      let cursor;
      do {
        const page = await env.CICATRIX_AUDIT.list({ limit: 1000, cursor });
        for (const k of page.keys) {
          /* Skip user-account records (managed by /auth); keep only audit events */
          if (k.name.startsWith("user::")) continue;
          const raw = await env.CICATRIX_AUDIT.get(k.name);
          if (raw) {
            try { all.push(JSON.parse(raw)); } catch { /* skip malformed */ }
          }
        }
        cursor = page.list_complete ? undefined : page.cursor;
      } while (cursor);

      all.sort((a, b) => (b.server_ts || "").localeCompare(a.server_ts || ""));

      return new Response(JSON.stringify(all), {
        status: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Not found", { status: 404, headers: CORS });
}

/** One-way hash of the IP so you can detect duplicate sessions without storing raw IPs */
async function hashIp(ip) {
  if (!ip) return "";
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 12);
  } catch {
    return "";
  }
}
