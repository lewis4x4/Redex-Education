import { CheckCircle2, Clock } from 'lucide-react';

import type { CourseOutlineDraft } from '@/lib/education';

export interface GeneratedOutlineCardProps {
  outline: CourseOutlineDraft;
}

export function GeneratedOutlineCard({ outline }: GeneratedOutlineCardProps) {
  const moduleCount = outline.modules.length;
  const lessonCount = outline.modules.reduce((total, module) => total + module.lessons.length, 0);
  const totalEstimatedMinutes = outline.modules.reduce(
    (total, module) =>
      total + module.lessons.reduce((moduleTotal, lesson) => moduleTotal + lesson.estimated_minutes, 0),
    0,
  );

  return (
    <section
      className="rounded-2xl bg-white border border-slate-200 shadow-md p-6 md:p-8 space-y-6"
      aria-labelledby="generated-outline-heading"
    >
      <header className="space-y-2">
        <h2 id="generated-outline-heading" className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">
          Generated Outline
        </h2>
        <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
          {outline.course_title}
        </h3>
        <p className="text-[15px] leading-[1.45] text-slate-600">{outline.description}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total time</p>
          <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Clock className="h-4 w-4 text-slate-500" />
            {totalEstimatedMinutes} min
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Modules</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{moduleCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lessons</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{lessonCount}</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Learning objectives</h4>
        <ul className="mt-3 space-y-2" aria-label="Learning objectives">
          {outline.learning_objectives.map((objective) => (
            <li key={objective} className="flex items-start gap-2 text-[15px] leading-[1.45] text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>{objective}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
