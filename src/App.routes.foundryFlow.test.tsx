import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { MOCK_GENERATED_MODULE } from '@/features/foundry/data/mockGeneratedModule'
import { MOCK_GENERATED_OUTLINE } from '@/features/foundry/data/mockGeneratedOutline'
import type { LessonReviewItem, SelfCritiqueReport } from '@/lib/education'
import { useAuth } from '@/hooks/useAuth'
import { useEducation, useMyProgress } from '@/hooks/useEducation'

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

function createStorageMock(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
  }
}

function buildFlowLessonReviews(): LessonReviewItem[] {
  return [
    {
      lesson_index: 0,
      module_index: 0,
      lesson_title: 'Welcome to Redex',
      confidence: 'high',
      has_unsupported_claim: false,
      status: 'approved',
      source_excerpts: [],
    },
    {
      lesson_index: 1,
      module_index: 0,
      lesson_title: 'Who to Contact for HR Help',
      confidence: 'high',
      has_unsupported_claim: false,
      status: 'approved',
      source_excerpts: [],
    },
    {
      lesson_index: 2,
      module_index: 0,
      lesson_title: 'Payroll and Timekeeping Basics',
      confidence: 'unsupported',
      has_unsupported_claim: true,
      unsupported_note: 'Unsupported claim fixture for publish-blocker assertion.',
      status: 'pending',
      source_excerpts: [],
    },
    {
      lesson_index: 3,
      module_index: 0,
      lesson_title: 'First-Week Expectations',
      confidence: 'medium',
      has_unsupported_claim: false,
      status: 'pending',
      source_excerpts: [],
    },
  ]
}

function buildNonBlockingCritique(): SelfCritiqueReport {
  return {
    module_title: 'HR Basics at Redex',
    generated_at: '2026-05-24T00:00:00.000Z',
    blocks_publish: false,
    issues: [],
  }
}

function LocationProbe() {
  const location = useLocation()

  return <p data-testid="location-path">{location.pathname}</p>
}

describe('Foundry admin end-to-end route flow', () => {
  let useFoundryDraftStore: (typeof import('@/features/foundry/store/foundryDraftStore'))['useFoundryDraftStore']
  let usePublishedModulesStore: (typeof import('@/features/publishing/store/publishedModulesStore'))['usePublishedModulesStore']

  beforeEach(async () => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    useEducationMock.mockReturnValue({
      getModule: () => undefined,
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

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ usePublishedModulesStore } = await import('@/features/publishing/store/publishedModulesStore'))
    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))

    act(() => {
      usePublishedModulesStore.getState().resetPublishedModules()
      useFoundryDraftStore.getState().resetFoundryDraft()
    })
  })

  it('walks the admin Foundry flow through publish confirmation', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/admin/foundry/start']}>
        <App />
        <LocationProbe />
      </MemoryRouter>,
    )

    await user.type(await screen.findByLabelText(/module title/i), 'HR Basics at Redex')
    // Audience archetype defaults to 'new_hire' ("New hires") in the new dropdown form;
    // no input needed. Learning outcomes require at least one ≥8-char entry to pass schema validation.
    await user.type(screen.getByPlaceholderText(/Describe a concrete post-training capability/i), 'Submit an expense report through the new ERP system within their first week.')
    await user.click(screen.getByRole('button', { name: 'Continue → Add source material' }))

    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/admin/foundry/source'))

    // Seed source material so the FoundryQuestionsPage prerequisite guard
    // doesn't redirect back to /source. In production this is set when the
    // admin pastes/uploads source on the source-binder page.
    act(() => {
      useFoundryDraftStore.getState().setSourceMaterial({
        id: 'test-source-1',
        title: 'HR onboarding handbook',
        type: 'markdown',
        raw_text: 'Sample HR onboarding source material for the foundry flow test.',
        processing_status: 'processed',
        sections: [],
      })
    })

    await user.click(await screen.findByRole('button', { name: 'Continue → Setup questions' }))
    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/admin/foundry/questions'))

    act(() => {
      useFoundryDraftStore.getState().setSetupAnswers({
        criticality: 'basic_knowledge',
        assessment_style: 'light_quiz',
        audience_notes: 'New hires, including Marcus Chen',
        experience_notes: 'Warm first-week HR onboarding flow',
        estimated_minutes: 20,
        source_control: 'strict',
        requires_admin_approval: true,
        requires_safety_review: false,
      })
    })

    await user.click(await screen.findByRole('button', { name: /Continue → Outline review/i }))
    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/admin/foundry/outline'))

    act(() => {
      useFoundryDraftStore.getState().setOutline(MOCK_GENERATED_OUTLINE)
      useFoundryDraftStore.getState().approveOutline()
    })

    await user.click(await screen.findByRole('button', { name: 'Continue → Module preview' }))
    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/admin/foundry/preview'))

    act(() => {
      useFoundryDraftStore.getState().setGeneratedModule(MOCK_GENERATED_MODULE)
    })

    await user.click(await screen.findByRole('button', { name: 'Continue → Self-critique' }))
    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/admin/foundry/critique'))

    act(() => {
      useFoundryDraftStore.getState().setCritique(buildNonBlockingCritique())
    })

    await user.click(await screen.findByRole('button', { name: 'Continue → Side-by-side review' }))
    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/admin/foundry/sidebyside'))

    await user.click(await screen.findByRole('button', { name: 'Continue → Resolve blockers' }))
    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/admin/foundry/blockers'))

    // Seed the blocker after the blockers page is mounted so this assertion is
    // hermetic under full-suite parallel execution and independent of any
    // side-by-side page async fixture hydration timing.
    act(() => {
      useFoundryDraftStore.getState().setLessonReviews(buildFlowLessonReviews())
    })

    await waitFor(() => expect(screen.getByRole('button', { name: 'Publish module' })).toBeDisabled())

    act(() => {
      for (const review of useFoundryDraftStore.getState().lessonReviews) {
        useFoundryDraftStore.getState().approveLessonReview(review.lesson_index, review.module_index)
      }
    })

    await waitFor(() => expect(screen.getByRole('button', { name: 'Publish module' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Publish module' }))

    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/admin/foundry/published'))
    expect(useFoundryDraftStore.getState().publishStatus).toBe('published')
    expect(useFoundryDraftStore.getState().publishedAt).toEqual(expect.any(String))
    expect(usePublishedModulesStore.getState().getAllPublished()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          module_version_id: 'module-version-hr-basics-v1',
          title: 'HR Basics at Redex',
        }),
      ]),
    )
    expect(await screen.findByRole('heading', { name: 'HR Basics at Redex' })).toBeInTheDocument()
  })
})
