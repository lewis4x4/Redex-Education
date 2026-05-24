import { type PublishedModuleRecord } from '@/features/publishing/store/publishedModulesStore'
import type { AssignmentWithNames } from '@/integrations/supabase/queries/assignments'
import type { Assignment, Role } from '@/types/training'
import { useAssignmentAdmin } from '../hooks/useAssignmentAdmin'
import { COHORTS } from '../lib/cohorts'

const STATUS_LABELS: Record<Assignment['status'], string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  overdue: 'Overdue',
}

const STATUS_CLASSES: Record<Assignment['status'], string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  in_progress: 'border-blue-200 bg-blue-50 text-blue-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  overdue: 'border-red-200 bg-red-50 text-red-700',
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'All admins',
  foundry_author: 'All foundry authors',
  learner: 'All learners',
  manager: 'All managers',
}

function formatDateTime(value?: string): string {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function isPastDue(assignment: Assignment): boolean {
  if (!assignment.due_at || assignment.status === 'completed') {
    return false
  }

  return new Date(assignment.due_at).getTime() < Date.now()
}

function getModuleLabel(
  moduleVersionId: string,
  publishedModules: PublishedModuleRecord[],
): string {
  return publishedModules.find((module) => module.module_version_id === moduleVersionId)?.title ?? moduleVersionId
}

function getAssigneeLabel(assignment: AssignmentWithNames): string {
  if (assignment.assignee_user_id) {
    return assignment.assignee_display_name ?? assignment.assignee_user_id
  }

  if (assignment.assignee_role) {
    const cohort = COHORTS.find((candidate) => candidate.role === assignment.assignee_role)
    return cohort?.label ?? ROLE_LABELS[assignment.assignee_role]
  }

  return 'Unassigned'
}

export function AssignedUsersTable() {
  const { assignments, publishedModules } = useAssignmentAdmin()
  const sortedAssignments = [...assignments].sort(
    (left, right) => new Date(right.assigned_at).getTime() - new Date(left.assigned_at).getTime(),
  )

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Current assignments</h2>
        <p className="mt-1 text-sm text-slate-600">All active and completed assignments.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm" aria-label="Current assignments">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3" scope="col">Learner / Cohort</th>
              <th className="px-5 py-3" scope="col">Module</th>
              <th className="px-5 py-3" scope="col">Status</th>
              <th className="px-5 py-3" scope="col">Assigned date</th>
              <th className="px-5 py-3" scope="col">Due date</th>
              <th className="px-5 py-3" scope="col">Assigned by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedAssignments.map((assignment) => {
              const pastDue = isPastDue(assignment)

              return (
                <tr key={assignment.id}>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">{getAssigneeLabel(assignment)}</td>
                  <td className="px-5 py-4 text-slate-700">
                    {getModuleLabel(assignment.module_version_id, publishedModules)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[assignment.status]}`}>
                      {STATUS_LABELS[assignment.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDateTime(assignment.assigned_at)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    <div className="flex flex-col gap-1">
                      <span>{formatDateTime(assignment.due_at)}</span>
                      {pastDue ? (
                        <span className="inline-flex w-fit rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Overdue
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {assignment.assigned_by_display_name ?? assignment.assigned_by}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
