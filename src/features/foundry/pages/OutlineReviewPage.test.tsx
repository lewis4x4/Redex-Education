import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const toastSuccessMock = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
  },
}))

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

describe('OutlineReviewPage', () => {
  let OutlineReviewPage: (typeof import('./OutlineReviewPage'))['OutlineReviewPage']
  let useFoundryDraftStore: (typeof import('@/features/foundry/store/foundryDraftStore'))['useFoundryDraftStore']

  beforeEach(async () => {
    vi.resetModules()
    toastSuccessMock.mockReset()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))
    ;({ OutlineReviewPage } = await import('./OutlineReviewPage'))

    act(() => {
      useFoundryDraftStore.getState().clearOutline()
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function renderPage() {
    return render(
      <MemoryRouter>
        <OutlineReviewPage />
      </MemoryRouter>,
    )
  }

  it('shows generating loader when outline is null and then populates after 600ms', async () => {
    vi.useFakeTimers()

    renderPage()

    expect(screen.getByText('AI is generating from your saved draft…')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(600)
      vi.runOnlyPendingTimers()
      await Promise.resolve()
    })

    expect(screen.getByRole('heading', { name: 'HR Basics at Redex' })).toBeInTheDocument()
  })

  it('renders eyebrow, heading, 3 composed sections, and footer actions', async () => {
    renderPage()

    expect(screen.getByText('REDEX AI COURSE FOUNDRY')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Outline review' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Foundry progress' })).toBeInTheDocument()

    expect(await screen.findByRole('heading', { name: 'Generated Outline' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Module and lesson outline' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Missing source information' })).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit outline' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve outline' })).toBeInTheDocument()
  })

  it('approving sets outline status to approved and renders confirmation card', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('heading', { name: 'Generated Outline' })

    await user.click(screen.getByRole('button', { name: 'Approve outline' }))

    expect(useFoundryDraftStore.getState().outline_status).toBe('approved')
    expect(screen.getByRole('button', { name: /continue.*module.*preview/i })).toBeInTheDocument()
    expect(toastSuccessMock).toHaveBeenCalledWith('Saved to your draft')
  })

  it('keeps Edit outline disabled with expected tooltip', async () => {
    renderPage()

    const editButton = await screen.findByRole('button', { name: 'Edit outline' })

    expect(editButton).toBeDisabled()
    expect(editButton).toHaveAttribute('title', 'Manual outline editing coming soon.')
  })
})
