import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())
const upsertMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())
const singleMock = vi.hoisted(() => vi.fn())
const mapTrainingCourseRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `course-${(row as { id: string }).id}` })))
const mapTrainingModuleRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `module-${(row as { id: string }).id}` })))
const mapTrainingLessonRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `lesson-${(row as { id: string }).id}` })))

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }))
vi.mock('@/integrations/supabase/db-rows', () => ({
  mapTrainingCourseRow: mapTrainingCourseRowMock,
  mapTrainingModuleRow: mapTrainingModuleRowMock,
  mapTrainingLessonRow: mapTrainingLessonRowMock,
}))

const course = {
  id: '11111111-1111-4111-8111-111111111111',
  org_id: 'org-redex',
  title: 'Course',
  slug: 'course',
  status: 'draft' as const,
  level: 'foundational',
  estimated_minutes: 10,
  learning_objectives: ['Know things'],
  created_at: '2026-05-23T00:00:00.000Z',
  updated_at: '2026-05-23T00:00:00.000Z',
}
const module = {
  id: '22222222-2222-4222-8222-222222222222',
  course_id: course.id,
  title: 'Module',
  order_index: 0,
  criticality: 'required' as const,
  estimated_minutes: 10,
}
const lesson = {
  id: '33333333-3333-4333-8333-333333333333',
  module_id: module.id,
  title: 'Lesson',
  lesson_type: 'text' as const,
  criticality: 'required' as const,
  order_index: 0,
  estimated_minutes: 5,
  content: { type: 'text' as const, body_markdown: 'Hi' },
}

function wireBuilder() {
  const builder = { upsert: upsertMock, select: selectMock, single: singleMock }
  fromMock.mockReturnValue(builder)
  upsertMock.mockReturnValue(builder)
  selectMock.mockReturnValue(builder)
}

describe('course mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wireBuilder()
  })

  it('upsertCourse upserts by id', async () => {
    singleMock.mockResolvedValueOnce({ data: { id: 'row' }, error: null })
    const { upsertCourse } = await import('./courses')

    await expect(upsertCourse(course)).resolves.toEqual({ id: 'course-row' })
    expect(fromMock).toHaveBeenCalledWith('training_courses')
    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ id: course.id, slug: 'course' }), { onConflict: 'id' })
    expect(mapTrainingCourseRowMock).toHaveBeenCalledWith({ id: 'row' })
  })

  it('upsertCourse throws descriptive errors', async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: new Error('course failed') })
    const { upsertCourse } = await import('./courses')

    await expect(upsertCourse(course)).rejects.toThrow('Failed to upsert course: course failed')
  })

  it('upsertModule upserts by id', async () => {
    singleMock.mockResolvedValueOnce({ data: { id: 'row' }, error: null })
    const { upsertModule } = await import('./courses')

    await expect(upsertModule(module)).resolves.toEqual({ id: 'module-row' })
    expect(fromMock).toHaveBeenCalledWith('training_modules')
    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ id: module.id, course_id: course.id }), { onConflict: 'id' })
  })

  it('upsertModule throws descriptive errors', async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: new Error('module failed') })
    const { upsertModule } = await import('./courses')

    await expect(upsertModule(module)).rejects.toThrow('Failed to upsert module: module failed')
  })

  it('upsertLesson preserves JSON content', async () => {
    singleMock.mockResolvedValueOnce({ data: { id: 'row' }, error: null })
    const { upsertLesson } = await import('./courses')

    await expect(upsertLesson(lesson)).resolves.toEqual({ id: 'lesson-row' })
    expect(fromMock).toHaveBeenCalledWith('training_lessons')
    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ content: lesson.content }), { onConflict: 'id' })
  })

  it('upsertLesson throws descriptive errors', async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: new Error('lesson failed') })
    const { upsertLesson } = await import('./courses')

    await expect(upsertLesson(lesson)).rejects.toThrow('Failed to upsert lesson: lesson failed')
  })
})
