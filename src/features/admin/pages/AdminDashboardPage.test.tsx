import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AdminDashboardPage } from './AdminDashboardPage'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location-path">{location.pathname}</div>
}

describe('AdminDashboardPage', () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    )
  }

  it('renders eyebrow, heading, and subhead', () => {
    renderPage()

    expect(screen.getByText('REDEX AI COURSE FOUNDRY')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back, Admin' })).toBeInTheDocument()
    expect(screen.getByText('Your training operations at a glance')).toBeInTheDocument()
  })

  it('renders the Foundry entry CTA enabled', () => {
    renderPage()

    expect(screen.getByRole('button', { name: /start new module/i })).toBeEnabled()
  })

  it('routes the assignments CTA to the assignment admin page', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <>
                <AdminDashboardPage />
                <LocationProbe />
              </>
            }
          />
          <Route path="/admin/assignments" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /open assignments/i }))

    expect(screen.getByTestId('location-path')).toHaveTextContent('/admin/assignments')
  })

  it('renders all metric labels', () => {
    renderPage()

    expect(screen.getAllByRole('heading', { name: 'Drafts' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('heading', { name: 'Needs review' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('heading', { name: 'Published' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Learners in progress' })).toBeInTheDocument()
  })

  it('renders all course status sections', () => {
    renderPage()

    expect(screen.getByRole('list', { name: 'Drafts modules' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Needs review modules' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Published modules' })).toBeInTheDocument()
  })
})
