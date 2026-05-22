import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MOCK_GENERATED_OUTLINE } from '@/features/foundry/data/mockGeneratedOutline'
import { MissingInfoWarnings } from './MissingInfoWarnings'

describe('MissingInfoWarnings', () => {
  const notes = MOCK_GENERATED_OUTLINE.missing_source_notes ?? []

  it('returns null and renders nothing when notes are empty', () => {
    const { container } = render(<MissingInfoWarnings notes={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders warning card with heading, icon, and list items when notes exist', () => {
    render(<MissingInfoWarnings notes={notes} />)

    expect(screen.getByRole('heading', { name: 'Missing source information' })).toBeInTheDocument()
    expect(document.querySelector('svg')).toBeInTheDocument()

    const notesListItems = screen.getAllByRole('listitem')
    expect(notesListItems).toHaveLength(notes.length)
    for (const note of notes) {
      expect(screen.getByText(new RegExp(note.slice(0, 24)))).toBeInTheDocument()
    }
  })

  it('wraps Drive ID segments in inline code elements', () => {
    render(<MissingInfoWarnings notes={notes} />)

    expect(screen.getAllByText(/Drive ID/i, { selector: 'code' }).length).toBeGreaterThan(0)
  })
})
