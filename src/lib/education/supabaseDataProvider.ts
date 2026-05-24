import type {
  AdminDashboardSummary,
  AssessmentAttempt,
  Assignment,
  Course,
  Enrollment,
  Lesson,
  LessonProgress,
  Module,
  ModuleSourceBinding,
  ModuleVersion,
  SourceFile,
  SourceFileVersion,
  SourceSection,
  User,
} from '@/types/training'

export async function getProfileByUserId(userId: string): Promise<User | null> {
  const { fetchProfileByUserId } = await import('@/integrations/supabase/queries/profiles')
  return fetchProfileByUserId(userId)
}

export async function getAllProfiles(): Promise<User[]> {
  const { fetchAllProfiles } = await import('@/integrations/supabase/queries/profiles')
  return fetchAllProfiles()
}

export async function getDirectReports(managerId: string): Promise<User[]> {
  const { fetchProfilesByManagerId } = await import('@/integrations/supabase/queries/profiles')
  return fetchProfilesByManagerId(managerId)
}

export async function getCourses(): Promise<Course[]> {
  const { fetchCourses } = await import('@/integrations/supabase/queries/courses')
  return fetchCourses()
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  const { fetchCourseById } = await import('@/integrations/supabase/queries/courses')
  return fetchCourseById(courseId)
}

export async function getModulesForCourse(courseId: string): Promise<Module[]> {
  const { fetchModulesForCourse } = await import('@/integrations/supabase/queries/courses')
  return fetchModulesForCourse(courseId)
}

export async function getLessonsForModule(moduleId: string): Promise<Lesson[]> {
  const { fetchLessonsForModule } = await import('@/integrations/supabase/queries/courses')
  return fetchLessonsForModule(moduleId)
}

export async function getAssignmentsForUser(userId: string): Promise<Assignment[]> {
  const { fetchAssignmentsForUser } = await import('@/integrations/supabase/queries/assignments')
  return fetchAssignmentsForUser(userId)
}

export async function getAssignmentsForModule(moduleVersionId: string): Promise<Assignment[]> {
  const { fetchAssignmentsForModule } = await import('@/integrations/supabase/queries/assignments')
  return fetchAssignmentsForModule(moduleVersionId)
}

export async function getProgressForUser(userId: string): Promise<LessonProgress[]> {
  const { fetchProgressForUser } = await import('@/integrations/supabase/queries/progress')
  return fetchProgressForUser(userId)
}

export async function getEnrollmentsForUser(userId: string): Promise<Enrollment[]> {
  const { fetchEnrollmentsForUser } = await import('@/integrations/supabase/queries/progress')
  return fetchEnrollmentsForUser(userId)
}

export async function getAttemptsForLesson(lessonId: string): Promise<AssessmentAttempt[]> {
  const { fetchAttemptsForLesson } = await import('@/integrations/supabase/queries/progress')
  return fetchAttemptsForLesson(lessonId)
}

export async function getSourceFiles(): Promise<SourceFile[]> {
  const { fetchSourceFiles } = await import('@/integrations/supabase/queries/source_library')
  return fetchSourceFiles()
}

export async function getSourceFileVersions(sourceFileId: string): Promise<SourceFileVersion[]> {
  const { fetchSourceFileVersions } = await import('@/integrations/supabase/queries/source_library')
  return fetchSourceFileVersions(sourceFileId)
}

export async function getSourceSections(sourceFileVersionId: string): Promise<SourceSection[]> {
  const { fetchSourceSections } = await import('@/integrations/supabase/queries/source_library')
  return fetchSourceSections(sourceFileVersionId)
}

export async function getModuleSourceBindings(moduleVersionId: string): Promise<ModuleSourceBinding[]> {
  const { fetchModuleSourceBindings } = await import('@/integrations/supabase/queries/source_library')
  return fetchModuleSourceBindings(moduleVersionId)
}

export async function getModuleVersionHistory(moduleId: string): Promise<ModuleVersion[]> {
  const { fetchModuleVersionHistory } = await import('@/integrations/supabase/queries/moduleVersions')
  return fetchModuleVersionHistory(moduleId)
}

export async function upsertModuleDraft(input: {
  module_id?: string
  module_title: string
  current_stage: import('@/types/training').FoundryDraftStage
  actor?: { user_id: string; display_name: string }
}): Promise<ModuleVersion> {
  const { upsertModuleDraft: upsertSupabaseModuleDraft } = await import('@/integrations/supabase/mutations/foundry')
  return upsertSupabaseModuleDraft(input)
}

export async function archiveModuleVersion(versionId: string): Promise<ModuleVersion> {
  const { archiveModuleVersion: archiveSupabaseModuleVersion } = await import('@/integrations/supabase/mutations/foundry')
  return archiveSupabaseModuleVersion(versionId)
}

export async function forkModuleVersion(sourceVersionId: string): Promise<ModuleVersion> {
  const { forkModuleVersion: forkSupabaseModuleVersion } = await import('@/integrations/supabase/mutations/foundry')
  return forkSupabaseModuleVersion(sourceVersionId)
}

export async function getAdminSummary(): Promise<AdminDashboardSummary> {
  const { fetchAdminSummary } = await import('@/integrations/supabase/queries/admin')
  return fetchAdminSummary()
}
