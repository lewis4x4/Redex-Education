import { cn } from '@/lib/utils'
import type { TeamMemberTrainingStatus, TeamTrainingStatus } from '../lib/teamProgress'

interface TeamTrainingTableProps {
  statuses: TeamMemberTrainingStatus[]
  managerName?: string
}

const STATUS_LABELS: Record<TeamTrainingStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  overdue: 'Overdue',
  failed: 'Failed',
}

const STATUS_CLASSES: Record<TeamTrainingStatus, string> = {
  not_started: 'border-slate-200 bg-slate-50 text-slate-700',
  in_progress: 'border-blue-200 bg-blue-50 text-blue-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  overdue: 'border-red-200 bg-red-50 text-red-700',
  failed: 'border-rose-200 bg-rose-50 text-rose-700',
}

const STATUS_SORT_WEIGHT: Record<TeamTrainingStatus, number> = {
  overdue: 0,
  failed: 1,
  not_started: 2,
  in_progress: 3,
  completed: 4,
}

function formatDate(value?: string): string {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function getDueSortValue(value?: string): number {
  return value ? new Date(value).getTime() : Number.POSITIVE_INFINITY
}

function sortStatuses(statuses: TeamMemberTrainingStatus[]): TeamMemberTrainingStatus[] {
  return [...statuses].sort((left, right) => {
    const statusDiff = STATUS_SORT_WEIGHT[left.status] - STATUS_SORT_WEIGHT[right.status]
    if (statusDiff !== 0) {
      return statusDiff
    }

    const dueDiff = getDueSortValue(left.due_at) - getDueSortValue(right.due_at)
    if (dueDiff !== 0) {
      return dueDiff
    }

    return left.name.localeCompare(right.name)
  })
}

export function TeamTrainingTable({ statuses, managerName = 'your manager' }: TeamTrainingTableProps) {
  const sortedStatuses = sortStatuses(statuses)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Team training status</h2>
        <p className="mt-1 text-sm text-slate-600">Assigned HR Basics progress for {managerName}'s direct reports.</p>
      </div>

      {sortedStatuses.length === 0 ? (
        <div className="px-5 py-10 text-sm text-slate-600">No team members match this filter.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm" aria-label="Team training status">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3" scope="col">Name</th>
                <th className="px-5 py-3" scope="col">Role</th>
                <th className="px-5 py-3" scope="col">Module</th>
                <th className="px-5 py-3" scope="col">Status</th>
                <th className="px-5 py-3" scope="col">Progress</th>
                <th className="px-5 py-3" scope="col">Score</th>
                <th className="px-5 py-3" scope="col">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sortedStatuses.map((status) => (
                <tr key={status.user_id}>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">{status.name}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">{status.role_label}</td>
                  <td className="px-5 py-4 text-slate-700">{status.module_title ?? '—'}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', STATUS_CLASSES[status.status])}>
                      {STATUS_LABELS[status.status]}
                    </span>
                  </td>
                  <td className="min-w-40 px-5 py-4 text-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                        <div className="h-full rounded-full bg-redex-red" style={{ width: `${status.progress_percentage}%` }} />
                      </div>
                      <span className="tabular-nums">{status.progress_percentage}%</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 tabular-nums text-slate-600">
                    {status.score_percent !== undefined ? `${status.score_percent}%` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    <div className="flex flex-col gap-1">
                      <span>{formatDate(status.due_at)}</span>
                      {status.status === 'overdue' ? (
                        <span className="inline-flex w-fit rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Overdue
                        </span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
