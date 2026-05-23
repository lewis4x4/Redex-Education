import type { ReactElement } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AuthGate from '@/components/auth/AuthGate'
import { useAuth } from '@/hooks/useAuth'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const useAuthMock = vi.mocked(useAuth)

function renderGate(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

function renderProtectedRoute(ui: ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/protected" element={ui} />
        <Route path="/sign-in" element={<div>sign in route</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

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
    useAuthMock.mockReturnValue({ loading: true, session: null, user: null, role: null } as never)

    renderGate(
      <AuthGate>
        <div>protected content</div>
      </AuthGate>,
    )

    expect(screen.getByText('protected content')).toBeInTheDocument()
  })

  it('renders children in mock auth when the configured role matches', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')
    vi.stubEnv('VITE_MOCK_AUTH_ROLE', 'manager')
    useAuthMock.mockReturnValue({ loading: false, session: null, user: null, role: 'manager' } as never)

    renderGate(
      <AuthGate requiredRole="manager">
        <div>manager content</div>
      </AuthGate>,
    )

    expect(screen.getByText('manager content')).toBeInTheDocument()
  })

  it('renders access denied in mock auth when the configured role does not match', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')
    vi.stubEnv('VITE_MOCK_AUTH_ROLE', 'learner')
    useAuthMock.mockReturnValue({ loading: false, session: null, user: null, role: 'learner' } as never)

    renderGate(
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <div>admin content</div>
      </AuthGate>,
    )

    expect(screen.getByRole('heading', { name: /Access denied/i })).toBeInTheDocument()
    expect(screen.getByText(/admin or foundry author access/i)).toBeInTheDocument()
    expect(screen.queryByText('admin content')).not.toBeInTheDocument()
  })

  it('shows default loading fallback when mock auth is disabled and auth is loading', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'false')
    useAuthMock.mockReturnValue({ loading: true, session: null, user: null, role: null } as never)

    renderGate(
      <AuthGate>
        <div>protected content</div>
      </AuthGate>,
    )

    expect(screen.getByText('Authenticating…')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('respects a custom fallback prop while loading', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'false')
    useAuthMock.mockReturnValue({ loading: true, session: null, user: null, role: null } as never)

    renderGate(
      <AuthGate fallback={<div>custom</div>}>
        <div>protected content</div>
      </AuthGate>,
    )

    expect(screen.getByText('custom')).toBeInTheDocument()
  })

  it('redirects to the sign-in route when loading is false and no session exists', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'false')
    useAuthMock.mockReturnValue({ loading: false, session: null, user: null, role: null } as never)

    renderProtectedRoute(
      <AuthGate>
        <div>protected content</div>
      </AuthGate>,
    )

    expect(screen.getByText('sign in route')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('renders children when loading is false and a matching role exists', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'false')
    useAuthMock.mockReturnValue({
      loading: false,
      session: { access_token: 'token' },
      user: null,
      role: 'foundry_author',
    } as never)

    renderGate(
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <div>protected content</div>
      </AuthGate>,
    )

    expect(screen.getByText('protected content')).toBeInTheDocument()
  })

  it('renders access denied when a real session role does not match', () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'false')
    useAuthMock.mockReturnValue({
      loading: false,
      session: { access_token: 'token' },
      user: null,
      role: 'learner',
    } as never)

    renderGate(
      <AuthGate requiredRole="manager">
        <div>manager content</div>
      </AuthGate>,
    )

    expect(screen.getByRole('heading', { name: /Access denied/i })).toBeInTheDocument()
    expect(screen.getByText(/manager access/i)).toBeInTheDocument()
    expect(screen.queryByText('manager content')).not.toBeInTheDocument()
  })
})
