import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuditLogStore } from '@/features/audit/store/auditLogStore'
import { AffectedModulesPanel } from '@/features/source-binder/components/AffectedModulesPanel'
import { SectionDiffView } from '@/features/source-binder/components/SectionDiffView'
import { SourceChangeList } from '@/features/source-binder/components/SourceChangeList'
import {
  MOCK_MODULE_SOURCE_BINDINGS,
  MOCK_SOURCE_SECTION_DIFFS,
} from '@/features/source-binder/data/mockModuleSourceBindings'
import { MOCK_DRIVE_SYNC_DELAY_MS, simulateDriveSync } from '@/features/source-binder/lib/mockDriveSync'
import { computeAffectedModules } from '@/features/source-binder/lib/sourceImpact'
import { useSourceChangeEventsStore } from '@/features/source-binder/store/sourceChangeEventsStore'
import { useModuleVersionsStore } from '@/features/publishing/store/moduleVersionsStore'
import { MOCK_ADMIN_USER } from '@/lib/education'
import type { SourceChangeEvent } from '@/lib/education'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function findDiffs(event: SourceChangeEvent | undefined) {
  if (!event) {
    return []
  }

  const changedSections = new Set(event.section_ids_changed)
  return MOCK_SOURCE_SECTION_DIFFS.filter(
    (diff) => diff.source_file_id === event.source_file_id && changedSections.has(diff.section_id),
  )
}

export function SourceImpactReviewPage() {
  const events = useSourceChangeEventsStore((state) => state.events)
  const markEventResolved = useSourceChangeEventsStore((state) => state.markEventResolved)
  const versions = useModuleVersionsStore((state) => state.versions)
  const markVersionStale = useModuleVersionsStore((state) => state.markVersionStale)

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0]
  const affected = useMemo(
    () => computeAffectedModules(selectedEvent ? [selectedEvent] : events, MOCK_MODULE_SOURCE_BINDINGS, versions),
    [events, selectedEvent, versions],
  )
  const diffs = findDiffs(selectedEvent)

  const handleSync = async () => {
    setSyncing(true)

    try {
      const detectedEvents = await simulateDriveSync()
      if (detectedEvents[0]) {
        setSelectedEventId(detectedEvents[0].id)
      }
    } finally {
      setSyncing(false)
    }
  }

  const handleRegenerate = async (versionId: string, lessonIds: string[]) => {
    await delay(MOCK_DRIVE_SYNC_DELAY_MS)

    if (!selectedEvent) {
      return
    }

    const selectedEventImpact = computeAffectedModules([selectedEvent], MOCK_MODULE_SOURCE_BINDINGS, versions).find(
      (item) => item.version.id === versionId,
    )
    const selectedLessons = new Set(lessonIds)
    const regeneratedAllSelectedEventLessons =
      selectedEventImpact !== undefined && selectedEventImpact.affectedLessonIds.every((lessonId) => selectedLessons.has(lessonId))

    if (!regeneratedAllSelectedEventLessons) {
      return
    }

    const nextEvents = events.map((event) => (event.id === selectedEvent.id ? { ...event, status: 'resolved' as const } : event))
    const remainingImpact = computeAffectedModules(nextEvents, MOCK_MODULE_SOURCE_BINDINGS, versions).some(
      (item) => item.version.id === versionId,
    )

    markEventResolved(selectedEvent.id)
    useAuditLogStore.getState().recordEvent({
      event_type: 'stale_lesson_regenerated',
      actor_user_id: MOCK_ADMIN_USER.id,
      actor_name: MOCK_ADMIN_USER.display_name,
      entity_type: 'module_version',
      entity_id: selectedEventImpact.version.id,
      entity_label: `${selectedEventImpact.version.module_title} v${selectedEventImpact.version.version_number}`,
      metadata: { regenerated_lesson_ids: lessonIds.join(',') },
    })

    if (!remainingImpact) {
      markVersionStale(versionId, false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 md:space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">Source Impact Review</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Review source changes before regeneration</h1>
        <p className="max-w-3xl text-[15px] leading-[1.45] text-slate-600">
          Detect changed Drive revisions, identify module versions bound to those source sections, and selectively regenerate impacted lessons.
        </p>
      </header>

      <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">Sync from Drive</h2>
            <p className="text-sm text-slate-600">
              Mock sync checks tracked source revisions and flags affected published versions without changing their published state.
            </p>
          </div>
          <Button type="button" variant="brand" disabled={syncing} onClick={() => void handleSync()}>
            {syncing ? 'Syncing…' : 'Sync from Drive'}
          </Button>
        </div>
      </Card>

      {events.length === 0 ? (
        <SourceChangeList events={events} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <SourceChangeList events={events} selectedEventId={selectedEvent?.id} onSelect={(event) => setSelectedEventId(event.id)} />
          <div className="space-y-4">
            {diffs.length > 0 ? (
              diffs.map((diff) => (
                <SectionDiffView
                  key={diff.section_id}
                  sectionId={diff.section_id}
                  oldContent={diff.oldContent}
                  newContent={diff.newContent}
                />
              ))
            ) : (
              <SectionDiffView />
            )}
          </div>
        </div>
      )}

      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[2px] text-slate-500">Impact</p>
          <h2 className="text-xl font-semibold text-slate-900">Affected modules</h2>
        </div>
        <AffectedModulesPanel affected={affected} onRegenerate={(versionId, lessonIds) => handleRegenerate(versionId, lessonIds)} />
      </section>
    </section>
  )
}
