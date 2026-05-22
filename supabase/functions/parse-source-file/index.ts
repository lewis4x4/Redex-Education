import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getDriveAccessToken } from "../_shared/google-jwt.ts";
import {
  parseFrontmatter,
  parseMarkdownSections,
  parseMetaMd,
  type SourceAuthorityLevel,
  type SourceAuthoritySource,
  type SourceSection,
} from "../_shared/parsers.ts";

const DRIVE_API_BASE_URL = "https://www.googleapis.com/drive/v3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ParseSourceFileRequest {
  source_file_id?: string;
  drive_file_id?: string;
}

interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  headRevisionId?: string;
  modifiedTime?: string;
  size?: string;
  parents?: string[];
}

interface SourceFileRow {
  id: string;
  drive_file_id: string;
  title: string;
  mime_type: string;
}

interface AuthorityUpdate {
  authority?: SourceAuthorityLevel;
  authority_source?: SourceAuthoritySource;
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
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
  const code = message.startsWith("missing_env:")
    ? "missing_env"
    : message.startsWith("auth_failed:")
    ? "auth_failed"
    : "db_write_failed";

  return jsonResponse(
    { status: "error", code, message },
    code === "auth_failed" ? 401 : 500,
  );
}

async function parseRequestBody(
  request: Request,
): Promise<Required<ParseSourceFileRequest>> {
  let body: ParseSourceFileRequest;

  try {
    body = await request.json() as ParseSourceFileRequest;
  } catch (_error) {
    throw new EdgeFunctionError(
      "invalid_request",
      "Request body must be valid JSON.",
      400,
    );
  }

  if (!body.source_file_id || !body.drive_file_id) {
    throw new EdgeFunctionError(
      "invalid_request",
      "source_file_id and drive_file_id are required.",
      400,
    );
  }

  return {
    source_file_id: body.source_file_id,
    drive_file_id: body.drive_file_id,
  };
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

async function fetchDriveBytes(
  fileId: string,
  accessToken: string,
): Promise<Uint8Array> {
  const url = buildDriveUrl(`/files/${encodeURIComponent(fileId)}`, {
    alt: "media",
  });
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new EdgeFunctionError(
      "drive_api_error",
      `Google Drive content download failed (${response.status}) ${body}`,
      502,
    );
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function getFileMetadata(
  fileId: string,
  accessToken: string,
): Promise<DriveFileMetadata> {
  const url = buildDriveUrl(`/files/${encodeURIComponent(fileId)}`, {
    fields: "id,name,mimeType,modifiedTime,headRevisionId,size,parents",
  });

  return fetchDriveJson<DriveFileMetadata>(url, accessToken);
}

async function findSiblingMetaFile(
  sourceFileName: string,
  parentFolderId: string | undefined,
  accessToken: string,
): Promise<DriveFileMetadata | null> {
  if (!parentFolderId) {
    return null;
  }

  const metaFileName = `${sourceFileName}.meta.md`;
  const url = buildDriveUrl("/files", {
    q: `'${escapeDriveQueryLiteral(parentFolderId)}' in parents and name='${
      escapeDriveQueryLiteral(metaFileName)
    }' and trashed=false`,
    fields: "files(id,name,mimeType,modifiedTime,headRevisionId,size,parents)",
    pageSize: "1",
  });
  const result = await fetchDriveJson<{ files?: DriveFileMetadata[] }>(
    url,
    accessToken,
  );

  return result.files?.[0] ?? null;
}

function isMarkdownFile(
  metadata: DriveFileMetadata,
  sourceFile: SourceFileRow,
): boolean {
  const mimeType = metadata.mimeType || sourceFile.mime_type;
  const name = metadata.name || sourceFile.title;

  return mimeType === "text/markdown" ||
    (mimeType === "text/plain" && /\.md(?:own)?$/i.test(name));
}

function stableHeadRevisionId(metadata: DriveFileMetadata): string {
  return metadata.headRevisionId ?? metadata.modifiedTime ??
    `drive-file-${metadata.id}`;
}

function toNullableNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function slugify(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 32);

  return normalized || "preamble";
}

function sectionToRow(section: SourceSection, sourceFileVersionId: string) {
  return {
    source_file_version_id: sourceFileVersionId,
    level: section.level,
    heading: section.heading,
    body: section.body,
    position_index: section.position_index,
    has_placeholders: section.has_placeholders,
    slug: slugify(section.heading || "preamble"),
  };
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const bytesBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const digest = await crypto.subtle.digest("SHA-256", bytesBuffer);

  return bytesToHex(digest);
}

function authorityUpdateFrom(
  authority: SourceAuthorityLevel,
  authoritySource: SourceAuthoritySource,
): AuthorityUpdate {
  if (authoritySource === "default") {
    return {};
  }

  return {
    authority,
    authority_source: authoritySource,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        status: "error",
        code: "unsupported_method",
        message: "parse-source-file only supports POST.",
      },
      405,
    );
  }

  let requestBody: Required<ParseSourceFileRequest> | null = null;

  try {
    requestBody = await parseRequestBody(request);
    const accessToken = await getDriveAccessToken();
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: sourceFile, error: sourceFileError } = await supabase
      .from("source_files")
      .select("id,drive_file_id,title,mime_type")
      .eq("id", requestBody.source_file_id)
      .single<SourceFileRow>();

    if (sourceFileError || !sourceFile) {
      throw new EdgeFunctionError(
        "db_write_failed",
        sourceFileError?.message ?? "source_files row was not found.",
        500,
      );
    }

    const metadata = await getFileMetadata(
      requestBody.drive_file_id,
      accessToken,
    );
    const contentBytes = await fetchDriveBytes(
      requestBody.drive_file_id,
      accessToken,
    );
    const headRevisionId = stableHeadRevisionId(metadata);
    const sizeBytes = toNullableNumber(metadata.size, contentBytes.byteLength);
    const modifiedTime = metadata.modifiedTime ?? null;

    let sourceFileVersionId: string;
    let sectionsCount = 0;
    let authorityUpdate: AuthorityUpdate = {};

    if (isMarkdownFile(metadata, sourceFile)) {
      const rawText = new TextDecoder().decode(contentBytes);
      const parsed = parseFrontmatter(rawText);
      const sections = parseMarkdownSections(parsed.body);

      authorityUpdate = authorityUpdateFrom(
        parsed.authority,
        parsed.authority_source,
      );

      const { data: version, error: versionError } = await supabase
        .from("source_file_versions")
        .upsert({
          source_file_id: sourceFile.id,
          head_revision_id: headRevisionId,
          size_bytes: sizeBytes,
          modified_time: modifiedTime,
          raw_text: parsed.body,
          raw_text_preview: parsed.body.slice(0, 500),
          parse_status: "processed",
        }, { onConflict: "source_file_id,head_revision_id" })
        .select("id")
        .single<{ id: string }>();

      if (versionError || !version) {
        throw new EdgeFunctionError(
          "db_write_failed",
          versionError?.message ?? "Failed to write source_file_versions row.",
          500,
        );
      }

      sourceFileVersionId = version.id;

      const { error: deleteSectionsError } = await supabase
        .from("source_sections")
        .delete()
        .eq("source_file_version_id", sourceFileVersionId);

      if (deleteSectionsError) {
        throw new EdgeFunctionError(
          "db_write_failed",
          deleteSectionsError.message,
          500,
        );
      }

      if (sections.length > 0) {
        const { error: sectionsError } = await supabase
          .from("source_sections")
          .insert(
            sections.map((section) =>
              sectionToRow(section, sourceFileVersionId)
            ),
          );

        if (sectionsError) {
          throw new EdgeFunctionError(
            "db_write_failed",
            sectionsError.message,
            500,
          );
        }
      }

      sectionsCount = sections.length;
    } else {
      const contentHash = await sha256Hex(contentBytes);
      const siblingMetaFile = await findSiblingMetaFile(
        metadata.name,
        metadata.parents?.[0],
        accessToken,
      );

      if (siblingMetaFile) {
        const metaText = new TextDecoder().decode(
          await fetchDriveBytes(siblingMetaFile.id, accessToken),
        );
        const parsedMeta = parseMetaMd(metaText);
        authorityUpdate = authorityUpdateFrom(
          parsedMeta.authority,
          parsedMeta.authority_source,
        );
      }

      const { data: version, error: versionError } = await supabase
        .from("source_file_versions")
        .upsert({
          source_file_id: sourceFile.id,
          head_revision_id: headRevisionId,
          content_hash: contentHash,
          size_bytes: sizeBytes,
          modified_time: modifiedTime,
          raw_text: null,
          raw_text_preview: null,
          parse_status: "processed",
        }, { onConflict: "source_file_id,head_revision_id" })
        .select("id")
        .single<{ id: string }>();

      if (versionError || !version) {
        throw new EdgeFunctionError(
          "db_write_failed",
          versionError?.message ?? "Failed to write source_file_versions row.",
          500,
        );
      }

      sourceFileVersionId = version.id;

      const { error: deleteSectionsError } = await supabase
        .from("source_sections")
        .delete()
        .eq("source_file_version_id", sourceFileVersionId);

      if (deleteSectionsError) {
        throw new EdgeFunctionError(
          "db_write_failed",
          deleteSectionsError.message,
          500,
        );
      }
    }

    const { error: updateSourceError } = await supabase
      .from("source_files")
      .update({
        ...authorityUpdate,
        current_version_id: sourceFileVersionId,
        processing_status: "processed",
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", sourceFile.id);

    if (updateSourceError) {
      throw new EdgeFunctionError(
        "db_write_failed",
        updateSourceError.message,
        500,
      );
    }

    return jsonResponse({
      status: "ok",
      source_file_version_id: sourceFileVersionId,
      sections_count: sectionsCount,
    });
  } catch (error) {
    if (requestBody?.source_file_id) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceRoleKey = Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY",
        );

        if (supabaseUrl && supabaseServiceRoleKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
          await supabase
            .from("source_files")
            .update({
              processing_status: "failed",
              last_synced_at: new Date().toISOString(),
            })
            .eq("id", requestBody.source_file_id);
        }
      } catch (statusUpdateError) {
        console.error(
          "Failed to mark source file as failed",
          statusUpdateError,
        );
      }
    }

    return errorResponse(error);
  }
});
