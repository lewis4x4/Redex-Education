import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('useSourceChangeEventsStore', () => {
  let useSourceChangeEventsStore: (typeof import('./sourceChangeEventsStore'))['useSourceChangeEventsStore']
  let useAuditLogStore: (typeof import('@/features/audit/store/auditLogStore'))['useAuditLogStore']

  beforeEach(async () => {
    vi.resetModules()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useAuditLogStore } = await import('@/features/audit/store/auditLogStore'))
    ;({ useSourceChangeEventsStore } = await import('./sourceChangeEventsStore'))

    act(() => {
      useAuditLogStore.getState().resetEvents()
      useSourceChangeEventsStore.getState().resetEvents()
    })
  })

  it('records, reviews, resolves, and resets change events', () => {
    let eventId = ''

    act(() => {
      eventId = useSourceChangeEventsStore.getState().recordChangeEvent({
        source_file_id: 'file-1',
        source_file_name: 'policy.md',
        section_ids_changed: ['section-a'],
        old_revision_id: 'old-rev',
        new_revision_id: 'new-rev',
        detected_at: '2026-05-23T00:00:00.000Z',
      }).id
    })

    expect(useSourceChangeEventsStore.getState().getUnreviewedEvents()).toHaveLength(1)

    act(() => {
      useSourceChangeEventsStore.getState().markEventReviewed(eventId)
    })
    expect(useSourceChangeEventsStore.getState().events[0]?.status).toBe('reviewed')

    act(() => {
      useSourceChangeEventsStore.getState().markEventResolved(eventId)
    })
    expect(useSourceChangeEventsStore.getState().events[0]?.status).toBe('resolved')

    act(() => {
      useSourceChangeEventsStore.getState().resetEvents()
    })
    expect(useSourceChangeEventsStore.getState().events).toEqual([])
  })

  it('recordChangeEvent records source_change_detected audit event once for a new event id', () => {
    act(() => {
      useAuditLogStore.setState({ events: [] })
      useSourceChangeEventsStore.getState().recordChangeEvent({
        source_file_id: 'file-1',
        source_file_name: 'policy.md',
        section_ids_changed: ['section-a'],
        old_revision_id: 'old-rev',
        new_revision_id: 'new-rev',
      })
      useSourceChangeEventsStore.getState().recordChangeEvent({
        source_file_id: 'file-1',
        source_file_name: 'policy.md',
        section_ids_changed: ['section-a'],
        old_revision_id: 'old-rev',
        new_revision_id: 'new-rev',
      })
    })

    expect(useSourceChangeEventsStore.getState().events).toHaveLength(1)
    expect(useAuditLogStore.getState().events).toEqual([
      expect.objectContaining({ event_type: 'source_change_detected', actor_name: 'Drive sync', entity_label: 'policy.md' }),
    ])
  })

  it('persists events across module reloads', async () => {
    act(() => {
      useSourceChangeEventsStore.getState().recordChangeEvent({
        id: 'event-persisted',
        source_file_id: 'file-1',
        source_file_name: 'policy.md',
        section_ids_changed: ['section-a'],
        old_revision_id: 'old-rev',
        new_revision_id: 'new-rev',
        detected_at: '2026-05-23T00:00:00.000Z',
      })
    })

    vi.resetModules()
    ;({ useSourceChangeEventsStore } = await import('./sourceChangeEventsStore'))

    expect(useSourceChangeEventsStore.getState().events).toEqual([
      expect.objectContaining({ id: 'event-persisted', status: 'unreviewed' }),
    ])
  })
})
