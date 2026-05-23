import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_GENERATED_MODULE } from '@/features/foundry/data/mockGeneratedModule'
import { MOCK_LESSON_REVIEWS } from '@/features/foundry/data/mockLessonReviews'
import { MOCK_SELF_CRITIQUE } from '@/features/foundry/data/mockSelfCritique'

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

describe('PublishConfirmationPage', () => {
  let PublishConfirmationPage: (typeof import('./PublishConfirmationPage'))['PublishConfirmationPage']
  let useFoundryDraftStore: (typeof import('@/features/foundry/store/foundryDraftStore'))['useFoundryDraftStore']
  let usePublishedModulesStore: (typeof import('@/features/publishing/store/publishedModulesStore'))['usePublishedModulesStore']
  let useModuleVersionsStore: (typeof import('@/features/publishing/store/moduleVersionsStore'))['useModuleVersionsStore']

  beforeEach(async () => {
    vi.resetModules()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useModuleVersionsStore } = await import('@/features/publishing/store/moduleVersionsStore'))
    ;({ usePublishedModulesStore } = await import('@/features/publishing/store/publishedModulesStore'))
    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))
    ;({ PublishConfirmationPage } = await import('./PublishConfirmationPage'))

    act(() => {
      useModuleVersionsStore.getState().resetVersions()
      usePublishedModulesStore.getState().resetPublishedModules()
      useFoundryDraftStore.getState().resetFoundryDraft()
      useFoundryDraftStore.getState().setBasics({
        title: 'HR Basics at Redex',
        parent_course_id: 'standalone',
        audience: 'New hires',
        criticality: 'required',
        training_type: 'general_informational',
        estimated_minutes: 20,
      })
      useFoundryDraftStore.getState().setGeneratedModule(MOCK_GENERATED_MODULE)
      useFoundryDraftStore.getState().setCritique({
        ...MOCK_SELF_CRITIQUE,
        blocks_publish: false,
        issues: MOCK_SELF_CRITIQUE.issues.map((issue) => ({ ...issue, ignored: true })),
      })
      useFoundryDraftStore
        .getState()
        .setLessonReviews(MOCK_LESSON_REVIEWS.map((review) => ({ ...review, status: 'approved' as const })))
      useFoundryDraftStore.getState().setPublished()
    })
  })

  function LocationProbe() {
    const location = useLocation()

    return <p data-testid="location-path">{location.pathname}</p>
  }

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/admin/foundry/published']}>
        <Routes>
          <Route path="/admin/foundry/published" element={<PublishConfirmationPage />} />
          <Route path="/admin" element={<div>Admin dashboard route</div>} />
          <Route path="/admin/foundry/start" element={<div>Foundry start route</div>} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('renders module title, published timestamp, and both CTAs', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Module published' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'HR Basics at Redex' })).toBeInTheDocument()
    expect(screen.getByText('Published at')).toBeInTheDocument()
    expect(screen.getByText(/\d{4}/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Return to admin dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit & create new version' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start a new module' })).toBeInTheDocument()
  })

  it('returns to admin dashboard from the primary CTA', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Return to admin dashboard' }))

    expect(await screen.findByText('Admin dashboard route')).toBeInTheDocument()
  })

  it('forks a draft version and navigates when editing the published module', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Edit & create new version' }))

    expect(usePublishedModulesStore.getState().isAssignable('module-version-hr-basics-v1')).toBe(true)
    expect(useModuleVersionsStore.getState().versions.find((version) => version.id === 'module-version-hr-basics-v1')).toEqual(
      expect.objectContaining({ status: 'published', version_number: 1 }),
    )
    expect(useModuleVersionsStore.getState().versions.find((version) => version.id === 'module-version-hr-basics-v2')).toEqual(
      expect.objectContaining({ status: 'draft', version_number: 2 }),
    )
    expect(useFoundryDraftStore.getState().currentDraft).toEqual(
      expect.objectContaining({
        id: 'module-version-hr-basics-v2',
        module_id: 'hr-basics-mod-001',
        version_number: 2,
        title: 'HR Basics at Redex',
      }),
    )
    expect(await screen.findByText('Foundry start route')).toBeInTheDocument()
  })

  it('resets the foundry draft and navigates when starting a new module', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Start a new module' }))

    expect(useFoundryDraftStore.getState().currentDraft).toBeNull()
    expect(useFoundryDraftStore.getState().generatedModule).toBeNull()
    expect(useFoundryDraftStore.getState().publishStatus).toBe('draft')
    expect(useFoundryDraftStore.getState().publishedAt).toBeNull()
    expect(await screen.findByText('Foundry start route')).toBeInTheDocument()
  })
})
