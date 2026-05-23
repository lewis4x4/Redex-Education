import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ManagerSummaryCards } from './ManagerSummaryCards'
import type { TeamMemberTrainingStatus } from '../lib/teamProgress'

const STATUSES: TeamMemberTrainingStatus[] = [
  { user_id: 'user-1', name: 'One', role_label: 'Learner', status: 'completed', progress_percentage: 100 },
  { user_id: 'user-2', name: 'Two', role_label: 'Learner', status: 'in_progress', progress_percentage: 50 },
  { user_id: 'user-3', name: 'Three', role_label: 'Learner', status: 'overdue', progress_percentage: 0 },
  { user_id: 'user-4', name: 'Four', role_label: 'Learner', status: 'failed', progress_percentage: 83 },
]

describe('ManagerSummaryCards', () => {
  it('renders team counts and completion percent for mixed statuses', () => {
    render(<ManagerSummaryCards statuses={STATUSES} />)

    expect(screen.getByRole('heading', { name: 'Team members' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Completed' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'In progress' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Overdue or failed' })).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getAllByText('1')).toHaveLength(2)
    expect(screen.getByText('25% complete')).toBeInTheDocument()
    expect(screen.getByText('2')).toHaveClass('text-redex-red')
    expect(screen.getByText('Needs manager attention')).toHaveClass('text-red-600')
  })
})
