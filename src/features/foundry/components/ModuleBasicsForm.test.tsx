import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ModuleBasicsForm } from './ModuleBasicsForm'

const parentCourseOptions = [
  { id: 'standalone', label: 'Standalone module' },
  { id: 'course-001', label: 'Orientation' },
] as const

describe('ModuleBasicsForm', () => {
  it('renders all required fields', () => {
    render(<ModuleBasicsForm onSubmit={vi.fn()} parentCourseOptions={parentCourseOptions} />)

    expect(screen.getByRole('textbox', { name: /module title/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /parent course/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /audience/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /required/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /optional/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /training type/i })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: /estimated duration target/i })).toBeInTheDocument()
  })

  it('shows title validation error when title is too short', async () => {
    const user = userEvent.setup()
    render(<ModuleBasicsForm onSubmit={vi.fn()} parentCourseOptions={parentCourseOptions} />)

    await user.type(screen.getByRole('textbox', { name: /module title/i }), 'abc')

    expect(await screen.findByText('Module title must be at least 4 characters')).toBeInTheDocument()
  })

  it('shows duration validation errors when out of bounds', async () => {
    const user = userEvent.setup()
    render(<ModuleBasicsForm onSubmit={vi.fn()} parentCourseOptions={parentCourseOptions} />)

    await user.type(screen.getByRole('textbox', { name: /module title/i }), 'Valid module title')
    await user.type(screen.getByRole('textbox', { name: /audience/i }), 'New hires')
    await user.clear(screen.getByRole('spinbutton', { name: /estimated duration target/i }))
    await user.type(screen.getByRole('spinbutton', { name: /estimated duration target/i }), '4')
    await user.click(screen.getByRole('button', { name: /continue → add source material/i }))

    expect(await screen.findByText('Minimum 5 minutes')).toBeInTheDocument()

    await user.clear(screen.getByRole('spinbutton', { name: /estimated duration target/i }))
    await user.type(screen.getByRole('spinbutton', { name: /estimated duration target/i }), '301')
    await user.click(screen.getByRole('button', { name: /continue → add source material/i }))

    expect(await screen.findByText('Maximum 300 minutes')).toBeInTheDocument()
  })

  it('keeps submit disabled until the form is valid', async () => {
    const user = userEvent.setup()
    render(<ModuleBasicsForm onSubmit={vi.fn()} parentCourseOptions={parentCourseOptions} />)

    const submit = screen.getByRole('button', { name: /continue → add source material/i })
    expect(submit).toBeDisabled()

    await user.type(screen.getByRole('textbox', { name: /module title/i }), 'Field Safety')
    await user.type(screen.getByRole('textbox', { name: /audience/i }), 'Field team')

    expect(submit).toBeEnabled()
  })

  it('submits valid values to onSubmit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<ModuleBasicsForm onSubmit={onSubmit} parentCourseOptions={parentCourseOptions} />)

    await user.type(screen.getByRole('textbox', { name: /module title/i }), 'Field Safety Refresher')
    await user.selectOptions(screen.getByRole('combobox', { name: /parent course/i }), 'course-001')
    await user.type(screen.getByRole('textbox', { name: /audience/i }), 'All employees')
    await user.click(screen.getByRole('radio', { name: /optional/i }))
    await user.selectOptions(screen.getByRole('combobox', { name: /training type/i }), 'safety')
    await user.clear(screen.getByRole('spinbutton', { name: /estimated duration target/i }))
    await user.type(screen.getByRole('spinbutton', { name: /estimated duration target/i }), '45')
    await user.click(screen.getByRole('button', { name: /continue → add source material/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Field Safety Refresher',
        parent_course_id: 'course-001',
        audience: 'All employees',
        criticality: 'optional',
        training_type: 'safety',
        estimated_minutes: 45,
      }),
      expect.anything(),
    )
  })

  it('hydrates initialValues into the form', () => {
    render(
      <ModuleBasicsForm
        onSubmit={vi.fn()}
        parentCourseOptions={parentCourseOptions}
        initialValues={{ title: 'Existing draft', criticality: 'optional' }}
      />,
    )

    expect(screen.getByRole('textbox', { name: /module title/i })).toHaveValue('Existing draft')
    expect(screen.getByRole('radio', { name: /optional/i })).toBeChecked()
  })
})
