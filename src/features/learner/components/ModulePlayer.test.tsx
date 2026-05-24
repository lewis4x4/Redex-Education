import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ModulePlayer } from './ModulePlayer';
import type { Criticality, Lesson, LessonType, Module } from '@/lib/education';

vi.mock('./LessonContentRenderer', () => ({
  LessonContentRenderer: ({
    lesson,
    onAcknowledge,
    onQuizComplete,
  }: {
    lesson: Lesson;
    onAcknowledge?: () => void;
    onQuizComplete?: (score: number, passed: boolean, answers: Record<string, number>) => void;
  }) => (
    <div data-testid="lesson-content-renderer">
      Rendering {lesson.id}
      {lesson.content.type === 'acknowledgment' && (
        <button type="button" onClick={onAcknowledge}>Acknowledge lesson</button>
      )}
      {lesson.content.type === 'quiz' && (
        <>
          <button type="button" onClick={() => onQuizComplete?.(100, true, { Q1: 0, Q2: 1 })}>Complete quiz pass</button>
          <button type="button" onClick={() => onQuizComplete?.(50, false, { Q1: 1, Q2: 1 })}>Complete quiz fail</button>
        </>
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
