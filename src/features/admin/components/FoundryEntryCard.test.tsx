import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { FoundryEntryCard } from './FoundryEntryCard'

describe('FoundryEntryCard', () => {
  it('renders the eyebrow, headline, and all setup bullets', () => {
    const { container } = render(<FoundryEntryCard />)

    expect(container.firstElementChild).toHaveClass('flex', 'flex-col', 'h-full')
    expect(screen.getByText('Course Foundry')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /create a new module/i })).toBeInTheDocument()
    expect(screen.getByText('Paste source markdown or upload SOPs')).toBeInTheDocument()
    expect(screen.getByText('Answer setup questions')).toBeInTheDocument()
    expect(screen.getByText('Review and approve AI-generated lessons')).toBeInTheDocument()
  })

  it('shows a disabled CTA with accessible coming-soon affordance', () => {
    render(<FoundryEntryCard isDisabled={true} />)

    const cta = screen.getByRole('button', { name: /start new module/i })
    expect(cta).toBeDisabled()
    expect(cta.parentElement).toHaveClass('mt-auto', 'pt-6')
    expect(cta).toHaveAttribute('title', 'Coming soon — Course Foundry start flow')
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('invokes onStart exactly once when enabled and clicked', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<FoundryEntryCard isDisabled={false} onStart={onStart} />)

    await user.click(screen.getByRole('button', { name: /start new module/i }))

    expect(onStart).toHaveBeenCalledTimes(1)
  })
})
