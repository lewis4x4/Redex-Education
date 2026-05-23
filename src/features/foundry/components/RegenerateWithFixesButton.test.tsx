import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RegenerateWithFixesButton } from './RegenerateWithFixesButton'

describe('RegenerateWithFixesButton', () => {
  it('is disabled when issueCount is 0', () => {
    render(<RegenerateWithFixesButton issueCount={0} />)

    expect(screen.getByRole('button', { name: /Regenerate with 0 fixes/i })).toBeDisabled()
  })

  it('calls onRegenerate and shows singular/plural labels correctly', async () => {
    const user = userEvent.setup()
    const onRegenerate = vi.fn()

    const { rerender } = render(<RegenerateWithFixesButton issueCount={5} onRegenerate={onRegenerate} />)
    const pluralButton = screen.getByRole('button', { name: /Regenerate with 5 fixes/i })
    expect(pluralButton).toBeEnabled()

    await user.click(pluralButton)
    expect(onRegenerate).toHaveBeenCalledTimes(1)

    rerender(<RegenerateWithFixesButton issueCount={1} onRegenerate={onRegenerate} />)
    expect(screen.getByRole('button', { name: /Regenerate with 1 fix/i })).toBeInTheDocument()
  })
})
