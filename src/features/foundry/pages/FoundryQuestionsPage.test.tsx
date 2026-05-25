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
      useFoundryDraftStore.getState().setBasics({
        title: 'Draft ready',
        parent_course_id: 'standalone',
        audience: 'Ops',
        criticality: 'required',
        training_type: 'operational',
        estimated_minutes: 30,
      })
      useFoundryDraftStore.getState().setSourceMaterial({
        id: 'source-1',
        title: 'Source',
        type: 'markdown',
        raw_text: '# Source',
        raw_text_preview: '# Source',
        processing_status: 'processed',
        sections: [],
      })
    })
  })

  function renderWithRoutes() {
    return render(
      <MemoryRouter initialEntries={['/admin/foundry/questions']}>
        <Routes>
          <Route path="/admin/foundry/questions" element={<FoundryQuestionsPage />} />
          <Route path="/admin/foundry/source" element={<div>Back to source</div>} />
          <Route path="/admin/foundry/outline" element={<div>Outline route reached</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('renders eyebrow, heading, subhead, and wizard', () => {
    renderWithRoutes()

    expect(screen.getByText('REDEX AI COURSE FOUNDRY')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Generation guidance' })).toBeInTheDocument()
    expect(screen.getByText(/These answers refine how the Foundry generates this module\./i)).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Foundry progress' })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: /setup questions wizard/i })).toBeInTheDocument()
  })

  it('allows setup questions when only Source Library files are selected', async () => {
    act(() => {
      useFoundryDraftStore.getState().clearSourceMaterial()
      useFoundryDraftStore.getState().toggleLibraryFile('drive-file-1')
    })

    renderWithRoutes()

    expect(await screen.findByRole('heading', { name: 'Generation guidance' })).toBeInTheDocument()
    expect(screen.queryByText('Back to source')).not.toBeInTheDocument()
  })

  it('submits wizard values, writes setupAnswers to store, shows toast, and navigates to outline', async () => {
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
    expect(toastSuccessMock).toHaveBeenCalledWith('Saved to your draft')

    expect(await screen.findByText('Outline route reached')).toBeInTheDocument()
  })
})
