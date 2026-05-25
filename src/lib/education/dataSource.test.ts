import { afterEach, describe, expect, it, vi } from 'vitest'

import { getDataSource } from './dataSource'

describe('getDataSource', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('selects mock by default', () => {
    vi.stubEnv('VITE_DATA_SOURCE', '')
    expect(getDataSource()).toBe('mock')
  })

  it('selects supabase only when explicitly configured', () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'supabase')
    expect(getDataSource()).toBe('supabase')
  })

  it('throws for unknown values', () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'demo')
    expect(() => getDataSource()).toThrow(/Unsupported VITE_DATA_SOURCE value/i)
  })
})
