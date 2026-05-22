import { AlertTriangle, FileText } from 'lucide-react'

import type { SourceSection } from '@/lib/education'

export interface SourcePreviewPanelProps {
  /** Parsed sections to render. Empty array → empty state. */
  sections: SourceSection[]
}

function getHeadingClass(level: SourceSection['level']) {
  if (level === 1) {
    return 'text-base font-semibold text-slate-900'
  }

  if (level === 0) {
    return 'text-sm font-medium italic text-slate-700'
  }

  return 'text-sm font-medium text-slate-900'
}

function toPreview(body: string) {
  if (body.length <= 200) {
    return body
  }

  return `${body.slice(0, 200)}…`
}

export function SourcePreviewPanel({ sections }: SourcePreviewPanelProps) {
  const placeholdersCount = sections.filter((section) => section.has_placeholders).length

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight md:text-xl">Preview</h2>

      <p className="mt-2 text-sm text-slate-600">
        {sections.length} sections
        {placeholdersCount > 0 ? ` · ${placeholdersCount} contain placeholders` : ''}
      </p>

      {sections.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <FileText className="h-7 w-7 text-slate-400" aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-600">
            Paste markdown or upload a file to preview parsed sections.
          </p>
        </div>
      ) : (
        <div className="mt-4 max-h-[60vh] overflow-y-auto" aria-label="Parsed source sections">
          <div className="divide-y divide-slate-100">
            {sections.map((section) => (
              <article key={section.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <h3 className={getHeadingClass(section.level)}>
                    {section.level === 0 ? 'Preamble' : section.heading || 'Untitled section'}
                  </h3>
                  {section.has_placeholders ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                      Needs source
                    </span>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-600">{toPreview(section.body)}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
