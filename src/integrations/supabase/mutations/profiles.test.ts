import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())
const upsertMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())
const singleMock = vi.hoisted(() => vi.fn())
const mapProfileRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `profile-${(row as { id: string }).id}` })))

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }))
vi.mock('@/integrations/supabase/db-rows', () => ({ mapProfileRow: mapProfileRowMock }))

function wireBuilder() {
  const builder = { upsert: upsertMock, select: selectMock, single: singleMock }
  fromMock.mockReturnValue(builder)
  upsertMock.mockReturnValue(builder)
  selectMock.mockReturnValue(builder)
}

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  org_id: 'org-redex',
  email: 'user@example.com',
  display_name: 'User',
  role: 'learner' as const,
  created_at: '2026-05-23T00:00:00.000Z',
  updated_at: '2026-05-23T00:00:00.000Z',
}

describe('profile mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wireBuilder()
  })

  it('upsertProfile upserts by profile id', async () => {
    singleMock.mockResolvedValueOnce({ data: { id: 'row' }, error: null })
    const { upsertProfile } = await import('./profiles')

    await expect(upsertProfile(user)).resolves.toEqual({ id: 'profile-row' })
    expect(fromMock).toHaveBeenCalledWith('profiles')
    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ id: user.id, email: user.email }), { onConflict: 'id' })
  })

  it('upsertProfile maps the returned row', async () => {
    const row = { id: 'row' }
    singleMock.mockResolvedValueOnce({ data: row, error: null })
    const { upsertProfile } = await import('./profiles')

    await upsertProfile(user)
    expect(mapProfileRowMock).toHaveBeenCalledWith(row)
  })

  it('upsertProfile throws descriptive errors', async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: new Error('profile failed') })
    const { upsertProfile } = await import('./profiles')

    await expect(upsertProfile(user)).rejects.toThrow('Failed to upsert profile: profile failed')
  })
})
