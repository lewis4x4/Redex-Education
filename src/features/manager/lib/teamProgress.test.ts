import { describe, expect, it } from 'vitest'

import { computeTeamProgress } from './teamProgress'
import {
  DEMO_HR_BASICS_LESSONS,
  MOCK_ASSIGNMENTS,
  MOCK_HR_ONBOARDING_ASSIGNMENT,
  MOCK_HR_ONBOARDING_ASSIGNMENT_ANA,
  MOCK_HR_ONBOARDING_ASSIGNMENT_COMPLETED,
  MOCK_LEARNER_ANA,
  MOCK_LEARNER_DEVON,
  MOCK_LEARNER_MARCUS,
  MOCK_MANAGER_USER,
} from '@/lib/education'
import type { AssessmentAttempt, Assignment, LessonProgress } from '@/types/training'

const NOW = '2026-05-23T12:00:00.000Z'
const QUIZ_LESSON_ID = 'hr-basics-lesson-6-final-quiz'

function progressForCompletedLessonIds(lessonIds: string[]): LessonProgress[] {
  return DEMO_HR_BASICS_LESSONS.map((lesson) => ({
    id: `lp-${lesson.id}`,
    enrollment_id: 'enroll-marcus-hr-basics-001',
    lesson_id: lesson.id,
    status: lessonIds.includes(lesson.id) ? 'completed' : 'not_started',
    time_spent_seconds: 60,
    ...(lessonIds.includes(lesson.id) ? { completed_at: '2026-05-23T10:00:00.000Z' } : {}),
  }))
}

function attempt(score: number): AssessmentAttempt {
  return {
    id: `attempt-${score}`,
    enrollment_id: 'enroll-marcus-hr-basics-001',
    lesson_id: QUIZ_LESSON_ID,
    attempted_at: '2026-05-23T10:30:00.000Z',
    score_percent: score,
    passed: score >= 80,
    answers: {},
  }
}

function compute(overrides: Partial<Parameters<typeof computeTeamProgress>[0]> = {}) {
  return computeTeamProgress({
    managerId: MOCK_MANAGER_USER.id,
    learners: [MOCK_LEARNER_MARCUS, MOCK_LEARNER_ANA, MOCK_LEARNER_DEVON],
    assignments: MOCK_ASSIGNMENTS,
    attempts: [],
    currentLearnerId: MOCK_LEARNER_MARCUS.id,
    currentLearnerLessonProgress: [],
    now: NOW,
    ...overrides,
  })
}

describe('computeTeamProgress', () => {
  it('marks Marcus in progress with computed partial lesson progress', () => {
    const statuses = compute({
      currentLearnerLessonProgress: progressForCompletedLessonIds([
        'hr-basics-lesson-1-welcome',
        'hr-basics-lesson-2-contact',
        'hr-basics-lesson-3-payroll-timekeeping',
      ]),
    })

    expect(statuses.find((status) => status.user_id === MOCK_LEARNER_MARCUS.id)).toEqual(
      expect.objectContaining({
        name: 'Marcus Chen',
        role_label: 'Operations Associate',
        status: 'in_progress',
        progress_percentage: 50,
      }),
    )
  })

  it('marks Marcus completed at 100% with the best passing quiz score', () => {
    const statuses = compute({
      currentLearnerLessonProgress: progressForCompletedLessonIds(DEMO_HR_BASICS_LESSONS.map((lesson) => lesson.id)),
      attempts: [attempt(60), attempt(90)],
    })

    expect(statuses.find((status) => status.user_id === MOCK_LEARNER_MARCUS.id)).toEqual(
      expect.objectContaining({
        status: 'completed',
        progress_percentage: 100,
        score_percent: 90,
      }),
    )
  })

  it('maps Ana pending assignment to not started with zero progress', () => {
    const ana = compute().find((status) => status.user_id === MOCK_LEARNER_ANA.id)

    expect(ana).toEqual(
      expect.objectContaining({
        status: 'not_started',
        progress_percentage: 0,
      }),
    )
  })

  it('maps Devon completed assignment to completed with full progress', () => {
    const devon = compute().find((status) => status.user_id === MOCK_LEARNER_DEVON.id)

    expect(devon).toEqual(
      expect.objectContaining({
        role_label: 'Learner',
        status: 'completed',
        progress_percentage: 100,
      }),
    )
  })

  it('marks past-due incomplete assignments overdue', () => {
    const overdueAssignment: Assignment = {
      ...MOCK_HR_ONBOARDING_ASSIGNMENT_ANA,
      due_at: '2026-05-22T12:00:00.000Z',
      status: 'pending',
    }

    const ana = compute({ assignments: [MOCK_HR_ONBOARDING_ASSIGNMENT, overdueAssignment, MOCK_HR_ONBOARDING_ASSIGNMENT_COMPLETED] }).find(
      (status) => status.user_id === MOCK_LEARNER_ANA.id,
    )

    expect(ana).toEqual(expect.objectContaining({ status: 'overdue', progress_percentage: 0 }))
  })

  it('returns safe defaults when a learner has no assignment', () => {
    const statuses = compute({ assignments: [MOCK_HR_ONBOARDING_ASSIGNMENT] })

    expect(statuses.find((status) => status.user_id === MOCK_LEARNER_ANA.id)).toEqual(
      expect.objectContaining({
        status: 'not_started',
        progress_percentage: 0,
      }),
    )
  })

  it('marks Marcus failed when quiz attempts exist below threshold', () => {
    const marcus = compute({
      currentLearnerLessonProgress: progressForCompletedLessonIds(DEMO_HR_BASICS_LESSONS.slice(0, 5).map((lesson) => lesson.id)),
      attempts: [attempt(60), attempt(70)],
    }).find((status) => status.user_id === MOCK_LEARNER_MARCUS.id)

    expect(marcus).toEqual(expect.objectContaining({ status: 'failed', score_percent: 70 }))
  })
})
