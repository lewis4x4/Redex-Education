import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuditLogStore } from '../store/auditLogStore'
import { AuditLogPage } from './AuditLogPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <AuditLogPage />
    </MemoryRouter>,
  )
}

describe('AuditLogPage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_MOCK_AUTH', 'true')

    act(() => {
      useAuditLogStore.getState().resetEvents()
    })
  })

  it('renders seeded audit events', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Audit log' })).toBeInTheDocument()
    expect(screen.getAllByText(/Jordan Patel/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/HR Basics at Redex/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('article').length).toBeGreaterThanOrEqual(14)
  })

  it('filters the list by event type', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Quiz attempted/i }))

    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getAllByText('Quiz attempted').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Final Quiz/i).length).toBeGreaterThanOrEqual(1)
  })

  it('shows an empty state when no events match the selected filter', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Module version forked/i }))

    expect(screen.getByText('No audit events match this filter.')).toBeInTheDocument()
  })
})
