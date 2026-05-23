import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

import { LESSON_GENERATION_STATUS_LABELS, type LessonGenerationStatus } from '@/lib/education';

export interface GenerationStatusBadgeProps {
  status: LessonGenerationStatus;
  note?: string;
}

const STATUS_STYLES: Record<LessonGenerationStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  needs_review: 'bg-amber-50 text-amber-700 border-amber-200',
  unsupported_claim: 'bg-red-50 text-red-700 border-red-200',
  missing_source: 'bg-amber-50 text-amber-700 border-amber-200',
  ready_for_approval: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function GenerationStatusBadge({ status, note }: GenerationStatusBadgeProps) {
  const label = LESSON_GENERATION_STATUS_LABELS[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status]}`}
      title={note}
    >
      {status === 'unsupported_claim' && <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
      {status === 'missing_source' && <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
      {status === 'ready_for_approval' && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}
