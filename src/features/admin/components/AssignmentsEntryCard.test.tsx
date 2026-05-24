import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AssignmentsEntryCard } from './AssignmentsEntryCard'

describe('AssignmentsEntryCard', () => {
  it('renders content and card layout classes', () => {
    const { container } = render(<AssignmentsEntryCard onStart={vi.fn()} isDisabled={false} />)

    expect(container.firstElementChild).toHaveClass('flex', 'flex-col', 'h-full')
    expect(screen.getByText('Assignments')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /assign training to your team/i })).toBeInTheDocument()
  })

  it('pins the button wrapper and keeps disabled affordance', () => {
    render(<AssignmentsEntryCard onStart={vi.fn()} isDisabled={true} />)

    const cta = screen.getByRole('button', { name: /open assignments/i })
    expect(cta).toBeDisabled()
    expect(cta.parentElement).toHaveClass('mt-auto', 'pt-6')
    expect(cta).toHaveAttribute('title', 'Assignments open in this slice')
  })

  it('invokes onStart once when enabled', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<AssignmentsEntryCard onStart={onStart} isDisabled={false} />)
    await user.click(screen.getByRole('button', { name: /open assignments/i }))

    expect(onStart).toHaveBeenCalledTimes(1)
  })
})
