import type { CourseOutlineDraft, GeneratedModulePreview, SetupAnswers, SourceMaterial } from '@/types/training';
import type { ModuleBasicsDraft } from '@/features/foundry/types';

export const DEFAULT_AI_SOURCE_MATERIAL: SourceMaterial = {
  id: 'mock-source-material',
  title: 'Mock source material',
  type: 'markdown',
  raw_text: '',
  raw_text_preview: '',
  processing_status: 'processed',
  sections: [],
};

export const DEFAULT_AI_MODULE_BASICS: ModuleBasicsDraft = {
  title: 'HR Basics at Redex',
  parent_course_id: 'standalone',
  audience: 'New hires',
  criticality: 'required',
  training_type: 'hr',
  estimated_minutes: 20,
  learning_outcomes: [
    { id: 'outcome-1', text: 'Describe Redex workplace safety expectations in your own words.' },
    { id: 'outcome-2', text: 'Identify the correct escalation path for HR and payroll questions.' },
    { id: 'outcome-3', text: 'Complete new-hire onboarding tasks using the approved checklist.' },
  ],
  updated_at: '2026-05-23T00:00:00.000Z',
};

export const DEFAULT_AI_SETUP_ANSWERS: SetupAnswers = {
  criticality: 'basic_knowledge',
  assessment_style: 'light_quiz',
  audience_notes: 'New hires',
  experience_notes: 'Concise onboarding module',
  estimated_minutes: 20,
  source_control: 'strict',
  requires_admin_approval: true,
  requires_safety_review: false,
  updated_at: '2026-05-23T00:00:00.000Z',
};

export const DEFAULT_AI_OUTLINE: CourseOutlineDraft = {
  course_title: 'HR Basics at Redex',
  description: 'Fallback outline request used before the mock client hydrates the draft store.',
  learning_objectives: ['Review approved source-backed HR basics.'],
  modules: [
    {
      title: 'HR Basics at Redex',
      lessons: [{ title: 'Welcome to Redex', lesson_type: 'text', estimated_minutes: 5 }],
    },
  ],
};

export const DEFAULT_AI_MODULE_PREVIEW: GeneratedModulePreview = {
  module_title: 'HR Basics at Redex',
  lessons: [],
  generated_at: '2026-05-23T00:00:00.000Z',
  is_complete: false,
};
