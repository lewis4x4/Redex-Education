import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { FoundryEntryCard } from './FoundryEntryCard'

describe('FoundryEntryCard', () => {
  it('renders the headline and all setup bullets', () => {
    render(<FoundryEntryCard />)

    expect(screen.getByRole('heading', { name: /create a new module in course foundry/i })).toBeInTheDocument()
    expect(screen.getByText('Paste source markdown or upload SOPs')).toBeInTheDocument()
    expect(screen.getByText('Answer setup questions')).toBeInTheDocument()
    expect(screen.getByText('Review and approve AI-generated lessons')).toBeInTheDocument()
  })

  it('shows a disabled CTA with accessible coming-next-slice affordance', () => {
    render(<FoundryEntryCard isDisabled={true} />)

    const cta = screen.getByRole('button', { name: /start new module/i })
    expect(cta).toBeDisabled()
    expect(cta).toHaveAttribute('title', 'Coming next slice — Course Foundry start flow')
    expect(screen.getByText('Coming next slice')).toBeInTheDocument()
  })

  it('invokes onStart exactly once when enabled and clicked', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<FoundryEntryCard isDisabled={false} onStart={onStart} />)

    await user.click(screen.getByRole('button', { name: /start new module/i }))

    expect(onStart).toHaveBeenCalledTimes(1)
  })
})
