import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

export interface DriveSyncButtonProps {
  onSyncStart?: () => void;
  onSyncComplete?: (summary: { files_seen: number; files_inserted: number; files_updated: number; files_failed: number }) => void;
  onSyncError?: (error: { code: string; message: string }) => void;
  disabled?: boolean;
}

interface DriveSyncSummary {
  files_seen: number
  files_inserted: number
  files_updated: number
  files_failed: number
}

interface DriveSyncSuccessResponse {
  status: 'ok'
  summary: DriveSyncSummary
}

interface DriveSyncErrorResponse {
  status: 'error'
  code: string
  message: string
}

function isDriveSyncErrorResponse(data: unknown): data is DriveSyncErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'status' in data &&
    data.status === 'error' &&
    'code' in data &&
    'message' in data
  )
}

function isDriveSyncSuccessResponse(data: unknown): data is DriveSyncSuccessResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'status' in data &&
    data.status === 'ok' &&
    'summary' in data
  )
}

function getFailureMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Drive sync failed. Please try again.'
}

export function DriveSyncButton({ onSyncStart, onSyncComplete, onSyncError, disabled = false }: DriveSyncButtonProps) {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    if (syncing || disabled) {
      return
    }

    setSyncing(true)
    onSyncStart?.()

    try {
      const { supabase } = await import('@/integrations/supabase/client')
      const { data, error } = await supabase.functions.invoke('drive-sync', {
        body: { trigger: 'manual' },
      })

      if (error) {
        const syncError = {
          code: 'drive_sync_failed',
          message: getFailureMessage(error),
        }
        toast.error(syncError.message)
        onSyncError?.(syncError)
        return
      }

      if (isDriveSyncErrorResponse(data)) {
        const syncError = { code: data.code, message: data.message }
        toast.error(syncError.message)
        onSyncError?.(syncError)
        return
      }

      if (!isDriveSyncSuccessResponse(data)) {
        const syncError = {
          code: 'drive_sync_unexpected_response',
          message: 'Drive sync returned an unexpected response.',
        }
        toast.error(syncError.message)
        onSyncError?.(syncError)
        return
      }

      const { summary } = data
      toast.success(
        `Drive sync complete: ${summary.files_seen} seen, ${summary.files_inserted} inserted, ${summary.files_updated} updated, ${summary.files_failed} failed.`,
      )
      onSyncComplete?.(summary)
    } catch (error) {
      const syncError = {
        code: 'drive_sync_failed',
        message: getFailureMessage(error),
      }
      toast.error(syncError.message)
      onSyncError?.(syncError)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleSync}
      disabled={disabled || syncing}
      aria-label="Sync source library from Google Drive"
      className="bg-redex-red text-white hover:bg-redex-red-hover focus-visible:ring-redex-red disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-100"
    >
      {syncing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {syncing ? 'Syncing…' : 'Sync from Drive'}
    </Button>
  )
}
