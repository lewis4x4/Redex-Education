import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const useSourceLibraryMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/source-binder/lib/useSourceLibrary', () => ({
  useSourceLibrary: useSourceLibraryMock,
}))

vi.mock('@/features/source-binder/components/DriveSyncButton', () => ({
  DriveSyncButton: () => <button type="button">Sync from Drive</button>,
}))

vi.mock('@/features/source-binder/components/SourceLibraryBrowser', () => ({
  SourceLibraryBrowser: () => <div>Source Library Browser Mock</div>,
}))

vi.mock('@/features/foundry/store/foundryDraftStore', () => ({
  useFoundryDraftStore: (
    selector: (state: {
      selectedLibraryFileIds: string[]
      toggleLibraryFile: (id: string) => void
      getPublishBlockers: () => []
    }) => unknown,
  ) =>
    selector({
      selectedLibraryFileIds: [],
      toggleLibraryFile: vi.fn(),
      getPublishBlockers: () => [],
    }),
}))

describe('SourceLibraryPage', () => {
  it('renders eyebrow, h1, sync button, and browser', async () => {
    useSourceLibraryMock.mockReturnValue({
      files: [],
      loading: false,
      error: null,
      refresh: vi.fn(),
    })

    const { SourceLibraryPage } = await import('./SourceLibraryPage')

    render(
      <MemoryRouter>
        <SourceLibraryPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('REDEX AI COURSE FOUNDRY')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Source Library' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sync from Drive' })).toBeInTheDocument()
    expect(screen.getByText('Source Library Browser Mock')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back to source binder' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Foundry progress' })).toBeInTheDocument()
  })
})
