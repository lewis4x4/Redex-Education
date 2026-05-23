import { describe, expect, it } from 'vitest'

import {
  classifyMissingSourceSeverity,
  detectMissingSource,
  hasMissingSource,
} from './sourceValidation'

describe('sourceValidation', () => {
  it('returns an empty array for empty text', () => {
    expect(detectMissingSource('')).toEqual([])
  })

  it('detects [PLACEHOLDER] as a blocker and captures matched token', () => {
    const issues = detectMissingSource('Policy excerpt: [PLACEHOLDER] add approved text.')

    expect(issues).toHaveLength(1)
    expect(issues[0]).toEqual(
      expect.objectContaining({
        severity: 'blocker',
        token_matched: '[PLACEHOLDER]',
      }),
    )
  })

  it('detects [TODO] as a warning', () => {
    const issues = detectMissingSource('Checklist: [TODO] replace with approved source.')

    expect(issues).toHaveLength(1)
    expect(issues[0]).toEqual(expect.objectContaining({ severity: 'warning', token_matched: '[TODO]' }))
  })

  it('detects multiple mixed tokens with expected severities', () => {
    const text = 'A [TODO] warning plus [PLACEHOLDER] blocker and [FIXME] blocker.'

    const issues = detectMissingSource(text)

    expect(issues).toHaveLength(3)
    expect(issues.map((issue) => issue.token_matched)).toEqual(['[TODO]', '[PLACEHOLDER]', '[FIXME]'])
    expect(issues.map((issue) => issue.severity)).toEqual(['warning', 'blocker', 'blocker'])
  })

  it('hasMissingSource mirrors issue presence and classify maps TODO/PLACEHOLDER correctly', () => {
    const cleanText = 'Approved content only.'
    const todoText = 'Review step [TODO] before finalizing.'
    const placeholderText = 'Insert policy [PLACEHOLDER] here.'

    expect(hasMissingSource(cleanText)).toBe(detectMissingSource(cleanText).length > 0)
    expect(hasMissingSource(todoText)).toBe(detectMissingSource(todoText).length > 0)
    expect(hasMissingSource(placeholderText)).toBe(detectMissingSource(placeholderText).length > 0)

    expect(classifyMissingSourceSeverity('[TODO]')).toBe('warning')
    expect(classifyMissingSourceSeverity('[PLACEHOLDER]')).toBe('blocker')
  })
})
