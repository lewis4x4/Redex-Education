import type { AdminDashboardSummary } from '@/types/training'
import { getDataSource } from './dataSource'
import { MOCK_ADMIN_SUMMARY } from '@/features/admin/data/mockAdmin'
import * as supabaseDataProvider from './supabaseDataProvider'

/**
 * Resolve the canonical admin dashboard summary, dispatching between
 * the mock seed data (default) and the live Supabase aggregator.
 *
 * Pattern mirrors the other Slice 8.3 read facades
 * (`getCourses`, `getAssignmentsForUser`, etc.). Mock mode preserves
 * byte-identical output so the existing dashboard tests continue to
 * pass; production builds set `VITE_DATA_SOURCE=supabase` and exercise
 * the real aggregator.
 */
export async function getAdminSummary(): Promise<AdminDashboardSummary> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getAdminSummary()
  }

  return MOCK_ADMIN_SUMMARY
}
