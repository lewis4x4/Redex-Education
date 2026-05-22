import type { CourseOutlineDraft } from '@/types/training';

/**
 * Mock AI-generated outline used by Slice 3.1 for review UX before real
 * AI generation lands. References real Drive file IDs from the seeded
 * Source Library (Slice 2.4) so missing-source warnings tie to actual
 * placeholder content in those files.
 */
export const MOCK_GENERATED_OUTLINE: CourseOutlineDraft = {
  course_title: 'HR Basics at Redex',
  description:
    'A friendly first-pass introduction to HR essentials at Redex — PTO basics, code of conduct, and what to expect in your first week.',
  learning_objectives: [
    'Understand the Redex Code of Conduct and how to report concerns.',
    'Know who to contact for PTO requests and approval timelines.',
    'Complete the first-week checklist with confidence.',
  ],
  modules: [
    {
      title: 'Welcome and Code of Conduct',
      lessons: [
        { title: 'Welcome to Redex', lesson_type: 'text', estimated_minutes: 3 },
        {
          title: 'Code of Conduct — Respect and Reporting',
          lesson_type: 'text',
          estimated_minutes: 5,
        },
        {
          title: 'Acknowledgment: I have read the Code of Conduct',
          lesson_type: 'acknowledgment',
          estimated_minutes: 1,
        },
      ],
    },
    {
      title: 'PTO and Time Off',
      lessons: [
        { title: 'PTO Policy Overview', lesson_type: 'text', estimated_minutes: 4 },
        {
          title: 'How to Request Time Off',
          lesson_type: 'text',
          estimated_minutes: 3,
        },
        {
          title: 'Quick Check: PTO Basics',
          lesson_type: 'quiz',
          estimated_minutes: 2,
        },
      ],
    },
    {
      title: 'Your First Week',
      lessons: [
        {
          title: 'The Day-by-Day Checklist',
          lesson_type: 'checklist',
          estimated_minutes: 4,
        },
        {
          title: 'Meeting Your Onboarding Buddy',
          lesson_type: 'text',
          estimated_minutes: 2,
        },
      ],
    },
  ],
  missing_source_notes: [
    'PTO eligibility section in pto-policy.md (Drive ID 1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R) contains [PLACEHOLDER] — admin must provide approved language before publishing.',
    'PTO accrual schedule in pto-policy.md contains [PLACEHOLDER] — admin must provide approved language before publishing.',
    'PPE-specific instructions in safety-101.md (Drive ID 1a7uxcRzxhJkAYErtTpPMgJA0J1ajYGBV) reference [PLACEHOLDER] — admin must provide approved policy.',
  ],
};

export const MOCK_GENERATED_OUTLINE_TITLE = 'HR Basics at Redex' as const;

export const MOCK_LESSON_SOURCE_BINDINGS: Record<
  string,
  { drive_file_id: string; section_count: number }[]
> = {
  'Welcome to Redex': [
    { drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7', section_count: 1 },
  ],
  'Code of Conduct — Respect and Reporting': [
    { drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7', section_count: 2 },
  ],
  'PTO Policy Overview': [
    { drive_file_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R', section_count: 3 },
  ],
  'How to Request Time Off': [
    { drive_file_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R', section_count: 1 },
  ],
  'The Day-by-Day Checklist': [
    { drive_file_id: '1wgolsCH2BOX5ZLICM05AtZLYqtiHsiEr', section_count: 1 },
  ],
};
