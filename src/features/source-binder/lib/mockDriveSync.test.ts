import { act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HR_SOURCE_FILE_IDS, HR_SOURCE_SECTION_IDS } from '@/features/source-binder/data/mockModuleSourceBindings'
import { useModuleVersionsStore } from '@/features/publishing/store/moduleVersionsStore'
import { useSourceChangeEventsStore } from '@/features/source-binder/store/sourceChangeEventsStore'
import { MOCK_DRIVE_SYNC_DELAY_MS, simulateDriveSync } from './mockDriveSync'

describe('simulateDriveSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    act(() => {
      useModuleVersionsStore.getState().resetVersions()
      useSourceChangeEventsStore.getState().resetEvents()
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('produces source change events and marks affected module versions stale', async () => {
    const syncPromise = simulateDriveSync()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_DRIVE_SYNC_DELAY_MS)
    })

    const events = await syncPromise

    expect(events).toEqual([
      expect.objectContaining({
        source_file_id: HR_SOURCE_FILE_IDS.ptoPolicy,
        source_file_name: 'pto-policy.md',
        section_ids_changed: [HR_SOURCE_SECTION_IDS.payroll, HR_SOURCE_SECTION_IDS.timekeeping],
        status: 'unreviewed',
      }),
    ])
    expect(useSourceChangeEventsStore.getState().events).toHaveLength(1)
    expect(useModuleVersionsStore.getState().versions.find((version) => version.id === 'module-version-hr-basics-v1')).toEqual(
      expect.objectContaining({ status: 'published', source_stale: true }),
    )
  })

  it('does not reopen a resolved event when the same revision is synced again', async () => {
    const firstSync = simulateDriveSync()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_DRIVE_SYNC_DELAY_MS)
    })
    await firstSync

    act(() => {
      useSourceChangeEventsStore.getState().markEventResolved('source-change-hr-payroll-timekeeping')
      useModuleVersionsStore.getState().markVersionStale('module-version-hr-basics-v1', false)
    })

    const secondSync = simulateDriveSync()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOCK_DRIVE_SYNC_DELAY_MS)
    })
    await secondSync

    expect(useSourceChangeEventsStore.getState().events[0]?.status).toBe('resolved')
    expect(useModuleVersionsStore.getState().versions[0]?.source_stale).toBeUndefined()
  })
})
