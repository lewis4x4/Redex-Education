import { cn } from '@/lib/utils'

export type StatusFilter = 'all' | 'incomplete' | 'overdue' | 'failed' | 'completed'

interface ManagerStatusFilterProps {
  value: StatusFilter
  onChange: (value: StatusFilter) => void
  counts: Record<StatusFilter, number>
}

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  incomplete: 'Incomplete',
  overdue: 'Overdue',
  failed: 'Failed',
  completed: 'Completed',
}

const FILTERS: StatusFilter[] = ['all', 'incomplete', 'overdue', 'failed', 'completed']

export function ManagerStatusFilter({ value, onChange, counts }: ManagerStatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Filter team training status">
      {FILTERS.map((filter) => {
        const active = value === filter

        return (
          <button
            key={filter}
            type="button"
            aria-pressed={active}
            className={cn(
              'rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors',
              active
                ? 'border-redex-red bg-redex-red text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-redex-red/40 hover:text-redex-red',
            )}
            onClick={() => onChange(filter)}
          >
            {FILTER_LABELS[filter]} ({counts[filter]})
          </button>
        )
      })}
    </div>
  )
}
