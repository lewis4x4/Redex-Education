import type { VideoCheckpointProgress, VideoLessonContent } from '@/lib/education';
import { RedexVideoPlayer } from '../video/RedexVideoPlayer';

interface VideoLessonProps {
  lessonId: string;
  content: VideoLessonContent;
  onCheckpointProgress?: (progress: VideoCheckpointProgress) => void;
}

export function VideoLesson({ lessonId, content, onCheckpointProgress }: VideoLessonProps) {
  if (content.video_url.trim().length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[3px] text-amber-700">Video lesson unavailable</p>
        <h3 className="mt-3 text-xl font-semibold tracking-tight text-amber-950">Video asset not ready</h3>
        <p className="mt-3 text-sm leading-6 text-amber-900">
          This lesson is ready in the training plan, but the video asset has not been generated or attached yet.
        </p>
      </div>
    );
  }

  return <RedexVideoPlayer lessonId={lessonId} content={content} onCheckpointProgress={onCheckpointProgress} />;
}
