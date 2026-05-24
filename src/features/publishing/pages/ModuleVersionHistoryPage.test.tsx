import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
          <Route path="/admin/foundry/start" element={<div>Foundry Start</div>} />
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
    expect(screen.getByText('Unknown user')).toBeInTheDocument()
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

  it('shows create new version for non-archived versions', () => {
    renderPage()

    expect(screen.getByRole('button', { name: 'Create new version' })).toBeInTheDocument()
  })

  it('shows archive confirmation on click and hides it on cancel', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Archive version' }))

    expect(screen.getByText('Archive this version?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByText('Archive this version?')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Archive version' })).toBeInTheDocument()
  })

  it('confirms archive through the hook and keeps the version visible with an Archived badge', async () => {
    const user = userEvent.setup()
    const originalArchiveVersion = useModuleVersionsStore.getState().archiveVersion
    const archiveVersionSpy = vi.fn(originalArchiveVersion)

    act(() => {
      useModuleVersionsStore.setState({ archiveVersion: archiveVersionSpy })
    })

    renderPage()

    await user.click(screen.getByRole('button', { name: 'Archive version' }))
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(archiveVersionSpy).toHaveBeenCalledWith('module-version-hr-basics-v1')
    expect(screen.getByRole('heading', { name: 'v1' })).toBeInTheDocument()
    expect(screen.getByText('Archived')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Archive version' })).not.toBeInTheDocument()
  })

  it('forks the selected version and navigates to foundry start', async () => {
    const user = userEvent.setup()
    const originalForkVersion = useModuleVersionsStore.getState().forkNewDraftVersion
    const forkVersionSpy = vi.fn(originalForkVersion)
    const { useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore')
    const resetSpy = vi.spyOn(useFoundryDraftStore.getState(), 'resetFoundryDraft')
    const seedSpy = vi.spyOn(useFoundryDraftStore.getState(), 'seedDraftFromModuleVersion')

    act(() => {
      useModuleVersionsStore.setState({ forkNewDraftVersion: forkVersionSpy })
    })

    renderPage()

    await user.click(screen.getByRole('button', { name: 'Create new version' }))

    expect(forkVersionSpy).toHaveBeenCalledWith('module-version-hr-basics-v1')
    expect(resetSpy).toHaveBeenCalled()
    expect(seedSpy).toHaveBeenCalled()
    expect(await screen.findByText('Foundry Start')).toBeInTheDocument()
  })

  it('hides create new version for already archived versions', () => {
    act(() => {
      useModuleVersionsStore.getState().archiveVersion('module-version-hr-basics-v1')
    })

    renderPage()

    expect(screen.getByText('Archived')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create new version' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Archive version' })).not.toBeInTheDocument()
  })
})

describe('ModuleVersionHistoryPage supabase states', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_DATA_SOURCE', 'supabase')

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })
  })

  afterEach(() => {
    vi.doUnmock('@/lib/education/moduleVersions')
    vi.unstubAllEnvs()
  })

  it('shows an error alert without also rendering the empty history state', async () => {
    vi.doMock('@/lib/education/moduleVersions', () => ({
      getModuleVersionHistory: vi.fn().mockRejectedValue(new Error('network down')),
      archiveModuleVersion: vi.fn(),
      forkModuleVersion: vi.fn(),
    }))

    const { ModuleVersionHistoryPage } = await import('./ModuleVersionHistoryPage')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    render(
      <MemoryRouter initialEntries={['/admin/modules/hr-basics-mod-001/versions']}>
        <Routes>
          <Route path="/admin/modules/:moduleId/versions" element={<ModuleVersionHistoryPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    expect(screen.getByText('Unable to update version history')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'No versions yet' })).not.toBeInTheDocument()
    warnSpy.mockRestore()
  })
})

describe('ModuleVersionHistoryPage profile name resolution', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.doUnmock('@/features/publishing/hooks/useModuleVersionHistory')
  })

  it('uses resolved profile names first and falls back to Unknown user instead of raw UUIDs', async () => {
    vi.doMock('@/features/publishing/hooks/useModuleVersionHistory', () => ({
      useModuleVersionHistory: () => ({
        versions: [
          {
            id: 'v2',
            module_id: 'm1',
            module_title: 'Module',
            version_number: 2,
            status: 'published',
            approved_by: 'known-profile-id',
            created_at: '2026-05-21T00:00:00.000Z',
          },
          {
            id: 'v1',
            module_id: 'm1',
            module_title: 'Module',
            version_number: 1,
            status: 'published',
            approved_by: 'unknown-profile-id',
            created_at: '2026-05-20T00:00:00.000Z',
          },
        ],
        loading: false,
        error: null,
        refetch: vi.fn(),
        archiveVersion: vi.fn(),
        forkVersion: vi.fn(),
        archivingVersionId: null,
        forkingVersionId: null,
        profileNameById: new Map([['known-profile-id', 'Known Person']]),
      }),
    }))

    const { ModuleVersionHistoryPage } = await import('./ModuleVersionHistoryPage')

    render(
      <MemoryRouter initialEntries={['/admin/modules/m1/versions']}>
        <Routes>
          <Route path="/admin/modules/:moduleId/versions" element={<ModuleVersionHistoryPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Known Person')).toBeInTheDocument()
    expect(screen.getByText('Unknown user')).toBeInTheDocument()
    expect(screen.queryByText('unknown-profile-id')).not.toBeInTheDocument()
  })
})

describe('ModuleVersionHistoryPage action disabled states', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.doUnmock('@/features/publishing/hooks/useModuleVersionHistory')
  })

  it('disables fork and archive controls while forking is in flight', async () => {
    vi.doMock('@/features/publishing/hooks/useModuleVersionHistory', () => ({
      useModuleVersionHistory: () => ({
        versions: [
          {
            id: 'v1',
            module_id: 'm1',
            module_title: 'Module',
            version_number: 1,
            status: 'published',
            created_at: '2026-05-20T00:00:00.000Z',
          },
        ],
        loading: false,
        error: null,
        refetch: vi.fn(),
        archiveVersion: vi.fn(),
        forkVersion: vi.fn(),
        archivingVersionId: null,
        forkingVersionId: 'v1',
        profileNameById: new Map(),
      }),
    }))

    const { ModuleVersionHistoryPage } = await import('./ModuleVersionHistoryPage')

    render(
      <MemoryRouter initialEntries={['/admin/modules/m1/versions']}>
        <Routes>
          <Route path="/admin/modules/:moduleId/versions" element={<ModuleVersionHistoryPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Create new version' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Archive version' })).toBeDisabled()
  })
})
