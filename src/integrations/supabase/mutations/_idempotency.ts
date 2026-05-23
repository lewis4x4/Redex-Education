import type { UUID } from '@/types/training'

export function createClientSideUUID(prefix = 'client'): UUID {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return stableClientUUID(`${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
}

export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)
}

export function stableClientUUID(seed: string): UUID {
  const bytes = new Uint8Array(16)
  let hash = 2166136261

  for (let i = 0; i < seed.length + 16; i += 1) {
    const code = seed.charCodeAt(i % Math.max(seed.length, 1)) || i
    hash ^= code + i
    hash = Math.imul(hash, 16777619)
    hash ^= hash >>> 13
    const byteIndex = i % 16
    bytes[byteIndex] = ((bytes[byteIndex] ?? 0) ^ hash ^ (hash >>> 8) ^ (hash >>> 16)) & 0xff
  }

  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80

  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function normalizeClientUUID(value: string, namespace = 'redex'): UUID {
  return isValidUUID(value) ? value : stableClientUUID(`${namespace}:${value}`)
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  return (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('load failed') ||
    message.includes('fetch failed')
  )
}

export async function safeRetry<T>(operation: () => PromiseLike<T>, retries = 1): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (retries > 0 && isNetworkError(error)) {
      return safeRetry(operation, retries - 1)
    }

    throw error
  }
}
