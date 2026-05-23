import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMyProgress } from '@/hooks/useEducation';
import { DEMO_HR_BASICS_COURSE } from '@/lib/education';
import type { Course, Enrollment, LearnerProfile, Lesson } from '@/lib/education';
import { ArrowRight, CheckCircle2, Circle, Clock, HelpCircle, Lock } from 'lucide-react';

// Temporary inline progress
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
      <div 
        className="h-full bg-redex-red transition-all" 
        style={{ width: `${boundedValue}%` }} 
      />
    </div>
  );
}

interface LearnerDashboardPageProps {
  learner?: LearnerProfile;
  enrollment?: Enrollment & { course: Course };
  nextLesson?: Lesson | null;
  onContinue?: () => void;
  onStartJourney?: () => void;
}

/**
 * Learner Journey Dashboard - Slice 1.2 foundation
 * Answers the three core questions:
 * 1. What do I need to do now?
 * 2. How far along am I?
 * 3. Who can help me if I’m stuck?
 */
export function LearnerDashboardPage({ learner, onContinue }: LearnerDashboardPageProps) {
  const { percentage, completed, total } = useMyProgress();
  const displayName = learner?.preferred_name ?? learner?.display_name ?? 'Marcus';

  // Live data from EducationContext (Task D1)
  const currentAssignment = {
    title: DEMO_HR_BASICS_COURSE.title,
    progress: percentage,
    totalLessons: total,
    completedLessons: completed,
    estimatedMinutesLeft: Math.max(
      0,
      Math.round(DEMO_HR_BASICS_COURSE.estimated_minutes * ((100 - percentage) / 100))
    ),
    dueInDays: 5,
  };
  const progressValueClass = currentAssignment.progress > 0 ? 'text-redex-red' : 'text-slate-500';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[3px] text-redex-red">
          YOUR LEARNING DASHBOARD
        </p>
        <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
          Good morning, {displayName}. 👋
        </h1>
        <p className="text-slate-600 mt-2">Here's what you need to focus on today.</p>
      </div>

      {/* Primary CTA Card - What do I need to do now? */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-md">
        <CardHeader className="p-6 pb-4 md:p-8 md:pb-4">
          <CardTitle className="flex items-start justify-between gap-4 text-lg md:text-xl">
            <span>Continue where you left off</span>
            <span className="shrink-0 text-sm font-normal text-slate-500">
              Due in {currentAssignment.dueInDays} days
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
            <Button
              size="lg"
              className="w-full md:w-auto bg-redex-red hover:bg-redex-red-hover"
              onClick={onContinue}
            >
              Continue Training <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              Progress saves automatically
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Two column: Progress + Help */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* How far along am I? */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Your Onboarding Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between gap-4">
                <span>HR Basics</span>
                <span className="flex items-center gap-2 font-medium text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  Complete
                </span>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span>Systems & Tools</span>
                <span className="flex items-center gap-2 font-medium text-amber-600">
                  <span className="flex w-4 h-4 items-center justify-center" aria-hidden="true">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  </span>
                  In Progress
                </span>
              </li>
              <li className="flex items-center justify-between gap-4 text-slate-600">
                <span>Safety & Compliance</span>
                <span className="flex items-center gap-2 font-medium text-slate-500">
                  <Circle className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  Not started
                </span>
              </li>
              <li className="flex items-center justify-between gap-4 text-slate-600">
                <span>Role-specific Training</span>
                <span className="flex items-center gap-2 font-medium text-slate-500">
                  <Circle className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  Not started
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Who can help? */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="font-medium">Your Onboarding Buddy</div>
              <div className="text-slate-600">Sarah Chen • People Ops</div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-redex-red/20 text-redex-red hover:bg-redex-red/5 hover:text-redex-red"
                disabled
                aria-describedby="buddy-contact-status"
              >
                Message Sarah
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
