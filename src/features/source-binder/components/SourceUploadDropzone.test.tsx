import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SourceUploadDropzone } from './SourceUploadDropzone'

describe('SourceUploadDropzone', () => {
  it('renders upload affordance content', () => {
    render(<SourceUploadDropzone onFileLoaded={vi.fn()} />)

    expect(screen.getByText(/upload a markdown file/i)).toBeInTheDocument()
    expect(
      screen.getByText(/or paste the source content into the textarea on the left/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/markdown \(\.md\) only for now/i)).toBeInTheDocument()
  })

  it('calls onFileLoaded with filename and text when a file is selected', async () => {
    const user = userEvent.setup()
    const onFileLoaded = vi.fn()

    render(<SourceUploadDropzone onFileLoaded={onFileLoaded} />)

    const file = new File(['# Test'], 'test.md', { type: 'text/markdown' })
    const fileInput = screen.getByLabelText(/upload a markdown file/i)

    await user.upload(fileInput, file)

    expect(onFileLoaded).toHaveBeenCalledWith({ filename: 'test.md', rawText: '# Test' })
  })

  it('renders success state when hasUpload is true', () => {
    render(
      <SourceUploadDropzone
        onFileLoaded={vi.fn()}
        hasUpload
        currentFilename="policies.md"
      />,
    )

    expect(screen.getByText('File loaded: policies.md')).toBeInTheDocument()
    expect(screen.getByText(/tap to replace with a different file/i)).toBeInTheDocument()
  })
})
