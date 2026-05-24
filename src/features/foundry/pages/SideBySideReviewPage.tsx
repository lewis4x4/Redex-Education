import { useEffect, useMemo, useState } from 'react'
import { AlertOctagon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  CONFIDENCE_LABELS,
  REVIEW_STATUS_LABELS,
  type GeneratedLessonContent,
  type LessonConfidenceLevel,
  type LessonReviewItem,
} from '@/lib/education'
import { GeneratedSourceCompare } from '@/features/foundry/components/GeneratedSourceCompare'
import { ReviewActionBar } from '@/features/foundry/components/ReviewActionBar'
import { getCourseFoundryAiMode, getCourseFoundryInitialLessonReviews } from '@/features/foundry/ai'
import { useMockGenerationDelay } from '@/features/foundry/lib/useMockGenerationDelay'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'

const CONFIDENCE_DOT_CLASS: Record<LessonConfidenceLevel, string> = {
  high: 'bg-emerald-500',
  medium: 'bg-amber-500',
  low: 'bg-slate-400',
  unsupported: 'bg-red-500',
}

const STATUS_CLASS: Record<LessonReviewItem['status'], string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  needs_regeneration: 'border-red-200 bg-red-50 text-red-700',
}

function lessonKey(review: LessonReviewItem) {
  return `${review.module_index}-${review.lesson_index}`
}

function generatedContentFor(review: LessonReviewItem) {
  const generatedModule = useFoundryDraftStore.getState().generatedModule
  const matchedLesson = generatedModule?.lessons.find(
    (lesson) => lesson.lesson_index === review.lesson_index && lesson.module_index === review.module_index,
  )

  if (!matchedLesson) {
    return {
      body_markdown: `Generated preview unavailable for “${review.lesson_title}”.`,
      quiz_questions: undefined,
      acknowledgment_text: undefined,
      lesson_type: 'text' as GeneratedLessonContent['lesson_type'],
    }
  }

  return {
    body_markdown: matchedLesson.body_markdown,
    quiz_questions: matchedLesson.quiz_questions,
    acknowledgment_text: matchedLesson.acknowledgment_text,
    lesson_type: matchedLesson.lesson_type,
  }
}

export function SideBySideReviewPage() {
  const navigate = useNavigate()
  const lessonReviews = useFoundryDraftStore((state) => state.lessonReviews)
  const setLessonReviews = useFoundryDraftStore((state) => state.setLessonReviews)
  const approveLessonReview = useFoundryDraftStore((state) => state.approveLessonReview)
  const rejectLessonReview = useFoundryDraftStore((state) => state.rejectLessonReview)
  const isPublishBlocked = useFoundryDraftStore((state) => state.isPublishBlocked)
  const generatedModule = useFoundryDraftStore((state) => state.generatedModule)

  const [selectedLessonKey, setSelectedLessonKey] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)

  useMockGenerationDelay({
    shouldGenerate: getCourseFoundryAiMode() !== 'real' && lessonReviews.length === 0,
    delayMs: 500,
    populate: () => {
      void getCourseFoundryInitialLessonReviews()
        .then(setLessonReviews)
        .catch((error: unknown) => setGenerationError(error instanceof Error ? error.message : String(error)))
    },
  })

  useEffect(() => {
    if (lessonReviews.length > 0 || !generatedModule?.lessons.length) {
      return
    }

    setLessonReviews(
      generatedModule.lessons.map((lesson) => ({
        lesson_index: lesson.lesson_index,
        module_index: lesson.module_index,
        lesson_title: lesson.title,
        confidence:
          lesson.status === 'ready_for_approval' ? 'high' : lesson.status === 'unsupported_claim' ? 'unsupported' : 'medium',
        has_unsupported_claim: lesson.status === 'unsupported_claim',
        unsupported_note: lesson.status_note,
        status: 'pending',
        source_excerpts: [],
      })),
    )
  }, [generatedModule, lessonReviews.length, setLessonReviews])

  const selectedReview = useMemo(() => {
    if (lessonReviews.length === 0) {
      return null
    }

    return lessonReviews.find((review) => lessonKey(review) === selectedLessonKey) ?? lessonReviews[0] ?? null
  }, [lessonReviews, selectedLessonKey])

  const activeLessonKey = selectedReview ? lessonKey(selectedReview) : null

  const summary = useMemo(() => {
    const approved = lessonReviews.filter((review) => review.status === 'approved').length
    const pending = lessonReviews.filter((review) => review.status === 'pending').length
    const needsRegeneration = lessonReviews.filter((review) => review.status === 'needs_regeneration').length

    return { approved, pending, needsRegeneration }
  }, [lessonReviews])

  return (
    <section className="max-w-7xl mx-auto space-y-6 md:space-y-8">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY · STEP 7</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Side-by-side review</h1>
        <p className="text-[15px] text-slate-600 leading-[1.45]">
          Compare each generated lesson with its source material. Approve lesson-by-lesson before publishing.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/admin/foundry/critique" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
            ← Back to self-critique
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              {summary.approved} approved
            </span>
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
              {summary.pending} pending
            </span>
            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700">
              {summary.needsRegeneration} need regeneration
            </span>
          </div>
        </div>
      </header>

      {isPublishBlocked() ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm">
          <p className="inline-flex items-center gap-2 text-sm font-semibold">
            <AlertOctagon className="h-4 w-4" aria-hidden="true" />
            🚫 Publish blocked — Resolve unsupported claims before publishing
          </p>
        </div>
      ) : null}

      {generationError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 shadow-sm" role="alert">
          <p className="font-semibold">We couldn't load review data.</p>
          <p className="mt-1 text-red-700">{generationError}</p>
          <button
            type="button"
            onClick={() => {
              setGenerationError(null)
              void getCourseFoundryInitialLessonReviews()
                .then(setLessonReviews)
                .catch((error: unknown) => setGenerationError(error instanceof Error ? error.message : String(error)))
            }}
            className="mt-3 inline-flex rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      ) : selectedReview === null ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[15px] text-slate-600 leading-[1.45]">Loading review data…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              {lessonReviews.map((review) => {
                const isSelected = activeLessonKey === lessonKey(review)

                return (
                  <button
                    key={lessonKey(review)}
                    type="button"
                    onClick={() => setSelectedLessonKey(lessonKey(review))}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-redex-red/30 bg-redex-red/[0.06]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{review.lesson_title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold ${STATUS_CLASS[review.status]}`}
                      >
                        {REVIEW_STATUS_LABELS[review.status]}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                        <span className={`h-2 w-2 rounded-full ${CONFIDENCE_DOT_CLASS[review.confidence]}`} aria-hidden="true" />
                        {CONFIDENCE_LABELS[review.confidence]}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          <div className="space-y-4 lg:col-span-9">
            <GeneratedSourceCompare review={selectedReview} generatedContent={generatedContentFor(selectedReview)} />
            <ReviewActionBar
              status={selectedReview.status}
              onApprove={() => {
                approveLessonReview(selectedReview.lesson_index, selectedReview.module_index)
                toast.success('Lesson approved')
              }}
              onRequestRegeneration={() => {
                rejectLessonReview(selectedReview.lesson_index, selectedReview.module_index)
                toast.info('Regeneration requested')
              }}
            />
          </div>
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/foundry/source" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
          Return to source binder
        </Link>
        <Button variant="brand" onClick={() => navigate('/admin/foundry/blockers')}>
          Continue → Resolve blockers
        </Button>
      </footer>
    </section>
  )
}
