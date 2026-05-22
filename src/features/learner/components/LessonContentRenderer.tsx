import React from 'react';
import type { Lesson } from '@/lib/education/training-types';

interface Props {
  lesson: Lesson;
}

export function LessonContentRenderer({ lesson }: Props) {
  const { content } = lesson;

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

  if (content.type === 'reading') {
    return (
      <div className="prose max-w-3xl mx-auto">
        <h2>{lesson.title}</h2>
        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
          {content.body_markdown || 'Reading content would render here as rich markdown.'}
        </div>
      </div>
    );
  }

  if (content.type === 'quiz') {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold mb-2">Knowledge Check</h3>
        <p className="text-slate-600">Quiz component will be wired here (see Task C).</p>
      </div>
    );
  }

  return (
    <div className="text-center py-12 text-slate-500">
      Renderer for <strong>{content.type}</strong> lesson type not yet implemented.
    </div>
  );
}
