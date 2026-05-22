import { describe, it, expect } from 'vitest'

describe('test infrastructure smoke test', () => {
  it('runs Vitest', () => {
    expect(1 + 1).toBe(2)
  })

  it('has DOM globals (jsdom)', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })

  it('has jest-dom matchers extended', () => {
    document.body.innerHTML = '<button disabled>Test</button>'
    const button = document.querySelector('button')
    expect(button).toBeDisabled()
  })

  it('localStorage is reset between tests', () => {
    expect(window.localStorage.length).toBe(0)
  })
})
