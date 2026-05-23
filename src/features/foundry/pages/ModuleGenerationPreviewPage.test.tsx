import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('ModuleGenerationPreviewPage', () => {
  let ModuleGenerationPreviewPage: (typeof import('./ModuleGenerationPreviewPage'))['ModuleGenerationPreviewPage']
  let useFoundryDraftStore: (typeof import('@/features/foundry/store/foundryDraftStore'))['useFoundryDraftStore']

  beforeEach(async () => {
    vi.resetModules()
    toastSuccessMock.mockReset()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))
    ;({ ModuleGenerationPreviewPage } = await import('./ModuleGenerationPreviewPage'))

    act(() => {
      useFoundryDraftStore.getState().clearGeneratedModule()
    })
  })

  function renderPage() {
    return render(
      <MemoryRouter>
        <ModuleGenerationPreviewPage />
      </MemoryRouter>,
    )
  }

  it('shows empty state when generatedModule is null', () => {
    renderPage()

    expect(screen.getByRole('button', { name: /Generate Full Module in One Click/i })).toBeInTheDocument()
    expect(screen.getByText('No generated module yet')).toBeInTheDocument()
    expect(screen.queryByText('Lessons')).not.toBeInTheDocument()
  })

  it('populates generated module and shows sidebar with 8 lesson rows after clicking Magic Button', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Generate Full Module in One Click/i }))

    expect(useFoundryDraftStore.getState().generatedModule).not.toBeNull()
    expect(screen.getByText('Lessons')).toBeInTheDocument()

    const lessonsPanel = screen.getByText('Lessons').closest('div')
    expect(lessonsPanel).not.toBeNull()
    expect(within(lessonsPanel as HTMLElement).getByRole('button', { name: /Welcome to Redex/i })).toBeInTheDocument()
    expect(within(lessonsPanel as HTMLElement).getByRole('button', { name: /Meeting Your Onboarding Buddy/i })).toBeInTheDocument()

    const lessonButtons = within(lessonsPanel as HTMLElement).getAllByRole('button')
    expect(lessonButtons).toHaveLength(8)
  })

  it('selects clicked lesson and renders that lesson preview in right column', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Generate Full Module in One Click/i }))
    await user.click(screen.getByRole('button', { name: /Quick Check: PTO Basics/i }))

    expect(screen.getByRole('heading', { name: 'Quick Check: PTO Basics' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Generated quiz preview/i })).toBeInTheDocument()
  })
})
