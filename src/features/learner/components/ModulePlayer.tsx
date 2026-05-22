import { useMemo, useState } from 'react';
import type { Module, Lesson, ProgressStatus } from '@/lib/education';
import { LessonContentRenderer } from './LessonContentRenderer';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { PASSING_THRESHOLD } from './Quiz';

interface ModulePlayerProps {
  module: Module;
  lessons: Lesson[];
  initialLessonId?: string;
  onProgressUpdate?: (lessonId: string, status: ProgressStatus) => void;
  onCompleteModule?: () => void;
  onExit?: () => void;
  /** Seed the player's completed lesson UI from persisted EducationContext progress (enables correct state on return from dashboard) */
  completedLessonIds?: string[];
}

function getInitialLessonIndex(lessons: Lesson[], initialLessonId?: string) {
  if (!initialLessonId) {
    return 0;
  }

  const initialIndex = lessons.findIndex((lesson) => lesson.id === initialLessonId);
  return initialIndex > -1 ? initialIndex : 0;
}

export function ModulePlayer({
  module,
  lessons,
  initialLessonId,
  onProgressUpdate,
  onCompleteModule,
  onExit,
  completedLessonIds = [],
}: ModulePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(() => getInitialLessonIndex(lessons, initialLessonId));
  // Track quiz outcomes so we can gate "Mark Complete" for quiz lessons and auto-record progress on pass
  const [quizResults, setQuizResults] = useState<Record<string, { score: number; passed: boolean }>>({});

  const lessonIds = useMemo(() => new Set(lessons.map((lesson) => lesson.id)), [lessons]);
  const completedLessons = useMemo(
    () => new Set(completedLessonIds.filter((id) => lessonIds.has(id))),
    [completedLessonIds, lessonIds]
  );

  const firstIncompleteRequiredIndex = useMemo(
    () => lessons.findIndex((lesson) => lesson.criticality === 'required' && !completedLessons.has(lesson.id)),
    [completedLessons, lessons]
  );

  const progress = lessons.length > 0 ? Math.round((completedLessons.size / lessons.length) * 100) : 0;

  if (lessons.length === 0) {
    return (
      <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border overflow-hidden">
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
      <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border overflow-hidden">
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

  // Quiz gating for production-feeling flow: quiz lessons must be passed to unlock "Mark Complete"
  const isQuizLesson = currentLesson.content.type === 'quiz';
  const currentQuizResult = quizResults[currentLesson.id];
  const quizHasPassed = currentQuizResult?.passed === true;
  const isQuizLocked = isQuizLesson && !quizHasPassed && !completedLessons.has(currentLesson.id);

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

  const handleMarkComplete = () => {
    onProgressUpdate?.(currentLesson.id, 'completed');

    if (isLastLesson) {
      onCompleteModule?.();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToLesson = (index: number) => {
    if (isLessonNavigable(index)) {
      setCurrentIndex(index);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border overflow-hidden">
      {/* Sidebar - Lesson Outline */}
      <div className="w-72 border-r bg-slate-50 p-4 overflow-y-auto">
        <div className="mb-4">
          <button onClick={onExit} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">MODULE</div>
        <div className="font-semibold text-lg mb-4">{module.title}</div>

        <div className="mb-3">
          <div className="text-xs text-slate-500 mb-1">Module Progress</div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
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
                onClick={() => goToLesson(index)}
                disabled={!canNavigate}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-6 py-4 flex items-center justify-between bg-white">
          <div>
            <div className="text-xs text-slate-500">LESSON {currentIndex + 1} OF {lessons.length}</div>
            <div className="font-semibold text-xl">{currentLesson.title}</div>
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-1">
            <Clock className="w-4 h-4" /> {currentLesson.estimated_minutes} min
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 bg-redex-offwhite">
          <LessonContentRenderer
            lesson={currentLesson}
            onQuizComplete={(score, passed) => {
              console.log(
                `[ModulePlayer] Quiz "${currentLesson.title}" completed: ${score}% — ${passed ? 'PASSED ✓' : 'NOT PASSED'}`
              );
              // Record result for gating + UI
              setQuizResults((prev) => ({
                ...prev,
                [currentLesson.id]: { score, passed },
              }));

              // When the learner passes a quiz lesson, auto-mark it complete so progress updates immediately
              // (the quiz itself is the interaction that fulfills the lesson requirement for the vertical slice)
              if (passed) {
                onProgressUpdate?.(currentLesson.id, 'completed');

                // If this was the final lesson and passed via quiz, complete the module flow too
                if (isLastLesson) {
                  // Brief pause so learner sees the success banner + score in Quiz before dashboard transition
                  setTimeout(() => onCompleteModule?.(), 650);
                }
              }
            }}
          />
        </div>

        {/* Quiz lock banner — forces real interaction before progress can advance on quiz lessons */}
        {isQuizLocked && (
          <div className="border-t bg-amber-50 px-6 py-2.5 text-sm text-amber-700 flex items-center gap-2">
            <span>🔒 Pass the quiz above with {PASSING_THRESHOLD}% or higher to unlock lesson completion and continue.</span>
          </div>
        )}

        <div className="border-t p-4 bg-white flex items-center justify-between">
          <Button variant="outline" onClick={() => goToLesson(currentIndex - 1)} disabled={currentIndex === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
          </Button>

          <Button 
            onClick={handleMarkComplete} 
            disabled={isQuizLocked}
            className="bg-redex-red hover:bg-redex-red-hover disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {isQuizLocked 
              ? 'Pass Quiz to Continue' 
              : isLastLesson ? 'Complete Module' : 'Mark Complete & Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
