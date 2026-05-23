import { FileClock } from 'lucide-react'

import { Card } from '@/components/ui/card'
import type { SourceChangeEvent } from '@/lib/education'

export interface SourceChangeListProps {
  events: SourceChangeEvent[]
  selectedEventId?: string
  onSelect?: (event: SourceChangeEvent) => void
}

const STATUS_STYLES: Record<SourceChangeEvent['status'], string> = {
  unreviewed: 'border-amber-200 bg-amber-50 text-amber-700',
  reviewed: 'border-blue-200 bg-blue-50 text-blue-700',
  resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function statusLabel(status: SourceChangeEvent['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function SourceChangeList({ events, selectedEventId, onSelect }: SourceChangeListProps) {
  if (events.length === 0) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10">
          <FileClock className="h-8 w-8 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">No source changes detected</h2>
          <p className="mt-2 text-sm text-slate-600">Click “Sync from Drive” to check the mocked Source Library.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3" aria-label="Source change events">
      {events.map((event) => {
        const isSelected = selectedEventId === event.id
        const card = (
          <Card
            className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
              isSelected ? 'border-redex-red ring-2 ring-redex-red/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-900">{event.source_file_name}</h3>
                <p className="text-sm text-slate-600">
                  Drive sync detected {event.section_ids_changed.length}{' '}
                  {event.section_ids_changed.length === 1 ? 'changed section' : 'changed sections'} ·{' '}
                  {formatTimestamp(event.detected_at)}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  {event.old_revision_id} → {event.new_revision_id}
                </p>
              </div>
              <span className={`self-start rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[event.status]}`}>
                {statusLabel(event.status)}
              </span>
            </div>
          </Card>
        )

        if (!onSelect) {
          return <article key={event.id}>{card}</article>
        }

        return (
          <button key={event.id} type="button" className="block w-full" onClick={() => onSelect(event)}>
            {card}
          </button>
        )
      })}
    </div>
  )
}
