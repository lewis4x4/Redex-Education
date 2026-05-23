import { AUDIT_EVENT_TYPES } from '@/lib/education'
import type { AuditEventType } from '@/types/training'
import { getEventLabel } from '../lib/eventLabels'

export interface AuditEventTypeFilterProps {
  value: AuditEventType | 'all'
  onChange: (value: AuditEventType | 'all') => void
  counts: Record<AuditEventType | 'all', number>
}

function getChipLabel(type: AuditEventType | 'all'): string {
  if (type === 'all') {
    return 'All'
  }

  return getEventLabel(type)
}

export function AuditEventTypeFilter({ value, onChange, counts }: AuditEventTypeFilterProps) {
  const options: Array<AuditEventType | 'all'> = ['all', ...AUDIT_EVENT_TYPES]

  return (
    <div className="flex flex-wrap gap-2" aria-label="Audit event type filters">
      {options.map((type) => {
        const isActive = value === type

        return (
          <button
            key={type}
            type="button"
            className={
              isActive
                ? 'inline-flex items-center gap-2 rounded-full bg-redex-red px-3 py-1.5 text-xs font-semibold text-white shadow-sm'
                : 'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-redex-red hover:text-redex-red'
            }
            aria-pressed={isActive}
            onClick={() => onChange(type)}
          >
            <span>{getChipLabel(type)}</span>
            <span className={isActive ? 'text-white/80' : 'text-slate-400'}>{counts[type] ?? 0}</span>
          </button>
        )
      })}
    </div>
  )
}
