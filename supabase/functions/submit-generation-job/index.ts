import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let ALLOWED_ORIGINS: string[] = [];

function configureAllowedOrigins(functionName: string): Response | null {
  const rawAllowedOrigins = Deno.env.get("ALLOWED_ORIGINS");

  if (!rawAllowedOrigins) {
    console.error(`[${functionName}] ALLOWED_ORIGINS must be set`);
    return new Response(
      JSON.stringify({
        status: "error",
        code: "server_misconfigured",
        message: "Server configuration error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  ALLOWED_ORIGINS = rawAllowedOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (ALLOWED_ORIGINS.length === 0) {
    console.error(`[${functionName}] ALLOWED_ORIGINS must include at least one origin`);
    return new Response(
      JSON.stringify({
        status: "error",
        code: "server_misconfigured",
        message: "Server configuration error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return null;
}

function resolveCorsHeaders(request: Request): Record<string, string> {
  const requestOrigin = request.headers.get("origin") ?? "";
  const allowAll = ALLOWED_ORIGINS.includes("*");
  const isAllowed = allowAll || ALLOWED_ORIGINS.includes(requestOrigin);
  const allowOriginValue = allowAll
    ? "*"
    : isAllowed
    ? requestOrigin
    : ALLOWED_ORIGINS[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allowOriginValue,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

class EdgeFunctionError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

function jsonResponse(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...resolveCorsHeaders(request),
      "Content-Type": "application/json",
    },
  });
}

function errorResponse(request: Request, error: unknown): Response {
  if (error instanceof EdgeFunctionError) {
    return jsonResponse(request, {
      status: "error",
      code: error.code,
      error: error.message,
      message: error.message,
    }, error.status);
  }

  const message = error instanceof Error ? error.message : String(error);
  const code = message.startsWith("missing_env:")
    ? "missing_env"
    : "db_write_failed";

  return jsonResponse(
    request,
    { status: "error", code, error: message, message },
    code === "missing_env" ? 500 : 500,
  );
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new EdgeFunctionError("missing_env", `${name} is required.`, 500);
  }

  return value;
}

type JobType = "full" | "section";

interface SubmitGenerationJobRequest {
  moduleId?: string;
  jobType?: JobType;
  targetSectionId?: string | null;
  inputPayload?: unknown;
  promptVersion?: string;
}

interface ProfileRoleRow {
  role: string;
}

interface GenerationJobSummary {
  id: string;
  status: string;
  stage_map?: unknown;
  current_stage?: string | null;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return bytesToHex(digest);
}

function operationFrom(inputPayload: unknown): string {
  if (typeof inputPayload === "object" && inputPayload !== null && !Array.isArray(inputPayload)) {
    const operation = (inputPayload as Record<string, unknown>).operation;
    return typeof operation === "string" ? operation : "fullPipeline";
  }

  return "fullPipeline";
}

async function idempotencyKeyFor(body: Awaited<ReturnType<typeof parseRequestBody>>): Promise<string> {
  const operation = operationFrom(body.inputPayload);
  const inputHash = await sha256Hex(JSON.stringify(body.inputPayload));

  return [
    body.moduleId,
    body.jobType,
    body.targetSectionId ?? "full",
    operation,
    body.promptVersion ?? "unknown",
    inputHash,
  ].join(":");
}

async function parseRequestBody(request: Request): Promise<Required<Pick<SubmitGenerationJobRequest, "moduleId" | "jobType" | "inputPayload">> & Pick<SubmitGenerationJobRequest, "targetSectionId" | "promptVersion">> {
  let body: SubmitGenerationJobRequest;

  try {
    body = await request.json() as SubmitGenerationJobRequest;
  } catch (_error) {
    throw new EdgeFunctionError(
      "invalid_request",
      "Request body must be valid JSON.",
      400,
    );
  }

  if (!body.moduleId || typeof body.moduleId !== "string") {
    throw new EdgeFunctionError("invalid_request", "moduleId is required.", 400);
  }

  if (body.jobType !== "full" && body.jobType !== "section") {
    throw new EdgeFunctionError("invalid_request", "jobType must be 'full' or 'section'.", 400);
  }

  if (body.jobType === "section" && !body.targetSectionId) {
    throw new EdgeFunctionError(
      "invalid_request",
      "targetSectionId is required for section generation jobs.",
      400,
    );
  }

  if (body.inputPayload === undefined || body.inputPayload === null) {
    throw new EdgeFunctionError("invalid_request", "inputPayload is required.", 400);
  }

  return {
    moduleId: body.moduleId,
    jobType: body.jobType,
    targetSectionId: body.targetSectionId ?? null,
    inputPayload: body.inputPayload,
    promptVersion: body.promptVersion,
  };
}

function bearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/iu, "").trim();

  if (!token) {
    throw new EdgeFunctionError("auth_failed", "A valid Supabase JWT is required.", 401);
  }

  return token;
}

Deno.serve(async (request) => {
  const corsConfigError = configureAllowedOrigins("submit-generation-job");
  if (corsConfigError) {
    return corsConfigError;
  }
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: resolveCorsHeaders(request),
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      request,
      {
        status: "error",
        code: "unsupported_method",
        message: "submit-generation-job only supports POST.",
      },
      405,
    );
  }

  try {
    const body = await parseRequestBody(request);
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const jwt = bearerToken(request);
    const supabase = createClient(supabaseUrl, serviceRoleKey, { db: { schema: "redex" } });
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !userData.user) {
      throw new EdgeFunctionError(
        "auth_failed",
        userError?.message ?? "Could not authenticate caller.",
        401,
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single<ProfileRoleRow>();

    if (profileError || !profile || !["admin", "foundry_author"].includes(profile.role)) {
      throw new EdgeFunctionError(
        "forbidden",
        "Only Foundry authors can submit generation jobs.",
        403,
      );
    }

    const idempotencyKey = await idempotencyKeyFor(body);
    const operation = operationFrom(body.inputPayload);
    const { data: duplicates, error: duplicateError } = await supabase
      .from("generation_jobs")
      .select("id,status,stage_map,current_stage")
      .eq("idempotency_key", idempotencyKey)
      .in("status", ["queued", "running"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (duplicateError) {
      throw new EdgeFunctionError("db_read_failed", duplicateError.message, 500);
    }

    const existing = (duplicates?.[0] ?? null) as GenerationJobSummary | null;

    if (existing) {
      return jsonResponse(request, {
        job_id: existing.id,
        id: existing.id,
        status: existing.status,
        stage_map: existing.stage_map ?? {},
        current_stage: existing.current_stage ?? null,
        reused: true,
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("generation_jobs")
      .insert({
        module_id: body.moduleId,
        job_type: body.jobType,
        target_section_id: body.targetSectionId,
        status: "queued",
        operation,
        idempotency_key: idempotencyKey,
        input_payload: body.inputPayload,
        prompt_version: body.promptVersion ?? null,
        submitted_by: userData.user.id,
      })
      .select("id,status,stage_map,current_stage")
      .single<GenerationJobSummary>();

    if (insertError?.code === "23505") {
      const { data: activeJobs, error: activeJobError } = await supabase
        .from("generation_jobs")
        .select("id,status,stage_map,current_stage")
        .eq("idempotency_key", idempotencyKey)
        .in("status", ["queued", "running"])
        .order("created_at", { ascending: false })
        .limit(1);
      const activeJob = activeJobs?.[0] as GenerationJobSummary | undefined;

      if (!activeJobError && activeJob) {
        return jsonResponse(request, {
          job_id: activeJob.id,
          id: activeJob.id,
          status: activeJob.status,
          stage_map: activeJob.stage_map ?? {},
          current_stage: activeJob.current_stage ?? null,
          reused: true,
        });
      }
    }

    if (insertError || !inserted) {
      throw new EdgeFunctionError(
        "db_write_failed",
        insertError?.message ?? "Failed to insert generation job.",
        500,
      );
    }

    return jsonResponse(request, {
      job_id: inserted.id,
      id: inserted.id,
      status: inserted.status,
      stage_map: inserted.stage_map ?? {},
      current_stage: inserted.current_stage ?? null,
      reused: false,
    }, 202);
  } catch (error) {
    return errorResponse(request, error);
  }
});
