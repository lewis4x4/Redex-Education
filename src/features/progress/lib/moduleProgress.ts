import type { AssessmentAttempt, Lesson, LessonProgress } from '@/types/training'

interface ComputeModuleProgressInput {
  moduleId: string
  lessons: Lesson[]
  lessonProgress: LessonProgress[]
  attempts: AssessmentAttempt[]
}

export function computeModuleProgress({
  moduleId,
  lessons,
  lessonProgress,
  attempts,
}: ComputeModuleProgressInput): {
  completed_lessons: number
  total_lessons: number
  percentage: number
  last_activity_at?: string
  completed_at?: string
} {
  const moduleLessons = lessons.filter((lesson) => lesson.module_id === moduleId)
  const moduleLessonIds = new Set(moduleLessons.map((lesson) => lesson.id))
  const moduleLessonProgress = lessonProgress.filter((progress) => moduleLessonIds.has(progress.lesson_id))
  const completedLessonProgress = moduleLessonProgress.filter((progress) => progress.status === 'completed')
  const total_lessons = moduleLessons.length
  const completed_lessons = completedLessonProgress.length
  const percentage = total_lessons > 0 ? Math.round((completed_lessons / total_lessons) * 100) : 0

  const activityTimestamps = [
    ...moduleLessonProgress.flatMap((progress) => (progress.completed_at ? [progress.completed_at] : [])),
    ...attempts
      .filter((attempt) => moduleLessonIds.has(attempt.lesson_id))
      .map((attempt) => attempt.attempted_at),
  ].sort()

  const completedTimestamps = completedLessonProgress
    .flatMap((progress) => (progress.completed_at ? [progress.completed_at] : []))
    .sort()

  const last_activity_at = activityTimestamps.at(-1)
  const completed_at =
    total_lessons > 0 && completed_lessons === total_lessons ? completedTimestamps.at(-1) : undefined

  return {
    completed_lessons,
    total_lessons,
    percentage,
    ...(last_activity_at ? { last_activity_at } : {}),
    ...(completed_at ? { completed_at } : {}),
  }
}
