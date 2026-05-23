import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CONFIDENCE_LABELS, type LessonReviewItem } from '@/lib/education'
import { GeneratedSourceCompare } from './GeneratedSourceCompare'

const baseReview: LessonReviewItem = {
  lesson_index: 0,
  module_index: 0,
  lesson_title: 'Welcome to Redex',
  confidence: 'high',
  has_unsupported_claim: false,
  status: 'pending',
  source_excerpts: [],
}

describe('GeneratedSourceCompare', () => {
  it('renders the confidence badge label', () => {
    render(
      <GeneratedSourceCompare
        review={{ ...baseReview, confidence: 'medium' }}
        generatedContent={{ lesson_type: 'text', body_markdown: 'Hello world' }}
      />,
    )

    expect(screen.getByText(CONFIDENCE_LABELS.medium)).toBeInTheDocument()
  })

  it('shows unsupported claim alert with note', () => {
    render(
      <GeneratedSourceCompare
        review={{
          ...baseReview,
          has_unsupported_claim: true,
          confidence: 'unsupported',
          unsupported_note: 'Policy claim not grounded in source.',
        }}
        generatedContent={{ lesson_type: 'text', body_markdown: 'Body text' }}
      />,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Unsupported claim')).toBeInTheDocument()
    expect(screen.getByText('Policy claim not grounded in source.')).toBeInTheDocument()
  })

  it('renders quiz preview for quiz lessons and markdown for text lessons', () => {
    const { rerender } = render(
      <GeneratedSourceCompare
        review={baseReview}
        generatedContent={{
          lesson_type: 'quiz',
          quiz_questions: [
            {
              id: 'q1',
              question: 'What should you do first?',
              options: ['Ignore policy', 'Read policy'],
              correct_index: 1,
            },
          ],
        }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Generated quiz preview' })).toBeInTheDocument()

    rerender(
      <GeneratedSourceCompare
        review={baseReview}
        generatedContent={{ lesson_type: 'text', body_markdown: '## Markdown body' }}
      />,
    )

    expect(screen.getByText('Markdown body')).toBeInTheDocument()
  })
})
