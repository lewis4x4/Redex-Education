import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ============================================================
// admin.ts query module — unit tests
//
// Mirrors the pattern in queries/courses.test.ts and
// queries/assignments.test.ts but mocks per-table builders so the
// three parallel queries inside fetchAdminSummary can be exercised
// independently.
// ============================================================

const fromMock = vi.hoisted(() => vi.fn())

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }))

interface ModuleVersionsBuilder {
  select: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
}
interface EnrollmentsBuilder {
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
}
interface AssignmentsBuilder {
  select: ReturnType<typeof vi.fn>
}

function wireBuilders(): {
  moduleVersions: ModuleVersionsBuilder
  enrollments: EnrollmentsBuilder
  assignments: AssignmentsBuilder
} {
  const moduleVersions: ModuleVersionsBuilder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn(),
  }
  const enrollments: EnrollmentsBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn(),
  }
  const assignments: AssignmentsBuilder = {
    select: vi.fn(),
  }

  fromMock.mockImplementation((table: string) => {
    if (table === 'module_versions') return moduleVersions
    if (table === 'user_training_enrollments') return enrollments
    if (table === 'assignments') return assignments
    throw new Error(`Unexpected table in test: ${table}`)
  })

  return { moduleVersions, enrollments, assignments }
}

// Stable "now" for deterministic relative-time output.
const NOW = new Date('2026-05-24T16:00:00.000Z').getTime()

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date(NOW))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('fetchAdminSummary', () => {
  it('aggregates module_versions into Draft / Needs review / Published buckets', async () => {
    const { moduleVersions, enrollments, assignments } = wireBuilders()

    moduleVersions.order.mockResolvedValueOnce({
      data: [
        // 2 hours ago — Draft
        {
          id: 'mv-draft-1',
          module_id: 'mod-a',
          module_title: 'Field Safety Refresher',
          status: 'draft',
          updated_at: new Date(NOW - 2 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(NOW - 2 * 60 * 60 * 1000).toISOString(),
          published_at: null,
          version_number: 1,
          source_stale: false,
        },
        // 3 days ago — in_review → Needs review
        {
          id: 'mv-review-1',
          module_id: 'mod-b',
          module_title: 'HR Onboarding — Pilot',
          status: 'in_review',
          updated_at: new Date(NOW - 3 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(NOW - 4 * 24 * 60 * 60 * 1000).toISOString(),
          published_at: null,
          version_number: 1,
          source_stale: false,
        },
        // approved → also Needs review
        {
          id: 'mv-review-2',
          module_id: 'mod-c',
          module_title: 'Approved But Not Published',
          status: 'approved',
          updated_at: new Date(NOW - 1 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
          published_at: null,
          version_number: 1,
          source_stale: false,
        },
        // 1 week ago — Published
        {
          id: 'mv-pub-1',
          module_id: 'mod-d',
          module_title: 'Redex Academy Orientation',
          status: 'published',
          updated_at: new Date(NOW - 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(NOW - 30 * 24 * 60 * 60 * 1000).toISOString(),
          published_at: new Date(NOW - 7 * 24 * 60 * 60 * 1000).toISOString(),
          version_number: 1,
          source_stale: false,
        },
        // archived → excluded
        {
          id: 'mv-archived-1',
          module_id: 'mod-e',
          module_title: 'Retired Module',
          status: 'archived',
          updated_at: new Date(NOW - 90 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(NOW - 180 * 24 * 60 * 60 * 1000).toISOString(),
          published_at: null,
          version_number: 1,
          source_stale: false,
        },
      ],
      error: null,
    })
    enrollments.eq.mockResolvedValueOnce({ count: 14, error: null })
    assignments.select.mockResolvedValueOnce({ data: [], error: null })

    const { fetchAdminSummary } = await import('./admin')
    const summary = await fetchAdminSummary()

    expect(fromMock).toHaveBeenCalledWith('module_versions')
    expect(fromMock).toHaveBeenCalledWith('user_training_enrollments')
    expect(fromMock).toHaveBeenCalledWith('assignments')

    expect(moduleVersions.order).toHaveBeenCalledWith('updated_at', { ascending: false })
    expect(enrollments.eq).toHaveBeenCalledWith('status', 'active')
    expect(enrollments.select).toHaveBeenCalledWith('*', { count: 'exact', head: true })
    expect(assignments.select).toHaveBeenCalledWith('status, due_at')

    expect(summary.metrics).toEqual({
      drafts: 1,
      needs_review: 2,
      published: 1,
      learners_in_progress: 14,
    })

    expect(summary.drafts).toEqual([
      {
        id: 'mv-draft-1',
        module_id: 'mod-a',
        module_version_id: 'mv-draft-1',
        version_number: 1,
        title: 'Field Safety Refresher',
        status: 'Draft',
        meta: 'Updated 2 hours ago',
      },
    ])

    expect(summary.needs_review.map((item) => item.id)).toEqual(['mv-review-1', 'mv-review-2'])
    expect(summary.needs_review[0]).toEqual(
      expect.objectContaining({
        id: 'mv-review-1',
        module_id: 'mod-b',
        module_version_id: 'mv-review-1',
        version_number: 1,
        status: 'Needs review',
      }),
    )
    expect(summary.needs_review[0]?.meta).toMatch(/^Awaiting review since /)

    expect(summary.published).toEqual([
      {
        id: 'mv-pub-1',
        module_id: 'mod-d',
        module_version_id: 'mv-pub-1',
        version_number: 1,
        title: 'Redex Academy Orientation',
        status: 'Published',
        meta: 'Published last week',
      },
    ])
  })

  it('computes assignment_summary with overdue derived from status OR due_at < now', async () => {
    const { moduleVersions, enrollments, assignments } = wireBuilders()

    moduleVersions.order.mockResolvedValueOnce({ data: [], error: null })
    enrollments.eq.mockResolvedValueOnce({ count: 0, error: null })

    const past = new Date(NOW - 24 * 60 * 60 * 1000).toISOString()
    const future = new Date(NOW + 24 * 60 * 60 * 1000).toISOString()

    assignments.select.mockResolvedValueOnce({
      data: [
        // 2 completed
        { status: 'completed', due_at: null },
        { status: 'completed', due_at: past },
        // 1 explicitly overdue
        { status: 'overdue', due_at: past },
        // 1 in_progress with past due_at → derived overdue
        { status: 'in_progress', due_at: past },
        // 1 in_progress not yet due
        { status: 'in_progress', due_at: future },
        // 1 pending with no due date → active, not overdue
        { status: 'pending', due_at: null },
      ],
      error: null,
    })

    const { fetchAdminSummary } = await import('./admin')
    const summary = await fetchAdminSummary()

    expect(summary.assignment_summary).toEqual({
      active_assignments: 4,
      overdue: 2,
      completion_rate_percent: 33, // 2 / 6 → 33% (rounded)
    })
  })

  it('returns 0% completion when there are no assignments', async () => {
    const { moduleVersions, enrollments, assignments } = wireBuilders()

    moduleVersions.order.mockResolvedValueOnce({ data: [], error: null })
    enrollments.eq.mockResolvedValueOnce({ count: 0, error: null })
    assignments.select.mockResolvedValueOnce({ data: [], error: null })

    const { fetchAdminSummary } = await import('./admin')
    const summary = await fetchAdminSummary()

    expect(summary.assignment_summary).toEqual({
      active_assignments: 0,
      overdue: 0,
      completion_rate_percent: 0,
    })
  })

  it('returns 0 learners_in_progress when the count is null', async () => {
    const { moduleVersions, enrollments, assignments } = wireBuilders()

    moduleVersions.order.mockResolvedValueOnce({ data: [], error: null })
    enrollments.eq.mockResolvedValueOnce({ count: null, error: null })
    assignments.select.mockResolvedValueOnce({ data: [], error: null })

    const { fetchAdminSummary } = await import('./admin')
    const summary = await fetchAdminSummary()

    expect(summary.metrics.learners_in_progress).toBe(0)
  })

  it('throws when module_versions query errors', async () => {
    const { moduleVersions, enrollments, assignments } = wireBuilders()

    moduleVersions.order.mockResolvedValueOnce({ data: null, error: new Error('mv failed') })
    enrollments.eq.mockResolvedValueOnce({ count: 0, error: null })
    assignments.select.mockResolvedValueOnce({ data: [], error: null })

    const { fetchAdminSummary } = await import('./admin')
    await expect(fetchAdminSummary()).rejects.toThrow('mv failed')
  })

  it('throws when user_training_enrollments query errors', async () => {
    const { moduleVersions, enrollments, assignments } = wireBuilders()

    moduleVersions.order.mockResolvedValueOnce({ data: [], error: null })
    enrollments.eq.mockResolvedValueOnce({ count: null, error: new Error('enrollments failed') })
    assignments.select.mockResolvedValueOnce({ data: [], error: null })

    const { fetchAdminSummary } = await import('./admin')
    await expect(fetchAdminSummary()).rejects.toThrow('enrollments failed')
  })

  it('throws when assignments query errors', async () => {
    const { moduleVersions, enrollments, assignments } = wireBuilders()

    moduleVersions.order.mockResolvedValueOnce({ data: [], error: null })
    enrollments.eq.mockResolvedValueOnce({ count: 0, error: null })
    assignments.select.mockResolvedValueOnce({ data: null, error: new Error('assignments failed') })

    const { fetchAdminSummary } = await import('./admin')
    await expect(fetchAdminSummary()).rejects.toThrow('assignments failed')
  })

  it('handles a published module_version with no published_at by omitting the timestamp', async () => {
    const { moduleVersions, enrollments, assignments } = wireBuilders()

    moduleVersions.order.mockResolvedValueOnce({
      data: [
        {
          id: 'mv-pub-no-date',
          module_id: 'mod-x',
          module_title: 'Legacy Backfill',
          status: 'published',
          updated_at: new Date(NOW - 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(NOW - 30 * 24 * 60 * 60 * 1000).toISOString(),
          published_at: null,
          version_number: 1,
          source_stale: false,
        },
      ],
      error: null,
    })
    enrollments.eq.mockResolvedValueOnce({ count: 0, error: null })
    assignments.select.mockResolvedValueOnce({ data: [], error: null })

    const { fetchAdminSummary } = await import('./admin')
    const summary = await fetchAdminSummary()

    expect(summary.published[0]?.meta).toBe('Published')
  })
})
