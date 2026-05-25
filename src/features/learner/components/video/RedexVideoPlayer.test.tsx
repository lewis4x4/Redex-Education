import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RedexVideoPlayer } from './RedexVideoPlayer';
import type { VideoLessonContent } from '@/lib/education';

function makeVideoContent(overrides: Partial<VideoLessonContent> = {}): VideoLessonContent {
  return {
    type: 'video',
    video_url: 'https://example.com/training.mp4',
    duration_seconds: 120,
    poster_url: 'https://example.com/poster.jpg',
    chapters: [
      { id: 'chapter-1', title: 'Opening', start_seconds: 0, end_seconds: 30 },
      { id: 'chapter-2', title: 'Escalation', start_seconds: 30, end_seconds: 120 },
    ],
    transcript_segments: [
      {
        id: 'segment-1',
        start_seconds: 0,
        end_seconds: 30,
        text_markdown: 'Welcome to the training.',
        derived_from_section_ids: ['section-1'],
      },
      {
        id: 'segment-2',
        start_seconds: 30,
        end_seconds: 120,
        text_markdown: 'Escalate early when you are blocked.',
        derived_from_section_ids: ['section-2'],
      },
    ],
    checkpoints: [
      {
        id: 'checkpoint-1',
        at_seconds: 10,
        question: 'What should you do when blocked?',
        options: ['Wait', 'Escalate early'],
        correct_index: 1,
        feedback_correct_markdown: 'Correct.',
        feedback_incorrect_markdown: 'Try again after reviewing the segment.',
        segment_start_seconds: 4,
        required: true,
        must_answer_correctly: false,
      },
    ],
    ...overrides,
  };
}

function getVideo(): HTMLVideoElement {
  return screen.getByLabelText('Training video') as HTMLVideoElement;
}

describe('RedexVideoPlayer', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/learn');
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', { configurable: true, value: vi.fn() });
    Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: vi.fn(() => Promise.resolve()) });
  });

  it('uses numeric ?t= deep links before saved resume position', () => {
    window.localStorage.setItem('redex:video-resume:lesson-video:https://example.com/training.mp4', '22');
    window.history.replaceState({}, '', '/learn?t=42');

    render(<RedexVideoPlayer lessonId="lesson-video" content={makeVideoContent()} />);

    expect(getVideo().currentTime).toBe(42);
    expect(screen.getByText(/Current time 0:42/i)).toBeInTheDocument();
  });

  it('falls back to localStorage resume when no deep link is present', () => {
    window.localStorage.setItem('redex:video-resume:lesson-video:https://example.com/training.mp4', '18');

    render(<RedexVideoPlayer lessonId="lesson-video" content={makeVideoContent()} />);

    expect(getVideo().currentTime).toBe(18);
    expect(screen.getByText(/Current time 0:18/i)).toBeInTheDocument();
  });

  it('pauses playback and surfaces an unanswered checkpoint at its timestamp', () => {
    render(<RedexVideoPlayer lessonId="lesson-video" content={makeVideoContent()} />);

    const video = getVideo();
    video.currentTime = 10;
    fireEvent.timeUpdate(video);

    expect(screen.getByText('Checkpoint')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /what should you do when blocked/i })).toBeInTheDocument();
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it('moves focus to the checkpoint surface when a checkpoint interrupts playback', async () => {
    render(<RedexVideoPlayer lessonId="lesson-video" content={makeVideoContent()} />);

    const video = getVideo();
    video.currentTime = 10;
    fireEvent.timeUpdate(video);

    await waitFor(() => {
      expect(screen.getByRole('group', { name: /what should you do when blocked/i })).toHaveFocus();
    });
  });

  it('counts only answerable required checkpoints as checkpoint progress', async () => {
    const user = userEvent.setup();
    const onCheckpointProgress = vi.fn();

    render(
      <RedexVideoPlayer
        lessonId="lesson-video"
        content={makeVideoContent({
          checkpoints: [
            {
              id: 'checkpoint-1',
              at_seconds: 10,
              question: 'What should you do when blocked?',
              options: ['Wait', 'Escalate early'],
              correct_index: 1,
              required: true,
              must_answer_correctly: false,
            },
            {
              id: 'checkpoint-late',
              at_seconds: 130,
              question: 'This checkpoint is beyond the known duration.',
              required: true,
            },
            {
              id: 'checkpoint-invalid-critical',
              at_seconds: 20,
              question: 'This correctness-required checkpoint is malformed.',
              options: ['Only option'],
              correct_index: 3,
              required: true,
              must_answer_correctly: true,
            },
          ],
        })}
        onCheckpointProgress={onCheckpointProgress}
      />,
    );

    const video = getVideo();
    video.currentTime = 10;
    fireEvent.timeUpdate(video);
    await user.click(screen.getByRole('button', { name: 'Escalate early' }));

    await waitFor(() => {
      expect(onCheckpointProgress).toHaveBeenLastCalledWith(
        expect.objectContaining({
          answered_checkpoint_ids: ['checkpoint-1'],
          required_checkpoint_ids: ['checkpoint-1'],
          all_required_answered: true,
        }),
      );
    });
  });

  it('counts non-punitive wrong answers as checkpoint progress', async () => {
    const user = userEvent.setup();
    const onCheckpointProgress = vi.fn();

    render(
      <RedexVideoPlayer
        lessonId="lesson-video"
        content={makeVideoContent()}
        onCheckpointProgress={onCheckpointProgress}
      />,
    );

    const video = getVideo();
    video.currentTime = 10;
    fireEvent.timeUpdate(video);
    await user.click(screen.getByRole('button', { name: 'Wait' }));

    await waitFor(() => {
      expect(onCheckpointProgress).toHaveBeenLastCalledWith(
        expect.objectContaining({
          lesson_id: 'lesson-video',
          answered_checkpoint_ids: ['checkpoint-1'],
          required_checkpoint_ids: ['checkpoint-1'],
          all_required_answered: true,
        }),
      );
    });

    expect(screen.getByRole('status')).toHaveTextContent(/Try again after reviewing the segment./i);
    expect(screen.getByRole('button', { name: /continue video/i })).toBeEnabled();
  });

  it('keeps correctness-required checkpoints locked after a wrong answer and offers re-watch', async () => {
    const user = userEvent.setup();
    const onCheckpointProgress = vi.fn();

    render(
      <RedexVideoPlayer
        lessonId="lesson-video"
        content={makeVideoContent({
          checkpoints: [
            {
              id: 'checkpoint-critical',
              at_seconds: 40,
              question: 'What is required?',
              options: ['Guess', 'Correct action'],
              correct_index: 1,
              feedback_incorrect_markdown: 'Re-watch this part before continuing.',
              segment_start_seconds: 30,
              required: true,
              must_answer_correctly: true,
            },
          ],
        })}
        onCheckpointProgress={onCheckpointProgress}
      />,
    );

    const video = getVideo();
    video.currentTime = 40;
    fireEvent.timeUpdate(video);
    await user.click(screen.getByRole('button', { name: 'Guess' }));

    expect(screen.getByRole('button', { name: /continue video/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /re-watch that part/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /re-watch that part/i }));

    expect(video.currentTime).toBe(30);
    expect(window.location.search).toBe('?t=30');
    expect(onCheckpointProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({ all_required_answered: false, answered_checkpoint_ids: [] }),
    );
  });

  it('seeks from transcript and chapter controls and updates the deep link', async () => {
    const user = userEvent.setup();

    render(<RedexVideoPlayer lessonId="lesson-video" content={makeVideoContent()} />);

    const video = getVideo();
    await user.click(screen.getByRole('button', { name: /Escalate early when you are blocked./i }));

    expect(video.currentTime).toBe(30);
    expect(window.location.search).toBe('?t=30');

    await user.click(screen.getByRole('button', { name: /Opening/i }));

    expect(video.currentTime).toBe(0);
    expect(window.location.search).toBe('?t=0');
  });

  it('shows a disabled offline download affordance when no download URL is available', () => {
    render(
      <RedexVideoPlayer
        lessonId="lesson-video"
        content={makeVideoContent({ download_url: undefined, downloads: undefined })}
      />,
    );

    expect(screen.getByRole('button', { name: /download for offline/i })).toBeDisabled();
    expect(screen.getByText(/Offline downloads are not available for this video yet./i)).toBeInTheDocument();
  });
});
