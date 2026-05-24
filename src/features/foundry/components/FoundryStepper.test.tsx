import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/foundry/store/foundryDraftStore', () => ({
  useFoundryDraftStore: (selector: (state: { draft_metadata?: { current_stage?: 'source' | 'outline' }; getPublishBlockers: () => unknown[] }) => unknown) =>
    selector({
      draft_metadata: { current_stage: 'outline' },
      getPublishBlockers: () => [],
    }),
}))

describe('FoundryStepper', () => {
  it('renders all eight stages and marks the current stage', async () => {
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
})
