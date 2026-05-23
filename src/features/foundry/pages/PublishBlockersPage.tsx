import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { PublishBlockerList } from '@/features/foundry/components/PublishBlockerList'
import { MOCK_PUBLISH_BLOCKERS } from '@/features/foundry/data/mockMissingSource'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'

export function PublishBlockersPage() {
  const navigate = useNavigate()

  const currentDraft = useFoundryDraftStore((state) => state.currentDraft)
  const sourceMaterial = useFoundryDraftStore((state) => state.sourceMaterial)
  const critique = useFoundryDraftStore((state) => state.critique)
  const outline = useFoundryDraftStore((state) => state.outline)
  const generatedModule = useFoundryDraftStore((state) => state.generatedModule)
  const lessonReviews = useFoundryDraftStore((state) => state.lessonReviews)
  const publishStatus = useFoundryDraftStore((state) => state.publishStatus)
  const setPublished = useFoundryDraftStore((state) => state.setPublished)
  const getPublishBlockers = useFoundryDraftStore((state) => state.getPublishBlockers)

  const storeBlockers = getPublishBlockers()
  const hasAnyFoundryData =
    currentDraft !== null ||
    sourceMaterial !== null ||
    critique !== null ||
    outline !== null ||
    generatedModule !== null ||
    lessonReviews.length > 0

  const blockers = storeBlockers.length === 0 && !hasAnyFoundryData ? MOCK_PUBLISH_BLOCKERS : storeBlockers
  const canPublish = blockers.length === 0 && publishStatus !== 'published'

  const handlePublish = () => {
    if (!canPublish) {
      return
    }

    if (setPublished()) {
      navigate('/admin/foundry/published')
    }
  }

  return (
    <section className="max-w-5xl mx-auto space-y-6 md:space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY · STEP 8</p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Publish blockers</h1>
            <p className="text-[15px] text-slate-600 leading-[1.45]">
              All outstanding items that prevent this module from being published.
            </p>
          </div>

          {publishStatus === 'published' ? (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              ✓ Published
            </span>
          ) : null}
        </div>

        <div className="flex items-center">
          <Link
            to="/admin/foundry/sidebyside"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            ← Back to side-by-side review
          </Link>
        </div>
      </header>

      <PublishBlockerList blockers={blockers} onResolve={(blocker) => blocker.resolve_route && navigate(blocker.resolve_route)} />

      {blockers.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm">
          <p className="text-sm font-semibold">✓ Module is clear to publish.</p>
        </div>
      ) : null}

      <footer className="flex justify-end">
        <Button
          variant="brand"
          disabled={!canPublish}
          onClick={handlePublish}
          title={blockers.length > 0 ? 'Resolve all blockers above to enable publishing' : undefined}
        >
          Publish module
        </Button>
      </footer>
    </section>
  )
}
