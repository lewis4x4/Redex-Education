import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { AUDIT_EVENT_TYPES } from '@/lib/education'
import type { AuditEventType } from '@/types/training'
import { AuditEventRow } from '../components/AuditEventRow'
import { AuditEventTypeFilter } from '../components/AuditEventTypeFilter'
import { useAuditLogStore } from '../store/auditLogStore'

function buildCounts(events: ReturnType<typeof useAuditLogStore.getState>['events']): Record<AuditEventType | 'all', number> {
  const counts = Object.fromEntries(AUDIT_EVENT_TYPES.map((type) => [type, 0])) as Record<AuditEventType | 'all', number>
  counts.all = events.length

  for (const event of events) {
    counts[event.event_type] += 1
  }

  return counts
}

export function AuditLogPage() {
  const events = useAuditLogStore((state) => state.events)
  const [selectedType, setSelectedType] = useState<AuditEventType | 'all'>('all')

  const counts = useMemo(() => buildCounts(events), [events])
  const filteredEvents = useMemo(
    () => (selectedType === 'all' ? events : events.filter((event) => event.event_type === selectedType)),
    [events, selectedType],
  )

  return (
    <section className="space-y-6">
      <Link className="text-sm font-medium text-redex-red hover:text-redex-red-hover" to="/admin">
        ← Back to admin dashboard
      </Link>

      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">ADMIN · AUDIT</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Audit log</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Review key admin, learner, source sync, and generation events captured by the local audit store.
        </p>
      </header>

      <section className="space-y-3" aria-labelledby="audit-filter-heading">
        <h2 id="audit-filter-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Filter by event type
        </h2>
        <AuditEventTypeFilter value={selectedType} counts={counts} onChange={setSelectedType} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Audit events">
        {filteredEvents.length > 0 ? (
          <div className="max-h-[640px] overflow-y-auto">
            {filteredEvents.map((event) => (
              <AuditEventRow key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-sm font-medium text-slate-500">
            No audit events match this filter.
          </div>
        )}
      </section>
    </section>
  )
}
