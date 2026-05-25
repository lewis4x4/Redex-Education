import { afterEach, describe, expect, it, vi } from 'vitest';

import { MOCK_GENERATED_OUTLINE } from '@/features/foundry/data/mockGeneratedOutline';

import {
  DEFAULT_AI_MODULE_BASICS,
  DEFAULT_AI_SETUP_ANSWERS,
  DEFAULT_AI_SOURCE_MATERIAL,
} from './pageInputDefaults';

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

function createSupabaseMock(rows: unknown[]) {
  const maybeSingle = vi.fn();

  for (const row of rows) {
    maybeSingle.mockResolvedValueOnce({ data: row, error: null });
  }

  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const getSession = vi.fn().mockResolvedValue({
    data: { session: { access_token: 'user-jwt' } },
    error: null,
  });

  return {
    supabase: {
      auth: { getSession },
      from,
    },
    spies: { from, select, eq, maybeSingle, getSession },
  };
}

async function importRealAiClient(
  supabaseMock: ReturnType<typeof createSupabaseMock>['supabase'],
  options?: {
    selectedLibraryFileIds?: string[];
    sourceLibraryMocks?: {
      fetchSourceFiles?: () => Promise<Array<{ id: string; title: string }>>;
      fetchSourceFileVersions?: () => Promise<Array<{ id: string }>>;
      fetchSourceSections?: () => Promise<Array<{ id: string; level: 2; heading: string; body: string; position_index: number; has_placeholders: boolean }>>;
    };
  },
) {
  vi.doMock('@/integrations/supabase/client', () => ({ supabase: supabaseMock }));
  vi.doMock('@/features/foundry/store/foundryDraftStore', () => ({
    useFoundryDraftStore: {
      getState: () => ({ selectedLibraryFileIds: options?.selectedLibraryFileIds ?? [] }),
    },
  }));
  vi.doMock('@/integrations/supabase/queries/source_library', () => ({
    fetchSourceFiles: options?.sourceLibraryMocks?.fetchSourceFiles ?? (async () => []),
    fetchSourceFileVersions: options?.sourceLibraryMocks?.fetchSourceFileVersions ?? (async () => []),
    fetchSourceSections: options?.sourceLibraryMocks?.fetchSourceSections ?? (async () => []),
  }));
  return import('./realAiClient');
}

describe('realAiClient', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/integrations/supabase/client');
    vi.doUnmock('@/features/foundry/store/foundryDraftStore');
    vi.doUnmock('@/integrations/supabase/queries/source_library');
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('submits durable generation jobs with prompt version, input payload, and user JWT auth', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://redex-test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');
    const supabase = createSupabaseMock([
      {
        id: 'generation-job-1',
        status: 'succeeded',
        stage_map: { outline: { status: 'succeeded', cost_cents: 1 } },
        current_stage: null,
        output_payload: { outline: MOCK_GENERATED_OUTLINE, final: MOCK_GENERATED_OUTLINE },
        last_error_message: null,
        actual_cost_cents: 1,
        cost_breakdown: { outline: 1 },
      },
    ]);
    const { realAiClient } = await importRealAiClient(supabase.supabase);
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ status: 'queued', job_id: 'generation-job-1' }, { status: 202 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const input = {
      basics: DEFAULT_AI_MODULE_BASICS,
      sources: DEFAULT_AI_SOURCE_MATERIAL,
      setupAnswers: DEFAULT_AI_SETUP_ANSWERS,
    };
    const output = await realAiClient.generateOutline(input);

    expect(output).toEqual(MOCK_GENERATED_OUTLINE);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://redex-test.supabase.co/functions/v1/submit-generation-job',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'content-type': 'application/json',
          apikey: 'public-anon-key',
          authorization: 'Bearer user-jwt',
        }),
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(requestInit.body))).toEqual({
      moduleId: 'draft:1i9rwxp',
      jobType: 'full',
      targetSectionId: null,
      promptVersion: 'v1',
      inputPayload: {
        operation: 'generateOutline',
        promptId: { key: 'outline_generation', version: 'v1' },
        input,
      },
    });
    expect(supabase.spies.from).toHaveBeenCalledWith('generation_jobs');
    expect(supabase.spies.select).toHaveBeenCalledWith(
      'id,status,stage_map,current_stage,output_payload,last_error_message,actual_cost_cents,cost_breakdown',
    );
    expect(supabase.spies.eq).toHaveBeenCalledWith('id', 'generation-job-1');
  });

  it('polls generation_jobs until a running job succeeds', async () => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://redex-test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');
    const supabase = createSupabaseMock([
      {
        id: 'generation-job-1',
        status: 'running',
        stage_map: { outline: { status: 'running' } },
        current_stage: 'outline',
        output_payload: {},
        last_error_message: null,
        actual_cost_cents: 0,
        cost_breakdown: {},
      },
      {
        id: 'generation-job-1',
        status: 'succeeded',
        stage_map: { outline: { status: 'succeeded', cost_cents: 3 } },
        current_stage: null,
        output_payload: { final: MOCK_GENERATED_OUTLINE },
        last_error_message: null,
        actual_cost_cents: 3,
        cost_breakdown: { outline: 3 },
      },
    ]);
    const { realAiClient } = await importRealAiClient(supabase.supabase);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ status: 'queued', job_id: 'generation-job-1' })));

    const promise = realAiClient.generateOutline({
      basics: DEFAULT_AI_MODULE_BASICS,
      sources: DEFAULT_AI_SOURCE_MATERIAL,
      setupAnswers: DEFAULT_AI_SETUP_ANSWERS,
    });

    await vi.advanceTimersByTimeAsync(2_000);

    await expect(promise).resolves.toEqual(MOCK_GENERATED_OUTLINE);
    expect(supabase.spies.maybeSingle).toHaveBeenCalledTimes(2);
  });

  it('throws the stored job error when polling reaches failed', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://redex-test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');
    const supabase = createSupabaseMock([
      {
        id: 'generation-job-1',
        status: 'failed',
        stage_map: { outline: { status: 'failed' } },
        current_stage: 'outline',
        output_payload: {},
        last_error_message: 'AI_PROVIDER_API_KEY is required before anthropic generation can run.',
        actual_cost_cents: 0,
        cost_breakdown: {},
      },
    ]);
    const { realAiClient } = await importRealAiClient(supabase.supabase);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ status: 'queued', job_id: 'generation-job-1' })));

    await expect(
      realAiClient.generateOutline({
        basics: DEFAULT_AI_MODULE_BASICS,
        sources: DEFAULT_AI_SOURCE_MATERIAL,
        setupAnswers: DEFAULT_AI_SETUP_ANSWERS,
      }),
    ).rejects.toThrow('AI_PROVIDER_API_KEY is required');
  });

  it('submits section regeneration jobs with targetSectionId', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://redex-test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');
    const supabase = createSupabaseMock([
      {
        id: 'section-job-1',
        status: 'succeeded',
        stage_map: { generate_lessons: { status: 'succeeded', cost_cents: 1 } },
        current_stage: null,
        output_payload: { final: { regeneratedLessons: [], newReviewItems: [] } },
        last_error_message: null,
        actual_cost_cents: 1,
        cost_breakdown: { generate_lessons: 1 },
      },
    ]);
    const { realAiClient } = await importRealAiClient(supabase.supabase);
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: 'queued', job_id: 'section-job-1' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(realAiClient.regenerateSection({
      moduleVersionId: 'module-version-1',
      sourceSectionId: '11111111-1111-1111-1111-111111111111',
      affectedLessonIds: ['lesson-1'],
      sources: DEFAULT_AI_SOURCE_MATERIAL,
    })).resolves.toEqual({ regeneratedLessons: [], newReviewItems: [] });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(requestInit.body))).toMatchObject({
      moduleId: 'module-version-1',
      jobType: 'section',
      targetSectionId: '11111111-1111-1111-1111-111111111111',
      inputPayload: {
        operation: 'regenerateSection',
        promptId: { key: 'regenerate_section', version: 'v1' },
      },
    });
  });

  it.each([
    ['text', 'lesson_generation.text', 'v1.1'],
    ['quiz', 'lesson_generation.quiz', 'v1'],
    ['checklist', 'lesson_generation.checklist', 'v1'],
    ['acknowledgment', 'lesson_generation.acknowledgment', 'v1'],
    ['scenario', 'lesson_generation.scenario', 'v1'],
    ['video', 'lesson_generation.video', 'v1.1'],
    ['coach', 'lesson_generation.coach', 'v1'],
    ['assignment', 'lesson_generation.assignment', 'v1'],
    ['reflection_prompt', 'lesson_generation.reflection_prompt', 'v1'],
  ] as const)('uses matching prompt key and version for %s lessons', async (lessonType, expectedPromptKey, expectedPromptVersion) => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://redex-test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');
    const supabase = createSupabaseMock([
      {
        id: 'generation-job-1',
        status: 'succeeded',
        stage_map: { generate_lessons: { status: 'succeeded', cost_cents: 1 } },
        current_stage: null,
        output_payload: {
          final: {
            module_title: 'Module',
            lessons: [
              {
                lesson_index: 0,
                module_index: 0,
                title: 'Lesson',
                lesson_type: lessonType,
                body_markdown: lessonType === 'text' ? 'Text body. [source: section-1]' : undefined,
                status: 'draft',
              },
            ],
            generated_at: new Date().toISOString(),
            is_complete: true,
          },
        },
        last_error_message: null,
        actual_cost_cents: 1,
        cost_breakdown: { generate_lessons: 1 },
      },
    ]);
    const { realAiClient } = await importRealAiClient(supabase.supabase);
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: 'queued', job_id: 'generation-job-1' }, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    await realAiClient.generateLessons({
      outline: {
        course_title: 'Module',
        description: 'Desc',
        learning_objectives: ['Obj'],
        modules: [{ title: 'M1', lessons: [{ title: 'L1', lesson_type: lessonType, estimated_minutes: 5 }] }],
      },
      sources: DEFAULT_AI_SOURCE_MATERIAL,
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(requestInit.body)).inputPayload.promptId).toEqual({
      key: expectedPromptKey,
      version: expectedPromptVersion,
    });
  });

  it('hydrates source content from selected library files when source material is empty', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://redex-test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');
    const supabase = createSupabaseMock([
      {
        id: 'generation-job-1',
        status: 'succeeded',
        stage_map: { outline: { status: 'succeeded', cost_cents: 1 } },
        current_stage: null,
        output_payload: { outline: MOCK_GENERATED_OUTLINE, final: MOCK_GENERATED_OUTLINE },
        last_error_message: null,
        actual_cost_cents: 1,
        cost_breakdown: { outline: 1 },
      },
    ]);
    const { realAiClient } = await importRealAiClient(supabase.supabase, {
      selectedLibraryFileIds: ['file-1'],
      sourceLibraryMocks: {
        fetchSourceFiles: async () => [{ id: 'file-1', title: 'HR doc' }],
        fetchSourceFileVersions: async () => [{ id: 'version-1' }],
        fetchSourceSections: async () => [
          { id: 'section-1', level: 2, heading: 'Policy', body: 'Use PTO system.', position_index: 0, has_placeholders: false },
        ],
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: 'queued', job_id: 'generation-job-1' }, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    await realAiClient.generateOutline({
      basics: DEFAULT_AI_MODULE_BASICS,
      sources: DEFAULT_AI_SOURCE_MATERIAL,
      setupAnswers: DEFAULT_AI_SETUP_ANSWERS,
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body));
    expect(body.inputPayload.input.sources.raw_text).toContain('Use PTO system.');
    expect(body.inputPayload.input.sources.sections).toHaveLength(1);
  });

  it('passes full self-critique context payload', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://redex-test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');
    const supabase = createSupabaseMock([
      {
        id: 'generation-job-1',
        status: 'succeeded',
        stage_map: { self_critique: { status: 'succeeded', cost_cents: 1 } },
        current_stage: null,
        output_payload: {
          final: { module_title: 'Module', generated_at: new Date().toISOString(), issues: [], blocks_publish: false },
        },
        last_error_message: null,
        actual_cost_cents: 1,
        cost_breakdown: { self_critique: 1 },
      },
    ]);
    const { realAiClient } = await importRealAiClient(supabase.supabase);
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: 'queued', job_id: 'generation-job-1' }, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    await realAiClient.critiqueModule({
      module: { module_title: 'Module', lessons: [], generated_at: new Date().toISOString(), is_complete: true },
      sources: DEFAULT_AI_SOURCE_MATERIAL,
      promptIds: ['outline_generation@v1', 'lesson_generation.text@v1'],
      courseOutline: MOCK_GENERATED_OUTLINE,
      generatedAssessments: { assessment_lesson_id: 'a1', questions: [] },
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body));
    expect(body.inputPayload.input.promptIds).toEqual(['outline_generation@v1', 'lesson_generation.text@v1']);
    expect(body.inputPayload.input.courseOutline).toEqual(MOCK_GENERATED_OUTLINE);
    expect(body.inputPayload.input.generatedAssessments).toEqual({ assessment_lesson_id: 'a1', questions: [] });
  });

  it('throws a clear not-deployed error when the edge function returns 404', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://redex-test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');
    const supabase = createSupabaseMock([]);
    const { realAiClient } = await importRealAiClient(supabase.supabase);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not found', { status: 404 })));

    await expect(realAiClient.analyzeSource({ sources: DEFAULT_AI_SOURCE_MATERIAL })).rejects.toThrow(
      'Generation pipeline not deployed yet: submit-generation-job',
    );
  });
});
