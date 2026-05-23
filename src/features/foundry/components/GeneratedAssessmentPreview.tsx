import type { QuizQuestion } from '@/lib/education';

export interface GeneratedAssessmentPreviewProps {
  questions: QuizQuestion[];
  passingThreshold?: number;
}

export function GeneratedAssessmentPreview({ questions, passingThreshold = 80 }: GeneratedAssessmentPreviewProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4" aria-labelledby="generated-quiz-preview-heading">
      <header className="space-y-1">
        <h3 id="generated-quiz-preview-heading" className="text-lg font-semibold tracking-tight text-slate-900">
          Generated quiz preview
        </h3>
        <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
          PREVIEW ONLY — Correct answer shown for admin review
        </p>
        <p className="text-sm text-slate-600">Passing: {passingThreshold}%</p>
      </header>

      <ol className="space-y-4">
        {questions.map((question, questionIndex) => (
          <li key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-sm font-medium text-slate-900">
              {questionIndex + 1}. {question.question}
            </p>
            <ol className="space-y-2" type="1">
              {question.options.map((option, optionIndex) => {
                const isCorrect = question.correct_index === optionIndex;

                return (
                  <li
                    key={`${question.id}-${optionIndex}`}
                    className={`rounded-lg border px-3 py-2 text-sm ${isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700'}`}
                  >
                    <span>{option}</span>
                    {isCorrect && <span className="ml-2 text-xs font-semibold uppercase tracking-wide">Correct answer</span>}
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
    </section>
  );
}
