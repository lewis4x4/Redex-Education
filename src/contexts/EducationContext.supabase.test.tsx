import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEMO_HR_BASICS_LESSONS } from '@/lib/education'

const upsertLessonProgressMock = vi.hoisted(() => vi.fn())
const insertAcknowledgmentMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/education/dataSource', () => ({ getDataSource: () => 'supabase' }))
vi.mock('@/integrations/supabase/mutations', () => ({
  upsertLessonProgress: upsertLessonProgressMock,
  insertAcknowledgment: insertAcknowledgmentMock,
}))

function wrapperFactory(EducationProvider: ({ children }: { children: ReactNode }) => ReactNode) {
  return function wrapper({ children }: { children: ReactNode }) {
    return <EducationProvider>{children}</EducationProvider>
  }
}

describe('EducationContext Supabase writes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    upsertLessonProgressMock.mockResolvedValue({})
    insertAcknowledgmentMock.mockResolvedValue({ acknowledged_at: 'now' })
    localStorage.setItem('redex-education-progress-v1', JSON.stringify({ lessonProgress: { stale: { status: 'completed', time_spent_seconds: 1 } } }))
  })

  it('does not hydrate localStorage as source of truth in supabase mode', async () => {
    const { EducationProvider } = await import('@/contexts/EducationContext')
    const { useEducation } = await import('@/hooks/useEducation')
    const { result } = renderHook(() => useEducation(), { wrapper: wrapperFactory(EducationProvider) })

    expect(result.current.getLessonStatus('stale')).toBe('not_started')
  })

  it('persists lesson progress to Supabase while keeping local cache writes', async () => {
    const { EducationProvider } = await import('@/contexts/EducationContext')
    const { useEducation } = await import('@/hooks/useEducation')
    const { result } = renderHook(() => useEducation(), { wrapper: wrapperFactory(EducationProvider) })

    act(() => {
      result.current.recordLessonProgress(DEMO_HR_BASICS_LESSONS[0]!.id, 'completed', 30)
    })

    await waitFor(() => {
      expect(upsertLessonProgressMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed', time_spent_seconds: 30 }))
    })
    expect(localStorage.getItem('redex-education-progress-v1')).toContain(DEMO_HR_BASICS_LESSONS[0]!.id)
  })

})
