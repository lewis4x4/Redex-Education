import { describe, expect, it } from 'vitest'

import { MOCK_ADMIN_USER, MOCK_LEARNER_DEVON, MOCK_LEARNER_MARCUS } from '@/lib/education'
import type { AssessmentAttempt, Assignment, Enrollment } from '@/lib/education'

import { getCompletedLearnersForVersion } from './versionCompletions'

const completedAssignment: Assignment = {
  id: 'assignment-completed-marcus',
  module_version_id: 'module-version-hr-basics-v1',
  assignee_user_id: MOCK_LEARNER_MARCUS.id,
  assigned_by: MOCK_ADMIN_USER.id,
  assigned_at: '2026-05-23T00:00:00.000Z',
  status: 'completed',
}

const pendingAssignment: Assignment = {
  ...completedAssignment,
  id: 'assignment-pending-devon',
  assignee_user_id: MOCK_LEARNER_DEVON.id,
  status: 'pending',
}

const marcusEnrollment: Enrollment = {
  id: 'enrollment-marcus-test',
  user_id: MOCK_LEARNER_MARCUS.id,
  course_id: 'course-hr-basics-001',
  status: 'active',
  progress_percentage: 100,
  started_at: '2026-05-23T00:00:00.000Z',
}

const devonEnrollment: Enrollment = {
  ...marcusEnrollment,
  id: 'enrollment-devon-test',
  user_id: MOCK_LEARNER_DEVON.id,
}

function attempt(overrides: Partial<AssessmentAttempt>): AssessmentAttempt {
  return {
    id: 'attempt-test',
    enrollment_id: marcusEnrollment.id,
    lesson_id: 'hr-basics-lesson-6-final-quiz',
    attempted_at: '2026-05-23T00:00:00.000Z',
    score_percent: 100,
    passed: true,
    answers: {},
    ...overrides,
  }
}

describe('getCompletedLearnersForVersion', () => {
  it('returns unique completed learners from completed assignments and passed version quiz attempts', () => {
    const learners = getCompletedLearnersForVersion({
      versionId: 'module-version-hr-basics-v1',
      assignments: [completedAssignment],
      attempts: [attempt({}), attempt({ id: 'attempt-duplicate' })],
      enrollments: [marcusEnrollment],
    })

    expect(learners).toEqual([MOCK_LEARNER_MARCUS.id])
  })

  it('includes passed quiz attempts for learners whose assignment is not completed yet', () => {
    const learners = getCompletedLearnersForVersion({
      versionId: 'module-version-hr-basics-v1',
      assignments: [pendingAssignment],
      attempts: [attempt({ id: 'attempt-devon', enrollment_id: devonEnrollment.id })],
      enrollments: [devonEnrollment],
    })

    expect(learners).toEqual([MOCK_LEARNER_DEVON.id])
  })

  it('returns an empty list when there are no assignments or attempts', () => {
    expect(
      getCompletedLearnersForVersion({
        versionId: 'module-version-hr-basics-v1',
        assignments: [],
        attempts: [],
      }),
    ).toEqual([])
  })

  it('ignores failed attempts and attempts outside quiz lessons for the version', () => {
    const learners = getCompletedLearnersForVersion({
      versionId: 'module-version-hr-basics-v1',
      assignments: [pendingAssignment],
      attempts: [
        attempt({ id: 'failed-attempt', passed: false, enrollment_id: devonEnrollment.id }),
        attempt({ id: 'text-lesson-attempt', lesson_id: 'hr-basics-lesson-1-welcome', enrollment_id: devonEnrollment.id }),
      ],
      enrollments: [devonEnrollment],
    })

    expect(learners).toEqual([])
  })
})
