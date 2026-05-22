import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MOCK_GENERATED_OUTLINE } from '@/features/foundry/data/mockGeneratedOutline'
import { GeneratedOutlineCard } from './GeneratedOutlineCard'

describe('GeneratedOutlineCard', () => {
  it('renders course title, description, and learning objectives list', () => {
    render(<GeneratedOutlineCard outline={MOCK_GENERATED_OUTLINE} />)

    expect(screen.getByRole('heading', { name: MOCK_GENERATED_OUTLINE.course_title })).toBeInTheDocument()
    expect(screen.getByText(MOCK_GENERATED_OUTLINE.description)).toBeInTheDocument()

    const objectivesList = screen.getByRole('list', { name: 'Learning objectives' })
    for (const objective of MOCK_GENERATED_OUTLINE.learning_objectives) {
      expect(within(objectivesList).getByText(objective)).toBeInTheDocument()
    }
  })

  it('computes total estimated minutes across all module lessons', () => {
    render(<GeneratedOutlineCard outline={MOCK_GENERATED_OUTLINE} />)

    expect(screen.getByText('24 min')).toBeInTheDocument()
  })

  it('renders module count and lesson count summary', () => {
    render(<GeneratedOutlineCard outline={MOCK_GENERATED_OUTLINE} />)

    expect(screen.getByText('Modules')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Lessons')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })
})
