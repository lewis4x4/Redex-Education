import {
  DEMO_ENROLLMENT,
  DEMO_HR_BASICS_ENROLLMENT,
  DEMO_HR_BASICS_LESSONS,
  DEMO_LESSONS,
} from '@/lib/education'
import { getModuleVersionId } from '@/lib/education/moduleVersions'
import type { AssessmentAttempt, Assignment, Enrollment, Lesson, UUID } from '@/lib/education'

interface GetCompletedLearnersForVersionInput {
  versionId: UUID
  assignments: Assignment[]
  attempts: AssessmentAttempt[]
  lessons?: Lesson[]
  enrollments?: Enrollment[]
}

const DEFAULT_LESSONS = [...DEMO_LESSONS, ...DEMO_HR_BASICS_LESSONS]
const DEFAULT_ENROLLMENTS = [DEMO_ENROLLMENT, DEMO_HR_BASICS_ENROLLMENT]

function getQuizLessonIdsForVersion(versionId: string, lessons: Lesson[]): Set<string> {
  return new Set(
    lessons
      .filter((lesson) => lesson.lesson_type === 'quiz' && getModuleVersionId(lesson.module_id) === versionId)
      .map((lesson) => lesson.id),
  )
}

export function getCompletedLearnersForVersion({
  versionId,
  assignments,
  attempts,
  lessons = DEFAULT_LESSONS,
  enrollments = DEFAULT_ENROLLMENTS,
}: GetCompletedLearnersForVersionInput): UUID[] {
  const completedLearnerIds = new Set<UUID>()

  assignments
    .filter((assignment) => assignment.module_version_id === versionId && assignment.status === 'completed')
    .forEach((assignment) => {
      if (assignment.assignee_user_id) {
        completedLearnerIds.add(assignment.assignee_user_id)
      }
    })

  const quizLessonIds = getQuizLessonIdsForVersion(versionId, lessons)
  const enrollmentToUser = new Map(enrollments.map((enrollment) => [enrollment.id, enrollment.user_id]))

  attempts
    .filter((attempt) => attempt.passed && quizLessonIds.has(attempt.lesson_id))
    .forEach((attempt) => {
      const learnerId = enrollmentToUser.get(attempt.enrollment_id)

      if (learnerId) {
        completedLearnerIds.add(learnerId)
      }
    })

  return [...completedLearnerIds]
}
