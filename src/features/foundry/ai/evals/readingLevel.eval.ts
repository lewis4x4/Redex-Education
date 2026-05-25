import { describe, expect, it } from 'vitest';

import { MOCK_GENERATED_OUTLINE } from '@/features/foundry/data/mockGeneratedOutline';
import { DEFAULT_AI_SOURCE_MATERIAL } from '../pageInputDefaults';
import { fleschKincaidGrade, getEvalAiClient, readingProseTexts } from './evalShared';

const MAX_AVERAGE_GRADE = 8.9;

describe('readingLevel eval', () => {
  it('keeps structured reading prose near the 8th-grade target', async () => {
    const client = getEvalAiClient();
    const generated = await client.generateLessons({
      outline: MOCK_GENERATED_OUTLINE,
      sources: DEFAULT_AI_SOURCE_MATERIAL,
    });
    const proseTexts = generated.lessons.flatMap((lesson) => readingProseTexts(lesson));
    const grades = proseTexts.map(fleschKincaidGrade);
    const averageGrade = grades.length === 0
      ? Number.POSITIVE_INFINITY
      : grades.reduce((total, grade) => total + grade, 0) / grades.length;

    console.table([
      {
        Eval: 'reading lesson v2 readability',
        Threshold: `<= ${MAX_AVERAGE_GRADE}`,
        Actual: Number.isFinite(averageGrade) ? averageGrade.toFixed(2) : 'no structured prose',
        Result: averageGrade <= MAX_AVERAGE_GRADE ? 'PASS' : 'FAIL',
      },
    ]);

    expect(proseTexts.length).toBeGreaterThan(0);
    expect(averageGrade).toBeLessThanOrEqual(MAX_AVERAGE_GRADE);
  });
});
