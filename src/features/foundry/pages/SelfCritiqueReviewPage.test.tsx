import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_SELF_CRITIQUE } from '@/features/foundry/data/mockSelfCritique'

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

describe('SelfCritiqueReviewPage', () => {
  let SelfCritiqueReviewPage: (typeof import('./SelfCritiqueReviewPage'))['SelfCritiqueReviewPage']
  let useFoundryDraftStore: (typeof import('@/features/foundry/store/foundryDraftStore'))['useFoundryDraftStore']

  beforeEach(async () => {
    vi.resetModules()
    vi.useRealTimers()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))
    ;({ SelfCritiqueReviewPage } = await import('./SelfCritiqueReviewPage'))

    act(() => {
      useFoundryDraftStore.getState().clearCritique()
    })
  })

  function renderPage() {
    return render(
      <MemoryRouter>
        <SelfCritiqueReviewPage />
      </MemoryRouter>,
    )
  }

  it('shows analyzing state then hydrates mock critique after 700ms when critique is null', () => {
    vi.useFakeTimers()
    renderPage()

    expect(screen.getByText('Analyzing module…')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(700)
    })

    expect(useFoundryDraftStore.getState().critique).toEqual(MOCK_SELF_CRITIQUE)
    expect(screen.getByRole('heading', { name: 'High severity (2)' })).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('renders eyebrow, title, subhead, and critique panel content', async () => {
    renderPage()

    expect(screen.getByText('REDEX AI COURSE FOUNDRY · STEP 6')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'AI self-critique' })).toBeInTheDocument()
    expect(
      screen.getByText('The Foundry reviewed its own output and flagged issues to address before publishing.'),
    ).toBeInTheDocument()
    expect(await screen.findByLabelText('Self critique issues')).toBeInTheDocument()
  })

  it('shows Publish blocked status badge when critique blocks publish', async () => {
    renderPage()

    expect(await screen.findByText('Publish blocked')).toBeInTheDocument()
  })
})
