import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AuthGate from '@/components/auth/AuthGate'
import { useAuth } from '@/hooks/useAuth'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const useAuthMock = vi.mocked(useAuth)

describe('AuthGate for Redex AI Course Foundry', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('bypasses auth and renders children when VITE_MOCK_AUTH is true', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')
    useAuthMock.mockReturnValue({ loading: true, session: null, user: null } as never)

    render(
      <AuthGate>
        <div>protected content</div>
      </AuthGate>,
    )

    expect(screen.getByText('protected content')).toBeInTheDocument()
  })

  it('shows default loading fallback when mock auth is disabled and auth is loading', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'false')
    useAuthMock.mockReturnValue({ loading: true, session: null, user: null } as never)

    render(
      <AuthGate>
        <div>protected content</div>
      </AuthGate>,
    )

    expect(screen.getByText('Authenticating…')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('respects a custom fallback prop while loading', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'false')
    useAuthMock.mockReturnValue({ loading: true, session: null, user: null } as never)

    render(
      <AuthGate fallback={<div>custom</div>}>
        <div>protected content</div>
      </AuthGate>,
    )

    expect(screen.getByText('custom')).toBeInTheDocument()
  })

  it('shows sign-in required placeholder when loading is false and no session exists', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'false')
    useAuthMock.mockReturnValue({ loading: false, session: null, user: null } as never)

    render(
      <AuthGate>
        <div>protected content</div>
      </AuthGate>,
    )

    expect(screen.getByText(/Sign-in required/i)).toBeInTheDocument()
  })

  it('renders children when loading is false and session exists', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'false')
    useAuthMock.mockReturnValue({ loading: false, session: { access_token: 'token' }, user: null } as never)

    render(
      <AuthGate>
        <div>protected content</div>
      </AuthGate>,
    )

    expect(screen.getByText('protected content')).toBeInTheDocument()
  })
})
