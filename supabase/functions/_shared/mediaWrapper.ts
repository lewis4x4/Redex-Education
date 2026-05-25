export type EnvReader = (name: string) => string | undefined;

export class MediaWrapperError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "MediaWrapperError";
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(error: unknown, fallbackCode = "media_wrapper_failed"): Response {
  if (error instanceof MediaWrapperError) {
    return jsonResponse({ status: "error", code: error.code, message: error.message }, error.status);
  }

  const statusCode = typeof (error as { statusCode?: unknown })?.statusCode === "number"
    ? (error as { statusCode: number }).statusCode
    : undefined;
  const retryable = (error as { retryable?: unknown })?.retryable === true;
  const message = error instanceof Error ? error.message : String(error);
  const status = statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429 ? 400 : 502;

  return jsonResponse({
    status: "error",
    code: retryable ? "provider_retryable_error" : fallbackCode,
    message,
  }, status);
}

export function requirePostOrOptions(request: Request, functionName: string): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (request.method !== "POST") {
    return jsonResponse({
      status: "error",
      code: "unsupported_method",
      message: `${functionName} only supports POST.`,
    }, 405);
  }

  return null;
}

export function requireEnv(getEnv: EnvReader, name: string): string {
  const value = getEnv(name)?.trim();

  if (!value) {
    throw new MediaWrapperError("missing_env", `${name} is required.`, 500);
  }

  return value;
}

export function requireMediaStageEnabled(getEnv: EnvReader): void {
  if (getEnv("REDEX_ENABLE_HEYGEN_MEDIA_STAGE") !== "true") {
    throw new MediaWrapperError(
      "media_stage_disabled",
      "REDEX_ENABLE_HEYGEN_MEDIA_STAGE must be set to 'true' before media wrappers can run.",
      503,
    );
  }
}

export function assertServiceRoleCaller(request: Request, getEnv: EnvReader, functionName: string): void {
  const serviceRoleKey = requireEnv(getEnv, "SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("authorization") ?? "";

  if (authorization !== `Bearer ${serviceRoleKey}`) {
    throw new MediaWrapperError(
      "auth_failed",
      `${functionName} requires the service-role bearer token.`,
      401,
    );
  }
}

export async function parseJsonRecord(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch (_error) {
    throw new MediaWrapperError("invalid_json", "Request body must be valid JSON.", 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new MediaWrapperError("invalid_request", "Request body must be a JSON object.", 400);
  }

  return body as Record<string, unknown>;
}

export function requiredString(body: Record<string, unknown>, key: string): string {
  const value = body[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new MediaWrapperError("invalid_request", `${key} is required.`, 400);
  }

  return value.trim();
}

export function optionalString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
