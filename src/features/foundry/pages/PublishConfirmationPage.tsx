import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FoundryStepper } from '@/features/foundry/components/FoundryStepper'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'
import { useModuleVersionsStore } from '@/features/publishing/store/moduleVersionsStore'
import { useActorInfo } from '@/hooks/useActorInfo'

function formatPublishedAt(value: string | null) {
  if (value === null) {
    return null
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
  const lessonReviews = useFoundryDraftStore((state) => state.lessonReviews)
  const publishedAt = useFoundryDraftStore((state) => state.publishedAt)
  const resetFoundryDraft = useFoundryDraftStore((state) => state.resetFoundryDraft)
  const seedDraftFromModuleVersion = useFoundryDraftStore((state) => state.seedDraftFromModuleVersion)
  const versions = useModuleVersionsStore((state) => state.versions)
  const forkNewDraftVersion = useModuleVersionsStore((state) => state.forkNewDraftVersion)
  const getLatestPublishedVersion = useModuleVersionsStore((state) => state.getLatestPublishedVersion)
  const actor = useActorInfo()
  const [isExitingPage, setIsExitingPage] = useState(false)

  const hasAnyFoundryData = currentDraft !== null || generatedModule !== null || lessonReviews.length > 0 || publishedAt !== null

  useEffect(() => {
    // Builder-I hook pending: replace this inline prerequisite redirect with useDraftRedirect('blockers').
    if (!isExitingPage && hasAnyFoundryData && lessonReviews.length === 0) {
      navigate('/admin/foundry/blockers', { replace: true })
    }
  }, [hasAnyFoundryData, isExitingPage, lessonReviews.length, navigate])

  const moduleTitle = currentDraft?.title || generatedModule?.module_title
  const moduleId =
    currentDraft?.module_id ?? versions.find((version) => version.module_title === moduleTitle && version.status === 'published')?.module_id
  const publishedTimestamp = formatPublishedAt(publishedAt)

  const learningOutcomes =
    (((currentDraft as unknown as { learning_outcomes?: Array<string | { id?: string; text?: string }> } | null)?.learning_outcomes ?? [])
      .map((outcome) => {
        if (typeof outcome === 'string') {
          return outcome
        }

        return typeof outcome.text === 'string' ? outcome.text : ''
      })
      .filter(Boolean)
      .slice(0, 3)) as string[]

  const handleEditNewVersion = () => {
    if (!moduleId) {
      return
    }

    const latestPublishedVersion = getLatestPublishedVersion(moduleId)

    if (!latestPublishedVersion) {
      return
    }

    setIsExitingPage(true)
    const forkedVersion = forkNewDraftVersion(latestPublishedVersion.id)
    resetFoundryDraft()
    seedDraftFromModuleVersion(forkedVersion, actor)
    navigate('/admin/foundry/start')
  }

  if (!moduleTitle || !publishedTimestamp) {
    return (
      <section className="mx-auto max-w-4xl space-y-6 md:space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Module published</h1>
        </header>
        <FoundryStepper />
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[15px] leading-[1.45] text-slate-600">No published module to celebrate.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/admin')}>
            Back to dashboard
          </Button>
        </Card>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6 md:space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Module published</h1>
        <p className="text-[15px] leading-[1.45] text-slate-600">
          The Foundry flow is complete. This module is approved and ready for admin follow-through.
        </p>
      </header>

      <FoundryStepper />

      <Card className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-5">
          <p className="text-sm font-semibold uppercase tracking-[2px] text-emerald-700">Published module</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{moduleTitle}</h2>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Published at</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{publishedTimestamp}</p>
          </div>

          {learningOutcomes.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-700">What learners can now do</h3>
              <ul className="space-y-1 text-sm text-slate-700">
                {learningOutcomes.map((outcome) => (
                  <li key={outcome}>• {outcome}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="text-[15px] leading-[1.55] text-slate-600">
            Nice work. The module cleared its missing-source checks and review blockers, then moved into published status.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="brand" onClick={() => navigate('/admin')}>
              Return to admin dashboard
            </Button>
            <Button variant="outline" onClick={handleEditNewVersion} disabled={!moduleId} title={!moduleId ? 'Module ID unavailable — return to dashboard and pick a module to fork.' : undefined}>
              Edit & create new version
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsExitingPage(true)
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
