import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { useAuditLogStore } from '@/features/audit/store/auditLogStore'
import { getDataSource } from '@/lib/education/dataSource'
import { DEMO_HR_BASICS_LESSONS, DEMO_LESSONS } from '@/lib/education/demo-data'
import { MOCK_ORG_PEOPLE } from '@/lib/education/mockOrgPeople'
import { toWriteError, type WriteError } from '@/lib/education/writeErrors'
import type { AssessmentAttempt } from '@/types/training'

export interface RecordAttemptInput {
  enrollment_id: AssessmentAttempt['enrollment_id']
  lesson_id: AssessmentAttempt['lesson_id']
  score_percent: AssessmentAttempt['score_percent']
  passed: AssessmentAttempt['passed']
  answers: AssessmentAttempt['answers']
  actor_user_id?: string
}

interface AssessmentAttemptState {
  attempts: AssessmentAttempt[]
  lastWriteError: WriteError | null
  clearLastWriteError: () => void
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

function getActorUserId(input: RecordAttemptInput): string {
  if (input.actor_user_id) {
    return input.actor_user_id
  }

  if (input.enrollment_id.includes('marcus')) {
    return 'user-marcus'
  }

  if (input.enrollment_id.includes('ana')) {
    return 'user-ana'
  }

  if (input.enrollment_id.includes('devon')) {
    return 'user-devon-lee'
  }

  return 'system'
}

function getActorName(userId: string): string {
  return MOCK_ORG_PEOPLE.find((person) => person.id === userId)?.display_name ?? 'Learner'
}

function getLessonLabel(lessonId: string): string {
  const lesson = [...DEMO_HR_BASICS_LESSONS, ...DEMO_LESSONS].find((candidate) => candidate.id === lessonId)

  return lesson ? `${lesson.title} · ${lesson.module_id === 'hr-basics-mod-001' ? 'HR Basics at Redex' : 'Redex Academy'}` : lessonId
}

function shouldPersistToSupabase(): boolean {
  return getDataSource() === 'supabase'
}

export const useAssessmentAttemptStore = create<AssessmentAttemptState>()(
  persist(
    (set, get) => ({
      attempts: [],
      lastWriteError: null,
      clearLastWriteError: () => set({ lastWriteError: null }),
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

        if (shouldPersistToSupabase()) {
          void import('@/integrations/supabase/mutations')
            .then(({ insertAttempt }) => insertAttempt(input))
            .then(() => set({ lastWriteError: null }))
            .catch((error: unknown) => set({ lastWriteError: toWriteError('recordAttempt', error) }))
        }

        const actorUserId = getActorUserId(input)
        useAuditLogStore.getState().recordEvent({
          event_type: 'quiz_attempted',
          actor_user_id: actorUserId,
          actor_name: getActorName(actorUserId),
          entity_type: 'quiz',
          entity_id: input.lesson_id,
          entity_label: getLessonLabel(input.lesson_id),
          metadata: { score_percent: input.score_percent, passed: input.passed },
        })

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
      resetAttempts: () => set({ attempts: [], lastWriteError: null }),
    }),
    {
      name: 'redex-assessment-attempts-v1',
      storage: createJSONStorage(() => getAssessmentAttemptStorage()),
    },
  ),
)
