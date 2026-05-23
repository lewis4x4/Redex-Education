import { useMemo, useState } from 'react'

import { ManagerStatusFilter, type StatusFilter } from '../components/ManagerStatusFilter'
import { ManagerSummaryCards } from '../components/ManagerSummaryCards'
import { TeamTrainingTable } from '../components/TeamTrainingTable'
import { computeTeamProgress, type TeamMemberTrainingStatus } from '../lib/teamProgress'
import { useAssignmentStore } from '@/features/assignments/store/assignmentStore'
import { useAssessmentAttemptStore } from '@/features/progress/store/assessmentAttemptStore'
import { useEducation } from '@/hooks/useEducation'
import { DEMO_HR_BASICS_MODULE, MOCK_LEARNER_MARCUS, MOCK_MANAGER_USER } from '@/lib/education'
import { getDirectReports } from '@/lib/education/mockManagerReports'
import type { LessonProgress } from '@/types/training'

function getFilterCounts(statuses: TeamMemberTrainingStatus[]): Record<StatusFilter, number> {
  return {
    all: statuses.length,
    incomplete: statuses.filter((status) => status.status !== 'completed').length,
    overdue: statuses.filter((status) => status.status === 'overdue').length,
    failed: statuses.filter((status) => status.status === 'failed').length,
    completed: statuses.filter((status) => status.status === 'completed').length,
  }
}

function filterStatuses(statuses: TeamMemberTrainingStatus[], filter: StatusFilter): TeamMemberTrainingStatus[] {
  if (filter === 'all') {
    return statuses
  }

  if (filter === 'incomplete') {
    return statuses.filter((status) => status.status !== 'completed')
  }

  return statuses.filter((status) => status.status === filter)
}

export function ManagerDashboardPage() {
  const [filter, setFilter] = useState<StatusFilter>('all')
  const assignments = useAssignmentStore((state) => state.assignments)
  const attempts = useAssessmentAttemptStore((state) => state.attempts)
  const education = useEducation()

  const managerId = MOCK_MANAGER_USER.id
  const directReports = useMemo(() => getDirectReports(managerId), [managerId])
  const currentLearnerId = education.currentEnrollment?.user_id ?? MOCK_LEARNER_MARCUS.id

  const currentLearnerLessonProgress = useMemo<LessonProgress[]>(() => {
    const enrollmentId = education.currentEnrollment?.id ?? 'enroll-marcus-hr-basics-001'

    return education.getLessonsForModule(DEMO_HR_BASICS_MODULE.id).map((lesson) => {
      const status = education.getLessonStatus(lesson.id)

      return {
        id: `manager-progress-${lesson.id}`,
        enrollment_id: enrollmentId,
        lesson_id: lesson.id,
        status,
        time_spent_seconds: 0,
        ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      }
    })
  }, [education])

  const statuses = useMemo(
    () =>
      computeTeamProgress({
        managerId,
        learners: directReports,
        assignments,
        attempts,
        currentLearnerId,
        currentLearnerLessonProgress,
      }),
    [managerId, directReports, assignments, attempts, currentLearnerId, currentLearnerLessonProgress],
  )

  const counts = useMemo(() => getFilterCounts(statuses), [statuses])
  const filteredStatuses = useMemo(() => filterStatuses(statuses, filter), [statuses, filter])

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-redex-red">Manager · Team Training</div>
        <div className="mt-3 max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Team training progress</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Sarah Chen can see each direct report's assigned HR Basics module, completion status, score, and due date.
            Manager authentication is deferred; this demo uses Sarah's mock manager profile.
          </p>
        </div>
      </section>

      {directReports.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
          No direct reports are configured for this manager yet.
        </section>
      ) : (
        <>
          <ManagerSummaryCards statuses={statuses} />
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <ManagerStatusFilter value={filter} onChange={setFilter} counts={counts} />
          </section>
          {assignments.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
              No assignments are available yet. Team members will appear here once HR Basics is assigned.
            </section>
          ) : (
            <TeamTrainingTable statuses={filteredStatuses} />
          )}
        </>
      )}
    </main>
  )
}
