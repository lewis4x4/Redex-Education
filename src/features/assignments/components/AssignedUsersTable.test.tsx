import { act, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { MOCK_ASSIGNMENTS } from '@/lib/education/mockAssignments'
import { useAssignmentStore } from '../store/assignmentStore'
import { AssignedUsersTable } from './AssignedUsersTable'

describe('AssignedUsersTable', () => {
  beforeEach(() => {
    act(() => {
      useAssignmentStore.getState().resetAssignments()
    })
  })

  it('renders one row per assignment in the store', () => {
    render(<AssignedUsersTable />)

    expect(screen.getAllByRole('row')).toHaveLength(MOCK_ASSIGNMENTS.length + 1)
  })

  it('shows correct learner name', () => {
    render(<AssignedUsersTable />)

    expect(screen.getByText('Marcus Chen')).toBeInTheDocument()
    expect(screen.getByText('Ana Rodriguez')).toBeInTheDocument()
    expect(screen.getByText('Devon Lee')).toBeInTheDocument()
  })

  it('shows overdue indicator for past-due non-completed records', () => {
    act(() => {
      useAssignmentStore.setState({
        assignments: [
          {
            ...MOCK_ASSIGNMENTS[0]!,
            id: 'assignment-overdue-test',
            due_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
          },
        ],
      })
    })

    render(<AssignedUsersTable />)

    const row = screen.getByRole('row', { name: /Marcus Chen/i })
    expect(within(row).getByText('Overdue')).toBeInTheDocument()
  })
})
