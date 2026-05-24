import { CheckCircle2 } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FoundryStepper } from '@/features/foundry/components/FoundryStepper'
import { ModuleStateBadge } from '@/features/foundry/components/ModuleStateBadge'
import { PublishBlockerList } from '@/features/foundry/components/PublishBlockerList'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'
import { inferModuleState } from '@/features/publishing/lib/moduleStates'
import { useActorInfo } from '@/hooks/useActorInfo'

export function PublishBlockersPage() {
  const navigate = useNavigate()
  const actor = useActorInfo()

  const currentDraft = useFoundryDraftStore((state) => state.currentDraft)
  const sourceMaterial = useFoundryDraftStore((state) => state.sourceMaterial)
  const setupAnswers = useFoundryDraftStore((state) => state.setupAnswers)
  const critique = useFoundryDraftStore((state) => state.critique)
  const outline = useFoundryDraftStore((state) => state.outline)
  const outlineStatus = useFoundryDraftStore((state) => state.outline_status)
  const generatedModule = useFoundryDraftStore((state) => state.generatedModule)
  const lessonReviews = useFoundryDraftStore((state) => state.lessonReviews)
  const publishStatus = useFoundryDraftStore((state) => state.publishStatus)
  const setPublished = useFoundryDraftStore((state) => state.setPublished)
  const getPublishBlockers = useFoundryDraftStore((state) => state.getPublishBlockers)

  useEffect(() => {
    // Builder-I hook pending: replace this inline prerequisite redirect with useDraftRedirect('sidebyside').
    const hasAnyFoundryData =
      currentDraft !== null ||
      sourceMaterial !== null ||
      critique !== null ||
      outline !== null ||
      generatedModule !== null ||
      lessonReviews.length > 0

    if (hasAnyFoundryData && (generatedModule === null || lessonReviews.length === 0)) {
      navigate('/admin/foundry/sidebyside', { replace: true })
    }
  }, [currentDraft, sourceMaterial, critique, outline, generatedModule, lessonReviews.length, navigate])

  const storeBlockers = getPublishBlockers()
  const hasAnyFoundryData =
    currentDraft !== null ||
    sourceMaterial !== null ||
    critique !== null ||
    outline !== null ||
    generatedModule !== null ||
    lessonReviews.length > 0

  const moduleState = inferModuleState({
    currentDraft,
    sourceMaterial,
    setupAnswers,
    outline,
    outlineStatus,
    generatedModule,
    critique,
    lessonReviews,
    blockerCount: storeBlockers.length,
    publishStatus,
  })
  const canPublish = moduleState === 'approved'

  const handlePublish = () => {
    if (!canPublish) {
      return
    }

    if (setPublished(actor)) {
      navigate('/admin/foundry/published')
    }
  }

  if (!hasAnyFoundryData) {
    return (
      <section className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Publish blockers</h1>
          <p className="text-[15px] text-slate-600 leading-[1.45]">Check blockers after side-by-side review.</p>
        </header>
        <FoundryStepper />
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[15px] text-slate-600 leading-[1.45]">No active draft to check yet.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/admin/foundry/outline')}>
            Back to outline
          </Button>
        </Card>
      </section>
    )
  }

  return (
    <section className="max-w-5xl mx-auto space-y-6 md:space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY</p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Publish blockers</h1>
            <p className="text-[15px] text-slate-600 leading-[1.45]">
              All outstanding items that prevent this module from being published.
            </p>
          </div>

          <ModuleStateBadge state={moduleState} size="md" />
        </div>

        <FoundryStepper />

        <div className="flex items-center">
          <Link to="/admin/foundry/sidebyside" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
            ← Back to side-by-side review
          </Link>
        </div>
      </header>

      <PublishBlockerList blockers={storeBlockers} onResolve={(blocker) => blocker.resolve_route && navigate(blocker.resolve_route)} />

      {moduleState === 'published' ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Module published.
          </p>
          <Link to="/admin/foundry/published" className="mt-1 inline-flex text-sm font-medium underline">
            View publish confirmation
          </Link>
        </div>
      ) : moduleState === 'approved' ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Saved to your draft
          </p>
        </div>
      ) : null}

      <footer className="flex justify-end">
        <Button
          variant="brand"
          disabled={!canPublish}
          onClick={handlePublish}
          title={!canPublish ? 'Complete all approval requirements above to enable publishing' : undefined}
        >
          Publish module
        </Button>
      </footer>
    </section>
  )
}
