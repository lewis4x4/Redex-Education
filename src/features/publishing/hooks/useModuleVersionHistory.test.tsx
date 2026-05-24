import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useModuleVersionsStore } from '@/features/publishing/store/moduleVersionsStore'
import type { ModuleVersion } from '@/lib/education'
import { useModuleVersionHistory } from './useModuleVersionHistory'

const getModuleVersionHistoryMock = vi.hoisted(() => vi.fn<(moduleId: string) => Promise<ModuleVersion[]>>())
const archiveModuleVersionMock = vi.hoisted(() => vi.fn<(versionId: string) => Promise<ModuleVersion>>())
const forkModuleVersionMock = vi.hoisted(() => vi.fn<(versionId: string) => Promise<ModuleVersion>>())
const fetchProfilesByIdsMock = vi.hoisted(
  () => vi.fn<(ids: string[]) => Promise<Map<string, { display_name: string | null; preferred_name: string | null }>>>(),
)

vi.mock('@/lib/education/moduleVersions', () => ({
  getModuleVersionHistory: getModuleVersionHistoryMock,
  archiveModuleVersion: archiveModuleVersionMock,
  forkModuleVersion: forkModuleVersionMock,
}))

vi.mock('@/integrations/supabase/queries/profiles', () => ({
  fetchProfilesByIds: fetchProfilesByIdsMock,
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

const REMOTE_V1: ModuleVersion = {
  id: 'remote-v1',
  module_id: 'remote-module',
  module_title: 'Remote Module',
  version_number: 1,
  status: 'published',
  approved_by: 'approver-1',
  created_at: '2026-05-20T00:00:00.000Z',
}

const REMOTE_V2: ModuleVersion = {
  ...REMOTE_V1,
  id: 'remote-v2',
  published_by: 'publisher-1',
  version_number: 2,
  status: 'draft',
  created_at: '2026-05-21T00:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchProfilesByIdsMock.mockResolvedValue(new Map())

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: createStorageMock(),
  })

  act(() => {
    useModuleVersionsStore.getState().resetVersions()
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('useModuleVersionHistory', () => {
  it('returns store-backed versions synchronously in mock mode', () => {
    vi.stubEnv('VITE_DATA_SOURCE', '')
    act(() => {
      useModuleVersionsStore.getState().forkNewDraftVersion('module-version-hr-basics-v1')
    })

    const { result } = renderHook(() => useModuleVersionHistory('hr-basics-mod-001'))

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.versions.map((version) => version.version_number)).toEqual([2, 1])
    expect(result.current.profileNameById.size).toBe(0)
    expect(fetchProfilesByIdsMock).not.toHaveBeenCalled()
    expect(getModuleVersionHistoryMock).not.toHaveBeenCalled()
  })

  it('keeps refetch as a no-op in mock mode', () => {
    vi.stubEnv('VITE_DATA_SOURCE', '')
    const { result } = renderHook(() => useModuleVersionHistory('hr-basics-mod-001'))

    act(() => {
      result.current.refetch()
    })

    expect(result.current.loading).toBe(false)
    expect(getModuleVersionHistoryMock).not.toHaveBeenCalled()
  })

  it('archives through the module versions store in mock mode', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', '')
    const { result } = renderHook(() => useModuleVersionHistory('hr-basics-mod-001'))

    await act(async () => {
      await result.current.archiveVersion('module-version-hr-basics-v1')
    })

    expect(result.current.archivingVersionId).toBeNull()
    expect(result.current.versions[0]?.status).toBe('archived')
    expect(archiveModuleVersionMock).not.toHaveBeenCalled()
  })

  it('forks through the module versions store in mock mode', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', '')
    const { result } = renderHook(() => useModuleVersionHistory('hr-basics-mod-001'))

    let forked!: ModuleVersion
    await act(async () => {
      forked = await result.current.forkVersion('module-version-hr-basics-v1')
    })

    expect(result.current.forkingVersionId).toBeNull()
    expect(forked.status).toBe('draft')
    expect(result.current.versions.map((version) => version.version_number)).toEqual([2, 1])
    expect(forkModuleVersionMock).not.toHaveBeenCalled()
  })

  it('loads version history from the facade in supabase mode and resolves profile names', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'supabase')
    getModuleVersionHistoryMock.mockResolvedValueOnce([REMOTE_V2, REMOTE_V1])
    fetchProfilesByIdsMock.mockResolvedValueOnce(
      new Map([
        ['approver-1', { display_name: 'Approver Display', preferred_name: null }],
        ['publisher-1', { display_name: 'Publisher Display', preferred_name: 'Publisher Preferred' }],
      ]),
    )

    const { result } = renderHook(() => useModuleVersionHistory('remote-module'))

    expect(result.current.versions).toEqual([])
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.versions).toEqual([REMOTE_V2, REMOTE_V1])
    expect(result.current.error).toBeNull()
    expect(getModuleVersionHistoryMock).toHaveBeenCalledWith('remote-module')
    expect(fetchProfilesByIdsMock).toHaveBeenCalledWith(expect.arrayContaining(['approver-1', 'publisher-1']))
    expect(result.current.profileNameById.get('approver-1')).toBe('Approver Display')
    expect(result.current.profileNameById.get('publisher-1')).toBe('Publisher Preferred')
  })

  it('captures supabase fetch errors', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'supabase')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    getModuleVersionHistoryMock.mockRejectedValueOnce(new Error('history failed'))

    const { result } = renderHook(() => useModuleVersionHistory('remote-module'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error?.message).toBe('history failed')
    expect(result.current.versions).toEqual([])
    warnSpy.mockRestore()
  })

  it('archives through the facade in supabase mode and refreshes history', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'supabase')
    const archivedV2: ModuleVersion = { ...REMOTE_V2, status: 'archived' }
    getModuleVersionHistoryMock.mockResolvedValueOnce([REMOTE_V2, REMOTE_V1]).mockResolvedValueOnce([archivedV2, REMOTE_V1])
    archiveModuleVersionMock.mockResolvedValueOnce(archivedV2)

    const { result } = renderHook(() => useModuleVersionHistory('remote-module'))

    await waitFor(() => {
      expect(result.current.versions).toEqual([REMOTE_V2, REMOTE_V1])
    })

    await act(async () => {
      await result.current.archiveVersion('remote-v2')
    })

    expect(archiveModuleVersionMock).toHaveBeenCalledWith('remote-v2')
    expect(getModuleVersionHistoryMock).toHaveBeenCalledTimes(2)
    expect(result.current.versions[0]).toEqual(archivedV2)
    expect(result.current.archivingVersionId).toBeNull()
  })

  it('forks through the facade in supabase mode and refreshes history', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'supabase')
    const forkedV3: ModuleVersion = { ...REMOTE_V2, id: 'remote-v3', version_number: 3, status: 'draft' }
    getModuleVersionHistoryMock.mockResolvedValueOnce([REMOTE_V2, REMOTE_V1]).mockResolvedValueOnce([forkedV3, REMOTE_V2, REMOTE_V1])
    forkModuleVersionMock.mockResolvedValueOnce(forkedV3)

    const { result } = renderHook(() => useModuleVersionHistory('remote-module'))

    await waitFor(() => {
      expect(result.current.versions).toEqual([REMOTE_V2, REMOTE_V1])
    })

    let forked: ModuleVersion | null = null
    await act(async () => {
      forked = await result.current.forkVersion('remote-v2')
    })

    expect(forkModuleVersionMock).toHaveBeenCalledWith('remote-v2')
    expect(getModuleVersionHistoryMock).toHaveBeenCalledTimes(2)
    expect(forked).toEqual(forkedV3)
    expect(result.current.versions[0]).toEqual(forkedV3)
    expect(result.current.forkingVersionId).toBeNull()
  })
})
