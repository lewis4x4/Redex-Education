import { AlertOctagon, CheckCircle2, Edit, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { REVIEW_STATUS_LABELS, type LessonReviewStatus } from '@/lib/education';

export interface ReviewActionBarProps {
  status: LessonReviewStatus;
  onApprove: () => void;
  onRequestRegeneration: () => void;
  onEdit?: () => void;
}

const STATUS_STYLES: Record<LessonReviewStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  needs_regeneration: 'border-red-200 bg-red-50 text-red-700',
};

export function ReviewActionBar({ status, onApprove, onRequestRegeneration, onEdit }: ReviewActionBarProps) {
  return (
    <footer className="border-t bg-white p-4 flex items-center gap-3" aria-label="Review actions">
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
        {status === 'approved' && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
        {status === 'needs_regeneration' && <AlertOctagon className="h-3.5 w-3.5" aria-hidden="true" />}
        <span>{REVIEW_STATUS_LABELS[status]}</span>
      </span>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="brand"
          onClick={onApprove}
          disabled={status === 'approved'}
          aria-disabled={status === 'approved'}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Approve lesson
        </Button>

        <Button type="button" variant="outline" onClick={onRequestRegeneration}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Request regeneration
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onEdit}
          disabled={!onEdit}
          aria-disabled={!onEdit}
          title={!onEdit ? 'Coming in future slice — manual editing' : undefined}
        >
          <Edit className="h-4 w-4" aria-hidden="true" />
          Edit
        </Button>
      </div>
    </footer>
  );
}
