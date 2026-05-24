import { AlertCircle, CheckCircle2, Eye, FileText, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { AdminMetricCard } from '@/features/admin/components/AdminMetricCard'
import { AssignmentsEntryCard } from '@/features/admin/components/AssignmentsEntryCard'
import { CourseStatusList } from '@/features/admin/components/CourseStatusList'
import { FoundryEntryCard } from '@/features/admin/components/FoundryEntryCard'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'
import { useAdminSummary } from '@/hooks/useAdminSummary'
import { useProfile } from '@/hooks/useProfile'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { summary, loading, error, refetch } = useAdminSummary()
  const displayName = profile?.display_name ?? 'Admin'
  const getModuleVersionHistoryHref = (item: { module_id: string }) => `/admin/modules/${item.module_id}/versions`
  const resumeDraft = (item: {
    module_version_id: string
    module_id: string
    title: string
    version_number: number
  }) => {
    const route = useFoundryDraftStore.getState().resumeDraftFromAdminItem({
      module_version_id: item.module_version_id,
      module_id: item.module_id,
      module_title: item.title,
      version_number: item.version_number,
    })

    navigate(route)
  }

  if (summary === null) {
    return (
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back, {displayName}</h1>
          <p className="text-sm text-slate-600">Your training operations at a glance</p>
        </header>

        {error === null ? (
          <div
            className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm"
            role="status"
            aria-live="polite"
            aria-busy={loading}
          >
            Loading dashboard…
          </div>
        ) : (
          <div
            className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 shadow-sm"
            role="alert"
          >
            <p className="font-semibold">We couldn't load your dashboard.</p>
            <p className="mt-1 text-red-700">{error.message}</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-3 inline-flex rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">REDEX AI COURSE FOUNDRY</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back, {displayName}</h1>
        <p className="text-sm text-slate-600">Your training operations at a glance</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <FoundryEntryCard onStart={() => navigate('/admin/foundry/start')} isDisabled={false} />
        <AssignmentsEntryCard onStart={() => navigate('/admin/assignments')} isDisabled={false} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard label="Drafts" value={summary.metrics.drafts} icon={<FileText className="h-4 w-4" />} />
        <AdminMetricCard
          label="Needs review"
          value={summary.metrics.needs_review}
          icon={<Eye className="h-4 w-4" />}
          variant="accent"
        />
        <AdminMetricCard label="Published" value={summary.metrics.published} icon={<CheckCircle2 className="h-4 w-4" />} />
        <AdminMetricCard
          label="Learners in progress"
          value={summary.metrics.learners_in_progress}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CourseStatusList
          title="Drafts"
          items={summary.drafts}
          getItemHref={getModuleVersionHistoryHref}
          renderItemActions={(item) => (
            <button
              type="button"
              aria-label={`Resume draft: ${item.title}`}
              onClick={() => resumeDraft(item)}
              className="rounded-md border border-redex-red/30 px-2.5 py-1 text-xs font-semibold text-redex-red hover:bg-redex-red/5"
            >
              Resume draft
            </button>
          )}
        />
        <CourseStatusList title="Needs review" items={summary.needs_review} getItemHref={getModuleVersionHistoryHref} />
      </div>

      <div className="space-y-3">
        <CourseStatusList title="Published" items={summary.published} getItemHref={getModuleVersionHistoryHref} />
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link className="inline-flex text-sm font-semibold text-redex-red hover:underline" to="/admin/source-impact">
            Source Impact Review →
          </Link>
          <Link className="inline-flex text-sm font-semibold text-redex-red hover:underline" to="/admin/audit">
            Audit log →
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="assignment-summary-heading">
        <h2 id="assignment-summary-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Assignment summary
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-redex-red/[0.08] p-2 text-redex-red" aria-hidden="true">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Active</dt>
              <dd className="text-lg font-semibold tabular-nums text-slate-900">
                {summary.assignment_summary.active_assignments}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-50 p-2 text-amber-700" aria-hidden="true">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Overdue</dt>
              <dd className="text-lg font-semibold tabular-nums text-slate-900">{summary.assignment_summary.overdue}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-50 p-2 text-emerald-700" aria-hidden="true">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Completion rate</dt>
              <dd className="text-lg font-semibold tabular-nums text-slate-900">
                {summary.assignment_summary.completion_rate_percent}%
              </dd>
            </div>
          </div>
        </dl>
      </section>
    </section>
  )
}
