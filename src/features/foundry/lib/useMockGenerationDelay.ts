import { useEffect, useRef, useState } from 'react'

export interface UseMockGenerationDelayOptions {
  /** When true, the hook will (after delayMs) call `populate()` once. Becomes false again after populate runs. */
  shouldGenerate: boolean
  /** ms to wait before calling populate. */
  delayMs: number
  /** Callback that writes mock data into the store. Called exactly once per (mount + shouldGenerate transition to true). */
  populate: () => void
  /** Optional post-populate callback (e.g. for toasts). */
  onComplete?: () => void
}

export interface UseMockGenerationDelayResult {
  /** True between the moment the hook decides to generate and the populate() call. */
  isGenerating: boolean
}

export function useMockGenerationDelay(opts: UseMockGenerationDelayOptions): UseMockGenerationDelayResult {
  const { shouldGenerate, delayMs, populate, onComplete } = opts
  const hasGeneratedRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)
  const populateRef = useRef(populate)
  const onCompleteRef = useRef(onComplete)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    populateRef.current = populate
    onCompleteRef.current = onComplete
  }, [onComplete, populate])

  useEffect(() => {
    if (!shouldGenerate) {
      hasGeneratedRef.current = false

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      return
    }

    if (hasGeneratedRef.current) {
      return
    }

    hasGeneratedRef.current = true
    setIsGenerating(true)

    timeoutRef.current = window.setTimeout(() => {
      populateRef.current()
      onCompleteRef.current?.()
      setIsGenerating(false)
      timeoutRef.current = null
    }, delayMs)

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [delayMs, shouldGenerate])

  return { isGenerating: shouldGenerate && isGenerating }
}
