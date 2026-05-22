import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { SourceSection } from '@/lib/education'

import { SourcePreviewPanel } from './SourcePreviewPanel'

const sections: SourceSection[] = [
  {
    id: 'section-0-intro',
    level: 1,
    heading: 'Intro',
    body: 'Welcome body text',
    position_index: 0,
    has_placeholders: false,
  },
  {
    id: 'section-1-details',
    level: 2,
    heading: 'Details',
    body: 'Details body text',
    position_index: 1,
    has_placeholders: true,
  },
]

describe('SourcePreviewPanel', () => {
  it('renders empty state when no sections are provided', () => {
    render(<SourcePreviewPanel sections={[]} />)

    expect(
      screen.getByText(/paste markdown or upload a file to preview parsed sections/i),
    ).toBeInTheDocument()
    expect(screen.getByText('0 sections')).toBeInTheDocument()
  })

  it('renders section summary and section content for parsed sections', () => {
    render(<SourcePreviewPanel sections={sections} />)

    expect(screen.getByText('2 sections · 1 contain placeholders')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Intro' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Details' })).toBeInTheDocument()
    expect(screen.getByText('Welcome body text')).toBeInTheDocument()
    expect(screen.getByText('Details body text')).toBeInTheDocument()
  })

  it('shows needs source badge for placeholder sections', () => {
    render(<SourcePreviewPanel sections={sections} />)

    expect(screen.getByText('Needs source')).toBeInTheDocument()
  })
})
