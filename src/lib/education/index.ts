import type { Module as EducationModule } from '@/types/training';
import { DEMO_MODULES as RAW_DEMO_MODULES } from './demo-data';

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
  AcknowledgmentLessonContent,
  AdminDashboardMetrics,
  AdminDashboardSummary,
  AdminModuleListItem,
  Assessment,
  AssessmentAttempt,
  AssessmentQuestion,
  AssessmentStyle,
  Assignment,
  AssignmentLessonContent,
  AssignmentRubric,
  AssignmentRubricCriterion,
  AuditLog,
  ChecklistItem,
  ChecklistLessonContent,
  CoachLessonContent,
  Course,
  CourseOutlineDraft,
  CourseStatus,
  Criticality,
  CriticalityLevel,
  CritiqueIssue,
  CritiqueIssueCategory,
  CritiqueSeverity,
  EducationFacade,
  Enrollment,
  EnrollmentStatus,
  GeneratedContentReview,
  GeneratedLessonContent,
  GeneratedModulePreview,
  GenerationStatus,
  ISODateTime,
  LearnerDashboardSummary,
  LearnerProfile,
  Lesson,
  LessonConfidenceLevel,
  LessonContent,
  LessonGenerationStatus,
  LessonProgress,
  LessonReviewItem,
  LessonReviewStatus,
  LessonType,
  Module,
  ModuleSourceBinding,
  ModuleVersion,
  ProgressRecord,
  ProgressStatus,
  PublishBlocker,
  PublishBlockerSeverity,
  PublishBlockerSource,
  QuizLessonContent,
  QuizQuestion,
  ReflectionPromptLessonContent,
  ResourceLink,
  Role,
  ScenarioChoice,
  ScenarioLessonContent,
  ScenarioStep,
  SelfCritiqueReport,
  SetupAnswers,
  SourceAuthorityLevel,
  SourceBinder,
  SourceChangeEvent,
  SourceDocument,
  SourceExcerpt,
  SourceFile,
  SourceFileVersion,
  SourceMaterial,
  SourceReference,
  SourceSection,
  TextLessonContent,
  TrainingType,
  User,
  UUID,
  VideoLessonContent,
  WizardCriticality,
} from '@/types/training';

// Demo / seed data (development-time only)
export const DEMO_MODULES = requireDemoModules(RAW_DEMO_MODULES);

export {
  DEMO_ORIENTATION_COURSE,
  DEMO_HR_BASICS_COURSE,
  DEMO_LESSONS,
  DEMO_HR_BASICS_LESSONS,
  DEMO_ENROLLMENT,
  DEMO_HR_BASICS_ENROLLMENT,
  DEMO_VALUES_QUIZ_QUESTIONS,
  DEMO_HR_BASICS_QUIZ_QUESTIONS,
  DEMO_HR_BASICS_MODULE,
} from './demo-data'

export {
  MOCK_LEARNER_MARCUS,
  MOCK_LEARNER_MARCUS_PROFILE,
  MOCK_LEARNER_ANA,
  MOCK_LEARNER_ANA_PROFILE,
  MOCK_ADMIN_USER,
  MOCK_MANAGER_USER,
  MOCK_LEARNER_DEVON,
} from './mockOrgPeople'

export {
  MOCK_HR_ONBOARDING_ASSIGNMENT,
  MOCK_HR_ONBOARDING_ASSIGNMENT_ANA,
  MOCK_HR_ONBOARDING_ASSIGNMENT_COMPLETED,
} from './mockAssignments'

export {
  ASSESSMENT_STYLE_LABELS,
  CRITIQUE_CATEGORY_LABELS,
  CRITIQUE_SEVERITY_LABELS,
  PUBLISH_BLOCKER_SOURCE_LABELS,
  LESSON_GENERATION_STATUS_LABELS,
  REVIEW_STATUS_LABELS,
  CONFIDENCE_LABELS,
  TRAINING_TYPE_LABELS,
  WIZARD_CRITICALITY_LABELS,
} from '@/types/training';
