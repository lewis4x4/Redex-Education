import { FolderOpen, Library } from 'lucide-react'

import { Card } from '@/components/ui/card'
import type { SourceFile } from '@/lib/education'
import { SourceAuthorityBadge } from './SourceAuthorityBadge'

export interface SourceLibraryBrowserProps {
  files: SourceFile[];
  loading?: boolean;
  selectedDriveFileIds?: ReadonlySet<string>;
  onToggleSelection?: (driveFileId: string) => void;
  topicFilter?: string;
}

function formatTimestamp(value?: string) {
  if (!value) {
    return 'Not synced yet'
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function groupFilesByTopic(files: SourceFile[]) {
  return files.reduce<Map<string, SourceFile[]>>((groups, file) => {
    const topic = file.topic?.trim() || 'General'
    const topicFiles = groups.get(topic) ?? []
    topicFiles.push(file)
    groups.set(topic, topicFiles)
    return groups
  }, new Map<string, SourceFile[]>())
}

export function SourceLibraryBrowser({
  files,
  loading = false,
  selectedDriveFileIds,
  onToggleSelection,
  topicFilter,
}: SourceLibraryBrowserProps) {
  const visibleFiles = topicFilter ? files.filter((file) => file.topic === topicFilter) : files
  const groupedFiles = groupFilesByTopic(visibleFiles)
  const showSelection = onToggleSelection !== undefined

  if (loading) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-label="Loading source library">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="space-y-3">
            <div className="h-16 rounded-xl bg-slate-100" />
            <div className="h-16 rounded-xl bg-slate-100" />
            <div className="h-16 rounded-xl bg-slate-100" />
          </div>
        </div>
      </Card>
    )
  }

  if (visibleFiles.length === 0) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
          <Library className="h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="mt-3 max-w-md text-sm text-slate-600">
            No source files yet. Click 'Sync from Drive' to ingest the `_library/` folder.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-6" aria-label="Source library files">
        {Array.from(groupedFiles.entries()).map(([topic, topicFiles]) => (
          <section key={topic} className="space-y-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-redex-red" aria-hidden="true" />
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">{topic}</h2>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                {topicFiles.length} {topicFiles.length === 1 ? 'file' : 'files'}
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {topicFiles.map((file) => {
                const checked = selectedDriveFileIds?.has(file.drive_file_id) ?? false
                const checkboxId = `source-library-${file.drive_file_id}`

                return (
                  <article key={file.drive_file_id} className="flex items-start gap-3 bg-white p-4">
                    {showSelection ? (
                      <input
                        id={checkboxId}
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleSelection?.(file.drive_file_id)}
                        aria-label={`Select ${file.title}`}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-redex-red focus:ring-redex-red"
                      />
                    ) : null}

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {showSelection ? <label htmlFor={checkboxId}>{file.title}</label> : file.title}
                        </h3>
                        <SourceAuthorityBadge level={file.authority} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>Last synced {formatTimestamp(file.last_synced_at)}</span>
                        {file.drive_path ? <span className="truncate">{file.drive_path}</span> : null}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </Card>
  )
}
