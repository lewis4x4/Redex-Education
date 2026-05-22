import type { Module as EducationModule } from '@/types/training';
import {
  DEMO_MODULES as RAW_DEMO_MODULES,
  DEMO_ORIENTATION_COURSE,
  DEMO_LESSONS,
  DEMO_ENROLLMENT,
  DEMO_VALUES_QUIZ_QUESTIONS,
} from './demo-data';

function requireDemoModules(modules: EducationModule[]): [EducationModule, ...EducationModule[]] {
  const [firstModule, ...remainingModules] = modules;

  if (firstModule === undefined) {
    throw new Error('demo data invariant: at least one module is required');
  }

  return [firstModule, ...remainingModules];
}

// ============================================================
// Redex Education — Public Module Facade
//
// THE PUBLIC API for the education domain. UI components should
// import types and demo data from THIS path:
//
//   import type { Lesson, Module } from '@/lib/education';
//   import { DEMO_LESSONS } from '@/lib/education';
//
// Why a facade module?
//   - Components don't need to know whether types live in
//     `@/types/training` or whether demo data is local vs Supabase.
//   - When real Supabase-backed data lands, hooks/adapters can be
//     re-exported from here without changing every consumer.
//   - This is the LINE between "domain" and "row" — components must
//     never reach into `@/integrations/supabase/db-rows` directly.
// ============================================================

// Domain types (re-exported from the canonical source of truth)
export type {
  // Identifiers
  UUID,
  ISODateTime,
  // Enums
  AssessmentStyle,
  Criticality,
  CourseStatus,
  EnrollmentStatus,
  GenerationStatus,
  LessonType,
  ProgressStatus,
  TrainingType,
  WizardCriticality,
  // Core entities
  LearnerProfile,
  Course,
  Module,
  Lesson,
  // Lesson content variants
  LessonContent,
  TextLessonContent,
  ChecklistLessonContent,
  ChecklistItem,
  AcknowledgmentLessonContent,
  QuizLessonContent,
  QuizQuestion,
  ScenarioLessonContent,
  ScenarioStep,
  ScenarioChoice,
  VideoLessonContent,
  CoachLessonContent,
  AssignmentLessonContent,
  AssignmentRubric,
  AssignmentRubricCriterion,
  ReflectionPromptLessonContent,
  ResourceLink,
  // Progress / enrollment
  Enrollment,
  LessonProgress,
  // Foundry
  CourseOutlineDraft,
  ModuleSourceBinding,
  SourceAuthorityLevel,
  SourceFile,
  SourceFileVersion,
  SourceMaterial,
  SourceSection,
  SetupAnswers,
  // Facade contract
  EducationFacade,
  // UI helpers
  AdminDashboardMetrics,
  AdminDashboardSummary,
  AdminModuleListItem,
  LearnerDashboardSummary,
} from '@/types/training';

// Demo / seed data (development-time only)
export const DEMO_MODULES = requireDemoModules(RAW_DEMO_MODULES);

export {
  DEMO_ORIENTATION_COURSE,
  DEMO_LESSONS,
  DEMO_ENROLLMENT,
  DEMO_VALUES_QUIZ_QUESTIONS,
};

export {
  ASSESSMENT_STYLE_LABELS,
  TRAINING_TYPE_LABELS,
  WIZARD_CRITICALITY_LABELS,
} from '@/types/training';
