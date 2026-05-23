import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { PublishBlockerList } from '@/features/foundry/components/PublishBlockerList'
import { MOCK_PUBLISH_BLOCKERS } from '@/features/foundry/data/mockMissingSource'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'

export function PublishBlockersPage() {
  const navigate = useNavigate()

  const state = useFoundryDraftStore.getState()
  const storeBlockers = state.getPublishBlockers()
  const hasAnyFoundryData =
    state.currentDraft !== null ||
    state.sourceMaterial !== null ||
    state.critique !== null ||
    state.generatedModule !== null ||
    state.lessonReviews.length > 0

  const blockers = storeBlockers.length === 0 && !hasAnyFoundryData ? MOCK_PUBLISH_BLOCKERS : storeBlockers

  return (
    <section className="max-w-5xl mx-auto space-y-6 md:space-y-8">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY · STEP 8</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Publish blockers</h1>
        <p className="text-[15px] text-slate-600 leading-[1.45]">
          All outstanding items that prevent this module from being published.
        </p>

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
          disabled
          title={
            blockers.length > 0
              ? 'Resolve all blockers above to enable publishing'
              : 'Publishing workflow lands in Slice 7.1'
          }
        >
          Publish module
        </Button>
      </footer>
    </section>
  )
}
