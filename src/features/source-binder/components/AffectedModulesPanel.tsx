import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { AffectedModule } from '@/features/source-binder/lib/sourceImpact'

export interface AffectedModulesPanelProps {
  affected: AffectedModule[]
  onRegenerate?: (versionId: string, lessonIds: string[]) => void | Promise<void>
}

const LESSON_LABELS: Record<string, string> = {
  'hr-basics-lesson-1-welcome': 'Welcome to Redex',
  'hr-basics-lesson-2-contact': 'Who to Contact for HR Help',
  'hr-basics-lesson-3-payroll-timekeeping': 'Payroll and Timekeeping Basics',
  'hr-basics-lesson-4-first-week': 'First-Week Expectations',
  'hr-basics-lesson-5-acknowledgment': 'Required Acknowledgment',
  'hr-basics-lesson-6-final-quiz': 'Final Quiz',
}

function sectionLabel(sectionId: string): string {
  return sectionId.replace(/^section-/u, '').replace(/-/g, ' ')
}

function statusBadge(status: 'Up-to-date' | 'Stale' | 'Regenerating') {
  const styles = {
    'Up-to-date': 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Stale: 'border-amber-200 bg-amber-50 text-amber-700',
    Regenerating: 'border-blue-200 bg-blue-50 text-blue-700',
  } as const

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{status}</span>
}

export function AffectedModulesPanel({ affected, onRegenerate }: AffectedModulesPanelProps) {
  const [selectedLessonsByVersion, setSelectedLessonsByVersion] = useState<Record<string, string[]>>({})
  const [regeneratingVersionId, setRegeneratingVersionId] = useState<string | null>(null)

  const initialSelections = useMemo(
    () => Object.fromEntries(affected.map((item) => [item.version.id, item.affectedLessonIds])),
    [affected],
  )

  if (affected.length === 0) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">No affected modules</h2>
        <p className="mt-2 text-sm text-slate-600">No module versions are bound to the changed source sections.</p>
      </Card>
    )
  }

  const getSelectedLessonIds = (versionId: string): string[] => selectedLessonsByVersion[versionId] ?? initialSelections[versionId] ?? []

  const toggleLesson = (versionId: string, lessonId: string) => {
    const selected = new Set(getSelectedLessonIds(versionId))

    if (selected.has(lessonId)) {
      selected.delete(lessonId)
    } else {
      selected.add(lessonId)
    }

    setSelectedLessonsByVersion((current) => ({ ...current, [versionId]: Array.from(selected) }))
  }

  const handleRegenerate = async (versionId: string) => {
    const selectedLessonIds = getSelectedLessonIds(versionId)

    if (selectedLessonIds.length === 0) {
      return
    }

    setRegeneratingVersionId(versionId)
    await onRegenerate?.(versionId, selectedLessonIds)
    setRegeneratingVersionId(null)
  }

  return (
    <div className="space-y-4" aria-label="Affected modules">
      {affected.map((item) => {
        const selectedLessonIds = getSelectedLessonIds(item.version.id)
        const isRegenerating = regeneratingVersionId === item.version.id
        const status = isRegenerating ? 'Regenerating' : item.version.source_stale ? 'Stale' : 'Up-to-date'

        return (
          <Card key={item.version.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[2px] text-slate-500">Affected module</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">
                  {item.version.module_title} · v{item.version.version_number}
                </h3>
              </div>
              {statusBadge(status)}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Changed bound sections</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.affectedSectionIds.map((sectionId) => (
                    <span key={sectionId} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {sectionLabel(sectionId)}
                    </span>
                  ))}
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-slate-900">Affected lessons</legend>
                {item.affectedLessonIds.map((lessonId) => (
                  <label key={lessonId} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedLessonIds.includes(lessonId)}
                      onChange={() => toggleLesson(item.version.id, lessonId)}
                      className="h-4 w-4 rounded border-slate-300 text-redex-red focus:ring-redex-red"
                    />
                    {LESSON_LABELS[lessonId] ?? lessonId}
                  </label>
                ))}
              </fieldset>

              <Button
                type="button"
                variant="brand"
                disabled={selectedLessonIds.length === 0 || isRegenerating || !onRegenerate}
                onClick={() => void handleRegenerate(item.version.id)}
              >
                {isRegenerating ? 'Regenerating…' : 'Regenerate affected lessons'}
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
