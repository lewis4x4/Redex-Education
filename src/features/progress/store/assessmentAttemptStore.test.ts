import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { RecordAttemptInput } from './assessmentAttemptStore'

const baseAttempt: RecordAttemptInput = {
  enrollment_id: 'enroll-marcus-hr-basics-001',
  lesson_id: 'hr-basics-lesson-6-final-quiz',
  score_percent: 80,
  passed: true,
  answers: { 'hr-basics-q-1': 3, 'hr-basics-q-2': 2 },
}

describe('useAssessmentAttemptStore', () => {
  let useAssessmentAttemptStore: (typeof import('./assessmentAttemptStore'))['useAssessmentAttemptStore']

  beforeEach(async () => {
    vi.resetModules()
    ;({ useAssessmentAttemptStore } = await import('./assessmentAttemptStore'))

    act(() => {
      useAssessmentAttemptStore.getState().resetAttempts()
    })
  })

  it('starts with an empty attempt history', () => {
    expect(useAssessmentAttemptStore.getState().attempts).toEqual([])
  })

  it('recordAttempt appends an attempt with generated id and attempted_at timestamp', () => {
    let recorded = undefined as ReturnType<typeof useAssessmentAttemptStore.getState>['attempts'][number] | undefined

    act(() => {
      recorded = useAssessmentAttemptStore.getState().recordAttempt(baseAttempt)
    })

    expect(recorded).toEqual(
      expect.objectContaining({
        enrollment_id: baseAttempt.enrollment_id,
        lesson_id: baseAttempt.lesson_id,
        score_percent: 80,
        passed: true,
        answers: baseAttempt.answers,
      }),
    )
    expect(recorded?.id).toEqual(expect.any(String))
    expect(Number.isNaN(Date.parse(recorded?.attempted_at ?? ''))).toBe(false)
    expect(useAssessmentAttemptStore.getState().attempts).toContainEqual(recorded)
  })

  it('retains multiple attempts for the same lesson', () => {
    act(() => {
      useAssessmentAttemptStore.getState().recordAttempt({ ...baseAttempt, score_percent: 60, passed: false })
      useAssessmentAttemptStore.getState().recordAttempt({ ...baseAttempt, score_percent: 100, passed: true })
    })

    expect(useAssessmentAttemptStore.getState().getAttemptsForLesson(baseAttempt.lesson_id)).toHaveLength(2)
  })

  it('getLatestAttempt returns the most recent attempt by attempted_at', () => {
    act(() => {
      useAssessmentAttemptStore.setState({
        attempts: [
          {
            id: 'attempt-newer',
            ...baseAttempt,
            attempted_at: '2026-05-23T10:00:00.000Z',
            score_percent: 100,
          },
          {
            id: 'attempt-older',
            ...baseAttempt,
            attempted_at: '2026-05-23T09:00:00.000Z',
            score_percent: 60,
            passed: false,
          },
        ],
      })
    })

    expect(useAssessmentAttemptStore.getState().getLatestAttempt(baseAttempt.lesson_id)).toEqual(
      expect.objectContaining({ id: 'attempt-newer', score_percent: 100 }),
    )
  })

  it('getBestScore returns max score across attempts', () => {
    act(() => {
      useAssessmentAttemptStore.getState().recordAttempt({ ...baseAttempt, score_percent: 60, passed: false })
      useAssessmentAttemptStore.getState().recordAttempt({ ...baseAttempt, score_percent: 80, passed: true })
      useAssessmentAttemptStore.getState().recordAttempt({ ...baseAttempt, score_percent: 40, passed: false })
    })

    expect(useAssessmentAttemptStore.getState().getBestScore(baseAttempt.lesson_id)).toBe(80)
    expect(useAssessmentAttemptStore.getState().getBestScore('unknown-lesson')).toBeNull()
  })

  it('getAttemptCount counts attempts for a lesson', () => {
    act(() => {
      useAssessmentAttemptStore.getState().recordAttempt(baseAttempt)
      useAssessmentAttemptStore.getState().recordAttempt({ ...baseAttempt, lesson_id: 'other-lesson' })
      useAssessmentAttemptStore.getState().recordAttempt({ ...baseAttempt, score_percent: 100 })
    })

    expect(useAssessmentAttemptStore.getState().getAttemptCount(baseAttempt.lesson_id)).toBe(2)
  })

  it('resetAttempts clears the attempt history', () => {
    act(() => {
      useAssessmentAttemptStore.getState().recordAttempt(baseAttempt)
      useAssessmentAttemptStore.getState().resetAttempts()
    })

    expect(useAssessmentAttemptStore.getState().attempts).toEqual([])
  })

  it('persists attempts across a store reload', async () => {
    act(() => {
      useAssessmentAttemptStore.getState().recordAttempt({ ...baseAttempt, score_percent: 100 })
    })

    vi.resetModules()
    const reloaded = await import('./assessmentAttemptStore')

    expect(reloaded.useAssessmentAttemptStore.getState().attempts).toEqual([
      expect.objectContaining({
        lesson_id: baseAttempt.lesson_id,
        score_percent: 100,
        answers: baseAttempt.answers,
      }),
    ])
  })
})
