import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AdminDashboardPage } from './AdminDashboardPage'
import { useAdminSummary } from '@/hooks/useAdminSummary'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { MOCK_ADMIN_SUMMARY } from '@/features/admin/data/mockAdmin'

const foundryDraftStoreMock = vi.hoisted(() => ({
  resumeDraftFromAdminItem: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))
vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(),
}))
vi.mock('@/hooks/useAdminSummary', () => ({
  useAdminSummary: vi.fn(),
}))
vi.mock('@/features/foundry/store/foundryDraftStore', () => ({
  useFoundryDraftStore: {
    getState: () => ({
      resumeDraftFromAdminItem: foundryDraftStoreMock.resumeDraftFromAdminItem,
    }),
  },
}))

const useAuthMock = vi.mocked(useAuth)
const useProfileMock = vi.mocked(useProfile)
const useAdminSummaryMock = vi.mocked(useAdminSummary)

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location-path">{location.pathname}</div>
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    foundryDraftStoreMock.resumeDraftFromAdminItem.mockReset()
    foundryDraftStoreMock.resumeDraftFromAdminItem.mockReturnValue('/admin/foundry/source')
    useAuthMock.mockReturnValue({
      loading: false,
      session: { access_token: 'token' },
      user: { id: 'user-admin', email: 'admin.user@redex.example' },
      role: 'admin',
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    } as never)
    useProfileMock.mockReturnValue({ profile: null, loading: false, refetch: vi.fn() })
    useAdminSummaryMock.mockReturnValue({
      summary: MOCK_ADMIN_SUMMARY,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
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

    expect(screen.getByText('ADMIN DASHBOARD')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: /Good (morning|afternoon|evening), Admin/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Your training operations at a glance')).toBeInTheDocument()
  })

  it('uses first-name fallback from display name when available', () => {
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

    expect(screen.getByRole('heading', { level: 1, name: /Good (morning|afternoon|evening), Jordan/i })).toBeInTheDocument()
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
    expect(screen.queryByRole('link', { name: 'View HR Basics versions →' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Source Impact Review →' })).toHaveAttribute('href', '/admin/source-impact')
    expect(screen.getByRole('link', { name: 'Source library →' })).toHaveAttribute('href', '/admin/foundry/library')
    expect(screen.getByRole('link', { name: 'Audit log →' })).toHaveAttribute('href', '/admin/audit')
    expect(screen.getByRole('link', { name: 'Manage assignments →' })).toHaveAttribute('href', '/admin/assignments')
    expect(screen.getByText('0 archived')).toBeInTheDocument()
  })

  it('renders every mock dashboard row title as a module version-history link', () => {
    renderPage()

    const rows = [...MOCK_ADMIN_SUMMARY.drafts, ...MOCK_ADMIN_SUMMARY.needs_review, ...MOCK_ADMIN_SUMMARY.published]

    for (const row of rows) {
      expect(screen.getByRole('link', { name: row.title })).toHaveAttribute(
        'href',
        `/admin/modules/${row.module_id}/versions`,
      )
    }
  })

  it('renders a supabase draft row in the Drafts bucket with its metadata text', () => {
    useAdminSummaryMock.mockReturnValue({
      summary: {
        ...MOCK_ADMIN_SUMMARY,
        drafts: [
          {
            id: 'module-version-supabase-draft-v1',
            module_id: 'module-supabase-draft-1',
            module_version_id: 'module-version-supabase-draft-v1',
            version_number: 1,
            title: 'Supabase Draft Module',
            status: 'Draft',
            meta: 'Updated 5 minutes ago',
          },
        ],
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByRole('list', { name: 'Drafts modules' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Supabase Draft Module' })).toHaveAttribute(
      'href',
      '/admin/modules/module-supabase-draft-1/versions',
    )
    expect(screen.getByText('Updated 5 minutes ago')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resume draft: Supabase Draft Module' })).toBeEnabled()
  })

  it('routes a dashboard draft Resume draft action into Foundry', async () => {
    const user = userEvent.setup()
    const draft = MOCK_ADMIN_SUMMARY.drafts[0]!

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
          <Route path="/admin/foundry/:step" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: `Resume draft: ${draft.title}` }))

    expect(foundryDraftStoreMock.resumeDraftFromAdminItem).toHaveBeenCalledWith({
      module_version_id: draft.module_version_id,
      module_id: draft.module_id,
      module_title: draft.title,
      version_number: draft.version_number,
    })
    expect(screen.getByTestId('location-path')).toHaveTextContent('/admin/foundry/source')
  })

  it('renders per-list empty-state copy and preserves needs-review default empty copy', () => {
    useAdminSummaryMock.mockReturnValue({
      summary: {
        ...MOCK_ADMIN_SUMMARY,
        drafts: [],
        needs_review: [],
        published: [],
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByText('No drafts in flight. Start a new module to see it here.')).toBeInTheDocument()
    expect(screen.getByText('No published modules yet. Approved courses will appear here.')).toBeInTheDocument()
    expect(screen.getByText('All caught up. No modules awaiting review.')).toBeInTheDocument()
  })

  it('renders a loading skeleton while the summary is being fetched', () => {
    useAdminSummaryMock.mockReturnValue({
      summary: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByText('ADMIN DASHBOARD')).toBeInTheDocument()
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status.querySelectorAll('.animate-pulse')).toHaveLength(9)
    expect(screen.queryByRole('heading', { name: 'Learners in progress' })).not.toBeInTheDocument()
  })

  it('renders generation job banner when pending jobs are present', () => {
    useAdminSummaryMock.mockReturnValue({
      summary: {
        ...MOCK_ADMIN_SUMMARY,
        metrics: { ...MOCK_ADMIN_SUMMARY.metrics, pending_generation_jobs: 2 },
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('2 module generations in progress…')
  })

  it('renders an em dash for completion rate when no assignments exist', () => {
    useAdminSummaryMock.mockReturnValue({
      summary: {
        ...MOCK_ADMIN_SUMMARY,
        assignment_summary: {
          ...MOCK_ADMIN_SUMMARY.assignment_summary,
          completion_rate_percent: null,
        },
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders an error alert with a retry button when fetch fails', async () => {
    const refetch = vi.fn()
    useAdminSummaryMock.mockReturnValue({
      summary: null,
      loading: false,
      error: new Error('Cannot reach Supabase'),
      refetch,
    })
    const user = userEvent.setup()

    renderPage()

    expect(screen.getByText('ADMIN DASHBOARD')).toBeInTheDocument()
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/couldn't load your dashboard/i)
    expect(alert).toHaveTextContent('Cannot reach Supabase')

    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
