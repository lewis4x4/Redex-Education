import { useState } from 'react';
import type { Module, Lesson, ProgressStatus } from '@/lib/education/training-types';
import { LessonContentRenderer } from './LessonContentRenderer';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, ArrowLeft, ArrowRight } from 'lucide-react';

interface ModulePlayerProps {
  module: Module;
  lessons: Lesson[];
  initialLessonId?: string;
  onProgressUpdate?: (lessonId: string, status: ProgressStatus) => void;
  onCompleteModule?: () => void;
  onExit?: () => void;
}

export function ModulePlayer({
  module,
  lessons,
  initialLessonId,
  onProgressUpdate,
  onCompleteModule,
  onExit,
}: ModulePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(
    lessons.findIndex(l => l.id === initialLessonId) > -1 
      ? lessons.findIndex(l => l.id === initialLessonId) 
      : 0
  );
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  // Track quiz outcomes so we can gate "Mark Complete" for quiz lessons and auto-record progress on pass
  const [quizResults, setQuizResults] = useState<Record<string, { score: number; passed: boolean }>>({});

  const currentLesson = lessons[currentIndex];
  const isLastLesson = currentIndex === lessons.length - 1;

  const handleMarkComplete = () => {
    const newCompleted = new Set(completedLessons);
    newCompleted.add(currentLesson.id);
    setCompletedLessons(newCompleted);

    onProgressUpdate?.(currentLesson.id, 'completed');

    if (isLastLesson) {
      onCompleteModule?.();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToLesson = (index: number) => {
    if (index >= 0 && index < lessons.length) {
      setCurrentIndex(index);
    }
  };

  const progress = Math.round((completedLessons.size / lessons.length) * 100);

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
            <div className="h-2 bg-[#ED1B24]" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs text-right mt-1 text-slate-500">{progress}% complete</div>
        </div>

        <div className="space-y-1 mt-4">
          {lessons.map((lesson, index) => {
            const isCompleted = completedLessons.has(lesson.id);
            const isActive = index === currentIndex;

            return (
              <button
                key={lesson.id}
                onClick={() => goToLesson(index)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors
                  ${isActive ? 'bg-[#ED1B24]/10 text-[#ED1B24] font-medium' : 'hover:bg-slate-100'}
                  ${isCompleted ? 'text-emerald-700' : ''}
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

        <div className="flex-1 overflow-auto p-8 bg-[#f8f7f4]">
          <LessonContentRenderer
            lesson={currentLesson}
            onQuizComplete={(score, passed) => {
              console.log(
                `[ModulePlayer] Quiz "${currentLesson.title}" completed: ${score}% — ${passed ? 'PASSED ✓' : 'NOT PASSED'}`
              );
              // The Quiz component has already called its onComplete.
              // Player can later persist scores or auto-mark when passed.
            }}
          />
        </div>

        <div className="border-t p-4 bg-white flex items-center justify-between">
          <Button variant="outline" onClick={() => goToLesson(currentIndex - 1)} disabled={currentIndex === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
          </Button>

          <Button 
            onClick={handleMarkComplete} 
            className="bg-[#ED1B24] hover:bg-[#b81419] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {isLastLesson ? 'Complete Module' : 'Mark Complete & Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
