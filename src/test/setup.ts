import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

function createStorageMock(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
  }
}

function ensureStorageApi(name: 'localStorage' | 'sessionStorage') {
  const storage = window[name] as Partial<Storage>
  const isValidStorage =
    typeof storage?.clear === 'function' &&
    typeof storage?.getItem === 'function' &&
    typeof storage?.setItem === 'function' &&
    typeof storage?.removeItem === 'function' &&
    typeof storage?.length === 'number'

  if (!isValidStorage) {
    Object.defineProperty(window, name, {
      configurable: true,
      writable: true,
      value: createStorageMock(),
    })
  }
}

// Run RTL cleanup after every test (Vitest doesn't do this automatically)
afterEach(() => {
  cleanup()
})

// Always start each test with a clean localStorage so EducationContext
// hydration tests aren't influenced by sibling tests.
beforeEach(() => {
  ensureStorageApi('localStorage')
  ensureStorageApi('sessionStorage')

  window.localStorage.clear()
  window.sessionStorage.clear()
})
