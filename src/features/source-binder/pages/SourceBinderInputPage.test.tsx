import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

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

describe('SourceBinderInputPage', () => {
  let SourceBinderInputPage: (typeof import('./SourceBinderInputPage'))['SourceBinderInputPage']
  let useFoundryDraftStore: (typeof import('@/features/foundry/store/foundryDraftStore'))['useFoundryDraftStore']

  beforeEach(async () => {
    vi.resetModules()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))
    ;({ SourceBinderInputPage } = await import('./SourceBinderInputPage'))

    act(() => {
      useFoundryDraftStore.getState().clearDraft()
      useFoundryDraftStore.getState().clearSourceMaterial()
      useFoundryDraftStore.getState().setBasics({
        title: 'Draft ready',
        parent_course_id: 'standalone',
        audience_archetype: 'operations',
        audience_refinement: '',
        completion_required: 'required',
        training_type: 'operational',
        learning_outcomes: [{ id: 'outcome-1', text: 'Execute daily operations with policy compliance.' }],
        estimated_minutes: 30,
      })
    })
  })

  function renderWithRoutes(initialPath = '/admin/foundry/source') {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/admin/foundry/source" element={<SourceBinderInputPage />} />
          <Route path="/admin/foundry/start" element={<div>Reached basics route</div>} />
          <Route path="/admin/foundry/questions" element={<div>Reached questions route</div>} />
          <Route path="/admin" element={<div>Reached admin route</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('renders page header and source binder child sections', () => {
    renderWithRoutes()

    expect(screen.getByText('REDEX AI COURSE FOUNDRY')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Source material' })).toBeInTheDocument()
    expect(screen.getByText(/paste markdown, upload an \.md file, or pick from the Source Library\./i)).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Foundry progress' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Paste source material' })).toBeInTheDocument()
    expect(screen.getByText('Upload a markdown file')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Preview' })).toBeInTheDocument()
  })

  it('updates preview when markdown is typed into paste panel', async () => {
    const user = userEvent.setup()
    renderWithRoutes()

    const markdownInput = screen.getByRole('textbox', { name: /markdown source/i })
    await user.type(markdownInput, '# Hello\nWorld')

    expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument()
    expect(screen.getByText('World')).toBeInTheDocument()
  })

  it('loads uploaded file text into paste panel and preview', async () => {
    const user = userEvent.setup()
    renderWithRoutes()

    const file = new File(['# Uploaded\nBody text'], 'upload.md', { type: 'text/markdown' })
    const fileInput = screen.getByLabelText(/upload a markdown file/i)

    await user.upload(fileInput, file)

    expect(screen.getByRole('textbox', { name: /markdown source/i })).toHaveValue('# Uploaded\nBody text')
    expect(screen.getByRole('heading', { name: 'Uploaded' })).toBeInTheDocument()
    expect(screen.getByText('Body text')).toBeInTheDocument()
  })

  it('renders enabled continue button to setup questions', () => {
    renderWithRoutes()

    const continueButton = screen.getByRole('button', { name: /continue → setup questions/i })

    expect(continueButton).toBeEnabled()
  })

  it('navigates to setup questions when continue is clicked', async () => {
    const user = userEvent.setup()
    renderWithRoutes()

    await user.click(screen.getByRole('button', { name: /continue → setup questions/i }))

    expect(await screen.findByText('Reached questions route')).toBeInTheDocument()
  })
})
