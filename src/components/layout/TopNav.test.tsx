import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TopNav } from './TopNav'
import { useAuth } from '@/hooks/useAuth'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const useAuthMock = vi.mocked(useAuth)

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location-path">{location.pathname}</div>
}

function renderNav(initialPath = '/learn') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <TopNav />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TopNav', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows the signed-in user menu and signs out', async () => {
    const user = userEvent.setup()
    const signOut = vi.fn().mockResolvedValue(undefined)

    useAuthMock.mockReturnValue({
      user: { id: 'user-sarah-manager', email: 'sarah.chen@redex.example' },
      session: { access_token: 'token' },
      loading: false,
      role: 'manager',
      refreshSession: vi.fn(),
      signOut,
    } as never)

    renderNav('/manager')

    expect(screen.getByRole('button', { name: 'Open user menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Team/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Foundry/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open user menu' }))

    expect(await screen.findByText('sarah.chen@redex.example')).toBeInTheDocument()
    expect(screen.getAllByText('Manager').length).toBeGreaterThan(0)

    await user.click(screen.getByText('Sign out'))

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1))
    expect(screen.getByTestId('location-path')).toHaveTextContent('/sign-in')
  })

  it('hides the user menu and role-gated tabs when signed out', () => {
    useAuthMock.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      role: null,
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    })

    renderNav('/sign-in')

    expect(screen.queryByRole('button', { name: 'Open user menu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Foundry/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Team/i })).not.toBeInTheDocument()
  })
})
