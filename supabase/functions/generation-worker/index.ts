import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  createCourseFoundryAiClientServer,
  ProviderNotConfiguredError,
  type CostedAiResult,
} from "../_shared/courseFoundryAiClientServer.ts";
import {
  buildHeyGenCreateVideoRequest,
  buildMediaStoragePath,
  downloadHeyGenMedia,
  getHeyGenVideo,
  HeyGenMediaError,
  submitHeyGenVideo,
  type HeyGenVideoDetail,
} from "../_shared/heygenMedia.ts";
import {
  ingestVideoTranscript,
  TranscriptIngestError,
  validateTranscriptSegments,
  type VideoTranscriptSegmentInput,
} from "../_shared/videoTranscriptIngest.ts";
import {
  writeSourceBindings,
  type CitedClaim,
  type GeneratedModulePreview,
  type SourceBindingWriteResult,
  type SourceSection,
  type UnsupportedClaimReport,
} from "../_shared/sourceBindingsWriter.ts";

type RedexSupabaseClient = SupabaseClient<any, "public", "redex", any, any>;

const STAGES = [
  "parse",
  "outline",
  "generate_lessons",
  "source_binding",
  "generate_assessments",
  "self_critique",
  "media_submit",
  "media_poll",
  "transcript_ingest",
  "assemble",
] as const;

type StageName = typeof STAGES[number];
type StageStatus = "pending" | "running" | "succeeded" | "failed";

type StageMap = Record<string, {
  status: StageStatus;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  cost_cents?: number;
  estimated_cost_cents?: number;
  error?: string;
  skipped?: boolean;
}>;

interface GenerationJobRow {
  id: string;
  module_id: string;
  job_type: "full" | "section";
  target_section_id: string | null;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  stage_map: StageMap | null;
  current_stage: string | null;
  attempt_count: number;
  model_used: string | null;
  prompt_version: string | null;
  estimated_cost_cents: number | null;
  actual_cost_cents: number;
  cost_breakdown: Record<string, number> | null;
  input_payload: unknown;
  output_payload: Record<string, unknown> | null;
  last_error_message: string | null;
  last_error_stage: string | null;
  lease_token: string | null;
  locked_at: string | null;
  lease_expires_at: string | null;
  next_run_at: string | null;
  max_attempts: number | null;
  last_failure_class: string | null;
  worker_id: string | null;
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

class HeyGenNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HeyGenNotConfiguredError";
  }
}

class MediaStagePendingError extends Error {
  constructor(
    message: string,
    public output: Record<string, unknown>,
    public nextRunAt: string,
  ) {
    super(message);
    this.name = "MediaStagePendingError";
  }
}

interface RenderVideoLessonInput {
  moduleVersionId: string;
  lessonId?: string;
  lessonIndex?: number;
  lessonTitle: string;
  approvedScriptMarkdown: string;
  avatarId: string;
  voiceId?: string;
  video: {
    transcript_segments: VideoTranscriptSegmentInput[];
    duration_seconds?: number;
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new EdgeFunctionError("missing_env", `${name} is required.`, 500);
  }

  return value;
}

function assertServiceRoleCaller(request: Request, serviceRoleKey: string): void {
  const authorization = request.headers.get("authorization") ?? "";

  if (authorization !== `Bearer ${serviceRoleKey}`) {
    throw new EdgeFunctionError(
      "auth_failed",
      "generation-worker requires the service-role bearer token.",
      401,
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inputEnvelope(job: GenerationJobRow): Record<string, unknown> {
  return isRecord(job.input_payload) ? job.input_payload : { input: job.input_payload };
}

function operationFor(job: GenerationJobRow): string | null {
  const envelope = inputEnvelope(job);
  return typeof envelope.operation === "string" ? envelope.operation : null;
}

function baseInput(job: GenerationJobRow): Record<string, unknown> {
  const envelope = inputEnvelope(job);
  return isRecord(envelope.input) ? envelope.input : envelope;
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

function moduleVersionIdFor(job: GenerationJobRow): string {
  const input = baseInput(job);
  const envelope = inputEnvelope(job);
  const moduleVersionId =
    stringField(input, "moduleVersionId") ??
    stringField(input, "module_version_id") ??
    stringField(envelope, "moduleVersionId") ??
    stringField(envelope, "module_version_id");

  if (!moduleVersionId || !isUuid(moduleVersionId)) {
    throw new EdgeFunctionError(
      "missing_module_version_id",
      "Source binding writes require an explicit UUID moduleVersionId/module_version_id.",
      400,
    );
  }

  return moduleVersionId;
}

function relevantStages(job: GenerationJobRow): StageName[] {
  switch (operationFor(job)) {
    case "analyzeSource":
      return ["parse", "assemble"];
    case "generateOutline":
      return ["parse", "outline", "assemble"];
    case "generateLessons":
      return ["generate_lessons", "source_binding", "assemble"];
    case "generateAssessment":
      return ["generate_assessments", "assemble"];
    case "critiqueModule":
      return ["self_critique", "assemble"];
    case "regenerateWithFixes":
      return ["generate_lessons", "source_binding", "self_critique", "assemble"];
    case "renderVideoLesson":
      return ["media_submit", "media_poll", "transcript_ingest", "assemble"];
    case "regenerateSection":
      return ["generate_lessons", "assemble"];
  }

  if (job.job_type === "section") {
    return ["generate_lessons", "assemble"];
  }

  return [
    "parse",
    "outline",
    "generate_lessons",
    "source_binding",
    "generate_assessments",
    "self_critique",
    "assemble",
  ];
}

function ensureStageMap(job: GenerationJobRow): StageMap {
  const existing = isRecord(job.stage_map) ? job.stage_map as StageMap : {};
  const relevant = new Set(relevantStages(job));
  const map: StageMap = {};

  for (const stage of STAGES) {
    const prior = existing[stage];

    if (prior) {
      map[stage] = prior;
      continue;
    }

    map[stage] = relevant.has(stage)
      ? { status: "pending", cost_cents: 0 }
      : {
        status: "succeeded",
        skipped: true,
        cost_cents: 0,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };
  }

  return map;
}

function nextStage(job: GenerationJobRow, stageMap: StageMap): StageName | null {
  const relevant = new Set(relevantStages(job));

  for (const stage of STAGES) {
    if (!relevant.has(stage)) {
      continue;
    }

    if (stageMap[stage]?.status !== "succeeded") {
      return stage;
    }
  }

  return null;
}

function outputPayload(job: GenerationJobRow): Record<string, unknown> {
  return isRecord(job.output_payload) ? job.output_payload : {};
}

function sumCosts(costBreakdown: Record<string, number>): number {
  return Object.values(costBreakdown).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
}

function asCostBreakdown(job: GenerationJobRow): Record<string, number> {
  if (!isRecord(job.cost_breakdown)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(job.cost_breakdown).map(([key, value]) => [key, typeof value === "number" ? value : 0]),
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof ProviderNotConfiguredError) {
    return error.message;
  }

  return error instanceof Error ? error.message : String(error);
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "Error";
}

function failureClass(error: unknown): string {
  if (error instanceof ProviderNotConfiguredError || error instanceof HeyGenNotConfiguredError) {
    return "configuration";
  }

  if (error instanceof HeyGenMediaError) {
    return error.retryable ? "provider_transient" : "provider_output";
  }

  if (error instanceof EdgeFunctionError || error instanceof TranscriptIngestError) {
    return error.status >= 500 ? "infrastructure" : "nonretryable";
  }

  const message = errorMessage(error);
  if (/AI provider request failed \((429|5\d\d)\)/i.test(message)) {
    return "provider_transient";
  }

  if (/fetch|network|timeout|temporar|rate limit/i.test(message)) {
    return "transient";
  }

  if (/validation failed|non-JSON|did not include/i.test(message) || errorName(error) === "AiProviderError") {
    return "provider_output";
  }

  return "unknown";
}

function isRetryableFailure(error: unknown): boolean {
  // Until provider request IDs/idempotency metadata are persisted per stage, only
  // retry failures known to be pre-provider infrastructure failures. Ambiguous
  // provider/network/unknown failures are terminal/manual-recovery to avoid
  // duplicate model work and duplicate provider cost.
  return failureClass(error) === "infrastructure";
}

function retryDelayMs(attemptCount: number): number {
  const boundedAttempt = Math.max(1, Math.min(attemptCount, 6));
  return Math.min(60 * 60 * 1000, 30_000 * 2 ** (boundedAttempt - 1));
}

function nextRetryAt(attemptCount: number): string {
  return new Date(Date.now() + retryDelayMs(attemptCount)).toISOString();
}

function jobLeaseFor(job: GenerationJobRow, expectedStage: StageName): {
  jobId: string;
  leaseToken: string;
  expectedStage: StageName;
} {
  if (!job.lease_token) {
    throw new EdgeFunctionError("missing_lease_token", "Source binding writes require an active job lease.", 409);
  }

  return {
    jobId: job.id,
    leaseToken: job.lease_token,
    expectedStage,
  };
}

function clearLeaseFields(): Record<string, null> {
  return {
    lease_token: null,
    locked_at: null,
    lease_expires_at: null,
    worker_id: null,
  };
}

async function failStaleGenerationJobs(supabase: RedexSupabaseClient, workerId: string): Promise<void> {
  const { error } = await supabase.rpc("fail_stale_generation_jobs", { p_worker_id: workerId });

  if (error) {
    throw new EdgeFunctionError("stale_job_recovery_failed", error.message, 500);
  }
}

async function updateLeasedJob(
  supabase: RedexSupabaseClient,
  job: GenerationJobRow,
  payload: Record<string, unknown>,
  expectedStage?: string | null,
): Promise<void> {
  let query = supabase
    .from("generation_jobs")
    .update(payload)
    .eq("id", job.id);

  if (job.lease_token) {
    query = query.eq("lease_token", job.lease_token).eq("status", "running");
  }

  if (expectedStage !== undefined) {
    query = expectedStage === null ? query.is("current_stage", null) : query.eq("current_stage", expectedStage);
  }

  const { data, error } = await query.select("id").maybeSingle();

  if (error) {
    throw new EdgeFunctionError("db_write_failed", error.message, 500);
  }

  if (!data) {
    throw new EdgeFunctionError("lease_lost", "Generation job lease changed before worker update completed.", 409);
  }
}

function stageOutputKey(stage: StageName): string {
  return stage;
}

function isGeneratedModulePreview(value: unknown): value is GeneratedModulePreview {
  return isRecord(value) && Array.isArray(value.lessons) && typeof value.module_title === "string";
}

function boundGeneratedModule(outputs: Record<string, unknown>): unknown {
  const sourceBinding = outputs.source_binding;

  if (isRecord(sourceBinding) && isGeneratedModulePreview(sourceBinding.generated_module)) {
    return sourceBinding.generated_module;
  }

  return outputs.generate_lessons;
}

function finalOutput(job: GenerationJobRow, outputs: Record<string, unknown>): unknown {
  const generatedModule = boundGeneratedModule(outputs);

  switch (operationFor(job)) {
    case "analyzeSource":
      return outputs.parse;
    case "generateOutline":
      return outputs.outline;
    case "generateLessons":
      return generatedModule;
    case "generateAssessment":
      return outputs.generate_assessments;
    case "critiqueModule":
      return outputs.self_critique;
    case "regenerateWithFixes":
      return generatedModule;
    case "renderVideoLesson":
      return outputs.transcript_ingest ?? outputs.media_poll ?? outputs.media_submit ?? null;
    case "regenerateSection":
      return generatedModule;
    default:
      return {
        module_id: job.module_id,
        job_type: job.job_type,
        target_section_id: job.target_section_id,
        parse: outputs.parse ?? null,
        outline: outputs.outline ?? null,
        lessons: generatedModule ?? null,
        source_binding: outputs.source_binding ?? null,
        assessments: outputs.generate_assessments ?? null,
        self_critique: outputs.self_critique ?? null,
      };
  }
}

function sourceSectionsFromValue(value: unknown): SourceSection[] {
  if (Array.isArray(value)) {
    return value.flatMap(sourceSectionsFromValue);
  }

  if (!isRecord(value)) {
    return [];
  }

  const ownSection = typeof value.id === "string" && typeof value.body === "string" && typeof value.heading === "string"
    ? [value as unknown as SourceSection]
    : [];
  const nestedSections = Array.isArray(value.sections) ? sourceSectionsFromValue(value.sections) : [];
  const sourceSections = Array.isArray(value.sourceSections) ? sourceSectionsFromValue(value.sourceSections) : [];
  const snakeSourceSections = Array.isArray(value.source_sections) ? sourceSectionsFromValue(value.source_sections) : [];

  return [...ownSection, ...nestedSections, ...sourceSections, ...snakeSourceSections];
}

async function hydrateSourcesFromLibrarySelection(
  supabase: RedexSupabaseClient,
  input: Record<string, unknown>,
): Promise<unknown> {
  const selectedLibraryFileIds = Array.isArray(input.selectedLibraryFileIds)
    ? input.selectedLibraryFileIds.filter((value): value is string => typeof value === "string")
    : [];
  const existingSources = input.sources;

  if (
    selectedLibraryFileIds.length === 0 ||
    !isRecord(existingSources) ||
    (typeof existingSources.raw_text === "string" && existingSources.raw_text.trim().length > 0)
  ) {
    return existingSources;
  }

  const { data: files, error: filesError } = await supabase
    .from("source_files")
    .select("id,title,current_version_id")
    .in("id", selectedLibraryFileIds);

  if (filesError || !files) {
    return existingSources;
  }

  const sections: Array<Record<string, unknown>> = [];
  for (const file of files) {
    if (!file.current_version_id) continue;
    const { data: sectionRows } = await supabase
      .from("source_sections")
      .select("id,level,heading,body,position_index,has_placeholders")
      .eq("source_file_version_id", file.current_version_id)
      .order("position_index", { ascending: true });

    for (const section of sectionRows ?? []) {
      sections.push(section);
    }
  }

  if (sections.length === 0) {
    return existingSources;
  }

  return {
    id: `library-${selectedLibraryFileIds.join("-")}`,
    title: "Drive Library Selection",
    type: "markdown",
    processing_status: "processed",
    raw_text: sections.map((section) => `## ${String(section.heading ?? "")}` + "\n\n" + String(section.body ?? "")).join("\n\n"),
    raw_text_preview: sections.map((section) => String(section.body ?? "")).join("\n\n").slice(0, 500),
    sections,
  };
}

function markerText(reasons: string[]): string {
  return uniqueStrings(reasons).map((reason) => `[NEEDS_REVIEW: ${reason}]`).join(" ");
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function unsupportedReportsByLesson(reports: UnsupportedClaimReport[]): Map<string, UnsupportedClaimReport[]> {
  const byLesson = new Map<string, UnsupportedClaimReport[]>();

  for (const report of reports) {
    const key = `${report.module_index}:${report.lesson_index}`;
    byLesson.set(key, [...(byLesson.get(key) ?? []), report]);
  }

  return byLesson;
}

function annotateGeneratedModule(
  module: GeneratedModulePreview,
  unsupportedClaims: UnsupportedClaimReport[],
  entailmentFailures: CitedClaim[],
  placeholderLessonKeys: Set<string>,
): GeneratedModulePreview {
  const unsupportedByLesson = unsupportedReportsByLesson(unsupportedClaims);
  const failedByLesson = unsupportedReportsByLesson(entailmentFailures.map((claim) => ({ ...claim, reason: "missing_citation" })));

  return {
    ...module,
    lessons: module.lessons.map((lesson) => {
      const key = `${lesson.module_index}:${lesson.lesson_index}`;
      const lessonUnsupported = unsupportedByLesson.get(key) ?? [];
      const lessonFailures = failedByLesson.get(key) ?? [];
      const reasons = [
        ...lessonUnsupported.map((report) => report.reason),
        ...lessonFailures.map(() => "entailment_failed"),
        ...(placeholderLessonKeys.has(key) ? ["source_placeholder"] : []),
      ];

      if (reasons.length === 0) {
        return lesson;
      }

      const marker = markerText(reasons);
      const nextStatus = placeholderLessonKeys.has(key) ? "missing_source" : "unsupported_claim";
      const annotatedBody = lesson.body_markdown && lessonFailures[0]?.claim && lesson.body_markdown.includes(lessonFailures[0].claim)
        ? lesson.body_markdown.replace(lessonFailures[0].claim, `${lessonFailures[0].claim} [NEEDS_REVIEW: entailment_failed]`)
        : lesson.body_markdown;

      return {
        ...lesson,
        body_markdown: annotatedBody,
        status: nextStatus,
        status_note: [lesson.status_note, marker].filter(Boolean).join(" "),
      };
    }),
  };
}

function assessmentModulePreview(output: unknown): GeneratedModulePreview | null {
  if (!isRecord(output) || !Array.isArray(output.questions)) {
    return null;
  }

  return {
    module_title: "Generated assessment",
    generated_at: new Date().toISOString(),
    is_complete: true,
    lessons: [{
      lesson_index: 0,
      module_index: 0,
      title: "Generated assessment questions",
      lesson_type: "quiz",
      quiz_questions: output.questions
        .filter((question): question is { id: string; question: string; options: string[] } =>
          isRecord(question) && typeof question.id === "string" && typeof question.question === "string" && Array.isArray(question.options) && question.options.every((option) => typeof option === "string")
        ),
      status: "draft",
    }],
  };
}

function publishBlockersFor(params: {
  result: SourceBindingWriteResult;
  entailmentFailures: CitedClaim[];
}): Array<Record<string, unknown>> {
  const blockers: Array<Record<string, unknown>> = [];

  for (const report of params.result.unsupportedClaims) {
    blockers.push({
      id: `unsupported-${report.module_index}-${report.lesson_index}-${blockers.length}`,
      source: "lesson_unsupported_claim",
      severity: "blocker",
      location: report.lesson_title,
      summary: "Generated claim is missing a resolvable source citation.",
      detail: report.claim,
    });
  }

  for (const claim of params.entailmentFailures) {
    blockers.push({
      id: `entailment-${claim.module_index}-${claim.lesson_index}-${blockers.length}`,
      source: "lesson_unsupported_claim",
      severity: "blocker",
      location: claim.lesson_title,
      summary: "Cited section did not entail the generated claim.",
      detail: claim.claim,
    });
  }

  for (const sectionId of params.result.placeholderSectionIds) {
    blockers.push({
      id: `placeholder-${sectionId}`,
      source: "source_placeholder",
      severity: "blocker",
      location: sectionId,
      summary: "Cited source section contains placeholder content.",
      detail: "Replace the source section with approved language before publish.",
    });
  }

  return blockers;
}

async function runSourceBindingStage(
  job: GenerationJobRow,
  supabase: RedexSupabaseClient,
): Promise<CostedAiResult<unknown>> {
  const aiClient = createCourseFoundryAiClientServer();
  const input = baseInput(job);
  const outputs = outputPayload(job);
  const generatedModule = boundGeneratedModule(outputs);

  if (!isGeneratedModulePreview(generatedModule)) {
    throw new EdgeFunctionError("missing_generated_module", "source_binding requires generate_lessons output.", 500);
  }

  const result = await writeSourceBindings({
    supabase,
    moduleId: job.module_id,
    moduleVersionId: moduleVersionIdFor(job),
    generatedModule,
    sourceSections: sourceSectionsFromValue(input.sources ?? input.sourceSections ?? input.source_sections ?? {}),
    jobLease: jobLeaseFor(job, "source_binding"),
  });
  const sectionById = new Map(result.resolvedSourceSections.map((section) => [section.id, section]));
  const entailmentResults: Array<Record<string, unknown>> = [];
  const entailmentFailures: CitedClaim[] = [];
  let entailmentCost = 0;
  let estimatedEntailmentCost = 0;

  for (const claim of result.claims) {
    for (const sectionId of claim.section_ids) {
      const section = sectionById.get(sectionId);

      if (!section) {
        continue;
      }

      const entailment = await aiClient.checkEntailment({
        claim: claim.claim,
        sourceSection: { id: section.id, heading: section.heading, body: section.body },
      });
      entailmentCost += entailment.cost_cents;
      estimatedEntailmentCost += entailment.estimated_cost_cents;
      entailmentResults.push({
        ...claim,
        source_section_id: section.id,
        entailed: entailment.output.entailed,
        confidence: entailment.output.confidence,
        reasoning: entailment.output.reasoning,
        cost_cents: entailment.cost_cents,
      });

      if (!entailment.output.entailed) {
        entailmentFailures.push(claim);
      }
    }
  }

  const placeholderLessonKeys = new Set<string>();
  for (const claim of result.claims) {
    if (claim.section_ids.some((sectionId) => result.placeholderSectionIds.includes(sectionId))) {
      placeholderLessonKeys.add(`${claim.module_index}:${claim.lesson_index}`);
    }
  }

  const annotatedModule = annotateGeneratedModule(
    generatedModule,
    result.unsupportedClaims,
    entailmentFailures,
    placeholderLessonKeys,
  );

  return {
    output: {
      writtenCount: result.writtenCount,
      flaggedConflicts: result.flaggedConflicts,
      unsupportedClaims: result.unsupportedClaims,
      placeholderSectionIds: result.placeholderSectionIds,
      has_placeholders: result.placeholderSectionIds.length > 0,
      publish_blockers: publishBlockersFor({ result, entailmentFailures }),
      entailment_results: entailmentResults,
      generated_module: annotatedModule,
    },
    cost_cents: entailmentCost,
    estimated_cost_cents: estimatedEntailmentCost,
    model_used: job.model_used ?? "source-binding",
    prompt_version: "source_binding@v1",
  };
}

function requireHeyGenMediaStageEnabled(): void {
  if (Deno.env.get("REDEX_ENABLE_HEYGEN_MEDIA_STAGE") !== "true") {
    throw new HeyGenNotConfiguredError("REDEX_ENABLE_HEYGEN_MEDIA_STAGE must be set to 'true' before HeyGen media stages can run.");
  }
}

function requireEnvValue(name: string): string {
  const value = Deno.env.get(name)?.trim();

  if (!value) {
    throw new HeyGenNotConfiguredError(`${name} is required before HeyGen media stages can run.`);
  }

  return value;
}

function nonNegativeIntegerField(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function requiredString(record: Record<string, unknown>, key: string, code: string): string {
  const value = stringField(record, key);

  if (!value) {
    throw new EdgeFunctionError(code, `${key} is required for renderVideoLesson.`, 400);
  }

  return value;
}

function validateRenderTranscriptSegments(value: unknown): VideoTranscriptSegmentInput[] {
  try {
    return validateTranscriptSegments(value);
  } catch (error) {
    if (error instanceof TranscriptIngestError) {
      throw new EdgeFunctionError(error.code, error.message.replace("Transcript ingest", "renderVideoLesson"), error.status);
    }

    throw error;
  }
}

function renderVideoLessonInput(job: GenerationJobRow): RenderVideoLessonInput {
  const input = baseInput(job);
  const video = isRecord(input.video) ? input.video : {};
  const moduleVersionId = requiredString(input, "moduleVersionId", "missing_module_version_id");

  if (!isUuid(moduleVersionId)) {
    throw new EdgeFunctionError("invalid_module_version_id", "moduleVersionId must be a UUID for renderVideoLesson.", 400);
  }

  const lessonId = stringField(input, "lessonId");
  const lessonIndex = nonNegativeIntegerField(input, "lessonIndex");

  if (!lessonId && lessonIndex === undefined) {
    throw new EdgeFunctionError("missing_lesson_target", "renderVideoLesson requires lessonId or lessonIndex.", 400);
  }

  if (lessonId && !isUuid(lessonId)) {
    throw new EdgeFunctionError("invalid_lesson_id", "lessonId must be a UUID when provided.", 400);
  }

  return {
    moduleVersionId,
    lessonId,
    lessonIndex,
    lessonTitle: requiredString(input, "lessonTitle", "missing_lesson_title"),
    approvedScriptMarkdown: requiredString(input, "approvedScriptMarkdown", "missing_approved_script"),
    avatarId: requiredString(input, "avatarId", "missing_avatar_id"),
    voiceId: stringField(input, "voiceId"),
    video: {
      transcript_segments: validateRenderTranscriptSegments(video.transcript_segments),
      duration_seconds: typeof video.duration_seconds === "number" && video.duration_seconds >= 0 ? video.duration_seconds : undefined,
    },
  };
}

function mediaAssetStatusFor(status: HeyGenVideoDetail["status"]): string {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    case "pending":
      return "submitted";
    case "processing":
    case "unknown":
      return "rendering";
  }
}

async function createMediaAsset(
  supabase: RedexSupabaseClient,
  job: GenerationJobRow,
  input: RenderVideoLessonInput,
): Promise<{ id: string; render_attempt_count: number }> {
  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      module_id: job.module_id,
      module_version_id: input.moduleVersionId,
      training_lesson_id: input.lessonId ?? null,
      lesson_index: input.lessonIndex ?? null,
      lesson_title: input.lessonTitle,
      provider: "heygen",
      avatar_id: input.avatarId,
      status: "queued",
      render_attempt_count: 1,
    })
    .select("id,render_attempt_count")
    .single();

  if (error || !data) {
    throw new EdgeFunctionError("media_asset_write_failed", error?.message ?? "Could not create media asset.", 500);
  }

  return data as { id: string; render_attempt_count: number };
}

async function updateMediaAsset(
  supabase: RedexSupabaseClient,
  mediaAssetId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { data, error } = await supabase
    .from("media_assets")
    .update(payload)
    .eq("id", mediaAssetId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new EdgeFunctionError("media_asset_write_failed", error.message, 500);
  }

  if (!data) {
    throw new EdgeFunctionError("media_asset_not_found", "Media asset was not found for update.", 500);
  }
}

function recordOutput(value: unknown, stage: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new EdgeFunctionError(`missing_${stage}_output`, `${stage} output is required before this media stage can run.`, 500);
  }

  return value;
}

function stringOutput(value: Record<string, unknown>, key: string, stage: string): string {
  const output = stringField(value, key);

  if (!output) {
    throw new EdgeFunctionError(`missing_${key}`, `${stage} output must include ${key}.`, 500);
  }

  return output;
}

async function runMediaSubmitStage(job: GenerationJobRow, supabase: RedexSupabaseClient): Promise<CostedAiResult<unknown>> {
  requireHeyGenMediaStageEnabled();
  const heygenApiKey = requireEnvValue("HEYGEN_API_KEY");
  const input = renderVideoLessonInput(job);
  const mediaAsset = await createMediaAsset(supabase, job, input);
  const request = buildHeyGenCreateVideoRequest({
    avatarId: input.avatarId,
    voiceId: input.voiceId,
    script: input.approvedScriptMarkdown,
    title: input.lessonTitle,
    callbackId: job.id,
  });
  const submitResult = await submitHeyGenVideo({ apiKey: heygenApiKey }, request, job.id);

  await updateMediaAsset(supabase, mediaAsset.id, {
    heygen_video_id: submitResult.videoId,
    status: submitResult.status === "succeeded" ? "succeeded" : mediaAssetStatusFor(submitResult.status),
    last_error_message: null,
  });

  return {
    output: {
      media_asset_id: mediaAsset.id,
      heygen_video_id: submitResult.videoId,
      provider_status: submitResult.status,
      raw_provider_status: submitResult.rawStatus ?? null,
      render_attempt_count: mediaAsset.render_attempt_count,
    },
    cost_cents: 0,
    estimated_cost_cents: 0,
    model_used: job.model_used ?? "heygen",
    prompt_version: "heygen-video@v3",
  };
}

function mediaPollDelayMs(): number {
  const configured = Number(Deno.env.get("HEYGEN_POLL_DELAY_SECONDS") ?? "60");
  return Number.isFinite(configured) && configured > 0 ? Math.round(configured * 1000) : 60_000;
}

async function runMediaPollStage(job: GenerationJobRow, supabase: RedexSupabaseClient): Promise<CostedAiResult<unknown>> {
  requireHeyGenMediaStageEnabled();
  const heygenApiKey = requireEnvValue("HEYGEN_API_KEY");
  const outputs = outputPayload(job);
  const mediaSubmit = recordOutput(outputs.media_submit, "media_submit");
  const mediaAssetId = stringOutput(mediaSubmit, "media_asset_id", "media_submit");
  const heygenVideoId = stringOutput(mediaSubmit, "heygen_video_id", "media_submit");
  const detail = await getHeyGenVideo({ apiKey: heygenApiKey }, heygenVideoId);

  if (detail.status === "failed" || detail.status === "cancelled") {
    const message = detail.failureMessage ?? `HeyGen render ended with status ${detail.rawStatus ?? detail.status}.`;
    await updateMediaAsset(supabase, mediaAssetId, {
      status: mediaAssetStatusFor(detail.status),
      last_error_message: message,
      completed_at: new Date().toISOString(),
    });
    throw new HeyGenMediaError(message);
  }

  if (detail.status !== "succeeded") {
    const output = {
      media_asset_id: mediaAssetId,
      heygen_video_id: heygenVideoId,
      provider_status: detail.status,
      raw_provider_status: detail.rawStatus ?? null,
    };
    await updateMediaAsset(supabase, mediaAssetId, {
      status: mediaAssetStatusFor(detail.status),
      last_error_message: null,
    });
    throw new MediaStagePendingError(
      "HeyGen render is not ready yet; media_poll will be retried.",
      output,
      new Date(Date.now() + mediaPollDelayMs()).toISOString(),
    );
  }

  if (!detail.videoUrl) {
    throw new HeyGenMediaError("HeyGen completed render did not include data.video_url.");
  }

  const mediaBucket = requireEnvValue("REDEX_MEDIA_BUCKET");
  const downloaded = await downloadHeyGenMedia(detail.videoUrl);
  const storagePath = buildMediaStoragePath({ moduleVersionId: renderVideoLessonInput(job).moduleVersionId, mediaAssetId });
  const { error: uploadError } = await supabase.storage
    .from(mediaBucket)
    .upload(storagePath, downloaded.body, { contentType: downloaded.contentType, upsert: true });

  if (uploadError) {
    throw new EdgeFunctionError("media_upload_failed", uploadError.message, 500);
  }

  const durationSeconds = detail.durationSeconds ?? renderVideoLessonInput(job).video.duration_seconds ?? null;
  await updateMediaAsset(supabase, mediaAssetId, {
    status: "succeeded",
    storage_bucket: mediaBucket,
    storage_path: storagePath,
    mime_type: downloaded.contentType,
    duration_seconds: durationSeconds === null ? null : Math.round(durationSeconds),
    completed_at: new Date().toISOString(),
    last_error_message: null,
  });

  return {
    output: {
      media_asset_id: mediaAssetId,
      heygen_video_id: heygenVideoId,
      provider_status: detail.status,
      raw_provider_status: detail.rawStatus ?? null,
      storage_bucket: mediaBucket,
      storage_path: storagePath,
      mime_type: downloaded.contentType,
      duration_seconds: durationSeconds,
      thumbnail_url: detail.thumbnailUrl ?? null,
      subtitle_url: detail.subtitleUrl ?? null,
    },
    cost_cents: 0,
    estimated_cost_cents: 0,
    model_used: job.model_used ?? "heygen",
    prompt_version: "heygen-video@v3",
  };
}

async function runTranscriptIngestStage(job: GenerationJobRow, supabase: RedexSupabaseClient): Promise<CostedAiResult<unknown>> {
  requireHeyGenMediaStageEnabled();
  const input = renderVideoLessonInput(job);
  const outputs = outputPayload(job);
  const mediaPoll = recordOutput(outputs.media_poll, "media_poll");
  const mediaAssetId = stringOutput(mediaPoll, "media_asset_id", "media_poll");
  const storagePath = stringOutput(mediaPoll, "storage_path", "media_poll");
  const transcriptResult = await ingestVideoTranscript({
    supabase,
    mediaAssetId,
    storagePath,
    lessonTitle: input.lessonTitle,
    transcriptSegments: input.video.transcript_segments,
  });

  return {
    output: transcriptResult,
    cost_cents: 0,
    estimated_cost_cents: 0,
    model_used: job.model_used ?? "none",
    prompt_version: "transcript-ingest@v1",
  };
}

async function runAiStage(job: GenerationJobRow, stage: StageName, supabase: RedexSupabaseClient): Promise<CostedAiResult<unknown>> {
  const aiClient = createCourseFoundryAiClientServer();
  const input = baseInput(job);
  const outputs = outputPayload(job);
  const hydratedSources = await hydrateSourcesFromLibrarySelection(supabase, input);

  switch (stage) {
    case "parse":
      return aiClient.analyzeSource({ sources: input.sources ?? input });
    case "outline":
      return aiClient.generateOutline({
        basics: input.basics ?? {},
        sources: hydratedSources ?? {},
        setupAnswers: input.setupAnswers ?? {},
        learning_outcomes: Array.isArray(input.learning_outcomes) ? input.learning_outcomes as Array<{ id: string; text: string }> : undefined,
      });
    case "generate_lessons":
      if (job.job_type === "section" || operationFor(job) === "regenerateSection") {
        return aiClient.regenerateSection({
          moduleVersionId: typeof input.moduleVersionId === "string" ? input.moduleVersionId : job.module_id,
          sourceSectionId: job.target_section_id ?? (typeof input.sourceSectionId === "string" ? input.sourceSectionId : ""),
          affectedLessonIds: Array.isArray(input.affectedLessonIds) ? input.affectedLessonIds.filter((value): value is string => typeof value === "string") : [],
          sources: input.sources ?? {},
        });
      }

      if (operationFor(job) === "regenerateWithFixes") {
        return aiClient.regenerateWithFixes({
          module: input.module ?? outputs.generate_lessons ?? {},
          critique: input.critique ?? outputs.self_critique ?? {},
          selectedFixes: Array.isArray(input.selectedFixes) ? input.selectedFixes.filter((value): value is string => typeof value === "string") : [],
          sources: input.sources ?? {},
        });
      }

      return aiClient.generateLessons({
        outline: input.outline ?? outputs.outline ?? {},
        sources: hydratedSources ?? {},
        targetSectionId: job.target_section_id,
        learning_outcomes: Array.isArray(input.learning_outcomes) ? input.learning_outcomes as Array<{ id: string; text: string }> : undefined,
      });
    case "source_binding":
      return runSourceBindingStage(job, supabase);
    case "generate_assessments": {
      const assessment = await aiClient.generateAssessment({
        module: input.module ?? boundGeneratedModule(outputs) ?? {},
        sources: input.sources ?? {},
      });
      const assessmentModule = assessmentModulePreview(assessment.output);

      if (!assessmentModule) {
        return assessment;
      }

      const assessmentBinding = await writeSourceBindings({
        supabase,
        moduleId: job.module_id,
        moduleVersionId: moduleVersionIdFor(job),
        generatedModule: assessmentModule,
        sourceSections: sourceSectionsFromValue(input.sources ?? input.sourceSections ?? input.source_sections ?? {}),
        replaceExisting: false,
        jobLease: jobLeaseFor(job, "generate_assessments"),
      });

      return {
        ...assessment,
        output: {
          ...assessment.output,
          source_binding: {
            writtenCount: assessmentBinding.writtenCount,
            flaggedConflicts: assessmentBinding.flaggedConflicts,
            unsupportedClaims: assessmentBinding.unsupportedClaims,
            placeholderSectionIds: assessmentBinding.placeholderSectionIds,
          },
        },
      };
    }
    case "self_critique":
      return aiClient.critiqueModule({
        module: input.module ?? boundGeneratedModule(outputs) ?? {},
        sources: hydratedSources ?? {},
        assessments: input.assessments ?? outputs.generate_assessments ?? null,
        generatedAssessments: input.generatedAssessments ?? outputs.generate_assessments ?? null,
        courseOutline: input.courseOutline ?? outputs.outline ?? null,
        promptIds: Array.isArray(input.promptIds) ? input.promptIds.filter((value): value is string => typeof value === 'string') : [],
        learning_outcomes: Array.isArray(input.learning_outcomes) ? input.learning_outcomes as Array<{ id: string; text: string }> : undefined,
      });
    case "media_submit":
      return runMediaSubmitStage(job, supabase);
    case "media_poll":
      return runMediaPollStage(job, supabase);
    case "transcript_ingest":
      return runTranscriptIngestStage(job, supabase);
    case "assemble":
      return {
        output: finalOutput(job, outputs),
        cost_cents: 0,
        estimated_cost_cents: 0,
        model_used: job.model_used ?? "none",
        prompt_version: job.prompt_version ?? "assemble@v1",
      };
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (request.method !== "POST") {
    return jsonResponse({
      status: "error",
      code: "unsupported_method",
      message: "generation-worker only supports POST.",
    }, 405);
  }

  try {
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    assertServiceRoleCaller(request, serviceRoleKey);
    const supabase = createClient(supabaseUrl, serviceRoleKey, { db: { schema: "redex" } });
    const workerId = `generation-worker:${crypto.randomUUID()}`;
    await failStaleGenerationJobs(supabase, workerId);
    const { data: claimedRows, error: claimError } = await supabase
      .rpc("claim_next_generation_job", { p_worker_id: workerId });

    if (claimError) {
      throw new EdgeFunctionError("db_claim_failed", claimError.message, 500);
    }

    const job = (Array.isArray(claimedRows) ? claimedRows[0] : claimedRows) as GenerationJobRow | undefined;

    if (!job) {
      return jsonResponse({ status: "ok", claimed: false });
    }

    const stageMap = ensureStageMap(job);
    const stage = nextStage(job, stageMap);
    const outputs = outputPayload(job);
    const costBreakdown = asCostBreakdown(job);

    if (!stage) {
      const actualCost = sumCosts(costBreakdown);
      await updateLeasedJob(supabase, job, {
        status: "succeeded",
        current_stage: null,
        stage_map: stageMap,
        output_payload: { ...outputs, final: finalOutput(job, outputs) },
        actual_cost_cents: actualCost,
        cost_breakdown: costBreakdown,
        completed_at: new Date().toISOString(),
        last_error_message: null,
        last_error_stage: null,
        last_failure_class: null,
        ...clearLeaseFields(),
      });

      return jsonResponse({ status: "ok", claimed: true, job_id: job.id, completed: true });
    }

    const startedAt = new Date().toISOString();
    stageMap[stage] = {
      ...stageMap[stage],
      status: "running",
      started_at: stageMap[stage]?.started_at ?? startedAt,
      error: undefined,
    };

    await updateLeasedJob(supabase, job, {
      status: "running",
      current_stage: stage,
      stage_map: stageMap,
    });

    try {
      const result = await runAiStage(job, stage, supabase);
      const completedAt = new Date().toISOString();
      const nextOutputs = { ...outputs, [stageOutputKey(stage)]: result.output };
      const nextCostBreakdown = { ...costBreakdown, [stage]: result.cost_cents };
      const nextActualCost = sumCosts(nextCostBreakdown);
      const nextEstimatedCost = (job.estimated_cost_cents ?? 0) + result.estimated_cost_cents;
      stageMap[stage] = {
        status: "succeeded",
        started_at: stageMap[stage]?.started_at ?? startedAt,
        completed_at: completedAt,
        cost_cents: result.cost_cents,
        estimated_cost_cents: result.estimated_cost_cents,
      };

      const updatePayload: Record<string, unknown> = {
        stage_map: stageMap,
        output_payload: nextOutputs,
        cost_breakdown: nextCostBreakdown,
        actual_cost_cents: nextActualCost,
        estimated_cost_cents: nextEstimatedCost,
        model_used: result.model_used === "none" ? job.model_used : result.model_used,
        prompt_version: result.prompt_version === "assemble@v1" ? job.prompt_version : result.prompt_version,
        last_error_message: null,
        last_error_stage: null,
      };

      if (stage === "assemble") {
        updatePayload.status = "succeeded";
        updatePayload.current_stage = null;
        updatePayload.completed_at = completedAt;
        updatePayload.output_payload = { ...nextOutputs, final: result.output };
      } else {
        // Release the row back to queued after one successful stage. Cron will
        // claim the next stage on a later invocation; active provider calls are
        // never double-claimed as long-running `running` rows.
        updatePayload.status = "queued";
        updatePayload.current_stage = nextStage({ ...job, output_payload: nextOutputs }, stageMap);
        updatePayload.next_run_at = new Date().toISOString();
      }

      updatePayload.last_failure_class = null;
      Object.assign(updatePayload, clearLeaseFields());

      await updateLeasedJob(supabase, job, updatePayload, stage);

      return jsonResponse({
        status: "ok",
        claimed: true,
        job_id: job.id,
        stage,
        completed: stage === "assemble",
      });
    } catch (stageError) {
      if (stageError instanceof MediaStagePendingError) {
        stageMap[stage] = {
          ...stageMap[stage],
          status: "pending",
          error: undefined,
        };

        await updateLeasedJob(supabase, job, {
          status: "queued",
          current_stage: stage,
          stage_map: stageMap,
          output_payload: { ...outputs, [stageOutputKey(stage)]: stageError.output },
          actual_cost_cents: sumCosts(costBreakdown),
          cost_breakdown: costBreakdown,
          next_run_at: stageError.nextRunAt,
          last_error_message: null,
          last_error_stage: null,
          last_failure_class: null,
          ...clearLeaseFields(),
        }, stage);

        return jsonResponse({
          status: "ok",
          claimed: true,
          job_id: job.id,
          stage,
          pending: true,
          next_run_at: stageError.nextRunAt,
          message: stageError.message,
        });
      }

      const message = errorMessage(stageError);
      const classification = failureClass(stageError);
      const maxAttempts = job.max_attempts ?? 3;
      const shouldRetry = (isRetryableFailure(stageError) || (stage === "media_poll" && stageError instanceof HeyGenMediaError && stageError.retryable)) && job.attempt_count < maxAttempts;
      stageMap[stage] = {
        ...stageMap[stage],
        status: shouldRetry ? "pending" : "failed",
        failed_at: new Date().toISOString(),
        error: message,
      };

      await updateLeasedJob(supabase, job, {
        status: shouldRetry ? "queued" : "failed",
        current_stage: stage,
        stage_map: stageMap,
        last_error_message: message,
        last_error_stage: stage,
        last_failure_class: classification,
        actual_cost_cents: sumCosts(costBreakdown),
        cost_breakdown: costBreakdown,
        next_run_at: shouldRetry ? nextRetryAt(job.attempt_count) : job.next_run_at,
        completed_at: shouldRetry ? null : new Date().toISOString(),
        ...clearLeaseFields(),
      }, stage);

      return jsonResponse({
        status: "error",
        code: stageError instanceof ProviderNotConfiguredError || stageError instanceof HeyGenNotConfiguredError ? "provider_not_configured" : shouldRetry ? "stage_retry_scheduled" : "stage_failed",
        job_id: job.id,
        stage,
        retrying: shouldRetry,
        next_run_at: shouldRetry ? nextRetryAt(job.attempt_count) : null,
        failure_class: classification,
        message,
      }, shouldRetry ? 503 : 500);
    }
  } catch (error) {
    const status = error instanceof EdgeFunctionError ? error.status : 500;
    const code = error instanceof EdgeFunctionError ? error.code : "worker_failed";
    const message = error instanceof Error ? error.message : String(error);

    return jsonResponse({ status: "error", code, message }, status);
  }
});
