// ============================================================
// Supabase Row Type Aliases — Row vs Domain Boundary
//
// This file is the BORDER between database row shapes (raw Supabase
// output) and the canonical domain models the UI consumes
// (`@/types/training` via the `@/lib/education` facade).
//
// Why this file exists:
//   - Database tables evolve. Column renames, nullability changes,
//     and JSON column shapes all change. UI components must not be
//     coupled to those churns.
//   - Mappers (introduced when real Supabase reads land) translate
//     Row → Domain. Components consume Domain. Period.
//
// Phase 1 scope:
//   - Establish the boundary file (this file).
//   - Declare aliases for the rows we expect to consume.
//   - Do NOT implement mappers yet — they land alongside real reads.
//
// HARD RULE:
//   UI components MUST NOT import from this file. Only mappers,
//   facade adapters, and tests may. Lint will enforce this in a
//   later phase.
// ============================================================

import type { Database } from './types';

// Convenience helpers over the generated Supabase types.
type Tables = Database['public']['Tables'];

/** Row shape for the `training_courses` table (when wired). */
export type TrainingCourseRow = Tables extends { training_courses: { Row: infer R } }
  ? R
  : never;

/** Row shape for the `training_modules` table (when wired). */
export type TrainingModuleRow = Tables extends { training_modules: { Row: infer R } }
  ? R
  : never;

/** Row shape for the `training_lessons` table (when wired). */
export type TrainingLessonRow = Tables extends { training_lessons: { Row: infer R } }
  ? R
  : never;

/** Row shape for the `user_training_enrollments` table (when wired). */
export type UserTrainingEnrollmentRow = Tables extends {
  user_training_enrollments: { Row: infer R };
}
  ? R
  : never;

/** Row shape for the `user_training_progress` table (when wired). */
export type UserTrainingProgressRow = Tables extends {
  user_training_progress: { Row: infer R };
}
  ? R
  : never;

// ============================================================
// FUTURE WORK (do not implement until Supabase reads are wired):
//
//   export function mapCourseRow(row: TrainingCourseRow): Course { ... }
//   export function mapModuleRow(row: TrainingModuleRow): Module { ... }
//   export function mapLessonRow(row: TrainingLessonRow): Lesson { ... }
//   export function mapEnrollmentRow(row: UserTrainingEnrollmentRow): Enrollment { ... }
//   export function mapProgressRow(row: UserTrainingProgressRow): LessonProgress { ... }
//
// Each mapper should:
//   1) Validate enum-ish columns (status, criticality) before casting.
//   2) Parse JSON columns (`content`, `rubric`) through a guard
//      function — never `as LessonContent`.
//   3) Throw a descriptive error if a row is structurally invalid,
//      so the developer sees the schema drift immediately.
// ============================================================
