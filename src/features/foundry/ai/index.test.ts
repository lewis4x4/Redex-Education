import { afterEach, describe, expect, it, vi } from 'vitest';

import { getCourseFoundryAiClient, getCourseFoundryAiMode } from './index';
import { mockAiClient } from './mockAiClient';
import { realAiClient } from './realAiClient';

describe('Course Foundry AI client dispatch', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to mock mode and returns mockAiClient', () => {
    vi.stubEnv('VITE_AI_MODE', '');

    expect(getCourseFoundryAiMode()).toBe('mock');
    expect(getCourseFoundryAiClient()).toBe(mockAiClient);
  });

  it('returns realAiClient when VITE_AI_MODE is real', () => {
    vi.stubEnv('VITE_AI_MODE', 'real');

    expect(getCourseFoundryAiMode()).toBe('real');
    expect(getCourseFoundryAiClient()).toBe(realAiClient);
  });
});
