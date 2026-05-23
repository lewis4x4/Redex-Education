import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())
const eqMock = vi.hoisted(() => vi.fn())
const orderMock = vi.hoisted(() => vi.fn())
const mapSourceFileRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `file-${(row as { id: string }).id}` })))
const mapSourceFileVersionRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `version-${(row as { id: string }).id}` })))
const mapSourceSectionRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `section-${(row as { id: string }).id}` })))
const mapModuleSourceBindingRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `binding-${(row as { id: string }).id}` })))

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }))
vi.mock('@/integrations/supabase/db-rows', () => ({
  mapSourceFileRow: mapSourceFileRowMock,
  mapSourceFileVersionRow: mapSourceFileVersionRowMock,
  mapSourceSectionRow: mapSourceSectionRowMock,
  mapModuleSourceBindingRow: mapModuleSourceBindingRowMock,
}))

function wireBuilder() {
  const builder = { select: selectMock, eq: eqMock, order: orderMock }
  fromMock.mockReturnValue(builder)
  selectMock.mockReturnValue(builder)
  eqMock.mockReturnValue(builder)
}

describe('source library queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wireBuilder()
  })

  it('fetchSourceFiles maps source file rows', async () => {
    const rows = [{ id: '1' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchSourceFiles } = await import('./source_library')

    await expect(fetchSourceFiles()).resolves.toEqual([{ id: 'file-1' }])
    expect(fromMock).toHaveBeenCalledWith('source_files')
    expect(orderMock).toHaveBeenCalledWith('topic', { ascending: true })
    expect(mapSourceFileRowMock.mock.calls[0]?.[0]).toBe(rows[0])
  })

  it('fetchSourceFiles throws Supabase errors', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: new Error('files failed') })
    const { fetchSourceFiles } = await import('./source_library')

    await expect(fetchSourceFiles()).rejects.toThrow('files failed')
  })

  it('fetchSourceFileVersions maps version rows', async () => {
    const rows = [{ id: '1' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchSourceFileVersions } = await import('./source_library')

    await expect(fetchSourceFileVersions('file-1')).resolves.toEqual([{ id: 'version-1' }])
    expect(fromMock).toHaveBeenCalledWith('source_file_versions')
    expect(eqMock).toHaveBeenCalledWith('source_file_id', 'file-1')
    expect(mapSourceFileVersionRowMock.mock.calls[0]?.[0]).toBe(rows[0])
  })

  it('fetchSourceFileVersions throws Supabase errors', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: new Error('versions failed') })
    const { fetchSourceFileVersions } = await import('./source_library')

    await expect(fetchSourceFileVersions('file-1')).rejects.toThrow('versions failed')
  })

  it('fetchSourceSections maps section rows', async () => {
    const rows = [{ id: '1' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchSourceSections } = await import('./source_library')

    await expect(fetchSourceSections('version-1')).resolves.toEqual([{ id: 'section-1' }])
    expect(fromMock).toHaveBeenCalledWith('source_sections')
    expect(eqMock).toHaveBeenCalledWith('source_file_version_id', 'version-1')
    expect(mapSourceSectionRowMock.mock.calls[0]?.[0]).toBe(rows[0])
  })

  it('fetchSourceSections throws Supabase errors', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: new Error('sections failed') })
    const { fetchSourceSections } = await import('./source_library')

    await expect(fetchSourceSections('version-1')).rejects.toThrow('sections failed')
  })

  it('fetchModuleSourceBindings maps binding rows', async () => {
    const rows = [{ id: '1' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchModuleSourceBindings } = await import('./source_library')

    await expect(fetchModuleSourceBindings('module-version-1')).resolves.toEqual([{ id: 'binding-1' }])
    expect(fromMock).toHaveBeenCalledWith('module_source_bindings')
    expect(eqMock).toHaveBeenCalledWith('module_version_id', 'module-version-1')
    expect(mapModuleSourceBindingRowMock.mock.calls[0]?.[0]).toBe(rows[0])
  })

  it('fetchModuleSourceBindings throws Supabase errors', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: new Error('bindings failed') })
    const { fetchModuleSourceBindings } = await import('./source_library')

    await expect(fetchModuleSourceBindings('module-version-1')).rejects.toThrow('bindings failed')
  })
})
