import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { QuizQuestion } from '@/lib/education'
import { GeneratedAssessmentPreview } from './GeneratedAssessmentPreview'

const questions: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What should you do first?',
    options: ['Wait', 'Escalate', 'Ignore', 'Document'],
    correct_index: 1,
  },
  {
    id: 'q2',
    question: 'How often should this be reviewed?',
    options: ['Daily', 'Weekly', 'Monthly', 'Never'],
    correct_index: 2,
  },
]

describe('GeneratedAssessmentPreview', () => {
  it('renders preview-only notice', () => {
    render(<GeneratedAssessmentPreview questions={questions} />)

    expect(screen.getByText(/PREVIEW ONLY/i)).toBeInTheDocument()
  })

  it('renders each question with options', () => {
    render(<GeneratedAssessmentPreview questions={questions} />)

    for (const question of questions) {
      const questionText = screen.getByText(new RegExp(question.question))
      const questionItem = questionText.closest('li')
      expect(questionItem).not.toBeNull()

      for (const option of question.options) {
        expect(within(questionItem as HTMLElement).getByText(option)).toBeInTheDocument()
      }
    }
  })

  it('visually distinguishes correct answers', () => {
    render(<GeneratedAssessmentPreview questions={questions} />)

    const indicators = screen.getAllByText(/^Correct answer$/i)
    expect(indicators).toHaveLength(2)

    for (const indicator of indicators) {
      const optionRow = indicator.closest('li')
      expect(optionRow).toHaveClass('border-emerald-200')
      expect(optionRow).toHaveClass('bg-emerald-50')
    }
  })
})
