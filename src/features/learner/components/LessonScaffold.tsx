import type { ReactNode } from 'react';
import { Clock } from 'lucide-react';

import type { Lesson } from '@/lib/education';

const LESSON_TYPE_LABELS: Record<Lesson['content']['type'], string> = {
  text: 'Reading lesson',
  checklist: 'Guided checklist',
  acknowledgment: 'Required acknowledgment',
  quiz: 'Knowledge check',
  scenario: 'Scenario lesson',
  video: 'Video lesson',
  coach: 'Redex Coach',
  assignment: 'Practical assignment',
  reflection_prompt: 'Reflection prompt',
  hotspot_diagram: 'Hotspot diagram',
  drag_to_order: 'Sequence practice',
};

interface LessonScaffoldProps {
  lesson: Lesson;
  lessonNumber?: number;
  totalLessons?: number;
  objective?: string;
  children: ReactNode;
}

function lessonPositionLabel(lessonNumber?: number, totalLessons?: number) {
  if (lessonNumber !== undefined && totalLessons !== undefined) {
    return `Lesson ${lessonNumber} of ${totalLessons}`;
  }

  return 'Lesson';
}

export function LessonScaffold({ lesson, lessonNumber, totalLessons, objective, children }: LessonScaffoldProps) {
  const objectiveText = objective ?? 'Complete this lesson and apply the idea in your Redex training.';

  return (
    <article className="mx-auto max-w-3xl space-y-5" aria-labelledby={`${lesson.id}-title`}>
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[3px] text-redex-red">
              {LESSON_TYPE_LABELS[lesson.content.type]}
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-[2px] text-slate-500">
              {lessonPositionLabel(lessonNumber, totalLessons)}
            </p>
            <h2 id={`${lesson.id}-title`} className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {lesson.title}
            </h2>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-redex-offwhite px-3 py-1.5 text-sm font-medium text-slate-600">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {lesson.estimated_minutes} min
          </div>
        </div>
        <p className="mt-4 rounded-xl border border-slate-200 bg-redex-offwhite px-4 py-3 text-sm leading-6 text-slate-700">
          <span className="font-semibold text-slate-900">What you'll be able to do: </span>
          {objectiveText}
        </p>
      </header>

      {children}
    </article>
  );
}
