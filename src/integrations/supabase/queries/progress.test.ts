import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())
const eqMock = vi.hoisted(() => vi.fn())
const orderMock = vi.hoisted(() => vi.fn())
const mapUserTrainingProgressRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `progress-${(row as { id: string }).id}` })))
const mapAssessmentAttemptRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `attempt-${(row as { id: string }).id}` })))
const mapUserTrainingEnrollmentRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `enrollment-${(row as { id: string }).id}` })))

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }))
vi.mock('@/integrations/supabase/db-rows', () => ({
  mapUserTrainingProgressRow: mapUserTrainingProgressRowMock,
  mapAssessmentAttemptRow: mapAssessmentAttemptRowMock,
  mapUserTrainingEnrollmentRow: mapUserTrainingEnrollmentRowMock,
}))

function wireBuilder() {
  const builder = { select: selectMock, eq: eqMock, order: orderMock }
  fromMock.mockReturnValue(builder)
  selectMock.mockReturnValue(builder)
  eqMock.mockReturnValue(builder)
}

describe('progress queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wireBuilder()
  })

  it('fetchProgressForUser maps progress rows', async () => {
    const rows = [{ id: '1' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchProgressForUser } = await import('./progress')

    await expect(fetchProgressForUser('user-1')).resolves.toEqual([{ id: 'progress-1' }])
    expect(fromMock).toHaveBeenCalledWith('user_training_progress')
    expect(eqMock).toHaveBeenCalledWith('user_id', 'user-1')
    expect(mapUserTrainingProgressRowMock.mock.calls[0]?.[0]).toBe(rows[0])
  })

  it('fetchProgressForUser throws Supabase errors', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: new Error('progress failed') })
    const { fetchProgressForUser } = await import('./progress')

    await expect(fetchProgressForUser('user-1')).rejects.toThrow('progress failed')
  })

  it('fetchAttemptsForLesson maps attempt rows', async () => {
    const rows = [{ id: '1' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchAttemptsForLesson } = await import('./progress')

    await expect(fetchAttemptsForLesson('lesson-1')).resolves.toEqual([{ id: 'attempt-1' }])
    expect(fromMock).toHaveBeenCalledWith('assessment_attempts')
    expect(eqMock).toHaveBeenCalledWith('lesson_id', 'lesson-1')
    expect(mapAssessmentAttemptRowMock.mock.calls[0]?.[0]).toBe(rows[0])
  })

  it('fetchAttemptsForLesson throws Supabase errors', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: new Error('attempts failed') })
    const { fetchAttemptsForLesson } = await import('./progress')

    await expect(fetchAttemptsForLesson('lesson-1')).rejects.toThrow('attempts failed')
  })

  it('fetchEnrollmentsForUser maps enrollment rows', async () => {
    const rows = [{ id: '1' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchEnrollmentsForUser } = await import('./progress')

    await expect(fetchEnrollmentsForUser('user-1')).resolves.toEqual([{ id: 'enrollment-1' }])
    expect(fromMock).toHaveBeenCalledWith('user_training_enrollments')
    expect(eqMock).toHaveBeenCalledWith('user_id', 'user-1')
    expect(mapUserTrainingEnrollmentRowMock.mock.calls[0]?.[0]).toBe(rows[0])
  })

  it('fetchEnrollmentsForUser throws Supabase errors', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: new Error('enrollments failed') })
    const { fetchEnrollmentsForUser } = await import('./progress')

    await expect(fetchEnrollmentsForUser('user-1')).rejects.toThrow('enrollments failed')
  })
})
