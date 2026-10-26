import { onRequest as sendConversion } from "../../../functions/api/conversions";

interface WorkerEnv {
  META_CAPI_ACCESS_TOKEN?: string;
  META_GRAPH_API_VERSION?: string;
  META_PIXEL_ID?: string;
  ALLOWED_ORIGINS?: string;
  LEADS_DB?: D1Database;
}

interface D1Result {
  success: boolean;
  meta?: { changes?: number };
}

interface D1Statement {
  bind(...values: Array<string | number | null>): {
    run(): Promise<D1Result>;
  };
}

interface D1Database {
  prepare(query: string): D1Statement;
}

interface WorkerExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const firstText = (...values: unknown[]) => values.map(asText).find(Boolean) || "";

const limitText = (value: string, maxLength: number) => value.slice(0, maxLength);

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return "";
};

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
  async fetch(
    request: Request,
    env: WorkerEnv,
    context: WorkerExecutionContext,
  ): Promise<Response> {
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

    let payload: {
      eventId?: unknown;
      eventSourceUrl?: unknown;
      leadPayload?: unknown;
    };
    try {
      const parsedPayload: unknown = JSON.parse(rawBody);
      if (!parsedPayload || typeof parsedPayload !== "object" || Array.isArray(parsedPayload)) {
        return json({ ok: false, error: "invalid_payload" }, 400, origin);
      }
      payload = parsedPayload as typeof payload;
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

    const eventId = asText(payload.eventId);
    const leadPayload = isRecord(payload.leadPayload) ? payload.leadPayload : {};
    const fullName = limitText(
      firstText(leadPayload.nome_completo, leadPayload.nome, leadPayload["Nome Completo"]),
      160,
    );
    const phone = normalizePhone(
      firstText(leadPayload.telefone, leadPayload.whatsapp, leadPayload["WhatsApp"]),
    );
    const serviceType = firstText(leadPayload.tipo_de_credito, leadPayload.tipo, leadPayload.interesse);
    const assetType = limitText(firstText(leadPayload.bem, leadPayload.tipo_de_bem), 80);
    const creditRange = limitText(firstText(leadPayload.valor_credito, leadPayload.valor_do_credito), 80);
    const monthlyRange = limitText(firstText(leadPayload.parcela, leadPayload.parcela_ideal), 80);
    const notes = limitText(firstText(leadPayload.observacao), 2000);
    const entryChoice = firstText(leadPayload.tem_entrada, leadPayload.hasDownPayment);
    const entryAmount = limitText(
      firstText(leadPayload.valor_entrada, leadPayload.entrada),
      40,
    );
    const hasEntry = entryChoice.toLowerCase() === "sim" || (entryAmount !== "" && entryAmount.toLowerCase() !== "não");

    if (!eventId || eventId.length > 160 || !fullName || !phone) {
      return json({ ok: false, error: "invalid_lead_identity" }, 400, origin);
    }

    if (serviceType !== "Consórcio" && serviceType !== "Imobiliária") {
      return json({ ok: false, error: "invalid_service_type" }, 400, origin);
    }

    if (!env.LEADS_DB) {
      return json({ ok: false, error: "lead_database_unavailable" }, 503, origin);
    }

    try {
      const insert = await env.LEADS_DB.prepare(
        `INSERT OR IGNORE INTO leads (
          event_id, full_name, phone, service_type, asset_type, credit_range,
          has_entry, entry_amount, monthly_range, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          eventId,
          fullName,
          phone,
          serviceType,
          assetType || null,
          creditRange || null,
          hasEntry ? 1 : 0,
          hasEntry ? entryAmount || null : null,
          monthlyRange || null,
          notes || null,
        )
        .run();

      if (!insert.success) throw new Error("D1 insert failed");
    } catch {
      console.error("CC Lion's lead could not be stored", { eventId });
      return json({ ok: false, error: "lead_persistence_failed" }, 503, origin);
    }

    const conversionTask = sendConversion({
        request,
        env: {
          META_CONVERSIONS_ACCESS_TOKEN: env.META_CAPI_ACCESS_TOKEN,
          META_PIXEL_ID: env.META_PIXEL_ID,
          META_GRAPH_API_VERSION: env.META_GRAPH_API_VERSION,
        },
      })
      .then(async (response) => {
        const metaSent = response.ok;
        if (!metaSent) {
          console.error("CC Lion's Meta CAPI request failed", {
            eventId,
            status: response.status,
          });
        }
        await updateMetaStatus(env.LEADS_DB!, eventId, metaSent ? "sent" : "failed");
      })
      .catch(async () => {
        console.error("CC Lion's Meta CAPI request failed", { eventId });
        await updateMetaStatus(env.LEADS_DB!, eventId, "failed");
      });

    context.waitUntil(conversionTask);

    return json({ ok: true, leadStored: true }, 202, origin);
  },
};

const updateMetaStatus = async (
  database: D1Database,
  eventId: string,
  status: "sent" | "failed",
) => {
  try {
    await database
      .prepare("UPDATE leads SET meta_status = ? WHERE event_id = ?")
      .bind(status, eventId)
      .run();
  } catch {
    console.error("CC Lion's lead Meta status could not be updated", { eventId });
  }
};
