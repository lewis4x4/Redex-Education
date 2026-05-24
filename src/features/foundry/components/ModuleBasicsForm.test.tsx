import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ModuleBasicsForm } from './ModuleBasicsForm'

const parentCourseOptions = [
  { id: 'standalone', label: 'Standalone module' },
  { id: 'course-001', label: 'Orientation' },
] as const

describe('ModuleBasicsForm', () => {
  it('renders required basics fields including dynamic learning outcomes', () => {
    render(<ModuleBasicsForm onSubmit={vi.fn()} parentCourseOptions={parentCourseOptions} />)

    expect(screen.getByRole('textbox', { name: /module title/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /parent course/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /^audience/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /recommended/i })).toBeChecked()
    expect(screen.getByRole('combobox', { name: /training type/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /30 min/i })).toBeInTheDocument()
    expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('button', { name: /add outcome/i })).toBeInTheDocument()
  })

  it('validates learning outcomes between 1 and 3 with per-row constraints', async () => {
    const user = userEvent.setup()
    render(<ModuleBasicsForm onSubmit={vi.fn()} parentCourseOptions={parentCourseOptions} />)

    const outcomeInput = screen.getByPlaceholderText(/describe a concrete post-training capability/i)
    await user.type(outcomeInput, 'short')
    await user.click(screen.getByRole('button', { name: /continue → add source material/i }))
    expect(await screen.findByText('Each outcome needs at least 8 characters')).toBeInTheDocument()

    await user.clear(outcomeInput)
    await user.type(outcomeInput, 'Complete onboarding checklist tasks independently')
    await user.click(screen.getByRole('button', { name: /add outcome/i }))
    await user.click(screen.getByRole('button', { name: /add outcome/i }))
    expect(screen.getAllByPlaceholderText(/describe a concrete post-training capability/i)).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: /add outcome/i }))
    expect(screen.getAllByPlaceholderText(/describe a concrete post-training capability/i)).toHaveLength(3)
  })

  it('submits valid values to onSubmit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<ModuleBasicsForm onSubmit={onSubmit} parentCourseOptions={parentCourseOptions} />)

    await user.type(screen.getByRole('textbox', { name: /module title/i }), 'Field Safety Refresher')
    await user.selectOptions(screen.getByRole('combobox', { name: /parent course/i }), 'course-001')
    await user.selectOptions(screen.getByRole('combobox', { name: /^audience/i }), 'all_employees')
    await user.type(screen.getByRole('textbox', { name: /audience refinement/i }), 'North America')
    await user.click(screen.getByRole('radio', { name: /optional/i }))
    await user.selectOptions(screen.getByRole('combobox', { name: /training type/i }), 'safety')

    const outcomeInput = screen.getByPlaceholderText(/describe a concrete post-training capability/i)
    await user.type(outcomeInput, 'Apply the field safety process without supervision')
    await user.click(screen.getByRole('button', { name: /continue → add source material/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Field Safety Refresher',
        parent_course_id: 'course-001',
        audience_archetype: 'all_employees',
        audience_refinement: 'North America',
        completion_required: 'optional',
        training_type: 'safety',
      }),
      expect.anything(),
    )
  })

  it('hydrates initialValues into the form', () => {
    render(
      <ModuleBasicsForm
        onSubmit={vi.fn()}
        parentCourseOptions={parentCourseOptions}
        initialValues={{
          title: 'Existing draft',
          completion_required: 'optional',
          learning_outcomes: [{ id: 'outcome-1', text: 'Complete onboarding tasks confidently' }],
        }}
      />,
    )

    expect(screen.getByRole('textbox', { name: /module title/i })).toHaveValue('Existing draft')
    expect(screen.getByRole('radio', { name: /optional/i })).toBeChecked()
    expect(screen.getByDisplayValue('Complete onboarding tasks confidently')).toBeInTheDocument()
  })
})
