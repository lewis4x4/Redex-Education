import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const storeState = vi.hoisted(() => ({
  draft_metadata: { current_stage: undefined as 'source' | 'outline' | undefined },
  getPublishBlockers: () => [] as unknown[],
}))

vi.mock('@/features/foundry/store/foundryDraftStore', () => ({
  useFoundryDraftStore: (selector: (state: { draft_metadata?: { current_stage?: 'source' | 'outline' }; getPublishBlockers: () => unknown[] }) => unknown) =>
    selector(storeState),
}))

describe('FoundryStepper', () => {
  it('renders all eight stages and marks the current stage', async () => {
    storeState.draft_metadata.current_stage = 'outline'
    const { FoundryStepper } = await import('./FoundryStepper')

    render(
      <MemoryRouter initialEntries={['/admin/foundry/outline']}>
        <FoundryStepper />
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation', { name: 'Foundry progress' })).toBeInTheDocument()
    expect(screen.getByText('Basics')).toBeInTheDocument()
    expect(screen.getByText('Source')).toBeInTheDocument()
    expect(screen.getByText('Questions')).toBeInTheDocument()
    expect(screen.getByText('Outline')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText('Preview')).toBeInTheDocument()
    expect(screen.getByText('Critique')).toBeInTheDocument()
    expect(screen.getByText('Side-by-side')).toBeInTheDocument()
    expect(screen.getByText('Publish')).toBeInTheDocument()
  })

  it('does not mark Publish as current on blockers route', async () => {
    storeState.draft_metadata.current_stage = undefined
    const { FoundryStepper } = await import('./FoundryStepper')

    render(
      <MemoryRouter initialEntries={['/admin/foundry/blockers']}>
        <FoundryStepper />
      </MemoryRouter>,
    )

    expect(screen.getByText('Side-by-side')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText('Publish')).not.toHaveAttribute('aria-current', 'step')
  })
})
