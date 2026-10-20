type Env = {
  META_CONVERSIONS_ACCESS_TOKEN?: string;
  META_GRAPH_API_VERSION?: string;
  META_PIXEL_ID?: string;
  META_TEST_EVENT_CODE?: string;
};

type PagesContext = {
  request: Request;
  env: Env;
};

type ConversionBody = {
  eventId?: unknown;
  eventSourceUrl?: unknown;
  leadPayload?: unknown;
  pixelPayload?: unknown;
};

const DEFAULT_GRAPH_API_VERSION = "v25.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  Response.json(body, {
    ...init,
    headers: {
      ...corsHeaders,
      ...init.headers,
    },
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asRecord = (value: unknown) => (isRecord(value) ? value : {});

const asString = (value: unknown) => (typeof value === "string" ? value : "");

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const normalizeText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

const normalizePhone = (value: string) => {
  const digits = onlyDigits(value);

  if (!digits) return "";
  if (digits.startsWith("55")) return digits;

  return `55${digits}`;
};

const parseCookies = (cookieHeader: string | null) => {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, item) => {
    const separatorIndex = item.indexOf("=");
    if (separatorIndex === -1) return cookies;

    const key = item.slice(0, separatorIndex).trim();
    const value = item.slice(separatorIndex + 1).trim();

    if (!key) return cookies;

    cookies[key] = value;
    return cookies;
  }, {});
};

const getClientIp = (request: Request) =>
  request.headers.get("CF-Connecting-IP") ||
  request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
  "";

const getFallbackFbc = (eventSourceUrl: string) => {
  try {
    const fbclid = new URL(eventSourceUrl).searchParams.get("fbclid");
    return fbclid ? `fb.1.${Date.now()}.${fbclid}` : "";
  } catch {
    return "";
  }
};

const sha256 = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const hashArray = async (value: string) => (value ? [await sha256(value)] : undefined);

const removeEmptyValues = (record: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;

      return value !== undefined && value !== null && value !== "";
    }),
  );

const getLeadIdentity = (leadPayload: Record<string, unknown>) => {
  const fullName =
    asString(leadPayload.nome_completo) ||
    asString(leadPayload.nome) ||
    asString(leadPayload["Nome Completo"]);
  const phone =
    asString(leadPayload.telefone) ||
    asString(leadPayload.whatsapp) ||
    asString(leadPayload["WhatsApp"]);
  const city = asString(leadPayload.cidade) || asString(leadPayload["Cidade"]);
  const normalizedNameParts = normalizeText(fullName).split(" ").filter(Boolean);

  return {
    city: normalizeText(city),
    firstName: normalizedNameParts[0] || "",
    fullName: normalizeText(fullName),
    lastName:
      normalizedNameParts.length > 1
        ? normalizedNameParts[normalizedNameParts.length - 1]
        : "",
    phone: normalizePhone(phone),
  };
};

const getCustomData = (
  pixelPayload: Record<string, unknown>,
  leadPayload: Record<string, unknown>,
) => {
  const rawCustomData = {
    ...pixelPayload,
    content_category:
      asString(pixelPayload.content_category) ||
      asString(leadPayload.categoria_credito) ||
      asString(leadPayload.bem),
    content_name:
      asString(pixelPayload.content_name) ||
      asString(leadPayload.tipo_de_credito) ||
      asString(leadPayload.bem),
    lead_source: "cc_lions_simulator",
    status: "simulacao_finalizada",
  };

  return Object.fromEntries(
    Object.entries(rawCustomData).filter(([, value]) =>
      ["boolean", "number", "string"].includes(typeof value),
    ),
  );
};

const methodNotAllowed = () =>
  jsonResponse(
    { ok: false, error: "method_not_allowed" },
    {
      headers: {
        Allow: "POST, OPTIONS",
      },
      status: 405,
    },
  );

const handlePost = async ({ request, env }: PagesContext) => {
  const accessToken = env.META_CONVERSIONS_ACCESS_TOKEN;
  const pixelId = env.META_PIXEL_ID?.trim() || "";
  const graphApiVersion = env.META_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION;

  if (!pixelId) {
    return jsonResponse(
      { ok: false, error: "missing_meta_pixel_id" },
      { status: 500 },
    );
  }
  if (!accessToken) {
    return jsonResponse(
      { ok: false, error: "missing_meta_conversions_access_token" },
      { status: 500 },
    );
  }

  let body: ConversionBody;

  try {
    body = (await request.json()) as ConversionBody;
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const leadPayload = asRecord(body.leadPayload);
  const pixelPayload = asRecord(body.pixelPayload);
  const eventId = asString(body.eventId) || `cc-lions-lead-${Date.now()}`;
  const eventSourceUrl =
    asString(body.eventSourceUrl) ||
    request.headers.get("Referer") ||
    new URL(request.url).origin;
  const cookies = parseCookies(request.headers.get("Cookie"));
  const leadIdentity = getLeadIdentity(leadPayload);

  if (!leadIdentity.phone || !leadIdentity.fullName) {
    return jsonResponse(
      { ok: false, error: "missing_lead_identity" },
      { status: 400 },
    );
  }

  const [phoneHash, firstNameHash, lastNameHash, cityHash, countryHash] = await Promise.all([
    hashArray(leadIdentity.phone),
    hashArray(leadIdentity.firstName),
    hashArray(leadIdentity.lastName),
    hashArray(leadIdentity.city),
    hashArray("br"),
  ]);
  const userData = removeEmptyValues({
    client_ip_address: getClientIp(request),
    client_user_agent: request.headers.get("User-Agent") || "",
    fbc: cookies._fbc || getFallbackFbc(eventSourceUrl),
    fbp: cookies._fbp || "",
    ph: phoneHash,
    fn: firstNameHash,
    ln: lastNameHash,
    ct: cityHash,
    country: countryHash,
  });
  const metaPayload = removeEmptyValues({
    data: [
      {
        action_source: "website",
        custom_data: getCustomData(pixelPayload, leadPayload),
        event_id: eventId,
        event_name: "Lead",
        event_source_url: eventSourceUrl,
        event_time: Math.floor(Date.now() / 1000),
        user_data: userData,
      },
    ],
    test_event_code: env.META_TEST_EVENT_CODE,
  });
  const metaUrl = new URL(
    `https://graph.facebook.com/${encodeURIComponent(graphApiVersion)}/${encodeURIComponent(pixelId)}/events`,
  );

  metaUrl.searchParams.set("access_token", accessToken);

  const metaResponse = await fetch(metaUrl.toString(), {
    body: JSON.stringify(metaPayload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const metaResponseText = await metaResponse.text();
  let metaResponseBody: unknown = metaResponseText;

  try {
    metaResponseBody = JSON.parse(metaResponseText);
  } catch {
    // Meta may return plain text for some upstream errors.
  }

  if (!metaResponse.ok) {
    console.error("Meta Conversions API request failed", {
      status: metaResponse.status,
      response: metaResponseBody,
    });

    return jsonResponse(
      {
        ok: false,
        error: "meta_conversions_request_failed",
        meta: metaResponseBody,
      },
      { status: 502 },
    );
  }

  return jsonResponse({ ok: true, meta: metaResponseBody });
};

export const onRequest = (context: PagesContext) => {
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (context.request.method === "POST") {
    return handlePost(context);
  }

  return methodNotAllowed();
};
