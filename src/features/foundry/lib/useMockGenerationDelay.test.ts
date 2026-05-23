import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useMockGenerationDelay } from './useMockGenerationDelay'

describe('useMockGenerationDelay', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call populate when shouldGenerate is false', () => {
    vi.useFakeTimers()

    const populate = vi.fn()
    const onComplete = vi.fn()
    const { result } = renderHook(() =>
      useMockGenerationDelay({
        shouldGenerate: false,
        delayMs: 600,
        populate,
        onComplete,
      }),
    )

    expect(result.current.isGenerating).toBe(false)

    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(populate).not.toHaveBeenCalled()
    expect(onComplete).not.toHaveBeenCalled()
    expect(result.current.isGenerating).toBe(false)
  })

  it('calls populate once after delay and resets isGenerating', () => {
    vi.useFakeTimers()

    const populate = vi.fn()
    const onComplete = vi.fn()
    const { result } = renderHook(() =>
      useMockGenerationDelay({
        shouldGenerate: true,
        delayMs: 700,
        populate,
        onComplete,
      }),
    )

    expect(result.current.isGenerating).toBe(true)

    act(() => {
      vi.advanceTimersByTime(700)
    })

    expect(populate).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(result.current.isGenerating).toBe(false)
  })

  it('calls populate again when shouldGenerate flips false then true', () => {
    vi.useFakeTimers()

    const populate = vi.fn()
    const { rerender } = renderHook(
      ({ shouldGenerate }) =>
        useMockGenerationDelay({
          shouldGenerate,
          delayMs: 500,
          populate,
        }),
      {
        initialProps: { shouldGenerate: true },
      },
    )

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(populate).toHaveBeenCalledTimes(1)

    rerender({ shouldGenerate: false })
    rerender({ shouldGenerate: true })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(populate).toHaveBeenCalledTimes(2)
  })
})
