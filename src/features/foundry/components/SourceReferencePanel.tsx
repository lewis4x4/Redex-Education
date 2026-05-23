import { AlertTriangle } from 'lucide-react';

import type { SourceExcerpt } from '@/lib/education';

export interface SourceReferencePanelProps {
  excerpts: SourceExcerpt[];
}

function renderHighlightedText(sectionBody: string, highlightedSpan?: { start: number; end: number }) {
  if (!highlightedSpan) {
    return sectionBody;
  }

  const start = Math.max(0, Math.min(highlightedSpan.start, sectionBody.length));
  const end = Math.max(start, Math.min(highlightedSpan.end, sectionBody.length - 1));

  const before = sectionBody.slice(0, start);
  const highlighted = sectionBody.slice(start, end + 1);
  const after = sectionBody.slice(end + 1);

  return (
    <>
      {before}
      <mark className="bg-yellow-100">{highlighted}</mark>
      {after}
    </>
  );
}

export function SourceReferencePanel({ excerpts }: SourceReferencePanelProps) {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4"
      aria-labelledby="source-reference-title"
    >
      <header>
        <h2 id="source-reference-title" className="text-lg font-semibold tracking-tight text-slate-900">
          Source reference
        </h2>
      </header>

      {excerpts.length === 0 ? (
        <p className="text-sm text-slate-600">No source references available.</p>
      ) : (
        <ul className="space-y-4" aria-label="Source excerpts">
          {excerpts.map((excerpt) => {
            const hasPlaceholder = excerpt.section_body.includes('[PLACEHOLDER]');

            return (
              <li
                key={`${excerpt.drive_file_id}-${excerpt.section_heading}`}
                className={`rounded-xl border p-4 space-y-2 ${
                  hasPlaceholder ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-slate-50'
                }`}
              >
                {hasPlaceholder && (
                  <p className="inline-flex items-center gap-2 text-xs font-medium text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    Placeholder content detected
                  </p>
                )}

                <p className="font-medium text-slate-900">{excerpt.source_title}</p>
                <p className="text-sm uppercase tracking-wide text-slate-600">{excerpt.section_heading}</p>
                <div className="max-h-64 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700">
                  {renderHighlightedText(excerpt.section_body, excerpt.highlighted_span)}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
