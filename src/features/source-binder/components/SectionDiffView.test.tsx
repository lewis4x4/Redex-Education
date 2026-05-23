import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SectionDiffView } from './SectionDiffView'

describe('SectionDiffView', () => {
  it('renders empty state when no section is selected', () => {
    render(<SectionDiffView />)

    expect(screen.getByRole('heading', { name: 'No section selected' })).toBeInTheDocument()
  })

  it('renders before and after content with a changed badge', () => {
    render(<SectionDiffView sectionId="section-payroll-basics" oldContent="Old policy" newContent="New policy" />)

    expect(screen.getByText('section-payroll-basics')).toBeInTheDocument()
    expect(screen.getByText('Before')).toBeInTheDocument()
    expect(screen.getByText('After')).toBeInTheDocument()
    expect(screen.getByText('Old policy')).toBeInTheDocument()
    expect(screen.getByText('New policy')).toBeInTheDocument()
    expect(screen.getByText('Changed')).toBeInTheDocument()
  })
})
