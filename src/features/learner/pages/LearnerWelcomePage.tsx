import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Check, Cloud, ArrowRight } from 'lucide-react';

/**
 * First-day Welcome Screen for Redex Academy
 * Matches the provided UI mockup (v3) for new learner "Marcus"
 */
export function LearnerWelcomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Welcome Card - matches the mockup */}
      <Card className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
        <CardContent className="p-10">
          {/* Eyebrow */}
          <div className="text-[#ed1f24] font-semibold tracking-[3px] text-sm mb-3">
            WELCOME TO REDEX ACADEMY
          </div>

          {/* Greeting */}
          <h1 className="text-4xl font-semibold tracking-tight mb-3">
            Great to have you here, Marcus. <span className="inline-block">👋</span>
          </h1>

          <p className="text-lg text-[#6b7280] max-w-xl mb-8">
            We're excited to have you on the team. Let's get you set up with the essentials so you can start strong.
          </p>

          {/* Progress Steps */}
          <div className="mb-10">
            <div className="flex items-center justify-between text-sm mb-2 text-[#6b7280]">
              <div className="flex items-center gap-2 text-[#ed1f24] font-medium">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ed1f24]" /> Step 1: Welcome
              </div>
              <div>Step 2: HR basics</div>
              <div>Step 3: Systems setup</div>
              <div>Step 4: Ready to start</div>
            </div>
            <div className="h-0.5 bg-[#e5e7eb] rounded relative">
              <div className="absolute left-0 top-0 h-0.5 w-[22%] bg-[#ed1f24] rounded" />
            </div>
            <div className="text-[11px] text-[#ed1f24] mt-1 font-medium">You are here</div>
          </div>

          {/* Video + Benefits Row */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Video Placeholder (matches mockup) */}
            <div className="bg-[#2c1810] rounded-xl aspect-video flex items-center justify-center relative">
              <div className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-[#ed1f24] flex items-center justify-center cursor-pointer hover:bg-[#c41a1e] transition-colors">
                  <Play className="w-7 h-7 text-white ml-0.5" />
                </div>
                <div className="text-white font-medium">A quick hello from our CEO</div>
                <div className="text-white/60 text-sm">Brian Lewis, Chief Executive Officer</div>
              </div>

              {/* Fake video controls */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2 text-white/70 text-xs">
                <span>0:00 / 0:30</span>
                <div className="flex-1 h-px bg-white/30" />
                <span>CC</span>
                <span>⛶</span>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-6 pt-2">
              <div className="flex gap-4">
                <div className="mt-1"><Check className="w-5 h-5 text-[#16a34a]" /></div>
                <div>
                  <div className="font-medium">Takes about 20 minutes</div>
                  <div className="text-sm text-[#6b7280]">Short, focused, and easy to follow.</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1"><Cloud className="w-5 h-5 text-[#3b82f6]" /></div>
                <div>
                  <div className="font-medium">Your progress is saved</div>
                  <div className="text-sm text-[#6b7280]">Pick up right where you left off.</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1"><ArrowRight className="w-5 h-5 text-[#ed1f24]" /></div>
                <div>
                  <div className="font-medium">One path. Start to finish.</div>
                  <div className="text-sm text-[#6b7280]">No passwords. No menus. Just your personalized journey.</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Button 
              size="lg" 
              className="bg-[#ed1f24] hover:bg-[#c41a1e] text-white text-base px-8 h-12 rounded-xl w-full md:w-auto"
            >
              Start my journey →
            </Button>
            <p className="text-center md:text-left text-xs text-[#6b7280] mt-3">
              🔒 Secure. Private. Built for your success.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
