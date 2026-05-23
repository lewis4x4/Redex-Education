import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MOCK_GENERATED_MODULE } from '@/features/foundry/data/mockGeneratedModule'
import { GeneratedLessonPreview } from './GeneratedLessonPreview'

describe('GeneratedLessonPreview', () => {
  it('renders markdown for text lessons', () => {
    const lesson = MOCK_GENERATED_MODULE.lessons.find((item) => item.lesson_type === 'text')
    expect(lesson).toBeDefined()

    render(<GeneratedLessonPreview lesson={lesson!} />)

    expect(screen.getByRole('heading', { name: lesson!.title })).toBeInTheDocument()
    expect(screen.getByText(/Welcome to Redex\./i)).toBeInTheDocument()
  })

  it('renders assessment preview for quiz lessons', () => {
    const lesson = MOCK_GENERATED_MODULE.lessons.find((item) => item.lesson_type === 'quiz')
    expect(lesson).toBeDefined()

    render(<GeneratedLessonPreview lesson={lesson!} />)

    expect(screen.getByRole('heading', { name: lesson!.title })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Generated quiz preview/i })).toBeInTheDocument()
  })

  it('renders acknowledgment text with disabled acknowledge button', () => {
    const lesson = MOCK_GENERATED_MODULE.lessons.find((item) => item.lesson_type === 'acknowledgment')
    expect(lesson).toBeDefined()

    render(<GeneratedLessonPreview lesson={lesson!} />)

    expect(screen.getByText(/I acknowledge that I have read and understood/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeDisabled()
  })

  it('shows status badge in the header', () => {
    const lesson = MOCK_GENERATED_MODULE.lessons.find((item) => item.status === 'ready_for_approval')
    expect(lesson).toBeDefined()

    render(<GeneratedLessonPreview lesson={lesson!} />)

    expect(screen.getByText('Ready for approval')).toBeInTheDocument()
  })
})
