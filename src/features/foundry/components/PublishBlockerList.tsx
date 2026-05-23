import { AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PUBLISH_BLOCKER_SOURCE_LABELS, type PublishBlocker } from '@/lib/education';

export interface PublishBlockerListProps {
  blockers: PublishBlocker[];
  onResolve?: (blocker: PublishBlocker) => void;
}

const severityStyles = {
  blocker: 'text-red-700',
  warning: 'text-amber-700',
} as const;

const sourceBadgeStyles = {
  blocker: 'border-red-200 bg-red-50 text-red-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
} as const;

export function PublishBlockerList({ blockers, onResolve }: PublishBlockerListProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Publish blockers</h2>
        <span className="inline-flex min-w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
          {blockers.length}
        </span>
      </div>

      {blockers.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
          <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium">No publish blockers. You're clear to publish.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
          {blockers.map((blocker) => {
            const isBlocker = blocker.severity === 'blocker';

            return (
              <article key={blocker.id} className="flex gap-4 p-4">
                <div className="flex min-w-0 items-start gap-2">
                  {isBlocker ? (
                    <AlertOctagon className={`mt-0.5 h-5 w-5 shrink-0 ${severityStyles[blocker.severity]}`} aria-hidden="true" />
                  ) : (
                    <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${severityStyles[blocker.severity]}`} aria-hidden="true" />
                  )}
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${sourceBadgeStyles[blocker.severity]}`}
                  >
                    {PUBLISH_BLOCKER_SOURCE_LABELS[blocker.source]}
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium text-slate-900">{blocker.location}</p>
                  <p className="text-sm text-slate-600">{blocker.summary}</p>
                  {blocker.detail ? (
                    <details className="text-sm text-slate-600">
                      <summary className="cursor-pointer select-none text-slate-700">Details</summary>
                      <p className="mt-1 leading-[1.45]">{blocker.detail}</p>
                    </details>
                  ) : null}
                </div>

                {blocker.resolve_route && onResolve ? (
                  <div className="shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onResolve(blocker)}
                      aria-label={`Resolve ${blocker.summary}`}
                    >
                      Resolve
                    </Button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
