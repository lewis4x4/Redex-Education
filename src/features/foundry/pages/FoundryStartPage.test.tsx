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

    expect(screen.getByText('REDEX AI COURSE FOUNDRY · STEP 1')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Module basics' })).toBeInTheDocument()
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
    await user.selectOptions(screen.getByRole('combobox', { name: /^audience/i }), 'all_employees')
    await user.type(screen.getByRole('textbox', { name: /audience refinement/i }), 'US team')
    await user.click(screen.getByRole('radio', { name: /optional/i }))
    await user.selectOptions(screen.getByRole('combobox', { name: /training type/i }), 'safety')
    await user.type(screen.getByPlaceholderText(/describe a concrete post-training capability/i), 'Use safe work practices in daily routines')
    await user.click(screen.getByRole('button', { name: /continue → add source material/i }))

    expect(await screen.findByText('Reached source route')).toBeInTheDocument()
    expect(useFoundryDraftStore.getState().currentDraft).toEqual(
      expect.objectContaining({
        title: 'Safety Basics',
        parent_course_id: 'course-orientation-001',
        audience_archetype: 'all_employees',
        audience_refinement: 'US team',
        completion_required: 'optional',
        training_type: 'safety',
      }),
    )
  })

  it('hydrates form from existing draft in store', () => {
    act(() => {
      useFoundryDraftStore.getState().setBasics({
        title: 'Existing draft title',
        parent_course_id: 'standalone',
        audience_archetype: 'new_hire',
        audience_refinement: '',
        completion_required: 'optional',
        training_type: 'hr',
        learning_outcomes: [{ id: 'outcome-1', text: 'Complete onboarding in the first week' }],
        estimated_minutes: 25,
      })
    })

    renderWithRoutes()

    expect(screen.getByRole('textbox', { name: /module title/i })).toHaveValue('Existing draft title')
    expect(screen.getByRole('radio', { name: /optional/i })).toBeChecked()
    expect(screen.getByDisplayValue('Complete onboarding in the first week')).toBeInTheDocument()
  })
})
