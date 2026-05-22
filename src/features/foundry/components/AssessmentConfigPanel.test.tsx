import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AssessmentConfigPanel } from './AssessmentConfigPanel'

describe('AssessmentConfigPanel', () => {
  it('renders all six options with labels and descriptions', () => {
    render(<AssessmentConfigPanel value="light_quiz" onChange={vi.fn()} />)

    expect(screen.getByText('No assessment')).toBeInTheDocument()
    expect(screen.getByText('Light quiz')).toBeInTheDocument()
    expect(screen.getByText('Standard quiz')).toBeInTheDocument()
    expect(screen.getByText('Strict quiz')).toBeInTheDocument()
    expect(screen.getByText('Scenario-based assessment')).toBeInTheDocument()
    expect(screen.getByText('Acknowledgment only')).toBeInTheDocument()
    expect(screen.getByText('Read-only content.')).toBeInTheDocument()
    expect(screen.getByText('10+ questions, 90% passing threshold, retake limit.')).toBeInTheDocument()
  })

  it('calls onChange with selected option', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<AssessmentConfigPanel value="light_quiz" onChange={onChange} />)

    await user.click(screen.getByText('Strict quiz'))

    expect(onChange).toHaveBeenCalledWith('strict_quiz')
  })

  it('marks selected card with red accent classes', () => {
    render(<AssessmentConfigPanel value="scenario_based" onChange={vi.fn()} />)

    const selected = screen.getByDisplayValue('scenario_based')
    const selectedCard = selected.closest('label')

    expect(selectedCard).toHaveClass('border-redex-red')
    expect(selectedCard).toHaveClass('bg-redex-red/[0.04]')
  })
})
