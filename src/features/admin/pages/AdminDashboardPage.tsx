import { AlertCircle, CheckCircle2, Eye, FileText, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { AdminMetricCard } from '@/features/admin/components/AdminMetricCard'
import { AssignmentsEntryCard } from '@/features/admin/components/AssignmentsEntryCard'
import { CourseStatusList } from '@/features/admin/components/CourseStatusList'
import { FoundryEntryCard } from '@/features/admin/components/FoundryEntryCard'
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore'
import { useAdminSummary } from '@/hooks/useAdminSummary'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function firstNameFromEmail(email: string | undefined): string | null {
  if (!email) return null
  const localPart = email.split('@')[0]?.trim()
  if (!localPart) return null
  const [firstChunk] = localPart.split(/[._-]+/)
  return firstChunk ? firstChunk.charAt(0).toUpperCase() + firstChunk.slice(1) : null
}

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile()
  const { summary, loading, error, refetch } = useAdminSummary()
  const preferredName = (profile as { preferred_name?: string } | null)?.preferred_name
  const displayName =
    preferredName ??
    (profile?.display_name?.includes(' ') ? profile.display_name.split(' ')[0] : profile?.display_name) ??
    firstNameFromEmail(user?.email) ??
    'Admin'
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
          <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">ADMIN DASHBOARD</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
            {greetingFor(new Date().getHours())}, {displayName}
          </h1>
          <p className="text-[15px] leading-[1.45] text-slate-600">Your training operations at a glance</p>
        </header>

        {error === null ? (
          <div role="status" aria-live="polite" aria-busy={loading} className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
            </div>
            <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
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
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">ADMIN DASHBOARD</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
          {greetingFor(new Date().getHours())}, {displayName}
        </h1>
        <p className="text-[15px] leading-[1.45] text-slate-600">Your training operations at a glance</p>
      </header>

      {summary.metrics.pending_generation_jobs > 0 ? (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-800"
          role="status"
          aria-live="polite"
        >
          {summary.metrics.pending_generation_jobs} module generation
          {summary.metrics.pending_generation_jobs > 1 ? 's' : ''} in progress…
        </div>
      ) : null}

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
          emptyMessage="No drafts in flight. Start a new module to see it here."
          emptyIcon={<FileText className="h-8 w-8 text-slate-400" />}
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
        <CourseStatusList
          title="Published"
          items={summary.published}
          getItemHref={getModuleVersionHistoryHref}
          emptyMessage="No published modules yet. Approved courses will appear here."
          emptyIcon={<CheckCircle2 className="h-8 w-8 text-slate-400" />}
        />
        <p className="mt-2 text-xs text-slate-500">{summary.metrics.archived} archived</p>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/source-impact"
            className="inline-flex items-center gap-1.5 rounded-md border border-redex-red/30 px-3 py-1.5 text-xs font-semibold text-redex-red hover:bg-redex-red/5"
          >
            Source Impact Review →
          </Link>
          <Link
            to="/admin/foundry/library"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Source library →
          </Link>
          <Link
            to="/admin/audit"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
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
            <Users className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <div>
              <dt className="text-xs font-medium text-slate-500">Active</dt>
              <dd className="text-lg font-semibold tabular-nums text-slate-900">
                {summary.assignment_summary.active_assignments}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-amber-700" aria-hidden="true" />
            <div>
              <dt className="text-xs font-medium text-slate-500">Overdue</dt>
              <dd className="text-lg font-semibold tabular-nums text-slate-900">{summary.assignment_summary.overdue}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <div>
              <dt className="text-xs font-medium text-slate-500">Completion rate</dt>
              <dd className="text-lg font-semibold tabular-nums text-slate-900">
                {summary.assignment_summary.completion_rate_percent === null
                  ? '—'
                  : `${summary.assignment_summary.completion_rate_percent}%`}
              </dd>
            </div>
          </div>
        </dl>
        <div className="mt-4 border-t border-slate-100 pt-3">
          <Link
            to="/admin/assignments"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Manage assignments →
          </Link>
        </div>
      </section>
    </section>
  )
}
