import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GenerationStatusBadge } from './GenerationStatusBadge'

describe('GenerationStatusBadge', () => {
  it('renders expected labels for statuses', () => {
    const { rerender } = render(<GenerationStatusBadge status="draft" />)
    expect(screen.getByText('Draft')).toBeInTheDocument()

    rerender(<GenerationStatusBadge status="needs_review" />)
    expect(screen.getByText('Needs review')).toBeInTheDocument()

    rerender(<GenerationStatusBadge status="unsupported_claim" />)
    expect(screen.getByText('Unsupported claim')).toBeInTheDocument()
  })

  it('renders CheckCircle2 icon for ready_for_approval', () => {
    const { container } = render(<GenerationStatusBadge status="ready_for_approval" />)

    expect(screen.getByText('Ready for approval')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders AlertTriangle icon for missing_source', () => {
    const { container } = render(<GenerationStatusBadge status="missing_source" />)

    expect(screen.getByText('Missing source')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
