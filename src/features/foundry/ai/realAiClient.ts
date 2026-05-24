import { getPrompt } from './prompts';
import type { PromptKey } from './promptTypes';
import {
  AnalyzeSourceOutputSchema,
  CritiqueModuleOutputSchema,
  GenerateAssessmentOutputSchema,
  GenerateLessonsOutputSchema,
  GenerateOutlineOutputSchema,
  RegenerateSectionOutputSchema,
  RegenerateWithFixesOutputSchema,
  validateAiOutput,
} from './aiSchemas';
import type { GeneratedLessonContent, LessonReviewItem, LessonType, SourceMaterial } from '@/types/training';
import { fetchSourceFiles, fetchSourceFileVersions, fetchSourceSections } from '@/integrations/supabase/queries/source_library';
import { formatAudienceForAi } from '@/features/foundry/lib/audienceFormat';
import type {
  AnalyzeSourceOutput,
  CourseFoundryAiClient,
  CritiqueModuleOutput,
  GenerateAssessmentOutput,
  GenerateLessonsOutput,
  GenerateOutlineOutput,
  RegenerateSectionOutput,
  RegenerateWithFixesOutput,
} from './courseFoundryAiClient';

const SUBMIT_GENERATION_JOB_FUNCTION = 'submit-generation-job';
const GENERATION_PIPELINE_NOT_DEPLOYED = 'Generation pipeline not deployed yet';
const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_ATTEMPTS = 900;

const PROMPT_KEY_BY_LESSON_TYPE: Record<LessonType, PromptKey> = {
  text: 'lesson_generation.text',
  quiz: 'lesson_generation.quiz',
  checklist: 'lesson_generation.checklist',
  acknowledgment: 'lesson_generation.acknowledgment',
  scenario: 'lesson_generation.scenario',
  video: 'lesson_generation.video',
  coach: 'lesson_generation.coach',
  assignment: 'lesson_generation.assignment',
  reflection_prompt: 'lesson_generation.reflection_prompt',
};

function toLessonReviewItem(lesson: GeneratedLessonContent): LessonReviewItem {
  return {
    lesson_index: lesson.lesson_index,
    module_index: lesson.module_index,
    lesson_title: lesson.title,
    confidence: lesson.status === 'ready_for_approval' ? 'high' : lesson.status === 'unsupported_claim' ? 'unsupported' : 'medium',
    has_unsupported_claim: lesson.status === 'unsupported_claim',
    unsupported_note: lesson.status_note,
    status: 'pending',
    source_excerpts: [],
  };
}

function withDerivedLessonReviews(output: GenerateLessonsOutput): GenerateLessonsOutput {
  if (Array.isArray(output.lesson_reviews) && output.lesson_reviews.length > 0) {
    return output;
  }

  return {
    ...output,
    lesson_reviews: output.lessons.map(toLessonReviewItem),
  };
}

function hasSourceContent(source: SourceMaterial): boolean {
  return (source.raw_text ?? '').trim().length > 0 || source.sections.length > 0;
}

async function resolveLibraryBackedSource(source: SourceMaterial): Promise<SourceMaterial> {
  if (hasSourceContent(source)) {
    return source;
  }

  const { useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore');
  const selectedLibraryFileIds = useFoundryDraftStore.getState().selectedLibraryFileIds;

  if (selectedLibraryFileIds.length === 0) {
    return source;
  }

  const sourceFiles = await fetchSourceFiles();
  const selectedFiles = sourceFiles.filter((file) => selectedLibraryFileIds.includes(file.id));
  const allSections = [] as SourceMaterial['sections'];

  for (const file of selectedFiles) {
    const versions = await fetchSourceFileVersions(file.id);
    const latestVersion = versions[0];

    if (!latestVersion) {
      continue;
    }

    const sections = await fetchSourceSections(latestVersion.id);
    allSections.push(...sections);
  }

  if (allSections.length === 0) {
    return source;
  }

  return {
    id: `library-${selectedLibraryFileIds.join('-')}`,
    title: 'Drive Library Selection',
    type: 'markdown',
    processing_status: 'processed',
    raw_text: allSections.map((section) => `## ${section.heading}\n\n${section.body}`).join('\n\n'),
    raw_text_preview: allSections.map((section) => section.body).join('\n\n').slice(0, 500),
    sections: allSections,
  };
}

type SupabaseClient = typeof import('@/integrations/supabase/client').supabase;

type GenerationJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

type JobType = 'full' | 'section';

interface SubmitJobResponse {
  job_id?: string;
  id?: string;
  status?: GenerationJobStatus;
  output_payload?: JobOutputPayload;
  output?: unknown;
  error?: string;
  message?: string;
}

interface JobOutputPayload extends Record<string, unknown> {
  final?: unknown;
  parse?: unknown;
  outline?: unknown;
  generate_lessons?: unknown;
  generate_assessments?: unknown;
  self_critique?: unknown;
}

interface GenerationJobRow {
  id: string;
  status: GenerationJobStatus;
  stage_map: Record<string, unknown>;
  current_stage: string | null;
  output_payload: JobOutputPayload;
  last_error_message: string | null;
  actual_cost_cents: number;
  cost_breakdown: Record<string, unknown>;
}

interface SubmitGenerationJobOptions<T> {
  operation: keyof CourseFoundryAiClient;
  promptKey: PromptKey;
  input: unknown;
  schema: Parameters<typeof validateAiOutput<T>>[0];
  jobType?: JobType;
  targetSectionId?: string | null;
}

async function getSupabaseClient(): Promise<SupabaseClient> {
  const module = await import('@/integrations/supabase/client');
  return module.supabase;
}

function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/u, '') ?? '';
}

function edgeFunctionUrl(functionName: string): string {
  const supabaseUrl = getSupabaseUrl();

  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL is required when VITE_AI_MODE=real.');
  }

  return `${supabaseUrl}/functions/v1/${functionName}`;
}

function authHeaders(accessToken: string): Record<string, string> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return {
    ...(anonKey ? { apikey: anonKey } : {}),
    authorization: `Bearer ${accessToken}`,
  };
}

async function getAccessToken(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (error || !accessToken) {
    throw new Error(error?.message ?? 'A signed-in Supabase session is required for real Course Foundry AI.');
  }

  return accessToken;
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text.trim() === '') {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asSubmitJobResponse(value: unknown): SubmitJobResponse {
  if (!isRecord(value)) {
    return {};
  }

  return value as SubmitJobResponse;
}

function assertDeployed(response: Response): void {
  if (response.status === 404) {
    throw new Error(`${GENERATION_PIPELINE_NOT_DEPLOYED}: ${SUBMIT_GENERATION_JOB_FUNCTION}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function stableHash(value: string): string {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0).toString(36);
}

function deriveModuleId(input: unknown, operation: keyof CourseFoundryAiClient): string {
  if (isRecord(input)) {
    if (typeof input.moduleId === 'string') return input.moduleId;
    if (typeof input.module_id === 'string') return input.module_id;
    if (typeof input.moduleVersionId === 'string') return input.moduleVersionId;

    if (isRecord(input.basics)) {
      if (typeof input.basics.persisted_module_id === 'string') return input.basics.persisted_module_id;
      if (typeof input.basics.module_id === 'string') return input.basics.module_id;
      if (typeof input.basics.id === 'string') return input.basics.id;
      if (typeof input.basics.title === 'string') return `draft:${stableHash(input.basics.title)}`;
    }

    if (isRecord(input.module) && typeof input.module.module_title === 'string') {
      return `draft:${stableHash(input.module.module_title)}`;
    }
  }

  return `draft:${operation}:${stableHash(JSON.stringify(input).slice(0, 2_000))}`;
}

function outputForOperation(
  operation: keyof CourseFoundryAiClient,
  outputPayload: JobOutputPayload,
): unknown {
  if ('final' in outputPayload && outputPayload.final !== undefined) {
    return outputPayload.final;
  }

  switch (operation) {
    case 'analyzeSource':
      return outputPayload.parse;
    case 'generateOutline':
      return outputPayload.outline;
    case 'generateLessons':
    case 'regenerateWithFixes':
    case 'regenerateSection':
      return outputPayload.generate_lessons;
    case 'generateAssessment':
      return outputPayload.generate_assessments;
    case 'critiqueModule':
      return outputPayload.self_critique;
  }
}

function terminalFailure(row: Pick<GenerationJobRow, 'status' | 'last_error_message' | 'id'>): Error | null {
  if (row.status === 'failed') {
    return new Error(row.last_error_message ?? `Course Foundry AI generation job ${row.id} failed.`);
  }

  if (row.status === 'cancelled') {
    return new Error(`Course Foundry AI generation job ${row.id} was cancelled.`);
  }

  return null;
}

async function pollJobUntilTerminal<T>(
  supabase: SupabaseClient,
  jobId: string,
  operation: keyof CourseFoundryAiClient,
  schema: Parameters<typeof validateAiOutput<T>>[0],
): Promise<T> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const { data, error } = await supabase
      .from('generation_jobs')
      .select('id,status,stage_map,current_stage,output_payload,last_error_message,actual_cost_cents,cost_breakdown')
      .eq('id', jobId)
      .maybeSingle<GenerationJobRow>();

    if (error) {
      throw new Error(`${GENERATION_PIPELINE_NOT_DEPLOYED}: generation_jobs polling failed (${error.message})`);
    }

    if (!data) {
      throw new Error(`Course Foundry AI generation job ${jobId} was not found.`);
    }

    const failure = terminalFailure(data);

    if (failure) {
      throw failure;
    }

    if (data.status === 'succeeded') {
      return validateAiOutput(schema, outputForOperation(operation, data.output_payload));
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Course Foundry AI generation job ${jobId} did not complete before polling timed out.`);
}

async function submitGenerationJob<T>({
  operation,
  promptKey,
  input,
  schema,
  jobType = 'full',
  targetSectionId = null,
}: SubmitGenerationJobOptions<T>): Promise<T> {
  const supabase = await getSupabaseClient();
  const accessToken = await getAccessToken(supabase);
  const prompt = getPrompt(promptKey);
  const response = await fetch(edgeFunctionUrl(SUBMIT_GENERATION_JOB_FUNCTION), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...authHeaders(accessToken),
    },
    body: JSON.stringify({
      moduleId: deriveModuleId(input, operation),
      jobType,
      targetSectionId,
      promptVersion: prompt.id.version,
      inputPayload: {
        operation,
        promptId: prompt.id,
        input,
      },
    }),
  });

  assertDeployed(response);

  const payload = asSubmitJobResponse(await readResponsePayload(response));

  if (!response.ok) {
    throw new Error(payload.error ?? payload.message ?? `Course Foundry AI request failed with status ${response.status}.`);
  }

  if (payload.status === 'failed') {
    throw new Error(payload.error ?? payload.message ?? 'Course Foundry AI generation job failed.');
  }

  if (payload.status === 'succeeded' && payload.output_payload) {
    return validateAiOutput(schema, outputForOperation(operation, payload.output_payload));
  }

  if ((payload.status === 'succeeded' || !payload.status) && 'output' in payload) {
    return validateAiOutput(schema, payload.output);
  }

  const jobId = payload.job_id ?? payload.id;

  if (!jobId) {
    throw new Error('Course Foundry AI generation job did not return output or a job id.');
  }

  return pollJobUntilTerminal(supabase, jobId, operation, schema);
}

export const realAiClient: CourseFoundryAiClient = {
  analyzeSource(input): Promise<AnalyzeSourceOutput> {
    return submitGenerationJob({
      operation: 'analyzeSource',
      promptKey: 'source_analysis',
      input,
      schema: AnalyzeSourceOutputSchema,
    });
  },

  async generateOutline(input): Promise<GenerateOutlineOutput> {
    const sources = await resolveLibraryBackedSource(input.sources);

    return submitGenerationJob({
      operation: 'generateOutline',
      promptKey: 'outline_generation',
      input: {
        ...input,
        basics: {
          ...input.basics,
          audience: formatAudienceForAi(input.basics),
        },
        sources,
      },
      schema: GenerateOutlineOutputSchema,
    });
  },

  async generateLessons(input): Promise<GenerateLessonsOutput> {
    const firstLessonType = input.outline.modules[0]?.lessons[0]?.lesson_type ?? 'text';
    const promptKey = PROMPT_KEY_BY_LESSON_TYPE[firstLessonType];
    const sources = await resolveLibraryBackedSource(input.sources);
    const output = await submitGenerationJob({
      operation: 'generateLessons',
      promptKey,
      input: { ...input, sources },
      schema: GenerateLessonsOutputSchema,
    });

    return withDerivedLessonReviews(output);
  },

  generateAssessment(input): Promise<GenerateAssessmentOutput> {
    return submitGenerationJob({
      operation: 'generateAssessment',
      promptKey: 'assessment_generation',
      input,
      schema: GenerateAssessmentOutputSchema,
    });
  },

  async critiqueModule(input): Promise<CritiqueModuleOutput> {
    const sources = await resolveLibraryBackedSource(input.sources);

    return submitGenerationJob({
      operation: 'critiqueModule',
      promptKey: 'self_critique',
      input: { ...input, sources },
      schema: CritiqueModuleOutputSchema,
    });
  },

  regenerateWithFixes(input): Promise<RegenerateWithFixesOutput> {
    return submitGenerationJob({
      operation: 'regenerateWithFixes',
      promptKey: 'regenerate_with_fixes',
      input,
      schema: RegenerateWithFixesOutputSchema,
    });
  },

  regenerateSection(input): Promise<RegenerateSectionOutput> {
    return submitGenerationJob({
      operation: 'regenerateSection',
      promptKey: 'regenerate_section',
      input,
      schema: RegenerateSectionOutputSchema,
      jobType: 'section',
      targetSectionId: input.sourceSectionId,
    });
  },
};
