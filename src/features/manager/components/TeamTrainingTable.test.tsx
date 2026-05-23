import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TeamTrainingTable } from './TeamTrainingTable'
import type { TeamMemberTrainingStatus } from '../lib/teamProgress'

const STATUSES: TeamMemberTrainingStatus[] = [
  {
    user_id: 'user-complete',
    name: 'Devon Lee',
    role_label: 'Learner',
    module_title: 'HR Basics at Redex',
    status: 'completed',
    progress_percentage: 100,
    due_at: '2026-05-21T12:00:00.000Z',
  },
  {
    user_id: 'user-progress',
    name: 'Marcus Chen',
    role_label: 'Operations Associate',
    module_title: 'HR Basics at Redex',
    status: 'in_progress',
    progress_percentage: 50,
    score_percent: 80,
    due_at: '2026-05-25T12:00:00.000Z',
  },
  {
    user_id: 'user-overdue',
    name: 'Ana Rodriguez',
    role_label: 'Guest Services Associate',
    module_title: 'HR Basics at Redex',
    status: 'overdue',
    progress_percentage: 0,
    due_at: '2026-05-20T12:00:00.000Z',
  },
]

describe('TeamTrainingTable', () => {
  it('renders one data row per status', () => {
    render(<TeamTrainingTable statuses={STATUSES} />)

    expect(screen.getAllByRole('row')).toHaveLength(STATUSES.length + 1)
    expect(screen.getByRole('row', { name: /Marcus Chen/i })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Ana Rodriguez/i })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Devon Lee/i })).toBeInTheDocument()
  })

  it('sorts incomplete and overdue rows before completed rows', () => {
    render(<TeamTrainingTable statuses={STATUSES} />)

    const dataRows = screen.getAllByRole('row').slice(1)
    expect(dataRows[0]).toHaveTextContent('Ana Rodriguez')
    expect(dataRows[1]).toHaveTextContent('Marcus Chen')
    expect(dataRows[2]).toHaveTextContent('Devon Lee')
  })

  it('shows scores, progress, and overdue indicator', () => {
    render(<TeamTrainingTable statuses={STATUSES} />)

    const marcusRow = screen.getByRole('row', { name: /Marcus Chen/i })
    expect(within(marcusRow).getByText('50%')).toBeInTheDocument()
    expect(within(marcusRow).getByText('80%')).toBeInTheDocument()

    const anaRow = screen.getByRole('row', { name: /Ana Rodriguez/i })
    expect(within(anaRow).getAllByText('Overdue')).toHaveLength(2)
  })
})
