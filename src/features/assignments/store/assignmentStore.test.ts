import { act, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_ASSIGNMENTS } from '@/lib/education/mockAssignments'
import { MOCK_ADMIN_USER, MOCK_LEARNER_MARCUS, MOCK_MANAGER_USER } from '@/lib/education/mockOrgPeople'

describe('useAssignmentStore', () => {
  let useAssignmentStore: (typeof import('./assignmentStore'))['useAssignmentStore']
  let useAuditLogStore: (typeof import('@/features/audit/store/auditLogStore'))['useAuditLogStore']
  let usePublishedModulesStore: (typeof import('@/features/publishing/store/publishedModulesStore'))['usePublishedModulesStore']

  beforeEach(async () => {
    vi.resetModules()
    ;({ useAuditLogStore } = await import('@/features/audit/store/auditLogStore'))
    ;({ usePublishedModulesStore } = await import('@/features/publishing/store/publishedModulesStore'))
    ;({ useAssignmentStore } = await import('./assignmentStore'))

    act(() => {
      useAuditLogStore.getState().resetEvents()
      usePublishedModulesStore.getState().resetPublishedModules()
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

  it('createAssignment records assignment_created audit event', () => {
    act(() => {
      useAuditLogStore.setState({ events: [] })
      useAssignmentStore.getState().createAssignment({
        module_version_id: 'module-version-hr-basics-v1',
        assignee_user_id: MOCK_LEARNER_MARCUS.id,
        assigned_by: MOCK_ADMIN_USER.id,
      })
    })

    expect(useAuditLogStore.getState().events).toEqual([
      expect.objectContaining({
        event_type: 'assignment_created',
        actor_name: 'Jordan Patel',
        entity_label: 'Marcus Chen assigned HR Basics at Redex',
      }),
    ])
  })

  it('createAssignment audit actor follows assigned_by', () => {
    act(() => {
      useAuditLogStore.setState({ events: [] })
      useAssignmentStore.getState().createAssignment({
        module_version_id: 'module-version-hr-basics-v1',
        assignee_user_id: MOCK_LEARNER_MARCUS.id,
        assigned_by: MOCK_MANAGER_USER.id,
      })
    })

    expect(useAuditLogStore.getState().events[0]).toEqual(
      expect.objectContaining({ actor_user_id: MOCK_MANAGER_USER.id, actor_name: 'Sarah Chen' }),
    )
  })

  it('createAssignment rejects unpublished module versions', () => {
    expect(() =>
      useAssignmentStore.getState().createAssignment({
        module_version_id: 'module-version-unpublished-v1',
        assignee_user_id: MOCK_LEARNER_MARCUS.id,
        assigned_by: MOCK_ADMIN_USER.id,
      }),
    ).toThrow('Cannot assign unpublished module version: module-version-unpublished-v1')
  })

  it('updateAssignmentStatus mutates the matching record', () => {
    act(() => {
      useAssignmentStore.getState().updateAssignmentStatus('assignment-hr-basics-ana', 'in_progress')
    })

    expect(
      useAssignmentStore.getState().assignments.find((assignment) => assignment.id === 'assignment-hr-basics-ana')?.status,
    ).toBe('in_progress')
  })

  it('updateAssignmentStatus records employee_completed_module on completed transition only', () => {
    act(() => {
      useAuditLogStore.setState({ events: [] })
      useAssignmentStore.getState().updateAssignmentStatus('assignment-hr-basics-marcus', 'completed')
      useAssignmentStore.getState().updateAssignmentStatus('assignment-hr-basics-marcus', 'completed')
    })

    expect(useAuditLogStore.getState().events).toEqual([
      expect.objectContaining({
        event_type: 'employee_completed_module',
        actor_name: 'Marcus Chen',
        entity_label: 'Marcus Chen completed HR Basics at Redex',
      }),
    ])
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

describe('useAssignmentStore Supabase dispatch', () => {
  async function loadStore(mode: 'mock' | 'supabase', insertAssignment = vi.fn(), updateAssignmentStatus = vi.fn()) {
    vi.resetModules()
    vi.doMock('@/lib/education/dataSource', () => ({ getDataSource: () => mode }))
    vi.doMock('@/integrations/supabase/mutations', () => ({ insertAssignment, updateAssignmentStatus }))

    const { useAuditLogStore } = await import('@/features/audit/store/auditLogStore')
    const { usePublishedModulesStore } = await import('@/features/publishing/store/publishedModulesStore')
    const { useAssignmentStore } = await import('./assignmentStore')

    act(() => {
      useAuditLogStore.getState().resetEvents()
      usePublishedModulesStore.getState().resetPublishedModules()
      useAssignmentStore.getState().resetAssignments()
    })

    return { useAssignmentStore, insertAssignment, updateAssignmentStatus }
  }

  it('does not call Supabase mutations in mock mode', async () => {
    const insertAssignment = vi.fn().mockResolvedValue({})
    const { useAssignmentStore } = await loadStore('mock', insertAssignment)

    act(() => {
      useAssignmentStore.getState().createAssignment({
        module_version_id: 'module-version-hr-basics-v1',
        assignee_user_id: MOCK_LEARNER_MARCUS.id,
        assigned_by: MOCK_ADMIN_USER.id,
      })
    })

    expect(insertAssignment).not.toHaveBeenCalled()
  })

  it('calls insertAssignment in supabase mode while keeping optimistic state', async () => {
    const insertAssignment = vi.fn().mockResolvedValue({ id: 'persisted' })
    const { useAssignmentStore } = await loadStore('supabase', insertAssignment)

    act(() => {
      useAssignmentStore.getState().createAssignment({
        module_version_id: 'module-version-hr-basics-v1',
        assignee_user_id: MOCK_LEARNER_MARCUS.id,
        assigned_by: MOCK_ADMIN_USER.id,
      })
    })

    expect(useAssignmentStore.getState().assignments).toHaveLength(4)
    await waitFor(() => {
      expect(insertAssignment).toHaveBeenCalledWith(expect.objectContaining({ assignee_user_id: MOCK_LEARNER_MARCUS.id }))
    })
  })

  it('sets lastWriteError when supabase assignment persistence fails', async () => {
    const insertAssignment = vi.fn().mockRejectedValue(new Error('RLS rejected'))
    const { useAssignmentStore } = await loadStore('supabase', insertAssignment)

    act(() => {
      useAssignmentStore.getState().createAssignment({
        module_version_id: 'module-version-hr-basics-v1',
        assignee_user_id: MOCK_LEARNER_MARCUS.id,
        assigned_by: MOCK_ADMIN_USER.id,
      })
    })

    await vi.waitFor(() => {
      expect(useAssignmentStore.getState().lastWriteError).toEqual(expect.objectContaining({ action: 'createAssignment', message: 'RLS rejected' }))
    })
  })
})
