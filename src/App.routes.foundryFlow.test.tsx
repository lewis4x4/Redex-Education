import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { MOCK_GENERATED_MODULE } from '@/features/foundry/data/mockGeneratedModule'
import { MOCK_GENERATED_OUTLINE } from '@/features/foundry/data/mockGeneratedOutline'
import { MOCK_LESSON_REVIEWS } from '@/features/foundry/data/mockLessonReviews'
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

function LocationProbe() {
  const location = useLocation()

  return <p data-testid="location-path">{location.pathname}</p>
}

describe('Foundry admin end-to-end route flow', () => {
  let useFoundryDraftStore: (typeof import('@/features/foundry/store/foundryDraftStore'))['useFoundryDraftStore']

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

    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))

    act(() => {
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
    await user.type(screen.getByLabelText(/audience/i), 'New hires')
    await user.click(screen.getByRole('button', { name: 'Continue → Add source material' }))

    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/admin/foundry/source'))

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

    await user.click(await screen.findByRole('button', { name: /Continue → Outline preview/i }))
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

    await user.click(await screen.findByRole('button', { name: 'Continue → Side-by-side review' }))
    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/admin/foundry/sidebyside'))

    act(() => {
      useFoundryDraftStore.getState().setLessonReviews(MOCK_LESSON_REVIEWS)
    })

    await user.click(await screen.findByRole('button', { name: 'Continue → Resolve blockers' }))
    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/admin/foundry/blockers'))

    expect(await screen.findByRole('button', { name: 'Publish module' })).toBeDisabled()

    act(() => {
      for (const review of MOCK_LESSON_REVIEWS) {
        useFoundryDraftStore.getState().approveLessonReview(review.lesson_index, review.module_index)
      }
    })

    await waitFor(() => expect(screen.getByRole('button', { name: 'Publish module' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Publish module' }))

    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/admin/foundry/published'))
    expect(useFoundryDraftStore.getState().publishStatus).toBe('published')
    expect(useFoundryDraftStore.getState().publishedAt).toEqual(expect.any(String))
    expect(await screen.findByRole('heading', { name: 'HR Basics at Redex' })).toBeInTheDocument()
  })
})
