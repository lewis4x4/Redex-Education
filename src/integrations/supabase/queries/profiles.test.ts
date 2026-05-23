import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())
const eqMock = vi.hoisted(() => vi.fn())
const orderMock = vi.hoisted(() => vi.fn())
const maybeSingleMock = vi.hoisted(() => vi.fn())
const mapProfileRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `mapped-${(row as { id: string }).id}` })))

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }))
vi.mock('@/integrations/supabase/db-rows', () => ({ mapProfileRow: mapProfileRowMock }))

function wireBuilder() {
  const builder = { select: selectMock, eq: eqMock, order: orderMock, maybeSingle: maybeSingleMock }
  fromMock.mockReturnValue(builder)
  selectMock.mockReturnValue(builder)
  eqMock.mockReturnValue(builder)
  return builder
}

describe('profiles queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wireBuilder()
  })

  it('fetchProfileByUserId maps a single profile row', async () => {
    const row = { id: 'user-1' }
    maybeSingleMock.mockResolvedValueOnce({ data: row, error: null })
    const { fetchProfileByUserId } = await import('./profiles')

    await expect(fetchProfileByUserId('user-1')).resolves.toEqual({ id: 'mapped-user-1' })
    expect(fromMock).toHaveBeenCalledWith('profiles')
    expect(eqMock).toHaveBeenCalledWith('id', 'user-1')
    expect(mapProfileRowMock).toHaveBeenCalledWith(row)
  })

  it('fetchProfileByUserId throws Supabase errors', async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: new Error('profile failed') })
    const { fetchProfileByUserId } = await import('./profiles')

    await expect(fetchProfileByUserId('user-1')).rejects.toThrow('profile failed')
  })

  it('fetchAllProfiles maps all rows', async () => {
    const rows = [{ id: 'user-1' }, { id: 'user-2' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchAllProfiles } = await import('./profiles')

    await expect(fetchAllProfiles()).resolves.toEqual([{ id: 'mapped-user-1' }, { id: 'mapped-user-2' }])
    expect(orderMock).toHaveBeenCalledWith('display_name', { ascending: true })
    expect(mapProfileRowMock.mock.calls[0]?.[0]).toBe(rows[0])
  })

  it('fetchAllProfiles throws Supabase errors', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: new Error('profiles failed') })
    const { fetchAllProfiles } = await import('./profiles')

    await expect(fetchAllProfiles()).rejects.toThrow('profiles failed')
  })

  it('fetchProfilesByManagerId maps direct report rows', async () => {
    const rows = [{ id: 'report-1' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchProfilesByManagerId } = await import('./profiles')

    await expect(fetchProfilesByManagerId('manager-1')).resolves.toEqual([{ id: 'mapped-report-1' }])
    expect(eqMock).toHaveBeenCalledWith('manager_id', 'manager-1')
    expect(mapProfileRowMock.mock.calls[0]?.[0]).toBe(rows[0])
  })

  it('fetchProfilesByManagerId throws Supabase errors', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: new Error('reports failed') })
    const { fetchProfilesByManagerId } = await import('./profiles')

    await expect(fetchProfilesByManagerId('manager-1')).rejects.toThrow('reports failed')
  })
})
