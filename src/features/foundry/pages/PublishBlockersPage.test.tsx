import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('PublishBlockersPage', () => {
  let PublishBlockersPage: (typeof import('./PublishBlockersPage'))['PublishBlockersPage']
  let useFoundryDraftStore: (typeof import('@/features/foundry/store/foundryDraftStore'))['useFoundryDraftStore']

  beforeEach(async () => {
    vi.resetModules()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))
    ;({ PublishBlockersPage } = await import('./PublishBlockersPage'))

    act(() => {
      useFoundryDraftStore.getState().clearDraft()
      useFoundryDraftStore.getState().clearSourceMaterial()
      useFoundryDraftStore.getState().clearCritique()
      useFoundryDraftStore.getState().clearGeneratedModule()
      useFoundryDraftStore.getState().clearLessonReviews()
    })
  })

  function renderPage() {
    return render(
      <MemoryRouter>
        <PublishBlockersPage />
      </MemoryRouter>,
    )
  }

  it('renders eyebrow, heading, subhead, and back link', () => {
    renderPage()

    expect(screen.getByText('REDEX AI COURSE FOUNDRY · STEP 8')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Publish blockers' })).toBeInTheDocument()
    expect(screen.getByText('All outstanding items that prevent this module from being published.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Back to side-by-side review' })).toBeInTheDocument()
  })

  it('falls back to MOCK_PUBLISH_BLOCKERS and renders four blocker rows when foundry data is empty', () => {
    const { container } = renderPage()

    expect(container.querySelectorAll('article')).toHaveLength(4)
  })

  it('keeps Publish module disabled and includes a title tooltip', () => {
    renderPage()

    const publishButton = screen.getByRole('button', { name: 'Publish module' })
    expect(publishButton).toBeDisabled()
    expect(publishButton).toHaveAttribute('title')
  })
})
