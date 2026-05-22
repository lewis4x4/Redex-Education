// ============================================================
// Redex Education — Core TypeScript Domain Models
// (Ported & adapted from canonical modeling for this repo)
//
// These types support both:
// - Redex Academy (learner side: welcome, dashboard, progress)
// - Redex AI Course Foundry (admin generation side)
//
// Keep this file as the single source of truth for the education domain
// in the Redex-Education repository.
// ============================================================

export type UUID = string;
export type ISODateTime = string;

// ============================================================
// ENUMS
// ============================================================

export type LessonType =
  | 'video' | 'reading' | 'interactive' | 'quiz' | 'assignment'
  | 'discussion' | 'simulation' | 'live_session' | 'reflection_prompt';

export type Criticality = 'required' | 'recommended' | 'optional' | 'bonus';

export type ProgressStatus =
  | 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'failed';

export type CourseStatus = 'draft' | 'in_review' | 'published' | 'archived';

export type EnrollmentStatus = 'invited' | 'active' | 'completed' | 'dropped';

// ============================================================
// CORE ENTITIES
// ============================================================

export interface LearnerProfile {
  id: UUID;
  user_id: UUID;
  org_id: UUID;
  display_name: string;           // e.g. "Marcus Chen"
  preferred_name?: string;        // "Marcus" — used in "Welcome back, Marcus"
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

export type LessonContent =
  | { type: 'video'; video_url: string; duration_seconds?: number }
  | { type: 'reading'; body_markdown: string; estimated_read_minutes: number }
  | { type: 'quiz'; questions: QuizQuestion[] }
  | { type: 'assignment'; instructions: string; rubric?: any }
  | { type: 'reflection_prompt'; prompt: string };

export interface QuizQuestion {
  id: UUID;
  question: string;
  options: string[];
  correct_index?: number; // for auto-graded
}

export interface ResourceLink {
  label: string;
  url: string;
  type: 'pdf' | 'link' | 'video' | 'notion';
}

// ============================================================
// PROGRESS & ENROLLMENT
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
// FOUNDRY / GENERATION SIDE (for later slices)
// ============================================================

export type GenerationStatus =
  | 'queued' | 'extracting' | 'analyzing' | 'outlining'
  | 'generating_content' | 'review_ready' | 'published' | 'failed';

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
    lessons: Array<{ title: string; lesson_type: LessonType; estimated_minutes: number }>;
  }>;
  missing_source_notes?: string[];
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
