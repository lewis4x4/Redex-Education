import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import App from '@/App'
import { useEducation, useMyProgress } from '@/hooks/useEducation'
import { useAuth } from '@/hooks/useAuth'

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
      getModule: (id: string) =>
        id === 'mod-001'
          ? {
              id: 'mod-001',
              course_id: 'course-001',
              title: 'Orientation Module',
              order_index: 1,
              criticality: 'required',
              estimated_minutes: 10,
            }
          : undefined,
      getLessonsForModule: () => [],
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

  it('renders the player route for a valid module id', () => {
    renderAt('/learn/player/mod-001')

    expect(screen.getByText(/No lessons in this module yet/i)).toBeInTheDocument()
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
})
