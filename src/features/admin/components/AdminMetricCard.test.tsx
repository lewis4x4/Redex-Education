import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AdminMetricCard } from './AdminMetricCard'

describe('AdminMetricCard', () => {
  it('renders the metric label and value', () => {
    render(<AdminMetricCard label="Drafts" value={3} />)

    expect(screen.getByRole('heading', { name: 'Drafts' })).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('applies the positive delta tone class', () => {
    render(<AdminMetricCard label="Published" value={5} delta={{ value: '+12% vs last week', tone: 'positive' }} />)

    expect(screen.getByText('+12% vs last week')).toHaveClass('text-emerald-600')
  })

  it('applies the negative delta tone class', () => {
    render(<AdminMetricCard label="Needs review" value={1} delta={{ value: '-4% vs last week', tone: 'negative' }} />)

    expect(screen.getByText('-4% vs last week')).toHaveClass('text-red-600')
  })

  it('applies red accent styling when variant is accent', () => {
    render(<AdminMetricCard label="Needs review" value={1} variant="accent" />)

    expect(screen.getByText('1')).toHaveClass('text-redex-red')
  })
})
