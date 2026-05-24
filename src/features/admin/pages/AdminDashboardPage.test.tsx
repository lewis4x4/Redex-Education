import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AdminDashboardPage } from './AdminDashboardPage'
import { useProfile } from '@/hooks/useProfile'

vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(),
}))

const useProfileMock = vi.mocked(useProfile)

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location-path">{location.pathname}</div>
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    useProfileMock.mockReturnValue({ profile: null, loading: false, refetch: vi.fn() })
  })

  function renderPage() {
    return render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    )
  }

  it('renders eyebrow, heading, and subhead', () => {
    renderPage()

    expect(screen.getByText('REDEX AI COURSE FOUNDRY')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back, Admin' })).toBeInTheDocument()
    expect(screen.getByText('Your training operations at a glance')).toBeInTheDocument()
  })

  it('uses the signed-in profile display name when available', () => {
    useProfileMock.mockReturnValue({
      profile: {
        id: 'user-jordan-admin',
        org_id: 'org-redex',
        email: 'jordan@redex.example',
        display_name: 'Jordan Patel',
        role: 'admin',
        created_at: '2026-05-23T00:00:00.000Z',
        updated_at: '2026-05-24T00:00:00.000Z',
      },
      loading: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back, Jordan Patel' })).toBeInTheDocument()
  })

  it('renders the Foundry entry CTA enabled', () => {
    renderPage()

    expect(screen.getByRole('button', { name: /start new module/i })).toBeEnabled()
  })

  it('routes the assignments CTA to the assignment admin page', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <>
                <AdminDashboardPage />
                <LocationProbe />
              </>
            }
          />
          <Route path="/admin/assignments" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /open assignments/i }))

    expect(screen.getByTestId('location-path')).toHaveTextContent('/admin/assignments')
  })

  it('renders all metric labels', () => {
    renderPage()

    expect(screen.getAllByRole('heading', { name: 'Drafts' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('heading', { name: 'Needs review' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('heading', { name: 'Published' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Learners in progress' })).toBeInTheDocument()
  })

  it('renders all course status sections and admin review links', () => {
    renderPage()

    expect(screen.getByRole('list', { name: 'Drafts modules' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Needs review modules' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Published modules' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View HR Basics versions →' })).toHaveAttribute(
      'href',
      '/admin/modules/hr-basics-mod-001/versions',
    )
    expect(screen.getByRole('link', { name: 'Source Impact Review →' })).toHaveAttribute('href', '/admin/source-impact')
    expect(screen.getByRole('link', { name: 'Audit log →' })).toHaveAttribute('href', '/admin/audit')
  })
})
