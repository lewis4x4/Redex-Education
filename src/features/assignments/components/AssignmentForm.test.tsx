import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAssignmentStore } from '../store/assignmentStore'
import { AssignmentForm } from './AssignmentForm'

const { toastSuccessMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
  },
}))

describe('AssignmentForm', () => {
  beforeEach(() => {
    toastSuccessMock.mockReset()
    act(() => {
      useAssignmentStore.getState().resetAssignments()
    })
  })

  it('validates user-mode submission requires assigneeUserId', async () => {
    const user = userEvent.setup()
    render(<AssignmentForm />)

    await user.click(screen.getByRole('button', { name: /assign training/i }))

    expect(await screen.findByText('Select a learner', { selector: 'p' })).toBeInTheDocument()
  })

  it('validates cohort-mode submission requires cohortId', async () => {
    const user = userEvent.setup()
    render(<AssignmentForm />)

    await user.click(screen.getByRole('radio', { name: /audience group/i }))
    await user.click(screen.getByRole('button', { name: /assign training/i }))

    expect(await screen.findByText('Select an audience group')).toBeInTheDocument()
  })

  it('successful submit invokes onAssigned with the new Assignment', async () => {
    const user = userEvent.setup()
    const onAssigned = vi.fn()
    render(<AssignmentForm onAssigned={onAssigned} />)

    await user.selectOptions(screen.getByRole('combobox', { name: /select user/i }), 'user-marcus')
    await user.type(screen.getByLabelText(/set due date/i), '2026-06-15')
    await user.click(screen.getByRole('button', { name: /assign training/i }))

    await waitFor(() => expect(onAssigned).toHaveBeenCalledTimes(1))
    expect(onAssigned).toHaveBeenCalledWith(
      expect.objectContaining({
        module_version_id: 'module-version-hr-basics-v1',
        assignee_user_id: 'user-marcus',
        assigned_by: 'user-jordan-admin',
        status: 'pending',
      }),
    )
    expect(toastSuccessMock).toHaveBeenCalledWith(expect.stringMatching(/Assigned to Marcus Chen/i))
  })
})
