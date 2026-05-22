// ============================================================
// Redex Education — Canonical TypeScript Domain Models
//
// SINGLE SOURCE OF TRUTH for the education domain.
// These types are the contract between every layer of the app:
//
//   - Redex Academy (learner side: welcome, dashboard, player, quiz)
//   - Redex AI Course Foundry (admin generation side)
//   - Redex Training OS (long-term platform vision)
//
// IMPORTANT BOUNDARIES:
//   - UI components import DOMAIN types from `@/lib/education` (the facade)
//     or directly from this file. They MUST NOT import database Row types
//     from `@/integrations/supabase/db-rows` or generated `Database` types.
//   - Row types live in `@/integrations/supabase/db-rows.ts`. Mappers
//     (row → domain) live alongside the Supabase integration and will be
//     introduced when real reads are wired (post-Phase 2).
//
// EXTENSIBILITY:
//   The `LessonContent` discriminated union is designed to grow as new
//   pedagogical surfaces land. To add a new variant, extend `LessonType`
//   AND `LessonContent` with a matching `type` discriminant; renderers
//   pattern-match exhaustively in `LessonContentRenderer`.
// ============================================================

export type UUID = string;
export type ISODateTime = string;

// ============================================================
// ENUMS
// ============================================================

/**
 * All lesson types supported by the platform.
 *
 * These map 1:1 to `LessonContent` variants (the `type` discriminant of
 * `content`). Authors set `lesson_type` for catalog/filtering UI; the
 * runtime renderer dispatches on `content.type`.
 *
 * Phase 1 baseline (extensible — add variants here AND in `LessonContent`):
 *   - text              — markdown reading content
 *   - checklist         — ordered/unordered acknowledgment list
 *   - acknowledgment    — single policy statement requiring sign-off
 *   - quiz              — graded knowledge check (multi-question)
 *   - scenario          — branching story/decision exercise
 *   - video             — video playback (placeholder until player lands)
 *   - coach             — Redex Coach interactive prompt (placeholder)
 *   - assignment        — open-ended deliverable with optional rubric
 *   - reflection_prompt — open-text reflection
 */
export type LessonType =
  | 'text'
  | 'checklist'
  | 'acknowledgment'
  | 'quiz'
  | 'scenario'
  | 'video'
  | 'coach'
  | 'assignment'
  | 'reflection_prompt';

export type Criticality = 'required' | 'recommended' | 'optional' | 'bonus';

export type ProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'failed';

export type CourseStatus = 'draft' | 'in_review' | 'published' | 'archived';

export type EnrollmentStatus = 'invited' | 'active' | 'completed' | 'dropped';

// ============================================================
// CORE ENTITIES — DOMAIN MODELS
// (UI consumes these. Row types live in db-rows.ts and are mapped to these.)
// ============================================================

export interface LearnerProfile {
  id: UUID;
  user_id: UUID;
  org_id: UUID;
  display_name: string;
  preferred_name?: string;
  role?: string;
  department?: string;
  current_streak_days: number;
  total_learning_minutes: number;
  certificates_earned: number;
}

export interface Course {
  id: UUID;
  org_id: UUID;
  title: string;
  slug: string;
  description?: string;
  status: CourseStatus;
  level: string;
  estimated_minutes: number;
  learning_objectives: string[];
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface Module {
  id: UUID;
  course_id: UUID;
  title: string;
  order_index: number;
  criticality: Criticality;
  estimated_minutes: number;
  unlock_rule?: string;
}

export interface Lesson {
  id: UUID;
  module_id: UUID;
  title: string;
  lesson_type: LessonType;
  criticality: Criticality;
  order_index: number;
  estimated_minutes: number;
  content: LessonContent;
  resources?: ResourceLink[];
}

// ============================================================
// LESSON CONTENT — EXTENSIBLE DISCRIMINATED UNION
//
// Every variant carries a literal `type` discriminant matching a
// `LessonType` value. Renderers narrow via `content.type === '...'`.
//
// When adding a new variant:
//   1) Add the literal to `LessonType` above.
//   2) Add the variant here with strongly-typed payload (NO `any`).
//   3) Add a render branch in `LessonContentRenderer`.
//   4) If the variant is gradable, decide pass/fail semantics in
//      the progress layer (currently only `quiz` is gradable).
// ============================================================

export type LessonContent =
  | TextLessonContent
  | ChecklistLessonContent
  | AcknowledgmentLessonContent
  | QuizLessonContent
  | ScenarioLessonContent
  | VideoLessonContent
  | CoachLessonContent
  | AssignmentLessonContent
  | ReflectionPromptLessonContent;

export interface TextLessonContent {
  type: 'text';
  body_markdown: string;
  estimated_read_minutes?: number;
}

export interface ChecklistLessonContent {
  type: 'checklist';
  intro_markdown?: string;
  items: ChecklistItem[];
  /** When true, ALL items must be checked to mark the lesson complete. Default true. */
  require_all?: boolean;
}

export interface ChecklistItem {
  id: UUID;
  label: string;
  details_markdown?: string;
}

export interface AcknowledgmentLessonContent {
  type: 'acknowledgment';
  statement_markdown: string;
  /** Signature method: 'click' = single-click attestation; 'name' = typed name match. */
  required_signature?: 'click' | 'name';
  /** Optional policy/document reference shown alongside the statement. */
  policy_ref?: string;
}

export interface QuizLessonContent {
  type: 'quiz';
  questions: QuizQuestion[];
  /** Passing percentage (0–100). Defaults to the platform-wide PASSING_THRESHOLD. */
  passing_threshold?: number;
  /** Whether learners can retake the quiz after a fail. Defaults true. */
  allow_retakes?: boolean;
}

export interface QuizQuestion {
  id: UUID;
  question: string;
  options: string[];
  /** Index into `options` for auto-graded questions. Absent for ungraded. */
  correct_index?: number;
}

export interface ScenarioLessonContent {
  type: 'scenario';
  intro_markdown: string;
  steps: ScenarioStep[];
  outcome_summary_markdown?: string;
}

export interface ScenarioStep {
  id: UUID;
  prompt_markdown: string;
  choices: ScenarioChoice[];
}

export interface ScenarioChoice {
  id: UUID;
  label: string;
  is_correct?: boolean;
  feedback_markdown?: string;
}

export interface VideoLessonContent {
  type: 'video';
  video_url: string;
  duration_seconds?: number;
  transcript_markdown?: string;
  /** Placeholder for future captions/chapters payload. */
  poster_url?: string;
}

/**
 * Redex Coach interaction (placeholder for the AI coach surface).
 * NOTE: this variant defines the SHAPE only — no AI is wired yet.
 */
export interface CoachLessonContent {
  type: 'coach';
  intro_markdown: string;
  /** Optional seed prompts the coach may present to the learner. */
  prompts?: string[];
  /** Logical coach identifier (e.g. 'redex.orientation', 'redex.safety'). */
  coach_id?: string;
}

export interface AssignmentLessonContent {
  type: 'assignment';
  instructions: string;
  rubric?: AssignmentRubric;
}

export interface AssignmentRubric {
  criteria: AssignmentRubricCriterion[];
}

export interface AssignmentRubricCriterion {
  label: string;
  description?: string;
  /** Relative weight (any positive number; the UI normalizes). */
  weight?: number;
}

export interface ReflectionPromptLessonContent {
  type: 'reflection_prompt';
  prompt: string;
}

export interface ResourceLink {
  label: string;
  url: string;
  type: 'pdf' | 'link' | 'video' | 'notion';
}

// ============================================================
// PROGRESS & ENROLLMENT — DOMAIN MODELS
// ============================================================

export interface Enrollment {
  id: UUID;
  user_id: UUID;
  course_id: UUID;
  status: EnrollmentStatus;
  started_at: ISODateTime;
  completed_at?: ISODateTime;
  progress_percentage: number;
}

export interface LessonProgress {
  id: UUID;
  enrollment_id: UUID;
  lesson_id: UUID;
  status: ProgressStatus;
  time_spent_seconds: number;
  completed_at?: ISODateTime;
  acknowledgment_id?: UUID;
}

// ============================================================
// FOUNDRY / GENERATION SIDE
// (Redex AI Course Foundry — shapes only, no AI wired yet)
// ============================================================

export type GenerationStatus =
  | 'queued'
  | 'extracting'
  | 'analyzing'
  | 'outlining'
  | 'generating_content'
  | 'review_ready'
  | 'published'
  | 'failed';

export interface SourceMaterial {
  id: UUID;
  title: string;
  type: 'pdf' | 'markdown' | 'docx' | 'notion' | 'web_url';
  raw_text_preview?: string;
  processing_status: 'pending' | 'processed' | 'failed';
}

export interface CourseOutlineDraft {
  course_title: string;
  description: string;
  learning_objectives: string[];
  modules: Array<{
    title: string;
    lessons: Array<{
      title: string;
      lesson_type: LessonType;
      estimated_minutes: number;
    }>;
  }>;
  missing_source_notes?: string[];
}

// ============================================================
// EDUCATION FACADE INTERFACE
// Implemented by EducationContext today (localStorage-backed).
// Will be re-implemented by a Supabase-backed adapter in a later phase.
// ============================================================

export interface EducationFacade {
  getMyEnrollments(): Enrollment[];
  getCourse(courseId: UUID): Course | undefined;
  getModule(moduleId: UUID): Module | undefined;
  getLessonsForModule(moduleId: UUID): Lesson[];
  recordLessonProgress(
    lessonId: UUID,
    status: ProgressStatus,
    timeSpent?: number,
  ): void;
  getProgressSummary(
    courseId: UUID,
  ): { completed: number; total: number; percentage: number };
}

// ============================================================
// HELPER / UI SHAPES
// ============================================================

export interface LearnerDashboardSummary {
  learner: LearnerProfile;
  current_enrollment: Enrollment & { course: Course };
  next_lesson: Lesson | null;
  recent_completions: LessonProgress[];
  support_contact?: { name: string; role: string };
}
