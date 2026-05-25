import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ModulePlayer } from './ModulePlayer';
import type { Lesson, Module } from '@/lib/education';

function makeModule(): Module {
  return {
    id: 'mod-video-integration',
    course_id: 'course-test',
    title: 'Video Integration Module',
    order_index: 1,
    criticality: 'required',
    estimated_minutes: 4,
  };
}

function makeVideoLesson(): Lesson {
  return {
    id: 'lesson-video-integration',
    module_id: 'mod-video-integration',
    title: 'Video Integration Lesson',
    lesson_type: 'video',
    criticality: 'required',
    order_index: 0,
    estimated_minutes: 4,
    content: {
      type: 'video',
      video_url: 'https://example.com/video.mp4',
      duration_seconds: 60,
      transcript_markdown: 'A short transcript.',
    },
  };
}

describe('ModulePlayer real video integration', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', { configurable: true, value: vi.fn() });
    Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: vi.fn(() => Promise.resolve()) });
  });

  it('renders a video lesson through the real renderer without locking or progress callback loops', () => {
    render(<ModulePlayer module={makeModule()} lessons={[makeVideoLesson()]} />);

    expect(screen.getByRole('region', { name: /redex video player/i })).toBeInTheDocument();
    expect(screen.queryByText(/Answer the video checkpoints above to continue./i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete module/i })).toBeEnabled();
  });
});
