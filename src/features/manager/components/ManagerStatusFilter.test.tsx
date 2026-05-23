import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ManagerStatusFilter, type StatusFilter } from './ManagerStatusFilter'

const counts: Record<StatusFilter, number> = {
  all: 5,
  incomplete: 3,
  overdue: 1,
  failed: 1,
  completed: 2,
}

describe('ManagerStatusFilter', () => {
  it('fires onChange with the selected filter when chips are clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<ManagerStatusFilter value="all" onChange={onChange} counts={counts} />)

    await user.click(screen.getByRole('button', { name: 'Incomplete (3)' }))
    await user.click(screen.getByRole('button', { name: 'Overdue (1)' }))
    await user.click(screen.getByRole('button', { name: 'Failed (1)' }))
    await user.click(screen.getByRole('button', { name: 'Completed (2)' }))

    expect(onChange).toHaveBeenNthCalledWith(1, 'incomplete')
    expect(onChange).toHaveBeenNthCalledWith(2, 'overdue')
    expect(onChange).toHaveBeenNthCalledWith(3, 'failed')
    expect(onChange).toHaveBeenNthCalledWith(4, 'completed')
  })

  it('styles the active chip with the Redex accent', () => {
    render(<ManagerStatusFilter value="overdue" onChange={vi.fn()} counts={counts} />)

    expect(screen.getByRole('button', { name: 'Overdue (1)' })).toHaveClass('bg-redex-red')
    expect(screen.getByRole('button', { name: 'Overdue (1)' })).toHaveAttribute('aria-pressed', 'true')
  })
})
