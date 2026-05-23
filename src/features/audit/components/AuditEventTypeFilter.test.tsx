import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AUDIT_EVENT_TYPES } from '@/lib/education'
import type { AuditEventType } from '@/types/training'
import { AuditEventTypeFilter } from './AuditEventTypeFilter'

function createCounts(): Record<AuditEventType | 'all', number> {
  const counts = Object.fromEntries(AUDIT_EVENT_TYPES.map((type) => [type, 0])) as Record<AuditEventType | 'all', number>
  counts.all = 3
  counts.module_published = 1
  return counts
}

describe('AuditEventTypeFilter', () => {
  it('fires onChange with the selected event type', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<AuditEventTypeFilter value="all" counts={createCounts()} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Module published/i }))

    expect(onChange).toHaveBeenCalledWith('module_published')
  })

  it('fires onChange for the all chip', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<AuditEventTypeFilter value="quiz_attempted" counts={createCounts()} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /All/i }))

    expect(onChange).toHaveBeenCalledWith('all')
  })
})
