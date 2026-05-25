import { useCallback, useMemo, useState } from 'react';
import type {
  AcknowledgmentCompletion,
  ChecklistCompletion,
  Module,
  OrderingCompletion,
  ScenarioCompletion,
  Lesson,
  ProgressStatus,
  QuizLessonContent,
  VideoCheckpointProgress,
} from '@/lib/education';
import { LessonContentRenderer } from './LessonContentRenderer';
import { getAnswerableRequiredVideoCheckpoints } from './video/videoCheckpointRules';
import { Button } from '@/components/ui/button';
import { CheckCircle, CheckCircle2, Clock, ArrowLeft, ArrowRight, Lock } from 'lucide-react';

interface ModulePlayerProps {
  module: Module;
  lessons: Lesson[];
  initialLessonId?: string;
  onProgressUpdate?: (lessonId: string, status: ProgressStatus) => void;
  onQuizAttempt?: (
    lessonId: string,
    attempt: { score: number; passed: boolean; answers: Record<string, number> },
  ) => void;
  onCompleteModule?: () => void;
  onExit?: () => void;
  completedLessonIds?: string[];
  onAcknowledgmentComplete?: (completion: AcknowledgmentCompletion) => void;
  onChecklistComplete?: (completion: ChecklistCompletion) => void;
  onScenarioComplete?: (completion: ScenarioCompletion) => void;
  onOrderingComplete?: (completion: OrderingCompletion) => void;
}

function getInitialLessonIndex(lessons: Lesson[], initialLessonId?: string) {
  if (!initialLessonId) {
    return 0;
  }

  const initialIndex = lessons.findIndex((lesson) => lesson.id === initialLessonId);
  return initialIndex > -1 ? initialIndex : 0;
}

function hasRequiredVideoCheckpoints(content: Lesson['content']): boolean {
  return content.type === 'video' && getAnswerableRequiredVideoCheckpoints(content).length > 0;
}

function areStringArraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function isSameVideoCheckpointProgress(left: VideoCheckpointProgress, right: VideoCheckpointProgress): boolean {
  return (
    left.all_required_answered === right.all_required_answered &&
    areStringArraysEqual(left.answered_checkpoint_ids, right.answered_checkpoint_ids) &&
    areStringArraysEqual(left.required_checkpoint_ids, right.required_checkpoint_ids) &&
    left.completions.length === right.completions.length
  );
}

function hasCompletableOrderingContent(content: Lesson['content']): boolean {
  if (content.type !== 'drag_to_order' || content.steps.length === 0) {
    return false;
  }

  const stepIds = new Set<string>();

  return content.steps.every((step) => {
    const hasRequiredFields = step.id.trim().length > 0 && step.label.trim().length > 0;
    const isDuplicate = stepIds.has(step.id);
    stepIds.add(step.id);

    return hasRequiredFields && !isDuplicate;
  });
}

function getLearningOutcomes(module: Module): string[] {
  const fromModule = (module as unknown as { learning_outcomes?: string[] }).learning_outcomes;
  const fromDraftMetadata = (module as unknown as { draft_metadata?: { basics?: { learning_outcomes?: string[] } } }).draft_metadata?.basics?.learning_outcomes;

  return (fromModule ?? fromDraftMetadata ?? []).filter(Boolean).slice(0, 3);
}

export function ModulePlayer({
  module,
  lessons,
  initialLessonId,
  onProgressUpdate,
  onQuizAttempt,
  onCompleteModule,
  onExit,
  completedLessonIds = [],
  onAcknowledgmentComplete,
  onChecklistComplete,
  onScenarioComplete,
  onOrderingComplete,
}: ModulePlayerProps) {
  const initialIndex = useMemo(() => getInitialLessonIndex(lessons, initialLessonId), [lessons, initialLessonId]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [quizResults, setQuizResults] = useState<Record<string, { score: number; passed: boolean }>>({});
  const [optimisticCompletedLessonIds, setOptimisticCompletedLessonIds] = useState<string[]>([]);
  const [videoCheckpointProgressByLessonId, setVideoCheckpointProgressByLessonId] = useState<Record<string, VideoCheckpointProgress>>({});
  const handleVideoCheckpointProgress = useCallback((checkpointProgress: VideoCheckpointProgress) => {
    setVideoCheckpointProgressByLessonId((previous) => {
      const existingProgress = previous[checkpointProgress.lesson_id];

      if (existingProgress && isSameVideoCheckpointProgress(existingProgress, checkpointProgress)) {
        return previous;
      }

      return {
        ...previous,
        [checkpointProgress.lesson_id]: checkpointProgress,
      };
    });
  }, []);

  const lessonIds = useMemo(() => new Set(lessons.map((lesson) => lesson.id)), [lessons]);
  const completedLessons = useMemo(
    () => new Set([...completedLessonIds, ...optimisticCompletedLessonIds].filter((id) => lessonIds.has(id))),
    [completedLessonIds, optimisticCompletedLessonIds, lessonIds]
  );

  const firstIncompleteRequiredIndex = useMemo(
    () => lessons.findIndex((lesson) => lesson.criticality === 'required' && !completedLessons.has(lesson.id)),
    [completedLessons, lessons]
  );

  const progress = lessons.length > 0 ? Math.round((completedLessons.size / lessons.length) * 100) : 0;
  const isModuleComplete = lessons.length > 0 && completedLessons.size === lessons.length;
  const learningOutcomes = useMemo(() => getLearningOutcomes(module), [module]);

  const latestQuizResult = [...lessons]
    .reverse()
    .map((lesson) => quizResults[lesson.id])
    .find((result) => result !== undefined);

  if (lessons.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] bg-white rounded-2xl border overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-redex-offwhite">
          <div className="max-w-md rounded-2xl border bg-white p-8 shadow-sm">
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">MODULE</div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">{module.title}</h2>
            <p className="text-slate-600 mb-6">No lessons in this module yet.</p>
            <Button variant="outline" onClick={onExit}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentLesson = lessons[currentIndex];

  if (!currentLesson) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] bg-white rounded-2xl border overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-redex-offwhite">
          <div className="max-w-md rounded-2xl border bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">Lesson unavailable</h2>
            <p className="text-slate-600 mb-6">This lesson could not be found in the current module.</p>
            <Button variant="outline" onClick={onExit}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isLastLesson = currentIndex === lessons.length - 1;
  const quizContent: QuizLessonContent | null =
    currentLesson.content.type === 'quiz' ? (currentLesson.content as QuizLessonContent) : null;
  const quizPassingThreshold =
    quizContent && typeof quizContent.passing_threshold === 'number'
      ? quizContent.passing_threshold
      : 80;
  const currentQuizResult = quizResults[currentLesson.id];
  const quizHasPassed = currentQuizResult?.passed === true;
  const currentLessonCompleted = completedLessons.has(currentLesson.id);
  const hasRequiredVideoCheckpointGate = hasRequiredVideoCheckpoints(currentLesson.content);
  const currentVideoCheckpointProgress = videoCheckpointProgressByLessonId[currentLesson.id];
  const isVideoCheckpointLocked =
    currentLesson.content.type === 'video' &&
    hasRequiredVideoCheckpointGate &&
    !currentLessonCompleted &&
    currentVideoCheckpointProgress?.all_required_answered !== true;

  const requiresInlineCompletion =
    currentLesson.content.type === 'quiz' ||
    currentLesson.content.type === 'acknowledgment' ||
    currentLesson.content.type === 'checklist' ||
    currentLesson.content.type === 'scenario' ||
    hasCompletableOrderingContent(currentLesson.content) ||
    hasRequiredVideoCheckpointGate;

  const isInlineCompletionLocked =
    requiresInlineCompletion &&
    !currentLessonCompleted &&
    (currentLesson.content.type === 'quiz' ? !quizHasPassed : currentLesson.content.type === 'video' ? isVideoCheckpointLocked : true);

  const handleDashboardExit = () => {
    if (isModuleComplete) {
      onCompleteModule?.();
      return;
    }

    onExit?.();
  };

  const isLessonNavigable = (index: number) => {
    const targetLesson = lessons[index];

    if (!targetLesson) {
      return false;
    }

    if (index === currentIndex || completedLessons.has(targetLesson.id)) {
      return true;
    }

    return firstIncompleteRequiredIndex === -1 || index <= firstIncompleteRequiredIndex;
  };

  const markLessonCompleted = (lessonId: string) => {
    setOptimisticCompletedLessonIds((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));
    onProgressUpdate?.(lessonId, 'completed');
  };

  const advanceAfterCompletion = () => {
    if (!isLastLesson) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleMarkComplete = () => {
    markLessonCompleted(currentLesson.id);
    advanceAfterCompletion();
  };

  const goToLesson = (index: number) => {
    if (isLessonNavigable(index)) {
      setCurrentIndex(index);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col overflow-visible rounded-2xl border bg-white md:h-[calc(100vh-8rem)] md:flex-row md:overflow-hidden">
      <div className="w-full max-h-72 border-b bg-slate-50 p-4 overflow-y-auto md:max-h-none md:w-72 md:border-b-0 md:border-r">
        <div className="mb-4">
          <button onClick={handleDashboardExit} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">MODULE</div>
        <div className="font-semibold text-lg mb-4">{module.title}</div>

        {learningOutcomes.length > 0 ? (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">What you'll be able to do after this module</p>
            <ul className="space-y-1 text-xs text-slate-700">
              {learningOutcomes.map((outcome) => (
                <li key={outcome}>• {outcome}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mb-3">
          <div className="text-xs text-slate-500 mb-1">Module Progress</div>
          <div
            className="h-2 bg-slate-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-label="Module progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div className="h-2 bg-redex-red" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs text-right mt-1 text-slate-500">{progress}% complete</div>
        </div>

        <div className="space-y-1 mt-4">
          {lessons.map((lesson, index) => {
            const isCompleted = completedLessons.has(lesson.id);
            const isActive = index === currentIndex;
            const canNavigate = isLessonNavigable(index);
            const lockedDescriptionId = `${lesson.id}-locked-description`;
            const lockedMessage = 'Locked. Complete required lessons in order to unlock.';

            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => goToLesson(index)}
                aria-disabled={!canNavigate}
                aria-describedby={canNavigate ? undefined : lockedDescriptionId}
                aria-label={canNavigate ? undefined : `${lesson.title}. ${lockedMessage}`}
                title={canNavigate ? undefined : 'Complete required lessons in order to unlock this lesson.'}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors
                  ${isActive ? 'bg-redex-red/10 text-redex-red font-medium' : 'hover:bg-slate-100'}
                  ${isCompleted ? 'text-emerald-700' : ''}
                  ${!canNavigate ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}
                `}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px]">
                    {index + 1}
                  </div>
                )}
                <span className="truncate">{lesson.title}</span>
                <span className="ml-auto text-[10px] text-slate-400 flex items-center gap-0.5">
                  <Clock className="w-3 h-3" /> {lesson.estimated_minutes}m
                </span>
                {!canNavigate && (
                  <span id={lockedDescriptionId} className="sr-only">
                    {lockedMessage}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-4 py-4 flex flex-col gap-2 bg-white sm:px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs text-slate-500">
              {isModuleComplete ? 'MODULE COMPLETE' : `LESSON ${currentIndex + 1} OF ${lessons.length}`}
            </div>
            <div className="font-semibold text-xl">{isModuleComplete ? module.title : currentLesson.title}</div>
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-1">
            <Clock className="w-4 h-4" /> {isModuleComplete ? module.estimated_minutes : currentLesson.estimated_minutes} min
          </div>
        </div>

        {isModuleComplete ? (
          <div className="flex-1 overflow-auto bg-redex-offwhite p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-md">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
              <div className="mt-4 text-xs font-semibold uppercase tracking-[3px] text-redex-red">TRAINING COMPLETE</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">You've completed {module.title}</h2>

              {learningOutcomes.length > 0 ? (
                <div className="mt-6 space-y-2 text-left">
                  <p className="text-xs font-semibold uppercase tracking-[3px] text-redex-red">What you can now do</p>
                  <ul className="space-y-1 text-sm text-slate-700">
                    {learningOutcomes.map((outcome) => (
                      <li key={outcome}>• {outcome}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-3 text-slate-600">Nice work. Your progress is saved and this module is complete.</p>
              )}

              <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-redex-offwhite p-4">
                  <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Estimated time</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">{module.estimated_minutes} min</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-redex-offwhite p-4">
                  <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Quiz score</div>
                  {latestQuizResult ? (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-2xl font-semibold text-slate-900">{latestQuizResult.score}%</span>
                      <span className={latestQuizResult.passed ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'}>
                        {latestQuizResult.passed ? 'Passed' : 'Not passed'}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 text-sm font-medium text-slate-600">Score not available this session</div>
                  )}
                </div>
              </div>

              <Button className="mt-8" variant="brand" onClick={onCompleteModule}>
                Back to dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-redex-offwhite p-4 sm:p-6 md:p-8">
            <LessonContentRenderer
              lesson={currentLesson}
              lessonNumber={currentIndex + 1}
              totalLessons={lessons.length}
              onAcknowledge={(completion) => {
                onAcknowledgmentComplete?.(completion);
                markLessonCompleted(currentLesson.id);
                advanceAfterCompletion();
              }}
              onChecklistComplete={(completion) => {
                onChecklistComplete?.(completion);
                markLessonCompleted(currentLesson.id);
                advanceAfterCompletion();
              }}
              onQuizComplete={(score, passed, answers) => {
                onQuizAttempt?.(currentLesson.id, { score, passed, answers });

                setQuizResults((prev) => ({
                  ...prev,
                  [currentLesson.id]: { score, passed },
                }));

                if (passed) {
                  markLessonCompleted(currentLesson.id);
                  advanceAfterCompletion();
                }
              }}
              onScenarioComplete={(completion) => {
                onScenarioComplete?.(completion);
                markLessonCompleted(currentLesson.id);
                advanceAfterCompletion();
              }}
              onOrderingComplete={(completion) => {
                onOrderingComplete?.(completion);
                markLessonCompleted(currentLesson.id);
                advanceAfterCompletion();
              }}
              onVideoCheckpointProgress={handleVideoCheckpointProgress}
            />
          </div>
        )}

        {!isModuleComplete && isInlineCompletionLocked && (
          <div className="border-t bg-amber-50 px-4 py-2.5 text-sm text-amber-700 flex items-center gap-2 sm:px-6">
            <Lock className="h-4 w-4" aria-hidden="true" />
            {currentLesson.content.type === 'quiz' ? (
              <span>Pass the quiz above with {quizPassingThreshold}% or higher to continue.</span>
            ) : currentLesson.content.type === 'acknowledgment' ? (
              <span>Complete the acknowledgment above to continue.</span>
            ) : currentLesson.content.type === 'checklist' ? (
              <span>Complete the checklist above to continue.</span>
            ) : currentLesson.content.type === 'drag_to_order' ? (
              <span>Complete the sequence above to continue.</span>
            ) : currentLesson.content.type === 'video' ? (
              <span>Answer the video checkpoints above to continue.</span>
            ) : (
              <span>Complete the scenario above to continue.</span>
            )}
          </div>
        )}

        {!isModuleComplete && (
          <div className="border-t p-4 bg-white flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" onClick={() => goToLesson(currentIndex - 1)} disabled={currentIndex === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Previous
            </Button>

            <Button onClick={handleMarkComplete} disabled={isInlineCompletionLocked} variant="brand" className="disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed">
              {isInlineCompletionLocked
                ? currentLesson.content.type === 'quiz'
                  ? 'Pass Quiz to Continue'
                  : currentLesson.content.type === 'scenario'
                    ? 'Complete Scenario to Continue'
                    : currentLesson.content.type === 'drag_to_order'
                      ? 'Complete Sequence to Continue'
                      : currentLesson.content.type === 'video'
                        ? 'Answer Checkpoints to Continue'
                        : 'Complete Above to Continue'
                : isLastLesson
                  ? 'Complete Module'
                  : 'Mark Complete & Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
