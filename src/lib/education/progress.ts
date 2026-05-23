import type { AssessmentAttempt, Enrollment, LessonProgress } from '@/types/training'
import { getDataSource } from './dataSource'
import { DEMO_ENROLLMENT, DEMO_HR_BASICS_ENROLLMENT } from './demo-data'
import * as supabaseDataProvider from './supabaseDataProvider'

const MOCK_ENROLLMENTS = [DEMO_ENROLLMENT, DEMO_HR_BASICS_ENROLLMENT]

export async function getProgressForUser(userId: string): Promise<LessonProgress[]> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getProgressForUser(userId)
  }

  if (userId.length === 0) return []
  return []
}

export async function getEnrollmentsForUser(userId: string): Promise<Enrollment[]> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getEnrollmentsForUser(userId)
  }

  return MOCK_ENROLLMENTS.filter((enrollment) => enrollment.user_id === userId)
}

export async function getAttemptsForLesson(lessonId: string): Promise<AssessmentAttempt[]> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getAttemptsForLesson(lessonId)
  }

  if (lessonId.length === 0) return []
  return []
}
