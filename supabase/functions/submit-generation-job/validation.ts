import {
  TranscriptIngestError,
  validateTranscriptSegments,
} from "../_shared/videoTranscriptIngest.ts";

export class EdgeFunctionError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export type JobType = "full" | "section";

export interface SubmitGenerationJobRequest {
  moduleId?: string;
  jobType?: JobType;
  targetSectionId?: string | null;
  inputPayload?: unknown;
  promptVersion?: string;
}

export type ParsedSubmitGenerationJobRequest =
  & Required<
    Pick<SubmitGenerationJobRequest, "moduleId" | "jobType" | "inputPayload">
  >
  & Pick<SubmitGenerationJobRequest, "targetSectionId" | "promptVersion">;

const DEFAULT_HEYGEN_MAX_POLLS = 60;
const RENDER_VIDEO_ATTEMPT_BUFFER = 3;

const ALLOWED_EXPLICIT_OPERATIONS = new Set([
  "fullPipeline",
  "analyzeSource",
  "generateOutline",
  "generateLessons",
  "generateAssessment",
  "critiqueModule",
  "regenerateWithFixes",
  "regenerateSection",
  "renderVideoLesson",
]);

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
    .test(value);
}

function nonNegativeIntegerField(
  record: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : undefined;
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  code: string,
): string {
  const value = stringField(record, key);

  if (!value) {
    throw new EdgeFunctionError(
      code,
      `${key} is required for renderVideoLesson.`,
      400,
    );
  }

  return value;
}

function validateOptionalDuration(video: Record<string, unknown>): void {
  if (
    !("duration_seconds" in video) || video.duration_seconds === undefined ||
    video.duration_seconds === null
  ) {
    return;
  }

  if (
    typeof video.duration_seconds !== "number" ||
    !Number.isFinite(video.duration_seconds) || video.duration_seconds < 0
  ) {
    throw new EdgeFunctionError(
      "invalid_video_duration",
      "video.duration_seconds must be a non-negative number when provided.",
      400,
    );
  }
}

function validateRenderVideoLessonInput(input: unknown): void {
  if (!isRecord(input)) {
    throw new EdgeFunctionError(
      "invalid_render_video_input",
      "renderVideoLesson input must be an object.",
      400,
    );
  }

  const moduleVersionId = requireString(
    input,
    "moduleVersionId",
    "missing_module_version_id",
  );

  if (!isUuid(moduleVersionId)) {
    throw new EdgeFunctionError(
      "invalid_module_version_id",
      "moduleVersionId must be a UUID for renderVideoLesson.",
      400,
    );
  }

  const lessonId = stringField(input, "lessonId");
  const lessonIndex = nonNegativeIntegerField(input, "lessonIndex");

  if (!lessonId && lessonIndex === undefined) {
    throw new EdgeFunctionError(
      "missing_lesson_target",
      "renderVideoLesson requires lessonId or lessonIndex.",
      400,
    );
  }

  if (lessonId && !isUuid(lessonId)) {
    throw new EdgeFunctionError(
      "invalid_lesson_id",
      "lessonId must be a UUID when provided.",
      400,
    );
  }

  if (
    "lessonIndex" in input && input.lessonIndex !== undefined &&
    input.lessonIndex !== null && lessonIndex === undefined
  ) {
    throw new EdgeFunctionError(
      "invalid_lesson_index",
      "lessonIndex must be a non-negative integer when provided.",
      400,
    );
  }

  requireString(input, "lessonTitle", "missing_lesson_title");
  requireString(input, "approvedScriptMarkdown", "missing_approved_script");
  requireString(input, "avatarId", "missing_avatar_id");

  if (!isRecord(input.video)) {
    throw new EdgeFunctionError(
      "missing_video_payload",
      "video is required for renderVideoLesson.",
      400,
    );
  }

  try {
    validateTranscriptSegments(input.video.transcript_segments);
  } catch (error) {
    if (error instanceof TranscriptIngestError) {
      throw new EdgeFunctionError(
        error.code,
        error.message.replace("Transcript ingest", "renderVideoLesson"),
        error.status,
      );
    }

    throw error;
  }

  validateOptionalDuration(input.video);
}

export function operationFrom(inputPayload: unknown): string {
  if (isRecord(inputPayload)) {
    const operation = inputPayload.operation;
    return typeof operation === "string" && operation.trim().length > 0
      ? operation.trim()
      : "fullPipeline";
  }

  return "fullPipeline";
}

export function validateSubmitInputPayload(inputPayload: unknown): void {
  if (!isRecord(inputPayload)) {
    return;
  }

  if (
    "operation" in inputPayload && inputPayload.operation !== undefined &&
    inputPayload.operation !== null
  ) {
    if (
      typeof inputPayload.operation !== "string" ||
      inputPayload.operation.trim().length === 0
    ) {
      throw new EdgeFunctionError(
        "invalid_operation",
        "inputPayload.operation must be a non-empty string when provided.",
        400,
      );
    }

    const operation = inputPayload.operation.trim();

    if (!ALLOWED_EXPLICIT_OPERATIONS.has(operation)) {
      throw new EdgeFunctionError(
        "unsupported_operation",
        `Unsupported generation operation: ${operation}.`,
        400,
      );
    }

    if (operation === "renderVideoLesson") {
      validateRenderVideoLessonInput(inputPayload.input);
    }
  }
}

export function maxAttemptsForOperation(operation: string): number | null {
  if (operation !== "renderVideoLesson") {
    return null;
  }

  const configuredMaxPolls = Number(
    Deno.env.get("HEYGEN_MAX_POLLS") ?? String(DEFAULT_HEYGEN_MAX_POLLS),
  );
  const maxPolls = Number.isFinite(configuredMaxPolls) && configuredMaxPolls > 0
    ? Math.ceil(configuredMaxPolls)
    : DEFAULT_HEYGEN_MAX_POLLS;

  return maxPolls + RENDER_VIDEO_ATTEMPT_BUFFER;
}

export async function idempotencyKeyFor(
  body: ParsedSubmitGenerationJobRequest,
): Promise<string> {
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
