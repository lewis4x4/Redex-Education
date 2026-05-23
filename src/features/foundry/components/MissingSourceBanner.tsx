import { AlertOctagon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MISSING_SOURCE_WARNING } from '@/features/source-binder/utils/sourceValidation';

export interface MissingSourceBannerProps {
  /** Optional custom message; defaults to MISSING_SOURCE_WARNING. */
  message?: string;
  /** Optional CTA action. */
  resolveLabel?: string;
  onResolve?: () => void;
}

export function MissingSourceBanner({
  message = MISSING_SOURCE_WARNING,
  resolveLabel = 'Resolve',
  onResolve,
}: MissingSourceBannerProps) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900"
      aria-labelledby="missing-source-banner-heading"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <h2 id="missing-source-banner-heading" className="font-semibold">
              Missing source
            </h2>
            <p className="text-sm leading-[1.45]">{message}</p>
          </div>
        </div>

        {onResolve ? (
          <Button type="button" variant="outline" size="sm" onClick={onResolve} aria-label={resolveLabel}>
            {resolveLabel}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
