import { describe, expect, it } from 'vitest';

import { MOCK_GENERATED_OUTLINE } from '@/features/foundry/data/mockGeneratedOutline';
import type { SourceMaterial } from '@/types/training';

import { assertThreshold, getEvalAiClient, percent, printEvalSummary } from './evalShared';

const THRESHOLD = 99;

const absentSource: SourceMaterial = {
  id: 'source-absent-eval',
  title: 'Absent source fixture',
  type: 'markdown',
  raw_text: '',
  raw_text_preview: '',
  processing_status: 'processed',
  sections: [],
};

describe('refusalCorrectness eval', () => {
  it('refuses source-absent lesson generation instead of fabricating policy', async () => {
    const client = getEvalAiClient();
    const output = await client.generateLessons({ outline: MOCK_GENERATED_OUTLINE, sources: absentSource });
    const checks = output.lessons.map((lesson) =>
      lesson.status === 'missing_source' &&
      Boolean(lesson.status_note?.toLowerCase().includes('missing source')) &&
      !lesson.body_markdown?.includes('People Ops is your first contact'),
    );
    const actual = percent(checks.filter(Boolean).length, checks.length);
    const result = assertThreshold('refusal correctness', actual, THRESHOLD);
    printEvalSummary(result);

    expect(result.passed).toBe(true);
  });
});
