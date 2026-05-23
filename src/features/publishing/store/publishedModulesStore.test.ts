import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_ADMIN_USER } from '@/lib/education'

describe('usePublishedModulesStore', () => {
  let usePublishedModulesStore: (typeof import('./publishedModulesStore'))['usePublishedModulesStore']
  let HR_BASICS_PUBLISHED_MODULE: (typeof import('./publishedModulesStore'))['HR_BASICS_PUBLISHED_MODULE']

  beforeEach(async () => {
    vi.resetModules()
    ;({ usePublishedModulesStore, HR_BASICS_PUBLISHED_MODULE } = await import('./publishedModulesStore'))

    act(() => {
      usePublishedModulesStore.getState().resetPublishedModules()
    })
  })

  it('starts seeded with HR Basics as assignable', () => {
    expect(usePublishedModulesStore.getState().publishedModules).toEqual([HR_BASICS_PUBLISHED_MODULE])
    expect(usePublishedModulesStore.getState().isAssignable('module-version-hr-basics-v1')).toBe(true)
  })

  it('registerPublishedModule adds a published module record with stable id and timestamp', () => {
    let created = undefined as ReturnType<
      typeof usePublishedModulesStore.getState
    >['publishedModules'][number] | undefined

    act(() => {
      created = usePublishedModulesStore.getState().registerPublishedModule({
        module_version_id: 'module-version-custom-v1',
        title: 'Custom Safety Basics',
        published_by: MOCK_ADMIN_USER.id,
      })
    })

    expect(created).toEqual(
      expect.objectContaining({
        id: 'module-version-custom-v1',
        module_version_id: 'module-version-custom-v1',
        title: 'Custom Safety Basics',
        published_by: MOCK_ADMIN_USER.id,
      }),
    )
    expect(Number.isNaN(Date.parse(created?.published_at ?? ''))).toBe(false)
    expect(usePublishedModulesStore.getState().isAssignable('module-version-custom-v1')).toBe(true)
  })

  it('registerPublishedModule updates an existing module instead of duplicating it', () => {
    act(() => {
      usePublishedModulesStore.getState().registerPublishedModule({
        module_version_id: 'module-version-hr-basics-v1',
        title: 'HR Basics at Redex — updated',
        published_by: MOCK_ADMIN_USER.id,
      })
    })

    const matchingRecords = usePublishedModulesStore
      .getState()
      .publishedModules.filter((module) => module.module_version_id === 'module-version-hr-basics-v1')

    expect(matchingRecords).toHaveLength(1)
    expect(matchingRecords[0]?.title).toBe('HR Basics at Redex — updated')
  })

  it('archivePublishedModule removes an assignable module', () => {
    act(() => {
      usePublishedModulesStore.getState().archivePublishedModule('module-version-hr-basics-v1')
    })

    expect(usePublishedModulesStore.getState().isAssignable('module-version-hr-basics-v1')).toBe(false)
    expect(usePublishedModulesStore.getState().publishedModules).toEqual([])
  })

  it('getAllPublished returns defensive copies', () => {
    const published = usePublishedModulesStore.getState().getAllPublished()
    published[0]!.title = 'Mutated locally'

    expect(usePublishedModulesStore.getState().publishedModules[0]?.title).toBe('HR Basics at Redex')
  })

  it('resetPublishedModules restores seed records', () => {
    act(() => {
      usePublishedModulesStore.getState().archivePublishedModule('module-version-hr-basics-v1')
      usePublishedModulesStore.getState().resetPublishedModules()
    })

    expect(usePublishedModulesStore.getState().publishedModules).toEqual([HR_BASICS_PUBLISHED_MODULE])
  })

  it('persists records across module reloads', async () => {
    act(() => {
      usePublishedModulesStore.getState().registerPublishedModule({
        module_version_id: 'module-version-persisted-v1',
        title: 'Persisted Module',
        published_by: MOCK_ADMIN_USER.id,
      })
    })

    vi.resetModules()
    ;({ usePublishedModulesStore } = await import('./publishedModulesStore'))

    expect(usePublishedModulesStore.getState().isAssignable('module-version-persisted-v1')).toBe(true)
    expect(usePublishedModulesStore.getState().getAllPublished()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          module_version_id: 'module-version-persisted-v1',
          title: 'Persisted Module',
        }),
      ]),
    )
  })
})
