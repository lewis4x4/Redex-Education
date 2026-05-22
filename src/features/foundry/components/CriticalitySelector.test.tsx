import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CriticalitySelector } from './CriticalitySelector'

describe('CriticalitySelector', () => {
  it('renders all four criticality options', () => {
    render(<CriticalitySelector value="basic_knowledge" onChange={vi.fn()} />)

    expect(screen.getByRole('radio', { name: 'Informational' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Basic Knowledge' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Operational' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Compliance / Safety / High-Risk' })).toBeInTheDocument()
  })

  it('calls onChange with selected value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CriticalitySelector value="basic_knowledge" onChange={onChange} />)

    await user.click(screen.getByRole('radio', { name: 'Operational' }))

    expect(onChange).toHaveBeenCalledWith('operational')
  })

  it('swaps helper text based on selected criticality', () => {
    const { rerender } = render(<CriticalitySelector value="informational" onChange={vi.fn()} />)

    expect(screen.getByText(/Low-stakes content/i)).toBeInTheDocument()

    rerender(<CriticalitySelector value="compliance_high_risk" onChange={vi.fn()} />)

    expect(screen.getByText(/Strict source grounding/i)).toBeInTheDocument()
  })

  it('sets aria-checked on radios based on selected state', () => {
    render(<CriticalitySelector value="operational" onChange={vi.fn()} />)

    expect(screen.getByRole('radio', { name: 'Operational' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Informational' })).toHaveAttribute('aria-checked', 'false')
  })
})
