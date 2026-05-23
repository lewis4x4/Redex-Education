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
const POLL_INTERVAL_MS = 250;
const MAX_POLL_ATTEMPTS = 8;

type GenerationJobStatus = 'queued' | 'running' | 'completed' | 'succeeded' | 'failed';

interface SubmitJobResponse {
  job_id?: string;
  id?: string;
  status?: GenerationJobStatus;
  output?: unknown;
  error?: string;
}

interface GenerationJobRow {
  id?: string;
  status?: GenerationJobStatus;
  output?: unknown;
  error?: string;
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

function authHeaders(): Record<string, string> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!anonKey) {
    return {};
  }

  return {
    apikey: anonKey,
    authorization: `Bearer ${anonKey}`,
  };
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

function asGenerationJobRow(value: unknown): GenerationJobRow | null {
  if (Array.isArray(value)) {
    const [first] = value;
    return isRecord(first) ? (first as GenerationJobRow) : null;
  }

  return isRecord(value) ? (value as GenerationJobRow) : null;
}

function assertDeployed(response: Response): void {
  if (response.status === 404) {
    throw new Error(`${GENERATION_PIPELINE_NOT_DEPLOYED}: ${SUBMIT_GENERATION_JOB_FUNCTION}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function pollGenerationJob<T>(jobId: string, schema: Parameters<typeof validateAiOutput<T>>[0]): Promise<T> {
  const supabaseUrl = getSupabaseUrl();
  const pollUrl = `${supabaseUrl}/rest/v1/generation_jobs?id=eq.${encodeURIComponent(jobId)}&select=id,status,output,error`;

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const response = await fetch(pollUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        ...authHeaders(),
      },
    });

    assertDeployed(response);

    if (!response.ok) {
      throw new Error(`${GENERATION_PIPELINE_NOT_DEPLOYED}: generation_jobs polling returned ${response.status}`);
    }

    const row = asGenerationJobRow(await readResponsePayload(response));

    if (row?.status === 'failed') {
      throw new Error(row.error ?? 'Course Foundry AI generation job failed.');
    }

    if ((row?.status === 'completed' || row?.status === 'succeeded') && 'output' in row) {
      return validateAiOutput(schema, row.output);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Course Foundry AI generation job ${jobId} did not complete before polling timed out.`);
}

async function submitGenerationJob<T>(
  operation: keyof CourseFoundryAiClient,
  promptKey: PromptKey,
  input: unknown,
  schema: Parameters<typeof validateAiOutput<T>>[0],
): Promise<T> {
  const prompt = getPrompt(promptKey);
  const response = await fetch(edgeFunctionUrl(SUBMIT_GENERATION_JOB_FUNCTION), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({
      operation,
      promptId: prompt.id,
      input,
    }),
  });

  assertDeployed(response);

  const payload = asSubmitJobResponse(await readResponsePayload(response));

  if (!response.ok) {
    throw new Error(payload.error ?? `Course Foundry AI request failed with status ${response.status}.`);
  }

  if (payload.status === 'failed') {
    throw new Error(payload.error ?? 'Course Foundry AI generation job failed.');
  }

  if ((payload.status === 'completed' || payload.status === 'succeeded' || !payload.status) && 'output' in payload) {
    return validateAiOutput(schema, payload.output);
  }

  const jobId = payload.job_id ?? payload.id;

  if (!jobId) {
    throw new Error('Course Foundry AI generation job did not return output or a job id.');
  }

  return pollGenerationJob(jobId, schema);
}

export const realAiClient: CourseFoundryAiClient = {
  analyzeSource(input): Promise<AnalyzeSourceOutput> {
    return submitGenerationJob('analyzeSource', 'source_analysis', input, AnalyzeSourceOutputSchema);
  },

  generateOutline(input): Promise<GenerateOutlineOutput> {
    return submitGenerationJob('generateOutline', 'outline_generation', input, GenerateOutlineOutputSchema);
  },

  generateLessons(input): Promise<GenerateLessonsOutput> {
    return submitGenerationJob('generateLessons', 'lesson_generation.text', input, GenerateLessonsOutputSchema);
  },

  generateAssessment(input): Promise<GenerateAssessmentOutput> {
    return submitGenerationJob('generateAssessment', 'assessment_generation', input, GenerateAssessmentOutputSchema);
  },

  critiqueModule(input): Promise<CritiqueModuleOutput> {
    return submitGenerationJob('critiqueModule', 'self_critique', input, CritiqueModuleOutputSchema);
  },

  regenerateWithFixes(input): Promise<RegenerateWithFixesOutput> {
    return submitGenerationJob('regenerateWithFixes', 'regenerate_with_fixes', input, RegenerateWithFixesOutputSchema);
  },

  regenerateSection(input): Promise<RegenerateSectionOutput> {
    return submitGenerationJob('regenerateSection', 'regenerate_section', input, RegenerateSectionOutputSchema);
  },
};
