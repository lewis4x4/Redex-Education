import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())
const eqMock = vi.hoisted(() => vi.fn())
const orderMock = vi.hoisted(() => vi.fn())
const mapAssignmentRowMock = vi.hoisted(() =>
  vi.fn((row: unknown) => ({ id: `assignment-${(row as { id: string }).id}` } as Record<string, unknown>)),
)
const mapModuleVersionRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({
  id: `module-version-${(row as { id: string }).id}`,
  module_title: 'Published module',
  published_at: '2026-05-24T00:00:00.000Z',
  created_at: '2026-05-23T00:00:00.000Z',
  published_by: 'publisher-1',
})))
const fetchProfilesByIdsMock = vi.hoisted(() => vi.fn())

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }))
vi.mock('@/integrations/supabase/db-rows', () => ({
  mapAssignmentRow: mapAssignmentRowMock,
  mapModuleVersionRow: mapModuleVersionRowMock,
}))
vi.mock('@/integrations/supabase/queries/profiles', () => ({ fetchProfilesByIds: fetchProfilesByIdsMock }))

function wireBuilder() {
  const builder = { select: selectMock, eq: eqMock, order: orderMock }
  fromMock.mockReturnValue(builder)
  selectMock.mockReturnValue(builder)
  eqMock.mockReturnValue(builder)
}

describe('assignments queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wireBuilder()
    fetchProfilesByIdsMock.mockResolvedValue(new Map())
  })

  it('fetchAssignmentsForUser maps assignment rows', async () => {
    const rows = [{ id: '1' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchAssignmentsForUser } = await import('./assignments')

    await expect(fetchAssignmentsForUser('user-1')).resolves.toEqual([{ id: 'assignment-1' }])
    expect(fromMock).toHaveBeenCalledWith('assignments')
    expect(eqMock).toHaveBeenCalledWith('assignee_user_id', 'user-1')
    expect(mapAssignmentRowMock.mock.calls[0]?.[0]).toBe(rows[0])
  })

  it('fetchAssignmentsForModule maps assignment rows', async () => {
    const rows = [{ id: '2' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchAssignmentsForModule } = await import('./assignments')

    await expect(fetchAssignmentsForModule('module-version-1')).resolves.toEqual([{ id: 'assignment-2' }])
    expect(eqMock).toHaveBeenCalledWith('module_version_id', 'module-version-1')
  })

  it('fetchPublishedModuleAssignments returns published module options', async () => {
    const rows = [{ id: 'one' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchPublishedModuleAssignments } = await import('./assignments')

    await expect(fetchPublishedModuleAssignments()).resolves.toEqual([
      {
        id: 'module-version-one',
        module_version_id: 'module-version-one',
        title: 'Published module',
        published_at: '2026-05-24T00:00:00.000Z',
        published_by: 'publisher-1',
      },
    ])
    expect(fromMock).toHaveBeenCalledWith('module_versions')
    expect(eqMock).toHaveBeenCalledWith('status', 'published')
  })

  it('fetchAllAssignmentsWithNames enriches with profile names', async () => {
    const rows = [{ id: '1' }]
    mapAssignmentRowMock.mockReturnValueOnce({
      id: 'assignment-1',
      module_version_id: 'module-1',
      assignee_user_id: 'user-1',
      assigned_by: 'admin-1',
      assigned_at: '2026-05-24T00:00:00.000Z',
      status: 'pending',
    })
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    fetchProfilesByIdsMock.mockResolvedValueOnce(
      new Map([
        ['user-1', { display_name: 'Learner One', preferred_name: null }],
        ['admin-1', { display_name: 'Admin One', preferred_name: null }],
      ]),
    )

    const { fetchAllAssignmentsWithNames } = await import('./assignments')

    await expect(fetchAllAssignmentsWithNames()).resolves.toEqual([
      expect.objectContaining({ assignee_display_name: 'Learner One', assigned_by_display_name: 'Admin One' }),
    ])
  })
})
