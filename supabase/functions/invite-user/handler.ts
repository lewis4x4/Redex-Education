import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RedexRole = "admin" | "foundry_author" | "manager" | "learner";

interface InviteUserRequest {
  email?: string;
  display_name?: string;
  role?: RedexRole;
  department?: string | null;
  manager_id?: string | null;
  start_date?: string | null;
}

interface CallerProfile {
  id: string;
  org_id: string;
  role: RedexRole;
}

interface SupabaseClientLike {
  auth: {
    getUser: (jwt: string) => Promise<{ data: { user: { id: string } | null }; error: { message: string } | null }>;
    admin: {
      inviteUserByEmail: (email: string) => Promise<{ data: { user: { id: string } | null }; error: { message: string } | null }>;
    };
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: <T>() => Promise<{ data: T | null; error: { message: string } | null }>;
      };
    };
    upsert: (values: Record<string, unknown>, options: { onConflict: string }) => {
      select: (columns: string) => {
        single: <T>() => Promise<{ data: T | null; error: { message: string } | null }>;
      };
    };
  };
}

interface InviteUserHandlerDeps {
  getEnv: (name: string) => string | undefined;
  createSupabaseClient?: (url: string, key: string) => SupabaseClientLike;
}

let ALLOWED_ORIGINS: string[] = [];

class EdgeFunctionError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

function configureAllowedOrigins(functionName: string, getEnv: (name: string) => string | undefined): Response | null {
  const rawAllowedOrigins = getEnv("REDEX_ALLOWED_ORIGINS");
  if (!rawAllowedOrigins) {
    console.error(`[${functionName}] REDEX_ALLOWED_ORIGINS must be set`);
    return new Response(JSON.stringify({ status: "error", code: "server_misconfigured", message: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  ALLOWED_ORIGINS = rawAllowedOrigins.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (ALLOWED_ORIGINS.length === 0) {
    console.error(`[${functionName}] REDEX_ALLOWED_ORIGINS must include at least one origin`);
    return new Response(JSON.stringify({ status: "error", code: "server_misconfigured", message: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
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
  return jsonResponse(request, { status: "error", code: "invite_failed", error: message, message }, 500);
}

function getRequiredEnv(getEnv: (name: string) => string | undefined, name: string): string {
  const value = getEnv(name);
  if (!value) {
    throw new EdgeFunctionError("missing_env", `${name} is required.`, 500);
  }
  return value;
}

function parseRequestBody(body: InviteUserRequest): Required<Pick<InviteUserRequest, "email" | "display_name" | "role">> & Pick<InviteUserRequest, "department" | "manager_id" | "start_date"> {
  if (!body.email || typeof body.email !== "string") throw new EdgeFunctionError("invalid_request", "email is required.", 400);
  if (!body.display_name || typeof body.display_name !== "string") throw new EdgeFunctionError("invalid_request", "display_name is required.", 400);
  if (!body.role || !["admin", "foundry_author", "manager", "learner"].includes(body.role)) throw new EdgeFunctionError("invalid_request", "role is required and must be valid.", 400);

  return {
    email: body.email.trim().toLowerCase(),
    display_name: body.display_name.trim(),
    role: body.role,
    department: typeof body.department === "string" ? body.department.trim() : null,
    manager_id: body.manager_id ?? null,
    start_date: body.start_date ?? null,
  };
}

function bearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/iu, "").trim();
  if (!token) throw new EdgeFunctionError("auth_failed", "A valid Supabase JWT is required.", 401);
  return token;
}

export function createInviteUserHandler(deps: InviteUserHandlerDeps): (request: Request) => Promise<Response> {
  const createSupabaseClient = deps.createSupabaseClient ?? ((url: string, key: string) => createClient(url, key, { db: { schema: "redex" } }) as unknown as SupabaseClientLike);

  return async (request: Request): Promise<Response> => {
    const corsConfigError = configureAllowedOrigins("invite-user", deps.getEnv);
    if (corsConfigError) return corsConfigError;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: resolveCorsHeaders(request) });
    }

    if (request.method !== "POST") {
      return jsonResponse(request, { status: "error", code: "unsupported_method", message: "invite-user only supports POST." }, 405);
    }

    try {
      const parsedBody = parseRequestBody(await request.json() as InviteUserRequest);
      const supabaseUrl = getRequiredEnv(deps.getEnv, "SUPABASE_URL");
      const serviceRoleKey = getRequiredEnv(deps.getEnv, "SUPABASE_SERVICE_ROLE_KEY");
      const jwt = bearerToken(request);
      const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

      const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
      if (userError || !userData.user) {
        throw new EdgeFunctionError("auth_failed", userError?.message ?? "Could not authenticate caller.", 401);
      }

      const { data: callerProfile, error: callerProfileError } = await supabase
        .from("profiles")
        .select("id, org_id, role")
        .eq("id", userData.user.id)
        .single<CallerProfile>();

      if (callerProfileError || !callerProfile || callerProfile.role !== "admin") {
        throw new EdgeFunctionError("forbidden", "Only admins can onboard new people.", 403);
      }

      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(parsedBody.email);
      if (inviteError || !inviteData.user) {
        throw new EdgeFunctionError("invite_failed", inviteError?.message ?? "Could not invite user.", 500);
      }

      const { data: insertedProfile, error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: inviteData.user.id,
          org_id: callerProfile.org_id,
          email: parsedBody.email,
          display_name: parsedBody.display_name,
          role: parsedBody.role,
          department: parsedBody.department,
          manager_id: parsedBody.manager_id,
          start_date: parsedBody.start_date,
        }, { onConflict: "id" })
        .select("id")
        .single<{ id: string }>();

      if (profileError || !insertedProfile) {
        throw new EdgeFunctionError("profile_insert_failed", profileError?.message ?? "Could not create profile row.", 500);
      }

      return jsonResponse(request, { ok: true, user_id: inviteData.user.id, profile_id: insertedProfile.id });
    } catch (error) {
      return errorResponse(request, error);
    }
  };
}
