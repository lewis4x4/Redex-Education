import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createGoogleDriveWriteAdapter } from "../_shared/driveWrite.ts";
import {
  claimAndProcessNextDriveSyncJob,
  EdgeFunctionError,
  type SupabaseLike,
} from "./core.ts";

type RedexSupabaseClient = SupabaseClient<any, "public", "redex", any, any>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(error: unknown): Response {
  if (error instanceof EdgeFunctionError) {
    return jsonResponse({
      status: "error",
      code: error.code,
      message: error.message,
    }, error.status);
  }

  const message = error instanceof Error ? error.message : String(error);
  const code = message.startsWith("missing_env:") ? "missing_env" : "worker_failed";

  return jsonResponse({ status: "error", code, message }, 500);
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new EdgeFunctionError("missing_env", `${name} is required.`, 500, "configuration");
  }

  return value;
}

function bearerToken(request: Request): string {
  return (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/iu, "").trim();
}

function requireWorkerAuth(request: Request, serviceRoleKey: string): void {
  const configuredSecret = Deno.env.get("REDEX_DRIVE_SYNC_WORKER_SECRET");
  const workerSecret = request.headers.get("x-redex-worker-secret") ?? "";
  const bearer = bearerToken(request);

  if (configuredSecret && workerSecret === configuredSecret) {
    return;
  }

  if (bearer && bearer === serviceRoleKey) {
    return;
  }

  throw new EdgeFunctionError("forbidden", "Service worker credentials required.", 403, "auth");
}

async function parseWorkerId(request: Request): Promise<string> {
  if (!request.body) {
    return "drive-sync-worker";
  }

  try {
    const body = await request.json() as { worker_id?: unknown };

    return typeof body.worker_id === "string" && body.worker_id.trim()
      ? body.worker_id.trim().slice(0, 120)
      : "drive-sync-worker";
  } catch (_error) {
    return "drive-sync-worker";
  }
}

export function createHandler(): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-redex-worker-secret",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({
        status: "error",
        code: "unsupported_method",
        message: "process-drive-sync-jobs only supports POST.",
      }, 405);
    }

    try {
      const supabaseUrl = getRequiredEnv("SUPABASE_URL");
      const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
      const rootFolderId = getRequiredEnv("GOOGLE_DRIVE_LIBRARY_FOLDER_ID");
      requireWorkerAuth(request, serviceRoleKey);
      const workerId = await parseWorkerId(request);
      const supabase = createClient(supabaseUrl, serviceRoleKey, { db: { schema: "redex" } }) as RedexSupabaseClient;
      const drive = await createGoogleDriveWriteAdapter();
      const result = await claimAndProcessNextDriveSyncJob(supabase as unknown as SupabaseLike, drive, rootFolderId, workerId);

      return jsonResponse(result, result.status === "failed" ? 500 : 200);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

if (import.meta.main) {
  Deno.serve(createHandler());
}
