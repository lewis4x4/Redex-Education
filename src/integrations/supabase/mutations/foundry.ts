import { supabase } from '@/integrations/supabase/client'
import {
  mapModuleVersionRow,
  mapSourceFileRow,
  mapTrainingCourseRow,
  mapTrainingLessonRow,
  mapTrainingModuleRow,
} from '@/integrations/supabase/db-rows'
import type { Json } from '@/integrations/supabase/types'
import type {
  Course,
  CourseOutlineDraft,
  FoundryDraftStage,
  Lesson,
  Module,
  ModuleVersion,
  SetupAnswers,
  SourceFile,
  SourceMaterial,
  UUID,
} from '@/types/training'
import type { ModuleBasicsDraft } from '@/features/foundry/types'
import { normalizeClientUUID, safeRetry, stableClientUUID } from './_idempotency'
import { requireMutationData, throwOnMutationError } from './_response'

const DEFAULT_ORG_ID = 'org-redex'

export interface UpsertModuleDraftInput {
  module_id?: UUID
  module_title: string
  current_stage: FoundryDraftStage
  actor?: { user_id: UUID; display_name: string }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled-module'
}

function courseIdForDraft(draft: ModuleBasicsDraft): UUID {
  return normalizeClientUUID(draft.parent_course_id === 'standalone' ? slugify(draft.title) : draft.parent_course_id, 'training_courses')
}

function mimeTypeForSource(material: SourceMaterial): string {
  switch (material.type) {
    case 'pdf':
      return 'application/pdf'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'notion':
    case 'web_url':
      return 'text/uri-list'
    case 'markdown':
    default:
      return 'text/markdown'
  }
}

export async function createModuleDraft(draft: ModuleBasicsDraft): Promise<Course> {
  const courseId = courseIdForDraft(draft)
  const slug = slugify(draft.title)
  const now = new Date().toISOString()

  const result = await safeRetry(() =>
    supabase
      .from('training_courses')
      .upsert(
        {
          id: courseId,
          org_id: normalizeClientUUID(DEFAULT_ORG_ID, 'orgs'),
          title: draft.title,
          slug,
          description: `Audience: ${draft.audience}`,
          status: 'draft',
          level: 'foundational',
          estimated_minutes: draft.estimated_minutes,
          learning_objectives: [] as Json,
          updated_at: now,
        },
        { onConflict: 'slug' },
      )
      .select('*')
      .single(),
  )

  throwOnMutationError('create module draft', result.error)
  return mapTrainingCourseRow(requireMutationData('create module draft', result.data))
}

export async function saveSourceMaterial(input: { course_id: UUID; material: SourceMaterial }): Promise<SourceFile> {
  void input.course_id

  const result = await safeRetry(() =>
    supabase
      .from('source_files')
      .upsert(
        {
          id: normalizeClientUUID(input.material.id, 'source_files'),
          drive_file_id: input.material.id,
          title: input.material.title,
          mime_type: mimeTypeForSource(input.material),
          authority: 'context',
          authority_source: 'default',
          processing_status: input.material.processing_status === 'processed' ? 'processed' : input.material.processing_status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select('*')
      .single(),
  )

  throwOnMutationError('save source material', result.error)
  return mapSourceFileRow(requireMutationData('save source material', result.data))
}

export async function saveSetupAnswers(input: { course_id: UUID; answers: SetupAnswers }): Promise<void> {
  void input
  // Schema gap verified in Slice 8.4: training_courses has no metadata or
  // setup_answers JSONB column, and module_versions.metadata does not exist.
  // Keep this as a documented no-op until Slice 8.5/8.6 adds a persistence
  // target; callers still get the same async/error surface as other mutations.
}

export async function saveGeneratedOutline(input: { course_id: UUID; outline: CourseOutlineDraft }): Promise<Module[]> {
  const modules = input.outline.modules.map((module, index) => ({
    id: stableClientUUID(`training_modules:${input.course_id}:${index}:${module.title}`),
    course_id: normalizeClientUUID(input.course_id, 'training_courses'),
    title: module.title,
    order_index: index,
    criticality: 'required',
    estimated_minutes: module.lessons.reduce((total, lesson) => total + lesson.estimated_minutes, 0),
    unlock_rule: null,
  }))

  const result = await safeRetry(() =>
    supabase
      .from('training_modules')
      .upsert(modules, { onConflict: 'id' })
      .select('*'),
  )

  throwOnMutationError('save generated outline', result.error)
  return (result.data ?? []).map(mapTrainingModuleRow)
}

export async function saveGeneratedLessons(input: { module_id: UUID; lessons: Lesson[] }): Promise<Lesson[]> {
  const rows = input.lessons.map((lesson) => ({
    id: normalizeClientUUID(lesson.id, 'training_lessons'),
    module_id: normalizeClientUUID(input.module_id, 'training_modules'),
    title: lesson.title,
    lesson_type: lesson.lesson_type,
    criticality: lesson.criticality,
    order_index: lesson.order_index,
    estimated_minutes: lesson.estimated_minutes,
    content: lesson.content as unknown as Json,
    resources: (lesson.resources ?? null) as Json | null,
  }))

  const result = await safeRetry(() =>
    supabase
      .from('training_lessons')
      .upsert(rows, { onConflict: 'id' })
      .select('*'),
  )

  throwOnMutationError('save generated lessons', result.error)
  return (result.data ?? []).map(mapTrainingLessonRow)
}

export async function publishModuleVersion(input: {
  course_id: UUID
  module_id: UUID
  approved_by: UUID
}): Promise<ModuleVersion> {
  void input.course_id
  const moduleId = normalizeClientUUID(input.module_id, 'training_modules')
  const versionNumber = 1

  const moduleResult = await safeRetry(() =>
    supabase
      .from('training_modules')
      .select('title')
      .eq('id', moduleId)
      .single(),
  )

  throwOnMutationError('load module for publish', moduleResult.error)
  const moduleTitle = requireMutationData('load module for publish', moduleResult.data).title
  const publishedAt = new Date().toISOString()

  const result = await safeRetry(() =>
    supabase
      .from('module_versions')
      .upsert(
        {
          id: stableClientUUID(`module_versions:${moduleId}:${versionNumber}`),
          module_id: moduleId,
          module_title: moduleTitle,
          version_number: versionNumber,
          status: 'published',
          approval_state: 'published',
          approved_by: normalizeClientUUID(input.approved_by, 'profiles'),
          published_by: normalizeClientUUID(input.approved_by, 'profiles'),
          published_at: publishedAt,
          updated_at: publishedAt,
        },
        { onConflict: 'module_id,version_number' },
      )
      .select('*')
      .single(),
  )

  throwOnMutationError('publish module version', result.error)
  return mapModuleVersionRow(requireMutationData('publish module version', result.data))
}

export async function upsertModuleDraft(input: UpsertModuleDraftInput): Promise<ModuleVersion> {
  const moduleId = input.module_id ?? stableClientUUID(`module-draft:${input.module_title}`)
  const now = new Date().toISOString()
  const draftMetadata = {
    current_stage: input.current_stage,
    ...(input.actor ? { last_actor: input.actor } : {}),
  } as Json

  const existingResult = await safeRetry(() =>
    supabase
      .from('module_versions')
      .select('*')
      .eq('module_id', moduleId)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  )

  throwOnMutationError('load module draft', existingResult.error)
  const existingRow = existingResult.data

  if (existingRow) {
    const updateResult = await safeRetry(() =>
      supabase
        .from('module_versions')
        .update({
          module_title: input.module_title,
          draft_metadata: draftMetadata,
          updated_at: now,
        })
        .eq('id', existingRow.id)
        .select('*')
        .single(),
    )

    throwOnMutationError('update module draft', updateResult.error)
    return mapModuleVersionRow(requireMutationData('update module draft', updateResult.data))
  }

  const insertResult = await safeRetry(() =>
    supabase
      .from('module_versions')
      .insert({
        module_id: moduleId,
        module_title: input.module_title,
        version_number: 1,
        status: 'draft',
        draft_metadata: draftMetadata,
        updated_at: now,
      })
      .select('*')
      .single(),
  )

  throwOnMutationError('create module draft row', insertResult.error)
  return mapModuleVersionRow(requireMutationData('create module draft row', insertResult.data))
}

export async function archiveModuleVersion(versionId: UUID): Promise<ModuleVersion> {
  const result = await safeRetry(() =>
    supabase
      .from('module_versions')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', versionId)
      .select('*')
      .single(),
  )

  throwOnMutationError('archive module version', result.error)
  return mapModuleVersionRow(requireMutationData('archive module version', result.data))
}

export async function forkModuleVersion(sourceVersionId: UUID): Promise<ModuleVersion> {
  const sourceResult = await safeRetry(() =>
    supabase
      .from('module_versions')
      .select('*')
      .eq('id', sourceVersionId)
      .single(),
  )

  throwOnMutationError('load module version for fork', sourceResult.error)
  const source = requireMutationData('load module version for fork', sourceResult.data)

  const maxVersionResult = await safeRetry(() =>
    supabase
      .from('module_versions')
      .select('version_number')
      .eq('module_id', source.module_id)
      .order('version_number', { ascending: false })
      .limit(1),
  )

  throwOnMutationError('load latest module version for fork', maxVersionResult.error)
  const maxVersionNumber = (maxVersionResult.data ?? [])[0]?.version_number ?? source.version_number ?? 0
  const now = new Date().toISOString()

  const result = await safeRetry(() =>
    supabase
      .from('module_versions')
      .insert({
        module_id: source.module_id,
        module_title: source.module_title,
        version_number: maxVersionNumber + 1,
        status: 'draft',
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single(),
  )

  throwOnMutationError('fork module version', result.error)
  return mapModuleVersionRow(requireMutationData('fork module version', result.data))
}
