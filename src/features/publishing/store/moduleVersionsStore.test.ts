import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_ADMIN_USER } from '@/lib/education'

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

describe('useModuleVersionsStore', () => {
  let useModuleVersionsStore: (typeof import('./moduleVersionsStore'))['useModuleVersionsStore']
  let usePublishedModulesStore: (typeof import('./publishedModulesStore'))['usePublishedModulesStore']
  let HR_BASICS_MODULE_VERSION_V1: (typeof import('./moduleVersionsStore'))['HR_BASICS_MODULE_VERSION_V1']

  beforeEach(async () => {
    vi.resetModules()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ usePublishedModulesStore } = await import('./publishedModulesStore'))
    ;({ useModuleVersionsStore, HR_BASICS_MODULE_VERSION_V1 } = await import('./moduleVersionsStore'))

    act(() => {
      usePublishedModulesStore.getState().resetPublishedModules()
      useModuleVersionsStore.getState().resetVersions()
    })
  })

  it('starts seeded with HR Basics v1 as a published version', () => {
    expect(useModuleVersionsStore.getState().versions).toEqual([HR_BASICS_MODULE_VERSION_V1])
    expect(useModuleVersionsStore.getState().getLatestPublishedVersion('hr-basics-mod-001')).toEqual(
      HR_BASICS_MODULE_VERSION_V1,
    )
  })

  it('registerVersion creates a stable published version record and does not duplicate on republish', () => {
    let created = undefined as ReturnType<typeof useModuleVersionsStore.getState>['versions'][number] | undefined

    act(() => {
      created = useModuleVersionsStore.getState().registerVersion({
        module_id: 'safety-mod-001',
        module_title: 'Safety Basics',
        version_number: 1,
        approved_by: MOCK_ADMIN_USER.id,
        source_binder_version: 'sbv-safety-1',
        assessment_version: 'av-safety-1',
      })
      useModuleVersionsStore.getState().registerVersion({
        module_id: 'safety-mod-001',
        module_title: 'Safety Basics',
        version_number: 1,
        approved_by: MOCK_ADMIN_USER.id,
      })
    })

    expect(created).toEqual(
      expect.objectContaining({
        id: 'module-version-safety-v1',
        module_id: 'safety-mod-001',
        module_title: 'Safety Basics',
        version_number: 1,
        status: 'published',
        approved_by: MOCK_ADMIN_USER.id,
        source_binder_version: 'sbv-safety-1',
        assessment_version: 'av-safety-1',
      }),
    )
    expect(Number.isNaN(Date.parse(created?.created_at ?? ''))).toBe(false)
    expect(Number.isNaN(Date.parse(created?.published_at ?? ''))).toBe(false)
    expect(useModuleVersionsStore.getState().getVersionHistory('safety-mod-001')).toHaveLength(1)
  })

  it('getVersionHistory returns newest versions first and getLatestPublishedVersion ignores drafts', () => {
    act(() => {
      useModuleVersionsStore.getState().forkNewDraftVersion('module-version-hr-basics-v1')
      useModuleVersionsStore.getState().registerVersion({
        module_id: 'hr-basics-mod-001',
        module_title: 'HR Basics at Redex',
        version_number: 2,
        status: 'published',
        approved_by: MOCK_ADMIN_USER.id,
      })
    })

    expect(useModuleVersionsStore.getState().getVersionHistory('hr-basics-mod-001').map((version) => version.id)).toEqual([
      'module-version-hr-basics-v2',
      'module-version-hr-basics-v1',
    ])
    expect(useModuleVersionsStore.getState().getLatestPublishedVersion('hr-basics-mod-001')?.id).toBe(
      'module-version-hr-basics-v2',
    )
  })

  it('forkNewDraftVersion clones immutable references into a draft incremented version', () => {
    let forked = undefined as ReturnType<typeof useModuleVersionsStore.getState>['versions'][number] | undefined

    act(() => {
      forked = useModuleVersionsStore.getState().forkNewDraftVersion('module-version-hr-basics-v1')
    })

    expect(forked).toEqual(
      expect.objectContaining({
        id: 'module-version-hr-basics-v2',
        module_id: 'hr-basics-mod-001',
        module_title: 'HR Basics at Redex',
        version_number: 2,
        status: 'draft',
        source_binder_version: 'sbv-1',
        assessment_version: 'av-1',
      }),
    )
    expect(forked?.published_at).toBeUndefined()
    expect(useModuleVersionsStore.getState().versions.find((version) => version.id === 'module-version-hr-basics-v1')).toEqual(
      HR_BASICS_MODULE_VERSION_V1,
    )
  })

  it('forkNewDraftVersion uses the next available version number instead of overwriting a published next version', () => {
    act(() => {
      useModuleVersionsStore.getState().registerVersion({
        module_id: 'hr-basics-mod-001',
        module_title: 'HR Basics at Redex',
        version_number: 2,
        status: 'published',
        approved_by: MOCK_ADMIN_USER.id,
      })
      useModuleVersionsStore.getState().forkNewDraftVersion('module-version-hr-basics-v1')
    })

    expect(useModuleVersionsStore.getState().versions.find((version) => version.id === 'module-version-hr-basics-v2')).toEqual(
      expect.objectContaining({ status: 'published', version_number: 2 }),
    )
    expect(useModuleVersionsStore.getState().versions.find((version) => version.id === 'module-version-hr-basics-v3')).toEqual(
      expect.objectContaining({ status: 'draft', version_number: 3 }),
    )
  })

  it('markVersionStale toggles advisory stale metadata without changing publish status', () => {
    act(() => {
      useModuleVersionsStore.getState().markVersionStale('module-version-hr-basics-v1', true)
    })

    const staleVersion = useModuleVersionsStore.getState().versions[0]
    expect(staleVersion).toEqual(expect.objectContaining({ status: 'published', source_stale: true }))
    expect(Number.isNaN(Date.parse(staleVersion?.stale_since ?? ''))).toBe(false)

    act(() => {
      useModuleVersionsStore.getState().markVersionStale('module-version-hr-basics-v1', false)
    })

    expect(useModuleVersionsStore.getState().versions[0]).toEqual(HR_BASICS_MODULE_VERSION_V1)
  })

  it('archiveVersion marks a version archived, removes assignability, and resetVersions restores the seed', () => {
    act(() => {
      useModuleVersionsStore.getState().archiveVersion('module-version-hr-basics-v1')
    })

    expect(useModuleVersionsStore.getState().versions[0]?.status).toBe('archived')
    expect(usePublishedModulesStore.getState().isAssignable('module-version-hr-basics-v1')).toBe(false)

    act(() => {
      useModuleVersionsStore.getState().resetVersions()
    })

    expect(useModuleVersionsStore.getState().versions).toEqual([HR_BASICS_MODULE_VERSION_V1])
  })

  it('persists version history across module reloads', async () => {
    act(() => {
      useModuleVersionsStore.getState().forkNewDraftVersion('module-version-hr-basics-v1')
    })

    vi.resetModules()
    ;({ useModuleVersionsStore } = await import('./moduleVersionsStore'))

    expect(useModuleVersionsStore.getState().getVersionHistory('hr-basics-mod-001').map((version) => version.id)).toEqual([
      'module-version-hr-basics-v2',
      'module-version-hr-basics-v1',
    ])
  })
})
