import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const orderMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())
const fromMock = vi.hoisted(() => vi.fn())

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}))

describe('useSourceLibrary', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')

    selectMock.mockReturnValue({ order: orderMock })
    fromMock.mockReturnValue({ select: selectMock })
  })

  it('loads files on mount and settles loading state', async () => {
    orderMock.mockResolvedValueOnce({
      data: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          drive_file_id: 'file-1',
          title: 'File One',
          mime_type: 'text/markdown',
          authority: 'context',
          authority_source: 'default',
          processing_status: 'processed',
          created_at: '2026-05-22T00:00:00.000Z',
          updated_at: '2026-05-22T00:00:00.000Z',
        },
      ],
      error: null,
    })

    const { useSourceLibrary } = await import('./useSourceLibrary')
    const { result } = renderHook(() => useSourceLibrary())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.files).toHaveLength(1)
  })

  it('refresh re-fetches source_files via supabase.from().select().order()', async () => {
    orderMock
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({
        data: [
          {
            id: '22222222-2222-2222-2222-222222222222',
            drive_file_id: 'file-2',
            title: 'File Two',
            mime_type: 'text/markdown',
            authority: 'supporting',
            authority_source: 'frontmatter',
            processing_status: 'processed',
            created_at: '2026-05-22T00:00:00.000Z',
            updated_at: '2026-05-22T00:00:00.000Z',
          },
        ],
        error: null,
      })

    const { useSourceLibrary } = await import('./useSourceLibrary')
    const { result } = renderHook(() => useSourceLibrary())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.refresh()
    })

    expect(fromMock).toHaveBeenCalledWith('source_files')
    expect(selectMock).toHaveBeenCalledWith('*')
    expect(orderMock).toHaveBeenCalledWith('topic', { ascending: true })
    expect(result.current.files[0]?.drive_file_id).toBe('file-2')
  })
})
