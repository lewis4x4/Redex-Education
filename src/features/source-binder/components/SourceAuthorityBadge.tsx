import { Info, ShieldCheck, Tag } from 'lucide-react'

import type { SourceAuthorityLevel } from '@/lib/education'

export interface SourceAuthorityBadgeProps {
  level: SourceAuthorityLevel;
}

export function SourceAuthorityBadge({ level }: SourceAuthorityBadgeProps) {
  if (level === 'authoritative') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-redex-red/20 bg-redex-red/10 px-2.5 py-1 text-xs font-semibold text-redex-red">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Authoritative
      </span>
    )
  }

  if (level === 'supporting') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
        Supporting
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
      <Tag className="h-3.5 w-3.5" aria-hidden="true" />
      Context
    </span>
  )
}
