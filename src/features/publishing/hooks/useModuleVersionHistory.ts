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
  forkVersion: (versionId: string) => Promise<ModuleVersion>
  archivingVersionId: string | null
  forkingVersionId: string | null
  profileNameById: Map<string, string>
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

async function resolveProfileNameById(versions: ModuleVersion[]): Promise<Map<string, string>> {
  const ids = Array.from(
    new Set(
      versions
        .flatMap((version) => [version.approved_by, version.published_by])
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  )

  if (ids.length === 0) {
    return new Map()
  }

  const { fetchProfilesByIds } = await import('@/integrations/supabase/queries/profiles')
  const profileById = await fetchProfilesByIds(ids)

  return new Map(
    ids.map((id) => {
      const profile = profileById.get(id)
      const resolvedName = profile?.preferred_name ?? profile?.display_name ?? null
      return [id, resolvedName ?? id]
    }),
  )
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
  const [forkingVersionId, setForkingVersionId] = useState<string | null>(null)
  const [profileNameById, setProfileNameById] = useState<Map<string, string>>(new Map())

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

    void (async () => {
      try {
        const { getModuleVersionHistory } = await import('@/lib/education/moduleVersions')
        const nextVersions = await getModuleVersionHistory(moduleId)
        const nextProfileNameById = await resolveProfileNameById(nextVersions)

        if (cancelled) return
        setRemoteVersions(nextVersions)
        setProfileNameById(nextProfileNameById)
        setLoading(false)
      } catch (cause: unknown) {
        if (cancelled) return
        const wrapped = toError(cause)
        console.warn('[publishing] Unable to load module version history.', wrapped)
        setError(wrapped)
        setLoading(false)
      }
    })()

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
        setProfileNameById(await resolveProfileNameById(next))
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

  const forkVersion = useCallback(
    async (versionId: string) => {
      setForkingVersionId(versionId)

      try {
        if (!isSupabase) {
          const next = useModuleVersionsStore.getState().forkNewDraftVersion(versionId)
          return next
        }

        const { forkModuleVersion, getModuleVersionHistory } = await import('@/lib/education/moduleVersions')
        const forked = await forkModuleVersion(versionId)
        const next = await getModuleVersionHistory(moduleId)
        setRemoteVersions(next)
        setProfileNameById(await resolveProfileNameById(next))
        setError(null)
        return forked
      } catch (cause: unknown) {
        const wrapped = toError(cause)
        console.warn('[publishing] Unable to fork module version.', wrapped)
        setError(wrapped)
        throw wrapped
      } finally {
        setForkingVersionId(null)
      }
    },
    [isSupabase, moduleId],
  )

  if (!isSupabase) {
    return {
      versions: mockVersions,
      loading: false,
      error: null,
      refetch: noop,
      archiveVersion,
      forkVersion,
      archivingVersionId,
      forkingVersionId,
      profileNameById: new Map(),
    }
  }

  return {
    versions: remoteVersions,
    loading,
    error,
    refetch,
    archiveVersion,
    forkVersion,
    archivingVersionId,
    forkingVersionId,
    profileNameById,
  }
}
