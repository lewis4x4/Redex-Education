import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GeneratedLessonPreview } from '@/features/foundry/components/GeneratedLessonPreview'
import { GenerationStatusBadge } from '@/features/foundry/components/GenerationStatusBadge'
import { MOCK_GENERATED_MODULE } from '@/features/foundry/data/mockGeneratedModule'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'
import type { LessonGenerationStatus } from '@/lib/education'

const STATUS_ORDER: LessonGenerationStatus[] = [
  'draft',
  'needs_review',
  'unsupported_claim',
  'missing_source',
  'ready_for_approval',
]

export function ModuleGenerationPreviewPage() {
  const generatedModule = useFoundryDraftStore((state) => state.generatedModule)
  const updateLessonStatus = useFoundryDraftStore((state) => state.updateLessonStatus)
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0)

  const statusCounts = useMemo(() => {
    if (generatedModule === null) {
      return []
    }

    const counts = generatedModule.lessons.reduce(
      (acc, lesson) => ({ ...acc, [lesson.status]: acc[lesson.status] + 1 }),
      {
        draft: 0,
        needs_review: 0,
        unsupported_claim: 0,
        missing_source: 0,
        ready_for_approval: 0,
      } as Record<LessonGenerationStatus, number>
    )

    return STATUS_ORDER.filter((status) => counts[status] > 0).map((status) => ({
      status,
      count: counts[status],
    }))
  }, [generatedModule])

  const selectedLesson = generatedModule?.lessons[selectedLessonIndex] ?? null

  return (
    <section className="max-w-7xl mx-auto space-y-6 md:space-y-8">
      <header className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY · STEP 5</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Review generated module</h1>
          <p className="text-[15px] text-slate-600 leading-[1.45]">
            The Foundry has drafted every lesson and assessment from your approved outline + source library. Review each
            lesson before publishing.
          </p>
        </div>
      </header>

      <Card className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <p className="flex items-start gap-2 text-[15px] text-amber-900 leading-[1.45]">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-semibold">PREVIEW ONLY — This module is NOT published.</span> Review and approve each
            lesson before publishing.
          </span>
        </p>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="brand"
          onClick={() => {
            setSelectedLessonIndex(0)
            useFoundryDraftStore.getState().setGeneratedModule(MOCK_GENERATED_MODULE)
            toast.success('Generated 8 lessons')
          }}
        >
          ✨ Generate Full Module in One Click (Preview Mode)
        </Button>
      </div>

      {generatedModule === null ? (
        <Card className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="space-y-2">
            <p className="text-2xl leading-none text-slate-400">↑</p>
            <h2 className="text-lg font-semibold tracking-tight">No generated module yet</h2>
            <p className="text-[15px] text-slate-600 leading-[1.45]">
              Click the Magic Button above to generate all lessons in preview mode.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {statusCounts.map(({ status, count }) => (
              <span
                key={status}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
              >
                <span>{count}</span>
                <GenerationStatusBadge status={status} />
              </span>
            ))}
          </div>

          <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
            <aside className="lg:col-span-3">
              <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Lessons</p>
                <div className="space-y-2">
                  {generatedModule.lessons.map((lesson, index) => (
                    <button
                      key={`${lesson.module_index}-${lesson.lesson_index}-${lesson.title}`}
                      type="button"
                      onClick={() => setSelectedLessonIndex(index)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedLessonIndex === index
                          ? 'border-redex-red bg-redex-red/5'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-900">{lesson.title}</p>
                      <div className="mt-2">
                        <GenerationStatusBadge status={lesson.status} note={lesson.status_note} />
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </aside>

            <div className="lg:col-span-9">
              {selectedLesson === null ? null : (
                <GeneratedLessonPreview
                  lesson={selectedLesson}
                  onApprove={() =>
                    updateLessonStatus(selectedLesson.lesson_index, selectedLesson.module_index, 'ready_for_approval')
                  }
                  onMarkNeedsReview={() =>
                    updateLessonStatus(selectedLesson.lesson_index, selectedLesson.module_index, 'needs_review')
                  }
                />
              )}
            </div>
          </div>
        </>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/foundry/outline" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
          ← Back to outline
        </Link>
        <Button variant="brand" disabled title="Coming in Slice 3.3 — AI self-critique">
          Continue → Self-critique
        </Button>
      </footer>
    </section>
  )
}
