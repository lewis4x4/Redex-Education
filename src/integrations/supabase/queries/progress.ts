import { supabase } from '@/integrations/supabase/client'
import {
  mapAssessmentAttemptRow,
  mapUserTrainingEnrollmentRow,
  mapUserTrainingProgressRow,
} from '@/integrations/supabase/db-rows'
import type { AssessmentAttempt, Enrollment, LessonProgress } from '@/types/training'

export async function fetchProgressForUser(userId: string): Promise<LessonProgress[]> {
  const { data, error } = await supabase
    .from('user_training_progress')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapUserTrainingProgressRow)
}

export async function fetchAttemptsForLesson(lessonId: string): Promise<AssessmentAttempt[]> {
  const { data, error } = await supabase
    .from('assessment_attempts')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('attempted_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapAssessmentAttemptRow)
}

export async function fetchEnrollmentsForUser(userId: string): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from('user_training_enrollments')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapUserTrainingEnrollmentRow)
}
