import { supabase } from '@/integrations/supabase/client'
import type { ModuleVersionRow } from '@/integrations/supabase/db-rows'
import type {
  AdminDashboardMetrics,
  AdminDashboardSummary,
  AdminModuleListItem,
} from '@/types/training'

// ============================================================
// Admin Dashboard Aggregator (Slice "Real Admin Dashboard")
//
// Replaces MOCK_ADMIN_SUMMARY consumption. Aggregates four redex
// tables into the canonical AdminDashboardSummary domain shape:
//
//   - redex.module_versions          → drafts / needs_review / published lists + counts
//   - redex.user_training_enrollments → learners_in_progress count
//   - redex.assignments               → active / overdue / completion_rate_percent
//
// Row→domain mapping stays at this integration boundary; the UI
// (AdminDashboardPage) consumes only AdminDashboardSummary.
// ============================================================

/** Module-version statuses surfaced as the "Drafts" bucket. */
const DRAFT_STATUSES: readonly string[] = ['draft']
/**
 * Statuses surfaced as the "Needs review" bucket. `approved` is included
 * because an approved-but-unpublished version still requires an admin
 * action (publish) before learners see it — semantically closer to a
 * review queue than to "Published".
 */
const NEEDS_REVIEW_STATUSES: readonly string[] = ['in_review', 'approved']
/** Module-version statuses surfaced as the "Published" bucket. */
const PUBLISHED_STATUSES: readonly string[] = ['published']

type AssignmentStatsRow = {
  status: string
  due_at: string | null
}

/**
 * Fetch the canonical admin dashboard summary by aggregating across
 * module_versions / user_training_enrollments / assignments.
 *
 * All three sub-queries run in parallel via `Promise.all`. Any
 * individual Supabase error rejects the whole call so the caller can
 * surface a single "failed to load" state.
 */
export async function fetchAdminSummary(): Promise<AdminDashboardSummary> {
  const [moduleVersions, learnersInProgress, assignmentSummary] = await Promise.all([
    fetchModuleVersionRowsForAdmin(),
    fetchLearnersInProgressCount(),
    fetchAssignmentSummary(),
  ])

  const drafts: AdminModuleListItem[] = []
  const needs_review: AdminModuleListItem[] = []
  const published: AdminModuleListItem[] = []

  for (const row of moduleVersions) {
    const item = toAdminModuleListItem(row)
    if (item === null) continue

    if (item.status === 'Draft') {
      drafts.push(item)
    } else if (item.status === 'Needs review') {
      needs_review.push(item)
    } else if (item.status === 'Published') {
      published.push(item)
    }
  }

  const metrics: AdminDashboardMetrics = {
    drafts: drafts.length,
    needs_review: needs_review.length,
    published: published.length,
    learners_in_progress: learnersInProgress,
  }

  return {
    metrics,
    drafts,
    needs_review,
    published,
    assignment_summary: assignmentSummary,
  }
}

async function fetchModuleVersionRowsForAdmin(): Promise<ModuleVersionRow[]> {
  const { data, error } = await supabase
    .from('module_versions')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ModuleVersionRow[]
}

async function fetchLearnersInProgressCount(): Promise<number> {
  const { count, error } = await supabase
    .from('user_training_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  if (error) throw error
  return count ?? 0
}

async function fetchAssignmentSummary(): Promise<AdminDashboardSummary['assignment_summary']> {
  const { data, error } = await supabase.from('assignments').select('status, due_at')

  if (error) throw error

  const rows = (data ?? []) as AssignmentStatsRow[]
  const now = Date.now()
  let completed = 0
  let active = 0
  let overdue = 0

  for (const row of rows) {
    if (row.status === 'completed') {
      completed += 1
      continue
    }

    active += 1

    if (row.status === 'overdue') {
      overdue += 1
      continue
    }

    if (row.due_at !== null) {
      const dueAtMs = Date.parse(row.due_at)
      if (!Number.isNaN(dueAtMs) && dueAtMs < now) {
        overdue += 1
      }
    }
  }

  const total = rows.length
  const completion_rate_percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  return {
    active_assignments: active,
    overdue,
    completion_rate_percent,
  }
}

function toAdminModuleListItem(row: ModuleVersionRow): AdminModuleListItem | null {
  if (DRAFT_STATUSES.includes(row.status)) {
    return {
      id: row.id,
      module_id: row.module_id,
      module_version_id: row.id,
      version_number: row.version_number,
      title: row.module_title,
      status: 'Draft',
      meta: `Updated ${formatRelativePast(row.updated_at)}`,
    }
  }

  if (NEEDS_REVIEW_STATUSES.includes(row.status)) {
    return {
      id: row.id,
      module_id: row.module_id,
      module_version_id: row.id,
      version_number: row.version_number,
      title: row.module_title,
      status: 'Needs review',
      meta: `Awaiting review since ${formatRelativePast(row.updated_at)}`,
    }
  }

  if (PUBLISHED_STATUSES.includes(row.status)) {
    const publishedAt = row.published_at
    return {
      id: row.id,
      module_id: row.module_id,
      module_version_id: row.id,
      version_number: row.version_number,
      title: row.module_title,
      status: 'Published',
      meta:
        publishedAt === null || publishedAt === undefined
          ? 'Published'
          : `Published ${formatRelativePast(publishedAt)}`,
    }
  }

  // archived (or any unknown status) → not surfaced on the dashboard.
  return null
}

/**
 * Render an ISO timestamp as a past-tense relative string using
 * `Intl.RelativeTimeFormat`. Mirrors the pattern in
 * `features/audit/components/AuditEventRow` and extends it with
 * week / month / year units so dashboard meta strings match the mock
 * shape ("Published 1 week ago", "Published 2 months ago").
 *
 * Always renders past-tense regardless of clock-skew edge cases.
 */
function formatRelativePast(value: string): string {
  const valueMs = new Date(value).getTime()
  if (Number.isNaN(valueMs)) return 'recently'

  const diffMs = valueMs - Date.now()
  const absMs = Math.abs(diffMs)

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  const year = 365 * day

  if (absMs < minute) return 'just now'

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  // Force past-tense by using a non-positive number.
  const past = diffMs > 0 ? -diffMs : diffMs

  if (absMs < hour) return formatter.format(Math.round(past / minute), 'minute')
  if (absMs < day) return formatter.format(Math.round(past / hour), 'hour')
  if (absMs < week) return formatter.format(Math.round(past / day), 'day')
  if (absMs < month) return formatter.format(Math.round(past / week), 'week')
  if (absMs < year) return formatter.format(Math.round(past / month), 'month')
  return formatter.format(Math.round(past / year), 'year')
}
