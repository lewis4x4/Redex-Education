import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProfile } from './useProfile'
import { useAuth } from './useAuth'
import { fetchProfileByUserId } from '@/integrations/supabase/queries/profiles'
import { MOCK_LEARNER_MARCUS } from '@/lib/education'

vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/integrations/supabase/queries/profiles', () => ({
  fetchProfileByUserId: vi.fn(),
}))

const useAuthMock = vi.mocked(useAuth)
const fetchProfileByUserIdMock = vi.mocked(fetchProfileByUserId)

describe('useProfile', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    fetchProfileByUserIdMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('returns the Marcus persona in learner mock mode', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')
    useAuthMock.mockReturnValue({ user: null, session: null, loading: false, role: 'learner', refreshSession: vi.fn(), signOut: vi.fn() })

    const { result } = renderHook(() => useProfile())

    expect(result.current.loading).toBe(false)
    expect(result.current.profile).toEqual(MOCK_LEARNER_MARCUS)
    expect(fetchProfileByUserIdMock).not.toHaveBeenCalled()
  })

  it('fetches the signed-in Supabase profile by user id', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'false')
    const profile = {
      id: 'user-real',
      org_id: 'org-redex',
      email: 'real@redex.example',
      display_name: 'Real User',
      role: 'learner' as const,
      created_at: '2026-05-23T00:00:00.000Z',
      updated_at: '2026-05-24T00:00:00.000Z',
    }

    useAuthMock.mockReturnValue({
      user: { id: 'user-real', email: 'real@redex.example' },
      session: { access_token: 'token' },
      loading: false,
      role: 'learner',
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    } as never)
    fetchProfileByUserIdMock.mockResolvedValue(profile)

    const { result } = renderHook(() => useProfile())

    await waitFor(() => expect(result.current.profile).toEqual(profile))
    expect(fetchProfileByUserIdMock).toHaveBeenCalledWith('user-real')
  })
})
