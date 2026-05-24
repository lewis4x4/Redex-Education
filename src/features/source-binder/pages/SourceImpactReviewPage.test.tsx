import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuditLogStore } from '@/features/audit/store/auditLogStore'
import { useModuleVersionsStore } from '@/features/publishing/store/moduleVersionsStore'
import { MOCK_DRIVE_SYNC_DELAY_MS } from '@/features/source-binder/lib/mockDriveSync'
import { useSourceChangeEventsStore } from '@/features/source-binder/store/sourceChangeEventsStore'
import { SourceImpactReviewPage } from './SourceImpactReviewPage'

describe('SourceImpactReviewPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    act(() => {
      useAuditLogStore.getState().resetEvents()
      useModuleVersionsStore.getState().resetVersions()
      useSourceChangeEventsStore.getState().resetEvents()
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('syncs source changes, renders impact review, and clears stale flag after scoped regeneration', async () => {
    render(<SourceImpactReviewPage />)

    expect(screen.getByText(/No source changes detected/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sync from Drive' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_DRIVE_SYNC_DELAY_MS)
    })

    expect(screen.getByText('pto-policy.md')).toBeInTheDocument()
    expect(screen.getByText('section-payroll-basics')).toBeInTheDocument()
    expect(screen.getByText(/Payroll is processed bi-weekly/i)).toBeInTheDocument()
    expect(screen.getByText('section-timekeeping-expectations')).toBeInTheDocument()
    expect(screen.getByText(/Hourly employees submit daily clock-in/i)).toBeInTheDocument()
    expect(screen.getByText('HR Basics at Redex · v1')).toBeInTheDocument()
    expect(screen.getByText('Stale')).toBeInTheDocument()
    expect(useModuleVersionsStore.getState().versions[0]).toEqual(expect.objectContaining({ source_stale: true }))

    fireEvent.click(screen.getByRole('button', { name: 'Regenerate affected lessons' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_DRIVE_SYNC_DELAY_MS)
    })

    expect(useModuleVersionsStore.getState().versions[0]?.source_stale).toBeUndefined()
    expect(useSourceChangeEventsStore.getState().events[0]?.status).toBe('resolved')
    expect(useAuditLogStore.getState().events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_type: 'stale_lesson_regenerated',
          actor_name: 'Redex system',
          entity_label: 'HR Basics at Redex v1',
        }),
      ]),
    )
    expect(screen.getByText('Resolved')).toBeInTheDocument()
  })

  it('keeps stale state when only part of the selected event impact is regenerated', async () => {
    render(<SourceImpactReviewPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Sync from Drive' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_DRIVE_SYNC_DELAY_MS)
    })

    fireEvent.click(screen.getByLabelText('Final Quiz'))
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate affected lessons' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_DRIVE_SYNC_DELAY_MS)
    })

    expect(useModuleVersionsStore.getState().versions[0]).toEqual(expect.objectContaining({ source_stale: true }))
    expect(useSourceChangeEventsStore.getState().events[0]?.status).toBe('unreviewed')
  })
})
