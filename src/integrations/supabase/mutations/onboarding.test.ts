import { beforeEach, describe, expect, it, vi } from 'vitest'

const invokeMock = vi.hoisted(() => vi.fn())
const insertAssignmentMock = vi.hoisted(() => vi.fn())
const recordEventMock = vi.hoisted(() => vi.fn())

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}))

vi.mock('@/integrations/supabase/mutations/assignments', () => ({
  insertAssignment: insertAssignmentMock,
}))

vi.mock('@/features/audit/store/auditLogStore', () => ({
  useAuditLogStore: {
    getState: () => ({ recordEvent: recordEventMock }),
  },
}))

describe('onboardNewPerson', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invokes invite-user, creates assignments, and records audit event', async () => {
    invokeMock.mockResolvedValueOnce({ data: { ok: true, user_id: 'user-1', profile_id: 'profile-1' }, error: null })
    insertAssignmentMock.mockResolvedValue({ id: 'assignment-1' })

    const { onboardNewPerson } = await import('./onboarding')

    await expect(
      onboardNewPerson({
        email: 'new.user@redex.example',
        display_name: 'New User',
        role: 'learner',
        department: 'Ops',
        start_date: '2026-06-01',
        auto_assigned_module_version_ids: ['mv-1', 'mv-2'],
        assigned_by: 'admin-1',
        actor_name: 'Admin User',
      }),
    ).resolves.toEqual({ user_id: 'user-1', profile_id: 'profile-1' })

    expect(invokeMock).toHaveBeenCalledWith('invite-user', expect.objectContaining({ body: expect.objectContaining({ email: 'new.user@redex.example' }) }))
    expect(insertAssignmentMock).toHaveBeenCalledTimes(2)
    expect(recordEventMock).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'user_onboarded', entity_id: 'profile-1' }))
  })

  it('throws when invite-user fails', async () => {
    invokeMock.mockResolvedValueOnce({ data: null, error: new Error('edge failed') })
    const { onboardNewPerson } = await import('./onboarding')

    await expect(
      onboardNewPerson({
        email: 'new.user@redex.example',
        display_name: 'New User',
        role: 'learner',
        auto_assigned_module_version_ids: [],
        assigned_by: 'admin-1',
        actor_name: 'Admin User',
      }),
    ).rejects.toThrow('Failed to onboard user: edge failed')
  })
})
