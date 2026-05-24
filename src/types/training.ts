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

/** System role for a user — drives RLS + UI access. */
export type Role = 'admin' | 'foundry_author' | 'manager' | 'learner';

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

/** Alias retained for roadmap terminology compatibility. */
export type CriticalityLevel = Criticality;

/**
 * Pedagogical stakes selected during Foundry setup-question intake.
 *
 * NOTE: this is distinct from lesson-level `Criticality` and models
 * generation strictness / governance requirements for an entire module.
 */
export type WizardCriticality =
  | 'informational'
  | 'basic_knowledge'
  | 'operational'
  | 'compliance_high_risk';

export const WIZARD_CRITICALITY_LABELS: Record<WizardCriticality, string> = {
  informational: 'Informational',
  basic_knowledge: 'Basic Knowledge',
  operational: 'Operational',
  compliance_high_risk: 'Compliance / Safety / High-Risk',
};

/**
 * Assessment configuration style selected during Foundry setup intake.
 */
export type AssessmentStyle =
  | 'no_assessment'
  | 'light_quiz'
  | 'standard_quiz'
  | 'strict_quiz'
  | 'scenario_based'
  | 'acknowledgment_only';

export const ASSESSMENT_STYLE_LABELS: Record<AssessmentStyle, string> = {
  no_assessment: 'No assessment',
  light_quiz: 'Light quiz',
  standard_quiz: 'Standard quiz',
  strict_quiz: 'Strict quiz',
  scenario_based: 'Scenario-based assessment',
  acknowledgment_only: 'Acknowledgment only',
};

/**
 * Setup-question answers used by the Foundry wizard before outline generation.
 */
export interface SetupAnswers {
  criticality: WizardCriticality;
  assessment_style: AssessmentStyle;
  /** Free text — admin description of who this module is for. */
  audience_notes: string;
  /** Free text — admin description of the experience style they want. */
  experience_notes: string;
  /** Estimated minutes; reuses ModuleBasicsDraft.estimated_minutes pattern. */
  estimated_minutes: number;
  /** Source control: 'strict' = no inference beyond source; 'flexible' = AI may rephrase. */
  source_control: 'strict' | 'flexible';
  /** Approval gates required before publish. */
  requires_admin_approval: boolean;
  requires_safety_review: boolean;
  /** When the draft was last saved. */
  updated_at: ISODateTime;
}

/**
 * High-level pedagogical category for a module.
 *
 * Used by the Course Foundry to drive setup-question defaults and
 * by the learner-side dashboard to group / filter assigned training.
 *
 * The labels are stable identifiers; UI displays them via a helper
 * (e.g. `'customer_specific' → "Customer-specific"`).
 */
export type TrainingType =
  | 'hr'
  | 'operational'
  | 'safety'
  | 'compliance'
  | 'customer_specific'
  | 'role_specific'
  | 'general_informational';

export const CANONICAL_AUDIENCES = [
  'new_hire',
  'all_employees',
  'field_team',
  'managers',
  'customer_support',
  'sales',
  'operations',
  'compliance_officers',
  'foundry_authors',
  'leadership',
] as const;

export type CanonicalAudience = (typeof CANONICAL_AUDIENCES)[number];

export const CANONICAL_AUDIENCE_LABELS: Record<CanonicalAudience, string> = {
  new_hire: 'New hires',
  all_employees: 'All employees',
  field_team: 'Field team',
  managers: 'Managers',
  customer_support: 'Customer support',
  sales: 'Sales',
  operations: 'Operations',
  compliance_officers: 'Compliance officers',
  foundry_authors: 'Foundry authors',
  leadership: 'Leadership',
};

export const TRAINING_TYPE_LABELS: Record<TrainingType, string> = {
  hr: 'HR',
  operational: 'Operational',
  safety: 'Safety',
  compliance: 'Compliance',
  customer_specific: 'Customer-specific',
  role_specific: 'Role-specific',
  general_informational: 'General informational',
};

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

export interface User {
  id: UUID;
  org_id: UUID;
  email: string;
  display_name: string;
  role: Role;
  department?: string;
  manager_id?: UUID;
  start_date?: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface LearnerProfile {
  id: UUID;
  user_id: UUID;
  org_id: UUID;
  display_name: string;
  preferred_name?: string;
  role?: string;
  department?: string;
  manager_id?: UUID;
  start_date?: string;
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

export interface AssessmentQuestion {
  id: UUID;
  prompt: string;
  options: string[];
  correct_index: number;
}

export interface Assessment {
  id: UUID;
  lesson_id: UUID;
  passing_threshold: number;
  questions: AssessmentQuestion[];
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

/** Alias retained for roadmap terminology compatibility. */
export type ProgressRecord = LessonProgress;

/**
 * Individual assessment attempt record — Slice 6.2 progress tracking.
 */
export interface AssessmentAttempt {
  id: UUID;
  enrollment_id: UUID;
  lesson_id: UUID;
  attempted_at: ISODateTime;
  score_percent: number;
  passed: boolean;
  /** Answers keyed by question id. */
  answers: Record<string, number>;
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

export type LessonGenerationStatus =
  | 'draft'
  | 'needs_review'
  | 'unsupported_claim'
  | 'missing_source'
  | 'ready_for_approval';

export type CritiqueSeverity = 'low' | 'medium' | 'high';

export type PublishBlockerSeverity = 'warning' | 'blocker';
export type PublishBlockerSource =
  | 'source_placeholder'
  | 'critique_high_severity'
  | 'lesson_unsupported_claim';

export const PUBLISH_BLOCKER_SOURCE_LABELS: Record<PublishBlockerSource, string> = {
  source_placeholder: 'Source file placeholder',
  critique_high_severity: 'Critique high-severity issue',
  lesson_unsupported_claim: 'Lesson with unsupported claim',
};

export interface PublishBlocker {
  id: string;
  source: PublishBlockerSource;
  severity: PublishBlockerSeverity;
  /** Where the blocker was detected. */
  location: string;
  /** Short summary of the blocker. */
  summary: string;
  /** Optional detail / suggested fix. */
  detail?: string;
  /** Route path to resolve, if known. */
  resolve_route?: string;
}

export type LessonReviewStatus = 'pending' | 'approved' | 'needs_regeneration';
export type LessonConfidenceLevel = 'high' | 'medium' | 'low' | 'unsupported';

export const REVIEW_STATUS_LABELS: Record<LessonReviewStatus, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  needs_regeneration: 'Needs regeneration',
};

export const CONFIDENCE_LABELS: Record<LessonConfidenceLevel, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
  unsupported: 'Unsupported',
};

export const CRITIQUE_SEVERITY_LABELS: Record<CritiqueSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export type CritiqueIssueCategory =
  | 'unsupported_claim'
  | 'weak_question'
  | 'missing_source_reference'
  | 'confusing_language'
  | 'overly_corporate_wording'
  | 'missing_critical_info'
  | 'needs_admin_approval';

export const CRITIQUE_CATEGORY_LABELS: Record<CritiqueIssueCategory, string> = {
  unsupported_claim: 'Unsupported claim',
  weak_question: 'Weak question',
  missing_source_reference: 'Missing source reference',
  confusing_language: 'Confusing employee language',
  overly_corporate_wording: 'Overly corporate wording',
  missing_critical_info: 'Missing critical information',
  needs_admin_approval: 'Needs admin approval',
};

export interface CritiqueIssue {
  id: UUID;
  category: CritiqueIssueCategory;
  severity: CritiqueSeverity;
  /** Lesson title or section identifier where the issue was found. */
  lesson_title?: string;
  /** Module index 0-based (for cross-referencing with GeneratedModulePreview). */
  module_index?: number;
  /** Short summary of the issue. */
  summary: string;
  /** Detailed explanation. */
  detail: string;
  /** Suggested fix if AI can propose one. */
  suggested_fix?: string;
  /** Whether the admin has marked this issue as ignored (with note). */
  ignored: boolean;
  /** Free text note when ignored. */
  ignored_note?: string;
}

export interface SelfCritiqueReport {
  module_title: string;
  generated_at: ISODateTime;
  issues: CritiqueIssue[];
  /** True when at least one high-severity issue exists AND none of them are ignored. */
  blocks_publish: boolean;
}

export interface SourceExcerpt {
  /** Drive file ID this excerpt comes from. */
  drive_file_id: string;
  /** Source file title for display. */
  source_title: string;
  /** Section heading from the source file. */
  section_heading: string;
  /** Body text of the matched section (markdown). */
  section_body: string;
  /** What portion of the body was highlighted as the grounding for the generated lesson. */
  highlighted_span?: { start: number; end: number };
}

export interface LessonReviewItem {
  lesson_index: number;
  module_index: number;
  lesson_title: string;
  confidence: LessonConfidenceLevel;
  /** Auto-flagged when the generated body contains an unsupported claim. */
  has_unsupported_claim: boolean;
  /** Free text describing the unsupported claim if any. */
  unsupported_note?: string;
  status: LessonReviewStatus;
  /** Source-section excerpts the generation drew from. */
  source_excerpts: SourceExcerpt[];
}

export const LESSON_GENERATION_STATUS_LABELS: Record<LessonGenerationStatus, string> = {
  draft: 'Draft',
  needs_review: 'Needs review',
  unsupported_claim: 'Unsupported claim',
  missing_source: 'Missing source',
  ready_for_approval: 'Ready for approval',
};

export interface GeneratedLessonContent {
  lesson_index: number;
  module_index: number;
  title: string;
  lesson_type: LessonType;
  body_markdown?: string;
  quiz_questions?: QuizQuestion[];
  acknowledgment_text?: string;
  status: LessonGenerationStatus;
  status_note?: string;
  source_refs?: { drive_file_id: string; section_count: number }[];
}

export interface GeneratedModulePreview {
  module_title: string;
  lessons: GeneratedLessonContent[];
  generated_at: ISODateTime;
  is_complete: boolean;
}

/**
 * A single parsed section of source material — typically derived from
 * a markdown heading and the text content underneath it until the next
 * sibling-or-higher heading.
 *
 * Section levels follow markdown heading levels (1=H1, 2=H2, 3=H3, ...).
 * The Foundry uses these as the unit of source grounding: each generated
 * lesson should be traceable back to one or more sections.
 */
/**
 * Logical grouping of source files used for module generation.
 */
export interface SourceBinder {
  id: UUID;
  org_id: UUID;
  title: string;
  version_number: number;
  created_by: UUID;
  created_at: ISODateTime;
}

/**
 * Canonical source document record representing parsed content from a file revision.
 */
export interface SourceDocument {
  id: UUID;
  source_file_id: UUID;
  source_file_version_id: UUID;
  title: string;
  sections: SourceSection[];
  created_at: ISODateTime;
}

export interface SourceSection {
  id: UUID;
  /** Heading level (1=H1, 2=H2, 3=H3). Sections without a heading get level 0. */
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Heading text. Empty string if section has no heading (level 0). */
  heading: string;
  /** Section body content (markdown, with the heading line stripped). */
  body: string;
  /** Position in the source document (0-indexed, document order). */
  position_index: number;
  /** True when the section contains placeholder tokens that block generation. */
  has_placeholders: boolean;
}

export type SourceAuthorityLevel = 'authoritative' | 'supporting' | 'context';

export interface SourceFile {
  id: UUID;
  drive_file_id: string;
  drive_path?: string;
  title: string;
  mime_type: string;
  authority: SourceAuthorityLevel;
  /** How the authority value was resolved at ingest time. */
  authority_source: 'frontmatter' | 'meta_md' | 'default';
  topic?: string;
  current_version_id?: UUID;
  last_synced_at?: ISODateTime;
  processing_status: 'pending' | 'processing' | 'processed' | 'failed';
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface SourceFileVersion {
  id: UUID;
  source_file_id: UUID;
  head_revision_id: string;
  content_hash?: string;
  size_bytes?: number;
  modified_time?: ISODateTime;
  raw_text?: string;
  raw_text_preview?: string;
  parse_status: 'pending' | 'processing' | 'processed' | 'failed';
  created_at: ISODateTime;
}

/**
 * Reference from a generated lesson/claim back to a specific source file + section + revision.
 * This is what powers source grounding (Slice 3.4) and version-impact detection (Slice 7.3).
 */
export interface SourceReference {
  source_file_id: UUID;
  source_file_version_id: UUID;
  source_section_id?: UUID;
  /** Optional excerpt highlighted as the grounding for the claim. */
  highlighted_text?: string;
}

export interface ModuleSourceBinding {
  id: UUID;
  module_id: string;
  source_file_id: UUID;
  source_file_version_id: UUID;
  source_section_id?: UUID;
  binding_kind: 'whole_file' | 'section';
  flagged_for_review: boolean;
  flag_reason?: 'equal_authority_conflict' | 'stale' | null;
  created_at: ISODateTime;
}

/**
 * Publish-state lifecycle for a module version (Slice 7.2 — module versioning).
 */
export type FoundryDraftStage =
  | 'basics'
  | 'source'
  | 'questions'
  | 'outline'
  | 'preview'
  | 'critique'
  | 'sidebyside'
  | 'blockers'
  | 'published';

export interface LearningOutcome {
  /** Stable client UUID for editing UX. */
  id: string;
  /** Bullet text: "Submit an expense report through the new ERP system within their first week." */
  text: string;
}

export interface FoundryDraftMetadata {
  current_stage?: FoundryDraftStage;
  last_actor?: {
    user_id?: UUID;
    display_name?: string;
  };
  basics?: {
    audience_archetype?: CanonicalAudience;
    audience_refinement?: string;
    completion_required?: 'required' | 'recommended' | 'optional';
    training_type?: TrainingType;
    estimated_minutes?: number;
    learning_outcomes?: LearningOutcome[];
  };
  [key: string]: unknown;
}

export interface ModuleVersion {
  id: UUID;
  module_id: UUID;
  /** Human-readable module title at the time this version was created. */
  module_title: string;
  version_number: number;
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
  published_at?: ISODateTime;
  published_by?: UUID;
  /** Admin/reviewer who approved this version for publication. */
  approved_by?: UUID;
  /** Source binder version this module version was generated from. */
  source_binder_version?: UUID;
  /** Assessment version paired with this module version. */
  assessment_version?: UUID;
  /** Advisory flag only: a source change touched this version but does not alter publish status. */
  source_stale?: boolean;
  /** Timestamp when the advisory stale flag was set. */
  stale_since?: ISODateTime;
  /** Cached/mock count used by admin history views; live helpers can recompute it. */
  completed_count?: number;
  /** Foundry-only draft persistence payload used for cross-session resume. */
  draft_metadata?: FoundryDraftMetadata;
  created_at: ISODateTime;
}

/**
 * Detected source change event — Slice 7.3 source impact detection.
 */
export interface SourceChangeEvent {
  id: UUID;
  source_file_id: string;
  source_file_name: string;
  section_ids_changed: string[];
  old_revision_id: string;
  new_revision_id: string;
  detected_at: ISODateTime;
  status: 'unreviewed' | 'reviewed' | 'resolved';
}

/**
 * Admin review record for AI-generated content — broader review surface (covers outline/lesson/assessment reviews).
 */
export interface GeneratedContentReview {
  id: UUID;
  module_version_id: UUID;
  reviewer_id: UUID;
  review_type: 'outline' | 'lesson' | 'assessment' | 'side_by_side';
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  reviewed_at?: ISODateTime;
  created_at: ISODateTime;
}

/**
 * Training assignment record — Slice 6.1 admin assignment flow.
 */
export interface Assignment {
  id: UUID;
  module_version_id: UUID;
  /** Assignee — single user OR a group/role. */
  assignee_user_id?: UUID;
  assignee_role?: Role;
  assigned_by: UUID;
  assigned_at: ISODateTime;
  due_at?: ISODateTime;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

/**
 * Audit event taxonomy — Slice 7.4 audit log UI.
 *
 * These string literals mirror the future persisted audit table event names so
 * the local mock store can be swapped for Supabase reads with minimal UI churn.
 */
export const AUDIT_EVENT_TYPES = [
  'module_created',
  'source_uploaded',
  'outline_generated',
  'outline_approved',
  'module_generated',
  'self_critique_completed',
  'lesson_approved',
  'module_published',
  'module_version_forked',
  'assignment_created',
  'employee_completed_module',
  'quiz_attempted',
  'source_change_detected',
  'stale_lesson_regenerated',
  'user_onboarded',
] as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

/**
 * Audit log entry — Slice 7.4 audit log UI.
 */
export interface AuditLog {
  id: UUID;
  event_type: AuditEventType;
  actor_user_id: UUID;
  actor_name: string;
  entity_type: 'module' | 'module_version' | 'source_file' | 'assignment' | 'lesson' | 'quiz' | 'user';
  entity_id: string;
  entity_label: string;
  occurred_at: ISODateTime;
  metadata?: Record<string, string | number | boolean>;
}

export interface SourceMaterial {
  id: UUID;
  title: string;
  type: 'pdf' | 'markdown' | 'docx' | 'notion' | 'web_url';
  /** Full raw text (e.g. the pasted markdown). Optional for non-text source types. */
  raw_text?: string;
  raw_text_preview?: string;
  processing_status: 'pending' | 'processed' | 'failed';
  /** Parsed sections from the raw text (empty array when not yet processed). */
  sections: SourceSection[];
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

export interface AdminModuleListItem {
  /** Stable row key for admin list views; remains the module_version id for back-compat. */
  id: string;
  /** Stable module id used for module-level routes. */
  module_id: UUID;
  /** Stable module version id; should match `id`. */
  module_version_id: UUID;
  /** Human-readable version sequence number for this module version. */
  version_number: number;
  /** Human-readable module title shown in dashboard lists. */
  title: string;
  /** Current admin lifecycle state for the module. */
  status: 'Draft' | 'Needs review' | 'Published' | 'Archived';
  /** Human-readable timestamp or review context detail. */
  meta: string;
  /** Optional Foundry resume payload for draft rows. */
  draft_metadata?: FoundryDraftMetadata;
}

export interface AdminDashboardMetrics {
  /** Number of modules currently in draft authoring. */
  drafts: number;
  /** Number of modules waiting for admin/HR review. */
  needs_review: number;
  /** Number of modules currently published. */
  published: number;
  /** Number of archived module versions. */
  archived: number;
  /** Number of learners actively progressing through assigned training. */
  learners_in_progress: number;
  /** Number of module generation jobs currently queued or running. */
  pending_generation_jobs: number;
}

export interface AdminDashboardSummary {
  /** Top-level KPI metrics for the admin dashboard shell. */
  metrics: AdminDashboardMetrics;
  /** Modules currently being authored. */
  drafts: AdminModuleListItem[];
  /** Modules currently waiting for review. */
  needs_review: AdminModuleListItem[];
  /** Modules currently available to learners. */
  published: AdminModuleListItem[];
  /** Lightweight at-a-glance assignment stats for dashboard footer. */
  assignment_summary: {
    active_assignments: number;
    overdue: number;
    completion_rate_percent: number | null;
  };
}

export interface LearnerDashboardSummary {
  learner: LearnerProfile;
  current_enrollment: Enrollment & { course: Course };
  next_lesson: Lesson | null;
  recent_completions: LessonProgress[];
  support_contact?: { name: string; role: string };
}
