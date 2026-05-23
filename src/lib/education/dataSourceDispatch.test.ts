import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as assignmentHelpers from './assignments'
import * as courseHelpers from './courses'
import * as profileHelpers from './profiles'
import * as progressHelpers from './progress'
import * as sourceHelpers from './sources'
import { DEMO_HR_BASICS_COURSE, DEMO_ORIENTATION_COURSE } from './demo-data'
import { MOCK_HR_ONBOARDING_ASSIGNMENT, MOCK_LEARNER_MARCUS, MOCK_MANAGER_USER } from './index'

type SupabaseMock = ReturnType<typeof vi.fn>

const supabaseMocks = vi.hoisted(() => ({
  getProfileByUserId: vi.fn(async () => ({ id: 'supabase-user' })),
  getAllProfiles: vi.fn(async () => [{ id: 'supabase-user' }]),
  getDirectReports: vi.fn(async () => [{ id: 'supabase-report' }]),
  getCourses: vi.fn(async () => [{ id: 'supabase-course' }]),
  getCourseById: vi.fn(async () => ({ id: 'supabase-course' })),
  getModulesForCourse: vi.fn(async () => [{ id: 'supabase-module' }]),
  getLessonsForModule: vi.fn(async () => [{ id: 'supabase-lesson' }]),
  getAssignmentsForUser: vi.fn(async () => [{ id: 'supabase-assignment' }]),
  getAssignmentsForModule: vi.fn(async () => [{ id: 'supabase-assignment' }]),
  getProgressForUser: vi.fn(async () => [{ id: 'supabase-progress' }]),
  getEnrollmentsForUser: vi.fn(async () => [{ id: 'supabase-enrollment' }]),
  getAttemptsForLesson: vi.fn(async () => [{ id: 'supabase-attempt' }]),
  getSourceFiles: vi.fn(async () => [{ id: 'supabase-source-file' }]),
  getSourceFileVersions: vi.fn(async () => [{ id: 'supabase-source-version' }]),
  getSourceSections: vi.fn(async () => [{ id: 'supabase-source-section' }]),
  getModuleSourceBindings: vi.fn(async () => [{ id: 'supabase-binding' }]),
}))

vi.mock('./supabaseDataProvider', () => supabaseMocks)

const dispatchCases: Array<{
  name: string
  call: () => Promise<unknown>
  supabaseMock: SupabaseMock
  expectedSupabaseId: string
}> = [
  {
    name: 'getProfileByUserId',
    call: () => profileHelpers.getProfileByUserId(MOCK_LEARNER_MARCUS.id),
    supabaseMock: supabaseMocks.getProfileByUserId,
    expectedSupabaseId: 'supabase-user',
  },
  {
    name: 'getAllProfiles',
    call: () => profileHelpers.getAllProfiles(),
    supabaseMock: supabaseMocks.getAllProfiles,
    expectedSupabaseId: 'supabase-user',
  },
  {
    name: 'getDirectReports',
    call: () => profileHelpers.getDirectReports(MOCK_MANAGER_USER.id),
    supabaseMock: supabaseMocks.getDirectReports,
    expectedSupabaseId: 'supabase-report',
  },
  {
    name: 'getCourses',
    call: () => courseHelpers.getCourses(),
    supabaseMock: supabaseMocks.getCourses,
    expectedSupabaseId: 'supabase-course',
  },
  {
    name: 'getCourseById',
    call: () => courseHelpers.getCourseById(DEMO_ORIENTATION_COURSE.id),
    supabaseMock: supabaseMocks.getCourseById,
    expectedSupabaseId: 'supabase-course',
  },
  {
    name: 'getModulesForCourse',
    call: () => courseHelpers.getModulesForCourse(DEMO_HR_BASICS_COURSE.id),
    supabaseMock: supabaseMocks.getModulesForCourse,
    expectedSupabaseId: 'supabase-module',
  },
  {
    name: 'getLessonsForModule',
    call: () => courseHelpers.getLessonsForModule('hr-basics-mod-001'),
    supabaseMock: supabaseMocks.getLessonsForModule,
    expectedSupabaseId: 'supabase-lesson',
  },
  {
    name: 'getAssignmentsForUser',
    call: () => assignmentHelpers.getAssignmentsForUser(MOCK_LEARNER_MARCUS.id),
    supabaseMock: supabaseMocks.getAssignmentsForUser,
    expectedSupabaseId: 'supabase-assignment',
  },
  {
    name: 'getAssignmentsForModule',
    call: () => assignmentHelpers.getAssignmentsForModule(MOCK_HR_ONBOARDING_ASSIGNMENT.module_version_id),
    supabaseMock: supabaseMocks.getAssignmentsForModule,
    expectedSupabaseId: 'supabase-assignment',
  },
  {
    name: 'getProgressForUser',
    call: () => progressHelpers.getProgressForUser(MOCK_LEARNER_MARCUS.id),
    supabaseMock: supabaseMocks.getProgressForUser,
    expectedSupabaseId: 'supabase-progress',
  },
  {
    name: 'getEnrollmentsForUser',
    call: () => progressHelpers.getEnrollmentsForUser(MOCK_LEARNER_MARCUS.id),
    supabaseMock: supabaseMocks.getEnrollmentsForUser,
    expectedSupabaseId: 'supabase-enrollment',
  },
  {
    name: 'getAttemptsForLesson',
    call: () => progressHelpers.getAttemptsForLesson('lesson-values-quiz'),
    supabaseMock: supabaseMocks.getAttemptsForLesson,
    expectedSupabaseId: 'supabase-attempt',
  },
  {
    name: 'getSourceFiles',
    call: () => sourceHelpers.getSourceFiles(),
    supabaseMock: supabaseMocks.getSourceFiles,
    expectedSupabaseId: 'supabase-source-file',
  },
  {
    name: 'getSourceFileVersions',
    call: () => sourceHelpers.getSourceFileVersions('source-file-1'),
    supabaseMock: supabaseMocks.getSourceFileVersions,
    expectedSupabaseId: 'supabase-source-version',
  },
  {
    name: 'getSourceSections',
    call: () => sourceHelpers.getSourceSections('source-version-1'),
    supabaseMock: supabaseMocks.getSourceSections,
    expectedSupabaseId: 'supabase-source-section',
  },
  {
    name: 'getModuleSourceBindings',
    call: () => sourceHelpers.getModuleSourceBindings('module-version-hr-basics-v1'),
    supabaseMock: supabaseMocks.getModuleSourceBindings,
    expectedSupabaseId: 'supabase-binding',
  },
]

function firstId(value: unknown): string | undefined {
  if (Array.isArray(value)) return (value[0] as { id?: string } | undefined)?.id
  return (value as { id?: string } | null)?.id
}

describe('education data-source dispatch helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it.each(dispatchCases)('$name routes to Supabase when VITE_DATA_SOURCE=supabase', async ({ call, supabaseMock, expectedSupabaseId }) => {
    vi.stubEnv('VITE_DATA_SOURCE', 'supabase')

    const result = await call()

    expect(supabaseMock).toHaveBeenCalledTimes(1)
    expect(firstId(result)).toBe(expectedSupabaseId)
  })

  it.each(dispatchCases)('$name routes to mock data by default', async ({ call, supabaseMock }) => {
    vi.stubEnv('VITE_DATA_SOURCE', 'mock')

    await expect(call()).resolves.toBeDefined()
    expect(supabaseMock).not.toHaveBeenCalled()
  })
})
