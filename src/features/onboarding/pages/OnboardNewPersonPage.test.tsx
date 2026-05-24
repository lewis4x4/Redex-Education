import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigateMock = vi.hoisted(() => vi.fn())
const onboardMock = vi.hoisted(() => vi.fn())
const fetchModulesMock = vi.hoisted(() => vi.fn())
const fetchProfilesMock = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ profile: { id: 'admin-1', display_name: 'Admin User' }, loading: false, refetch: vi.fn() }),
}))

vi.mock('@/integrations/supabase/mutations/onboarding', () => ({ onboardNewPerson: onboardMock }))
vi.mock('@/integrations/supabase/queries/onboarding', () => ({ fetchAuditableModulesForOnboarding: fetchModulesMock }))
vi.mock('@/integrations/supabase/queries/profiles', () => ({ fetchAllProfiles: fetchProfilesMock }))

describe('OnboardNewPersonPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchModulesMock.mockResolvedValue([
      { id: 'mv-1', module_title: 'Required Module', criticality: 'required' },
      { id: 'mv-2', module_title: 'Optional Module', criticality: 'optional' },
    ])
    fetchProfilesMock.mockResolvedValue([{ id: 'manager-1', display_name: 'Manager One', role: 'manager' }])
  })

  it('renders form and modules list', async () => {
    const { OnboardNewPersonPage } = await import('./OnboardNewPersonPage')
    render(<MemoryRouter><OnboardNewPersonPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Onboard a new person' })).toBeInTheDocument()
    expect(await screen.findByText('Required Module')).toBeInTheDocument()
    expect(screen.getByLabelText('Manager')).toBeInTheDocument()
  })

  it('submits and navigates to people detail route', async () => {
    onboardMock.mockResolvedValue({ user_id: 'user-1', profile_id: 'profile-1' })
    const { OnboardNewPersonPage } = await import('./OnboardNewPersonPage')
    render(<MemoryRouter><OnboardNewPersonPage /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'New User' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new.user@redex.example' } })

    fireEvent.click(screen.getByRole('button', { name: 'Send onboarding invite' }))

    await waitFor(() => {
      expect(onboardMock).toHaveBeenCalled()
      expect(navigateMock).toHaveBeenCalledWith('/admin/people/profile-1')
    })
  })
})
