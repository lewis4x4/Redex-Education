import { ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'
import { DriveSyncButton } from '@/features/source-binder/components/DriveSyncButton'
import { SourceLibraryBrowser } from '@/features/source-binder/components/SourceLibraryBrowser'
import { useSourceLibrary } from '@/features/source-binder/lib/useSourceLibrary'

function formatLastSynced(value: string | null) {
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

export function SourceLibraryPage() {
  const navigate = useNavigate()
  const { files, loading, error, refresh } = useSourceLibrary()
  const selectedLibraryFileIds = useFoundryDraftStore((state) => state.selectedLibraryFileIds)
  const toggleLibraryFile = useFoundryDraftStore((state) => state.toggleLibraryFile)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [topicFilter, setTopicFilter] = useState('')

  const topics = useMemo(
    () => Array.from(new Set(files.map((file) => file.topic).filter((topic): topic is string => Boolean(topic)))).sort(),
    [files],
  )

  const selectedDriveFileIds = useMemo(() => new Set(selectedLibraryFileIds), [selectedLibraryFileIds])
  const filteredFiles = topicFilter ? files.filter((file) => file.topic === topicFilter) : files

  const lastSyncedAt = useMemo(() => {
    const timestamps = files
      .map((file) => (file.last_synced_at ? Date.parse(file.last_synced_at) : Number.NaN))
      .filter((value) => Number.isFinite(value))

    if (timestamps.length === 0) {
      return null
    }

    return new Date(Math.max(...timestamps)).toISOString()
  }, [files])

  return (
    <section className="mx-auto max-w-6xl space-y-6 md:space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">
          REDEX AI COURSE FOUNDRY · SOURCE LIBRARY
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Source Library</h1>
        <p className="max-w-3xl text-[15px] leading-[1.45] text-slate-600">
          Files ingested from the Redex Google Drive `_library/` folder. Authority-tagged and version-tracked.
        </p>
      </header>

      <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">Drive ingestion</h2>
            <p className="text-sm text-slate-600">Last synced: {formatLastSynced(lastSyncedAt)}</p>
          </div>
          <DriveSyncButton
            onSyncComplete={() => {
              setSyncError(null)
              void refresh()
            }}
            onSyncError={(syncFailure) => setSyncError(syncFailure.message)}
          />
        </div>

        {error || syncError ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {syncError ?? error}
          </p>
        ) : null}
      </Card>

      {files.length > 0 ? (
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:max-w-xs">
            Filter by topic
            <select
              value={topicFilter}
              onChange={(event) => setTopicFilter(event.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-redex-red focus:outline-none focus:ring-1 focus:ring-redex-red"
              aria-label="Filter source library by topic"
            >
              <option value="">All topics</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </label>
        </Card>
      ) : null}

      <SourceLibraryBrowser
        files={filteredFiles}
        loading={loading}
        selectedDriveFileIds={selectedDriveFileIds}
        onToggleSelection={toggleLibraryFile}
        topicFilter={topicFilter || undefined}
      />

      <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-relaxed text-slate-600">
          Source Library selections are stored by stable Drive file ID; paths are display metadata only. ADR 010 explains
          why Drive is the canonical source library and Notion is not part of this workflow.{' '}
          <a
            href="../decisions/010-drive-source-library-notion-dropped.md"
            className="inline-flex items-center gap-1 font-medium text-redex-red hover:underline"
          >
            Read ADR 010
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </p>
      </Card>

      <footer className="flex justify-end">
        <Button variant="brand" onClick={() => navigate('/admin/foundry/source')}>
          Back to source binder
        </Button>
      </footer>
    </section>
  )
}
