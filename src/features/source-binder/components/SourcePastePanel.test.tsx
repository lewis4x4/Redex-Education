import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SourcePastePanel, type SourceType } from './SourcePastePanel'

describe('SourcePastePanel', () => {
  it('renders all controlled fields with labels', () => {
    render(
      <SourcePastePanel
        title=""
        type="markdown"
        rawText=""
        onTitleChange={vi.fn()}
        onTypeChange={vi.fn()}
        onRawTextChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('textbox', { name: /source title/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /source type/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /markdown source/i })).toBeInTheDocument()
  })

  it('calls change handlers with updated values', async () => {
    const user = userEvent.setup()
    const onTitleChange = vi.fn()
    const onTypeChange = vi.fn()
    const onRawTextChange = vi.fn()

    function ControlledPanel() {
      const [title, setTitle] = useState('')
      const [type, setType] = useState<SourceType>('markdown')
      const [rawText, setRawText] = useState('')

      return (
        <SourcePastePanel
          title={title}
          type={type}
          rawText={rawText}
          onTitleChange={(value) => {
            setTitle(value)
            onTitleChange(value)
          }}
          onTypeChange={(value) => {
            setType(value)
            onTypeChange(value)
          }}
          onRawTextChange={(value) => {
            setRawText(value)
            onRawTextChange(value)
          }}
        />
      )
    }

    render(<ControlledPanel />)

    await user.type(screen.getByRole('textbox', { name: /source title/i }), 'Safety handbook')
    await user.selectOptions(screen.getByRole('combobox', { name: /source type/i }), 'docx')
    await user.type(screen.getByRole('textbox', { name: /markdown source/i }), '# Intro')

    expect(onTitleChange).toHaveBeenLastCalledWith('Safety handbook')
    expect(onTypeChange).toHaveBeenCalledWith('docx')
    expect(onRawTextChange).toHaveBeenLastCalledWith('# Intro')
  })

  it('shows helper text when non-markdown type is selected', () => {
    render(
      <SourcePastePanel
        title="Doc source"
        type="pdf"
        rawText=""
        onTitleChange={vi.fn()}
        onTypeChange={vi.fn()}
        onRawTextChange={vi.fn()}
      />,
    )

    expect(
      screen.getByText(/markdown is the only fully supported type right now/i),
    ).toBeInTheDocument()
  })
})
