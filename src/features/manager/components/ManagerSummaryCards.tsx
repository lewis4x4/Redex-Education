import { AlertTriangle, CheckCircle2, Clock3, Users } from 'lucide-react'

import { AdminMetricCard } from '@/features/admin/components/AdminMetricCard'
import type { TeamMemberTrainingStatus } from '../lib/teamProgress'

interface ManagerSummaryCardsProps {
  statuses: TeamMemberTrainingStatus[]
}

function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

export function ManagerSummaryCards({ statuses }: ManagerSummaryCardsProps) {
  const total = statuses.length
  const completed = statuses.filter((status) => status.status === 'completed').length
  const inProgress = statuses.filter((status) => status.status === 'in_progress').length
  const overdueOrFailed = statuses.filter((status) => status.status === 'overdue' || status.status === 'failed').length

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Manager training summary">
      <AdminMetricCard label="Team members" value={total} icon={<Users className="h-4 w-4" />} />
      <AdminMetricCard
        label="Completed"
        value={completed}
        delta={{ value: `${percent(completed, total)}% complete`, tone: 'positive' }}
        icon={<CheckCircle2 className="h-4 w-4" />}
      />
      <AdminMetricCard label="In progress" value={inProgress} icon={<Clock3 className="h-4 w-4" />} />
      <AdminMetricCard
        label="Overdue or failed"
        value={overdueOrFailed}
        delta={overdueOrFailed > 0 ? { value: 'Needs manager attention', tone: 'negative' } : { value: 'No blockers', tone: 'neutral' }}
        icon={<AlertTriangle className="h-4 w-4" />}
        variant={overdueOrFailed > 0 ? 'accent' : 'default'}
      />
    </div>
  )
}
