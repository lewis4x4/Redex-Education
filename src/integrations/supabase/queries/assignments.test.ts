import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())
const eqMock = vi.hoisted(() => vi.fn())
const orderMock = vi.hoisted(() => vi.fn())
const mapAssignmentRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `assignment-${(row as { id: string }).id}` })))

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }))
vi.mock('@/integrations/supabase/db-rows', () => ({ mapAssignmentRow: mapAssignmentRowMock }))

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

  it('fetchAssignmentsForUser throws Supabase errors', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: new Error('user assignments failed') })
    const { fetchAssignmentsForUser } = await import('./assignments')

    await expect(fetchAssignmentsForUser('user-1')).rejects.toThrow('user assignments failed')
  })

  it('fetchAssignmentsForModule maps assignment rows', async () => {
    const rows = [{ id: '2' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchAssignmentsForModule } = await import('./assignments')

    await expect(fetchAssignmentsForModule('module-version-1')).resolves.toEqual([{ id: 'assignment-2' }])
    expect(eqMock).toHaveBeenCalledWith('module_version_id', 'module-version-1')
    expect(mapAssignmentRowMock.mock.calls[0]?.[0]).toBe(rows[0])
  })

  it('fetchAssignmentsForModule throws Supabase errors', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: new Error('module assignments failed') })
    const { fetchAssignmentsForModule } = await import('./assignments')

    await expect(fetchAssignmentsForModule('module-version-1')).rejects.toThrow('module assignments failed')
  })
})
