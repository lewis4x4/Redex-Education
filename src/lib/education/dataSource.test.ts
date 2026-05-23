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

  it('falls back to mock for unknown values', () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'demo')
    expect(getDataSource()).toBe('mock')
  })
})
