import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_GENERATED_MODULE } from '@/features/foundry/data/mockGeneratedModule'
import { MOCK_LESSON_REVIEWS } from '@/features/foundry/data/mockLessonReviews'

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

describe('SideBySideReviewPage', () => {
  let SideBySideReviewPage: (typeof import('./SideBySideReviewPage'))['SideBySideReviewPage']
  let useFoundryDraftStore: (typeof import('@/features/foundry/store/foundryDraftStore'))['useFoundryDraftStore']

  beforeEach(async () => {
    vi.resetModules()
    vi.useRealTimers()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))
    ;({ SideBySideReviewPage } = await import('./SideBySideReviewPage'))

    act(() => {
      useFoundryDraftStore.getState().clearLessonReviews()
    })
  })

  function renderPage() {
    return render(
      <MemoryRouter>
        <SideBySideReviewPage />
      </MemoryRouter>,
    )
  }

  it('shows loading state, then hydrates lesson reviews after 500ms', async () => {
    vi.useFakeTimers()
    renderPage()

    expect(screen.getByText('Loading review data…')).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(useFoundryDraftStore.getState().lessonReviews).toEqual(MOCK_LESSON_REVIEWS)
    expect(screen.getByRole('heading', { name: 'Generated content' })).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('renders eyebrow, heading, two-pane compare layout, and lesson nav', async () => {
    renderPage()

    expect(screen.getByText('REDEX AI COURSE FOUNDRY · STEP 7')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Side-by-side review' })).toBeInTheDocument()
    expect(await screen.findByLabelText('Generated and source comparison')).toBeInTheDocument()

    for (const review of MOCK_LESSON_REVIEWS) {
      expect(screen.getByRole('button', { name: new RegExp(review.lesson_title) })).toBeInTheDocument()
    }
  })

  it('renders status summary chips with expected starting counts', async () => {
    renderPage()

    expect(await screen.findByText('2 approved')).toBeInTheDocument()
    expect(screen.getByText('4 pending')).toBeInTheDocument()
    expect(screen.getByText('0 need regeneration')).toBeInTheDocument()
  })

  it('renders immediately in real mode when generated lessons exist (no loading lock)', async () => {
    vi.stubEnv('VITE_AI_MODE', 'real')
    act(() => {
      useFoundryDraftStore.getState().setGeneratedModule(MOCK_GENERATED_MODULE)
      useFoundryDraftStore.getState().clearLessonReviews()
    })

    renderPage()

    expect(screen.queryByText('Loading review data…')).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Generated content' })).toBeInTheDocument()
    vi.unstubAllEnvs()
  })

  it('keeps Continue enabled and navigates to blockers page on click', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/foundry/sidebyside']}>
        <Routes>
          <Route path="/admin/foundry/sidebyside" element={<SideBySideReviewPage />} />
          <Route path="/admin/foundry/blockers" element={<h1>Publish blockers</h1>} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Generated content' })

    const continueButton = screen.getByRole('button', { name: 'Continue → Resolve blockers' })
    expect(continueButton).toBeEnabled()

    fireEvent.click(continueButton)

    expect(screen.getByRole('heading', { name: 'Publish blockers' })).toBeInTheDocument()
  })
})
