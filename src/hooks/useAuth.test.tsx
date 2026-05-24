import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './use-auth'
import { useAuth } from './useAuth'

const supabaseAuthMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  refreshSession: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
}))

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: supabaseAuthMocks.getSession,
      onAuthStateChange: supabaseAuthMocks.onAuthStateChange,
      refreshSession: supabaseAuthMocks.refreshSession,
      signOut: supabaseAuthMocks.signOut,
    },
  },
}))

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

function jwtWithClaims(claims: Record<string, unknown>) {
  const payload = btoa(JSON.stringify(claims)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `header.${payload}.signature`
}

describe('useAuth role claims', () => {
  beforeEach(() => {
    supabaseAuthMocks.getSession.mockReset()
    supabaseAuthMocks.onAuthStateChange.mockReset()
    supabaseAuthMocks.refreshSession.mockReset()
    supabaseAuthMocks.signOut.mockReset()
    supabaseAuthMocks.unsubscribe.mockReset()
    supabaseAuthMocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: supabaseAuthMocks.unsubscribe } },
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('reads redex_role from access token claims instead of stale app metadata', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'false')
    supabaseAuthMocks.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: jwtWithClaims({ redex_role: 'learner' }),
          user: { app_metadata: { redex_role: 'manager' } },
        },
      },
      error: null,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.role).toBe('learner')
  })

  it('falls back to decoding redex_role from the access token claims', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'false')
    supabaseAuthMocks.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: jwtWithClaims({ redex_role: 'foundry_author' }),
          user: { app_metadata: {} },
        },
      },
      error: null,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.role).toBe('foundry_author')
  })

  it('returns the configured mock auth role when mock auth is enabled', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')
    vi.stubEnv('VITE_MOCK_AUTH_ROLE', 'manager')

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.loading).toBe(false)
    expect(result.current.role).toBe('manager')
    expect(supabaseAuthMocks.getSession).not.toHaveBeenCalled()
  })

  it('defaults mock auth role to admin for local developer convenience', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.role).toBe('admin')
  })

  it('signs out through Supabase auth', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'false')
    supabaseAuthMocks.getSession.mockResolvedValue({ data: { session: null }, error: null })
    supabaseAuthMocks.signOut.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.signOut()
    })

    expect(supabaseAuthMocks.signOut).toHaveBeenCalledTimes(1)
  })

  it('refreshes the Supabase session and updates role claims', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'false')
    supabaseAuthMocks.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: jwtWithClaims({ redex_role: 'learner' }),
          user: { app_metadata: {} },
        },
      },
      error: null,
    })
    supabaseAuthMocks.refreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: jwtWithClaims({ redex_role: 'admin' }),
          user: { app_metadata: {} },
        },
      },
      error: null,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.role).toBe('learner')

    await act(async () => {
      await result.current.refreshSession()
    })

    expect(supabaseAuthMocks.refreshSession).toHaveBeenCalledTimes(1)
    expect(result.current.role).toBe('admin')
  })
})
