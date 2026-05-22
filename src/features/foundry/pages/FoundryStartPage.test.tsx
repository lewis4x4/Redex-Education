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

describe('FoundryStartPage', () => {
  let FoundryStartPage: (typeof import('./FoundryStartPage'))['FoundryStartPage']
  let useFoundryDraftStore: (typeof import('@/features/foundry/store/foundryDraftStore'))['useFoundryDraftStore']

  beforeEach(async () => {
    vi.resetModules()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))
    ;({ FoundryStartPage } = await import('./FoundryStartPage'))

    act(() => {
      useFoundryDraftStore.getState().clearDraft()
    })
  })

  function renderWithRoutes(initialPath = '/admin/foundry/start') {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/admin/foundry/start" element={<FoundryStartPage />} />
          <Route path="/admin/foundry/source" element={<div>Reached source route</div>} />
          <Route path="/admin" element={<div>Reached admin route</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('renders the foundry basics header and form', () => {
    renderWithRoutes()

    expect(screen.getByText('REDEX AI COURSE FOUNDRY')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'New module — basics' })).toBeInTheDocument()
    expect(
      screen.getByText('Give your module a name and audience. The Foundry will use these to tailor the next steps.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('form', { name: /module basics/i })).toBeInTheDocument()
  })

  it('submitting valid values navigates to source route and stores draft', async () => {
    const user = userEvent.setup()
    renderWithRoutes()

    await user.type(screen.getByRole('textbox', { name: /module title/i }), 'Safety Basics')
    await user.selectOptions(screen.getByRole('combobox', { name: /parent course/i }), 'course-orientation-001')
    await user.type(screen.getByRole('textbox', { name: /audience/i }), 'All employees')
    await user.click(screen.getByRole('radio', { name: /optional/i }))
    await user.selectOptions(screen.getByRole('combobox', { name: /training type/i }), 'safety')
    await user.clear(screen.getByRole('spinbutton', { name: /estimated duration target/i }))
    await user.type(screen.getByRole('spinbutton', { name: /estimated duration target/i }), '35')
    await user.click(screen.getByRole('button', { name: /continue → add source material/i }))

    expect(await screen.findByText('Reached source route')).toBeInTheDocument()
    expect(useFoundryDraftStore.getState().currentDraft).toEqual(
      expect.objectContaining({
        title: 'Safety Basics',
        parent_course_id: 'course-orientation-001',
        audience: 'All employees',
        criticality: 'optional',
        training_type: 'safety',
        estimated_minutes: 35,
      }),
    )
  })

  it('hydrates form from existing draft in store', () => {
    act(() => {
      useFoundryDraftStore.getState().setBasics({
        title: 'Existing draft title',
        parent_course_id: 'standalone',
        audience: 'New hires',
        criticality: 'optional',
        training_type: 'hr',
        estimated_minutes: 25,
      })
    })

    renderWithRoutes()

    expect(screen.getByRole('textbox', { name: /module title/i })).toHaveValue('Existing draft title')
    expect(screen.getByRole('radio', { name: /optional/i })).toBeChecked()
    expect(screen.getByRole('spinbutton', { name: /estimated duration target/i })).toHaveValue(25)
  })
})
