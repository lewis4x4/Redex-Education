import { describe, expect, it, vi } from 'vitest'

import { createClientSideUUID, isValidUUID, normalizeClientUUID, safeRetry, stableClientUUID } from './_idempotency'

describe('mutation idempotency helpers', () => {
  it('creates UUIDs through crypto.randomUUID when available', () => {
    const randomUUID = vi.spyOn(crypto, 'randomUUID').mockReturnValue('11111111-1111-4111-8111-111111111111')

    expect(createClientSideUUID('test')).toBe('11111111-1111-4111-8111-111111111111')
    expect(randomUUID).toHaveBeenCalledTimes(1)

    randomUUID.mockRestore()
  })

  it('recognizes valid UUIDs', () => {
    expect(isValidUUID('11111111-1111-4111-8111-111111111111')).toBe(true)
    expect(isValidUUID('not-a-uuid')).toBe(false)
  })

  it('generates stable UUIDs from the same seed', () => {
    expect(stableClientUUID('same-seed')).toBe(stableClientUUID('same-seed'))
    expect(isValidUUID(stableClientUUID('same-seed'))).toBe(true)
  })

  it('normalizes non-UUID ids into deterministic UUIDs', () => {
    const normalized = normalizeClientUUID('module-version-hr-basics-v1', 'module_versions')

    expect(normalized).toBe(normalizeClientUUID('module-version-hr-basics-v1', 'module_versions'))
    expect(isValidUUID(normalized)).toBe(true)
  })

  it('safeRetry retries network errors once', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce('ok')

    await expect(safeRetry(operation)).resolves.toBe('ok')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('safeRetry rethrows non-network errors without retrying', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('RLS rejected'))

    await expect(safeRetry(operation)).rejects.toThrow('RLS rejected')
    expect(operation).toHaveBeenCalledTimes(1)
  })
})
