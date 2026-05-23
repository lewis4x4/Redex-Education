import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { useEducation, useMyProgress } from '@/hooks/useEducation'
import { useAuth } from '@/hooks/useAuth'
import { useAssignmentStore } from '@/features/assignments/store/assignmentStore'
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

const useEducationMock = vi.mocked(useEducation)
const useMyProgressMock = vi.mocked(useMyProgress)
const useAuthMock = vi.mocked(useAuth)

function renderAt(path: string) {
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
      session: null,
      user: null,
    } as never)

    act(() => {
      useModuleVersionsStore.getState().resetVersions()
      useAssignmentStore.getState().resetAssignments()
      useAssessmentAttemptStore.getState().resetAttempts()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('redirects / to /learn', () => {
    renderAt('/')

    expect(screen.getByText(/Continue where you left off/i)).toBeInTheDocument()
  })

  it('redirects unknown module routes to /learn', () => {
    renderAt('/learn/player/unknown-module-id')

    expect(screen.getByText(/Continue where you left off/i)).toBeInTheDocument()
  })

  it('renders the player route for the Orientation module direct URL', () => {
    renderAt('/learn/player/mod-001')

    expect(screen.getByText('Orientation Module')).toBeInTheDocument()
    expect(screen.getByText(/No lessons in this module yet/i)).toBeInTheDocument()
  })

  it('renders the player route for the HR Basics primary learner module', () => {
    renderAt('/learn/player/hr-basics-mod-001')

    expect(screen.getByText('HR Basics at Redex')).toBeInTheDocument()
    expect(screen.getByText(/No lessons in this module yet/i)).toBeInTheDocument()
  })

  it('defaults /learn/player to the HR Basics primary learner module', () => {
    renderAt('/learn/player')

    expect(screen.getByText('HR Basics at Redex')).toBeInTheDocument()
    expect(screen.getByText(/No lessons in this module yet/i)).toBeInTheDocument()
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

    await user.click(screen.getByRole('radio', { name: 'Correct answer' }))
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

    await user.click(screen.getByRole('button', { name: /complete module/i }))
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

  it('renders /admin through AuthGate wiring with enabled start CTA when mock auth is enabled', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin')

    expect(await screen.findByRole('heading', { name: /welcome back, admin/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start new module/i })).toBeEnabled()
  })

  it('renders AssignmentAdminPage at /admin/assignments', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/assignments')

    expect(await screen.findByRole('heading', { name: 'Manage assignments' })).toBeInTheDocument()
  })

  it('renders ModuleVersionHistoryPage at /admin/modules/:moduleId/versions', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/modules/hr-basics-mod-001/versions')

    expect(await screen.findByRole('heading', { level: 1, name: 'HR Basics at Redex' })).toBeInTheDocument()
    expect(screen.getByText('Version history')).toBeInTheDocument()
  })

  it('renders ManagerDashboardPage at /manager', async () => {
    renderAt('/manager')

    expect(await screen.findByRole('heading', { name: 'Team training progress' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Marcus Chen/i })).toBeInTheDocument()
  })

  it('renders FoundryStartPage at /admin/foundry/start', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/foundry/start')

    expect(await screen.findByRole('heading', { name: 'New module — basics' })).toBeInTheDocument()
  })

  it('renders SourceBinderInputPage at /admin/foundry/source', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/foundry/source')

    expect(await screen.findByRole('heading', { name: 'Add source material' })).toBeInTheDocument()
    expect(screen.getByText('REDEX AI COURSE FOUNDRY · STEP 2')).toBeInTheDocument()
  })

  it('renders FoundryQuestionsPage at /admin/foundry/questions', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/foundry/questions')

    expect(await screen.findByRole('heading', { name: 'Setup questions' })).toBeInTheDocument()
  })

  it('renders SourceLibraryPage at /admin/foundry/library', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/foundry/library')

    expect(await screen.findByRole('heading', { name: 'Source Library' })).toBeInTheDocument()
  })

  it('renders OutlineReviewPage at /admin/foundry/outline', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/foundry/outline')

    expect(await screen.findByRole('heading', { name: 'Review the generated outline' })).toBeInTheDocument()
  })

  it('renders ModuleGenerationPreviewPage at /admin/foundry/preview', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/foundry/preview')

    expect(await screen.findByRole('heading', { name: 'Review generated module' })).toBeInTheDocument()
  })

  it('renders SelfCritiqueReviewPage at /admin/foundry/critique', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/foundry/critique')

    expect(await screen.findByRole('heading', { name: 'AI self-critique' })).toBeInTheDocument()
  })

  it('renders SideBySideReviewPage at /admin/foundry/sidebyside', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/foundry/sidebyside')

    expect(await screen.findByRole('heading', { name: 'Side-by-side review' })).toBeInTheDocument()
  })

  it('renders PublishBlockersPage at /admin/foundry/blockers', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/foundry/blockers')

    expect(await screen.findByRole('heading', { level: 1, name: 'Publish blockers' })).toBeInTheDocument()
  })

  it('renders PublishConfirmationPage at /admin/foundry/published', async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    renderAt('/admin/foundry/published')

    expect(await screen.findByRole('heading', { level: 1, name: 'Module published' })).toBeInTheDocument()
  })
})
