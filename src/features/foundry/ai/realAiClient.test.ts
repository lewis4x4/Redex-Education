import { afterEach, describe, expect, it, vi } from 'vitest';

import { MOCK_GENERATED_OUTLINE } from '@/features/foundry/data/mockGeneratedOutline';

import { realAiClient } from './realAiClient';
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

describe('realAiClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('posts generation requests to the submit-generation-job edge function with prompt id and input', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://redex-test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        status: 'completed',
        output: MOCK_GENERATED_OUTLINE,
      }),
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
          authorization: 'Bearer public-anon-key',
        }),
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(requestInit.body))).toEqual({
      operation: 'generateOutline',
      promptId: { key: 'outline_generation', version: 'v1' },
      input,
    });
  });

  it('polls generation_jobs when the edge function returns a queued job id', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://redex-test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ status: 'queued', job_id: 'generation-job-1' }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'generation-job-1',
            status: 'completed',
            output: MOCK_GENERATED_OUTLINE,
          },
        ]),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      realAiClient.generateOutline({
        basics: DEFAULT_AI_MODULE_BASICS,
        sources: DEFAULT_AI_SOURCE_MATERIAL,
        setupAnswers: DEFAULT_AI_SETUP_ANSWERS,
      }),
    ).resolves.toEqual(MOCK_GENERATED_OUTLINE);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://redex-test.supabase.co/rest/v1/generation_jobs?id=eq.generation-job-1&select=id,status,output,error',
    );
  });

  it('throws a clear not-deployed error when the edge function returns 404', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://redex-test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not found', { status: 404 })));

    await expect(realAiClient.analyzeSource({ sources: DEFAULT_AI_SOURCE_MATERIAL })).rejects.toThrow(
      'Generation pipeline not deployed yet: submit-generation-job',
    );
  });
});
