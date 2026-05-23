import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

  it('shows loading state, then hydrates lesson reviews after 500ms', () => {
    vi.useFakeTimers()
    renderPage()

    expect(screen.getByText('Loading review data…')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(useFoundryDraftStore.getState().lessonReviews).toEqual(MOCK_LESSON_REVIEWS)
    expect(screen.getByRole('heading', { name: 'Generated content' })).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('renders eyebrow, heading, two-pane compare layout, and 8-lesson nav', async () => {
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
    expect(screen.getByText('6 pending')).toBeInTheDocument()
    expect(screen.getByText('0 need regeneration')).toBeInTheDocument()
  })
})
