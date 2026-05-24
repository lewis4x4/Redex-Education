import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Check, Cloud, ArrowRight } from 'lucide-react';
import type { LearnerProfile } from '@/lib/education';

/**
 * First-day Welcome Screen for Redex Academy
 * Matches the provided UI mockup (v3) for new learner "Marcus"
 * Wired in Task D1: "Start my journey" launches ModulePlayer via parent callback
 */
interface LearnerWelcomePageProps {
  learner?: LearnerProfile;
  onStartJourney?: () => void;
}

export function LearnerWelcomePage({ learner, onStartJourney }: LearnerWelcomePageProps) {
  const displayName = learner?.preferred_name ?? learner?.display_name ?? 'Learner';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Welcome Card - premium presence matching the mockup */}
      <Card className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <CardContent className="p-10 md:p-12">
          {/* Eyebrow */}
          <div className="text-redex-red font-semibold tracking-[3px] text-sm mb-3">
            WELCOME TO REDEX ACADEMY
          </div>

          {/* Greeting + intro — typography tuned for presence */}
          <h1 className="text-[34px] leading-[1.1] font-semibold tracking-[-1.75px] mb-3">
            Great to have you here, {displayName}. <span className="inline-block">👋</span>
          </h1>

          <p className="text-[15px] text-slate-600 max-w-[44ch] mb-8 leading-[1.45]">
            We're excited to have you on the team. Let's get you set up with the essentials so you can start strong.
          </p>

          {/* Progress Steps - exact hierarchy from the mockup */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-slate-500 mb-1.5">
              <div>
                <span className="font-semibold text-redex-red">Step 1: Welcome</span>
                <span className="ml-2 text-[10px] font-medium text-redex-red tracking-[0.5px]">YOU ARE HERE</span>
              </div>
              <div className="text-slate-400">Step 2: HR basics</div>
              <div className="text-slate-400">Step 3: Systems setup</div>
              <div className="text-slate-400">Step 4: Ready to start</div>
            </div>
            <div className="h-[3px] bg-slate-200 rounded-full relative">
              <div className="absolute left-0 top-0 h-[3px] w-[22%] bg-redex-red rounded-full" />
            </div>
            <div className="text-[10px] text-redex-red mt-1 font-semibold tracking-[1px]">YOU ARE HERE</div>
          </div>

          {/* Video + Benefits Row — treatment matched to the mockup */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Video card (left) */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="bg-[#1c120e] aspect-video flex items-center justify-center relative">
                <div
                  className="text-center"
                  role="img"
                  aria-label="Welcome video preview: A quick hello from our CEO. Playback is not available in this demo."
                >
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-redex-red flex items-center justify-center" aria-hidden="true">
                    <Play className="w-7 h-7 text-white ml-0.5" />
                  </div>
                  <div className="text-white font-semibold tracking-tight">A quick hello from our CEO</div>
                  <div className="text-white/60 text-xs mt-0.5">Brian Lewis, Chief Executive Officer</div>
                  <div className="mt-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-white/50">Preview only</div>
                </div>
              </div>
              <div className="h-8 bg-black/60 px-4 flex items-center justify-between text-[10px] text-white/60 tracking-wide" aria-hidden="true">
                <span>0:00 / 0:30</span>
                <span>Video preview</span>
              </div>
            </div>

            {/* Benefits (right) — clean stacked treatment */}
            <div className="space-y-5 text-[14px] pt-2">
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="leading-tight">
                  <div className="font-semibold tracking-tight">Takes about 20 minutes</div>
                  <div className="text-slate-500 text-xs">Short, focused, and easy to follow.</div>
                </div>
              </div>
              <div className="flex gap-3">
                <Cloud className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="leading-tight">
                  <div className="font-semibold tracking-tight">Your progress is saved</div>
                  <div className="text-slate-500 text-xs">Pick up right where you left off.</div>
                </div>
              </div>
              <div className="flex gap-3">
                <ArrowRight className="w-5 h-5 text-redex-red mt-0.5 flex-shrink-0" />
                <div className="leading-tight">
                  <div className="font-semibold tracking-tight">One path. Start to finish.</div>
                  <div className="text-slate-500 text-xs">No passwords. No menus. Just your personalized journey.</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA - big red button like the mockup */}
          <div className="mt-8">
            <Button 
              size="lg" 
              className="bg-redex-red hover:bg-redex-red-hover text-white text-[15px] font-semibold px-10 h-12 rounded-xl w-full md:w-auto shadow-sm"
              onClick={onStartJourney}
            >
              Start my journey →
            </Button>
            <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
              <span>🔒</span> 
              <span>Secure. Private. Built for your success.</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
