import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthCallbackPage } from './AuthCallbackPage'

const supabaseAuthMocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  unsubscribe: vi.fn(),
}))

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: supabaseAuthMocks.exchangeCodeForSession,
      onAuthStateChange: supabaseAuthMocks.onAuthStateChange,
    },
  },
}))

function renderCallback(path = '/auth/callback?code=pkce-code&state=pkce-state') {
  window.history.pushState({}, '', path)

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/learn" element={<div>learn route</div>} />
        <Route path="/admin" element={<div>admin route</div>} />
        <Route path="/sign-in" element={<div>sign in route</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    supabaseAuthMocks.exchangeCodeForSession.mockReset()
    supabaseAuthMocks.onAuthStateChange.mockReset()
    supabaseAuthMocks.unsubscribe.mockReset()
    supabaseAuthMocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: supabaseAuthMocks.unsubscribe } },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('exchanges the PKCE code and redirects to /learn by default', async () => {
    supabaseAuthMocks.exchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    })

    renderCallback()

    expect(screen.getByText(/Completing secure sign-in/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(supabaseAuthMocks.exchangeCodeForSession).toHaveBeenCalledWith('pkce-code')
    })
    expect(await screen.findByText('learn route')).toBeInTheDocument()
  })

  it('honors a safe redirect_to parameter after exchange success', async () => {
    supabaseAuthMocks.exchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    })

    renderCallback('/auth/callback?redirect_to=%2Fadmin&code=pkce-code&state=pkce-state')

    expect(await screen.findByText('admin route')).toBeInTheDocument()
  })

  it('shows an error card when Supabase rejects the exchange', async () => {
    supabaseAuthMocks.exchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid or expired link' },
    })

    renderCallback()

    expect(await screen.findByRole('heading', { name: /Sign-in link failed/i })).toBeInTheDocument()
    expect(screen.getByText('Invalid or expired link')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to sign in/i })).toHaveAttribute('href', '/sign-in')
  })
})
