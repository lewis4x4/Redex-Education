import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAssignmentStore } from '../store/assignmentStore'
import { AssignmentAdminPage } from './AssignmentAdminPage'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <AssignmentAdminPage />
    </MemoryRouter>,
  )
}

describe('AssignmentAdminPage', () => {
  beforeEach(() => {
    act(() => {
      useAssignmentStore.getState().resetAssignments()
    })
  })

  it('renders form and table', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: /manage assignments/i })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: /create assignment/i })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: /current assignments/i })).toBeInTheDocument()
  })

  it('after form submit, new row appears in the table', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('radio', { name: /audience group/i }))
    await user.selectOptions(screen.getByRole('combobox', { name: /select audience group/i }), 'new-hires')
    await user.click(screen.getByRole('button', { name: /assign training/i }))

    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(5))
    expect(screen.getByRole('row', { name: /All new hires/i })).toBeInTheDocument()
  })
})
