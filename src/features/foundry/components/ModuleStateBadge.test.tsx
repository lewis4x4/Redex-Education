import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  orderedStates,
  stateBadgeVariant,
  stateLabel,
  type ModuleApprovalState,
} from '@/features/publishing/lib/moduleStates'
import { ModuleStateBadge } from './ModuleStateBadge'

describe('ModuleStateBadge', () => {
  it('renders labels for every module approval state', () => {
    for (const state of orderedStates()) {
      const { unmount } = render(<ModuleStateBadge state={state} />)
      expect(screen.getByText(stateLabel(state))).toBeInTheDocument()
      unmount()
    }
  })

  it.each<ModuleApprovalState>(['draft', 'needs_review', 'blocked', 'approved', 'published', 'archived'])(
    'applies the variant for %s',
    (state) => {
      render(<ModuleStateBadge state={state} />)

      expect(screen.getByText(stateLabel(state)).closest('span')?.parentElement).toHaveAttribute(
        'data-variant',
        stateBadgeVariant(state),
      )
    },
  )

  it('uses the larger size classes when requested', () => {
    const { container } = render(<ModuleStateBadge state="published" size="md" />)

    expect(container.firstElementChild).toHaveClass('px-3', 'py-1')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
