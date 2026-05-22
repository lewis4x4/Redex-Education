import type { ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'

import { Card } from '@/components/ui/card'

export type CourseStatusLabel = 'Draft' | 'Needs review' | 'Published' | 'Archived'

export interface CourseStatusListItem {
  id: string
  title: string
  status: CourseStatusLabel
  meta?: string // e.g. "Updated 2 hours ago" or "Pending review by HR"
}

export interface CourseStatusListProps {
  /** Section heading rendered above the list */
  title: string
  items: CourseStatusListItem[]
  /** Rendered when items is empty — a tasteful all-caught-up affordance */
  emptyMessage?: string
  /** Optional icon for the empty state (defaults to CheckCircle2) */
  emptyIcon?: ReactNode
}

const STATUS_CLASS: Record<CourseStatusLabel, string> = {
  Draft: 'bg-slate-100 text-slate-700',
  'Needs review': 'bg-amber-50 text-amber-700',
  Published: 'bg-emerald-50 text-emerald-700',
  Archived: 'bg-slate-50 text-slate-500',
}

export function CourseStatusList({
  title,
  items,
  emptyMessage = 'All caught up. No modules awaiting review.',
  emptyIcon,
}: CourseStatusListProps) {
  const hasItems = items.length > 0

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
        <span className="text-sm font-semibold tabular-nums text-slate-500" aria-label={`${items.length} items`}>
          {items.length}
        </span>
      </div>

      {hasItems ? (
        <ul className="divide-y divide-slate-100" aria-label={`${title} modules`}>
          {items.map((item) => (
            <li key={item.id}>
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                  {item.meta ? <p className="mt-1 text-xs text-slate-500">{item.meta}</p> : null}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[item.status]}`}
                  aria-label={`Status: ${item.status}`}
                >
                  {item.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-10 text-center">
          <div aria-hidden="true" className="text-emerald-500">
            {emptyIcon ?? <CheckCircle2 className="h-8 w-8" />}
          </div>
          <p className="text-sm text-slate-500" aria-live="polite">
            {emptyMessage}
          </p>
        </div>
      )}
    </Card>
  )
}
