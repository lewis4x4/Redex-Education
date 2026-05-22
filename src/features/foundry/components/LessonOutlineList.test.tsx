import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MOCK_GENERATED_OUTLINE, MOCK_LESSON_SOURCE_BINDINGS } from '@/features/foundry/data/mockGeneratedOutline'
import { LessonOutlineList } from './LessonOutlineList'

describe('LessonOutlineList', () => {
  it('renders each module title and lesson rows', () => {
    render(<LessonOutlineList modules={MOCK_GENERATED_OUTLINE.modules} />)

    expect(screen.getByRole('heading', { name: /Module 1: Welcome and Code of Conduct/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Module 2: PTO and Time Off/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Module 3: Your First Week/i })).toBeInTheDocument()

    expect(screen.getByText('Lesson 1: Welcome to Redex')).toBeInTheDocument()
    expect(screen.getByText('Lesson 3: Acknowledgment: I have read the Code of Conduct')).toBeInTheDocument()
    expect(screen.getByText('Lesson 3: Quick Check: PTO Basics')).toBeInTheDocument()
  })

  it('shows mapped lesson-type pill labels', () => {
    render(<LessonOutlineList modules={MOCK_GENERATED_OUTLINE.modules} />)

    expect(screen.getAllByText('Reading').length).toBeGreaterThan(0)
    expect(screen.getByText('Quiz')).toBeInTheDocument()
    expect(screen.getByText('Checklist')).toBeInTheDocument()
    expect(screen.getByText('Acknowledgment')).toBeInTheDocument()
  })

  it('shows source section counts per lesson from sourceBindings', () => {
    render(
      <LessonOutlineList
        modules={MOCK_GENERATED_OUTLINE.modules}
        sourceBindings={{
          ...MOCK_LESSON_SOURCE_BINDINGS,
          'Quick Check: PTO Basics': [
            { drive_file_id: 'a', section_count: 1 },
            { drive_file_id: 'b', section_count: 2 },
          ],
        }}
      />,
    )

    expect(screen.getAllByText('📎 1 source sections')).toHaveLength(3)
    expect(screen.getByText('📎 2 source sections')).toBeInTheDocument()
    expect(screen.getAllByText('📎 3 source sections')).toHaveLength(2)
  })
})
