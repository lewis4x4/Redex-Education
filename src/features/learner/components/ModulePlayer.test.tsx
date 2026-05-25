import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ModulePlayer } from './ModulePlayer';
import type {
  AcknowledgmentCompletion,
  ChecklistCompletion,
  Criticality,
  OrderingCompletion,
  ScenarioCompletion,
  VideoCheckpointProgress,
  Lesson,
  LessonType,
  Module,
} from '@/lib/education';

vi.mock('./LessonContentRenderer', () => ({
  LessonContentRenderer: ({
    lesson,
    onAcknowledge,
    onChecklistComplete,
    onQuizComplete,
    onScenarioComplete,
    onOrderingComplete,
    onVideoCheckpointProgress,
  }: {
    lesson: Lesson;
    onAcknowledge?: (completion: AcknowledgmentCompletion) => void;
    onChecklistComplete?: (completion: ChecklistCompletion) => void;
    onQuizComplete?: (score: number, passed: boolean, answers: Record<string, number>) => void;
    onScenarioComplete?: (completion: ScenarioCompletion) => void;
    onOrderingComplete?: (completion: OrderingCompletion) => void;
    onVideoCheckpointProgress?: (progress: VideoCheckpointProgress) => void;
  }) => (
    <div data-testid="lesson-content-renderer">
      Rendering {lesson.id}
      {lesson.content.type === 'acknowledgment' && (
        <button
          type="button"
          onClick={() =>
            onAcknowledge?.({
              lesson_id: lesson.id,
              signature_method: 'click',
              acknowledged_at: '2026-05-25T01:00:00.000Z',
            })
          }
        >
          Acknowledge lesson
        </button>
      )}
      {lesson.content.type === 'checklist' && (
        <button
          type="button"
          onClick={() =>
            onChecklistComplete?.({
              lesson_id: lesson.id,
              checked_item_ids: ['item-1'],
              completed_at: '2026-05-25T01:00:00.000Z',
              require_all: true,
            })
          }
        >
          Complete checklist lesson
        </button>
      )}
      {lesson.content.type === 'quiz' && (
        <>
          <button type="button" onClick={() => onQuizComplete?.(100, true, { Q1: 0, Q2: 1 })}>Complete quiz pass</button>
          <button type="button" onClick={() => onQuizComplete?.(50, false, { Q1: 1, Q2: 1 })}>Complete quiz fail</button>
        </>
      )}
      {lesson.content.type === 'scenario' && (
        <button
          type="button"
          onClick={() =>
            onScenarioComplete?.({
              lesson_id: lesson.id,
              completed_at: '2026-05-25T01:00:00.000Z',
              selected_choice_ids: { 'step-1': 'choice-1' },
              visited_step_ids: ['step-1'],
            })
          }
        >
          Complete scenario lesson
        </button>
      )}
      {lesson.content.type === 'drag_to_order' && (
        <button
          type="button"
          onClick={() =>
            onOrderingComplete?.({
              lesson_id: lesson.id,
              completed_at: '2026-05-25T01:00:00.000Z',
              ordered_step_ids: ['step-1', 'step-2'],
              attempt_count: 2,
            })
          }
        >
          Complete ordering lesson
        </button>
      )}
      {lesson.content.type === 'video' && (
        <button
          type="button"
          onClick={() =>
            onVideoCheckpointProgress?.({
              lesson_id: lesson.id,
              answered_checkpoint_ids: ['checkpoint-1'],
              required_checkpoint_ids: ['checkpoint-1'],
              all_required_answered: true,
              completions: [
                {
                  checkpoint_id: 'checkpoint-1',
                  answered_at: '2026-05-25T01:00:00.000Z',
                  selected_option_index: 0,
                  correct: true,
                },
              ],
            })
          }
        >
          Complete video checkpoints
        </button>
      )}
    </div>
  ),
}));

function makeModule(id = 'mod-test'): Module {
  return {
    id,
    course_id: 'course-test',
    title: 'Redex Academy Test Module',
    order_index: 1,
    criticality: 'required',
    estimated_minutes: 30,
  };
}

function makeLesson(overrides: Partial<Lesson> & { id: string; lesson_type?: LessonType }): Lesson {
  return {
    module_id: 'mod-test',
    order_index: 0,
    title: 'Redex Academy Test Lesson',
    criticality: 'required' as Criticality,
    estimated_minutes: 10,
    lesson_type: 'text',
    content: { type: 'text', body_markdown: 'Test body' },
    ...overrides,
    id: overrides.id,
  } as Lesson;
}

describe('Redex Academy learner module player', () => {
  it('renders the empty-module fallback and allows exiting to dashboard', async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();

    render(<ModulePlayer module={makeModule()} lessons={[]} onExit={onExit} />);

    expect(screen.getByText('No lessons in this module yet.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /back to dashboard/i }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('renders the lesson-unavailable fallback when current index becomes out of bounds', () => {
    const module = makeModule();
    const first = makeLesson({ id: 'L1', title: 'Lesson One' });
    const second = makeLesson({ id: 'L2', title: 'Lesson Two' });
    const { rerender } = render(
      <ModulePlayer module={module} lessons={[first, second]} initialLessonId="L2" />
    );

    rerender(<ModulePlayer module={module} lessons={[first]} initialLessonId="L1" />);

    expect(screen.getByRole('heading', { name: 'Lesson unavailable' })).toBeInTheDocument();
  });

  it('locks quiz lessons when content.type is quiz and not completed', () => {
    const quizLesson = makeLesson({
      id: 'lesson-quiz',
      lesson_type: 'text',
      content: {
        type: 'quiz',
        passing_threshold: 80,
        allow_retakes: true,
        questions: [],
      },
    });

    render(<ModulePlayer module={makeModule()} lessons={[quizLesson]} completedLessonIds={[]} />);

    expect(screen.getByRole('button', { name: /pass quiz to continue/i })).toBeDisabled();
    expect(screen.getByText(/Pass the quiz above/i)).toBeInTheDocument();
  });

  it('does not lock a quiz lesson when it is already completed', () => {
    const quizLesson = makeLesson({
      id: 'lesson-quiz',
      content: {
        type: 'quiz',
        passing_threshold: 80,
        allow_retakes: true,
        questions: [],
      },
    });

    render(
      <ModulePlayer
        module={makeModule()}
        lessons={[quizLesson]}
        completedLessonIds={['lesson-quiz']}
      />
    );

    expect(screen.getByRole('heading', { name: /you've completed redex academy test module/i })).toBeInTheDocument();
    expect(screen.queryByText(/Pass the quiz above/i)).not.toBeInTheDocument();
  });

  it('uses content.type (not lesson_type) for quiz lock discriminant', () => {
    const lessonTypeQuizButTextContent = makeLesson({
      id: 'lesson-discriminant',
      lesson_type: 'quiz',
      content: { type: 'text', body_markdown: 'Not a quiz payload' },
    });

    render(
      <ModulePlayer module={makeModule()} lessons={[lessonTypeQuizButTextContent]} completedLessonIds={[]} />
    );

    expect(screen.getByRole('button', { name: /complete module/i })).toBeEnabled();
    expect(screen.queryByText(/Pass the quiz above/i)).not.toBeInTheDocument();
  });

  it('locks later required sidebar lessons until prior required lessons are complete', () => {
    const lessons = [
      makeLesson({ id: 'L1', title: 'Lesson 1', order_index: 0 }),
      makeLesson({ id: 'L2', title: 'Lesson 2', order_index: 1 }),
      makeLesson({ id: 'L3', title: 'Lesson 3', order_index: 2 }),
    ];

    render(<ModulePlayer module={makeModule()} lessons={lessons} completedLessonIds={[]} />);

    expect(screen.getByRole('button', { name: /lesson 1/i })).toHaveAttribute('aria-disabled', 'false');
    expect(screen.getByRole('button', { name: /lesson 2/i })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: /lesson 3/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('unlocks the next lesson when prior required lessons are completed', () => {
    const lessons = [
      makeLesson({ id: 'L1', title: 'Lesson 1', order_index: 0 }),
      makeLesson({ id: 'L2', title: 'Lesson 2', order_index: 1 }),
      makeLesson({ id: 'L3', title: 'Lesson 3', order_index: 2 }),
    ];

    render(
      <ModulePlayer module={makeModule()} lessons={lessons} completedLessonIds={['L1']} initialLessonId="L1" />
    );

    expect(screen.getByRole('button', { name: /lesson 2/i })).toHaveAttribute('aria-disabled', 'false');
    expect(screen.getByRole('button', { name: /lesson 3/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps current and completed lessons navigable', async () => {
    const user = userEvent.setup();
    const lessons = [
      makeLesson({ id: 'L1', title: 'Lesson 1', order_index: 0 }),
      makeLesson({ id: 'L2', title: 'Lesson 2', order_index: 1 }),
      makeLesson({ id: 'L3', title: 'Lesson 3', order_index: 2 }),
    ];

    render(
      <ModulePlayer module={makeModule()} lessons={lessons} completedLessonIds={['L1']} initialLessonId="L2" />
    );

    expect(screen.getByRole('button', { name: /lesson 2/i })).toHaveAttribute('aria-disabled', 'false');

    await user.click(screen.getByRole('button', { name: /lesson 1/i }));
    expect(screen.getByText('LESSON 1 OF 3')).toBeInTheDocument();
  });

  it('shows the expected progress bar width from completed lesson percentage', () => {
    const lessons = [
      makeLesson({ id: 'L1', title: 'Lesson 1', order_index: 0 }),
      makeLesson({ id: 'L2', title: 'Lesson 2', order_index: 1 }),
      makeLesson({ id: 'L3', title: 'Lesson 3', order_index: 2 }),
    ];
    const { container, rerender } = render(
      <ModulePlayer module={makeModule()} lessons={lessons} completedLessonIds={['L1']} />
    );

    expect(screen.getByText('33% complete')).toBeInTheDocument();
    expect(container.querySelector('div[style="width: 33%;"]')).toBeInTheDocument();

    rerender(
      <ModulePlayer module={makeModule()} lessons={lessons} completedLessonIds={['L1', 'L2', 'L3']} />
    );

    expect(screen.getByText('100% complete')).toBeInTheDocument();
    expect(container.querySelector('div[style="width: 100%;"]')).toBeInTheDocument();
  });

  it('fires onProgressUpdate when Mark Complete is clicked for a non-quiz lesson', async () => {
    const user = userEvent.setup();
    const onProgressUpdate = vi.fn();
    const textLesson = makeLesson({
      id: 'lesson-text',
      content: { type: 'text', body_markdown: 'Body' },
    });

    render(
      <ModulePlayer
        module={makeModule()}
        lessons={[textLesson, makeLesson({ id: 'lesson-2', order_index: 1 })]}
        onProgressUpdate={onProgressUpdate}
      />
    );

    await user.click(screen.getByRole('button', { name: /mark complete & continue/i }));

    expect(onProgressUpdate).toHaveBeenCalledWith('lesson-text', 'completed');
    expect(onProgressUpdate).toHaveBeenCalledTimes(1);
  });

  it('fires onQuizAttempt and shows completion after a passing quiz', async () => {
    const user = userEvent.setup();
    const onProgressUpdate = vi.fn();
    const onQuizAttempt = vi.fn();
    const quizLesson = makeLesson({
      id: 'lesson-final-quiz',
      title: 'Final Quiz',
      content: {
        type: 'quiz',
        passing_threshold: 80,
        allow_retakes: true,
        questions: [],
      },
    });

    render(
      <ModulePlayer
        module={makeModule('hr-basics-mod-001')}
        lessons={[quizLesson]}
        onProgressUpdate={onProgressUpdate}
        onQuizAttempt={onQuizAttempt}
      />
    );

    await user.click(screen.getByRole('button', { name: /complete quiz pass/i }));

    expect(onQuizAttempt).toHaveBeenCalledWith('lesson-final-quiz', {
      score: 100,
      passed: true,
      answers: { Q1: 0, Q2: 1 },
    });
    expect(onProgressUpdate).toHaveBeenCalledWith('lesson-final-quiz', 'completed');
    expect(screen.getByRole('heading', { name: /you've completed redex academy test module/i })).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Passed')).toBeInTheDocument();
  });

  it('shows outcome panel on completion when module includes learning outcomes', async () => {
    const user = userEvent.setup();
    const quizLesson = makeLesson({
      id: 'lesson-final-quiz',
      title: 'Final Quiz',
      content: {
        type: 'quiz',
        passing_threshold: 80,
        allow_retakes: true,
        questions: [],
      },
    });

    render(
      <ModulePlayer
        module={{ ...makeModule('hr-basics-mod-001'), learning_outcomes: ['identify policy boundaries', 'complete required actions', 'escalate unresolved issues'] } as Module}
        lessons={[quizLesson]}
      />
    );

    await user.click(screen.getByRole('button', { name: /complete quiz pass/i }));

    expect(screen.getByText('What you can now do')).toBeInTheDocument();
    expect(screen.getAllByText('• identify policy boundaries').length).toBeGreaterThan(0);
  });

  it('fires onQuizAttempt for a failed quiz without marking the lesson complete', async () => {
    const user = userEvent.setup();
    const onProgressUpdate = vi.fn();
    const onQuizAttempt = vi.fn();
    const quizLesson = makeLesson({
      id: 'lesson-final-quiz',
      title: 'Final Quiz',
      content: {
        type: 'quiz',
        passing_threshold: 80,
        allow_retakes: true,
        questions: [],
      },
    });

    render(
      <ModulePlayer
        module={makeModule('hr-basics-mod-001')}
        lessons={[quizLesson]}
        onProgressUpdate={onProgressUpdate}
        onQuizAttempt={onQuizAttempt}
      />
    );

    await user.click(screen.getByRole('button', { name: /complete quiz fail/i }));

    expect(onQuizAttempt).toHaveBeenCalledWith('lesson-final-quiz', {
      score: 50,
      passed: false,
      answers: { Q1: 1, Q2: 1 },
    });
    expect(onProgressUpdate).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /pass quiz to continue/i })).toBeDisabled();
  });

  it('marks acknowledgment lessons complete and advances after acknowledge callback', async () => {
    const user = userEvent.setup();
    const onProgressUpdate = vi.fn();
    const acknowledgmentLesson = makeLesson({
      id: 'lesson-ack',
      title: 'Required Acknowledgment',
      content: {
        type: 'acknowledgment',
        statement_markdown: 'I understand the HR basics.',
        required_signature: 'click',
      },
    });
    const nextLesson = makeLesson({ id: 'lesson-next', title: 'Next Lesson', order_index: 1 });

    render(
      <ModulePlayer
        module={makeModule()}
        lessons={[acknowledgmentLesson, nextLesson]}
        onProgressUpdate={onProgressUpdate}
      />
    );

    await user.click(screen.getByRole('button', { name: /acknowledge lesson/i }));

    expect(onProgressUpdate).toHaveBeenCalledWith('lesson-ack', 'completed');
    expect(screen.getByText('LESSON 2 OF 2')).toBeInTheDocument();
    expect(screen.getAllByText('Next Lesson')).toHaveLength(2);
  });

  it('prevents footer bypass for acknowledgment until renderer callback completes lesson', async () => {
    const user = userEvent.setup();
    const onProgressUpdate = vi.fn();

    const acknowledgmentLesson = makeLesson({
      id: 'lesson-ack',
      title: 'Required Acknowledgment',
      content: {
        type: 'acknowledgment',
        statement_markdown: 'I understand policy.',
        required_signature: 'click',
      },
    });
    const nextLesson = makeLesson({ id: 'lesson-next', title: 'Next Lesson', order_index: 1 });

    render(
      <ModulePlayer
        module={makeModule()}
        lessons={[acknowledgmentLesson, nextLesson]}
        onProgressUpdate={onProgressUpdate}
      />,
    );

    expect(screen.getByRole('button', { name: /complete above to continue/i })).toBeDisabled();
    expect(screen.getByText(/Complete the acknowledgment above to continue./i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /acknowledge lesson/i }));

    expect(onProgressUpdate).toHaveBeenCalledWith('lesson-ack', 'completed');
    expect(screen.getByText('LESSON 2 OF 2')).toBeInTheDocument();
  });

  it('prevents footer bypass for checklist until renderer callback completes lesson', async () => {
    const user = userEvent.setup();
    const onProgressUpdate = vi.fn();

    const checklistLesson = makeLesson({
      id: 'lesson-checklist',
      title: 'Checklist',
      content: {
        type: 'checklist',
        intro_markdown: 'Do all steps',
        require_all: true,
        items: [{ id: 'item-1', label: 'First step' }],
      },
    });
    const nextLesson = makeLesson({ id: 'lesson-next', title: 'Next Lesson', order_index: 1 });

    render(
      <ModulePlayer
        module={makeModule()}
        lessons={[checklistLesson, nextLesson]}
        onProgressUpdate={onProgressUpdate}
      />,
    );

    expect(screen.getByRole('button', { name: /complete above to continue/i })).toBeDisabled();
    expect(screen.getByText(/Complete the checklist above to continue./i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /complete checklist lesson/i }));

    expect(onProgressUpdate).toHaveBeenCalledWith('lesson-checklist', 'completed');
    expect(screen.getByText('LESSON 2 OF 2')).toBeInTheDocument();
  });

  it('prevents footer bypass for scenario until renderer callback completes lesson', async () => {
    const user = userEvent.setup();
    const onProgressUpdate = vi.fn();

    const scenarioLesson = makeLesson({
      id: 'lesson-scenario',
      title: 'Scenario Lesson',
      content: {
        type: 'scenario',
        intro_markdown: 'Intro',
        steps: [{ id: 'step-1', prompt_markdown: 'Prompt', choices: [{ id: 'choice-1', label: 'Choice' }] }],
      },
    });
    const nextLesson = makeLesson({ id: 'lesson-next', title: 'Next Lesson', order_index: 1 });

    render(
      <ModulePlayer
        module={makeModule()}
        lessons={[scenarioLesson, nextLesson]}
        onProgressUpdate={onProgressUpdate}
      />,
    );

    expect(screen.getByRole('button', { name: /complete scenario to continue/i })).toBeDisabled();
    expect(screen.getByText(/Complete the scenario above to continue./i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /complete scenario lesson/i }));

    expect(onProgressUpdate).toHaveBeenCalledWith('lesson-scenario', 'completed');
    expect(screen.getByText('LESSON 2 OF 2')).toBeInTheDocument();
  });

  it('keeps video lessons without checkpoints manually completable', async () => {
    const user = userEvent.setup();
    const onProgressUpdate = vi.fn();

    const videoLesson = makeLesson({
      id: 'lesson-video-open',
      title: 'Open Video Lesson',
      content: {
        type: 'video',
        video_url: 'https://example.com/video.mp4',
      },
    });
    const nextLesson = makeLesson({ id: 'lesson-next', title: 'Next Lesson', order_index: 1 });

    render(<ModulePlayer module={makeModule()} lessons={[videoLesson, nextLesson]} onProgressUpdate={onProgressUpdate} />);

    expect(screen.queryByText(/Answer the video checkpoints above to continue./i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /mark complete & continue/i }));

    expect(onProgressUpdate).toHaveBeenCalledWith('lesson-video-open', 'completed');
    expect(screen.getByText('LESSON 2 OF 2')).toBeInTheDocument();
  });

  it('does not dead-end unavailable or unreachable video checkpoints behind the inline lock', () => {
    const unavailableVideoLesson = makeLesson({
      id: 'lesson-video-unavailable',
      title: 'Unavailable Video Lesson',
      content: {
        type: 'video',
        video_url: '',
        duration_seconds: 30,
        checkpoints: [{ id: 'checkpoint-1', at_seconds: 10, question: 'Unreachable?', required: true }],
      },
    });

    const { rerender } = render(<ModulePlayer module={makeModule()} lessons={[unavailableVideoLesson]} />);

    expect(screen.queryByText(/Answer the video checkpoints above to continue./i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete module/i })).toBeEnabled();

    const beyondDurationVideoLesson = makeLesson({
      id: 'lesson-video-beyond-duration',
      title: 'Beyond Duration Video Lesson',
      content: {
        type: 'video',
        video_url: 'https://example.com/video.mp4',
        duration_seconds: 30,
        checkpoints: [{ id: 'checkpoint-1', at_seconds: 45, question: 'Unreachable?', required: true }],
      },
    });

    rerender(<ModulePlayer module={makeModule()} lessons={[beyondDurationVideoLesson]} />);

    expect(screen.queryByText(/Answer the video checkpoints above to continue./i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete module/i })).toBeEnabled();

    const invalidCorrectnessRequiredVideoLesson = makeLesson({
      id: 'lesson-video-invalid-correctness-required',
      title: 'Invalid Correctness Required Video Lesson',
      content: {
        type: 'video',
        video_url: 'https://example.com/video.mp4',
        duration_seconds: 30,
        checkpoints: [
          {
            id: 'checkpoint-1',
            at_seconds: 10,
            question: 'Malformed correctness-required checkpoint?',
            options: ['Only option'],
            correct_index: 4,
            required: true,
            must_answer_correctly: true,
          },
        ],
      },
    });

    rerender(<ModulePlayer module={makeModule()} lessons={[invalidCorrectnessRequiredVideoLesson]} />);

    expect(screen.queryByText(/Answer the video checkpoints above to continue./i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete module/i })).toBeEnabled();
  });

  it('prevents footer bypass for video until required checkpoint progress is complete', async () => {
    const user = userEvent.setup();
    const onProgressUpdate = vi.fn();

    const videoLesson = makeLesson({
      id: 'lesson-video-gated',
      title: 'Gated Video Lesson',
      content: {
        type: 'video',
        video_url: 'https://example.com/video.mp4',
        checkpoints: [
          {
            id: 'checkpoint-1',
            at_seconds: 15,
            question: 'What is required?',
            options: ['Answer'],
            required: true,
          },
        ],
      },
    });
    const nextLesson = makeLesson({ id: 'lesson-next', title: 'Next Lesson', order_index: 1 });

    render(<ModulePlayer module={makeModule()} lessons={[videoLesson, nextLesson]} onProgressUpdate={onProgressUpdate} />);

    expect(screen.getByRole('button', { name: /answer checkpoints to continue/i })).toBeDisabled();
    expect(screen.getByText(/Answer the video checkpoints above to continue./i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /complete video checkpoints/i }));

    expect(onProgressUpdate).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /mark complete & continue/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /mark complete & continue/i }));

    expect(onProgressUpdate).toHaveBeenCalledWith('lesson-video-gated', 'completed');
    expect(screen.getByText('LESSON 2 OF 2')).toBeInTheDocument();
  });

  it('does not lock completed video lessons with required checkpoints', () => {
    const videoLesson = makeLesson({
      id: 'lesson-video-complete',
      title: 'Completed Video Lesson',
      content: {
        type: 'video',
        video_url: 'https://example.com/video.mp4',
        checkpoints: [
          {
            id: 'checkpoint-1',
            at_seconds: 15,
            question: 'What is required?',
            required: true,
          },
        ],
      },
    });
    const nextLesson = makeLesson({ id: 'lesson-next', title: 'Next Lesson', order_index: 1 });

    render(
      <ModulePlayer
        module={makeModule()}
        lessons={[videoLesson, nextLesson]}
        completedLessonIds={['lesson-video-complete']}
        initialLessonId="lesson-video-complete"
      />,
    );

    expect(screen.queryByText(/Answer the video checkpoints above to continue./i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark complete & continue/i })).toBeEnabled();
  });

  it('prevents footer bypass for ordering until renderer callback completes lesson', async () => {
    const user = userEvent.setup();
    const onProgressUpdate = vi.fn();

    const orderingLesson = makeLesson({
      id: 'lesson-ordering',
      title: 'Ordering Lesson',
      content: {
        type: 'drag_to_order',
        intro_markdown: 'Order these steps',
        steps: [
          { id: 'step-1', label: 'First step' },
          { id: 'step-2', label: 'Second step' },
        ],
      },
    });
    const nextLesson = makeLesson({ id: 'lesson-next', title: 'Next Lesson', order_index: 1 });

    render(
      <ModulePlayer
        module={makeModule()}
        lessons={[orderingLesson, nextLesson]}
        onProgressUpdate={onProgressUpdate}
      />,
    );

    expect(screen.getByRole('button', { name: /complete sequence to continue/i })).toBeDisabled();
    expect(screen.getByText(/Complete the sequence above to continue./i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /complete ordering lesson/i }));

    expect(onProgressUpdate).toHaveBeenCalledWith('lesson-ordering', 'completed');
    expect(screen.getByText('LESSON 2 OF 2')).toBeInTheDocument();
  });

  it('does not dead-end malformed ordering content behind the inline lock', () => {
    const orderingLesson = makeLesson({
      id: 'lesson-ordering-empty',
      title: 'Empty Ordering Lesson',
      content: {
        type: 'drag_to_order',
        intro_markdown: 'Order these steps',
        steps: [],
      },
    });

    render(<ModulePlayer module={makeModule()} lessons={[orderingLesson]} />);

    expect(screen.queryByText(/Complete the sequence above to continue./i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete module/i })).toBeEnabled();
  });

  it('forwards ordering completion metadata through side-channel callback', async () => {
    const user = userEvent.setup();
    const onOrderingComplete = vi.fn();

    const orderingLesson = makeLesson({
      id: 'lesson-ordering',
      content: {
        type: 'drag_to_order',
        intro_markdown: 'Order these steps',
        steps: [
          { id: 'step-1', label: 'First step' },
          { id: 'step-2', label: 'Second step' },
        ],
      },
    });

    render(
      <ModulePlayer
        module={makeModule()}
        lessons={[orderingLesson]}
        onOrderingComplete={onOrderingComplete}
      />,
    );

    await user.click(screen.getByRole('button', { name: /complete ordering lesson/i }));

    expect(onOrderingComplete).toHaveBeenCalledWith({
      lesson_id: 'lesson-ordering',
      completed_at: '2026-05-25T01:00:00.000Z',
      ordered_step_ids: ['step-1', 'step-2'],
      attempt_count: 2,
    });
  });

  it('forwards scenario completion metadata through side-channel callback', async () => {
    const user = userEvent.setup();
    const onScenarioComplete = vi.fn();

    const scenarioLesson = makeLesson({
      id: 'lesson-scenario',
      content: {
        type: 'scenario',
        intro_markdown: 'Intro',
        steps: [{ id: 'step-1', prompt_markdown: 'Prompt', choices: [{ id: 'choice-1', label: 'Choice' }] }],
      },
    });

    render(
      <ModulePlayer
        module={makeModule()}
        lessons={[scenarioLesson]}
        onScenarioComplete={onScenarioComplete}
      />,
    );

    await user.click(screen.getByRole('button', { name: /complete scenario lesson/i }));

    expect(onScenarioComplete).toHaveBeenCalledWith({
      lesson_id: 'lesson-scenario',
      completed_at: '2026-05-25T01:00:00.000Z',
      selected_choice_ids: { 'step-1': 'choice-1' },
      visited_step_ids: ['step-1'],
    });
  });

  it('forwards acknowledgment/checklist completion metadata through side-channel callbacks', async () => {
    const user = userEvent.setup();
    const onAcknowledgmentComplete = vi.fn();
    const onChecklistComplete = vi.fn();

    const acknowledgmentLesson = makeLesson({
      id: 'lesson-ack',
      content: {
        type: 'acknowledgment',
        statement_markdown: 'Acknowledge',
        required_signature: 'click',
      },
    });

    const checklistLesson = makeLesson({
      id: 'lesson-checklist',
      order_index: 1,
      content: {
        type: 'checklist',
        intro_markdown: 'Checklist',
        require_all: true,
        items: [{ id: 'item-1', label: 'Step one' }],
      },
    });

    render(
      <ModulePlayer
        module={makeModule()}
        lessons={[acknowledgmentLesson, checklistLesson]}
        onAcknowledgmentComplete={onAcknowledgmentComplete}
        onChecklistComplete={onChecklistComplete}
      />,
    );

    await user.click(screen.getByRole('button', { name: /acknowledge lesson/i }));

    expect(onAcknowledgmentComplete).toHaveBeenCalledWith({
      lesson_id: 'lesson-ack',
      signature_method: 'click',
      acknowledged_at: '2026-05-25T01:00:00.000Z',
    });

    await user.click(screen.getByRole('button', { name: /complete checklist lesson/i }));

    expect(onChecklistComplete).toHaveBeenCalledWith({
      lesson_id: 'lesson-checklist',
      checked_item_ids: ['item-1'],
      completed_at: '2026-05-25T01:00:00.000Z',
      require_all: true,
    });
  });

  it('shows completion inline after the final lesson and calls onCompleteModule from Back to dashboard', async () => {
    const user = userEvent.setup();
    const onCompleteModule = vi.fn();

    render(
      <ModulePlayer
        module={makeModule(undefined)}
        lessons={[makeLesson({ id: 'L1', title: 'Only Lesson' })]}
        onCompleteModule={onCompleteModule}
      />
    );

    await user.click(screen.getByRole('button', { name: /complete module/i }));

    expect(onCompleteModule).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /you've completed redex academy test module/i })).toBeInTheDocument();

    const completionBackButton = screen.getAllByRole('button', { name: /back to dashboard/i }).at(-1);
    expect(completionBackButton).toBeDefined();
    await user.click(completionBackButton!);
    expect(onCompleteModule).toHaveBeenCalledTimes(1);
  });

  it('exposes locked sidebar button a11y description via aria-describedby', () => {
    const lessons = [
      makeLesson({ id: 'L1', title: 'Lesson 1', order_index: 0 }),
      makeLesson({ id: 'L2', title: 'Lesson 2', order_index: 1 }),
    ];

    render(<ModulePlayer module={makeModule()} lessons={lessons} completedLessonIds={[]} />);

    const lockedButton = screen.getByRole('button', { name: /lesson 2/i });
    expect(lockedButton).toHaveAttribute('aria-disabled', 'true');

    const describedBy = lockedButton.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const descriptionSpan = describedBy ? document.getElementById(describedBy) : null;
    expect(descriptionSpan).toBeInTheDocument();
    expect(descriptionSpan).toHaveTextContent('Locked. Complete required lessons in order to unlock.');
  });
});
