import { Clock } from 'lucide-react';

import type { CourseOutlineDraft, LessonType } from '@/lib/education';

export interface LessonOutlineListProps {
  modules: CourseOutlineDraft['modules'];
  sourceBindings?: Record<string, { drive_file_id: string; section_count: number }[]>;
}

const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  text: 'Reading',
  quiz: 'Quiz',
  checklist: 'Checklist',
  acknowledgment: 'Acknowledgment',
  scenario: 'Scenario',
  video: 'Video',
  coach: 'Coach',
  assignment: 'Assignment',
  reflection_prompt: 'Reflection prompt',
};

function getSourceSectionCount(
  lessonTitle: string,
  sourceBindings?: Record<string, { drive_file_id: string; section_count: number }[]>,
) {
  const bindings = sourceBindings?.[lessonTitle] ?? [];

  return bindings.reduce((total, binding) => total + binding.section_count, 0);
}

export function LessonOutlineList({ modules, sourceBindings }: LessonOutlineListProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="lesson-outline-heading">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 id="lesson-outline-heading" className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">
          Module and lesson outline
        </h2>
      </div>

      <ol className="divide-y divide-slate-100" aria-label="Generated modules">
        {modules.map((module, moduleIndex) => (
          <li key={`${module.title}-${moduleIndex}`}>
            <section className="space-y-4 px-5 py-5" aria-labelledby={`module-${moduleIndex + 1}`}>
              <h3 id={`module-${moduleIndex + 1}`} className="text-base font-semibold tracking-tight text-slate-900">
                Module {moduleIndex + 1}: {module.title}
              </h3>

              <ol className="space-y-3" aria-label={`${module.title} lessons`}>
                {module.lessons.map((lesson, lessonIndex) => {
                  const sourceSectionCount = getSourceSectionCount(lesson.title, sourceBindings);

                  return (
                    <li key={`${lesson.title}-${lessonIndex}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            Lesson {lessonIndex + 1}: {lesson.title}
                          </p>
                          {sourceSectionCount > 0 ? (
                            <p className="text-xs text-slate-600">📎 {sourceSectionCount} source sections</p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {LESSON_TYPE_LABELS[lesson.lesson_type]}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {lesson.estimated_minutes} min
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </li>
        ))}
      </ol>
    </section>
  );
}
