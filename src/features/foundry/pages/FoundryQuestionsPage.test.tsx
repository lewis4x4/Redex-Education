import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

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

describe('FoundryQuestionsPage', () => {
  let FoundryQuestionsPage: (typeof import('./FoundryQuestionsPage'))['FoundryQuestionsPage']
  let useFoundryDraftStore: (typeof import('@/features/foundry/store/foundryDraftStore'))['useFoundryDraftStore']

  beforeEach(async () => {
    vi.resetModules()
    toastSuccessMock.mockReset()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))
    ;({ FoundryQuestionsPage } = await import('./FoundryQuestionsPage'))

    act(() => {
      useFoundryDraftStore.getState().clearSetupAnswers()
    })
  })

  function renderWithRoutes() {
    return render(
      <MemoryRouter initialEntries={['/admin/foundry/questions']}>
        <Routes>
          <Route path="/admin/foundry/questions" element={<FoundryQuestionsPage />} />
          <Route path="/admin/foundry/source" element={<div>Back to source</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('renders eyebrow, heading, subhead, and wizard', () => {
    renderWithRoutes()

    expect(screen.getByText('REDEX AI COURSE FOUNDRY · STEP 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Setup questions' })).toBeInTheDocument()
    expect(screen.getByText(/These answers drive how the Foundry generates this module\./i)).toBeInTheDocument()
    expect(screen.getByRole('form', { name: /setup questions wizard/i })).toBeInTheDocument()
  })

  it('submits wizard values, writes setupAnswers to store, and shows toast', async () => {
    const user = userEvent.setup()
    renderWithRoutes()

    await user.type(screen.getByRole('textbox', { name: /audience notes/i }), 'ops team')
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.click(await screen.findByRole('radio', { name: 'Operational' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.click(await screen.findByText('Standard quiz'))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.type(await screen.findByRole('textbox', { name: /experience notes/i }), 'hands-on')
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.click(await screen.findByText('Strict'))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(useFoundryDraftStore.getState().setupAnswers).toEqual(
      expect.objectContaining({
        audience_notes: 'ops team',
        criticality: 'operational',
        assessment_style: 'standard_quiz',
        experience_notes: 'hands-on',
        source_control: 'strict',
      }),
    )
    expect(useFoundryDraftStore.getState().setupAnswers?.updated_at).toEqual(expect.any(String))
    expect(toastSuccessMock).toHaveBeenCalledWith('Setup answers saved')
  })
})
