import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEMO_HR_BASICS_LESSONS } from '@/lib/education'

const upsertLessonProgressMock = vi.hoisted(() => vi.fn())
const insertAcknowledgmentMock = vi.hoisted(() => vi.fn())
const getEnrollmentsForUserMock = vi.hoisted(() => vi.fn())
const getProgressForUserMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/education/dataSource', () => ({ getDataSource: () => 'supabase' }))
vi.mock('@/integrations/supabase/mutations', () => ({
  upsertLessonProgress: upsertLessonProgressMock,
  insertAcknowledgment: insertAcknowledgmentMock,
}))
vi.mock('@/lib/education/supabaseDataProvider', () => ({
  getEnrollmentsForUser: getEnrollmentsForUserMock,
  getProgressForUser: getProgressForUserMock,
}))

function wrapperFactory(EducationProvider: ({ children, userId }: { children: ReactNode; userId?: string | null }) => ReactNode) {
  return function wrapper({ children }: { children: ReactNode }) {
    return <EducationProvider userId="user-real">{children}</EducationProvider>
  }
}

describe('EducationContext Supabase writes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    upsertLessonProgressMock.mockResolvedValue({})
    insertAcknowledgmentMock.mockResolvedValue({ acknowledged_at: 'now' })
    getEnrollmentsForUserMock.mockResolvedValue([
      {
        id: 'real-enrollment-hr-basics',
        user_id: 'user-real',
        course_id: 'course-hr-basics-001',
        status: 'active',
        started_at: '2026-05-23T00:00:00.000Z',
        progress_percentage: 0,
      },
    ])
    getProgressForUserMock.mockResolvedValue([])
    localStorage.setItem('redex-education-progress-v1', JSON.stringify({ lessonProgress: { stale: { status: 'completed', time_spent_seconds: 1 } } }))
  })

  it('does not hydrate localStorage as source of truth in supabase mode', async () => {
    const { EducationProvider } = await import('@/contexts/EducationContext')
    const { useEducation } = await import('@/hooks/useEducation')
    const { result } = renderHook(() => useEducation(), { wrapper: wrapperFactory(EducationProvider) })

    await waitFor(() => expect(result.current.currentEnrollment?.id).toBe('real-enrollment-hr-basics'))
    expect(result.current.getLessonStatus('stale')).toBe('not_started')
  })

  it('persists lesson progress to Supabase with the signed-in user enrollment', async () => {
    const { EducationProvider } = await import('@/contexts/EducationContext')
    const { useEducation } = await import('@/hooks/useEducation')
    const { result } = renderHook(() => useEducation(), { wrapper: wrapperFactory(EducationProvider) })

    await waitFor(() => expect(result.current.currentEnrollment?.id).toBe('real-enrollment-hr-basics'))

    act(() => {
      result.current.recordLessonProgress(DEMO_HR_BASICS_LESSONS[0]!.id, 'completed', 30)
    })

    await waitFor(() => {
      expect(upsertLessonProgressMock).toHaveBeenCalledWith(
        expect.objectContaining({
          enrollment_id: 'real-enrollment-hr-basics',
          user_id: 'user-real',
          status: 'completed',
          time_spent_seconds: 30,
        }),
      )
    })
    expect(getEnrollmentsForUserMock).toHaveBeenCalledWith('user-real')
  })

})
