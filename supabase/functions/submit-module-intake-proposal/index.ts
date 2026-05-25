import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  EdgeFunctionError,
  submitModuleIntakeProposal,
  type SubmitModuleIntakeProposalRequest,
  type SupabaseLike,
} from "./core.ts";

type RedexSupabaseClient = SupabaseClient<any, "public", "redex", any, any>;

let ALLOWED_ORIGINS: string[] = [];

function configureAllowedOrigins(functionName: string): Response | null {
  const rawAllowedOrigins = Deno.env.get("REDEX_ALLOWED_ORIGINS");

  if (!rawAllowedOrigins) {
    console.error(`[${functionName}] REDEX_ALLOWED_ORIGINS must be set`);
    return new Response(JSON.stringify({
      status: "error",
      code: "server_misconfigured",
      message: "Server configuration error",
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  ALLOWED_ORIGINS = rawAllowedOrigins.split(",").map((origin) => origin.trim()).filter(Boolean);

  if (ALLOWED_ORIGINS.length === 0) {
    console.error(`[${functionName}] REDEX_ALLOWED_ORIGINS must include at least one origin`);
    return new Response(JSON.stringify({
      status: "error",
      code: "server_misconfigured",
      message: "Server configuration error",
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  return null;
}

function resolveCorsHeaders(request: Request): Record<string, string> {
  const requestOrigin = request.headers.get("origin") ?? "";
  const allowAll = ALLOWED_ORIGINS.includes("*");
  const isAllowed = allowAll || ALLOWED_ORIGINS.includes(requestOrigin);
  const allowOriginValue = allowAll ? "*" : isAllowed ? requestOrigin : ALLOWED_ORIGINS[0] ?? "";

  return {
    "Access-Control-Allow-Origin": allowOriginValue,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function jsonResponse(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...resolveCorsHeaders(request), "Content-Type": "application/json" },
  });
}

function errorResponse(request: Request, error: unknown): Response {
  if (error instanceof EdgeFunctionError) {
    return jsonResponse(request, {
      status: "error",
      code: error.code,
      message: error.message,
    }, error.status);
  }

  const message = error instanceof Error ? error.message : String(error);
  const code = message.startsWith("missing_env:") ? "missing_env" : "db_write_failed";

  return jsonResponse(request, { status: "error", code, message }, 500);
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new EdgeFunctionError("missing_env", `${name} is required.`, 500);
  }

  return value;
}

async function parseRequestBody(request: Request): Promise<SubmitModuleIntakeProposalRequest> {
  try {
    return await request.json() as SubmitModuleIntakeProposalRequest;
  } catch (_error) {
    throw new EdgeFunctionError("invalid_request", "Request body must be valid JSON.", 400);
  }
}

function bearerToken(request: Request): string {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/iu, "").trim();

  if (!token) {
    throw new EdgeFunctionError("auth_required", "Authorization header required.", 401);
  }

  return token;
}

async function requireFoundryAuthor(
  request: Request,
  supabase: RedexSupabaseClient,
): Promise<{ userId: string }> {
  const jwt = bearerToken(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

  if (authError || !user) {
    throw new EdgeFunctionError("auth_failed", "Invalid or expired token.", 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (profileError || !profile || !["admin", "foundry_author"].includes(profile.role)) {
    throw new EdgeFunctionError("forbidden", "Foundry author role required.", 403);
  }

  return { userId: user.id };
}

export function createHandler(): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const corsConfigError = configureAllowedOrigins("submit-module-intake-proposal");
    if (corsConfigError) {
      return corsConfigError;
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: resolveCorsHeaders(request) });
    }

    if (request.method !== "POST") {
      return jsonResponse(request, {
        status: "error",
        code: "unsupported_method",
        message: "submit-module-intake-proposal only supports POST.",
      }, 405);
    }

    try {
      const body = await parseRequestBody(request);
      const supabaseUrl = getRequiredEnv("SUPABASE_URL");
      const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
      const supabase = createClient(supabaseUrl, serviceRoleKey, { db: { schema: "redex" } }) as RedexSupabaseClient;
      const { userId } = await requireFoundryAuthor(request, supabase);
      const result = await submitModuleIntakeProposal(supabase as unknown as SupabaseLike, userId, body);

      return jsonResponse(request, {
        status: "queued",
        proposal_id: result.proposal_id,
        job_id: result.job_id,
        proposal_status: result.proposal_status,
        job_status: result.job_status,
        dedupe_key: result.dedupe_key,
        reused_job: result.reused_job,
      }, result.reused_job ? 200 : 202);
    } catch (error) {
      return errorResponse(request, error);
    }
  };
}

if (import.meta.main) {
  Deno.serve(createHandler());
}
