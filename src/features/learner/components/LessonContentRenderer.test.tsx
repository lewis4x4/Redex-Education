import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LessonContentRenderer } from './LessonContentRenderer';
import type { Lesson } from '@/lib/education';

function makeAcknowledgmentLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'lesson-ack',
    module_id: 'mod-test',
    title: 'Required Acknowledgment',
    lesson_type: 'acknowledgment',
    criticality: 'required',
    order_index: 1,
    estimated_minutes: 2,
    content: {
      type: 'acknowledgment',
      statement_markdown: 'I acknowledge that I have read and understood the HR Basics content.',
      required_signature: 'click',
      policy_ref: 'HR-BASICS-001',
    },
    ...overrides,
  };
}

function makeChecklistLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'lesson-checklist',
    module_id: 'mod-test',
    title: 'Onboarding checklist',
    lesson_type: 'checklist',
    criticality: 'required',
    order_index: 2,
    estimated_minutes: 4,
    content: {
      type: 'checklist',
      intro_markdown: 'Use this checklist before day one.',
      require_all: true,
      items: [
        { id: 'item-1', label: 'Confirm paperwork', details_markdown: 'Bring your **I-9** documents.' },
        { id: 'item-2', label: 'Review handbook' },
      ],
    },
    ...overrides,
  };
}

function makeScenarioLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'lesson-scenario',
    module_id: 'mod-test',
    title: 'Branching scenario',
    lesson_type: 'scenario',
    criticality: 'required',
    order_index: 3,
    estimated_minutes: 6,
    content: {
      type: 'scenario',
      intro_markdown: 'Welcome to the scenario.',
      steps: [
        {
          id: 'step-1',
          prompt_markdown: 'A customer reports a missing package. What do you do first?',
          choices: [
            { id: 'choice-1a', label: 'Escalate immediately', is_correct: false, feedback_markdown: 'Try gathering account details first.' },
            { id: 'choice-1b', label: 'Confirm account details', is_correct: true, feedback_markdown: 'Great start.', next_step_id: 'step-2' },
          ],
        },
        {
          id: 'step-2',
          prompt_markdown: 'You confirmed details. What next?',
          choices: [
            { id: 'choice-2a', label: 'Open an investigation', is_correct: true, feedback_markdown: 'Correct.', next_step_id: 'outcome' },
            { id: 'choice-2b', label: 'Close the ticket', is_correct: false, feedback_markdown: 'This risks unresolved issues.' },
          ],
        },
      ],
      outcome_summary_markdown: 'Outcome: You followed the approved support path.',
    },
    ...overrides,
  };
}

const ORDERING_STEPS = [
  {
    id: 'order-1',
    label: 'Receive the request',
    detail_markdown: 'Start by confirming the request source.',
    source_section_id: 'section-request',
  },
  {
    id: 'order-2',
    label: 'Verify account details',
    detail_markdown: 'Check the **account owner** before changing anything.',
    source_section_id: 'section-verify',
  },
  {
    id: 'order-3',
    label: 'Document the resolution',
    detail_markdown: 'Record the final action in the support log.',
  },
];

function makeOrderingLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'lesson-ordering',
    module_id: 'mod-test',
    title: 'Order the support procedure',
    lesson_type: 'drag_to_order',
    criticality: 'required',
    order_index: 5,
    estimated_minutes: 4,
    content: {
      type: 'drag_to_order',
      intro_markdown: 'Put the approved support steps in order.',
      steps: ORDERING_STEPS,
    },
    ...overrides,
  };
}

function getOrderingLabels(): string[] {
  const list = screen.getByRole('list', { name: /ordering steps/i });

  return within(list).getAllByRole('listitem').map((item) => {
    const matchingStep = ORDERING_STEPS.find((step) => item.textContent?.includes(step.label));
    return matchingStep?.label ?? '';
  });
}

async function moveToCanonicalOrder(user: ReturnType<typeof userEvent.setup>) {
  for (const expectedStep of ORDERING_STEPS) {
    let guard = 0;
    while (getOrderingLabels().indexOf(expectedStep.label) !== ORDERING_STEPS.indexOf(expectedStep) && guard < ORDERING_STEPS.length) {
      await user.click(screen.getByRole('button', { name: `Move "${expectedStep.label}" up` }));
      guard += 1;
    }
  }
}

function makeHotspotLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'lesson-hotspot',
    module_id: 'mod-test',
    title: 'Workstation map',
    lesson_type: 'hotspot_diagram',
    criticality: 'required',
    order_index: 4,
    estimated_minutes: 5,
    content: {
      type: 'hotspot_diagram',
      intro_markdown: 'Tap each hotspot to learn what it does.',
      image_ref: {
        url: 'https://example.com/diagram.png',
        alt_text: 'Warehouse workstation diagram',
        caption: 'Station overview',
      },
      hotspots: [
        {
          id: 'hotspot-1',
          x: 0.2,
          y: 0.4,
          title: 'Badge scanner',
          details_markdown: 'Use your **employee badge** before entering.',
          source_section_id: 'section-1',
        },
        {
          id: 'hotspot-2',
          x: 0.7,
          y: 0.6,
          title: 'Safety locker',
          details_markdown: 'PPE is stored here.',
        },
      ],
    },
    ...overrides,
  };
}

describe('LessonContentRenderer shared scaffold', () => {
  it('wraps text lessons in the lesson scaffold with position, time, and objective', () => {
    render(
      <LessonContentRenderer
        lesson={makeAcknowledgmentLesson({
          id: 'lesson-text-test',
          title: 'Read the HR policy',
          lesson_type: 'text',
          estimated_minutes: 4,
          content: {
            type: 'text',
            body_markdown: 'Read this **carefully** before continuing.',
          },
        })}
        lessonNumber={2}
        totalLessons={7}
      />,
    );

    expect(screen.getByText('Reading lesson')).toBeInTheDocument();
    expect(screen.getByText('Lesson 2 of 7')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Read the HR policy' })).toBeInTheDocument();
    expect(screen.getByText('4 min')).toBeInTheDocument();
    expect(screen.getByText(/What you'll be able to do:/i)).toBeInTheDocument();
    expect(screen.getByText(/carefully/i)).toBeInTheDocument();
  });
});

describe('LessonContentRenderer reading lessons', () => {
  it('renders structured prose, callout, and policy quote blocks', () => {
    render(
      <LessonContentRenderer
        lesson={makeAcknowledgmentLesson({
          id: 'lesson-reading-v2',
          title: 'Structured reading',
          lesson_type: 'text',
          content: {
            type: 'text',
            body_markdown: 'Fallback markdown remains available.',
            blocks: [
              {
                id: 'prose-1',
                kind: 'prose',
                heading: 'Start here',
                markdown: 'Read this **plain-language** explanation. [source: section-1]',
              },
              {
                id: 'callout-1',
                kind: 'callout',
                tone: 'key_takeaway',
                title: 'Remember this',
                markdown: 'Escalate when blocked. [source: section-1]',
              },
              {
                id: 'quote-1',
                kind: 'policy_quote',
                quote_markdown: 'Employees must follow approved escalation paths. [source: policy-1]',
                attribution: 'HR Handbook',
                policy_ref: 'HR-001',
              },
            ],
          },
        })}
      />,
    );

    expect(screen.getByTestId('reading-lesson-v2')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /start here/i })).toBeInTheDocument();
    expect(screen.getByText(/plain-language/i)).toBeInTheDocument();
    expect(screen.getByText('Key takeaway')).toBeInTheDocument();
    expect(screen.getByText('Remember this')).toBeInTheDocument();
    expect(screen.getByText('Policy quote')).toBeInTheDocument();
    expect(screen.getByText('HR-001')).toBeInTheDocument();
  });

  it('keeps inline quick checks local and non-completing', async () => {
    const user = userEvent.setup();
    const onChecklistComplete = vi.fn();

    render(
      <LessonContentRenderer
        lesson={makeAcknowledgmentLesson({
          id: 'lesson-reading-check',
          lesson_type: 'text',
          content: {
            type: 'text',
            body_markdown: 'Fallback.',
            blocks: [
              {
                id: 'check-1',
                kind: 'inline_check',
                prompt: 'What should you do when blocked?',
                options: ['Escalate early', 'Wait silently'],
                correct_option_index: 0,
                feedback_correct_markdown: 'Correct — escalate early.',
                feedback_incorrect_markdown: 'Not quite. Waiting silently delays help.',
              },
            ],
          },
        })}
        onChecklistComplete={onChecklistComplete}
      />,
    );

    const escalateButton = screen.getByRole('button', { name: /escalate early/i });
    const waitButton = screen.getByRole('button', { name: /wait silently/i });

    expect(escalateButton).toHaveAttribute('aria-pressed', 'false');
    expect(waitButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(escalateButton);

    expect(escalateButton).toHaveAttribute('aria-pressed', 'true');
    expect(waitButton).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('status')).toHaveTextContent(/Correct/i);
    expect(onChecklistComplete).not.toHaveBeenCalled();
  });

  it('resets local reading interactions when switching text lesson ids', async () => {
    const user = userEvent.setup();
    const firstLesson = makeAcknowledgmentLesson({
      id: 'lesson-reading-check-1',
      lesson_type: 'text',
      content: {
        type: 'text',
        body_markdown: 'Fallback one.',
        blocks: [
          {
            id: 'check-shared',
            kind: 'inline_check',
            prompt: 'First prompt',
            options: ['First option', 'Second option'],
            correct_option_index: 0,
            feedback_correct_markdown: 'First feedback',
          },
        ],
      },
    });
    const secondLesson = makeAcknowledgmentLesson({
      id: 'lesson-reading-check-2',
      lesson_type: 'text',
      content: {
        type: 'text',
        body_markdown: 'Fallback two.',
        blocks: [
          {
            id: 'check-shared',
            kind: 'inline_check',
            prompt: 'Second prompt',
            options: ['First option', 'Second option'],
            correct_option_index: 0,
            feedback_correct_markdown: 'Second feedback should wait for a new click',
          },
        ],
      },
    });

    const { rerender } = render(<LessonContentRenderer lesson={firstLesson} />);

    await user.click(screen.getByRole('button', { name: /first option/i }));
    expect(screen.getByText('First feedback')).toBeInTheDocument();

    rerender(<LessonContentRenderer lesson={secondLesson} />);

    expect(screen.getByText('Second prompt')).toBeInTheDocument();
    expect(screen.queryByText(/Second feedback should wait/i)).not.toBeInTheDocument();
    expect(screen.queryByText('First feedback')).not.toBeInTheDocument();
  });

  it('renders reference-only collapsibles with accessible disclosure state', async () => {
    const user = userEvent.setup();

    render(
      <LessonContentRenderer
        lesson={makeAcknowledgmentLesson({
          id: 'lesson-reading-reference',
          lesson_type: 'text',
          content: {
            type: 'text',
            body_markdown: 'Fallback.',
            blocks: [
              {
                id: 'reference-1',
                kind: 'collapsible',
                intent: 'reference',
                title: 'Optional policy detail',
                markdown: 'This reference detail is optional.',
              },
            ],
          },
        })}
      />,
    );

    const toggle = screen.getByRole('button', { name: /optional policy detail/i });
    const panelId = toggle.getAttribute('aria-controls');

    expect(panelId).toBeTruthy();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    const panel = document.getElementById(panelId!);
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute('hidden');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(panel).not.toHaveAttribute('hidden');
    expect(screen.getByText(/This reference detail is optional/i)).toBeInTheDocument();
  });

  it('renders copyable config blocks without requiring syntax-highlighting dependencies', async () => {
    const user = userEvent.setup();

    render(
      <LessonContentRenderer
        lesson={makeAcknowledgmentLesson({
          id: 'lesson-reading-config',
          lesson_type: 'text',
          content: {
            type: 'text',
            body_markdown: 'Fallback.',
            blocks: [
              {
                id: 'config-1',
                kind: 'config_block',
                title: 'Example config',
                description_markdown: 'Copy this only when directed.',
                code: 'notify=true\nescalate_after=1d',
                copy_label: 'Copy config',
              },
            ],
          },
        })}
      />,
    );

    const markdownDescription = screen.getByText('Copy this only when directed.');
    expect(markdownDescription.closest('.prose')?.className).toContain('prose-invert');

    expect(screen.getByText((_, element) => element?.tagName === 'CODE' && element.textContent === 'notify=true\nescalate_after=1d')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /copy config/i }));
    expect(screen.getByText(/Copy unavailable|Copied/i)).toBeInTheDocument();
  });

  it('renders pending image placeholders with text equivalents', () => {
    render(
      <LessonContentRenderer
        lesson={makeAcknowledgmentLesson({
          id: 'lesson-reading-image-pending',
          lesson_type: 'text',
          content: {
            type: 'text',
            body_markdown: 'Fallback.',
            blocks: [
              {
                id: 'image-1',
                kind: 'image',
                image_ref: {
                  alt_text: 'Benefits portal screenshot',
                  caption: 'Benefits portal overview',
                  status: 'pending_ingest',
                },
                text_equivalent_markdown: 'The screenshot will show where to find the benefits menu.',
              },
            ],
          },
        })}
      />,
    );

    expect(screen.getByText('Image pending ingest')).toBeInTheDocument();
    expect(screen.getByText('Benefits portal overview')).toBeInTheDocument();
    expect(screen.getByText(/benefits menu/i)).toBeInTheDocument();
  });

  it('renders ready image blocks lazily with alt text, caption, and text equivalent', () => {
    render(
      <LessonContentRenderer
        lesson={makeAcknowledgmentLesson({
          id: 'lesson-reading-image-ready',
          lesson_type: 'text',
          content: {
            type: 'text',
            body_markdown: 'Fallback.',
            blocks: [
              {
                id: 'image-ready-1',
                kind: 'image',
                image_ref: {
                  storage_url: 'https://example.com/storage/benefits.png',
                  alt_text: 'Benefits portal screenshot',
                  caption: 'Benefits portal overview',
                  status: 'ready',
                },
                text_equivalent_markdown: 'The benefits menu appears in the left navigation.',
              },
            ],
          },
        })}
      />,
    );

    const image = screen.getByAltText('Benefits portal screenshot');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText('Benefits portal overview')).toBeInTheDocument();
    expect(screen.getByText(/left navigation/i)).toBeInTheDocument();
  });

  it('shows an amber unavailable panel when text content is empty', () => {
    render(
      <LessonContentRenderer
        lesson={makeAcknowledgmentLesson({
          id: 'lesson-reading-empty',
          lesson_type: 'text',
          content: {
            type: 'text',
            body_markdown: '   ',
            blocks: [],
          },
        })}
      />,
    );

    expect(screen.getByText('Lesson content unavailable')).toBeInTheDocument();
    expect(screen.getByText(/has no published content yet/i)).toBeInTheDocument();
  });

  it('degrades unknown reading block kinds without crashing the whole lesson', () => {
    render(
      <LessonContentRenderer
        lesson={makeAcknowledgmentLesson({
          id: 'lesson-reading-unknown-block',
          lesson_type: 'text',
          content: {
            type: 'text',
            body_markdown: 'Fallback.',
            blocks: [{ id: 'future-1', kind: 'future_kind', markdown: 'Future content' } as never],
          },
        })}
      />,
    );

    expect(screen.getByText(/isn't supported in your current version/i)).toBeInTheDocument();
  });
});

describe('LessonContentRenderer video lessons', () => {
  it('renders the real Redex video lesson surface with transcript and checkpoints', () => {
    render(
      <LessonContentRenderer
        lesson={makeAcknowledgmentLesson({
          id: 'lesson-video-test',
          title: 'Watch the policy walkthrough',
          lesson_type: 'video',
          content: {
            type: 'video',
            video_url: 'https://example.com/video.mp4',
            poster_url: 'https://example.com/poster.jpg',
            duration_seconds: 90,
            transcript_segments: [
              {
                id: 'segment-1',
                start_seconds: 0,
                end_seconds: 90,
                text_markdown: 'Follow the approved escalation path.',
                derived_from_section_ids: ['source-1'],
              },
            ],
            checkpoints: [
              {
                id: 'checkpoint-1',
                at_seconds: 30,
                question: 'What path should you follow?',
                options: ['Approved escalation path', 'Ad hoc escalation'],
                correct_index: 0,
                required: true,
              },
            ],
          },
        })}
        lessonNumber={4}
        totalLessons={7}
      />,
    );

    expect(screen.getByText('Video lesson')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /redex video player/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Training video')).toBeInTheDocument();
    expect(screen.getByText('Transcript')).toBeInTheDocument();
    expect(screen.getByText('Follow the approved escalation path.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download for offline/i })).toBeDisabled();
  });

  it('renders an unavailable state when video content has no asset URL', () => {
    render(
      <LessonContentRenderer
        lesson={makeAcknowledgmentLesson({
          id: 'lesson-video-unavailable',
          title: 'Watch the policy walkthrough',
          lesson_type: 'video',
          content: {
            type: 'video',
            video_url: '',
          },
        })}
      />,
    );

    expect(screen.getByText('Video lesson unavailable')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /video asset not ready/i })).toBeInTheDocument();
  });
});

describe('LessonContentRenderer checklist lessons', () => {
  it('renders guided checklist scaffold content with intro and items', () => {
    render(<LessonContentRenderer lesson={makeChecklistLesson()} lessonNumber={3} totalLessons={7} />);

    expect(screen.getByText('Guided checklist')).toBeInTheDocument();
    expect(screen.getByText('Use this checklist before day one.')).toBeInTheDocument();
    expect(screen.getByText('Confirm paperwork')).toBeInTheDocument();
    expect(screen.getByText('Review handbook')).toBeInTheDocument();
  });

  it('enforces require_all=true before allowing completion and returns payload', async () => {
    const user = userEvent.setup();
    const onChecklistComplete = vi.fn();

    render(<LessonContentRenderer lesson={makeChecklistLesson()} onChecklistComplete={onChecklistComplete} />);

    const completeButton = screen.getByRole('button', { name: /complete checklist/i });
    expect(completeButton).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: /confirm paperwork/i }));
    expect(completeButton).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: /review handbook/i }));
    expect(completeButton).toBeEnabled();

    await user.click(completeButton);

    expect(onChecklistComplete).toHaveBeenCalledTimes(1);
    expect(onChecklistComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        lesson_id: 'lesson-checklist',
        checked_item_ids: ['item-1', 'item-2'],
        require_all: true,
        completed_at: expect.stringMatching(/T/),
      }),
    );
  });

  it('toggles checklist details with accessible expansion controls', async () => {
    const user = userEvent.setup();

    render(<LessonContentRenderer lesson={makeChecklistLesson()} />);

    const detailsButton = screen.getByRole('button', { name: /show details/i });
    expect(detailsButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(detailsButton);

    expect(detailsButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Bring your/i)).toBeInTheDocument();
  });

  it('allows immediate completion when require_all=false', async () => {
    const user = userEvent.setup();
    const onChecklistComplete = vi.fn();

    render(
      <LessonContentRenderer
        lesson={makeChecklistLesson({
          content: {
            type: 'checklist',
            intro_markdown: 'Optional completion checklist.',
            require_all: false,
            items: [{ id: 'item-1', label: 'Optional review' }],
          },
        })}
        onChecklistComplete={onChecklistComplete}
      />,
    );

    const completeButton = screen.getByRole('button', { name: /complete checklist/i });
    expect(completeButton).toBeEnabled();

    await user.click(completeButton);

    expect(onChecklistComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        lesson_id: 'lesson-checklist',
        checked_item_ids: [],
        require_all: false,
        completed_at: expect.stringMatching(/T/),
      }),
    );
  });
});

describe('LessonContentRenderer scenario lessons', () => {
  it('renders intro and starts scenario flow', async () => {
    const user = userEvent.setup();

    render(<LessonContentRenderer lesson={makeScenarioLesson()} />);

    expect(screen.getByText('Scenario lesson')).toBeInTheDocument();
    expect(screen.getByText('Welcome to the scenario.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /start scenario/i }));

    expect(screen.getByText(/A customer reports a missing package/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Escalate immediately/i })).toBeInTheDocument();
  });

  it('shows immediate feedback and supports wrong-path recovery', async () => {
    const user = userEvent.setup();

    render(<LessonContentRenderer lesson={makeScenarioLesson()} />);

    await user.click(screen.getByRole('button', { name: /start scenario/i }));
    await user.click(screen.getByRole('button', { name: /Escalate immediately/i }));

    const feedbackRegion = screen.getByRole('status');
    expect(feedbackRegion).toHaveAttribute('aria-live', 'polite');
    expect(feedbackRegion).toHaveTextContent(/Try gathering account details first./i);

    await user.click(screen.getByRole('button', { name: /try another choice/i }));

    expect(screen.queryByText(/Try gathering account details first./i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm account details/i })).toBeEnabled();
  });

  it('navigates explicit branches and reaches outcome summary', async () => {
    const user = userEvent.setup();

    render(<LessonContentRenderer lesson={makeScenarioLesson()} />);

    await user.click(screen.getByRole('button', { name: /start scenario/i }));
    await user.click(screen.getByRole('button', { name: /Confirm account details/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    expect(screen.getByText(/You confirmed details. What next/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Open an investigation/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    expect(screen.getByText(/Outcome: You followed the approved support path./i)).toBeInTheDocument();
  });

  it('calls completion callback once with scenario payload', async () => {
    const user = userEvent.setup();
    const onScenarioComplete = vi.fn();

    render(<LessonContentRenderer lesson={makeScenarioLesson()} onScenarioComplete={onScenarioComplete} />);

    await user.click(screen.getByRole('button', { name: /start scenario/i }));
    await user.click(screen.getByRole('button', { name: /Confirm account details/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /Open an investigation/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /complete scenario/i }));

    expect(onScenarioComplete).toHaveBeenCalledTimes(1);
    expect(onScenarioComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        lesson_id: 'lesson-scenario',
        completed_at: expect.stringMatching(/T/),
        selected_choice_ids: { 'step-1': 'choice-1b', 'step-2': 'choice-2a' },
        visited_step_ids: ['step-1', 'step-2'],
      }),
    );
  });

  it('resets local state when switching between scenario lessons with different ids', async () => {
    const user = userEvent.setup();

    const lessonOne = makeScenarioLesson({ id: 'lesson-scenario-1', title: 'Scenario One' });
    const lessonTwo = makeScenarioLesson({
      id: 'lesson-scenario-2',
      title: 'Scenario Two',
      content: {
        type: 'scenario',
        intro_markdown: 'Second scenario intro.',
        steps: [
          {
            id: 'step-2a',
            prompt_markdown: 'Second scenario prompt',
            choices: [{ id: 'choice-2a', label: 'Second choice', is_correct: true, feedback_markdown: 'Second feedback.' }],
          },
        ],
      },
    });

    const { rerender } = render(<LessonContentRenderer lesson={lessonOne} />);

    await user.click(screen.getByRole('button', { name: /start scenario/i }));
    await user.click(screen.getByRole('button', { name: /Escalate immediately/i }));
    expect(screen.getByText(/Try gathering account details first./i)).toBeInTheDocument();

    rerender(<LessonContentRenderer lesson={lessonTwo} />);

    expect(screen.getByText('Second scenario intro.')).toBeInTheDocument();
    expect(screen.queryByText(/Try gathering account details first./i)).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('treats missing is_correct as neutral and allows continue', async () => {
    const user = userEvent.setup();

    render(
      <LessonContentRenderer
        lesson={makeScenarioLesson({
          content: {
            type: 'scenario',
            intro_markdown: '',
            steps: [
              {
                id: 'step-1',
                prompt_markdown: 'Pick a neutral option',
                choices: [{ id: 'choice-neutral', label: 'Neutral choice', feedback_markdown: 'Neutral feedback.' }],
              },
            ],
          },
        })}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Neutral choice/i }));

    expect(screen.getByText(/Neutral feedback./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });
});

describe('LessonContentRenderer hotspot lessons', () => {
  it('renders hotspot scaffold with intro, image, caption, and interactive controls', () => {
    render(<LessonContentRenderer lesson={makeHotspotLesson()} />);

    expect(screen.getByText('Hotspot diagram')).toBeInTheDocument();
    expect(screen.getByText('Tap each hotspot to learn what it does.')).toBeInTheDocument();
    expect(screen.getByAltText('Warehouse workstation diagram')).toBeInTheDocument();
    expect(screen.getByText('Station overview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open hotspot: Badge scanner' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open hotspot: Safety locker' })).toBeInTheDocument();
  });

  it('switches selected hotspot details from pin or list controls', async () => {
    const user = userEvent.setup();
    render(<LessonContentRenderer lesson={makeHotspotLesson()} />);

    expect(screen.getByRole('heading', { name: 'Badge scanner' })).toBeInTheDocument();
    expect(screen.getByText('Source section: section-1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open hotspot: Safety locker' }));
    expect(screen.getByRole('heading', { name: 'Safety locker' })).toBeInTheDocument();
    expect(screen.queryByText('Source section: section-1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Badge scanner' }));
    expect(screen.getByRole('heading', { name: 'Badge scanner' })).toBeInTheDocument();
  });

  it('resets hotspot selection when switching to a different hotspot lesson id', async () => {
    const user = userEvent.setup();

    const lessonOne = makeHotspotLesson();
    const lessonTwo = makeHotspotLesson({
      id: 'lesson-hotspot-2',
      title: 'Second map',
      content: {
        type: 'hotspot_diagram',
        image_ref: {
          url: 'https://example.com/diagram-2.png',
          alt_text: 'Second diagram',
        },
        hotspots: [
          {
            id: 'hotspot-2a',
            x: 0.1,
            y: 0.1,
            title: 'Loading dock',
            details_markdown: 'Dock details.',
          },
        ],
      },
    });

    const { rerender } = render(<LessonContentRenderer lesson={lessonOne} />);

    await user.click(screen.getByRole('button', { name: 'Open hotspot: Safety locker' }));
    expect(screen.getByRole('heading', { name: 'Safety locker' })).toBeInTheDocument();

    rerender(<LessonContentRenderer lesson={lessonTwo} />);

    expect(screen.getByRole('heading', { name: 'Loading dock' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Safety locker' })).not.toBeInTheDocument();
  });

  it('renders an unavailable state for malformed hotspot content', () => {
    render(
      <LessonContentRenderer
        lesson={makeHotspotLesson({
          content: {
            type: 'hotspot_diagram',
            image_ref: { url: '', alt_text: '' },
            hotspots: [],
          },
        })}
      />,
    );

    expect(screen.getByText('Hotspot diagram unavailable')).toBeInTheDocument();
  });

  it('keeps touch-sized hotspot targets', () => {
    render(<LessonContentRenderer lesson={makeHotspotLesson()} />);

    const hotspotButton = screen.getByRole('button', { name: 'Open hotspot: Badge scanner' });
    expect(hotspotButton.className).toContain('h-11');
    expect(hotspotButton.className).toContain('w-11');
  });
});

describe('LessonContentRenderer ordering lessons', () => {
  it('renders sequence scaffold content with intro, details, and source references', () => {
    render(<LessonContentRenderer lesson={makeOrderingLesson()} lessonNumber={5} totalLessons={7} />);

    expect(screen.getByText('Sequence practice')).toBeInTheDocument();
    expect(screen.getByText('Put the approved support steps in order.')).toBeInTheDocument();
    expect(screen.getByText('Receive the request')).toBeInTheDocument();
    expect(screen.getByText('Verify account details')).toBeInTheDocument();
    expect(screen.getByText('Document the resolution')).toBeInTheDocument();
    expect(screen.getByText('Source section: section-request')).toBeInTheDocument();
    expect(screen.getByText('Source section: section-verify')).toBeInTheDocument();
  });

  it('starts in a deterministic shuffled order that contains every step', () => {
    render(<LessonContentRenderer lesson={makeOrderingLesson()} />);

    const visibleOrder = getOrderingLabels();
    expect(visibleOrder).toHaveLength(ORDERING_STEPS.length);
    expect(visibleOrder).not.toEqual(ORDERING_STEPS.map((step) => step.label));
    expect([...visibleOrder].sort()).toEqual(ORDERING_STEPS.map((step) => step.label).sort());
  });

  it('shows incorrect feedback and retry without completing', async () => {
    const user = userEvent.setup();
    const onOrderingComplete = vi.fn();

    render(<LessonContentRenderer lesson={makeOrderingLesson()} onOrderingComplete={onOrderingComplete} />);

    await user.click(screen.getByRole('button', { name: /check order/i }));

    const feedback = screen.getByRole('status');
    expect(feedback).toHaveAttribute('aria-live', 'polite');
    expect(feedback).toHaveTextContent(/Some steps are out of order/i);
    expect(screen.getAllByText(/Expected here:/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(onOrderingComplete).not.toHaveBeenCalled();
  });

  it('supports keyboard/touch reordering and completes once with payload', async () => {
    const user = userEvent.setup();
    const onOrderingComplete = vi.fn();

    render(<LessonContentRenderer lesson={makeOrderingLesson()} onOrderingComplete={onOrderingComplete} />);

    await moveToCanonicalOrder(user);
    await user.click(screen.getByRole('button', { name: /check order/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/Correct — sequence completed/i);
    expect(onOrderingComplete).toHaveBeenCalledTimes(1);
    expect(onOrderingComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        lesson_id: 'lesson-ordering',
        completed_at: expect.stringMatching(/T/),
        ordered_step_ids: ORDERING_STEPS.map((step) => step.id),
        attempt_count: 1,
      }),
    );

    expect(screen.getByRole('button', { name: /order completed/i })).toBeDisabled();
  });

  it('supports drag/drop reordering as an additive pointer path', () => {
    render(<LessonContentRenderer lesson={makeOrderingLesson()} />);

    const before = getOrderingLabels();
    const list = screen.getByRole('list', { name: /ordering steps/i });
    const items = within(list).getAllByRole('listitem');
    const firstItem = items[0];
    const lastItem = items[items.length - 1];

    expect(firstItem).toBeDefined();
    expect(lastItem).toBeDefined();

    fireEvent.dragStart(firstItem!);
    fireEvent.dragOver(lastItem!);
    fireEvent.drop(lastItem!);
    fireEvent.dragEnd(firstItem!);

    expect(getOrderingLabels()).not.toEqual(before);
  });

  it('renders an unavailable state for malformed ordering content', () => {
    render(
      <LessonContentRenderer
        lesson={makeOrderingLesson({
          content: {
            type: 'drag_to_order',
            steps: [],
          },
        })}
      />,
    );

    expect(screen.getByText('Ordering lesson unavailable')).toBeInTheDocument();
  });

  it('resets ordering state when switching lesson ids', async () => {
    const user = userEvent.setup();
    const lessonOne = makeOrderingLesson({ id: 'lesson-ordering-1', title: 'First ordering lesson' });
    const lessonTwo = makeOrderingLesson({
      id: 'lesson-ordering-2',
      title: 'Second ordering lesson',
      content: {
        type: 'drag_to_order',
        intro_markdown: 'Second ordering intro.',
        steps: [
          { id: 'second-1', label: 'First new step' },
          { id: 'second-2', label: 'Second new step' },
        ],
      },
    });

    const { rerender } = render(<LessonContentRenderer lesson={lessonOne} />);

    await user.click(screen.getByRole('button', { name: /check order/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/Some steps are out of order/i);

    rerender(<LessonContentRenderer lesson={lessonTwo} />);

    expect(screen.getByText('Second ordering intro.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('First new step')).toBeInTheDocument();
  });

  it('keeps move controls touch-sized and keyboard focusable', () => {
    render(<LessonContentRenderer lesson={makeOrderingLesson()} />);

    const moveUpButton = screen.getAllByRole('button', { name: /Move ".*" up/i })[0];
    expect(moveUpButton).toBeDefined();
    expect(moveUpButton!.className).toContain('h-11');
    expect(moveUpButton!.className).toContain('w-11');
  });
});

describe('LessonContentRenderer acknowledgment lessons', () => {
  it('enforces click signature before callback and includes timestamp payload', async () => {
    const user = userEvent.setup();
    const onAcknowledge = vi.fn();

    render(<LessonContentRenderer lesson={makeAcknowledgmentLesson()} onAcknowledge={onAcknowledge} />);

    const acknowledgeButton = screen.getByRole('button', { name: 'Acknowledge' });
    expect(acknowledgeButton).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: /i have read and understood this acknowledgment/i }));
    expect(acknowledgeButton).toBeEnabled();

    await user.click(acknowledgeButton);

    expect(onAcknowledge).toHaveBeenCalledWith(
      expect.objectContaining({
        lesson_id: 'lesson-ack',
        signature_method: 'click',
        acknowledged_at: expect.stringMatching(/T/),
      }),
    );
  });

  it('enforces name signature and submits trimmed signature text', async () => {
    const user = userEvent.setup();
    const onAcknowledge = vi.fn();

    render(
      <LessonContentRenderer
        lesson={makeAcknowledgmentLesson({
          content: {
            type: 'acknowledgment',
            statement_markdown: 'Name-sign acknowledgment.',
            required_signature: 'name',
            policy_ref: 'HR-BASICS-002',
          },
        })}
        onAcknowledge={onAcknowledge}
      />,
    );

    const nameInput = screen.getByLabelText(/type your full name as your signature/i);
    const acknowledgeButton = screen.getByRole('button', { name: 'Acknowledge' });

    expect(acknowledgeButton).toBeDisabled();

    await user.type(nameInput, '   ');
    expect(acknowledgeButton).toBeDisabled();

    await user.clear(nameInput);
    await user.type(nameInput, '  Alex Learner  ');
    expect(acknowledgeButton).toBeEnabled();

    await user.click(acknowledgeButton);

    expect(onAcknowledge).toHaveBeenCalledWith(
      expect.objectContaining({
        lesson_id: 'lesson-ack',
        signature_method: 'name',
        signature_text: 'Alex Learner',
      }),
    );
  });

  it('renders policy reference in a distinct surfaced region', () => {
    render(<LessonContentRenderer lesson={makeAcknowledgmentLesson()} />);

    expect(screen.getByRole('note', { name: /policy reference/i })).toBeInTheDocument();
    expect(screen.getByText('HR-BASICS-001')).toBeInTheDocument();
  });
});
