import { renderHook, waitFor } from '@testing-library/react'
import type { ContextType, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProfile } from './useProfile'
import { AuthContext } from './auth-context'
import { fetchProfileByUserId } from '@/integrations/supabase/queries/profiles'
import { MOCK_LEARNER_MARCUS } from '@/lib/education'

vi.mock('@/integrations/supabase/queries/profiles', () => ({
  fetchProfileByUserId: vi.fn(),
}))

const fetchProfileByUserIdMock = vi.mocked(fetchProfileByUserId)
const refreshSession = vi.fn()
const signOut = vi.fn()

function createAuthWrapper(value: ContextType<typeof AuthContext>) {
  return function AuthWrapper({ children }: { children: ReactNode }) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  }
}

describe('useProfile', () => {
  beforeEach(() => {
    refreshSession.mockReset()
    signOut.mockReset()
    fetchProfileByUserIdMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('returns the Marcus persona in learner mock mode', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    const { result } = renderHook(() => useProfile(), {
      wrapper: createAuthWrapper({ user: null, session: null, loading: false, role: 'learner', refreshSession, signOut }),
    })

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

    fetchProfileByUserIdMock.mockResolvedValue(profile)

    const { result } = renderHook(() => useProfile(), {
      wrapper: createAuthWrapper({
        user: { id: 'user-real', email: 'real@redex.example' } as never,
        session: { access_token: 'token' } as never,
        loading: false,
        role: 'learner',
        refreshSession,
        signOut,
      }),
    })

    await waitFor(() => expect(result.current.profile).toEqual(profile))
    expect(fetchProfileByUserIdMock).toHaveBeenCalledWith('user-real')
  })
})
