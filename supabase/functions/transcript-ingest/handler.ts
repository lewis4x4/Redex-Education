import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ingestVideoTranscript,
  TranscriptIngestError,
  validateTranscriptSegments,
} from "../_shared/videoTranscriptIngest.ts";
import {
  assertServiceRoleCaller,
  errorResponse,
  jsonResponse,
  optionalString,
  parseJsonRecord,
  requiredString,
  requireEnv,
  requireMediaStageEnabled,
  requirePostOrOptions,
  type EnvReader,
} from "../_shared/mediaWrapper.ts";

interface TranscriptIngestHandlerDeps {
  getEnv: EnvReader;
  createSupabaseClient?: (url: string, serviceRoleKey: string) => { from: (table: string) => any };
}

function transcriptSegmentsBody(body: Record<string, unknown>): unknown {
  return body.transcriptSegments ?? body.transcript_segments;
}

function storagePathBody(body: Record<string, unknown>): string {
  const value = optionalString(body, "storagePath") ?? optionalString(body, "storage_path");

  if (!value) {
    throw new TranscriptIngestError("missing_storage_path", "storagePath is required for transcript ingest.", 400);
  }

  return value;
}

export function createTranscriptIngestHandler(deps: TranscriptIngestHandlerDeps): (request: Request) => Promise<Response> {
  const createSupabaseClient = deps.createSupabaseClient ?? ((url: string, serviceRoleKey: string) =>
    createClient(url, serviceRoleKey, { db: { schema: "redex" } }) as unknown as { from: (table: string) => any });

  return async (request: Request): Promise<Response> => {
    const methodResponse = requirePostOrOptions(request, "transcript-ingest");
    if (methodResponse) return methodResponse;

    try {
      assertServiceRoleCaller(request, deps.getEnv, "transcript-ingest");
      requireMediaStageEnabled(deps.getEnv);
      const supabaseUrl = requireEnv(deps.getEnv, "SUPABASE_URL");
      const serviceRoleKey = requireEnv(deps.getEnv, "SUPABASE_SERVICE_ROLE_KEY");
      const body = await parseJsonRecord(request);
      const transcriptSegments = validateTranscriptSegments(transcriptSegmentsBody(body));
      const result = await ingestVideoTranscript({
        supabase: createSupabaseClient(supabaseUrl, serviceRoleKey),
        mediaAssetId: requiredString(body, "mediaAssetId"),
        storagePath: storagePathBody(body),
        lessonTitle: requiredString(body, "lessonTitle"),
        transcriptSegments,
      });

      return jsonResponse({ status: "ok", ...result });
    } catch (error) {
      if (error instanceof TranscriptIngestError) {
        return jsonResponse({ status: "error", code: error.code, message: error.message }, error.status);
      }

      return errorResponse(error, "transcript_ingest_failed");
    }
  };
}
