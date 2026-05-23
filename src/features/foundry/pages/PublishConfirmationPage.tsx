import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'

function formatPublishedAt(value: string | null) {
  if (value === null) {
    return 'Publish timestamp pending'
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function PublishConfirmationPage() {
  const navigate = useNavigate()
  const currentDraft = useFoundryDraftStore((state) => state.currentDraft)
  const generatedModule = useFoundryDraftStore((state) => state.generatedModule)
  const publishedAt = useFoundryDraftStore((state) => state.publishedAt)
  const resetFoundryDraft = useFoundryDraftStore((state) => state.resetFoundryDraft)

  const moduleTitle = currentDraft?.title || generatedModule?.module_title || 'HR Basics at Redex'

  return (
    <section className="mx-auto max-w-4xl space-y-6 md:space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Module published</h1>
        <p className="text-[15px] leading-[1.45] text-slate-600">
          The Foundry flow is complete. This HR onboarding module is approved and ready for admin follow-through.
        </p>
      </header>

      <Card className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-5">
          <p className="text-sm font-semibold uppercase tracking-[2px] text-emerald-700">Published module</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{moduleTitle}</h2>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Published at</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{formatPublishedAt(publishedAt)}</p>
          </div>

          <p className="text-[15px] leading-[1.55] text-slate-600">
            Nice work. The module cleared its missing-source checks and review blockers, then moved into published status
            with a clean audit trail for HR admin review.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="brand" onClick={() => navigate('/admin')}>
              Return to admin dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetFoundryDraft()
                navigate('/admin/foundry/start')
              }}
            >
              Start a new module
            </Button>
          </div>
        </div>
      </Card>
    </section>
  )
}
