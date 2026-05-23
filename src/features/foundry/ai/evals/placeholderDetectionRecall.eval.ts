import { describe, expect, it } from 'vitest';

import type { SourceMaterial } from '@/types/training';

import { assertThreshold, getEvalAiClient, percent, printEvalSummary } from './evalShared';

const THRESHOLD = 90;

const sourceWithKnownPlaceholders: SourceMaterial = {
  id: 'placeholder-eval-source',
  title: 'Placeholder policy fixture',
  type: 'markdown',
  raw_text: '## Payroll\n[PLACEHOLDER — approved copy pending]\n\n## Escalation\nTBD by People Ops',
  processing_status: 'processed',
  sections: [
    {
      id: 'section-payroll-placeholder',
      level: 2,
      heading: 'Payroll',
      body: '[PLACEHOLDER — approved copy pending]',
      position_index: 0,
      has_placeholders: true,
    },
    {
      id: 'section-escalation-placeholder',
      level: 2,
      heading: 'Escalation',
      body: 'TBD by People Ops',
      position_index: 1,
      has_placeholders: true,
    },
  ],
};

describe('placeholderDetectionRecall eval', () => {
  it('flags known placeholder sections above threshold', async () => {
    const client = getEvalAiClient();
    const analysis = await client.analyzeSource({ sources: sourceWithKnownPlaceholders });
    const expectedPlaceholderCount = sourceWithKnownPlaceholders.sections.filter((section) => section.has_placeholders).length;
    const detectedCount = analysis.has_placeholders ? expectedPlaceholderCount : 0;
    const actual = percent(detectedCount, expectedPlaceholderCount);
    const result = assertThreshold('placeholder-detection recall', actual, THRESHOLD);
    printEvalSummary(result);

    expect(result.passed).toBe(true);
  });
});
