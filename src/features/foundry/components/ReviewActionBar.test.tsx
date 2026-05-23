import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { REVIEW_STATUS_LABELS } from '@/lib/education'
import { ReviewActionBar } from './ReviewActionBar'

describe('ReviewActionBar', () => {
  it('renders status badge label', () => {
    render(
      <ReviewActionBar status="pending" onApprove={vi.fn()} onRequestRegeneration={vi.fn()} />,
    )

    expect(screen.getByText(REVIEW_STATUS_LABELS.pending)).toBeInTheDocument()
  })

  it('disables approve button when status is approved', () => {
    render(
      <ReviewActionBar status="approved" onApprove={vi.fn()} onRequestRegeneration={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: 'Approve lesson' })).toBeDisabled()
  })

  it('fires onRequestRegeneration when request regeneration is clicked', () => {
    const onRequestRegeneration = vi.fn()

    render(
      <ReviewActionBar
        status="pending"
        onApprove={vi.fn()}
        onRequestRegeneration={onRequestRegeneration}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Request regeneration' }))

    expect(onRequestRegeneration).toHaveBeenCalledTimes(1)
  })
})
