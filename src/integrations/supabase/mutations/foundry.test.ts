import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())
const upsertMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())
const singleMock = vi.hoisted(() => vi.fn())
const eqMock = vi.hoisted(() => vi.fn())
const mapTrainingCourseRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `course-${(row as { id: string }).id}` })))
const mapTrainingModuleRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `module-${(row as { id: string }).id}` })))
const mapTrainingLessonRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `lesson-${(row as { id: string }).id}` })))
const mapSourceFileRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `source-${(row as { id: string }).id}` })))
const mapModuleVersionRowMock = vi.hoisted(() => vi.fn((row: unknown) => ({ id: `version-${(row as { id: string }).id}` })))

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }))
vi.mock('@/integrations/supabase/db-rows', () => ({
  mapTrainingCourseRow: mapTrainingCourseRowMock,
  mapTrainingModuleRow: mapTrainingModuleRowMock,
  mapTrainingLessonRow: mapTrainingLessonRowMock,
  mapSourceFileRow: mapSourceFileRowMock,
  mapModuleVersionRow: mapModuleVersionRowMock,
}))

function wireBuilder() {
  const builder = { upsert: upsertMock, select: selectMock, single: singleMock, eq: eqMock }
  fromMock.mockReturnValue(builder)
  upsertMock.mockReturnValue(builder)
  selectMock.mockReturnValue(builder)
  eqMock.mockReturnValue(builder)
}

const draft = {
  title: 'Safety Basics',
  parent_course_id: 'standalone',
  audience: 'New hires',
  criticality: 'required' as const,
  training_type: 'safety' as const,
  estimated_minutes: 20,
  updated_at: '2026-05-23T00:00:00.000Z',
}
const material = { id: 'source-1', title: 'Policy', type: 'markdown' as const, raw_text: '# Policy', processing_status: 'processed' as const, sections: [] }
const outline = { course_title: 'Safety Basics', description: 'Desc', learning_objectives: ['Safe'], modules: [{ title: 'Intro', lessons: [{ title: 'Read', lesson_type: 'text' as const, estimated_minutes: 5 }] }] }
const lesson = { id: 'lesson-1', module_id: 'module-1', title: 'Read', lesson_type: 'text' as const, criticality: 'required' as const, order_index: 0, estimated_minutes: 5, content: { type: 'text' as const, body_markdown: 'Read' } }

describe('foundry mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wireBuilder()
  })

  it('createModuleDraft upserts a draft training course by slug', async () => {
    singleMock.mockResolvedValueOnce({ data: { id: 'row' }, error: null })
    const { createModuleDraft } = await import('./foundry')

    await expect(createModuleDraft(draft)).resolves.toEqual({ id: 'course-row' })
    expect(fromMock).toHaveBeenCalledWith('training_courses')
    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Safety Basics', status: 'draft', slug: 'safety-basics' }), { onConflict: 'slug' })
  })

  it('createModuleDraft throws descriptive errors', async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: new Error('draft failed') })
    const { createModuleDraft } = await import('./foundry')

    await expect(createModuleDraft(draft)).rejects.toThrow('Failed to create module draft: draft failed')
  })

  it('saveSourceMaterial upserts source_files rows', async () => {
    singleMock.mockResolvedValueOnce({ data: { id: 'row' }, error: null })
    const { saveSourceMaterial } = await import('./foundry')

    await expect(saveSourceMaterial({ course_id: 'course-1', material })).resolves.toEqual({ id: 'source-row' })
    expect(fromMock).toHaveBeenCalledWith('source_files')
    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ drive_file_id: 'source-1', mime_type: 'text/markdown' }), { onConflict: 'id' })
  })

  it('saveSourceMaterial throws descriptive errors', async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: new Error('source failed') })
    const { saveSourceMaterial } = await import('./foundry')

    await expect(saveSourceMaterial({ course_id: 'course-1', material })).rejects.toThrow('Failed to save source material: source failed')
  })

  it('saveSetupAnswers is a documented no-op while schema lacks metadata', async () => {
    const { saveSetupAnswers } = await import('./foundry')

    await expect(saveSetupAnswers({ course_id: 'course-1', answers: { criticality: 'informational', assessment_style: 'no_assessment', audience_notes: 'All', experience_notes: '', estimated_minutes: 10, source_control: 'strict', requires_admin_approval: false, requires_safety_review: false, updated_at: 'now' } })).resolves.toBeUndefined()
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('saveGeneratedOutline upserts modules', async () => {
    selectMock.mockResolvedValueOnce({ data: [{ id: 'row' }], error: null })
    const { saveGeneratedOutline } = await import('./foundry')

    await expect(saveGeneratedOutline({ course_id: 'course-1', outline })).resolves.toEqual([{ id: 'module-row' }])
    expect(fromMock).toHaveBeenCalledWith('training_modules')
    expect(upsertMock).toHaveBeenCalledWith([expect.objectContaining({ title: 'Intro', order_index: 0 })], { onConflict: 'id' })
  })

  it('saveGeneratedOutline throws descriptive errors', async () => {
    selectMock.mockResolvedValueOnce({ data: null, error: new Error('outline failed') })
    const { saveGeneratedOutline } = await import('./foundry')

    await expect(saveGeneratedOutline({ course_id: 'course-1', outline })).rejects.toThrow('Failed to save generated outline: outline failed')
  })

  it('saveGeneratedLessons bulk upserts lessons', async () => {
    selectMock.mockResolvedValueOnce({ data: [{ id: 'row' }], error: null })
    const { saveGeneratedLessons } = await import('./foundry')

    await expect(saveGeneratedLessons({ module_id: 'module-1', lessons: [lesson] })).resolves.toEqual([{ id: 'lesson-row' }])
    expect(fromMock).toHaveBeenCalledWith('training_lessons')
    expect(upsertMock).toHaveBeenCalledWith([expect.objectContaining({ title: 'Read', content: lesson.content })], { onConflict: 'id' })
  })

  it('saveGeneratedLessons throws descriptive errors', async () => {
    selectMock.mockResolvedValueOnce({ data: null, error: new Error('lessons failed') })
    const { saveGeneratedLessons } = await import('./foundry')

    await expect(saveGeneratedLessons({ module_id: 'module-1', lessons: [lesson] })).rejects.toThrow('Failed to save generated lessons: lessons failed')
  })

  it('publishModuleVersion loads module title and upserts module_versions', async () => {
    singleMock
      .mockResolvedValueOnce({ data: { title: 'Intro' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'row' }, error: null })
    const { publishModuleVersion } = await import('./foundry')

    await expect(publishModuleVersion({ course_id: 'course-1', module_id: 'module-1', approved_by: 'user-admin' })).resolves.toEqual({ id: 'version-row' })
    expect(fromMock).toHaveBeenCalledWith('module_versions')
    expect(upsertMock).toHaveBeenLastCalledWith(expect.objectContaining({ module_title: 'Intro', status: 'published', approval_state: 'published' }), { onConflict: 'module_id,version_number' })
  })

  it('publishModuleVersion throws when module lookup fails', async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: new Error('module missing') })
    const { publishModuleVersion } = await import('./foundry')

    await expect(publishModuleVersion({ course_id: 'course-1', module_id: 'module-1', approved_by: 'user-admin' })).rejects.toThrow('Failed to load module for publish: module missing')
  })

  it('publishModuleVersion throws when publish upsert fails', async () => {
    singleMock
      .mockResolvedValueOnce({ data: { title: 'Intro' }, error: null })
      .mockResolvedValueOnce({ data: null, error: new Error('publish failed') })
    const { publishModuleVersion } = await import('./foundry')

    await expect(publishModuleVersion({ course_id: 'course-1', module_id: 'module-1', approved_by: 'user-admin' })).rejects.toThrow('Failed to publish module version: publish failed')
  })
})
