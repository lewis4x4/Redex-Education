import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())
const eqMock = vi.hoisted(() => vi.fn())
const orderMock = vi.hoisted(() => vi.fn())
const inMock = vi.hoisted(() => vi.fn())

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }))

describe('onboarding queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchAuditableModulesForOnboarding returns published modules with module criticality', async () => {
    const moduleVersionsBuilder = { select: selectMock, eq: eqMock, order: orderMock }
    const modulesBuilder = { select: selectMock, in: inMock }

    fromMock.mockImplementation((table: string) => {
      if (table === 'module_versions') return moduleVersionsBuilder
      if (table === 'training_modules') return modulesBuilder
      throw new Error(`Unexpected table ${table}`)
    })

    selectMock.mockReturnValueOnce(moduleVersionsBuilder)
    eqMock.mockReturnValueOnce(moduleVersionsBuilder)
    orderMock.mockResolvedValueOnce({ data: [{
      id: 'mv-1',
      module_id: 'module-1',
      module_title: 'Orientation',
      status: 'published',
      version_number: 1,
      created_at: '2026-05-24T00:00:00.000Z',
      published_at: '2026-05-24T00:00:00.000Z',
      updated_at: '2026-05-24T00:00:00.000Z',
      source_stale: false,
      draft_metadata: null,
      approved_by: null,
      published_by: null,
      source_binder_version: null,
      assessment_version: null,
      completed_count: null,
      stale_since: null,
    }], error: null })

    selectMock.mockReturnValueOnce(modulesBuilder)
    inMock.mockResolvedValueOnce({ data: [{ id: 'module-1', criticality: 'required' }], error: null })

    const { fetchAuditableModulesForOnboarding } = await import('./onboarding')
    const result = await fetchAuditableModulesForOnboarding('learner')

    expect(result).toHaveLength(1)
    expect(result[0]?.criticality).toBe('required')
  })

  it('fetchOnboardingCandidates computes completion percent from assignments', async () => {
    const profilesBuilder = { select: selectMock, eq: eqMock, order: orderMock }
    const assignmentsBuilder = { select: selectMock, in: inMock }

    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') return profilesBuilder
      if (table === 'assignments') return assignmentsBuilder
      throw new Error(`Unexpected table ${table}`)
    })

    selectMock.mockReturnValueOnce(profilesBuilder)
    eqMock.mockReturnValueOnce(profilesBuilder)
    orderMock.mockResolvedValueOnce({ data: [{
      id: 'user-1',
      org_id: 'org-1',
      email: 'user1@redex.example',
      display_name: 'User One',
      role: 'learner',
      department: 'Ops',
      manager_id: null,
      start_date: '2026-06-01',
      created_at: '2026-05-24T00:00:00.000Z',
      updated_at: '2026-05-24T00:00:00.000Z',
    }], error: null })

    selectMock.mockReturnValueOnce(assignmentsBuilder)
    inMock.mockResolvedValueOnce({
      data: [
        { assignee_user_id: 'user-1', status: 'completed', assigned_at: '2026-05-24T10:00:00.000Z' },
        { assignee_user_id: 'user-1', status: 'pending', assigned_at: '2026-05-24T11:00:00.000Z' },
      ],
      error: null,
    })

    const { fetchOnboardingCandidates } = await import('./onboarding')
    const result = await fetchOnboardingCandidates()

    expect(result[0]?.onboarding_completion_percent).toBe(50)
    expect(result[0]?.last_activity).toBe('2026-05-24T11:00:00.000Z')
  })
})
