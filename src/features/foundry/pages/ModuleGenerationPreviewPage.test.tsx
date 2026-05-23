import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
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

  function renderPageWithRoutes() {
    return render(
      <MemoryRouter initialEntries={['/admin/foundry/preview']}>
        <Routes>
          <Route path="/admin/foundry/preview" element={<ModuleGenerationPreviewPage />} />
          <Route path="/admin/foundry/critique" element={<h1>Critique route reached</h1>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('shows empty state when generatedModule is null', () => {
    renderPage()

    expect(screen.getByRole('button', { name: /Generate Full Module in One Click/i })).toBeInTheDocument()
    expect(screen.getByText('No generated module yet')).toBeInTheDocument()
    expect(screen.queryByText('Lessons')).not.toBeInTheDocument()
  })

  it('populates generated module and shows sidebar with 6 lesson rows after clicking Magic Button', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Generate Full Module in One Click/i }))

    expect(useFoundryDraftStore.getState().generatedModule).not.toBeNull()
    expect(screen.getByText('Lessons')).toBeInTheDocument()

    const lessonsPanel = screen.getByText('Lessons').closest('div')
    expect(lessonsPanel).not.toBeNull()
    expect(within(lessonsPanel as HTMLElement).getByRole('button', { name: /Welcome to Redex/i })).toBeInTheDocument()
    expect(within(lessonsPanel as HTMLElement).getByRole('button', { name: /Final Quiz/i })).toBeInTheDocument()

    const lessonButtons = within(lessonsPanel as HTMLElement).getAllByRole('button')
    expect(lessonButtons).toHaveLength(6)
  })

  it('selects clicked lesson and renders that lesson preview in right column', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Generate Full Module in One Click/i }))
    await user.click(screen.getByRole('button', { name: /Final Quiz/i }))

    expect(screen.getByRole('heading', { name: 'Final Quiz' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Generated quiz preview/i })).toBeInTheDocument()
  })

  it('keeps Continue → Self-critique enabled and navigates to critique route on click', async () => {
    const user = userEvent.setup()
    renderPageWithRoutes()

    const continueButton = screen.getByRole('button', { name: /Continue → Self-critique/i })
    expect(continueButton).toBeEnabled()

    await user.click(continueButton)

    expect(screen.getByRole('heading', { name: 'Critique route reached' })).toBeInTheDocument()
  })
})
