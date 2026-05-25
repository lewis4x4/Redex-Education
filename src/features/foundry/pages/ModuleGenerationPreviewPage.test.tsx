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
  let aiModule: typeof import('@/features/foundry/ai')

  beforeEach(async () => {
    vi.resetModules()
    toastSuccessMock.mockReset()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))
    aiModule = await import('@/features/foundry/ai')
    ;({ ModuleGenerationPreviewPage } = await import('./ModuleGenerationPreviewPage'))

    act(() => {
      useFoundryDraftStore.getState().clearGeneratedModule()
    })
  })

  function seedDraftContext() {
    act(() => {
      useFoundryDraftStore.getState().setBasics({
        title: 'Safety Training',
        parent_course_id: 'standalone',
        audience_archetype: 'new_hire',
        audience_refinement: '',
        completion_required: 'required',
        training_type: 'compliance',
        learning_outcomes: [{ id: 'outcome-1', text: 'Understand policy' }],
        estimated_minutes: 20,
      })
      useFoundryDraftStore.getState().setSourceMaterial({
        id: 'source-1',
        type: 'markdown',
        title: 'Policy source',
        raw_text: 'policy body',
        raw_text_preview: 'policy body',
        processing_status: 'processed',
        sections: [
          {
            id: 'section-1',
            heading: 'Policy',
            body: 'policy body',
            level: 2,
            position_index: 0,
            has_placeholders: false,
          },
        ],
      })
      useFoundryDraftStore.getState().setSetupAnswers({
        criticality: 'informational',
        assessment_style: 'light_quiz',
        audience_notes: 'New hires',
        experience_notes: 'Practical and concise',
        estimated_minutes: 20,
        source_control: 'strict',
        requires_admin_approval: true,
        requires_safety_review: false,
      })
      useFoundryDraftStore.getState().setOutline({
        course_title: 'Safety Training',
        description: 'Policy overview',
        learning_objectives: ['Understand policy'],
        modules: [
          {
            title: 'Module 1',
            lessons: [{ title: 'Lesson 1', lesson_type: 'text', estimated_minutes: 5 }],
          },
        ],
      })
      useFoundryDraftStore.getState().approveOutline()
      useFoundryDraftStore.getState().clearGeneratedModule()
    })
  }

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/admin/foundry/preview']}>
        <Routes>
          <Route path="/admin/foundry/preview" element={<ModuleGenerationPreviewPage />} />
          <Route path="/admin/foundry/start" element={<h1>Foundry start</h1>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  function renderPageWithRoutes() {
    return render(
      <MemoryRouter initialEntries={['/admin/foundry/preview']}>
        <Routes>
          <Route path="/admin/foundry/preview" element={<ModuleGenerationPreviewPage />} />
          <Route path="/admin/foundry/critique" element={<h1>Critique route reached</h1>} />
          <Route path="/admin/foundry/start" element={<h1>Foundry start</h1>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('redirects cold-load preview route back to start when no draft context exists', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/foundry/preview']}>
        <Routes>
          <Route path="/admin/foundry/preview" element={<ModuleGenerationPreviewPage />} />
          <Route path="/admin/foundry/start" element={<h1>Foundry start</h1>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Foundry start' })).toBeInTheDocument()
  })

  it('shows empty state when generatedModule is null', () => {
    seedDraftContext()
    renderPage()

    expect(screen.getByRole('button', { name: /Generate all lessons/i })).toBeInTheDocument()
    expect(screen.getByText('No generated module yet')).toBeInTheDocument()
    expect(screen.queryByText('Lessons')).not.toBeInTheDocument()
  })

  it('populates generated module and shows sidebar with 6 lesson rows after clicking Generate all lessons', async () => {
    seedDraftContext()
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Generate all lessons/i }))

    expect(await screen.findByText('Lessons')).toBeInTheDocument()
    expect(useFoundryDraftStore.getState().generatedModule).not.toBeNull()

    const lessonsPanel = screen.getByText('Lessons').closest('div')
    expect(lessonsPanel).not.toBeNull()
    expect(within(lessonsPanel as HTMLElement).getByRole('button', { name: /Welcome to Redex/i })).toBeInTheDocument()
    expect(within(lessonsPanel as HTMLElement).getByRole('button', { name: /Final Quiz/i })).toBeInTheDocument()

    const lessonButtons = within(lessonsPanel as HTMLElement).getAllByRole('button')
    expect(lessonButtons).toHaveLength(6)
  })

  it('selects clicked lesson and renders that lesson preview in right column', async () => {
    seedDraftContext()
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Generate all lessons/i }))
    await screen.findByText('Lessons')
    await user.click(screen.getByRole('button', { name: /Final Quiz/i }))

    expect(screen.getByRole('heading', { name: 'Final Quiz' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Generated quiz preview/i })).toBeInTheDocument()
  })

  it('shows error alert with retry when generation fails', async () => {
    seedDraftContext()
    const user = userEvent.setup()
    vi.spyOn(aiModule, 'getCourseFoundryAiClient').mockReturnValue({
      ...aiModule.mockAiClient,
      generateLessons: vi.fn().mockRejectedValue(new Error('pg_cron unavailable')),
    })
    renderPage()

    await user.click(screen.getByRole('button', { name: /Generate all lessons/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't generate the module.")
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('keeps Continue → Self-critique enabled and navigates to critique route on click', async () => {
    seedDraftContext()
    const user = userEvent.setup()
    renderPageWithRoutes()

    const continueButton = screen.getByRole('button', { name: /Continue → Self-critique/i })
    expect(continueButton).toBeEnabled()

    await user.click(continueButton)

    expect(screen.getByRole('heading', { name: 'Critique route reached' })).toBeInTheDocument()
  })
})
