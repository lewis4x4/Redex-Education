import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { useEducation, useMyProgress } from '@/hooks/useEducation'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useAssignmentStore } from '@/features/assignments/store/assignmentStore'
import { useAuditLogStore } from '@/features/audit/store/auditLogStore'
import { useAssessmentAttemptStore } from '@/features/progress/store/assessmentAttemptStore'
import { useModuleVersionsStore } from '@/features/publishing/store/moduleVersionsStore'
import { MOCK_HR_ONBOARDING_ASSIGNMENT } from '@/lib/education'

vi.mock('@/hooks/useEducation', () => ({
  useEducation: vi.fn(),
  useMyProgress: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(),
}))

vi.mock('@/integrations/supabase/queries/onboarding', () => ({
  fetchAuditableModulesForOnboarding: vi.fn(async () => []),
  fetchOnboardingCandidates: vi.fn(async () => []),
}))

vi.mock('@/integrations/supabase/queries/profiles', () => ({
  fetchAllProfiles: vi.fn(async () => []),
}))

const supabaseAuthMocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(() => new Promise(() => undefined)),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
}))

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: supabaseAuthMocks.exchangeCodeForSession,
      onAuthStateChange: supabaseAuthMocks.onAuthStateChange,
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      signInWithOtp: vi.fn(),
    },
  },
}))

const useEducationMock = vi.mocked(useEducation)
const useMyProgressMock = vi.mocked(useMyProgress)
const useAuthMock = vi.mocked(useAuth)
const useProfileMock = vi.mocked(useProfile)

function renderAt(path: string) {
  window.history.pushState({}, '', path)

  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('Redex Education routes', () => {
  beforeEach(() => {
    useEducationMock.mockReturnValue({
      getModule: (id: string) => {
        if (id === 'mod-001') {
          return {
            id: 'mod-001',
            course_id: 'course-001',
            title: 'Orientation Module',
            order_index: 1,
            criticality: 'required',
            estimated_minutes: 10,
          }
        }

        if (id === 'hr-basics-mod-001') {
          return {
            id: 'hr-basics-mod-001',
            course_id: 'course-hr-basics-001',
            title: 'HR Basics at Redex',
            order_index: 1,
            criticality: 'required',
            estimated_minutes: 20,
          }
        }

        return undefined
      },
      getLessonsForModule: () => [],
      getMyEnrollments: () => [
        {
          id: 'enroll-marcus-hr-basics-001',
          user_id: 'user-marcus',
          course_id: 'course-hr-basics-001',
          status: 'active',
          progress_percentage: 0,
          started_at: '2026-05-23T00:00:00.000Z',
        },
      ],
      getLessonStatus: () => 'not_started',
      recordLessonProgress: vi.fn(),
    } as never)

    useMyProgressMock.mockReturnValue({
      percentage: 0,
      completed: 0,
      total: 0,
      enrollment: { progress_percentage: 0 },
      completeLesson: vi.fn(),
    } as never)

    useAuthMock.mockReturnValue({
      loading: false,
      session: { access_token: 'token' },
      user: { id: 'user-marcus', email: 'marcus.chen@redex.example' },
      role: 'learner',
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    } as never)

    useProfileMock.mockReturnValue({
      profile: null,
      loading: false,
      refetch: vi.fn(),
    })

    act(() => {
      useAuditLogStore.getState().resetEvents()
      useModuleVersionsStore.getState().resetVersions()
      useAssignmentStore.getState().resetAssignments()
      useAssessmentAttemptStore.getState().resetAttempts()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('redirects / to /learn', async () => {
    renderAt('/')

    expect(await screen.findByText(/Continue where you left off/i)).toBeInTheDocument()
  })

  it('redirects unknown module routes to /learn', async () => {
    renderAt('/learn/player/unknown-module-id')

    expect(await screen.findByText(/Continue where you left off/i)).toBeInTheDocument()
  })

  it('renders the player route for the Orientation module direct URL', async () => {
    renderAt('/learn/player/mod-001')

    expect(await screen.findByText('Orientation Module')).toBeInTheDocument()
    expect(screen.getByText(/No lessons in this module yet/i)).toBeInTheDocument()
  })

  it('renders the player route for the HR Basics primary learner module', async () => {
    renderAt('/learn/player/hr-basics-mod-001')

    expect(await screen.findByText('HR Basics at Redex')).toBeInTheDocument()
    expect(screen.getByText(/No lessons in this module yet/i)).toBeInTheDocument()
  })

  it('defaults /learn/player to the HR Basics primary learner module', async () => {
    renderAt('/learn/player')

    expect(await screen.findByText('HR Basics at Redex')).toBeInTheDocument()
    expect(screen.getByText(/No lessons in this module yet/i)).toBeInTheDocument()
  })

  it('protects /learn/player by redirecting unauthenticated users to sign-in', async () => {
    useAuthMock.mockReturnValue({
      loading: false,
      session: null,
      user: null,
      role: null,
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    } as never)

    renderAt('/learn/player')

    expect(await screen.findByRole('heading', { name: /Sign in to Redex Education/i })).toBeInTheDocument()
  })

  it('protects /learn/player/:moduleId by redirecting unauthenticated users to sign-in', async () => {
    useAuthMock.mockReturnValue({
      loading: false,
      session: null,
      user: null,
      role: null,
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    } as never)

    renderAt('/learn/player/hr-basics-mod-001')

    expect(await screen.findByRole('heading', { name: /Sign in to Redex Education/i })).toBeInTheDocument()
  })

  it('persists quiz attempts from the module player route with enrollment and answers', async () => {
    const user = userEvent.setup()

    useEducationMock.mockReturnValue({
      getModule: () => ({
        id: 'hr-basics-mod-001',
        course_id: 'course-hr-basics-001',
        title: 'HR Basics at Redex',
        order_index: 1,
        criticality: 'required',
        estimated_minutes: 20,
      }),
      getLessonsForModule: () => [
        {
          id: 'hr-basics-lesson-route-quiz',
          module_id: 'hr-basics-mod-001',
          title: 'Route Quiz Lesson',
          lesson_type: 'quiz',
          criticality: 'required',
          order_index: 1,
          estimated_minutes: 1,
          content: {
            type: 'quiz',
            passing_threshold: 80,
            allow_retakes: true,
            questions: [
              {
                id: 'route-q-1',
                question: 'Which answer should be persisted?',
                options: ['Correct answer', 'Wrong answer'],
                correct_index: 0,
              },
            ],
          },
        },
      ],
      getMyEnrollments: () => [
        {
          id: 'enroll-marcus-hr-basics-001',
          user_id: 'user-marcus',
          course_id: 'course-hr-basics-001',
          status: 'active',
          progress_percentage: 0,
          started_at: '2026-05-23T00:00:00.000Z',
        },
      ],
      getLessonStatus: () => 'not_started',
      recordLessonProgress: vi.fn(),
    } as never)

    renderAt('/learn/player/hr-basics-mod-001')

    await user.click(await screen.findByRole('radio', { name: 'Correct answer' }))
    await user.click(screen.getByRole('button', { name: 'Submit Quiz' }))

    await waitFor(() => {
      expect(useAssessmentAttemptStore.getState().attempts).toEqual([
        expect.objectContaining({
          enrollment_id: 'enroll-marcus-hr-basics-001',
          lesson_id: 'hr-basics-lesson-route-quiz',
          score_percent: 100,
          passed: true,
          answers: { 'route-q-1': 0 },
        }),
      ])
    })
  })

  it('marks Marcus HR Basics assignment completed when using sidebar back after module completion', async () => {
    const user = userEvent.setup()
    const recordLessonProgress = vi.fn()

    useEducationMock.mockReturnValue({
      getModule: () => ({
        id: 'hr-basics-mod-001',
        course_id: 'course-hr-basics-001',
        title: 'HR Basics at Redex',
        order_index: 1,
        criticality: 'required',
        estimated_minutes: 20,
      }),
      getLessonsForModule: () => [
        {
          id: 'hr-basics-lesson-route-test',
          module_id: 'hr-basics-mod-001',
          title: 'Route Test Lesson',
          lesson_type: 'text',
          criticality: 'required',
          order_index: 1,
          estimated_minutes: 1,
          content: { type: 'text', body_markdown: 'Route test content' },
        },
      ],
      getMyEnrollments: () => [
        {
          id: 'enroll-marcus-hr-basics-001',
          user_id: 'user-marcus',
          course_id: 'course-hr-basics-001',
          status: 'active',
          progress_percentage: 0,
          started_at: '2026-05-23T00:00:00.000Z',
        },
      ],
      getLessonStatus: () => 'not_started',
      recordLessonProgress,
    } as never)

    act(() => {
      useAssignmentStore.setState({
        assignments: [{ ...MOCK_HR_ONBOARDING_ASSIGNMENT, status: 'in_progress' }],
      })
    })

    renderAt('/learn/player/hr-basics-mod-001')

    await user.click(await screen.findByRole('button', { name: /complete module/i }))
    expect(recordLessonProgress).toHaveBeenCalledWith('hr-basics-lesson-route-test', 'completed')
    expect(
      useAssignmentStore
        .getState()
        .assignments.find((assignment) => assignment.id === 'assignment-hr-basics-marcus')?.status,
    ).toBe('completed')

    const sidebarBackButton = screen.getAllByRole('button', { name: /back to dashboard/i }).at(0)
    expect(sidebarBackButton).toBeDefined()
    await user.click(sidebarBackButton!)

    expect(
      useAssignmentStore
        .getState()
        .assignments.find((assignment) => assignment.id === 'assignment-hr-basics-marcus')?.status,
    ).toBe('completed')
  })

  it('renders NotFoundPage for unknown paths', () => {
    renderAt('/garbage')

    expect(screen.getByRole('heading', { name: /Page not found/i })).toBeInTheDocument()
  })

  it('routes unknown /admin/* paths to NotFoundPage', () => {
    renderAt('/admin/does-not-exist')

    expect(screen.getByRole('heading', { name: /Page not found/i })).toBeInTheDocument()
  })

  it('renders /admin through AuthGate wiring with enabled start CTA when mock auth is enabled', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin')

    expect(await screen.findByRole('heading', { name: /Good (morning|afternoon|evening), Marcus/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start new module/i })).toBeEnabled()
  })

  it('renders AssignmentAdminPage at /admin/assignments', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/assignments')

    expect(await screen.findByRole('heading', { name: 'Manage assignments' })).toBeInTheDocument()
  })

  it('renders AuditLogPage at /admin/audit', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/audit')

    expect(await screen.findByRole('heading', { name: 'Audit log' })).toBeInTheDocument()
    expect(screen.getByText('ADMIN · AUDIT')).toBeInTheDocument()
  })

  it('renders OnboardNewPersonPage at /admin/onboard', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')
    useAuthMock.mockReturnValue({
      loading: false,
      session: { access_token: 'token' },
      user: { id: 'user-jordan-admin', email: 'jordan.patel@redex.example' },
      role: 'admin',
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    } as never)

    renderAt('/admin/onboard')

    expect(await screen.findByRole('heading', { name: 'Onboard a new person' })).toBeInTheDocument()
  })

  it('renders PeopleListPage at /admin/people', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')
    useAuthMock.mockReturnValue({
      loading: false,
      session: { access_token: 'token' },
      user: { id: 'user-jordan-admin', email: 'jordan.patel@redex.example' },
      role: 'admin',
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    } as never)

    renderAt('/admin/people')

    expect(await screen.findByRole('heading', { name: 'People' })).toBeInTheDocument()
  })

  it('renders ModuleVersionHistoryPage at /admin/modules/:moduleId/versions', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/modules/hr-basics-mod-001/versions')

    expect(await screen.findByRole('heading', { level: 1, name: 'HR Basics at Redex' })).toBeInTheDocument()
    expect(screen.getByText('Version history')).toBeInTheDocument()
  })

  it('renders SourceImpactReviewPage at /admin/source-impact', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/source-impact')

    expect(await screen.findByRole('heading', { name: 'Review source changes before regeneration' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sync from Drive' })).toBeInTheDocument()
  })

  it('renders ManagerDashboardPage at /manager for manager roles', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'mock')
    useAuthMock.mockReturnValue({
      loading: false,
      session: { access_token: 'token' },
      user: { id: 'user-sarah-manager', email: 'sarah.chen@redex.example' },
      role: 'manager',
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    } as never)
    useProfileMock.mockReturnValue({
      profile: {
        id: 'user-sarah-manager',
        org_id: 'org-redex',
        email: 'sarah.chen@redex.example',
        display_name: 'Sarah Chen',
        role: 'manager',
        created_at: '2026-05-23T00:00:00.000Z',
        updated_at: '2026-05-24T00:00:00.000Z',
      },
      loading: false,
      refetch: vi.fn(),
    })

    renderAt('/manager')

    expect(await screen.findByRole('heading', { name: 'Team training progress' })).toBeInTheDocument()
    expect(await screen.findByRole('row', { name: /Marcus Chen/i })).toBeInTheDocument()
  })

  it('renders the auth callback route without redirecting through /', async () => {
    renderAt('/auth/callback?code=pkce-code&state=pkce-state')

    expect(await screen.findByText(/Completing secure sign-in/i)).toBeInTheDocument()
    expect(supabaseAuthMocks.exchangeCodeForSession).toHaveBeenCalledWith('pkce-code')
  })

  it('renders SignInPage at /sign-in', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/sign-in')

    expect(await screen.findByRole('heading', { name: /Sign in to Redex Education/i })).toBeInTheDocument()
  })

  it('renders FoundryStartPage at /admin/foundry/start', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/foundry/start')

    expect(await screen.findByRole('heading', { name: 'Module basics' })).toBeInTheDocument()
  })

  it('redirects /admin/foundry/source to /admin/foundry/start when basics prereq is missing', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/foundry/source')

    expect(await screen.findByRole('heading', { name: 'Module basics' })).toBeInTheDocument()
  })

  it('renders SourceLibraryPage at /admin/foundry/library', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/foundry/library')

    expect(await screen.findByRole('heading', { name: 'Source Library' })).toBeInTheDocument()
  })

  // Note: inner-Foundry route tests (questions, outline, preview, critique,
  // sidebyside, blockers, published) are deliberately omitted here. Their
  // cold-load redirect guards make isolated rendering tests flaky in the
  // shared test environment. Their happy-path traversal — which covers
  // route registration AND content rendering AND state transitions — lives
  // in `src/App.routes.foundryFlow.test.tsx`.
})
