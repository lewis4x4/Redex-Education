import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LearnerProfile, Enrollment, Course, Lesson } from '@/lib/education';
import { useMyProgress } from '@/hooks/useEducation';

// Temporary inline progress
function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`bg-[#e5e7eb] rounded-full overflow-hidden ${className}`}>
      <div 
        className="h-full bg-redex-red transition-all" 
        style={{ width: `${value}%` }} 
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
import { Clock, HelpCircle, ArrowRight } from 'lucide-react';

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
    title: 'Redex Academy Orientation',
    progress: percentage,
    totalLessons: total,
    completedLessons: completed,
    estimatedMinutesLeft: Math.max(5, Math.round((100 - percentage) * 0.25)),
    dueInDays: 5,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Good morning, {displayName}.</h1>
        <p className="text-[#6b7280] mt-1">Here's what you need to focus on today.</p>
      </div>

      {/* Primary CTA Card - What do I need to do now? */}
      <Card className="border-redex-red/20 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Continue where you left off</span>
            <span className="text-sm font-normal text-[#6b7280]">Due in {currentAssignment.dueInDays} days</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="font-medium text-lg">{currentAssignment.title}</div>
            <div className="text-sm text-[#6b7280] mt-1">
              {currentAssignment.completedLessons} of {currentAssignment.totalLessons} lessons complete • {currentAssignment.progress}%
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={currentAssignment.progress} className="h-2" />
            </div>
            <div className="text-sm font-medium text-redex-red">{currentAssignment.progress}%</div>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#6b7280]">
            <Clock className="w-4 h-4" />
            <span>~{currentAssignment.estimatedMinutesLeft} minutes remaining</span>
          </div>

          <Button 
            size="lg" 
            className="w-full md:w-auto bg-redex-red hover:bg-redex-red-hover mt-2"
            onClick={onContinue}
          >
            Continue Training <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Two column: Progress + Help */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* How far along am I? */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Onboarding Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>HR Basics</span>
                <span className="text-[#16a34a] font-medium">Complete</span>
              </div>
              <div className="flex justify-between">
                <span>Systems & Tools</span>
                <span className="text-[#f59e0b] font-medium">In Progress</span>
              </div>
              <div className="flex justify-between text-[#6b7280]">
                <span>Safety & Compliance</span>
                <span>Not started</span>
              </div>
              <div className="flex justify-between text-[#6b7280]">
                <span>Role-specific Training</span>
                <span>Not started</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Who can help? */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="font-medium">Your Onboarding Buddy</div>
              <div className="text-[#6b7280]">Sarah Chen • People Ops</div>
              <Button variant="outline" size="sm" className="mt-2">Message Sarah</Button>
            </div>
            <div className="text-xs text-[#6b7280]">
              Average response time: under 2 hours during business days.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
