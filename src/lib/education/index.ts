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
  LessonType,
  Criticality,
  ProgressStatus,
  CourseStatus,
  EnrollmentStatus,
  GenerationStatus,
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
  SourceMaterial,
  CourseOutlineDraft,
  // Facade contract
  EducationFacade,
  // UI helpers
  LearnerDashboardSummary,
} from '@/types/training';

// Demo / seed data (development-time only)
export {
  DEMO_ORIENTATION_COURSE,
  DEMO_MODULES,
  DEMO_LESSONS,
  DEMO_ENROLLMENT,
  DEMO_VALUES_QUIZ_QUESTIONS,
} from './demo-data';
