import { computeModuleProgress } from '@/features/progress/lib/moduleProgress'
import {
  DEMO_HR_BASICS_LESSONS,
  DEMO_HR_BASICS_MODULE,
  MOCK_LEARNER_ANA,
  MOCK_LEARNER_ANA_PROFILE,
  MOCK_LEARNER_MARCUS,
  MOCK_LEARNER_MARCUS_PROFILE,
} from '@/lib/education'
import { MOCK_MANAGER_REPORTS } from '@/lib/education/mockManagerReports'
import { MODULE_TO_VERSION_MAP } from '@/lib/education/moduleVersions'
import type { AssessmentAttempt, Assignment, ISODateTime, LessonProgress, User, UUID } from '@/types/training'

export type TeamTrainingStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'failed'

export interface TeamMemberTrainingStatus {
  user_id: UUID
  name: string
  role_label: string
  assignment_id?: UUID
  module_title?: string
  status: TeamTrainingStatus
  progress_percentage: number
  score_percent?: number
  due_at?: ISODateTime
  last_activity_at?: ISODateTime
}

export interface ComputeTeamProgressInput {
  managerId: UUID
  learners: User[]
  assignments: Assignment[]
  attempts: AssessmentAttempt[]
  currentLearnerId: UUID
  currentLearnerLessonProgress: LessonProgress[]
  now?: Date | ISODateTime
}

const HR_BASICS_MODULE_VERSION_ID = MODULE_TO_VERSION_MAP[DEMO_HR_BASICS_MODULE.id]
const DEFAULT_PASSING_THRESHOLD = 80

const ROLE_LABELS_BY_USER_ID: Record<UUID, string | undefined> = {
  [MOCK_LEARNER_MARCUS.id]: MOCK_LEARNER_MARCUS_PROFILE.role,
  [MOCK_LEARNER_ANA.id]: MOCK_LEARNER_ANA_PROFILE.role,
}

function getRoleLabel(user: User): string {
  return ROLE_LABELS_BY_USER_ID[user.id] ?? 'Learner'
}

function getHrBasicsAssignment(userId: UUID, assignments: Assignment[]): Assignment | undefined {
  return assignments.find(
    (assignment) =>
      assignment.assignee_user_id === userId && assignment.module_version_id === HR_BASICS_MODULE_VERSION_ID,
  )
}

function getQuizLesson() {
  return DEMO_HR_BASICS_LESSONS.find((lesson) => lesson.content.type === 'quiz')
}

function getPassingThreshold(): number {
  const quizLesson = getQuizLesson()
  return quizLesson?.content.type === 'quiz' ? quizLesson.content.passing_threshold ?? DEFAULT_PASSING_THRESHOLD : DEFAULT_PASSING_THRESHOLD
}

function getBestQuizScore(attempts: AssessmentAttempt[]): number | undefined {
  const quizLesson = getQuizLesson()
  if (!quizLesson) {
    return undefined
  }

  const scores = attempts
    .filter((attempt) => attempt.lesson_id === quizLesson.id)
    .map((attempt) => attempt.score_percent)

  return scores.length > 0 ? Math.max(...scores) : undefined
}

function getAssignmentPlaceholderProgress(status: Assignment['status']): number {
  if (status === 'completed') {
    return 100
  }

  if (status === 'in_progress') {
    return 50
  }

  return 0
}

function getNonCurrentLearnerStatus(assignment: Assignment): TeamTrainingStatus {
  if (assignment.status === 'pending') {
    return 'not_started'
  }

  return assignment.status
}

function applyOverdue(status: TeamTrainingStatus, dueAt: ISODateTime | undefined, now: Date): TeamTrainingStatus {
  if (status === 'completed' || !dueAt) {
    return status
  }

  return new Date(dueAt).getTime() < now.getTime() ? 'overdue' : status
}

function buildBaseStatus(user: User, assignment: Assignment | undefined): Omit<TeamMemberTrainingStatus, 'status' | 'progress_percentage'> {
  return {
    user_id: user.id,
    name: user.display_name,
    role_label: getRoleLabel(user),
    module_title: assignment ? DEMO_HR_BASICS_MODULE.title : undefined,
    ...(assignment ? { assignment_id: assignment.id } : {}),
    ...(assignment?.due_at ? { due_at: assignment.due_at } : {}),
  }
}

export function computeTeamProgress({
  managerId,
  learners,
  assignments,
  attempts,
  currentLearnerId,
  currentLearnerLessonProgress,
  now = new Date(),
}: ComputeTeamProgressInput): TeamMemberTrainingStatus[] {
  const nowDate = now instanceof Date ? now : new Date(now)
  const passingThreshold = getPassingThreshold()
  const directReportIds = MOCK_MANAGER_REPORTS[managerId]
  const scopedLearners = directReportIds
    ? directReportIds
        .map((reportId) => learners.find((learner) => learner.id === reportId))
        .filter((learner): learner is User => learner !== undefined)
    : learners

  return scopedLearners.map((learner) => {
    const assignment = getHrBasicsAssignment(learner.id, assignments)
    const baseStatus = buildBaseStatus(learner, assignment)

    if (!assignment) {
      return {
        ...baseStatus,
        status: 'not_started',
        progress_percentage: 0,
      }
    }

    if (learner.id !== currentLearnerId) {
      const status = applyOverdue(getNonCurrentLearnerStatus(assignment), assignment.due_at, nowDate)

      return {
        ...baseStatus,
        status,
        progress_percentage: getAssignmentPlaceholderProgress(assignment.status),
      }
    }

    const moduleProgress = computeModuleProgress({
      moduleId: DEMO_HR_BASICS_MODULE.id,
      lessons: DEMO_HR_BASICS_LESSONS,
      lessonProgress: currentLearnerLessonProgress,
      attempts,
    })
    const bestScore = getBestQuizScore(attempts)
    const hasAttempts = bestScore !== undefined
    const quizPassed = bestScore !== undefined && bestScore >= passingThreshold

    let status: TeamTrainingStatus = 'not_started'

    if (assignment.status === 'completed' || (moduleProgress.percentage === 100 && quizPassed)) {
      status = 'completed'
    } else if (hasAttempts && !quizPassed) {
      status = 'failed'
    } else if (moduleProgress.percentage > 0 || assignment.status === 'in_progress') {
      status = 'in_progress'
    }

    status = applyOverdue(status, assignment.due_at, nowDate)

    return {
      ...baseStatus,
      status,
      progress_percentage: assignment.status === 'completed' ? 100 : moduleProgress.percentage,
      ...(bestScore !== undefined ? { score_percent: bestScore } : {}),
      ...(moduleProgress.last_activity_at ? { last_activity_at: moduleProgress.last_activity_at } : {}),
    }
  })
}
