import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { SourceFile } from '@/lib/education'
import { SourceLibraryBrowser } from './SourceLibraryBrowser'

const FILES: SourceFile[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    drive_file_id: 'file-1',
    title: 'PTO Policy',
    mime_type: 'text/markdown',
    authority: 'authoritative',
    authority_source: 'frontmatter',
    topic: 'hr_basics',
    processing_status: 'processed',
    created_at: '2026-05-22T00:00:00.000Z',
    updated_at: '2026-05-22T00:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    drive_file_id: 'file-2',
    title: 'Field Communication Guide',
    mime_type: 'text/markdown',
    authority: 'supporting',
    authority_source: 'frontmatter',
    topic: 'communication',
    processing_status: 'processed',
    created_at: '2026-05-22T00:00:00.000Z',
    updated_at: '2026-05-22T00:00:00.000Z',
  },
]

describe('SourceLibraryBrowser', () => {
  it('renders empty state when there are no files', () => {
    render(<SourceLibraryBrowser files={[]} />)

    expect(screen.getByText(/no source files yet/i)).toBeInTheDocument()
  })

  it('renders files grouped by topic with authority badges', () => {
    render(<SourceLibraryBrowser files={FILES} />)

    expect(screen.getByRole('heading', { name: 'hr_basics' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'communication' })).toBeInTheDocument()
    expect(screen.getByText('PTO Policy')).toBeInTheDocument()
    expect(screen.getByText('Field Communication Guide')).toBeInTheDocument()
    expect(screen.getByText('Authoritative')).toBeInTheDocument()
    expect(screen.getByText('Supporting')).toBeInTheDocument()
  })

  it('calls onToggleSelection when a checkbox is toggled', async () => {
    const user = userEvent.setup()
    const onToggleSelection = vi.fn()

    render(
      <SourceLibraryBrowser
        files={FILES}
        selectedDriveFileIds={new Set()}
        onToggleSelection={onToggleSelection}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: /select pto policy/i }))
    expect(onToggleSelection).toHaveBeenCalledWith('file-1')
  })
})
