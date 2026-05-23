import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MISSING_SOURCE_WARNING } from '@/features/source-binder/utils/sourceValidation'

import { MissingSourceBanner } from './MissingSourceBanner'

describe('MissingSourceBanner', () => {
  it('renders default warning copy, heading, and AlertOctagon icon', () => {
    const { container } = render(<MissingSourceBanner />)

    expect(screen.getByRole('heading', { name: 'Missing source' })).toBeInTheDocument()
    expect(screen.getByText(MISSING_SOURCE_WARNING)).toBeInTheDocument()
    expect(container.querySelector('.lucide-octagon-alert')).toBeInTheDocument()
  })

  it('renders custom message when provided', () => {
    render(<MissingSourceBanner message="Custom missing source guidance" />)

    expect(screen.getByText('Custom missing source guidance')).toBeInTheDocument()
  })

  it('fires onResolve when Resolve is clicked and hides button without callback', () => {
    const onResolve = vi.fn()
    const { rerender } = render(<MissingSourceBanner onResolve={onResolve} />)

    fireEvent.click(screen.getByRole('button', { name: 'Resolve' }))
    expect(onResolve).toHaveBeenCalledTimes(1)

    rerender(<MissingSourceBanner />)
    expect(screen.queryByRole('button', { name: 'Resolve' })).not.toBeInTheDocument()
  })
})
