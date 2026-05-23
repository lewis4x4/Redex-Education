import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { usePublishedModulesStore } from '@/features/publishing/store/publishedModulesStore'
import { MOCK_ADMIN_USER } from '@/lib/education'
import type { ISODateTime, ModuleVersion, UUID } from '@/lib/education'

export const HR_BASICS_MODULE_VERSION_V1: ModuleVersion = {
  id: 'module-version-hr-basics-v1',
  module_id: 'hr-basics-mod-001',
  module_title: 'HR Basics at Redex',
  version_number: 1,
  status: 'published',
  published_at: '2026-05-23T00:00:00.000Z',
  published_by: MOCK_ADMIN_USER.id,
  approved_by: MOCK_ADMIN_USER.id,
  source_binder_version: 'sbv-1',
  assessment_version: 'av-1',
  completed_count: 1,
  created_at: '2026-05-23T00:00:00.000Z',
}

export interface RegisterModuleVersionInput {
  module_id: UUID
  module_title: string
  version_number?: number
  status?: ModuleVersion['status']
  published_by?: UUID
  approved_by?: UUID
  source_binder_version?: UUID
  assessment_version?: UUID
  source_stale?: boolean
  stale_since?: ISODateTime
  completed_count?: number
  published_at?: ISODateTime
  created_at?: ISODateTime
}

interface ModuleVersionsState {
  versions: ModuleVersion[]
  registerVersion: (input: RegisterModuleVersionInput) => ModuleVersion
  getVersionHistory: (moduleId: string) => ModuleVersion[]
  getLatestPublishedVersion: (moduleId: string) => ModuleVersion | undefined
  forkNewDraftVersion: (fromVersionId: string) => ModuleVersion
  archiveVersion: (versionId: string) => void
  markVersionStale: (versionId: string, stale: boolean) => void
  resetVersions: () => void
}

function cloneVersion(version: ModuleVersion): ModuleVersion {
  return { ...version }
}

function cloneSeedVersions(): ModuleVersion[] {
  return [cloneVersion(HR_BASICS_MODULE_VERSION_V1)]
}

function createMemoryStorage(): Storage {
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

function getModuleVersionsStorage(): Storage {
  if (
    typeof localStorage !== 'undefined' &&
    typeof localStorage.getItem === 'function' &&
    typeof localStorage.setItem === 'function' &&
    typeof localStorage.removeItem === 'function'
  ) {
    return localStorage
  }

  return createMemoryStorage()
}

function moduleSlugFromModuleId(moduleId: string): string {
  return (
    moduleId
      .trim()
      .toLowerCase()
      .replace(/-mod-\d+$/u, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'module'
  )
}

function createModuleVersionId(moduleId: string, versionNumber: number): string {
  return `module-version-${moduleSlugFromModuleId(moduleId)}-v${versionNumber}`
}

function sortNewestFirst(versions: ModuleVersion[]): ModuleVersion[] {
  return [...versions].sort((a, b) => {
    if (a.version_number !== b.version_number) {
      return b.version_number - a.version_number
    }

    return b.created_at.localeCompare(a.created_at)
  })
}

function nextVersionNumber(versions: ModuleVersion[], moduleId: string): number {
  const versionNumbers = versions
    .filter((version) => version.module_id === moduleId)
    .map((version) => version.version_number)

  return versionNumbers.length > 0 ? Math.max(...versionNumbers) + 1 : 1
}

export const useModuleVersionsStore = create<ModuleVersionsState>()(
  persist(
    (set, get) => ({
      versions: cloneSeedVersions(),
      registerVersion: (input) => {
        const now = new Date().toISOString()
        const versionNumber = input.version_number ?? nextVersionNumber(get().versions, input.module_id)
        const id = createModuleVersionId(input.module_id, versionNumber)
        const existing = get().versions.find(
          (version) => version.id === id || (version.module_id === input.module_id && version.version_number === versionNumber),
        )
        const status = input.status ?? 'published'
        const publishedAt =
          status === 'published' ? input.published_at ?? existing?.published_at ?? now : input.published_at
        const approvedBy = input.approved_by ?? input.published_by ?? existing?.approved_by
        const publishedBy = input.published_by ?? input.approved_by ?? existing?.published_by
        const completedCount = input.completed_count ?? existing?.completed_count

        const record: ModuleVersion = {
          ...existing,
          id,
          module_id: input.module_id,
          module_title: input.module_title,
          version_number: versionNumber,
          status,
          ...(publishedAt ? { published_at: publishedAt } : {}),
          ...(publishedBy ? { published_by: publishedBy } : {}),
          ...(approvedBy ? { approved_by: approvedBy } : {}),
          ...(input.source_binder_version ?? existing?.source_binder_version
            ? { source_binder_version: input.source_binder_version ?? existing?.source_binder_version }
            : {}),
          ...(input.assessment_version ?? existing?.assessment_version
            ? { assessment_version: input.assessment_version ?? existing?.assessment_version }
            : {}),
          ...(input.source_stale ?? existing?.source_stale ? { source_stale: input.source_stale ?? existing?.source_stale } : {}),
          ...(input.stale_since ?? existing?.stale_since ? { stale_since: input.stale_since ?? existing?.stale_since } : {}),
          ...(completedCount !== undefined ? { completed_count: completedCount } : {}),
          created_at: existing?.created_at ?? input.created_at ?? now,
        }

        set((state) => ({
          versions: [
            ...state.versions.filter(
              (version) => !(version.id === record.id || (version.module_id === record.module_id && version.version_number === record.version_number)),
            ),
            record,
          ],
        }))

        return cloneVersion(record)
      },
      getVersionHistory: (moduleId) =>
        sortNewestFirst(get().versions.filter((version) => version.module_id === moduleId)).map(cloneVersion),
      getLatestPublishedVersion: (moduleId) =>
        sortNewestFirst(
          get().versions.filter((version) => version.module_id === moduleId && version.status === 'published'),
        ).map(cloneVersion)[0],
      forkNewDraftVersion: (fromVersionId) => {
        const source = get().versions.find((version) => version.id === fromVersionId)

        if (!source) {
          throw new Error(`Cannot fork unknown module version: ${fromVersionId}`)
        }

        const versionNumber = nextVersionNumber(get().versions, source.module_id)
        const id = createModuleVersionId(source.module_id, versionNumber)
        const existingDraft = get().versions.find(
          (version) => version.id === id && version.status === 'draft',
        )

        if (existingDraft) {
          return cloneVersion(existingDraft)
        }

        const draft: ModuleVersion = {
          id,
          module_id: source.module_id,
          module_title: source.module_title,
          version_number: versionNumber,
          status: 'draft',
          source_binder_version: source.source_binder_version,
          assessment_version: source.assessment_version,
          completed_count: 0,
          created_at: new Date().toISOString(),
        }

        set((state) => ({
          versions: [...state.versions.filter((version) => version.id !== id), draft],
        }))

        return cloneVersion(draft)
      },
      archiveVersion: (versionId) => {
        usePublishedModulesStore.getState().archivePublishedModule(versionId)
        set((state) => ({
          versions: state.versions.map((version) =>
            version.id === versionId ? { ...version, status: 'archived' } : version,
          ),
        }))
      },
      markVersionStale: (versionId, stale) => {
        set((state) => ({
          versions: state.versions.map((version) => {
            if (version.id !== versionId) {
              return version
            }

            if (!stale) {
              const freshVersion = { ...version }
              delete freshVersion.source_stale
              delete freshVersion.stale_since
              return freshVersion
            }

            return {
              ...version,
              source_stale: true,
              stale_since: version.stale_since ?? new Date().toISOString(),
            }
          }),
        }))
      },
      resetVersions: () => set({ versions: cloneSeedVersions() }),
    }),
    {
      name: 'redex-module-versions-v1',
      storage: createJSONStorage(() => getModuleVersionsStorage()),
    },
  ),
)
