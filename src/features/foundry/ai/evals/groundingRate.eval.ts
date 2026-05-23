import { describe, expect, it } from 'vitest';

import type { GeneratedModulePreview, SourceSection } from '@/types/training';

import { assertThreshold, percent, printEvalSummary, sourceCitationIds, stripSourceCitations } from './evalShared';

const THRESHOLD = 95;

const sections: SourceSection[] = [
  {
    id: 'section-hr-help',
    level: 2,
    heading: 'HR help',
    body: 'People Ops is the first contact for HR questions.',
    position_index: 0,
    has_placeholders: false,
  },
  {
    id: 'section-first-week',
    level: 2,
    heading: 'First-week expectations',
    body: 'New hires complete I-9, submit their first timesheet, and schedule a 30-day check-in.',
    position_index: 1,
    has_placeholders: false,
  },
];

const fixtureModule: GeneratedModulePreview = {
  module_title: 'Grounded HR fixture',
  generated_at: '2026-05-23T00:00:00.000Z',
  is_complete: true,
  lessons: [
    {
      module_index: 0,
      lesson_index: 0,
      title: 'HR help',
      lesson_type: 'text',
      body_markdown:
        'People Ops is the first contact for HR questions. [source: section-hr-help]\n\nNew hires complete first-week setup tasks before the first week closes. [source: section-first-week]',
      status: 'draft',
    },
    {
      module_index: 0,
      lesson_index: 1,
      title: 'Knowledge check',
      lesson_type: 'quiz',
      quiz_questions: [
        {
          id: 'q-1',
          question: 'Who is the first contact for HR questions? [source: section-hr-help]',
          options: ['People Ops [source: section-hr-help]', 'Public chat [source: section-hr-help]'],
          correct_index: 0,
        },
      ],
      status: 'draft',
    },
  ],
};

function claimTexts(module: GeneratedModulePreview): string[] {
  return module.lessons.flatMap((lesson) => [
    ...(lesson.body_markdown?.split(/\n+/u) ?? []),
    ...(lesson.acknowledgment_text ? [lesson.acknowledgment_text] : []),
    ...(lesson.quiz_questions ?? []).flatMap((question) => [question.question, ...question.options]),
  ]).map((claim) => claim.trim()).filter((claim) => stripSourceCitations(claim).length > 0);
}

describe('groundingRate eval', () => {
  it('keeps grounded claim rate above threshold', () => {
    const sectionIds = new Set(sections.map((section) => section.id));
    const claims = claimTexts(fixtureModule);
    const grounded = claims.filter((claim) => {
      const citations = sourceCitationIds(claim);
      return citations.length > 0 && citations.every((citation) => sectionIds.has(citation));
    });
    const actual = percent(grounded.length, claims.length);
    const result = assertThreshold('grounding rate', actual, THRESHOLD);
    printEvalSummary(result);

    expect(result.passed).toBe(true);
  });
});
