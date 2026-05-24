import { useCallback, useEffect, useMemo, useState } from 'react'

import { useModuleVersionsStore } from '@/features/publishing/store/moduleVersionsStore'
import { getDataSource } from '@/lib/education/dataSource'
import type { ModuleVersion } from '@/lib/education'

export interface UseModuleVersionHistoryResult {
  versions: ModuleVersion[]
  loading: boolean
  error: Error | null
  refetch: () => void
  archiveVersion: (versionId: string) => Promise<void>
  archivingVersionId: string | null
}

const noop = () => undefined

function sortNewestFirst(versions: ModuleVersion[]): ModuleVersion[] {
  return [...versions].sort((a, b) => {
    if (a.version_number !== b.version_number) {
      return b.version_number - a.version_number
    }

    return b.created_at.localeCompare(a.created_at)
  })
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause))
}

export function useModuleVersionHistory(moduleId: string): UseModuleVersionHistoryResult {
  const isSupabase = getDataSource() === 'supabase'
  const storeVersions = useModuleVersionsStore((state) => state.versions)
  const archiveStoreVersion = useModuleVersionsStore((state) => state.archiveVersion)
  const [remoteVersions, setRemoteVersions] = useState<ModuleVersion[]>([])
  const [loading, setLoading] = useState(isSupabase)
  const [error, setError] = useState<Error | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [archivingVersionId, setArchivingVersionId] = useState<string | null>(null)

  const mockVersions = useMemo(
    () => sortNewestFirst(storeVersions.filter((version) => version.module_id === moduleId)),
    [moduleId, storeVersions],
  )

  const refetch = useCallback(() => {
    if (!isSupabase) return
    setReloadKey((current) => current + 1)
  }, [isSupabase])

  useEffect(() => {
    if (!isSupabase) {
      return undefined
    }

    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) return
      setLoading(true)
      setError(null)
    })

    import('@/lib/education/moduleVersions')
      .then(({ getModuleVersionHistory }) => getModuleVersionHistory(moduleId))
      .then((next) => {
        if (cancelled) return
        setRemoteVersions(next)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        const wrapped = toError(cause)
        console.warn('[publishing] Unable to load module version history.', wrapped)
        setError(wrapped)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isSupabase, moduleId, reloadKey])

  const archiveVersion = useCallback(
    async (versionId: string) => {
      setArchivingVersionId(versionId)

      try {
        if (!isSupabase) {
          archiveStoreVersion(versionId)
          return
        }

        const { archiveModuleVersion, getModuleVersionHistory } = await import('@/lib/education/moduleVersions')
        await archiveModuleVersion(versionId)
        const next = await getModuleVersionHistory(moduleId)
        setRemoteVersions(next)
        setError(null)
      } catch (cause: unknown) {
        const wrapped = toError(cause)
        console.warn('[publishing] Unable to archive module version.', wrapped)
        setError(wrapped)
        throw wrapped
      } finally {
        setArchivingVersionId(null)
      }
    },
    [archiveStoreVersion, isSupabase, moduleId],
  )

  if (!isSupabase) {
    return {
      versions: mockVersions,
      loading: false,
      error: null,
      refetch: noop,
      archiveVersion,
      archivingVersionId,
    }
  }

  return {
    versions: remoteVersions,
    loading,
    error,
    refetch,
    archiveVersion,
    archivingVersionId,
  }
}
