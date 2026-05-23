import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getDriveAccessToken } from "../_shared/google-jwt.ts";

const DRIVE_API_BASE_URL = "https://www.googleapis.com/drive/v3";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

// CORS: by default echoes the requesting origin and only allows POST/OPTIONS.
// Tighten further by setting ALLOWED_ORIGINS env to a comma-separated list of
// trusted frontend URLs. Authentication still depends on the Supabase JWT in
// the Authorization header — CORS is in-depth-only.
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

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

interface DriveSyncRequest {
  trigger?: "manual";
  folder_id_override?: string;
}

interface DriveFileListItem {
  id: string;
  name: string;
  mimeType: string;
}

interface DriveFileMetadata extends DriveFileListItem {
  headRevisionId?: string;
  modifiedTime?: string;
  size?: string;
}

interface SourceFileSummary {
  drive_file_id: string;
  title: string;
  authority: "authoritative" | "supporting" | "context";
  processing_status: "pending" | "processing" | "processed" | "failed";
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
      message: error.message,
    }, error.status);
  }

  const message = error instanceof Error ? error.message : String(error);
  const code = message.startsWith("missing_env:")
    ? "missing_env"
    : message.startsWith("auth_failed:")
    ? "auth_failed"
    : "db_write_failed";

  return jsonResponse(
    request,
    { status: "error", code, message },
    code === "auth_failed" ? 401 : 500,
  );
}

async function parseRequestBody(request: Request): Promise<DriveSyncRequest> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return { trigger: "manual" };
  }

  try {
    return JSON.parse(rawBody) as DriveSyncRequest;
  } catch (_error) {
    throw new EdgeFunctionError(
      "invalid_request",
      "Request body must be valid JSON.",
      400,
    );
  }
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new EdgeFunctionError("missing_env", `${name} is required.`, 500);
  }

  return value;
}

function escapeDriveQueryLiteral(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function buildDriveUrl(
  path: string,
  params: Record<string, string | undefined>,
): URL {
  const url = new URL(`${DRIVE_API_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

async function fetchDriveJson<T>(url: URL, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new EdgeFunctionError(
      "drive_api_error",
      `Google Drive API request failed (${response.status}) ${body}`,
      502,
    );
  }

  return response.json() as Promise<T>;
}

async function listFolderChildren(
  folderId: string,
  accessToken: string,
): Promise<DriveFileListItem[]> {
  const files: DriveFileListItem[] = [];
  let pageToken: string | undefined;

  do {
    const url = buildDriveUrl("/files", {
      q: `'${escapeDriveQueryLiteral(folderId)}' in parents and trashed=false`,
      fields: "nextPageToken,files(id,name,mimeType)",
      pageSize: "1000",
      pageToken,
    });
    const page = await fetchDriveJson<
      { nextPageToken?: string; files?: DriveFileListItem[] }
    >(url, accessToken);

    files.push(...(page.files ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);

  return files;
}

async function getFileMetadata(
  fileId: string,
  accessToken: string,
): Promise<DriveFileMetadata> {
  const url = buildDriveUrl(`/files/${encodeURIComponent(fileId)}`, {
    fields: "id,name,mimeType,modifiedTime,headRevisionId,size",
  });

  return fetchDriveJson<DriveFileMetadata>(url, accessToken);
}

async function walkDriveFolder(
  folderId: string,
  accessToken: string,
  topic: string | null,
  pathPrefix: string,
): Promise<
  Array<DriveFileMetadata & { drivePath: string; topic: string | null }>
> {
  const children = await listFolderChildren(folderId, accessToken);
  const discovered: Array<
    DriveFileMetadata & { drivePath: string; topic: string | null }
  > = [];

  for (const child of children) {
    const drivePath = `${pathPrefix}/${child.name}`;

    if (child.mimeType === FOLDER_MIME_TYPE) {
      const childTopic = child.name;
      const nestedFiles = await walkDriveFolder(
        child.id,
        accessToken,
        childTopic,
        drivePath,
      );
      discovered.push(...nestedFiles);
      continue;
    }

    const metadata = await getFileMetadata(child.id, accessToken);
    discovered.push({ ...metadata, drivePath, topic });
  }

  return discovered;
}

function invokeParsersInBackground(promises: Promise<unknown>[]): void {
  const waitUntil = (globalThis as unknown as {
    EdgeRuntime?: { waitUntil?: (promise: Promise<unknown>) => void };
  })
    .EdgeRuntime?.waitUntil;
  const allInvocations = Promise.allSettled(promises).then(() => undefined);

  if (waitUntil) {
    waitUntil(allInvocations);
  }
}

Deno.serve(async (request) => {
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
        message: "drive-sync only supports POST.",
      },
      405,
    );
  }

  try {
    const body = await parseRequestBody(request);
    const accessToken = await getDriveAccessToken();
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const targetFolderId = body.folder_id_override ??
      getRequiredEnv("GOOGLE_DRIVE_LIBRARY_FOLDER_ID");
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, { db: { schema: "redex" } });

    const driveFiles = await walkDriveFolder(
      targetFolderId,
      accessToken,
      null,
      "_library",
    );
    const driveFileIds = driveFiles.map((file) => file.id);
    const existingIds = new Set<string>();

    if (driveFileIds.length > 0) {
      const { data: existingRows, error: existingError } = await supabase
        .from("source_files")
        .select("drive_file_id")
        .in("drive_file_id", driveFileIds);

      if (existingError) {
        throw new EdgeFunctionError(
          "db_write_failed",
          existingError.message,
          500,
        );
      }

      for (const row of existingRows ?? []) {
        if (typeof row.drive_file_id === "string") {
          existingIds.add(row.drive_file_id);
        }
      }
    }

    const rowsToUpsert = driveFiles.map((file) => ({
      drive_file_id: file.id,
      drive_path: file.drivePath,
      title: file.name,
      mime_type: file.mimeType,
      topic: file.topic,
      last_synced_at: new Date().toISOString(),
      processing_status: "pending" as const,
    }));

    if (rowsToUpsert.length === 0) {
      return jsonResponse(request, {
        status: "ok",
        summary: {
          files_seen: 0,
          files_inserted: 0,
          files_updated: 0,
          files_failed: 0,
        },
        files: [],
      });
    }

    const { data: upsertedFiles, error: upsertError } = await supabase
      .from("source_files")
      .upsert(rowsToUpsert, { onConflict: "drive_file_id" })
      .select("id,drive_file_id,title,authority,processing_status");

    if (upsertError) {
      throw new EdgeFunctionError("db_write_failed", upsertError.message, 500);
    }

    const parseInvocations = (upsertedFiles ?? []).map((file) =>
      supabase.functions.invoke("parse-source-file", {
        body: { source_file_id: file.id, drive_file_id: file.drive_file_id },
      }).catch((error) => {
        console.error(
          "parse-source-file invocation failed",
          file.drive_file_id,
          error,
        );
      })
    );

    invokeParsersInBackground(parseInvocations);

    const files: SourceFileSummary[] = (upsertedFiles ?? []).map((file) => ({
      drive_file_id: file.drive_file_id,
      title: file.title,
      authority: file.authority,
      processing_status: file.processing_status,
    }));

    return jsonResponse(request, {
      status: "ok",
      summary: {
        files_seen: driveFiles.length,
        files_inserted: driveFiles.filter((file) =>
          !existingIds.has(file.id)
        ).length,
        files_updated: driveFiles.filter((file) =>
          existingIds.has(file.id)
        ).length,
        files_failed: 0,
      },
      files,
    });
  } catch (error) {
    return errorResponse(request, error);
  }
});
