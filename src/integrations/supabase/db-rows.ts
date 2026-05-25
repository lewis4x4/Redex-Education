// ============================================================
// Supabase Row Type Aliases — Row vs Domain Boundary
//
// This file is the BORDER between database row shapes (raw Supabase
// output) and the canonical domain models the UI consumes
// (`@/types/training` via the `@/lib/education` facade).
// ============================================================

import type {
  AssessmentAttempt,
  Assignment,
  Course,
  CourseStatus,
  Criticality,
  Enrollment,
  EnrollmentStatus,
  FoundryDraftMetadata,
  Lesson,
  LessonContent,
  LessonProgress,
  LessonType,
  Module,
  ModuleSourceBinding,
  ModuleVersion,
  ProgressStatus,
  ResourceLink,
  Role,
  SourceFile,
  SourceFileVersion,
  SourceSection,
  User,
} from '@/types/training'
import type { Database, Json } from './types'

// Convenience helpers over the generated Supabase types.
// Redex Education tables live in the `redex` schema (ADR 017).
type Tables = Database['redex']['Tables']

/** Row shape for the `profiles` table. */
export type ProfileRow = Tables extends { profiles: { Row: infer R } } ? R : never

/** Row shape for the `training_courses` table. */
export type TrainingCourseRow = Tables extends { training_courses: { Row: infer R } }
  ? R
  : never

/** Row shape for the `training_modules` table. */
export type TrainingModuleRow = Tables extends { training_modules: { Row: infer R } }
  ? R
  : never

/** Row shape for the `training_lessons` table. */
export type TrainingLessonRow = Tables extends { training_lessons: { Row: infer R } }
  ? R
  : never

/** Row shape for the `user_training_enrollments` table. */
export type UserTrainingEnrollmentRow = Tables extends {
  user_training_enrollments: { Row: infer R }
}
  ? R
  : never

/** Row shape for the `user_training_progress` table. */
export type UserTrainingProgressRow = Tables extends {
  user_training_progress: { Row: infer R }
}
  ? R
  : never

/** Row shape for the `assignments` table. */
export type AssignmentRow = Tables extends { assignments: { Row: infer R } } ? R : never

/** Row shape for the `assessment_attempts` table. */
export type AssessmentAttemptRow = Tables extends { assessment_attempts: { Row: infer R } }
  ? R
  : never

/** Row shape for the `source_files` table. */
export type SourceFileRow = Tables extends { source_files: { Row: infer R } } ? R : never

/** Row shape for the `source_file_versions` table. */
export type SourceFileVersionRow = Tables extends {
  source_file_versions: { Row: infer R }
}
  ? R
  : never

/** Row shape for the `source_sections` table. */
export type SourceSectionRow = Tables extends { source_sections: { Row: infer R } } ? R : never

/** Row shape for the `module_source_bindings` table. */
export type ModuleSourceBindingRow = Tables extends {
  module_source_bindings: { Row: infer R }
}
  ? R
  : never

/** Row shape for the `media_assets` table. */
export type MediaAssetRow = Tables extends { media_assets: { Row: infer R } } ? R : never

/** Row shape for the `module_versions` table. */
export type ModuleVersionRow = Tables extends { module_versions: { Row: infer R } } ? R : never

const ROLES = ['admin', 'foundry_author', 'manager', 'learner'] as const
const COURSE_STATUSES = ['draft', 'in_review', 'published', 'archived'] as const
const COURSE_LEVELS = ['foundational', 'intermediate', 'advanced'] as const
const CRITICALITIES = ['required', 'recommended', 'optional', 'bonus'] as const
const LESSON_TYPES = [
  'text',
  'checklist',
  'acknowledgment',
  'quiz',
  'scenario',
  'video',
  'coach',
  'assignment',
  'reflection_prompt',
] as const
const ENROLLMENT_STATUSES = ['invited', 'active', 'completed', 'dropped'] as const
const PROGRESS_STATUSES = ['not_started', 'in_progress', 'completed', 'skipped', 'failed'] as const
const ASSIGNMENT_STATUSES = ['pending', 'in_progress', 'completed', 'overdue'] as const
const SOURCE_AUTHORITIES = ['authoritative', 'supporting', 'context'] as const
const SOURCE_AUTHORITY_SOURCES = ['frontmatter', 'meta_md', 'default'] as const
const SOURCE_PROCESSING_STATUSES = ['pending', 'processing', 'processed', 'failed'] as const
const BINDING_KINDS = ['whole_file', 'section'] as const
const BINDING_FLAG_REASONS = ['equal_authority_conflict', 'stale'] as const
const MODULE_VERSION_STATUSES = ['draft', 'in_review', 'approved', 'published', 'archived'] as const
const RESOURCE_TYPES = ['pdf', 'link', 'video', 'notion'] as const

function isOneOf<const T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === 'string' && allowed.includes(value)
}

function requiredString(value: unknown, context: string, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${context}: missing required field ${field}`)
  }

  return value
}

function requiredStringValue(value: unknown, context: string, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${context}: missing required field ${field}`)
  }

  return value
}

function requiredNumber(value: unknown, context: string, field: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${context}: missing required field ${field}`)
  }

  return value
}

function requiredBoolean(value: unknown, context: string, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${context}: missing required field ${field}`)
  }

  return value
}

function optionalString(value: string | null): string | undefined {
  return value ?? undefined
}

function requiredEnum<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  context: string,
  field: string,
): T[number] {
  if (!isOneOf(value, allowed)) {
    throw new Error(`${context}: invalid ${field} value ${String(value)}`)
  }

  return value
}

function requiredJsonObject(value: Json, context: string, field: string): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new Error(`${context}: missing required field ${field}`)
  }

  return value as Record<string, unknown>
}

function stringArrayFromJson(value: Json, context: string, field: string): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`${context}: invalid ${field}; expected string array`)
  }

  return value
}

function recordOfNumbersFromJson(value: Json, context: string, field: string): Record<string, number> {
  const object = requiredJsonObject(value, context, field)

  for (const [key, nestedValue] of Object.entries(object)) {
    if (typeof nestedValue !== 'number' || Number.isNaN(nestedValue)) {
      throw new Error(`${context}: invalid ${field}.${key}; expected number`)
    }
  }

  return object as Record<string, number>
}

function mapResourcesJson(value: Json | null, context: string): ResourceLink[] | undefined {
  if (value === null) return undefined
  if (!Array.isArray(value)) {
    throw new Error(`${context}: invalid resources; expected array`)
  }

  return value.map((item, index) => {
    if (item === null || Array.isArray(item) || typeof item !== 'object') {
      throw new Error(`${context}: invalid resources[${index}]; expected object`)
    }

    const object = item as Record<string, unknown>
    return {
      label: requiredString(object.label, context, `resources[${index}].label`),
      url: requiredString(object.url, context, `resources[${index}].url`),
      type: requiredEnum(object.type, RESOURCE_TYPES, context, `resources[${index}].type`),
    }
  })
}

function mapLessonContentJson(value: Json, expectedType: LessonType, context: string): LessonContent {
  const object = requiredJsonObject(value, context, 'content')
  const contentType = requiredEnum(object.type, LESSON_TYPES, context, 'content.type')

  if (contentType !== expectedType) {
    throw new Error(`${context}: content.type ${contentType} does not match lesson_type ${expectedType}`)
  }

  // Slice 8.3 intentionally keeps per-variant validation lenient. The guard
  // enforces only the discriminant and object shape so schema drift is loud
  // without blocking existing/generated lesson payload variants.
  return object as unknown as LessonContent
}

function mapSourceSectionLevel(level: number, context: string): SourceSection['level'] {
  if (!Number.isInteger(level) || level < 0 || level > 6) {
    throw new Error(`${context}: invalid level value ${String(level)}`)
  }

  return level as SourceSection['level']
}

export function mapProfileRow(row: ProfileRow): User {
  const context = `profiles row ${String(row.id)}`

  return {
    id: requiredString(row.id, context, 'id'),
    org_id: requiredString(row.org_id, context, 'org_id'),
    email: requiredString(row.email, context, 'email'),
    display_name: requiredString(row.display_name, context, 'display_name'),
    role: requiredEnum(row.role, ROLES, context, 'role') as Role,
    department: optionalString(row.department),
    manager_id: optionalString(row.manager_id),
    start_date: optionalString(row.start_date),
    created_at: requiredString(row.created_at, context, 'created_at'),
    updated_at: requiredString(row.updated_at, context, 'updated_at'),
  }
}

export function mapTrainingCourseRow(row: TrainingCourseRow): Course {
  const context = `training_courses row ${String(row.id)}`

  return {
    id: requiredString(row.id, context, 'id'),
    org_id: requiredString(row.org_id, context, 'org_id'),
    title: requiredString(row.title, context, 'title'),
    slug: requiredString(row.slug, context, 'slug'),
    description: optionalString(row.description),
    status: requiredEnum(row.status, COURSE_STATUSES, context, 'status') as CourseStatus,
    level: requiredEnum(row.level, COURSE_LEVELS, context, 'level'),
    estimated_minutes: requiredNumber(row.estimated_minutes, context, 'estimated_minutes'),
    learning_objectives: stringArrayFromJson(row.learning_objectives, context, 'learning_objectives'),
    created_at: requiredString(row.created_at, context, 'created_at'),
    updated_at: requiredString(row.updated_at, context, 'updated_at'),
  }
}

export function mapTrainingModuleRow(row: TrainingModuleRow): Module {
  const context = `training_modules row ${String(row.id)}`

  return {
    id: requiredString(row.id, context, 'id'),
    course_id: requiredString(row.course_id, context, 'course_id'),
    title: requiredString(row.title, context, 'title'),
    order_index: requiredNumber(row.order_index, context, 'order_index'),
    criticality: requiredEnum(row.criticality, CRITICALITIES, context, 'criticality') as Criticality,
    estimated_minutes: requiredNumber(row.estimated_minutes, context, 'estimated_minutes'),
    unlock_rule: optionalString(row.unlock_rule),
  }
}

export function mapTrainingLessonRow(row: TrainingLessonRow): Lesson {
  const context = `training_lessons row ${String(row.id)}`
  const lessonType = requiredEnum(row.lesson_type, LESSON_TYPES, context, 'lesson_type') as LessonType

  return {
    id: requiredString(row.id, context, 'id'),
    module_id: requiredString(row.module_id, context, 'module_id'),
    title: requiredString(row.title, context, 'title'),
    lesson_type: lessonType,
    criticality: requiredEnum(row.criticality, CRITICALITIES, context, 'criticality') as Criticality,
    order_index: requiredNumber(row.order_index, context, 'order_index'),
    estimated_minutes: requiredNumber(row.estimated_minutes, context, 'estimated_minutes'),
    content: mapLessonContentJson(row.content, lessonType, context),
    resources: mapResourcesJson(row.resources, context),
  }
}

export function mapUserTrainingEnrollmentRow(row: UserTrainingEnrollmentRow): Enrollment {
  const context = `user_training_enrollments row ${String(row.id)}`

  return {
    id: requiredString(row.id, context, 'id'),
    user_id: requiredString(row.user_id, context, 'user_id'),
    course_id: requiredString(row.course_id, context, 'course_id'),
    status: requiredEnum(row.status, ENROLLMENT_STATUSES, context, 'status') as EnrollmentStatus,
    started_at: requiredString(row.started_at, context, 'started_at'),
    completed_at: optionalString(row.completed_at),
    progress_percentage: requiredNumber(row.progress_percentage, context, 'progress_percentage'),
  }
}

export function mapUserTrainingProgressRow(row: UserTrainingProgressRow): LessonProgress {
  const context = `user_training_progress row ${String(row.id)}`

  return {
    id: requiredString(row.id, context, 'id'),
    enrollment_id: requiredString(row.enrollment_id, context, 'enrollment_id'),
    lesson_id: requiredString(row.lesson_id, context, 'lesson_id'),
    status: requiredEnum(row.status, PROGRESS_STATUSES, context, 'status') as ProgressStatus,
    time_spent_seconds: requiredNumber(row.time_spent_seconds, context, 'time_spent_seconds'),
    completed_at: optionalString(row.completed_at),
    acknowledgment_id: optionalString(row.acknowledgment_id),
  }
}

export function mapAssignmentRow(row: AssignmentRow): Assignment {
  const context = `assignments row ${String(row.id)}`
  const assigneeRole = row.assignee_role === null
    ? undefined
    : requiredEnum(row.assignee_role, ROLES, context, 'assignee_role') as Role

  if ((row.assignee_user_id === null && assigneeRole === undefined) || (row.assignee_user_id !== null && assigneeRole !== undefined)) {
    throw new Error(`${context}: expected exactly one assignee field`)
  }

  return {
    id: requiredString(row.id, context, 'id'),
    module_version_id: requiredString(row.module_version_id, context, 'module_version_id'),
    assignee_user_id: optionalString(row.assignee_user_id),
    assignee_role: assigneeRole,
    assigned_by: requiredString(row.assigned_by, context, 'assigned_by'),
    assigned_at: requiredString(row.assigned_at, context, 'assigned_at'),
    due_at: optionalString(row.due_at),
    status: requiredEnum(row.status, ASSIGNMENT_STATUSES, context, 'status') as Assignment['status'],
  }
}

export function mapAssessmentAttemptRow(row: AssessmentAttemptRow): AssessmentAttempt {
  const context = `assessment_attempts row ${String(row.id)}`

  return {
    id: requiredString(row.id, context, 'id'),
    enrollment_id: requiredString(row.enrollment_id, context, 'enrollment_id'),
    lesson_id: requiredString(row.lesson_id, context, 'lesson_id'),
    attempted_at: requiredString(row.attempted_at, context, 'attempted_at'),
    score_percent: requiredNumber(row.score_percent, context, 'score_percent'),
    passed: requiredBoolean(row.passed, context, 'passed'),
    answers: recordOfNumbersFromJson(row.answers, context, 'answers'),
  }
}

export function mapSourceFileRow(row: SourceFileRow): SourceFile {
  const context = `source_files row ${String(row.id)}`

  return {
    id: requiredString(row.id, context, 'id'),
    drive_file_id: requiredString(row.drive_file_id, context, 'drive_file_id'),
    drive_path: optionalString(row.drive_path),
    title: requiredString(row.title, context, 'title'),
    mime_type: requiredString(row.mime_type, context, 'mime_type'),
    authority: requiredEnum(row.authority, SOURCE_AUTHORITIES, context, 'authority'),
    authority_source: requiredEnum(row.authority_source, SOURCE_AUTHORITY_SOURCES, context, 'authority_source'),
    topic: optionalString(row.topic),
    current_version_id: optionalString(row.current_version_id),
    last_synced_at: optionalString(row.last_synced_at),
    processing_status: requiredEnum(row.processing_status, SOURCE_PROCESSING_STATUSES, context, 'processing_status'),
    created_at: requiredString(row.created_at, context, 'created_at'),
    updated_at: requiredString(row.updated_at, context, 'updated_at'),
  }
}

export function mapSourceFileVersionRow(row: SourceFileVersionRow): SourceFileVersion {
  const context = `source_file_versions row ${String(row.id)}`

  return {
    id: requiredString(row.id, context, 'id'),
    source_file_id: requiredString(row.source_file_id, context, 'source_file_id'),
    head_revision_id: requiredString(row.head_revision_id, context, 'head_revision_id'),
    content_hash: optionalString(row.content_hash),
    size_bytes: row.size_bytes ?? undefined,
    modified_time: optionalString(row.modified_time),
    raw_text: optionalString(row.raw_text),
    raw_text_preview: optionalString(row.raw_text_preview),
    parse_status: requiredEnum(row.parse_status, SOURCE_PROCESSING_STATUSES, context, 'parse_status'),
    created_at: requiredString(row.created_at, context, 'created_at'),
  }
}

export function mapSourceSectionRow(row: SourceSectionRow): SourceSection {
  const context = `source_sections row ${String(row.id)}`

  return {
    id: requiredString(row.id, context, 'id'),
    level: mapSourceSectionLevel(requiredNumber(row.level, context, 'level'), context),
    heading: requiredStringValue(row.heading, context, 'heading'),
    body: requiredStringValue(row.body, context, 'body'),
    position_index: requiredNumber(row.position_index, context, 'position_index'),
    has_placeholders: requiredBoolean(row.has_placeholders, context, 'has_placeholders'),
  }
}

export function mapModuleSourceBindingRow(row: ModuleSourceBindingRow): ModuleSourceBinding {
  const context = `module_source_bindings row ${String(row.id)}`
  const flagReason = row.flag_reason === null
    ? undefined
    : requiredEnum(row.flag_reason, BINDING_FLAG_REASONS, context, 'flag_reason')

  return {
    id: requiredString(row.id, context, 'id'),
    module_id: requiredString(row.module_id, context, 'module_id'),
    source_file_id: requiredString(row.source_file_id, context, 'source_file_id'),
    source_file_version_id: requiredString(row.source_file_version_id, context, 'source_file_version_id'),
    source_section_id: optionalString(row.source_section_id),
    binding_kind: requiredEnum(row.binding_kind, BINDING_KINDS, context, 'binding_kind'),
    flagged_for_review: requiredBoolean(row.flagged_for_review, context, 'flagged_for_review'),
    flag_reason: flagReason,
    created_at: requiredString(row.created_at, context, 'created_at'),
  }
}

function optionalDraftMetadata(value: Json | null, context: string): FoundryDraftMetadata | undefined {
  if (value === null) {
    return undefined
  }

  if (Array.isArray(value) || typeof value !== 'object') {
    throw new Error(`${context}: invalid draft_metadata value`)
  }

  return value as FoundryDraftMetadata
}

export function mapModuleVersionRow(row: ModuleVersionRow): ModuleVersion {
  const context = `module_versions row ${String(row.id)}`

  return {
    id: requiredString(row.id, context, 'id'),
    module_id: requiredString(row.module_id, context, 'module_id'),
    module_title: requiredString(row.module_title, context, 'module_title'),
    version_number: requiredNumber(row.version_number, context, 'version_number'),
    status: requiredEnum(row.status, MODULE_VERSION_STATUSES, context, 'status') as ModuleVersion['status'],
    published_at: optionalString(row.published_at),
    published_by: optionalString(row.published_by),
    approved_by: optionalString(row.approved_by),
    source_binder_version: optionalString(row.source_binder_version),
    assessment_version: optionalString(row.assessment_version),
    source_stale: requiredBoolean(row.source_stale, context, 'source_stale'),
    stale_since: optionalString(row.stale_since),
    completed_count: row.completed_count ?? undefined,
    draft_metadata: optionalDraftMetadata(row.draft_metadata, context),
    created_at: requiredString(row.created_at, context, 'created_at'),
  }
}
