import type { AuditLog } from '@/types/training'
import { getEventBadgeVariant, getEventIcon, getEventLabel, type AuditEventBadgeVariant } from '../lib/eventLabels'

const BADGE_CLASSES: Record<AuditEventBadgeVariant, string> = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  progress: 'border-blue-200 bg-blue-50 text-blue-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-cyan-200 bg-cyan-50 text-cyan-700',
}

function formatRelativeTime(value: string): string {
  const occurredAt = new Date(value).getTime()

  if (Number.isNaN(occurredAt)) {
    return 'Unknown time'
  }

  const diffMs = occurredAt - Date.now()
  const absMs = Math.abs(diffMs)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (absMs < minute) {
    return 'just now'
  }

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (absMs < hour) {
    return formatter.format(Math.round(diffMs / minute), 'minute')
  }

  if (absMs < day) {
    return formatter.format(Math.round(diffMs / hour), 'hour')
  }

  return formatter.format(Math.round(diffMs / day), 'day')
}

export interface AuditEventRowProps {
  event: AuditLog
}

export function AuditEventRow({ event }: AuditEventRowProps) {
  const badgeVariant = getEventBadgeVariant(event.event_type)

  return (
    <article className="flex items-start gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0">
      <div
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base text-slate-700"
        aria-hidden="true"
      >
        {getEventIcon(event.event_type)}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${BADGE_CLASSES[badgeVariant]}`}>
            {getEventLabel(event.event_type)}
          </span>
          <span className="text-xs font-medium text-slate-500">{formatRelativeTime(event.occurred_at)}</span>
        </div>
        <p className="text-sm font-medium text-slate-900">
          <span>{event.actor_name}</span>
          <span className="font-normal text-slate-500"> · </span>
          <span>{event.entity_label}</span>
        </p>
        <p className="text-xs text-slate-500">
          {event.entity_type.replace('_', ' ')} · {event.entity_id}
        </p>
      </div>
    </article>
  )
}
