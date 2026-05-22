import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Check, Cloud, ArrowRight } from 'lucide-react';
import type { LearnerProfile } from '@/types/training';

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
  const displayName = learner?.preferred_name ?? learner?.display_name ?? 'Marcus';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Welcome Card - matches the mockup */}
      <Card className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
        <CardContent className="p-10">
          {/* Eyebrow */}
          <div className="text-[#ed1f24] font-semibold tracking-[3px] text-sm mb-3">
            WELCOME TO REDEX ACADEMY
          </div>

          {/* Greeting - now uses typed learner profile */}
          <h1 className="text-4xl font-semibold tracking-[-1.5px] mb-3">
            Great to have you here, {displayName}. <span className="inline-block">👋</span>
          </h1>

          <p className="text-[15px] text-slate-600 max-w-[42ch] mb-8 leading-snug">
            We're excited to have you on the team. Let's get you set up with the essentials so you can start strong.
          </p>

          {/* Progress Steps - styled to match the mockup */}
          <div className="mb-8">
            <div className="flex items-center gap-3 text-sm mb-2 text-slate-500">
              <span className="font-medium text-[#e11d48] flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#e11d48]" /> Step 1: Welcome
              </span>
              <span className="text-slate-400">→</span>
              <span>Step 2: HR basics <span className="text-xs">(Policies & key info)</span></span>
              <span className="text-slate-400">→</span>
              <span>Step 3: Systems setup <span className="text-xs">(Tools & access)</span></span>
              <span className="text-slate-400">→</span>
              <span>Step 4: Ready to start</span>
            </div>
            <div className="h-1 bg-slate-200 rounded-full relative">
              <div className="absolute left-0 top-0 h-1 w-[25%] bg-[#e11d48] rounded-full" />
            </div>
            <div className="text-[10px] text-[#e11d48] mt-1 font-semibold tracking-wide">YOU ARE HERE</div>
          </div>

          {/* Video + Benefits Row — layout and treatment aligned closer to the exact mockup */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Video (left side in mockup) */}
            <div>
              <div className="bg-[#1c120e] rounded-2xl overflow-hidden">
                <div className="aspect-video flex items-center justify-center relative">
                  <div className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-[#e11d48] flex items-center justify-center cursor-pointer hover:bg-[#c41a1e] transition-colors shadow-inner">
                      <Play className="w-7 h-7 text-white ml-0.5" />
                    </div>
                    <div className="text-white font-medium text-[15px]">A quick hello from our CEO</div>
                    <div className="text-white/50 text-xs mt-0.5">Brian Lewis, Chief Executive Officer</div>
                  </div>
                </div>
                {/* Subtle video controls bar */}
                <div className="h-7 bg-black/50 px-3 flex items-center justify-between text-[10px] text-white/50">
                  <span>0:00 / 0:30</span>
                  <div className="flex gap-3">
                    <span>CC</span>
                    <span>⛶</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits (right side) */}
            <div className="space-y-4 text-[14px] pt-1">
              <div className="flex gap-3 items-start">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold tracking-tight">Takes about 20 minutes</div>
                  <div className="text-slate-500 text-xs leading-snug">Short, focused, and easy to follow.</div>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Cloud className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold tracking-tight">Your progress is saved</div>
                  <div className="text-slate-500 text-xs leading-snug">Pick up right where you left off.</div>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <ArrowRight className="w-5 h-5 text-[#e11d48] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold tracking-tight">One path. Start to finish.</div>
                  <div className="text-slate-500 text-xs leading-snug">No passwords. No menus. Just your personalized journey.</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA - big red button like the mockup */}
          <div className="mt-8">
            <Button 
              size="lg" 
              className="bg-[#e11d48] hover:bg-[#be123c] text-white text-[15px] font-semibold px-10 h-12 rounded-xl w-full md:w-auto shadow-sm"
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
