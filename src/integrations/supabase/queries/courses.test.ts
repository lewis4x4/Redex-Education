import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())
const eqMock = vi.hoisted(() => vi.fn())
const orderMock = vi.hoisted(() => vi.fn())
const maybeSingleMock = vi.hoisted(() => vi.fn())
const mapTrainingCourseRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `course-${(row as { id: string }).id}` })))
const mapTrainingModuleRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `module-${(row as { id: string }).id}` })))
const mapTrainingLessonRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `lesson-${(row as { id: string }).id}` })))

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }))
vi.mock('@/integrations/supabase/db-rows', () => ({
  mapTrainingCourseRow: mapTrainingCourseRowMock,
  mapTrainingModuleRow: mapTrainingModuleRowMock,
  mapTrainingLessonRow: mapTrainingLessonRowMock,
}))

function wireBuilder() {
  const builder = { select: selectMock, eq: eqMock, order: orderMock, maybeSingle: maybeSingleMock }
  fromMock.mockReturnValue(builder)
  selectMock.mockReturnValue(builder)
  eqMock.mockReturnValue(builder)
}

describe('courses queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wireBuilder()
  })

  it('fetchCourses maps published course rows', async () => {
    const rows = [{ id: '1' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchCourses } = await import('./courses')

    await expect(fetchCourses()).resolves.toEqual([{ id: 'course-1' }])
    expect(fromMock).toHaveBeenCalledWith('training_courses')
    expect(eqMock).toHaveBeenCalledWith('status', 'published')
    expect(mapTrainingCourseRowMock.mock.calls[0]?.[0]).toBe(rows[0])
  })

  it('fetchCourses throws Supabase errors', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: new Error('courses failed') })
    const { fetchCourses } = await import('./courses')

    await expect(fetchCourses()).rejects.toThrow('courses failed')
  })

  it('fetchCourseById maps a single course row', async () => {
    const row = { id: '1' }
    maybeSingleMock.mockResolvedValueOnce({ data: row, error: null })
    const { fetchCourseById } = await import('./courses')

    await expect(fetchCourseById('course-1')).resolves.toEqual({ id: 'course-1' })
    expect(eqMock).toHaveBeenCalledWith('id', 'course-1')
    expect(mapTrainingCourseRowMock).toHaveBeenCalledWith(row)
  })

  it('fetchCourseById throws Supabase errors', async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: new Error('course failed') })
    const { fetchCourseById } = await import('./courses')

    await expect(fetchCourseById('course-1')).rejects.toThrow('course failed')
  })

  it('fetchModulesForCourse maps ordered module rows', async () => {
    const rows = [{ id: '1' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchModulesForCourse } = await import('./courses')

    await expect(fetchModulesForCourse('course-1')).resolves.toEqual([{ id: 'module-1' }])
    expect(fromMock).toHaveBeenCalledWith('training_modules')
    expect(eqMock).toHaveBeenCalledWith('course_id', 'course-1')
    expect(orderMock).toHaveBeenCalledWith('order_index', { ascending: true })
  })

  it('fetchModulesForCourse throws Supabase errors', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: new Error('modules failed') })
    const { fetchModulesForCourse } = await import('./courses')

    await expect(fetchModulesForCourse('course-1')).rejects.toThrow('modules failed')
  })

  it('fetchLessonsForModule maps ordered lesson rows', async () => {
    const rows = [{ id: '1' }]
    orderMock.mockResolvedValueOnce({ data: rows, error: null })
    const { fetchLessonsForModule } = await import('./courses')

    await expect(fetchLessonsForModule('module-1')).resolves.toEqual([{ id: 'lesson-1' }])
    expect(fromMock).toHaveBeenCalledWith('training_lessons')
    expect(eqMock).toHaveBeenCalledWith('module_id', 'module-1')
    expect(mapTrainingLessonRowMock.mock.calls[0]?.[0]).toBe(rows[0])
  })

  it('fetchLessonsForModule throws Supabase errors', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: new Error('lessons failed') })
    const { fetchLessonsForModule } = await import('./courses')

    await expect(fetchLessonsForModule('module-1')).rejects.toThrow('lessons failed')
  })
})
