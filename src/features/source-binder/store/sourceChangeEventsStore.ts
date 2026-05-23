import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { useAuditLogStore } from '@/features/audit/store/auditLogStore'
import type { SourceChangeEvent } from '@/lib/education'

type RecordSourceChangeEventInput = Omit<SourceChangeEvent, 'id' | 'detected_at' | 'status'> &
  Partial<Pick<SourceChangeEvent, 'id' | 'detected_at' | 'status'>>

interface SourceChangeEventsState {
  events: SourceChangeEvent[]
  recordChangeEvent: (input: RecordSourceChangeEventInput) => SourceChangeEvent
  markEventReviewed: (id: string) => void
  markEventResolved: (id: string) => void
  getUnreviewedEvents: () => SourceChangeEvent[]
  resetEvents: () => void
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

function getSourceChangeEventsStorage(): Storage {
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

function createEventId(input: RecordSourceChangeEventInput): string {
  return `source-change-${input.source_file_id}-${input.old_revision_id}-${input.new_revision_id}`
}

function cloneEvent(event: SourceChangeEvent): SourceChangeEvent {
  return {
    ...event,
    section_ids_changed: [...event.section_ids_changed],
  }
}

export const useSourceChangeEventsStore = create<SourceChangeEventsState>()(
  persist(
    (set, get) => ({
      events: [],
      recordChangeEvent: (input) => {
        const detectedAt = input.detected_at ?? new Date().toISOString()
        const id = input.id ?? createEventId(input)
        const existingEvent = get().events.find((existing) => existing.id === id)
        const event: SourceChangeEvent = {
          id,
          source_file_id: input.source_file_id,
          source_file_name: input.source_file_name,
          section_ids_changed: [...input.section_ids_changed],
          old_revision_id: input.old_revision_id,
          new_revision_id: input.new_revision_id,
          detected_at: existingEvent?.detected_at ?? detectedAt,
          status: input.status ?? existingEvent?.status ?? 'unreviewed',
        }

        set((state) => ({
          events: [...state.events.filter((existing) => existing.id !== event.id), event],
        }))

        if (!existingEvent) {
          useAuditLogStore.getState().recordEvent({
            event_type: 'source_change_detected',
            actor_user_id: 'system',
            actor_name: 'Drive sync',
            entity_type: 'source_file',
            entity_id: event.source_file_id,
            entity_label: event.source_file_name,
            metadata: { old_revision_id: event.old_revision_id, new_revision_id: event.new_revision_id },
          })
        }

        return cloneEvent(event)
      },
      markEventReviewed: (id) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id && event.status === 'unreviewed' ? { ...event, status: 'reviewed' } : event,
          ),
        }))
      },
      markEventResolved: (id) => {
        set((state) => ({
          events: state.events.map((event) => (event.id === id ? { ...event, status: 'resolved' } : event)),
        }))
      },
      getUnreviewedEvents: () => get().events.filter((event) => event.status === 'unreviewed').map(cloneEvent),
      resetEvents: () => set({ events: [] }),
    }),
    {
      name: 'redex-source-change-events-v1',
      storage: createJSONStorage(() => getSourceChangeEventsStorage()),
    },
  ),
)
