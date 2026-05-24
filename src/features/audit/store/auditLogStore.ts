import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import {
  AUDIT_EVENT_TYPES,
  MOCK_ADMIN_USER,
  MOCK_LEARNER_ANA,
  MOCK_LEARNER_DEVON,
  MOCK_LEARNER_MARCUS,
} from '@/lib/education'
import type { AuditEventType, AuditLog, ISODateTime } from '@/types/training'

export interface AuditLogFilter {
  event_types?: AuditEventType[]
  actor_user_id?: string
  entity_id?: string
  since?: ISODateTime
}

interface AuditLogState {
  events: AuditLog[]
  recordEvent: (input: Omit<AuditLog, 'id' | 'occurred_at'>) => AuditLog
  getEvents: (filter?: AuditLogFilter) => AuditLog[]
  getEventCountByType: () => Record<AuditEventType, number>
  resetEvents: () => void
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function isoDaysAgo(days: number, hourOffset = 0): string {
  return new Date(Date.now() - days * MS_PER_DAY + hourOffset * 60 * 60 * 1000).toISOString()
}

function createAuditEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function sortNewestFirst(events: AuditLog[]): AuditLog[] {
  return [...events].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
}

function cloneEvent(event: AuditLog): AuditLog {
  return {
    ...event,
    ...(event.metadata ? { metadata: { ...event.metadata } } : {}),
  }
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

function getAuditLogStorage(): Storage {
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

function createSeedEvents(): AuditLog[] {
  const moduleEntity = {
    entity_type: 'module' as const,
    entity_id: 'hr-basics-mod-001',
    entity_label: 'HR Basics at Redex',
  }
  const moduleVersionEntity = {
    entity_type: 'module_version' as const,
    entity_id: 'module-version-hr-basics-v1',
    entity_label: 'HR Basics at Redex v1',
  }
  const sourceEntity = {
    entity_type: 'source_file' as const,
    entity_id: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R',
    entity_label: 'pto-policy.md',
  }

  return sortNewestFirst([
    {
      id: 'audit-seed-marcus-quiz',
      event_type: 'quiz_attempted',
      actor_user_id: MOCK_LEARNER_MARCUS.id,
      actor_name: MOCK_LEARNER_MARCUS.display_name,
      entity_type: 'quiz',
      entity_id: 'hr-basics-lesson-6-final-quiz',
      entity_label: 'Final Quiz · HR Basics at Redex',
      occurred_at: isoDaysAgo(1, -2),
      metadata: { score_percent: 100, passed: true },
    },
    {
      id: 'audit-seed-devon-completed',
      event_type: 'employee_completed_module',
      actor_user_id: MOCK_LEARNER_DEVON.id,
      actor_name: MOCK_LEARNER_DEVON.display_name,
      entity_type: 'assignment',
      entity_id: 'assignment-hr-basics-devon',
      entity_label: 'Devon Lee completed HR Basics at Redex',
      occurred_at: isoDaysAgo(2, 3),
      metadata: { module_version_id: 'module-version-hr-basics-v1' },
    },
    {
      id: 'audit-seed-devon-quiz',
      event_type: 'quiz_attempted',
      actor_user_id: MOCK_LEARNER_DEVON.id,
      actor_name: MOCK_LEARNER_DEVON.display_name,
      entity_type: 'quiz',
      entity_id: 'hr-basics-lesson-6-final-quiz',
      entity_label: 'Final Quiz · HR Basics at Redex',
      occurred_at: isoDaysAgo(2, 2),
      metadata: { score_percent: 80, passed: true },
    },
    {
      id: 'audit-seed-assignment-ana',
      event_type: 'assignment_created',
      actor_user_id: MOCK_ADMIN_USER.id,
      actor_name: MOCK_ADMIN_USER.display_name,
      entity_type: 'assignment',
      entity_id: 'assignment-hr-basics-ana',
      entity_label: 'Ana Rodriguez assigned HR Basics at Redex',
      occurred_at: isoDaysAgo(2),
      metadata: { assignee_user_id: MOCK_LEARNER_ANA.id, module_version_id: 'module-version-hr-basics-v1' },
    },
    {
      id: 'audit-seed-assignment-marcus',
      event_type: 'assignment_created',
      actor_user_id: MOCK_ADMIN_USER.id,
      actor_name: MOCK_ADMIN_USER.display_name,
      entity_type: 'assignment',
      entity_id: 'assignment-hr-basics-marcus',
      entity_label: 'Marcus Chen assigned HR Basics at Redex',
      occurred_at: isoDaysAgo(3),
      metadata: { assignee_user_id: MOCK_LEARNER_MARCUS.id, module_version_id: 'module-version-hr-basics-v1' },
    },
    {
      id: 'audit-seed-published',
      event_type: 'module_published',
      actor_user_id: MOCK_ADMIN_USER.id,
      actor_name: MOCK_ADMIN_USER.display_name,
      ...moduleVersionEntity,
      occurred_at: isoDaysAgo(4),
    },
    {
      id: 'audit-seed-lesson-approved-contact',
      event_type: 'lesson_approved',
      actor_user_id: MOCK_ADMIN_USER.id,
      actor_name: MOCK_ADMIN_USER.display_name,
      entity_type: 'lesson',
      entity_id: 'hr-basics-lesson-2-contact',
      entity_label: 'Who to Contact for HR Help',
      occurred_at: isoDaysAgo(5, 7),
      metadata: { module_version_id: 'module-version-hr-basics-v1' },
    },
    {
      id: 'audit-seed-lesson-approved-welcome',
      event_type: 'lesson_approved',
      actor_user_id: MOCK_ADMIN_USER.id,
      actor_name: MOCK_ADMIN_USER.display_name,
      entity_type: 'lesson',
      entity_id: 'hr-basics-lesson-1-welcome',
      entity_label: 'Welcome to Redex',
      occurred_at: isoDaysAgo(5, 6),
      metadata: { module_version_id: 'module-version-hr-basics-v1' },
    },
    {
      id: 'audit-seed-critique',
      event_type: 'self_critique_completed',
      actor_user_id: MOCK_ADMIN_USER.id,
      actor_name: MOCK_ADMIN_USER.display_name,
      ...moduleEntity,
      occurred_at: isoDaysAgo(5, 5),
      metadata: { high_severity_issues: 0 },
    },
    {
      id: 'audit-seed-module-generated',
      event_type: 'module_generated',
      actor_user_id: MOCK_ADMIN_USER.id,
      actor_name: MOCK_ADMIN_USER.display_name,
      ...moduleEntity,
      occurred_at: isoDaysAgo(5, 4),
    },
    {
      id: 'audit-seed-outline-approved',
      event_type: 'outline_approved',
      actor_user_id: MOCK_ADMIN_USER.id,
      actor_name: MOCK_ADMIN_USER.display_name,
      ...moduleEntity,
      occurred_at: isoDaysAgo(5, 3),
    },
    {
      id: 'audit-seed-outline-generated',
      event_type: 'outline_generated',
      actor_user_id: MOCK_ADMIN_USER.id,
      actor_name: MOCK_ADMIN_USER.display_name,
      ...moduleEntity,
      occurred_at: isoDaysAgo(5, 2),
      metadata: { lessons: 6 },
    },
    {
      id: 'audit-seed-source-uploaded',
      event_type: 'source_uploaded',
      actor_user_id: 'system',
      actor_name: 'Drive sync',
      ...sourceEntity,
      occurred_at: isoDaysAgo(5, 1),
      metadata: { source: 'drive' },
    },
    {
      id: 'audit-seed-module-created',
      event_type: 'module_created',
      actor_user_id: MOCK_ADMIN_USER.id,
      actor_name: MOCK_ADMIN_USER.display_name,
      ...moduleEntity,
      occurred_at: isoDaysAgo(5),
    },
    {
      id: 'audit-seed-assignment-devon',
      event_type: 'assignment_created',
      actor_user_id: MOCK_ADMIN_USER.id,
      actor_name: MOCK_ADMIN_USER.display_name,
      entity_type: 'assignment',
      entity_id: 'assignment-hr-basics-devon',
      entity_label: 'Devon Lee assigned HR Basics at Redex',
      occurred_at: isoDaysAgo(20),
      metadata: { assignee_user_id: MOCK_LEARNER_DEVON.id, module_version_id: 'module-version-hr-basics-v1' },
    },
  ])
}

function shouldSeedMockAuditEvents(): boolean {
  return import.meta.env.VITE_MOCK_AUTH === 'true'
}

function cloneSeedEvents(): AuditLog[] {
  return shouldSeedMockAuditEvents() ? createSeedEvents().map(cloneEvent) : []
}

export const useAuditLogStore = create<AuditLogState>()(
  persist(
    (set, get) => ({
      events: cloneSeedEvents(),
      recordEvent: (input) => {
        const event: AuditLog = {
          ...input,
          id: createAuditEventId(),
          occurred_at: new Date().toISOString(),
          ...(input.metadata ? { metadata: { ...input.metadata } } : {}),
        }

        set((state) => ({ events: sortNewestFirst([event, ...state.events]) }))
        return cloneEvent(event)
      },
      getEvents: (filter) => {
        const sinceTime = filter?.since ? Date.parse(filter.since) : null
        const eventTypes = filter?.event_types ? new Set(filter.event_types) : null

        return sortNewestFirst(
          get().events.filter((event) => {
            if (eventTypes && !eventTypes.has(event.event_type)) {
              return false
            }

            if (filter?.actor_user_id && event.actor_user_id !== filter.actor_user_id) {
              return false
            }

            if (filter?.entity_id && event.entity_id !== filter.entity_id) {
              return false
            }

            if (sinceTime !== null && Date.parse(event.occurred_at) < sinceTime) {
              return false
            }

            return true
          }),
        ).map(cloneEvent)
      },
      getEventCountByType: () => {
        const counts = Object.fromEntries(AUDIT_EVENT_TYPES.map((type) => [type, 0])) as Record<AuditEventType, number>

        for (const event of get().events) {
          counts[event.event_type] += 1
        }

        return counts
      },
      resetEvents: () => set({ events: cloneSeedEvents() }),
    }),
    {
      name: 'redex-audit-log-v1',
      storage: createJSONStorage(() => getAuditLogStorage()),
    },
  ),
)
