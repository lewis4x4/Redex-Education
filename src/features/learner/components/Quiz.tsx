import { useState, useEffect, useMemo, useRef } from 'react';
import type { Lesson } from '@/lib/education';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RotateCcw, Award } from 'lucide-react';

interface QuizProps {
  lesson: Lesson;
  onComplete?: (score: number, passed: boolean) => void;
}

export const PASSING_THRESHOLD = 80;

/**
 * Production-grade Quiz component for Redex Academy lessons.
 * - Renders Lesson with content.type === 'quiz'
 * - Single-select multiple choice + True/False support (via options + correct_index)
 * - Local state management for selections, submit, scoring + per-question feedback
 * - Clean Redex visual language: #ED1B24 red accents (brand), rounded white cards, crisp typography
 * - Calls onComplete(scorePercent, passed) when submitted (consumer can persist progress)
 * - Retake supported; fully self-contained and reusable
 */
export function Quiz({ lesson, onComplete }: QuizProps) {
  const questions = useMemo(() => {
    return lesson.content.type === 'quiz' ? lesson.content.questions : [];
  }, [lesson]);

  const gradeableQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (q.correct_index === undefined) return false;
      return q.correct_index >= 0 && q.correct_index < q.options.length;
    });
  }, [questions]);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [hasPassed, setHasPassed] = useState(false);
  const hasNotifiedEmptyQuiz = useRef(false);

  const hasNoGradeableQuestions = gradeableQuestions.length === 0;
  const allAnswered =
    gradeableQuestions.length > 0 &&
    gradeableQuestions.every((question) => answers[question.id] !== undefined);

  const calculateResults = (currentAnswers: Record<string, number>) => {
    if (gradeableQuestions.length === 0) {
      return { score: 0, correctCount: 0, total: 0, rawFraction: 0 };
    }

    let correctCount = 0;
    gradeableQuestions.forEach((q) => {
      const selected = currentAnswers[q.id];
      if (selected === q.correct_index) {
        correctCount++;
      }
    });

    const total = gradeableQuestions.length;
    const rawFraction = correctCount / total;
    const pct = Math.round(rawFraction * 100);

    return { score: pct, correctCount, total, rawFraction };
  };

  useEffect(() => {
    if (hasNoGradeableQuestions && !hasNotifiedEmptyQuiz.current) {
      hasNotifiedEmptyQuiz.current = true;
      onComplete?.(0, false);
    }
  }, [hasNoGradeableQuestions, onComplete]);

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    const results = calculateResults(answers);
    setScore(results.score);
    const passed = results.rawFraction >= PASSING_THRESHOLD / 100;
    setHasPassed(passed);
    setIsSubmitted(true);
    onComplete?.(results.score, passed);
  };

  const handleRetake = () => {
    setAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setHasPassed(false);
  };

  if (hasNoGradeableQuestions) {
    return (
      <div className="max-w-xl mx-auto text-center py-8">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold mb-2">Quiz unavailable</h3>
        <p className="text-slate-600">Quiz has no questions — contact your administrator.</p>
      </div>
    );
  }

  const results = calculateResults(answers);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="uppercase tracking-[2px] text-xs font-semibold text-[#ED1B24]">KNOWLEDGE CHECK</div>
          <h3 className="text-2xl font-semibold tracking-tight mt-1">{lesson.title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {gradeableQuestions.length} questions • {PASSING_THRESHOLD}% to pass
          </p>
        </div>

        {isSubmitted && (
          <div
            className={`px-5 py-2.5 rounded-2xl text-right border shadow-sm ${hasPassed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
          >
            <div
              className="text-4xl font-semibold tabular-nums leading-none tracking-[-1.5px]"
              style={{ color: hasPassed ? '#15803d' : '#b91c1c' }}
            >
              {score}
              <span className="text-lg font-normal align-baseline">%</span>
            </div>
            <div className={`text-[10px] font-bold tracking-widest mt-0.5 ${hasPassed ? 'text-emerald-700' : 'text-red-700'}`}>
              {hasPassed ? 'PASSED' : 'RETAKE TO PASS'}
            </div>
          </div>
        )}
      </div>

      {/* Post-submit summary banner */}
      {isSubmitted && (
        <div
          className={`mb-6 rounded-2xl px-5 py-4 flex items-center gap-4 border ${hasPassed ? 'bg-emerald-50/80 border-emerald-100' : 'bg-amber-50/80 border-amber-200'}`}
        >
          <div className={`rounded-full p-2.5 ${hasPassed ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            <Award className={`w-5 h-5 ${hasPassed ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <div className="flex-1 text-sm leading-snug">
            {hasPassed ? (
              <>Strong work — <strong>{results.correctCount} / {results.total}</strong> correct. You can now complete this lesson.</>
            ) : (
              <>Score: <strong>{score}%</strong> ({results.correctCount} of {results.total} correct). Review feedback below and retake the quiz.</>
            )}
          </div>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-5">
        {questions.map((question, qIndex) => {
          const selectedIdx = answers[question.id];
          const showFeedback = isSubmitted;
          const hasValidCorrectIndex =
            question.correct_index !== undefined &&
            question.correct_index >= 0 &&
            question.correct_index < question.options.length;
          const correctIndex = hasValidCorrectIndex ? question.correct_index : undefined;

          return (
            <div
              key={question.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="px-6 pt-5 pb-3.5">
                <div className="flex gap-3">
                  <div className="mt-px flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold flex items-center justify-center ring-1 ring-inset ring-slate-200">
                    {qIndex + 1}
                  </div>
                  <div className="font-medium text-[15px] leading-snug text-slate-900 pr-1">
                    {question.question}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-5 space-y-[7px]">
                {question.options.map((option, oIndex) => {
                  const isSelected = selectedIdx === oIndex;
                  const isCorrect = correctIndex === oIndex;

                  let optionClasses =
                    'w-full flex items-start gap-3 text-left px-4 py-[13px] rounded-xl border text-sm transition-all active:scale-[0.985] ';

                  if (showFeedback) {
                    if (isCorrect) {
                      optionClasses += 'bg-emerald-50 border-emerald-200 text-emerald-900';
                    } else if (isSelected && hasValidCorrectIndex) {
                      optionClasses += 'bg-red-50 border-red-200 text-red-900';
                    } else {
                      optionClasses += 'bg-slate-50 border-slate-200 text-slate-500';
                    }
                  } else if (isSelected) {
                    optionClasses += 'border-[#ED1B24] bg-red-50 ring-1 ring-inset ring-[#ED1B24]/25';
                  } else {
                    optionClasses += 'border-slate-200 hover:border-slate-300 hover:bg-slate-50';
                  }

                  return (
                    <button
                      key={`${question.id}-${oIndex}-${option}`}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelect(question.id, oIndex)}
                      className={optionClasses}
                    >
                      {/* Radio visual */}
                      <div
                        className={`mt-[3px] flex-shrink-0 w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-all ${
                          showFeedback
                            ? isCorrect
                              ? 'border-emerald-600 bg-emerald-600'
                              : isSelected && hasValidCorrectIndex
                                ? 'border-red-600 bg-red-600'
                                : 'border-slate-300 bg-white'
                            : isSelected
                              ? 'border-[#ED1B24] bg-[#ED1B24]'
                              : 'border-slate-400 bg-white'
                        }`}
                      >
                        {(isSelected || (showFeedback && isCorrect)) && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>

                      <span className="flex-1 pt-[1px] leading-tight">{option}</span>

                      {/* Feedback icons */}
                      {showFeedback && isCorrect && (
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-px" />
                      )}
                      {showFeedback && isSelected && !isCorrect && hasValidCorrectIndex && (
                        <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-px" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Inline correct answer hint for wrongs */}
              {isSubmitted &&
                selectedIdx !== undefined &&
                correctIndex !== undefined &&
                selectedIdx !== correctIndex && (
                  <div className="px-6 py-2.5 text-xs bg-emerald-50/60 border-t border-emerald-100 text-emerald-700 flex gap-1.5">
                    <span className="font-medium">Correct:</span>
                    <span>{question.options[correctIndex]}</span>
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Footer controls */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {!isSubmitted ? (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="flex-1 h-11 rounded-xl bg-[#ED1B24] hover:bg-[#c41a1e] active:bg-[#a31518] text-base font-semibold tracking-[-0.2px] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
          >
            Submit Quiz
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handleRetake}
            className="flex-1 h-11 rounded-xl text-base font-medium border-slate-300 hover:bg-slate-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake Quiz
          </Button>
        )}
      </div>

      <div className="mt-4 text-center">
        {!isSubmitted && allAnswered && (
          <p className="text-xs text-slate-500">All answers selected. Submit when ready — retakes are allowed.</p>
        )}
        {isSubmitted && hasPassed && (
          <p className="text-emerald-600 text-sm font-medium inline-flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Passed — ready to mark lesson complete.
          </p>
        )}
        {isSubmitted && !hasPassed && (
          <p className="text-sm text-red-600/90">Keep going — retake until you hit {PASSING_THRESHOLD}%.</p>
        )}
      </div>
    </div>
  );
}
