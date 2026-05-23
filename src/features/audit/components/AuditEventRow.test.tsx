import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { AuditLog } from '@/types/training'
import { AuditEventRow } from './AuditEventRow'

function createEvent(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: 'audit-row-test',
    event_type: 'module_published',
    actor_user_id: 'user-jordan-admin',
    actor_name: 'Jordan Patel',
    entity_type: 'module_version',
    entity_id: 'module-version-hr-basics-v1',
    entity_label: 'HR Basics at Redex v1',
    occurred_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  }
}

describe('AuditEventRow', () => {
  it('renders actor, label, entity, and relative timestamp', () => {
    render(<AuditEventRow event={createEvent()} />)

    expect(screen.getByText('Module published')).toBeInTheDocument()
    expect(screen.getByText(/Jordan Patel/i)).toBeInTheDocument()
    expect(screen.getByText(/HR Basics at Redex v1/i)).toBeInTheDocument()
    expect(screen.getByText(/3 days ago/i)).toBeInTheDocument()
    expect(screen.getByText(/module-version-hr-basics-v1/i)).toBeInTheDocument()
  })

  it('renders learner quiz events with their own type label', () => {
    render(
      <AuditEventRow
        event={createEvent({
          event_type: 'quiz_attempted',
          actor_user_id: 'user-marcus',
          actor_name: 'Marcus Chen',
          entity_type: 'quiz',
          entity_id: 'hr-basics-lesson-6-final-quiz',
          entity_label: 'Final Quiz · HR Basics at Redex',
        })}
      />,
    )

    expect(screen.getByText('Quiz attempted')).toBeInTheDocument()
    expect(screen.getByText(/Marcus Chen/i)).toBeInTheDocument()
    expect(screen.getByText(/Final Quiz/i)).toBeInTheDocument()
  })
})
