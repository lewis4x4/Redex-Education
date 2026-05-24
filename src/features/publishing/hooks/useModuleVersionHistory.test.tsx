import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useModuleVersionsStore } from '@/features/publishing/store/moduleVersionsStore'
import type { ModuleVersion } from '@/lib/education'
import { useModuleVersionHistory } from './useModuleVersionHistory'

const getModuleVersionHistoryMock = vi.hoisted(() => vi.fn<(moduleId: string) => Promise<ModuleVersion[]>>())
const archiveModuleVersionMock = vi.hoisted(() => vi.fn<(versionId: string) => Promise<ModuleVersion>>())

vi.mock('@/lib/education/moduleVersions', () => ({
  getModuleVersionHistory: getModuleVersionHistoryMock,
  archiveModuleVersion: archiveModuleVersionMock,
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
  created_at: '2026-05-20T00:00:00.000Z',
}

const REMOTE_V2: ModuleVersion = {
  ...REMOTE_V1,
  id: 'remote-v2',
  version_number: 2,
  status: 'draft',
  created_at: '2026-05-21T00:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()

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

  it('loads version history from the facade in supabase mode', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'supabase')
    getModuleVersionHistoryMock.mockResolvedValueOnce([REMOTE_V2, REMOTE_V1])

    const { result } = renderHook(() => useModuleVersionHistory('remote-module'))

    expect(result.current.versions).toEqual([])
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.versions).toEqual([REMOTE_V2, REMOTE_V1])
    expect(result.current.error).toBeNull()
    expect(getModuleVersionHistoryMock).toHaveBeenCalledWith('remote-module')
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
})
