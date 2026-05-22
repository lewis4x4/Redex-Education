import type { Lesson } from '@/lib/education';
import { Quiz } from './Quiz';

interface Props {
  lesson: Lesson;
  onQuizComplete?: (score: number, passed: boolean) => void;
}

export function LessonContentRenderer({ lesson, onQuizComplete }: Props) {
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

  if (content.type === 'text') {
    return (
      <div className="prose max-w-3xl mx-auto">
        <h2>{lesson.title}</h2>
        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
          {content.body_markdown || 'Text lesson content would render here as rich markdown.'}
        </div>
      </div>
    );
  }

  if (content.type === 'quiz') {
    return <Quiz key={lesson.id} lesson={lesson} onComplete={onQuizComplete} />;
  }

  return (
    <div className="text-center py-12 text-slate-500">
      Renderer for <strong>{content.type}</strong> lesson type not yet implemented.
    </div>
  );
}
