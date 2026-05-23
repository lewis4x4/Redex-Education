import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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

describe('ModuleVersionHistoryPage', () => {
  let ModuleVersionHistoryPage: (typeof import('./ModuleVersionHistoryPage'))['ModuleVersionHistoryPage']
  let useModuleVersionsStore: (typeof import('@/features/publishing/store/moduleVersionsStore'))['useModuleVersionsStore']
  let useAssignmentStore: (typeof import('@/features/assignments/store/assignmentStore'))['useAssignmentStore']
  let useAssessmentAttemptStore: (typeof import('@/features/progress/store/assessmentAttemptStore'))['useAssessmentAttemptStore']

  beforeEach(async () => {
    vi.resetModules()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useModuleVersionsStore } = await import('@/features/publishing/store/moduleVersionsStore'))
    ;({ useAssignmentStore } = await import('@/features/assignments/store/assignmentStore'))
    ;({ useAssessmentAttemptStore } = await import('@/features/progress/store/assessmentAttemptStore'))
    ;({ ModuleVersionHistoryPage } = await import('./ModuleVersionHistoryPage'))

    act(() => {
      useModuleVersionsStore.getState().resetVersions()
      useAssignmentStore.getState().resetAssignments()
      useAssessmentAttemptStore.getState().resetAttempts()
    })
  })

  function renderPage(moduleId = 'hr-basics-mod-001') {
    return render(
      <MemoryRouter initialEntries={[`/admin/modules/${moduleId}/versions`]}>
        <Routes>
          <Route path="/admin/modules/:moduleId/versions" element={<ModuleVersionHistoryPage />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('renders one card per version newest first and shows seeded HR Basics v1 details', () => {
    act(() => {
      useModuleVersionsStore.getState().forkNewDraftVersion('module-version-hr-basics-v1')
    })

    renderPage()

    expect(screen.getByText('Version history')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'HR Basics at Redex' })).toBeInTheDocument()

    const versionRegion = screen.getByLabelText('Module versions')
    expect(within(versionRegion).getByRole('heading', { name: 'v2' })).toBeInTheDocument()
    expect(within(versionRegion).getByRole('heading', { name: 'v1' })).toBeInTheDocument()
    expect(screen.getAllByText('sbv-1')).toHaveLength(2)
    expect(screen.getAllByText('av-1')).toHaveLength(2)
    expect(screen.getByText('Jordan Patel')).toBeInTheDocument()
  })

  it('shows completed count and expands learner names', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByText('Completed by')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show learners' }))

    expect(await screen.findByText('Devon Lee')).toBeInTheDocument()
  })

  it('renders a stale source pill and source impact review link when a version is stale', () => {
    act(() => {
      useModuleVersionsStore.getState().markVersionStale('module-version-hr-basics-v1', true)
    })

    renderPage()

    expect(screen.getByText('Stale source')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review source impact →' })).toHaveAttribute('href', '/admin/source-impact')
  })

  it('renders a defensive empty state for modules without history', () => {
    renderPage('unknown-module')

    expect(screen.getByRole('heading', { name: 'No versions yet' })).toBeInTheDocument()
  })
})
