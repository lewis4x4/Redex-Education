import { useState } from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { CritiqueIssue } from '@/lib/education';
import { CRITIQUE_CATEGORY_LABELS } from '@/lib/education';
import { cn } from '@/lib/utils';

export interface CritiqueIssueCardProps {
  issue: CritiqueIssue;
  onIgnore?: (note: string) => void;
  onUnignore?: () => void;
  onEditManually?: () => void;
  onRegenerateWithFix?: () => void;
}

const severityStyles = {
  high: 'bg-red-100 text-red-900 border-red-200',
  medium: 'bg-amber-100 text-amber-900 border-amber-200',
  low: 'bg-slate-100 text-slate-700 border-slate-200',
} as const;

export function CritiqueIssueCard({
  issue,
  onIgnore,
  onUnignore,
  onEditManually,
  onRegenerateWithFix,
}: CritiqueIssueCardProps) {
  const [isIgnoring, setIsIgnoring] = useState(false);
  const [ignoreNote, setIgnoreNote] = useState('');

  const handleSaveIgnore = () => {
    if (!onIgnore) return;
    onIgnore(ignoreNote.trim());
    setIgnoreNote('');
    setIsIgnoring(false);
  };

  return (
    <article
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4',
        issue.ignored && 'opacity-60'
      )}
    >
      <div className="relative pr-24 space-y-2">
        <span
          className={cn(
            'absolute right-0 top-0 inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-wide',
            severityStyles[issue.severity]
          )}
          aria-label={`${issue.severity} severity`}
        >
          {issue.severity}
        </span>
        <p className="text-xs font-semibold uppercase tracking-[2px] text-slate-500">
          {CRITIQUE_CATEGORY_LABELS[issue.category]}
          {issue.lesson_title ? ` · ${issue.lesson_title}` : ''}
        </p>
        <p className="font-medium text-slate-900">{issue.summary}</p>
        <p className="text-sm text-slate-600">{issue.detail}</p>
      </div>

      {issue.suggested_fix ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm italic text-emerald-900">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 not-italic" aria-hidden="true" />
            <span>{issue.suggested_fix}</span>
          </span>
        </div>
      ) : null}

      {issue.ignored ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            <span className="font-medium">Ignored:</span> {issue.ignored_note || 'No note provided.'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onUnignore}
              aria-label="Unignore issue"
            >
              Unignore
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {isIgnoring ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <label htmlFor={`ignore-note-${issue.id}`} className="text-sm font-medium text-slate-800">
                Ignore note
              </label>
              <textarea
                id={`ignore-note-${issue.id}`}
                value={ignoreNote}
                onChange={(event) => setIgnoreNote(event.target.value)}
                className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
                placeholder="Why is this safe to ignore?"
              />
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="brand" onClick={handleSaveIgnore} aria-label="Save ignore note">
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsIgnoring(false);
                    setIgnoreNote('');
                  }}
                  aria-label="Cancel ignore"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {!isIgnoring ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsIgnoring(true)}
                aria-label="Ignore issue"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Ignore
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title="Manual editing is coming soon."
              onClick={onEditManually}
              aria-label="Edit manually (coming soon)"
            >
              Edit manually
            </Button>
            <Button
              type="button"
              size="sm"
              variant="brand"
              onClick={onRegenerateWithFix}
              aria-label="Regenerate with fix"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Regenerate with fix
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
