import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { QuestionWizard } from './QuestionWizard'

describe('QuestionWizard', () => {
  it('renders step 1 on mount with progress text', () => {
    render(<QuestionWizard onSubmit={vi.fn()} />)

    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Identity & Audience' })).toBeInTheDocument()
  })

  it('blocks Next until audience notes are valid, then allows advancing', async () => {
    const user = userEvent.setup()
    render(<QuestionWizard onSubmit={vi.fn()} />)

    const nextButton = screen.getByRole('button', { name: 'Next' })
    await user.click(nextButton)

    expect(await screen.findByText('Add a target audience')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Identity & Audience' })).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: /audience notes/i }), 'ab')
    await user.click(nextButton)

    expect(await screen.findByRole('heading', { name: /Training type & Criticality/i })).toBeInTheDocument()
  })

  it('advances to step 2 and enables Prev', async () => {
    const user = userEvent.setup()
    render(<QuestionWizard onSubmit={vi.fn()} />)

    await user.type(screen.getByRole('textbox', { name: /audience notes/i }), 'field team')
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByText('Step 2 of 6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Prev' })).toBeEnabled()
  })

  it('submits parsed setup answers after completing all steps', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<QuestionWizard onSubmit={onSubmit} />)

    await user.type(screen.getByRole('textbox', { name: /audience notes/i }), 'new operators')
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.click(await screen.findByRole('radio', { name: 'Compliance / Safety / High-Risk' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.click(await screen.findByText('Strict quiz'))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.type(await screen.findByRole('textbox', { name: /experience notes/i }), 'short practical simulation')
    const minutes = screen.getByRole('spinbutton', { name: /estimated minutes/i })
    await user.clear(minutes)
    await user.type(minutes, '45')
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.click(await screen.findByText('Flexible'))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.click(await screen.findByRole('checkbox', { name: /requires admin approval/i }))
    await user.click(screen.getByRole('checkbox', { name: /requires safety review/i }))
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        criticality: 'compliance_high_risk',
        assessment_style: 'strict_quiz',
        audience_notes: 'new operators',
        experience_notes: 'short practical simulation',
        estimated_minutes: 45,
        source_control: 'flexible',
        requires_admin_approval: false,
        requires_safety_review: true,
      }),
      expect.anything(),
    )
  })
})
