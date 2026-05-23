import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AUDIT_EVENT_TYPES } from '@/lib/education'
import { MOCK_ADMIN_USER, MOCK_LEARNER_DEVON } from '@/lib/education/mockOrgPeople'

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

describe('useAuditLogStore', () => {
  let useAuditLogStore: (typeof import('./auditLogStore'))['useAuditLogStore']

  beforeEach(async () => {
    vi.resetModules()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useAuditLogStore } = await import('./auditLogStore'))

    act(() => {
      useAuditLogStore.getState().resetEvents()
    })
  })

  it('starts with coherent seeded events sorted newest first', () => {
    const events = useAuditLogStore.getState().events

    expect(events.length).toBeGreaterThanOrEqual(14)
    expect(events[0]).toEqual(expect.objectContaining({ event_type: 'quiz_attempted', actor_name: 'Marcus Chen' }))
    expect(events.map((event) => event.event_type)).toEqual(
      expect.arrayContaining(['module_created', 'source_uploaded', 'module_published', 'assignment_created']),
    )
    expect(events).toEqual([...events].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)))
  })

  it('records a new event with generated id and occurred_at timestamp', () => {
    let event = undefined as ReturnType<typeof useAuditLogStore.getState>['events'][number] | undefined

    act(() => {
      event = useAuditLogStore.getState().recordEvent({
        event_type: 'module_published',
        actor_user_id: MOCK_ADMIN_USER.id,
        actor_name: MOCK_ADMIN_USER.display_name,
        entity_type: 'module_version',
        entity_id: 'module-version-test-v1',
        entity_label: 'Test Module v1',
      })
    })

    expect(event?.id).toEqual(expect.any(String))
    expect(Number.isNaN(Date.parse(event?.occurred_at ?? ''))).toBe(false)
    expect(useAuditLogStore.getState().events[0]).toEqual(event)
  })

  it('filters events by type, actor, entity, and since timestamp', () => {
    const quizEvents = useAuditLogStore.getState().getEvents({ event_types: ['quiz_attempted'] })
    expect(quizEvents).toHaveLength(2)
    expect(quizEvents.every((event) => event.event_type === 'quiz_attempted')).toBe(true)

    const devonEvents = useAuditLogStore.getState().getEvents({ actor_user_id: MOCK_LEARNER_DEVON.id })
    expect(devonEvents.map((event) => event.actor_name)).toEqual(expect.arrayContaining(['Devon Lee']))

    expect(useAuditLogStore.getState().getEvents({ entity_id: 'assignment-hr-basics-ana' })).toEqual([
      expect.objectContaining({ event_type: 'assignment_created', entity_label: 'Ana Rodriguez assigned HR Basics at Redex' }),
    ])

    const recentEvents = useAuditLogStore.getState().getEvents({ since: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString() })
    expect(recentEvents.every((event) => Date.parse(event.occurred_at) >= Date.now() - 2.5 * 24 * 60 * 60 * 1000)).toBe(true)
  })

  it('counts every event type', () => {
    const counts = useAuditLogStore.getState().getEventCountByType()

    for (const type of AUDIT_EVENT_TYPES) {
      expect(counts[type]).toEqual(expect.any(Number))
    }
    expect(counts.assignment_created).toBe(3)
    expect(counts.quiz_attempted).toBe(2)
  })

  it('persists recorded events across a store reload and reset restores seed', async () => {
    act(() => {
      useAuditLogStore.getState().recordEvent({
        event_type: 'source_change_detected',
        actor_user_id: 'system',
        actor_name: 'Drive sync',
        entity_type: 'source_file',
        entity_id: 'file-persisted',
        entity_label: 'persisted.md',
      })
    })

    vi.resetModules()
    const reloaded = await import('./auditLogStore')
    expect(reloaded.useAuditLogStore.getState().events[0]).toEqual(
      expect.objectContaining({ event_type: 'source_change_detected', entity_label: 'persisted.md' }),
    )

    act(() => {
      reloaded.useAuditLogStore.getState().resetEvents()
    })

    expect(reloaded.useAuditLogStore.getState().events.some((event) => event.entity_id === 'file-persisted')).toBe(false)
    expect(reloaded.useAuditLogStore.getState().events.length).toBeGreaterThanOrEqual(14)
  })
})
