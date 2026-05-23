import { supabase } from '@/integrations/supabase/client'
import {
  mapAssessmentAttemptRow,
  mapUserTrainingEnrollmentRow,
  mapUserTrainingProgressRow,
} from '@/integrations/supabase/db-rows'
import type {
  AssessmentAttempt,
  Enrollment,
  EnrollmentStatus,
  ISODateTime,
  LessonProgress,
  ProgressStatus,
  UUID,
} from '@/types/training'
import type { Json } from '@/integrations/supabase/types'
import { createClientSideUUID, normalizeClientUUID, safeRetry } from './_idempotency'
import { requireMutationData, throwOnMutationError } from './_response'

export async function upsertLessonProgress(input: {
  enrollment_id: UUID
  lesson_id: UUID
  user_id: UUID
  status: ProgressStatus
  time_spent_seconds: number
  completed_at?: ISODateTime
}): Promise<LessonProgress> {
  const result = await safeRetry(() =>
    supabase
      .from('user_training_progress')
      .upsert(
        {
          enrollment_id: normalizeClientUUID(input.enrollment_id, 'user_training_enrollments'),
          lesson_id: normalizeClientUUID(input.lesson_id, 'training_lessons'),
          user_id: normalizeClientUUID(input.user_id, 'auth_users'),
          status: input.status,
          time_spent_seconds: input.time_spent_seconds,
          completed_at: input.completed_at ?? null,
        },
        { onConflict: 'enrollment_id,lesson_id' },
      )
      .select('*')
      .single(),
  )

  throwOnMutationError('upsert lesson progress', result.error)
  return mapUserTrainingProgressRow(requireMutationData('upsert lesson progress', result.data))
}

export async function insertAttempt(input: {
  enrollment_id: UUID
  lesson_id: UUID
  score_percent: number
  passed: boolean
  answers: Record<string, number>
}): Promise<AssessmentAttempt> {
  const result = await safeRetry(() =>
    supabase
      .from('assessment_attempts')
      .insert({
        id: createClientSideUUID('assessment-attempt'),
        enrollment_id: normalizeClientUUID(input.enrollment_id, 'user_training_enrollments'),
        lesson_id: normalizeClientUUID(input.lesson_id, 'training_lessons'),
        score_percent: input.score_percent,
        passed: input.passed,
        answers: input.answers as Json,
      })
      .select('*')
      .single(),
  )

  throwOnMutationError('insert assessment attempt', result.error)
  return mapAssessmentAttemptRow(requireMutationData('insert assessment attempt', result.data))
}

export async function insertAcknowledgment(input: {
  enrollment_id: UUID
  lesson_id: UUID
  statement_text: string
}): Promise<{ acknowledged_at: string }> {
  const result = await safeRetry(() =>
    supabase
      .from('acknowledgments')
      .upsert(
        {
          enrollment_id: normalizeClientUUID(input.enrollment_id, 'user_training_enrollments'),
          lesson_id: normalizeClientUUID(input.lesson_id, 'training_lessons'),
          statement_text: input.statement_text,
        },
        { onConflict: 'enrollment_id,lesson_id' },
      )
      .select('acknowledged_at')
      .single(),
  )

  throwOnMutationError('insert acknowledgment', result.error)
  return requireMutationData('insert acknowledgment', result.data)
}

export async function upsertEnrollment(input: {
  user_id: UUID
  course_id: UUID
  status: EnrollmentStatus
}): Promise<Enrollment> {
  const result = await safeRetry(() =>
    supabase
      .from('user_training_enrollments')
      .upsert(
        {
          user_id: normalizeClientUUID(input.user_id, 'auth_users'),
          course_id: normalizeClientUUID(input.course_id, 'training_courses'),
          status: input.status,
        },
        { onConflict: 'user_id,course_id' },
      )
      .select('*')
      .single(),
  )

  throwOnMutationError('upsert enrollment', result.error)
  return mapUserTrainingEnrollmentRow(requireMutationData('upsert enrollment', result.data))
}
