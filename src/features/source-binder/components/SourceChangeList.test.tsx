import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { SourceChangeEvent } from '@/lib/education'
import { SourceChangeList } from './SourceChangeList'

const event: SourceChangeEvent = {
  id: 'event-1',
  source_file_id: 'file-1',
  source_file_name: 'pto-policy.md',
  section_ids_changed: ['section-payroll-basics', 'section-timekeeping-expectations'],
  old_revision_id: 'old-rev',
  new_revision_id: 'new-rev',
  detected_at: '2026-05-23T12:00:00.000Z',
  status: 'unreviewed',
}

describe('SourceChangeList', () => {
  it('renders empty state', () => {
    render(<SourceChangeList events={[]} />)

    expect(screen.getByRole('heading', { name: 'No source changes detected' })).toBeInTheDocument()
  })

  it('renders event cards and calls onSelect', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<SourceChangeList events={[event]} onSelect={onSelect} />)

    expect(screen.getByText('pto-policy.md')).toBeInTheDocument()
    expect(screen.getByText(/Drive sync detected 2 changed sections/i)).toBeInTheDocument()
    expect(screen.getByText('Unreviewed')).toBeInTheDocument()

    await user.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(event)
  })
})
