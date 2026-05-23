import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LessonContentRenderer } from './LessonContentRenderer';
import type { Lesson } from '@/lib/education';

function makeAcknowledgmentLesson(): Lesson {
  return {
    id: 'lesson-acknowledgment-test',
    module_id: 'mod-test',
    title: 'Required Acknowledgment',
    lesson_type: 'acknowledgment',
    criticality: 'required',
    order_index: 5,
    estimated_minutes: 2,
    content: {
      type: 'acknowledgment',
      statement_markdown: 'I acknowledge that I have read and understood the HR Basics content.',
      required_signature: 'click',
      policy_ref: 'HR-BASICS-001',
    },
  };
}

describe('LessonContentRenderer acknowledgment lessons', () => {
  it('renders statement text with an accessible checkbox and disabled acknowledge button', () => {
    render(<LessonContentRenderer lesson={makeAcknowledgmentLesson()} />);

    expect(screen.getByRole('heading', { name: 'Required Acknowledgment' })).toBeInTheDocument();
    expect(screen.getByText(/I acknowledge that I have read and understood/i)).toBeInTheDocument();
    expect(screen.getByText(/Policy reference: HR-BASICS-001/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /I have read and understood this acknowledgment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeDisabled();
  });

  it('fires onAcknowledge only after the checkbox is checked and button is clicked', async () => {
    const user = userEvent.setup();
    const onAcknowledge = vi.fn();

    render(<LessonContentRenderer lesson={makeAcknowledgmentLesson()} onAcknowledge={onAcknowledge} />);

    await user.click(screen.getByRole('checkbox', { name: /I have read and understood this acknowledgment/i }));
    await user.click(screen.getByRole('button', { name: 'Acknowledge' }));

    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });
});
