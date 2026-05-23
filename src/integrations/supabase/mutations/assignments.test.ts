import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())
const insertMock = vi.hoisted(() => vi.fn())
const updateMock = vi.hoisted(() => vi.fn())
const eqMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())
const singleMock = vi.hoisted(() => vi.fn())
const mapAssignmentRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `assignment-${(row as { id: string }).id}` })))

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }))
vi.mock('@/integrations/supabase/db-rows', () => ({ mapAssignmentRow: mapAssignmentRowMock }))

function wireBuilder() {
  const builder = { insert: insertMock, update: updateMock, eq: eqMock, select: selectMock, single: singleMock }
  fromMock.mockReturnValue(builder)
  insertMock.mockReturnValue(builder)
  updateMock.mockReturnValue(builder)
  eqMock.mockReturnValue(builder)
  selectMock.mockReturnValue(builder)
}

describe('assignment mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wireBuilder()
  })

  it('insertAssignment inserts a pending assignment', async () => {
    singleMock.mockResolvedValueOnce({ data: { id: 'row' }, error: null })
    const { insertAssignment } = await import('./assignments')

    await expect(insertAssignment({ module_version_id: 'module-version-1', assignee_role: 'learner', assigned_by: 'user-admin' })).resolves.toEqual({ id: 'assignment-row' })
    expect(fromMock).toHaveBeenCalledWith('assignments')
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ assignee_role: 'learner', status: 'pending' }))
  })

  it('insertAssignment maps returned rows', async () => {
    const row = { id: 'row' }
    singleMock.mockResolvedValueOnce({ data: row, error: null })
    const { insertAssignment } = await import('./assignments')

    await insertAssignment({ module_version_id: 'module-version-1', assignee_role: 'learner', assigned_by: 'user-admin' })
    expect(mapAssignmentRowMock).toHaveBeenCalledWith(row)
  })

  it('insertAssignment throws descriptive errors', async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: new Error('assignment failed') })
    const { insertAssignment } = await import('./assignments')

    await expect(insertAssignment({ module_version_id: 'module-version-1', assignee_role: 'learner', assigned_by: 'user-admin' })).rejects.toThrow('Failed to insert assignment: assignment failed')
  })

  it('updateAssignmentStatus updates by id', async () => {
    singleMock.mockResolvedValueOnce({ data: { id: 'row' }, error: null })
    const { updateAssignmentStatus } = await import('./assignments')

    await expect(updateAssignmentStatus({ id: 'assignment-1', status: 'completed' })).resolves.toEqual({ id: 'assignment-row' })
    expect(updateMock).toHaveBeenCalledWith({ status: 'completed' })
    expect(eqMock).toHaveBeenCalledWith('id', expect.any(String))
  })

  it('updateAssignmentStatus throws descriptive errors', async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: new Error('status failed') })
    const { updateAssignmentStatus } = await import('./assignments')

    await expect(updateAssignmentStatus({ id: 'assignment-1', status: 'completed' })).rejects.toThrow('Failed to update assignment status: status failed')
  })
})
