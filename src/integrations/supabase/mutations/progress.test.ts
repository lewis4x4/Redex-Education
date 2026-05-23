import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())
const upsertMock = vi.hoisted(() => vi.fn())
const insertMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())
const singleMock = vi.hoisted(() => vi.fn())
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
  const builder = { upsert: upsertMock, insert: insertMock, select: selectMock, single: singleMock }
  fromMock.mockReturnValue(builder)
  upsertMock.mockReturnValue(builder)
  insertMock.mockReturnValue(builder)
  selectMock.mockReturnValue(builder)
}

describe('progress mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wireBuilder()
  })

  it('upsertLessonProgress upserts on enrollment and lesson', async () => {
    singleMock.mockResolvedValueOnce({ data: { id: 'row' }, error: null })
    const { upsertLessonProgress } = await import('./progress')

    await expect(upsertLessonProgress({ enrollment_id: 'enroll-1', lesson_id: 'lesson-1', user_id: 'user-1', status: 'completed', time_spent_seconds: 60 })).resolves.toEqual({ id: 'progress-row' })
    expect(fromMock).toHaveBeenCalledWith('user_training_progress')
    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }), { onConflict: 'enrollment_id,lesson_id' })
  })

  it('upsertLessonProgress throws descriptive errors', async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: new Error('progress failed') })
    const { upsertLessonProgress } = await import('./progress')

    await expect(upsertLessonProgress({ enrollment_id: 'enroll-1', lesson_id: 'lesson-1', user_id: 'user-1', status: 'completed', time_spent_seconds: 60 })).rejects.toThrow('Failed to upsert lesson progress: progress failed')
  })

  it('insertAttempt inserts append-only attempts with answers', async () => {
    singleMock.mockResolvedValueOnce({ data: { id: 'row' }, error: null })
    const { insertAttempt } = await import('./progress')

    await expect(insertAttempt({ enrollment_id: 'enroll-1', lesson_id: 'lesson-1', score_percent: 90, passed: true, answers: { q1: 1 } })).resolves.toEqual({ id: 'attempt-row' })
    expect(fromMock).toHaveBeenCalledWith('assessment_attempts')
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ score_percent: 90, answers: { q1: 1 } }))
  })

  it('insertAttempt throws descriptive errors', async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: new Error('attempt failed') })
    const { insertAttempt } = await import('./progress')

    await expect(insertAttempt({ enrollment_id: 'enroll-1', lesson_id: 'lesson-1', score_percent: 90, passed: true, answers: { q1: 1 } })).rejects.toThrow('Failed to insert assessment attempt: attempt failed')
  })

  it('insertAcknowledgment upserts by enrollment and lesson', async () => {
    singleMock.mockResolvedValueOnce({ data: { acknowledged_at: 'now' }, error: null })
    const { insertAcknowledgment } = await import('./progress')

    await expect(insertAcknowledgment({ enrollment_id: 'enroll-1', lesson_id: 'lesson-1', statement_text: 'I agree' })).resolves.toEqual({ acknowledged_at: 'now' })
    expect(fromMock).toHaveBeenCalledWith('acknowledgments')
    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ statement_text: 'I agree' }), { onConflict: 'enrollment_id,lesson_id' })
    expect(selectMock).toHaveBeenCalledWith('acknowledged_at')
  })

  it('insertAcknowledgment throws descriptive errors', async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: new Error('ack failed') })
    const { insertAcknowledgment } = await import('./progress')

    await expect(insertAcknowledgment({ enrollment_id: 'enroll-1', lesson_id: 'lesson-1', statement_text: 'I agree' })).rejects.toThrow('Failed to insert acknowledgment: ack failed')
  })

  it('upsertEnrollment upserts by user and course', async () => {
    singleMock.mockResolvedValueOnce({ data: { id: 'row' }, error: null })
    const { upsertEnrollment } = await import('./progress')

    await expect(upsertEnrollment({ user_id: 'user-1', course_id: 'course-1', status: 'active' })).resolves.toEqual({ id: 'enrollment-row' })
    expect(fromMock).toHaveBeenCalledWith('user_training_enrollments')
    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }), { onConflict: 'user_id,course_id' })
  })

  it('upsertEnrollment throws descriptive errors', async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: new Error('enrollment failed') })
    const { upsertEnrollment } = await import('./progress')

    await expect(upsertEnrollment({ user_id: 'user-1', course_id: 'course-1', status: 'active' })).rejects.toThrow('Failed to upsert enrollment: enrollment failed')
  })
})
