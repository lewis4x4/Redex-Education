import { useCallback, useEffect, useState } from 'react'

import { MOCK_ADMIN_SUMMARY } from '@/features/admin/data/mockAdmin'
import { getDataSource } from '@/lib/education/dataSource'
import type { AdminDashboardSummary } from '@/types/training'

export interface UseAdminSummaryResult {
  /** The current admin dashboard summary, or null while it is still loading. */
  summary: AdminDashboardSummary | null
  /** True while the first (or refetched) load is in flight. */
  loading: boolean
  /** Captures the last fetch error so the UI can surface it. */
  error: Error | null
  /** Trigger a refetch (no-op in mock mode where the value is constant). */
  refetch: () => void
}

const noop = () => undefined

/**
 * React hook for the admin dashboard's aggregated summary.
 *
 * Mock-mode runtime path (default in dev and tests): returns
 * `MOCK_ADMIN_SUMMARY` synchronously with `loading: false`. This
 * preserves the existing dashboard test invariants.
 *
 * Supabase-mode runtime path (production): lazy-imports the real
 * aggregator and fetches on mount, with cancel-on-unmount and a
 * refetch handle. Errors are caught and exposed via `error`.
 *
 * Why the early-return shape instead of always awaiting the facade?
 * The existing dashboard tests query the rendered output
 * synchronously (no `findBy*`). Forcing every render through a
 * loading flicker would break ~633 tests. The mock fast-path here
 * mirrors `useProfile`, which also short-circuits when
 * `VITE_MOCK_AUTH=true`.
 */
export function useAdminSummary(): UseAdminSummaryResult {
  const isSupabase = getDataSource() === 'supabase'
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(
    isSupabase ? null : MOCK_ADMIN_SUMMARY,
  )
  const [loading, setLoading] = useState(isSupabase)
  const [error, setError] = useState<Error | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const refetch = useCallback(() => {
    if (!isSupabase) return
    setReloadKey((current) => current + 1)
  }, [isSupabase])

  useEffect(() => {
    if (!isSupabase) {
      return undefined
    }

    let cancelled = false

    // Defer the loading/error reset so we don't trigger a cascading
    // render inside the effect body (matches the precedent in
    // hooks/useProfile.ts).
    queueMicrotask(() => {
      if (cancelled) return
      setLoading(true)
      setError(null)
    })

    import('@/lib/education/supabaseDataProvider')
      .then(({ getAdminSummary }) => getAdminSummary())
      .then((next) => {
        if (cancelled) return
        setSummary(next)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        const wrapped = cause instanceof Error ? cause : new Error(String(cause))
        console.warn('[admin] Unable to load admin dashboard summary.', wrapped)
        setError(wrapped)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isSupabase, reloadKey])

  if (!isSupabase) {
    return { summary: MOCK_ADMIN_SUMMARY, loading: false, error: null, refetch: noop }
  }

  return { summary, loading, error, refetch }
}
