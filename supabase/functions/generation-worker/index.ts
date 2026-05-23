import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  createCourseFoundryAiClientServer,
  ProviderNotConfiguredError,
  type CostedAiResult,
} from "../_shared/courseFoundryAiClientServer.ts";

const STAGES = [
  "parse",
  "outline",
  "generate_lessons",
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
    return ["parse", "generate_lessons", "self_critique", "assemble"];
  }

  switch (operationFor(job)) {
    case "analyzeSource":
      return ["parse", "assemble"];
    case "generateOutline":
      return ["parse", "outline", "assemble"];
    case "generateLessons":
      return ["generate_lessons", "assemble"];
    case "generateAssessment":
      return ["generate_assessments", "assemble"];
    case "critiqueModule":
      return ["self_critique", "assemble"];
    case "regenerateWithFixes":
      return ["generate_lessons", "self_critique", "assemble"];
    case "regenerateSection":
      return ["parse", "generate_lessons", "self_critique", "assemble"];
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

function finalOutput(job: GenerationJobRow, outputs: Record<string, unknown>): unknown {
  switch (operationFor(job)) {
    case "analyzeSource":
      return outputs.parse;
    case "generateOutline":
      return outputs.outline;
    case "generateLessons":
      return outputs.generate_lessons;
    case "generateAssessment":
      return outputs.generate_assessments;
    case "critiqueModule":
      return outputs.self_critique;
    case "regenerateWithFixes":
      return outputs.generate_lessons;
    case "regenerateSection":
      return outputs.generate_lessons;
    default:
      return {
        module_id: job.module_id,
        job_type: job.job_type,
        target_section_id: job.target_section_id,
        parse: outputs.parse ?? null,
        outline: outputs.outline ?? null,
        lessons: outputs.generate_lessons ?? null,
        assessments: outputs.generate_assessments ?? null,
        self_critique: outputs.self_critique ?? null,
      };
  }
}

async function runAiStage(job: GenerationJobRow, stage: StageName): Promise<CostedAiResult<unknown>> {
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
    case "generate_assessments":
      return aiClient.generateAssessment({
        module: input.module ?? outputs.generate_lessons ?? {},
        sources: input.sources ?? {},
      });
    case "self_critique":
      return aiClient.critiqueModule({
        module: input.module ?? outputs.generate_lessons ?? {},
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
      const result = await runAiStage(job, stage);
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
