import type { SourceMaterial } from '@/lib/education'

export type SourceType = SourceMaterial['type']

export interface SourcePastePanelProps {
  /** Source title (controlled). */
  title: string
  /** Source type (controlled). */
  type: SourceType
  /** Raw markdown text (controlled). */
  rawText: string
  /** Called when the title input changes. */
  onTitleChange: (title: string) => void
  /** Called when the type select changes. */
  onTypeChange: (type: SourceType) => void
  /** Called when the textarea changes. */
  onRawTextChange: (rawText: string) => void
}

const SOURCE_TYPE_OPTIONS: Array<{ value: SourceType; label: string }> = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'DOCX' },
  { value: 'notion', label: 'Notion' },
  { value: 'web_url', label: 'Web URL' },
]

export function SourcePastePanel({
  title,
  type,
  rawText,
  onTitleChange,
  onTypeChange,
  onRawTextChange,
}: SourcePastePanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight md:text-xl">Paste source material</h2>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900" htmlFor="source-title-input">
            Source title *
          </label>
          <input
            id="source-title-input"
            type="text"
            value={title}
            maxLength={120}
            required
            aria-required="true"
            onChange={(event) => onTitleChange(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-redex-red/30 transition focus:border-redex-red focus:ring-2"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900" htmlFor="source-type-select">
            Source type *
          </label>
          <select
            id="source-type-select"
            value={type}
            required
            aria-required="true"
            onChange={(event) => onTypeChange(event.target.value as SourceType)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-redex-red/30 transition focus:border-redex-red focus:ring-2"
          >
            {SOURCE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {type !== 'markdown' ? (
            <p className="text-xs text-slate-500">
              Markdown is the only fully supported type right now — others are placeholders for upcoming source ingest.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900" htmlFor="source-markdown-textarea">
            Markdown source *
          </label>
          <textarea
            id="source-markdown-textarea"
            rows={12}
            value={rawText}
            required
            aria-required="true"
            placeholder={`# Welcome to Redex
This module covers...

## Section 1
[PLACEHOLDER — Redex policy team to provide approved content here]`}
            onChange={(event) => onRawTextChange(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none ring-redex-red/30 transition focus:border-redex-red focus:ring-2"
          />
        </div>
      </div>
    </section>
  )
}
