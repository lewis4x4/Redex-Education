import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_ASSIGNMENTS } from '@/lib/education/mockAssignments'
import { MOCK_ADMIN_USER, MOCK_LEARNER_MARCUS } from '@/lib/education/mockOrgPeople'

describe('useAssignmentStore', () => {
  let useAssignmentStore: (typeof import('./assignmentStore'))['useAssignmentStore']

  beforeEach(async () => {
    vi.resetModules()
    ;({ useAssignmentStore } = await import('./assignmentStore'))

    act(() => {
      useAssignmentStore.getState().resetAssignments()
    })
  })

  it('starts seeded with the three mock assignments', () => {
    expect(useAssignmentStore.getState().assignments).toHaveLength(3)
    expect(useAssignmentStore.getState().assignments.map((assignment) => assignment.id)).toEqual(
      MOCK_ASSIGNMENTS.map((assignment) => assignment.id),
    )
  })

  it('createAssignment adds a new pending record with generated id and assigned_at timestamp', () => {
    let created = undefined as ReturnType<typeof useAssignmentStore.getState>['assignments'][number] | undefined

    act(() => {
      created = useAssignmentStore.getState().createAssignment({
        module_version_id: 'module-version-hr-basics-v1',
        assignee_user_id: MOCK_LEARNER_MARCUS.id,
        assigned_by: MOCK_ADMIN_USER.id,
        due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      })
    })

    expect(created).toEqual(
      expect.objectContaining({
        module_version_id: 'module-version-hr-basics-v1',
        assignee_user_id: MOCK_LEARNER_MARCUS.id,
        assigned_by: MOCK_ADMIN_USER.id,
        status: 'pending',
      }),
    )
    expect(created?.id).toEqual(expect.any(String))
    expect(Number.isNaN(Date.parse(created?.assigned_at ?? ''))).toBe(false)
    expect(useAssignmentStore.getState().assignments).toContainEqual(created)
  })

  it('updateAssignmentStatus mutates the matching record', () => {
    act(() => {
      useAssignmentStore.getState().updateAssignmentStatus('assignment-hr-basics-ana', 'in_progress')
    })

    expect(
      useAssignmentStore.getState().assignments.find((assignment) => assignment.id === 'assignment-hr-basics-ana')?.status,
    ).toBe('in_progress')
  })

  it('getAssignmentsForUser returns Marcus assignment', () => {
    expect(useAssignmentStore.getState().getAssignmentsForUser('user-marcus')).toEqual([
      expect.objectContaining({ id: 'assignment-hr-basics-marcus' }),
    ])
  })

  it('getAssignmentsForModule returns the three HR Basics seed assignments', () => {
    expect(useAssignmentStore.getState().getAssignmentsForModule('module-version-hr-basics-v1')).toHaveLength(3)
  })

  it('resetAssignments restores seed after local changes', () => {
    act(() => {
      useAssignmentStore.getState().createAssignment({
        module_version_id: 'module-version-hr-basics-v1',
        assignee_role: 'learner',
        assigned_by: MOCK_ADMIN_USER.id,
      })
      useAssignmentStore.getState().resetAssignments()
    })

    expect(useAssignmentStore.getState().assignments).toHaveLength(3)
    expect(useAssignmentStore.getState().assignments.map((assignment) => assignment.id)).toEqual(
      MOCK_ASSIGNMENTS.map((assignment) => assignment.id),
    )
  })
})
