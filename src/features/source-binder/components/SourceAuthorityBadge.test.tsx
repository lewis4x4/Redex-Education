import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SourceAuthorityBadge } from './SourceAuthorityBadge'

describe('SourceAuthorityBadge', () => {
  it('renders all authority levels with distinct labels and icons', () => {
    const { container } = render(
      <div>
        <SourceAuthorityBadge level="authoritative" />
        <SourceAuthorityBadge level="supporting" />
        <SourceAuthorityBadge level="context" />
      </div>,
    )

    expect(screen.getByText('Authoritative')).toBeInTheDocument()
    expect(screen.getByText('Supporting')).toBeInTheDocument()
    expect(screen.getByText('Context')).toBeInTheDocument()
    expect(container.querySelectorAll('svg')).toHaveLength(3)
  })
})
