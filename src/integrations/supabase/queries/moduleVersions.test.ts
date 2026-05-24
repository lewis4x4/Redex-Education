import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())
const eqMock = vi.hoisted(() => vi.fn())
const orderMock = vi.hoisted(() => vi.fn())
const mapModuleVersionRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({
  id: `version-${(row as { id: string }).id}`,
  status: (row as { status?: string }).status,
})))

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }))
vi.mock('@/integrations/supabase/db-rows', () => ({
  mapModuleVersionRow: mapModuleVersionRowMock,
}))

function wireBuilder() {
  const builder = { select: selectMock, eq: eqMock, order: orderMock }
  fromMock.mockReturnValue(builder)
  selectMock.mockReturnValue(builder)
  eqMock.mockReturnValue(builder)
  orderMock.mockImplementation(() => builder)
  return builder
}

describe('module version history queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wireBuilder()
  })

  it('fetchModuleVersionHistory maps rows using newest version and created_at ordering', async () => {
    const builder = wireBuilder()
    const rows = [
      { id: 'v3', status: 'published' },
      { id: 'v2', status: 'in_review' },
    ]
    orderMock
      .mockImplementationOnce(() => builder)
      .mockResolvedValueOnce({ data: rows, error: null })
    const { fetchModuleVersionHistory } = await import('./moduleVersions')

    await expect(fetchModuleVersionHistory('module-1')).resolves.toEqual([
      { id: 'version-v3', status: 'published' },
      { id: 'version-v2', status: 'in_review' },
    ])

    expect(fromMock).toHaveBeenCalledWith('module_versions')
    expect(selectMock).toHaveBeenCalledWith('*')
    expect(eqMock).toHaveBeenCalledWith('module_id', 'module-1')
    expect(orderMock).toHaveBeenNthCalledWith(1, 'version_number', { ascending: false })
    expect(orderMock).toHaveBeenNthCalledWith(2, 'created_at', { ascending: false })
    expect(mapModuleVersionRowMock.mock.calls[0]?.[0]).toBe(rows[0])
  })

  it('fetchModuleVersionHistory includes archived rows in full history', async () => {
    const builder = wireBuilder()
    const rows = [{ id: 'archived-v1', status: 'archived' }]
    orderMock
      .mockImplementationOnce(() => builder)
      .mockResolvedValueOnce({ data: rows, error: null })
    const { fetchModuleVersionHistory } = await import('./moduleVersions')

    await expect(fetchModuleVersionHistory('module-1')).resolves.toEqual([
      { id: 'version-archived-v1', status: 'archived' },
    ])
    expect(mapModuleVersionRowMock.mock.calls[0]?.[0]).toBe(rows[0])
  })

  it('fetchModuleVersionHistory returns an empty list when Supabase returns no rows', async () => {
    const builder = wireBuilder()
    orderMock
      .mockImplementationOnce(() => builder)
      .mockResolvedValueOnce({ data: null, error: null })
    const { fetchModuleVersionHistory } = await import('./moduleVersions')

    await expect(fetchModuleVersionHistory('module-empty')).resolves.toEqual([])
    expect(mapModuleVersionRowMock).not.toHaveBeenCalled()
  })

  it('fetchModuleVersionHistory throws Supabase errors', async () => {
    const builder = wireBuilder()
    orderMock
      .mockImplementationOnce(() => builder)
      .mockResolvedValueOnce({ data: null, error: new Error('history failed') })
    const { fetchModuleVersionHistory } = await import('./moduleVersions')

    await expect(fetchModuleVersionHistory('module-1')).rejects.toThrow('history failed')
  })
})
