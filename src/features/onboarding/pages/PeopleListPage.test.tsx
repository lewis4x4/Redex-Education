import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchCandidatesMock = vi.hoisted(() => vi.fn())

vi.mock('@/integrations/supabase/queries/onboarding', () => ({ fetchOnboardingCandidates: fetchCandidatesMock }))

describe('PeopleListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchCandidatesMock.mockResolvedValue([
      {
        id: 'user-1',
        org_id: 'org-1',
        email: 'user1@redex.example',
        display_name: 'User One',
        role: 'learner',
        department: 'Ops',
        manager_id: null,
        start_date: '2026-06-01',
        created_at: '2026-05-24T00:00:00.000Z',
        updated_at: '2026-05-24T00:00:00.000Z',
        onboarding_completion_percent: 75,
        last_activity: '2026-05-24T12:00:00.000Z',
      },
    ])
  })

  it('renders people table', async () => {
    const { PeopleListPage } = await import('./PeopleListPage')
    render(<MemoryRouter><PeopleListPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'People' })).toBeInTheDocument()
    expect(await screen.findByText('User One')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('shows selected person status card for /admin/people/:id', async () => {
    const { PeopleListPage } = await import('./PeopleListPage')

    render(
      <MemoryRouter initialEntries={['/admin/people/user-1']}>
        <Routes>
          <Route path="/admin/people/:id" element={<PeopleListPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Onboarding status')).toBeInTheDocument()
    expect(screen.getByText('75% complete')).toBeInTheDocument()
  })
})
