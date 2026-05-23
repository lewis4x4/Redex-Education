import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

/**
 * Supabase Custom Access Token hook for Redex Education.
 *
 * Deploy with JWT verification disabled because Supabase Auth invokes HTTP
 * hooks before a user JWT exists:
 *   supabase secrets set CUSTOM_ACCESS_TOKEN_HOOK_SECRET="v1,whsec_<dashboard-generated-secret>"
 *   supabase functions deploy custom-access-token-hook --no-verify-jwt
 *
 * Then enable it in Supabase Dashboard:
 *   Authentication → Hooks → Custom Access Token → HTTP Endpoint
 *
 * Generate/copy the hook secret from the Dashboard and store the same value in
 * CUSTOM_ACCESS_TOKEN_HOOK_SECRET. This handler verifies the Standard Webhooks
 * signature before using the service-role client. The hook mirrors
 * redex.profiles.role into the JWT as `redex_role`, which RLS helpers read via
 * auth.jwt(). If the profile row is missing during a race, the safe default is
 * `learner`; the auth.users trigger should create profiles before this runs for
 * normal sign-ins.
 */

type RedexRole = "admin" | "foundry_author" | "manager" | "learner";

interface AccessTokenHookPayload {
  user_id?: string;
  user?: {
    id?: string;
  };
  claims?: Record<string, unknown>;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const HOOK_SECRET = Deno.env.get("CUSTOM_ACCESS_TOKEN_HOOK_SECRET") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: "redex",
  },
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isRedexRole(value: unknown): value is RedexRole {
  return value === "admin" || value === "foundry_author" || value === "manager" || value === "learner";
}

function verifyHookPayload(rawBody: string, headers: Headers): AccessTokenHookPayload {
  const secret = HOOK_SECRET.replace("v1,whsec_", "");
  const webhook = new Webhook(secret);
  return webhook.verify(rawBody, Object.fromEntries(headers)) as AccessTokenHookPayload;
}

async function getRoleForUser(userId: string): Promise<RedexRole> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[custom-access-token-hook] Unable to read redex profile role; defaulting to learner.", error);
    return "learner";
  }

  return isRedexRole(data?.role) ? data.role : "learner";
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !HOOK_SECRET) {
    console.error(
      "[custom-access-token-hook] Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or CUSTOM_ACCESS_TOKEN_HOOK_SECRET.",
    );
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  const rawBody = await request.text();
  let payload: AccessTokenHookPayload;

  try {
    payload = verifyHookPayload(rawBody, request.headers);
  } catch (error) {
    console.warn("[custom-access-token-hook] Invalid hook signature.", error);
    return jsonResponse({ error: { http_code: 401, message: "Invalid hook signature" } }, 401);
  }

  const userId = payload.user_id ?? payload.user?.id;

  if (!userId) {
    return jsonResponse({ error: { http_code: 400, message: "Missing user_id" } }, 400);
  }

  const role = await getRoleForUser(userId);

  return jsonResponse({
    claims: {
      ...(payload.claims ?? {}),
      redex_role: role,
    },
  });
});
