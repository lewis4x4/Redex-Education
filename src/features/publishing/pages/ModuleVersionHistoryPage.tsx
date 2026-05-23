import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ModuleStateBadge } from '@/features/foundry/components/ModuleStateBadge'
import type { ModuleApprovalState } from '@/features/publishing/lib/moduleStates'
import { getCompletedLearnersForVersion } from '@/features/publishing/lib/versionCompletions'
import { useModuleVersionsStore } from '@/features/publishing/store/moduleVersionsStore'
import { useAssignmentStore } from '@/features/assignments/store/assignmentStore'
import { useAssessmentAttemptStore } from '@/features/progress/store/assessmentAttemptStore'
import { MOCK_ORG_PEOPLE } from '@/lib/education'
import type { ModuleVersion } from '@/lib/education'

function formatDate(value: string | undefined): string {
  if (!value) {
    return 'Not published yet'
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function statusToApprovalState(status: ModuleVersion['status']): ModuleApprovalState {
  if (status === 'in_review') {
    return 'needs_review'
  }

  return status
}

function personName(userId: string | undefined): string {
  if (!userId) {
    return 'Approval pending'
  }

  return MOCK_ORG_PEOPLE.find((person) => person.id === userId)?.display_name ?? userId
}

function getLatestVersionId(versions: ModuleVersion[]): string | undefined {
  return [...versions].sort((a, b) => b.version_number - a.version_number)[0]?.id
}

export function ModuleVersionHistoryPage() {
  const { moduleId = '' } = useParams<{ moduleId: string }>()
  const allVersions = useModuleVersionsStore((state) => state.versions)
  const assignments = useAssignmentStore((state) => state.assignments)
  const attempts = useAssessmentAttemptStore((state) => state.attempts)
  const [expandedVersionIds, setExpandedVersionIds] = useState<Set<string>>(new Set())

  const versions = useMemo(
    () =>
      [...allVersions]
        .filter((version) => version.module_id === moduleId)
        .sort((a, b) => {
          if (a.version_number !== b.version_number) {
            return b.version_number - a.version_number
          }

          return b.created_at.localeCompare(a.created_at)
        }),
    [allVersions, moduleId],
  )
  const latestVersionId = getLatestVersionId(versions)
  const moduleTitle = versions[0]?.module_title ?? 'Module'
  const versionLearners = useMemo(
    () =>
      new Map(
        versions.map((version) => [
          version.id,
          getCompletedLearnersForVersion({
            versionId: version.id,
            assignments,
            attempts,
          }),
        ]),
      ),
    [assignments, attempts, versions],
  )

  const toggleVersion = (versionId: string) => {
    setExpandedVersionIds((current) => {
      const next = new Set(current)

      if (next.has(versionId)) {
        next.delete(versionId)
      } else {
        next.add(versionId)
      }

      return next
    })
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 md:space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">Version history</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{moduleTitle}</h1>
            <p className="mt-2 text-[15px] leading-[1.45] text-slate-600">
              Published versions stay immutable while new edits start as draft versions.
            </p>
          </div>
          <Link className="text-sm font-semibold text-redex-red hover:underline" to="/admin">
            Back to admin dashboard
          </Link>
        </div>
      </header>

      {versions.length === 0 ? (
        <Card className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">No versions yet</h2>
          <p className="mt-2 text-sm text-slate-600">Publish a module to start tracking version history.</p>
        </Card>
      ) : (
        <div className="space-y-4" aria-label="Module versions">
          {versions.map((version) => {
            const learners = versionLearners.get(version.id) ?? []
            const isExpanded = expandedVersionIds.has(version.id)
            const isLatest = version.id === latestVersionId

            return (
              <Card key={version.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold tracking-tight text-slate-900">v{version.version_number}</h2>
                      {isLatest ? (
                        <span className="rounded-full bg-redex-red/[0.08] px-2.5 py-1 text-xs font-semibold text-redex-red">
                          Latest
                        </span>
                      ) : null}
                      <ModuleStateBadge state={statusToApprovalState(version.status)} />
                      {version.source_stale ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          Stale source
                        </span>
                      ) : null}
                    </div>
                    {version.source_stale ? (
                      <Link className="inline-flex text-sm font-semibold text-redex-red hover:underline" to="/admin/source-impact">
                        Review source impact →
                      </Link>
                    ) : null}
                    <dl className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <dt className="font-semibold text-slate-900">Published</dt>
                        <dd>{formatDate(version.published_at)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-900">Approved by</dt>
                        <dd>{personName(version.approved_by ?? version.published_by)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-900">Source binder version</dt>
                        <dd>{version.source_binder_version ?? 'Not linked'}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-900">Assessment version</dt>
                        <dd>{version.assessment_version ?? 'Not linked'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:min-w-56">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed by</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{learners.length}</p>
                    <Button
                      className="mt-3 w-full justify-center"
                      variant="outline"
                      onClick={() => toggleVersion(version.id)}
                    >
                      {isExpanded ? 'Hide learners' : 'Show learners'}
                    </Button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                    {learners.length > 0 ? (
                      <ul className="space-y-2" aria-label={`Learners completed v${version.version_number}`}>
                        {learners.map((learnerId) => (
                          <li key={learnerId} className="text-sm font-medium text-slate-700">
                            {personName(learnerId)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">No learners have completed this version yet.</p>
                    )}
                  </div>
                ) : null}
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
