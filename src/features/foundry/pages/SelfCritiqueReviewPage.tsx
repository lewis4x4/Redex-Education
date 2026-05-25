import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SelfCritiquePanel } from '@/features/foundry/components/SelfCritiquePanel'
import { getCourseFoundryAiClient } from '@/features/foundry/ai'
import { DEFAULT_AI_MODULE_PREVIEW, DEFAULT_AI_SOURCE_MATERIAL } from '@/features/foundry/ai/pageInputDefaults'
import { useMockGenerationDelay } from '@/features/foundry/lib/useMockGenerationDelay'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'
import { useActorInfo } from '@/hooks/useActorInfo'

export function SelfCritiqueReviewPage() {
  const navigate = useNavigate()
  const critique = useFoundryDraftStore((state) => state.critique)
  const generatedModule = useFoundryDraftStore((state) => state.generatedModule)
  const sourceMaterial = useFoundryDraftStore((state) => state.sourceMaterial)
  const outline = useFoundryDraftStore((state) => state.outline)
  const currentDraft = useFoundryDraftStore((state) => state.currentDraft)
  const setCritique = useFoundryDraftStore((state) => state.setCritique)
  const ignoreIssue = useFoundryDraftStore((state) => state.ignoreIssue)
  const unignoreIssue = useFoundryDraftStore((state) => state.unignoreIssue)
  const actor = useActorInfo()
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const critiqueModule = () =>
    getCourseFoundryAiClient().critiqueModule({
      module: generatedModule ?? DEFAULT_AI_MODULE_PREVIEW,
      sources: sourceMaterial ?? DEFAULT_AI_SOURCE_MATERIAL,
      courseOutline: outline ?? undefined,
      generatedAssessments: {
        assessment_lesson_id: 'assessment-from-module',
        questions: generatedModule?.lessons.flatMap((lesson) => lesson.quiz_questions ?? []) ?? [],
      },
      promptIds: ['self_critique@v1'],
      learning_outcomes: currentDraft?.learning_outcomes,
    })

  const { isGenerating: isAnalyzing } = useMockGenerationDelay({
    shouldGenerate: critique === null,
    delayMs: 700,
    populate: () => {
      void critiqueModule()
        .then((report) => {
          setGenerationError(null)
          setCritique(report, actor)
        })
        .catch((error: unknown) => {
          setGenerationError(error instanceof Error ? error.message : String(error))
        })
    },
  })

  const statusMeta = useMemo(() => {
    if (critique === null) {
      return null
    }

    const hasUnignoredIssues = critique.issues.some((issue) => !issue.ignored)

    if (critique.blocks_publish) {
      return {
        label: 'Publish blocked',
        className: 'border-red-200 bg-red-50 text-red-700',
      }
    }

    if (hasUnignoredIssues) {
      return {
        label: 'Pending review',
        className: 'border-amber-200 bg-amber-50 text-amber-700',
      }
    }

    return {
      label: 'Resolved',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    }
  }, [critique])

  return (
    <section className="max-w-6xl mx-auto space-y-6 md:space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY · STEP 6</p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">AI self-critique</h1>
            <p className="text-[15px] text-slate-600 leading-[1.45]">
              The Foundry reviewed its own output and flagged issues to address before publishing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/foundry/preview"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              ← Back to module preview
            </Link>
            {statusMeta === null ? null : (
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                {statusMeta.label}
              </span>
            )}
          </div>
        </div>
      </header>

      {generationError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 shadow-sm" role="alert">
          <p className="font-semibold">We couldn't run self-critique.</p>
          <p className="mt-1 text-red-700">{generationError}</p>
          <button
            type="button"
            onClick={() => {
              setIsRetrying(true)
              void critiqueModule()
                .then((report) => {
                  setCritique(report, actor)
                  setGenerationError(null)
                })
                .catch((error: unknown) => {
                  setGenerationError(error instanceof Error ? error.message : String(error))
                })
                .finally(() => setIsRetrying(false))
            }}
            className="mt-3 inline-flex rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
            disabled={isRetrying}
          >
            {isRetrying ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      ) : critique === null ? (
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-lg font-semibold tracking-tight">Analyzing module…</p>
            <p className="text-[15px] text-slate-600 leading-[1.45]">
              The Foundry is checking for unsupported claims, weak questions, and missing references.
            </p>
            {isAnalyzing ? <div className="h-2 w-full animate-pulse rounded-full bg-slate-200" /> : null}
          </div>
        </Card>
      ) : (
        <SelfCritiquePanel
          report={critique}
          onIgnoreIssue={ignoreIssue}
          onUnignoreIssue={unignoreIssue}
          onEditIssue={() => toast.info('Manual editing is coming soon.')}
          onRegenerateAll={async () => {
            try {
              const selectedFixes = critique.issues.filter((issue) => !issue.ignored).map((issue) => issue.id)
              const regeneratedModule = await getCourseFoundryAiClient().regenerateWithFixes({
                module: generatedModule ?? DEFAULT_AI_MODULE_PREVIEW,
                critique,
                selectedFixes,
                sources: sourceMaterial ?? DEFAULT_AI_SOURCE_MATERIAL,
                learning_outcomes: currentDraft?.learning_outcomes,
              })
              useFoundryDraftStore.getState().setGeneratedModule(regeneratedModule, actor)
              setCritique({
                ...(await critiqueModule()),
                generated_at: new Date().toISOString(),
              }, actor)
              toast.success('Regenerated module with fixes')
            } catch (error) {
              setGenerationError(error instanceof Error ? error.message : String(error))
            }
          }}
        />
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/foundry/source" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
          Return to source binder
        </Link>
        <Button variant="brand" onClick={() => navigate('/admin/foundry/sidebyside')}>
          Continue → Side-by-side review
        </Button>
      </footer>
    </section>
  )
}
