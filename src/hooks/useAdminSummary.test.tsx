import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_ADMIN_SUMMARY } from '@/features/admin/data/mockAdmin'
import { useAdminSummary } from './useAdminSummary'
import type { AdminDashboardSummary } from '@/types/training'

// The hook lazy-imports the supabase data provider. We replace that module
// so the supabase-mode branch never touches a real Supabase client.
const getAdminSummaryMock = vi.hoisted(() => vi.fn<() => Promise<AdminDashboardSummary>>())
vi.mock('@/lib/education/supabaseDataProvider', () => ({
  getAdminSummary: getAdminSummaryMock,
}))

const SUPABASE_SUMMARY: AdminDashboardSummary = {
  metrics: {
    drafts: 1,
    needs_review: 2,
    published: 3,
    archived: 0,
    learners_in_progress: 4,
    pending_generation_jobs: 0,
  },
  drafts: [],
  needs_review: [],
  published: [],
  assignment_summary: { active_assignments: 5, overdue: 0, completion_rate_percent: 90 },
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('useAdminSummary', () => {
  it('returns MOCK_ADMIN_SUMMARY synchronously in mock mode', () => {
    vi.stubEnv('VITE_DATA_SOURCE', '')
    const { result } = renderHook(() => useAdminSummary())

    expect(result.current.summary).toBe(MOCK_ADMIN_SUMMARY)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(getAdminSummaryMock).not.toHaveBeenCalled()
  })

  it('refetch is a no-op in mock mode', () => {
    vi.stubEnv('VITE_DATA_SOURCE', '')
    const { result } = renderHook(() => useAdminSummary())

    act(() => {
      result.current.refetch()
    })

    expect(result.current.summary).toBe(MOCK_ADMIN_SUMMARY)
    expect(getAdminSummaryMock).not.toHaveBeenCalled()
  })

  it('loads from the supabase data provider in supabase mode', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'supabase')
    getAdminSummaryMock.mockResolvedValueOnce(SUPABASE_SUMMARY)

    const { result } = renderHook(() => useAdminSummary())

    expect(result.current.summary).toBeNull()
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.summary).toEqual(SUPABASE_SUMMARY)
    expect(result.current.error).toBeNull()
    expect(getAdminSummaryMock).toHaveBeenCalledTimes(1)
  })

  it('captures fetch errors and exposes them via the error field', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'supabase')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    getAdminSummaryMock.mockRejectedValueOnce(new Error('boom'))

    const { result } = renderHook(() => useAdminSummary())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.summary).toBeNull()
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('boom')
    warnSpy.mockRestore()
  })

  it('refetch in supabase mode triggers another provider call', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'supabase')
    getAdminSummaryMock.mockResolvedValueOnce(SUPABASE_SUMMARY).mockResolvedValueOnce({
      ...SUPABASE_SUMMARY,
      metrics: { ...SUPABASE_SUMMARY.metrics, drafts: 99 },
    })

    const { result } = renderHook(() => useAdminSummary())

    await waitFor(() => {
      expect(result.current.summary).toEqual(SUPABASE_SUMMARY)
    })

    act(() => {
      result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.summary?.metrics.drafts).toBe(99)
    })

    expect(getAdminSummaryMock).toHaveBeenCalledTimes(2)
  })
})
