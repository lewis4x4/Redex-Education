import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'

export type MetricDeltaTone = 'positive' | 'negative' | 'neutral'

export interface AdminMetricCardProps {
  /** Short label rendered as uppercase eyebrow text */
  label: string
  /** Primary value — large numeric or formatted string */
  value: string | number
  /** Optional change indicator beside the value (e.g. "+12% vs last week") */
  delta?: {
    value: string
    tone: MetricDeltaTone
  }
  /** Optional icon (lucide-react) rendered in the top-right of the card */
  icon?: ReactNode
  /** When 'accent', the value renders in Redex red */
  variant?: 'default' | 'accent'
}

const DELTA_TONE_CLASS: Record<MetricDeltaTone, string> = {
  positive: 'text-emerald-600',
  negative: 'text-red-600',
  neutral: 'text-slate-500',
}

export function AdminMetricCard({ label, value, delta, icon, variant = 'default' }: AdminMetricCardProps) {
  const numericValue = typeof value === 'number' ? value : Number(value)
  const showAccent =
    variant === 'accent' && Number.isFinite(numericValue) && value !== 0 && value !== '0' && numericValue !== 0

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</h3>
        {icon ? <div className="h-4 w-4 text-slate-400" aria-hidden="true">{icon}</div> : null}
      </div>

      <p
        className={`mt-3 text-3xl font-semibold tabular-nums tracking-tight ${
          showAccent ? 'text-redex-red' : 'text-slate-900'
        }`}
      >
        {value}
      </p>

      {delta ? (
        <p className={`mt-2 inline-flex rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium ${DELTA_TONE_CLASS[delta.tone]}`}>
          {delta.value}
        </p>
      ) : null}
    </Card>
  )
}
