import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { AssessmentAttempt } from '@/types/training'

export interface RecordAttemptInput {
  enrollment_id: AssessmentAttempt['enrollment_id']
  lesson_id: AssessmentAttempt['lesson_id']
  score_percent: AssessmentAttempt['score_percent']
  passed: AssessmentAttempt['passed']
  answers: AssessmentAttempt['answers']
}

interface AssessmentAttemptState {
  attempts: AssessmentAttempt[]
  recordAttempt: (input: RecordAttemptInput) => AssessmentAttempt
  getAttemptsForLesson: (lessonId: AssessmentAttempt['lesson_id']) => AssessmentAttempt[]
  getLatestAttempt: (lessonId: AssessmentAttempt['lesson_id']) => AssessmentAttempt | undefined
  getAttemptCount: (lessonId: AssessmentAttempt['lesson_id']) => number
  getBestScore: (lessonId: AssessmentAttempt['lesson_id']) => number | null
  resetAttempts: () => void
}

function createMemoryStorage(): Storage {
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

function getAssessmentAttemptStorage(): Storage {
  if (
    typeof localStorage !== 'undefined' &&
    typeof localStorage.getItem === 'function' &&
    typeof localStorage.setItem === 'function' &&
    typeof localStorage.removeItem === 'function'
  ) {
    return localStorage
  }

  return createMemoryStorage()
}

function createAttemptId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `assessment-attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function sortAttemptsOldestFirst(attempts: AssessmentAttempt[]): AssessmentAttempt[] {
  return [...attempts].sort((a, b) => a.attempted_at.localeCompare(b.attempted_at))
}

export const useAssessmentAttemptStore = create<AssessmentAttemptState>()(
  persist(
    (set, get) => ({
      attempts: [],
      recordAttempt: (input) => {
        const attempt: AssessmentAttempt = {
          id: createAttemptId(),
          enrollment_id: input.enrollment_id,
          lesson_id: input.lesson_id,
          attempted_at: new Date().toISOString(),
          score_percent: input.score_percent,
          passed: input.passed,
          answers: { ...input.answers },
        }

        set((state) => ({ attempts: [...state.attempts, attempt] }))
        return attempt
      },
      getAttemptsForLesson: (lessonId) =>
        sortAttemptsOldestFirst(get().attempts.filter((attempt) => attempt.lesson_id === lessonId)),
      getLatestAttempt: (lessonId) => get().getAttemptsForLesson(lessonId).at(-1),
      getAttemptCount: (lessonId) => get().attempts.filter((attempt) => attempt.lesson_id === lessonId).length,
      getBestScore: (lessonId) => {
        const scores = get()
          .attempts.filter((attempt) => attempt.lesson_id === lessonId)
          .map((attempt) => attempt.score_percent)

        return scores.length > 0 ? Math.max(...scores) : null
      },
      resetAttempts: () => set({ attempts: [] }),
    }),
    {
      name: 'redex-assessment-attempts-v1',
      storage: createJSONStorage(() => getAssessmentAttemptStorage()),
    },
  ),
)
