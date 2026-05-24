import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAssignmentStore } from '../store/assignmentStore'
import { usePublishedModulesStore } from '@/features/publishing/store/publishedModulesStore'

describe('useAssignmentAdmin', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    act(() => {
      useAssignmentStore.getState().resetAssignments()
      usePublishedModulesStore.getState().resetPublishedModules()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns synchronous store-backed data in mock mode', async () => {
    const { useAssignmentAdmin } = await import('./useAssignmentAdmin')
    const { result } = renderHook(() => useAssignmentAdmin())

    expect(result.current.loading).toBe(false)
    expect(result.current.assignableUsers.length).toBeGreaterThan(0)
    expect(result.current.publishedModules.length).toBeGreaterThan(0)
    expect(result.current.assignments.length).toBeGreaterThan(0)
  })

  it('loads users/modules/assignments and writes via supabase mode', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'supabase')

    const fetchAssignableUsers = vi.fn().mockResolvedValue([
      {
        id: 'user-1',
        org_id: 'org-1',
        email: 'learner@example.com',
        display_name: 'Learner One',
        role: 'learner',
        created_at: '2026-05-24T00:00:00.000Z',
        updated_at: '2026-05-24T00:00:00.000Z',
      },
    ])
    const fetchPublishedModuleAssignments = vi.fn().mockResolvedValue([
      {
        id: 'module-version-1',
        module_version_id: 'module-version-1',
        title: 'HR Basics at Redex',
        published_at: '2026-05-24T00:00:00.000Z',
        published_by: 'admin-1',
      },
    ])
    const fetchAllAssignmentsWithNames = vi.fn().mockResolvedValue([
      {
        id: 'assignment-1',
        module_version_id: 'module-version-1',
        assignee_user_id: 'user-1',
        assigned_by: 'admin-1',
        assigned_at: '2026-05-24T00:00:00.000Z',
        status: 'pending',
        assignee_display_name: 'Learner One',
        assigned_by_display_name: 'Admin One',
      },
    ])
    const createAssignment = vi.fn().mockResolvedValue({
      id: 'assignment-new',
      module_version_id: 'module-version-1',
      assignee_user_id: 'user-1',
      assigned_by: 'admin-1',
      assigned_at: '2026-05-24T00:00:00.000Z',
      status: 'pending',
    })

    vi.doMock('@/integrations/supabase/queries/profiles', () => ({ fetchAssignableUsers }))
    vi.doMock('@/integrations/supabase/queries/assignments', () => ({
      fetchPublishedModuleAssignments,
      fetchAllAssignmentsWithNames,
    }))
    vi.doMock('@/integrations/supabase/mutations/assignments', () => ({ createAssignment }))

    const { useAssignmentAdmin } = await import('./useAssignmentAdmin')
    const { result } = renderHook(() => useAssignmentAdmin())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.assignableUsers[0]?.display_name).toBe('Learner One')
    expect(result.current.assignments[0]?.assignee_display_name).toBe('Learner One')

    await act(async () => {
      await result.current.createAssignment({
        module_version_id: 'module-version-1',
        assignee_user_id: 'user-1',
        assigned_by: 'admin-1',
      })
    })

    expect(createAssignment).toHaveBeenCalledTimes(1)
  })
})
