import type { CourseOutlineDraft } from '@/types/training';

/**
 * Mock AI-generated outline used by review UX before real AI generation lands.
 * Uses seeded Drive IDs from Source Library fixtures.
 */
export const MOCK_GENERATED_OUTLINE: CourseOutlineDraft = {
  course_title: 'HR Basics at Redex',
  description:
    'A practical first-week HR onboarding module focused on contacts, communication expectations, first-week tasks, acknowledgment, and a light final quiz.',
  learning_objectives: [
    'Identify who to contact for HR support and escalation paths.',
    'Understand first-week communication and onboarding expectations at Redex.',
    'Complete acknowledgment and pass a 5-question light quiz with an 80% threshold.',
  ],
  modules: [
    {
      title: 'HR Basics at Redex',
      lessons: [
        { title: 'Welcome to Redex', lesson_type: 'text', estimated_minutes: 3 },
        { title: 'Who to Contact for HR Help', lesson_type: 'text', estimated_minutes: 3 },
        { title: 'Payroll and Timekeeping Basics', lesson_type: 'text', estimated_minutes: 4 },
        { title: 'First-Week Expectations', lesson_type: 'text', estimated_minutes: 4 },
        { title: 'Required Acknowledgment', lesson_type: 'acknowledgment', estimated_minutes: 2 },
        { title: 'Final Quiz', lesson_type: 'quiz', estimated_minutes: 4 },
      ],
    },
  ],
  missing_source_notes: [
    'Payroll and Timekeeping Basics is source-blocked: payroll basics and timekeeping expectations sections contain [PLACEHOLDER] content (Drive ID 1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R).',
    'Required Acknowledgment includes escalation references that remain source-blocked because manager escalation path contains [PLACEHOLDER] content (Drive IDs 1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7 + 1wgolsCH2BOX5ZLICM05AtZLYqtiHsiEr context).',
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
  'Who to Contact for HR Help': [
    { drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7', section_count: 1 },
  ],
  'Payroll and Timekeeping Basics': [
    { drive_file_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R', section_count: 2 },
  ],
  'First-Week Expectations': [
    { drive_file_id: '1wgolsCH2BOX5ZLICM05AtZLYqtiHsiEr', section_count: 1 },
  ],
  'Required Acknowledgment': [
    { drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7', section_count: 1 },
    { drive_file_id: '1wgolsCH2BOX5ZLICM05AtZLYqtiHsiEr', section_count: 1 },
  ],
  'Final Quiz': [
    { drive_file_id: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7', section_count: 2 },
    { drive_file_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R', section_count: 2 },
    { drive_file_id: '1wgolsCH2BOX5ZLICM05AtZLYqtiHsiEr', section_count: 1 },
  ],
};
