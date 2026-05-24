import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAssignmentStore } from '@/features/assignments/store/assignmentStore';
import { useModuleVersionsStore } from '@/features/publishing/store/moduleVersionsStore';
import { useMyProgress } from '@/hooks/useEducation';
import { DEMO_HR_BASICS_COURSE } from '@/lib/education';
import type { Assignment, Course, Enrollment, LearnerProfile, Lesson } from '@/lib/education';
import { ArrowRight, Circle, Clock, HelpCircle, Lock } from 'lucide-react';

function Progress({ value, className }: { value: number; className?: string }) {
  const boundedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`bg-slate-200 rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={boundedValue}
      aria-label="Onboarding progress"
    >
      <div className="h-full bg-redex-red transition-all" style={{ width: `${boundedValue}%` }} />
    </div>
  );
}

const HR_BASICS_MODULE_VERSION_ID = 'module-version-hr-basics-v1';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getDueState(assignment?: Assignment): { dueInDays: number; label: string; isOverdue: boolean } {
  if (!assignment?.due_at) {
    return { dueInDays: 5, label: 'Due in 5 days', isOverdue: false };
  }

  const millisecondsUntilDue = new Date(assignment.due_at).getTime() - Date.now();
  const dueInDays = Math.max(0, Math.ceil(millisecondsUntilDue / MS_PER_DAY));
  const isOverdue = millisecondsUntilDue < 0 && assignment.status !== 'completed';

  if (isOverdue) {
    return { dueInDays, label: 'Overdue', isOverdue: true };
  }

  return {
    dueInDays,
    label: `Due in ${dueInDays} ${dueInDays === 1 ? 'day' : 'days'}`,
    isOverdue: false,
  };
}

interface LearnerDashboardPageProps {
  learner?: LearnerProfile;
  enrollment?: Enrollment & { course: Course };
  nextLesson?: Lesson | null;
  onContinue?: () => void;
  onStartJourney?: () => void;
}

export function LearnerDashboardPage({ learner, onContinue }: LearnerDashboardPageProps) {
  const { percentage, completed, total } = useMyProgress();
  const assignments = useAssignmentStore((state) => state.assignments);
  const versions = useModuleVersionsStore((state) => state.versions);
  const displayName = learner?.preferred_name ?? learner?.display_name ?? 'Learner';
  const learnerUserId = learner?.user_id ?? null;
  const learnerAssignments = useMemo(
    () => (learnerUserId ? assignments.filter((assignment) => assignment.assignee_user_id === learnerUserId) : []),
    [assignments, learnerUserId],
  );
  const primaryAssignment = useMemo(
    () =>
      learnerAssignments.find(
        (assignment) => assignment.module_version_id === HR_BASICS_MODULE_VERSION_ID && assignment.status !== 'completed',
      ) ?? learnerAssignments.find((assignment) => assignment.status !== 'completed'),
    [learnerAssignments],
  );
  const dueState = getDueState(primaryAssignment);

  const primaryVersion = useMemo(
    () => versions.find((version) => version.id === primaryAssignment?.module_version_id),
    [versions, primaryAssignment?.module_version_id],
  );

  const learningOutcomes = useMemo(() => {
    const basics = (primaryVersion?.draft_metadata?.basics ?? null) as { learning_outcomes?: string[] } | null;
    return (basics?.learning_outcomes ?? []).filter(Boolean).slice(0, 2);
  }, [primaryVersion])

  const currentAssignment = {
    title: primaryVersion?.module_title ?? DEMO_HR_BASICS_COURSE.title,
    progress: percentage,
    totalLessons: total,
    completedLessons: completed,
    estimatedMinutesLeft: Math.max(0, Math.round(DEMO_HR_BASICS_COURSE.estimated_minutes * ((100 - percentage) / 100))),
    dueInDays: dueState.dueInDays,
    dueLabel: dueState.label,
    isOverdue: dueState.isOverdue,
  };
  const progressValueClass = currentAssignment.progress > 0 ? 'text-redex-red' : 'text-slate-500';

  const progressItems = learnerAssignments.map((assignment) => {
    const version = versions.find((item) => item.id === assignment.module_version_id)
    const statusLabel =
      assignment.status === 'completed' ? 'Complete' : assignment.status === 'in_progress' ? 'In progress' : 'Not started'

    return {
      id: assignment.id,
      title: version?.module_title ?? 'Assigned module',
      statusLabel,
    }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">YOUR LEARNING DASHBOARD</p>
        <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">Good morning, {displayName}. 👋</h1>
        <p className="text-slate-600 mt-2">Here's what you need to focus on today.</p>
      </div>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-md">
        <CardHeader className="p-6 pb-4 md:p-8 md:pb-4">
          <CardTitle className="flex items-start justify-between gap-4 text-lg md:text-xl">
            <span>Continue where you left off</span>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
                currentAssignment.isOverdue ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500'
              }`}
            >
              {currentAssignment.dueLabel}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6 pt-0 md:p-8 md:pt-0">
          <div>
            <div className="font-medium text-lg">{currentAssignment.title}</div>
            <div className="text-sm text-slate-600 mt-1">
              {currentAssignment.completedLessons} of {currentAssignment.totalLessons} lessons complete • {currentAssignment.progress}%
            </div>
          </div>

          {learningOutcomes.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">What you'll learn</p>
              <ul className="space-y-1 text-sm text-slate-700">
                {learningOutcomes.map((outcome) => (
                  <li key={outcome}>• {outcome}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={currentAssignment.progress} className="h-3" />
            </div>
            <div className={`text-sm font-medium ${progressValueClass}`}>{currentAssignment.progress}%</div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4" />
            <span>~{currentAssignment.estimatedMinutesLeft} minutes remaining</span>
          </div>

          <div className="space-y-2 pt-2">
            <Button size="lg" className="w-full md:w-auto" variant="brand" onClick={onContinue}>
              Continue Training <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              Progress saves automatically
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Your Onboarding Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {progressItems.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {progressItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4">
                    <span>{item.title}</span>
                    <span className="flex items-center gap-2 font-medium text-slate-600">
                      <Circle className="w-4 h-4 text-slate-400" aria-hidden="true" />
                      {item.statusLabel}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">No assigned modules yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="font-medium">Your Onboarding Buddy</div>
              <div className="text-slate-600">A buddy will be assigned during your first week.</div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-redex-red/20 text-redex-red hover:bg-redex-red/5 hover:text-redex-red"
                disabled
                aria-describedby="buddy-contact-status"
              >
                Message buddy
              </Button>
            </div>
            <div id="buddy-contact-status" className="text-xs text-slate-500">
              Messaging will connect to People Ops in a later release. Average response time target: under 2 hours during business days.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
