import type { VideoCheckpoint, VideoLessonContent } from '@/lib/education';

function hasValidCorrectIndex(checkpoint: VideoCheckpoint): boolean {
  const correctIndex = checkpoint.correct_index;

  return (
    Array.isArray(checkpoint.options) &&
    checkpoint.options.length > 0 &&
    Number.isInteger(correctIndex) &&
    correctIndex !== undefined &&
    correctIndex >= 0 &&
    correctIndex < checkpoint.options.length
  );
}

export function isAnswerableRequiredVideoCheckpoint(
  content: VideoLessonContent,
  checkpoint: VideoCheckpoint,
): boolean {
  if (content.video_url.trim().length === 0 || checkpoint.required === false) {
    return false;
  }

  if (!Number.isFinite(checkpoint.at_seconds) || checkpoint.at_seconds < 0) {
    return false;
  }

  if (typeof content.duration_seconds === 'number' && checkpoint.at_seconds > content.duration_seconds) {
    return false;
  }

  if (checkpoint.must_answer_correctly === true && !hasValidCorrectIndex(checkpoint)) {
    return false;
  }

  return true;
}

export function getAnswerableRequiredVideoCheckpoints(content: VideoLessonContent): VideoCheckpoint[] {
  return (content.checkpoints ?? []).filter((checkpoint) => isAnswerableRequiredVideoCheckpoint(content, checkpoint));
}
