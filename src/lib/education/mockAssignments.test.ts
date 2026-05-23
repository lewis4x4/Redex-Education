import { describe, expect, it } from 'vitest'

import {
  MOCK_HR_ONBOARDING_ASSIGNMENT,
  MOCK_HR_ONBOARDING_ASSIGNMENT_ANA,
  MOCK_HR_ONBOARDING_ASSIGNMENT_COMPLETED,
} from './mockAssignments'
import {
  MOCK_ADMIN_USER,
  MOCK_LEARNER_ANA,
  MOCK_LEARNER_DEVON,
  MOCK_LEARNER_MARCUS,
} from './mockOrgPeople'

describe('mockAssignments', () => {
  it('uses unique ids for all mock assignments', () => {
    const assignments = [
      MOCK_HR_ONBOARDING_ASSIGNMENT,
      MOCK_HR_ONBOARDING_ASSIGNMENT_ANA,
      MOCK_HR_ONBOARDING_ASSIGNMENT_COMPLETED,
    ]
    const uniqueIds = new Set(assignments.map((assignment) => assignment.id))

    expect(uniqueIds.size).toBe(assignments.length)
  })

  it('references valid assignee user ids from mock org people', () => {
    const validAssigneeIds = new Set([
      MOCK_LEARNER_MARCUS.id,
      MOCK_LEARNER_ANA.id,
      MOCK_LEARNER_DEVON.id,
    ])

    expect(validAssigneeIds.has(MOCK_HR_ONBOARDING_ASSIGNMENT.assignee_user_id ?? '')).toBe(true)
    expect(validAssigneeIds.has(MOCK_HR_ONBOARDING_ASSIGNMENT_ANA.assignee_user_id ?? '')).toBe(true)
    expect(validAssigneeIds.has(MOCK_HR_ONBOARDING_ASSIGNMENT_COMPLETED.assignee_user_id ?? '')).toBe(true)
  })

  it('keeps assignment ownership and status expectations for slice data', () => {
    expect(MOCK_HR_ONBOARDING_ASSIGNMENT.assigned_by).toBe(MOCK_ADMIN_USER.id)
    expect(MOCK_HR_ONBOARDING_ASSIGNMENT.status).toBe('in_progress')
    expect(MOCK_HR_ONBOARDING_ASSIGNMENT_ANA.status).toBe('pending')
    expect(MOCK_HR_ONBOARDING_ASSIGNMENT_COMPLETED.status).toBe('completed')
  })

  it('stores valid ISO timestamps for assigned_at and due_at', () => {
    const assignments = [
      MOCK_HR_ONBOARDING_ASSIGNMENT,
      MOCK_HR_ONBOARDING_ASSIGNMENT_ANA,
      MOCK_HR_ONBOARDING_ASSIGNMENT_COMPLETED,
    ]

    for (const assignment of assignments) {
      expect(Number.isNaN(Date.parse(assignment.assigned_at))).toBe(false)
      expect(Number.isNaN(Date.parse(assignment.due_at ?? ''))).toBe(false)
    }
  })
})
