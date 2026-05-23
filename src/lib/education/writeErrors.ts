import type { ISODateTime } from '@/types/training'

export type WriteError = {
  action: string
  message: string
  cause?: unknown
  ts: ISODateTime
}

export function toWriteError(action: string, cause: unknown): WriteError {
  return {
    action,
    message: cause instanceof Error ? cause.message : String(cause),
    cause,
    ts: new Date().toISOString(),
  }
}
