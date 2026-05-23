import { AlertCircle, CheckCircle2, Circle, CircleDot, OctagonAlert } from 'lucide-react'

import {
  stateBadgeVariant,
  stateLabel,
  type ModuleApprovalState,
} from '@/features/publishing/lib/moduleStates'

export interface ModuleStateBadgeProps {
  state: ModuleApprovalState
  size?: 'sm' | 'md'
}

const VARIANT_STYLES: Record<ReturnType<typeof stateBadgeVariant>, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  progress: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
}

const SIZE_STYLES: Record<NonNullable<ModuleStateBadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
}

function StateIcon({ state }: { state: ModuleApprovalState }) {
  const className = 'h-3.5 w-3.5'

  if (state === 'blocked') {
    return <OctagonAlert className={className} aria-hidden="true" />
  }

  if (state === 'needs_review') {
    return <AlertCircle className={className} aria-hidden="true" />
  }

  if (state === 'approved' || state === 'published') {
    return <CheckCircle2 className={className} aria-hidden="true" />
  }

  if (state === 'draft' || state === 'archived') {
    return <Circle className={className} aria-hidden="true" />
  }

  return <CircleDot className={className} aria-hidden="true" />
}

export function ModuleStateBadge({ state, size = 'sm' }: ModuleStateBadgeProps) {
  const variant = stateBadgeVariant(state)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${SIZE_STYLES[size]} ${VARIANT_STYLES[variant]}`}
      data-variant={variant}
    >
      <StateIcon state={state} />
      <span>{stateLabel(state)}</span>
    </span>
  )
}
