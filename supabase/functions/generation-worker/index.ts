import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  createCourseFoundryAiClientServer,
  ProviderNotConfiguredError,
  type CostedAiResult,
} from "../_shared/courseFoundryAiClientServer.ts";
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

function relevantStages(job: GenerationJobRow): StageName[] {
  if (job.job_type === "section") {
    return ["parse", "generate_lessons", "source_binding", "self_critique", "assemble"];
  }

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
    case "regenerateSection":
      return ["parse", "generate_lessons", "source_binding", "self_critique", "assemble"];
    default:
      return [...STAGES];
  }
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
    generatedModule,
    sourceSections: sourceSectionsFromValue(input.sources ?? input.sourceSections ?? input.source_sections ?? {}),
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

async function runAiStage(job: GenerationJobRow, stage: StageName, supabase: RedexSupabaseClient): Promise<CostedAiResult<unknown>> {
  const aiClient = createCourseFoundryAiClientServer();
  const input = baseInput(job);
  const outputs = outputPayload(job);

  switch (stage) {
    case "parse":
      return aiClient.analyzeSource({ sources: input.sources ?? input });
    case "outline":
      return aiClient.generateOutline({
        basics: input.basics ?? {},
        sources: input.sources ?? {},
        setupAnswers: input.setupAnswers ?? {},
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
        sources: input.sources ?? {},
        targetSectionId: job.target_section_id,
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
        generatedModule: assessmentModule,
        sourceSections: sourceSectionsFromValue(input.sources ?? input.sourceSections ?? input.source_sections ?? {}),
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
        sources: input.sources ?? {},
        assessments: input.assessments ?? outputs.generate_assessments ?? null,
      });
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
    const { data: claimedRows, error: claimError } = await supabase
      .rpc("claim_next_generation_job");

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
      const { error: succeedError } = await supabase
        .from("generation_jobs")
        .update({
          status: "succeeded",
          current_stage: null,
          stage_map: stageMap,
          output_payload: { ...outputs, final: finalOutput(job, outputs) },
          actual_cost_cents: actualCost,
          cost_breakdown: costBreakdown,
          completed_at: new Date().toISOString(),
          last_error_message: null,
          last_error_stage: null,
        })
        .eq("id", job.id);

      if (succeedError) {
        throw new EdgeFunctionError("db_write_failed", succeedError.message, 500);
      }

      return jsonResponse({ status: "ok", claimed: true, job_id: job.id, completed: true });
    }

    const startedAt = new Date().toISOString();
    stageMap[stage] = {
      ...stageMap[stage],
      status: "running",
      started_at: stageMap[stage]?.started_at ?? startedAt,
      error: undefined,
    };

    const { error: runningError } = await supabase
      .from("generation_jobs")
      .update({
        status: "running",
        current_stage: stage,
        stage_map: stageMap,
      })
      .eq("id", job.id);

    if (runningError) {
      throw new EdgeFunctionError("db_write_failed", runningError.message, 500);
    }

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
      }

      const { error: updateError } = await supabase
        .from("generation_jobs")
        .update(updatePayload)
        .eq("id", job.id);

      if (updateError) {
        throw new EdgeFunctionError("db_write_failed", updateError.message, 500);
      }

      return jsonResponse({
        status: "ok",
        claimed: true,
        job_id: job.id,
        stage,
        completed: stage === "assemble",
      });
    } catch (stageError) {
      const message = errorMessage(stageError);
      stageMap[stage] = {
        ...stageMap[stage],
        status: "failed",
        failed_at: new Date().toISOString(),
        error: message,
      };

      const { error: updateFailedError } = await supabase
        .from("generation_jobs")
        .update({
          status: "failed",
          current_stage: stage,
          stage_map: stageMap,
          last_error_message: message,
          last_error_stage: stage,
          actual_cost_cents: sumCosts(costBreakdown),
          cost_breakdown: costBreakdown,
        })
        .eq("id", job.id);

      if (updateFailedError) {
        throw new EdgeFunctionError("db_write_failed", updateFailedError.message, 500);
      }

      return jsonResponse({
        status: "error",
        code: stageError instanceof ProviderNotConfiguredError ? "provider_not_configured" : "stage_failed",
        job_id: job.id,
        stage,
        message,
      }, 200);
    }
  } catch (error) {
    const status = error instanceof EdgeFunctionError ? error.status : 500;
    const code = error instanceof EdgeFunctionError ? error.code : "worker_failed";
    const message = error instanceof Error ? error.message : String(error);

    return jsonResponse({ status: "error", code, message }, status);
  }
});
