import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DriveSyncButton } from './DriveSyncButton'

const invokeMock = vi.hoisted(() => vi.fn())

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}))

describe('DriveSyncButton', () => {
  it('invokes drive-sync and emits success summary on success', async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        status: 'ok',
        summary: {
          files_seen: 6,
          files_inserted: 2,
          files_updated: 3,
          files_failed: 1,
        },
      },
      error: null,
    })

    const user = userEvent.setup()
    const onSyncComplete = vi.fn()

    render(<DriveSyncButton onSyncComplete={onSyncComplete} />)
    await user.click(screen.getByRole('button', { name: /sync source library from google drive/i }))

    expect(invokeMock).toHaveBeenCalledWith('drive-sync', { body: { trigger: 'manual' } })
    await waitFor(() => {
      expect(onSyncComplete).toHaveBeenCalledWith({
        files_seen: 6,
        files_inserted: 2,
        files_updated: 3,
        files_failed: 1,
      })
    })
  })

  it('calls onSyncError when invoke returns an error', async () => {
    invokeMock.mockResolvedValueOnce({
      data: null,
      error: new Error('boom'),
    })

    const user = userEvent.setup()
    const onSyncError = vi.fn()

    render(<DriveSyncButton onSyncError={onSyncError} />)
    await user.click(screen.getByRole('button', { name: /sync source library from google drive/i }))

    await waitFor(() => {
      expect(onSyncError).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'drive_sync_failed', message: 'boom' }),
      )
    })
  })
})
