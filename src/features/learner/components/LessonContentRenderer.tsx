import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import { Button } from '@/components/ui/button';

import type { Lesson } from '@/lib/education';
import { Quiz } from './Quiz';

interface Props {
  lesson: Lesson;
  onQuizComplete?: (score: number, passed: boolean) => void;
  onAcknowledge?: () => void;
}

export function LessonContentRenderer({ lesson, onQuizComplete, onAcknowledge }: Props) {
  const { content } = lesson;
  const [acknowledgmentState, setAcknowledgmentState] = useState({ lessonId: lesson.id, checked: false });
  const acknowledgmentChecked =
    acknowledgmentState.lessonId === lesson.id ? acknowledgmentState.checked : false;

  if (content.type === 'video') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="aspect-video bg-black rounded-xl flex items-center justify-center text-white mb-6">
          <div className="text-center">
            <div className="text-2xl mb-2">▶ Video Player</div>
            <div className="text-sm opacity-60">(Stub — {content.video_url})</div>
          </div>
        </div>
        <p className="text-center text-slate-500">In a real build this would be a proper video player with chapters.</p>
      </div>
    );
  }

  if (content.type === 'text') {
    const markdownBody = content.body_markdown || 'Text lesson content would render here as rich markdown.';

    return (
      <div className="prose max-w-3xl mx-auto">
        <h2>{lesson.title}</h2>
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{markdownBody}</ReactMarkdown>
      </div>
    );
  }

  if (content.type === 'quiz') {
    return <Quiz key={lesson.id} lesson={lesson} onComplete={onQuizComplete} />;
  }

  if (content.type === 'acknowledgment') {
    const checkboxId = `${lesson.id}-acknowledgment-checkbox`;

    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[3px] text-redex-red">
            REQUIRED ACKNOWLEDGMENT
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{lesson.title}</h2>
          {content.policy_ref && (
            <p className="mt-2 text-sm font-medium text-slate-500">Policy reference: {content.policy_ref}</p>
          )}
          <div className="prose mt-5 max-w-none text-slate-700">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content.statement_markdown}</ReactMarkdown>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-redex-offwhite p-4">
            <div className="flex items-start gap-3">
              <input
                id={checkboxId}
                type="checkbox"
                checked={acknowledgmentChecked}
                onChange={(event) => setAcknowledgmentState({ lessonId: lesson.id, checked: event.target.checked })}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-redex-red focus:ring-redex-red"
              />
              <label htmlFor={checkboxId} className="text-sm font-medium leading-6 text-slate-800">
                I have read and understood this acknowledgment
              </label>
            </div>
            <Button
              type="button"
              className="mt-4 bg-redex-red hover:bg-redex-red-hover disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              disabled={!acknowledgmentChecked}
              onClick={onAcknowledge}
            >
              Acknowledge
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12 text-slate-500">
      Renderer for <strong>{content.type}</strong> lesson type not yet implemented.
    </div>
  );
}
