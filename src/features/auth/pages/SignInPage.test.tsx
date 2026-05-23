import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SignInPage } from './SignInPage'

const signInWithOtpMock = vi.hoisted(() => vi.fn())

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOtp: signInWithOtpMock,
    },
  },
}))

describe('SignInPage', () => {
  beforeEach(() => {
    signInWithOtpMock.mockReset()
    signInWithOtpMock.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders a minimal magic-link sign-in form', () => {
    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /Sign in to Redex Education/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Send magic link/i })).toBeInTheDocument()
  })

  it('submits the email to Supabase magic-link auth', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/Email/i), 'admin@redex.example')
    await user.click(screen.getByRole('button', { name: /Send magic link/i }))

    await waitFor(() => {
      expect(signInWithOtpMock).toHaveBeenCalledWith({
        email: 'admin@redex.example',
        options: { emailRedirectTo: window.location.origin },
      })
    })
    expect(await screen.findByText(/Check your email/i)).toBeInTheDocument()
  })
})
