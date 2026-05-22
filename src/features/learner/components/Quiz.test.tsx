import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Quiz } from './Quiz'
import type { Lesson, QuizQuestion } from '@/lib/education'

function makeQuizLesson(overrides?: {
  questions?: QuizQuestion[]
  passing_threshold?: number
  allow_retakes?: boolean
  title?: string
  id?: string
}): Lesson {
  return {
    id: overrides?.id ?? 'lesson-quiz-test',
    module_id: 'mod-test',
    order_index: 0,
    title: overrides?.title ?? 'Test Quiz',
    criticality: 'required',
    estimated_minutes: 5,
    lesson_type: 'quiz',
    content: {
      type: 'quiz',
      passing_threshold: overrides?.passing_threshold ?? 80,
      allow_retakes: overrides?.allow_retakes ?? true,
      questions: overrides?.questions ?? [],
    },
  }
}

function makeQuestion(id: string, correct_index: number | undefined, options?: string[]): QuizQuestion {
  return {
    id,
    question: `Question ${id}`,
    options: options ?? [`${id}-A`, `${id}-B`, `${id}-C`, `${id}-D`],
    correct_index,
  }
}

describe('Redex Academy learner quiz — Passing threshold boundary', () => {
  it('3 of 4 correct (75%) does not pass with default 80% threshold', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const lesson = makeQuizLesson({
      questions: [
        makeQuestion('Q1', 0),
        makeQuestion('Q2', 1),
        makeQuestion('Q3', 2),
        makeQuestion('Q4', 3),
      ],
    })

    render(<Quiz lesson={lesson} onComplete={onComplete} />)

    await user.click(screen.getByRole('radio', { name: 'Q1-A' }))
    await user.click(screen.getByRole('radio', { name: 'Q2-B' }))
    await user.click(screen.getByRole('radio', { name: 'Q3-C' }))
    await user.click(screen.getByRole('radio', { name: 'Q4-A' }))
    await user.click(screen.getByRole('button', { name: 'Submit Quiz' }))

    expect(onComplete).toHaveBeenCalledWith(75, false)
    expect(screen.getByText('RETAKE TO PASS')).toBeInTheDocument()
    expect(screen.queryByText('PASSED')).not.toBeInTheDocument()
  })

  it('4 of 4 correct (100%) passes', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const lesson = makeQuizLesson({
      questions: [
        makeQuestion('Q1', 0),
        makeQuestion('Q2', 1),
        makeQuestion('Q3', 2),
        makeQuestion('Q4', 3),
      ],
    })

    render(<Quiz lesson={lesson} onComplete={onComplete} />)

    await user.click(screen.getByRole('radio', { name: 'Q1-A' }))
    await user.click(screen.getByRole('radio', { name: 'Q2-B' }))
    await user.click(screen.getByRole('radio', { name: 'Q3-C' }))
    await user.click(screen.getByRole('radio', { name: 'Q4-D' }))
    await user.click(screen.getByRole('button', { name: 'Submit Quiz' }))

    expect(onComplete).toHaveBeenCalledWith(100, true)
    expect(screen.getByText('PASSED')).toBeInTheDocument()
  })
})

describe('Redex Academy learner quiz — 0-question authoring error', () => {
  it('renders Quiz unavailable and only notifies once for no gradeable questions', () => {
    const onComplete = vi.fn()
    const lesson = makeQuizLesson({
      questions: [
        makeQuestion('Q1', undefined),
        makeQuestion('Q2', undefined),
        makeQuestion('Q3', undefined),
        makeQuestion('Q4', undefined),
      ],
    })

    const { rerender } = render(<Quiz lesson={lesson} onComplete={onComplete} />)

    expect(screen.getByRole('heading', { name: 'Quiz unavailable' })).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith(0, false)

    rerender(<Quiz lesson={lesson} onComplete={onComplete} />)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

describe('Redex Academy learner quiz — Invalid correct_index filtering', () => {
  it('excludes out-of-bounds correct_index from graded count and scoring', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const lesson = makeQuizLesson({
      questions: [
        makeQuestion('Q1', 0),
        makeQuestion('Q2', 99),
        makeQuestion('Q3', 1),
        makeQuestion('Q4', -1),
      ],
    })

    render(<Quiz lesson={lesson} onComplete={onComplete} />)

    expect(screen.getByText('4 questions (2 graded) • 80% to pass')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Q1-A' }))
    await user.click(screen.getByRole('radio', { name: 'Q2-A' }))
    await user.click(screen.getByRole('radio', { name: 'Q3-B' }))
    await user.click(screen.getByRole('radio', { name: 'Q4-A' }))
    await user.click(screen.getByRole('button', { name: 'Submit Quiz' }))

    expect(onComplete).toHaveBeenCalledWith(100, true)
  })
})

describe('Redex Academy learner quiz — Submit/retake state machine', () => {
  it('keeps submit disabled until all questions are answered', async () => {
    const user = userEvent.setup()
    const lesson = makeQuizLesson({
      questions: [makeQuestion('Q1', 0), makeQuestion('Q2', 1), makeQuestion('Q3', 2)],
    })

    render(<Quiz lesson={lesson} />)

    const submit = screen.getByRole('button', { name: 'Submit Quiz' })
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'Q1-A' }))
    await user.click(screen.getByRole('radio', { name: 'Q2-B' }))
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'Q3-C' }))
    expect(submit).toBeEnabled()
  })

  it('retake clears answers and returns to pre-submit state', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const lesson = makeQuizLesson({
      questions: [makeQuestion('Q1', 0), makeQuestion('Q2', 1)],
    })

    render(<Quiz lesson={lesson} onComplete={onComplete} />)

    await user.click(screen.getByRole('radio', { name: 'Q1-B' }))
    await user.click(screen.getByRole('radio', { name: 'Q2-A' }))
    await user.click(screen.getByRole('button', { name: 'Submit Quiz' }))

    expect(screen.getByRole('button', { name: 'Retake Quiz' })).toBeInTheDocument()
    expect(screen.getByText('RETAKE TO PASS')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retake Quiz' }))

    const submit = screen.getByRole('button', { name: 'Submit Quiz' })
    expect(submit).toBeDisabled()
    expect(screen.queryByText('RETAKE TO PASS')).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Q1-A' }))
    await user.click(screen.getByRole('radio', { name: 'Q2-B' }))
    await user.click(screen.getByRole('button', { name: 'Submit Quiz' }))

    expect(onComplete).toHaveBeenCalledTimes(2)
  })

  it('disables retake when allow_retakes is false', async () => {
    const user = userEvent.setup()
    const lesson = makeQuizLesson({
      allow_retakes: false,
      questions: [makeQuestion('Q1', 0), makeQuestion('Q2', 1)],
    })

    render(<Quiz lesson={lesson} />)

    await user.click(screen.getByRole('radio', { name: 'Q1-B' }))
    await user.click(screen.getByRole('radio', { name: 'Q2-A' }))
    await user.click(screen.getByRole('button', { name: 'Submit Quiz' }))

    expect(screen.getByRole('button', { name: 'Retake Quiz' })).toBeDisabled()
  })
})

describe('Redex Academy learner quiz — Lesson switch remount', () => {
  it('resets submitted and answer state when lesson key changes', async () => {
    const user = userEvent.setup()
    const lessonA = makeQuizLesson({ id: 'L1', questions: [makeQuestion('Q1', 0)] })
    const lessonB = makeQuizLesson({ id: 'L2', questions: [makeQuestion('Q2', 1)] })

    const { rerender } = render(<Quiz key="L1" lesson={lessonA} />)

    await user.click(screen.getByRole('radio', { name: 'Q1-A' }))
    await user.click(screen.getByRole('button', { name: 'Submit Quiz' }))
    expect(screen.getByText('PASSED')).toBeInTheDocument()

    rerender(<Quiz key="L2" lesson={lessonB} />)

    expect(screen.getByRole('button', { name: 'Submit Quiz' })).toBeDisabled()
    expect(screen.queryByText('PASSED')).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Q2-A' })).toHaveAttribute('aria-checked', 'false')
  })
})

describe('Redex Academy learner quiz — Keyboard accessibility', () => {
  it('supports Arrow/Home/End keyboard navigation with selection updates', async () => {
    const user = userEvent.setup()
    const lesson = makeQuizLesson({
      questions: [makeQuestion('Q1', 0, ['Alpha', 'Beta', 'Gamma', 'Delta'])],
    })

    render(<Quiz lesson={lesson} />)

    const alpha = screen.getByRole('radio', { name: 'Alpha' })
    const beta = screen.getByRole('radio', { name: 'Beta' })
    const gamma = screen.getByRole('radio', { name: 'Gamma' })
    const delta = screen.getByRole('radio', { name: 'Delta' })

    alpha.focus()
    expect(alpha).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(beta).toHaveFocus()
    expect(beta).toHaveAttribute('aria-checked', 'true')

    await user.keyboard('{Home}')
    expect(alpha).toHaveFocus()
    expect(alpha).toHaveAttribute('aria-checked', 'true')

    await user.keyboard('{ArrowUp}')
    expect(delta).toHaveFocus()
    expect(delta).toHaveAttribute('aria-checked', 'true')

    await user.keyboard('{End}')
    expect(delta).toHaveFocus()
    expect(delta).toHaveAttribute('aria-checked', 'true')

    expect(gamma).toHaveAttribute('aria-checked', 'false')
  })

  it('marks options aria-disabled and prevents selection changes after submit', async () => {
    const user = userEvent.setup()
    const lesson = makeQuizLesson({
      questions: [makeQuestion('Q1', 0, ['Alpha', 'Beta', 'Gamma', 'Delta'])],
    })

    render(<Quiz lesson={lesson} />)

    const alpha = screen.getByRole('radio', { name: 'Alpha' })
    const beta = screen.getByRole('radio', { name: 'Beta' })

    await user.click(beta)
    await user.click(screen.getByRole('button', { name: 'Submit Quiz' }))

    expect(alpha).toHaveAttribute('aria-disabled', 'true')
    expect(beta).toHaveAttribute('aria-disabled', 'true')

    beta.focus()
    await user.keyboard('{ArrowDown}')
    expect(beta).toHaveAttribute('aria-checked', 'true')
    expect(alpha).toHaveAttribute('aria-checked', 'false')
  })
})

describe('Redex Academy learner quiz — onComplete invariants', () => {
  it('fires exactly once per submit and not on retake', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const lesson = makeQuizLesson({
      questions: [makeQuestion('Q1', 0), makeQuestion('Q2', 1)],
    })

    render(<Quiz lesson={lesson} onComplete={onComplete} />)

    await user.click(screen.getByRole('radio', { name: 'Q1-A' }))
    await user.click(screen.getByRole('radio', { name: 'Q2-B' }))
    await user.click(screen.getByRole('button', { name: 'Submit Quiz' }))
    expect(onComplete).toHaveBeenCalledTimes(1)

    expect(onComplete).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Retake Quiz' }))
    expect(onComplete).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('radio', { name: 'Q1-A' }))
    await user.click(screen.getByRole('radio', { name: 'Q2-B' }))
    await user.click(screen.getByRole('button', { name: 'Submit Quiz' }))
    expect(onComplete).toHaveBeenCalledTimes(2)
  })
})

describe('Redex Academy learner quiz — Stable option keys regression', () => {
  it('does not emit React unique key warning for options with duplicate labels', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const lessonA = makeQuizLesson({
      questions: [makeQuestion('Q1', 0, ['Same', 'Same', 'Different', 'Different'])],
    })
    const lessonB = makeQuizLesson({
      questions: [makeQuestion('Q1', 0, ['Different', 'Same', 'Different', 'Same'])],
    })

    const { rerender } = render(<Quiz lesson={lessonA} />)
    rerender(<Quiz lesson={lessonB} />)

    const keyWarnings = errorSpy.mock.calls.filter(([message]) => {
      return typeof message === 'string' && message.includes('Each child in a list should have a unique "key" prop')
    })

    expect(keyWarnings).toHaveLength(0)
    errorSpy.mockRestore()

    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(4)
    const firstRadio = radios[0]
    expect(firstRadio).toBeDefined()
    if (firstRadio) {
      expect(within(firstRadio).getByText('Different')).toBeInTheDocument()
    }
  })
})
