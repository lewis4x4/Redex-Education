import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AdminDashboardPage } from './AdminDashboardPage'

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

  it('renders the Foundry entry CTA in disabled state', () => {
    renderPage()

    expect(screen.getByRole('button', { name: /start new module/i })).toBeEnabled()
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
