import { FileDiff } from 'lucide-react'

import { Card } from '@/components/ui/card'

export interface SectionDiffViewProps {
  sectionId?: string
  oldContent?: string
  newContent?: string
}

function ContentPane({ label, content }: { label: string; content: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
      <pre className="min-h-40 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
        {content}
      </pre>
    </div>
  )
}

export function SectionDiffView({ sectionId, oldContent, newContent }: SectionDiffViewProps) {
  if (!sectionId || !oldContent || !newContent) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <FileDiff className="h-8 w-8 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">No section selected</h2>
          <p className="mt-2 text-sm text-slate-600">Select a source change to review the before and after content.</p>
        </div>
      </Card>
    )
  }

  const changed = oldContent !== newContent

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[2px] text-slate-500">Section diff</p>
          <h2 className="text-lg font-semibold text-slate-900">{sectionId}</h2>
        </div>
        {changed ? (
          <span className="self-start rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            Changed
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ContentPane label="Before" content={oldContent} />
        <ContentPane label="After" content={newContent} />
      </div>
    </Card>
  )
}
