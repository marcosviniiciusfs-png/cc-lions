import { onRequest as sendConversion } from "../../../functions/api/conversions";

interface WorkerEnv {
  META_CAPI_ACCESS_TOKEN?: string;
  META_GRAPH_API_VERSION?: string;
  META_PIXEL_ID?: string;
  ALLOWED_ORIGINS?: string;
}

const json = (body: unknown, status = 200, origin = "") =>
  Response.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json; charset=utf-8",
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff",
    },
  });

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "cc-lions-conversions-api" });
    }

    if (url.pathname !== "/events") {
      return json({ ok: false, error: "not_found" }, 404);
    }

    if (!allowedOrigins.includes(origin)) {
      return json({ ok: false, error: "origin_not_allowed" }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin",
        },
      });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "method_not_allowed" }, 405, origin);
    }

    if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
      return json({ ok: false, error: "content_type_must_be_json" }, 415, origin);
    }

    if (Number(request.headers.get("Content-Length") || 0) > 16_384) {
      return json({ ok: false, error: "payload_too_large" }, 413, origin);
    }

    const rawBody = await request.clone().text();
    if (new TextEncoder().encode(rawBody).byteLength > 16_384) {
      return json({ ok: false, error: "payload_too_large" }, 413, origin);
    }

    let payload: { eventSourceUrl?: unknown };
    try {
      const parsedPayload: unknown = JSON.parse(rawBody);
      if (!parsedPayload || typeof parsedPayload !== "object" || Array.isArray(parsedPayload)) {
        return json({ ok: false, error: "invalid_payload" }, 400, origin);
      }
      payload = parsedPayload as { eventSourceUrl?: unknown };
    } catch {
      return json({ ok: false, error: "invalid_json" }, 400, origin);
    }

    let sourceHost = "";
    try {
      sourceHost = new URL(String(payload.eventSourceUrl || "")).hostname;
    } catch {
      return json({ ok: false, error: "invalid_event_source_url" }, 400, origin);
    }

    if (!new Set(["cclions.simulead.com.br", "localhost", "127.0.0.1"]).has(sourceHost)) {
      return json({ ok: false, error: "event_source_not_allowed" }, 403, origin);
    }

    let response: Response;
    try {
      response = await sendConversion({
        request,
        env: {
          META_CONVERSIONS_ACCESS_TOKEN: env.META_CAPI_ACCESS_TOKEN,
          META_PIXEL_ID: env.META_PIXEL_ID,
          META_GRAPH_API_VERSION: env.META_GRAPH_API_VERSION,
        },
      });
    } catch {
      return json({ ok: false, error: "meta_api_unavailable" }, 502, origin);
    }
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Vary", "Origin");
    headers.set("X-Content-Type-Options", "nosniff");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
