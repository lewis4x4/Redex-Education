import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SourceReferencePanel } from './SourceReferencePanel'

describe('SourceReferencePanel', () => {
  it('shows empty state when excerpts are missing', () => {
    render(<SourceReferencePanel excerpts={[]} />)

    expect(screen.getByText('No source references available.')).toBeInTheDocument()
  })

  it('renders excerpt title, heading, and body', () => {
    render(
      <SourceReferencePanel
        excerpts={[
          {
            drive_file_id: 'file-1',
            source_title: 'employee-handbook.md',
            section_heading: 'Code of conduct',
            section_body: 'Treat everyone with dignity and respect.',
          },
        ]}
      />,
    )

    expect(screen.getByText('employee-handbook.md')).toBeInTheDocument()
    expect(screen.getByText('Code of conduct')).toBeInTheDocument()
    expect(screen.getByText('Treat everyone with dignity and respect.')).toBeInTheDocument()
  })

  it('renders highlighted span in a mark and shows placeholder warning', () => {
    render(
      <SourceReferencePanel
        excerpts={[
          {
            drive_file_id: 'file-2',
            source_title: 'pto-policy.md',
            section_heading: 'Eligibility',
            section_body: 'Employees accrue [PLACEHOLDER] until HR confirms policy.',
            highlighted_span: { start: 17, end: 29 },
          },
        ]}
      />,
    )

    const highlighted = screen.getByText('[PLACEHOLDER]')
    expect(highlighted.tagName).toBe('MARK')
    expect(highlighted).toHaveClass('bg-yellow-100')
    expect(screen.getByText('Placeholder content detected')).toBeInTheDocument()
  })
})
