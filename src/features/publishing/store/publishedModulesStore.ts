import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { ISODateTime, UUID } from '@/lib/education'

export interface PublishedModuleRecord {
  id: UUID
  module_version_id: UUID
  title: string
  published_at: ISODateTime
  published_by: UUID
}

interface RegisterPublishedModuleInput {
  module_version_id: UUID
  title: string
  published_by: UUID
}

interface PublishedModulesState {
  publishedModules: PublishedModuleRecord[]
  registerPublishedModule: (input: RegisterPublishedModuleInput) => PublishedModuleRecord
  archivePublishedModule: (moduleVersionId: string) => void
  isAssignable: (moduleVersionId: string) => boolean
  getAllPublished: () => PublishedModuleRecord[]
  resetPublishedModules: () => void
}

export const HR_BASICS_PUBLISHED_MODULE: PublishedModuleRecord = {
  id: 'module-version-hr-basics-v1',
  module_version_id: 'module-version-hr-basics-v1',
  title: 'HR Basics at Redex',
  published_at: '2026-05-23T00:00:00.000Z',
  published_by: 'system',
}

function cloneSeedPublishedModules(): PublishedModuleRecord[] {
  return [{ ...HR_BASICS_PUBLISHED_MODULE }]
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

function getPublishedModulesStorage(): Storage {
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

export const usePublishedModulesStore = create<PublishedModulesState>()(
  persist(
    (set, get) => ({
      publishedModules: cloneSeedPublishedModules(),
      registerPublishedModule: (input) => {
        const record: PublishedModuleRecord = {
          id: input.module_version_id,
          module_version_id: input.module_version_id,
          title: input.title,
          published_at: new Date().toISOString(),
          published_by: input.published_by,
        }

        set((state) => ({
          publishedModules: [
            ...state.publishedModules.filter(
              (module) => module.module_version_id !== input.module_version_id,
            ),
            record,
          ],
        }))

        return record
      },
      archivePublishedModule: (moduleVersionId) =>
        set((state) => ({
          publishedModules: state.publishedModules.filter(
            (module) => module.module_version_id !== moduleVersionId,
          ),
        })),
      isAssignable: (moduleVersionId) =>
        get().publishedModules.some((module) => module.module_version_id === moduleVersionId),
      getAllPublished: () => get().publishedModules.map((module) => ({ ...module })),
      resetPublishedModules: () => set({ publishedModules: cloneSeedPublishedModules() }),
    }),
    {
      name: 'redex-published-modules-v1',
      storage: createJSONStorage(() => getPublishedModulesStorage()),
    },
  ),
)
