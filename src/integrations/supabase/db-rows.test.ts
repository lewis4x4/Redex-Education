import { describe, expect, it } from 'vitest'

import {
  mapAssessmentAttemptRow,
  mapAssignmentRow,
  mapModuleSourceBindingRow,
  mapProfileRow,
  mapSourceFileRow,
  mapSourceFileVersionRow,
  mapSourceSectionRow,
  mapTrainingCourseRow,
  mapTrainingLessonRow,
  mapTrainingModuleRow,
  mapUserTrainingEnrollmentRow,
  mapUserTrainingProgressRow,
} from './db-rows'
import type {
  AssessmentAttemptRow,
  AssignmentRow,
  MediaAssetRow,
  ModuleSourceBindingRow,
  ProfileRow,
  SourceFileRow,
  SourceFileVersionRow,
  SourceSectionRow,
  TrainingCourseRow,
  TrainingLessonRow,
  TrainingModuleRow,
  UserTrainingEnrollmentRow,
  UserTrainingProgressRow,
} from './db-rows'

const ISO = '2026-05-23T00:00:00.000Z'

const profileRow: ProfileRow = {
  id: '11111111-1111-1111-1111-111111111111',
  org_id: '22222222-2222-2222-2222-222222222222',
  email: 'learner@redex.example',
  display_name: 'Learner One',
  role: 'learner',
  department: null,
  manager_id: null,
  start_date: null,
  created_at: ISO,
  updated_at: ISO,
}

const courseRow: TrainingCourseRow = {
  id: 'course-1',
  org_id: 'org-1',
  title: 'Course One',
  slug: 'course-one',
  description: null,
  status: 'published',
  level: 'foundational',
  estimated_minutes: 30,
  learning_objectives: ['Learn safely'],
  created_at: ISO,
  updated_at: ISO,
}

const moduleRow: TrainingModuleRow = {
  id: 'module-1',
  course_id: 'course-1',
  title: 'Module One',
  order_index: 0,
  criticality: 'required',
  estimated_minutes: 10,
  unlock_rule: null,
  created_at: ISO,
  updated_at: ISO,
}

const lessonRow: TrainingLessonRow = {
  id: 'lesson-1',
  module_id: 'module-1',
  title: 'Lesson One',
  lesson_type: 'text',
  criticality: 'required',
  order_index: 0,
  estimated_minutes: 5,
  content: { type: 'text', body_markdown: 'Read this.' },
  resources: null,
  created_at: ISO,
  updated_at: ISO,
}

const enrollmentRow: UserTrainingEnrollmentRow = {
  id: 'enrollment-1',
  user_id: 'user-1',
  course_id: 'course-1',
  status: 'active',
  started_at: ISO,
  completed_at: null,
  progress_percentage: 25,
  created_at: ISO,
  updated_at: ISO,
}

const progressRow: UserTrainingProgressRow = {
  id: 'progress-1',
  enrollment_id: 'enrollment-1',
  lesson_id: 'lesson-1',
  user_id: 'user-1',
  status: 'completed',
  time_spent_seconds: 120,
  completed_at: ISO,
  acknowledgment_id: null,
  created_at: ISO,
  updated_at: ISO,
}

const assignmentRow: AssignmentRow = {
  id: 'assignment-1',
  module_version_id: 'module-version-1',
  assignee_user_id: 'user-1',
  assignee_role: null,
  assigned_by: 'admin-1',
  assigned_at: ISO,
  due_at: null,
  status: 'pending',
}

const assessmentAttemptRow: AssessmentAttemptRow = {
  id: 'attempt-1',
  enrollment_id: 'enrollment-1',
  lesson_id: 'lesson-1',
  attempted_at: ISO,
  score_percent: 80,
  passed: true,
  answers: { question1: 2 },
}

const sourceFileRow: SourceFileRow = {
  id: 'source-file-1',
  drive_file_id: 'drive-file-1',
  drive_path: null,
  title: 'policy.md',
  mime_type: 'text/markdown',
  authority: 'authoritative',
  authority_source: 'frontmatter',
  topic: 'hr_basics',
  current_version_id: 'source-version-1',
  last_synced_at: ISO,
  media_asset_id: null,
  processing_status: 'processed',
  source_kind: 'drive',
  created_at: ISO,
  updated_at: ISO,
}

const sourceFileVersionRow: SourceFileVersionRow = {
  id: 'source-version-1',
  source_file_id: 'source-file-1',
  head_revision_id: 'rev-1',
  content_hash: null,
  size_bytes: null,
  modified_time: null,
  raw_text: null,
  raw_text_preview: null,
  parse_status: 'processed',
  is_current: true,
  created_at: ISO,
}

const sourceSectionRow: SourceSectionRow = {
  id: 'section-1',
  source_file_version_id: 'source-version-1',
  level: 2,
  heading: 'Payroll',
  body: 'Payroll basics.',
  derived_from_section_ids: [],
  end_seconds: null,
  position_index: 0,
  slug: 'payroll',
  start_seconds: null,
  has_placeholders: false,
  created_at: ISO,
}

const mediaAssetRow: MediaAssetRow = {
  id: 'media-asset-1',
  module_id: 'module-1',
  module_version_id: 'module-version-1',
  training_lesson_id: 'lesson-1',
  lesson_index: 0,
  lesson_title: 'Welcome video',
  provider: 'heygen',
  heygen_video_id: 'heygen-video-1',
  avatar_id: 'brian',
  status: 'succeeded',
  storage_bucket: 'redex-media',
  storage_path: 'module-1/lesson-1.mp4',
  mime_type: 'video/mp4',
  duration_seconds: 120,
  cost_credits: 1.25,
  transcript_source_file_id: 'source-file-1',
  render_attempt_count: 1,
  max_render_attempts: 2,
  last_error_message: null,
  stale_since: null,
  created_at: ISO,
  updated_at: ISO,
  completed_at: ISO,
}

const moduleSourceBindingRow: ModuleSourceBindingRow = {
  id: 'binding-1',
  module_id: 'module-1',
  module_version_id: 'module-version-1',
  source_file_id: 'source-file-1',
  source_file_version_id: 'source-version-1',
  source_section_id: 'section-1',
  binding_kind: 'section',
  bound_revision_id: 'rev-1',
  lesson_ids: ['lesson-1'],
  flagged_for_review: false,
  flag_reason: null,
  created_at: ISO,
}

describe('db-rows mappers', () => {
  const cases = [
    {
      name: 'mapProfileRow',
      happy: () => mapProfileRow(profileRow),
      invalidEnum: () => mapProfileRow({ ...profileRow, role: 'owner' }),
      missingRequired: () => mapProfileRow({ ...profileRow, email: '' }),
      expected: { id: profileRow.id, role: 'learner' },
    },
    {
      name: 'mapTrainingCourseRow',
      happy: () => mapTrainingCourseRow(courseRow),
      invalidEnum: () => mapTrainingCourseRow({ ...courseRow, status: 'live' }),
      missingRequired: () => mapTrainingCourseRow({ ...courseRow, title: '' }),
      expected: { id: courseRow.id, learning_objectives: ['Learn safely'] },
    },
    {
      name: 'mapTrainingModuleRow',
      happy: () => mapTrainingModuleRow(moduleRow),
      invalidEnum: () => mapTrainingModuleRow({ ...moduleRow, criticality: 'urgent' }),
      missingRequired: () => mapTrainingModuleRow({ ...moduleRow, title: '' }),
      expected: { id: moduleRow.id, criticality: 'required' },
    },
    {
      name: 'mapTrainingLessonRow',
      happy: () => mapTrainingLessonRow(lessonRow),
      invalidEnum: () => mapTrainingLessonRow({ ...lessonRow, lesson_type: 'article' }),
      missingRequired: () => mapTrainingLessonRow({ ...lessonRow, title: '' }),
      expected: { id: lessonRow.id, lesson_type: 'text' },
    },
    {
      name: 'mapUserTrainingEnrollmentRow',
      happy: () => mapUserTrainingEnrollmentRow(enrollmentRow),
      invalidEnum: () => mapUserTrainingEnrollmentRow({ ...enrollmentRow, status: 'paused' }),
      missingRequired: () => mapUserTrainingEnrollmentRow({ ...enrollmentRow, user_id: '' }),
      expected: { id: enrollmentRow.id, status: 'active' },
    },
    {
      name: 'mapUserTrainingProgressRow',
      happy: () => mapUserTrainingProgressRow(progressRow),
      invalidEnum: () => mapUserTrainingProgressRow({ ...progressRow, status: 'done' }),
      missingRequired: () => mapUserTrainingProgressRow({ ...progressRow, lesson_id: '' }),
      expected: { id: progressRow.id, time_spent_seconds: 120 },
    },
    {
      name: 'mapAssignmentRow',
      happy: () => mapAssignmentRow(assignmentRow),
      invalidEnum: () => mapAssignmentRow({ ...assignmentRow, status: 'late' }),
      missingRequired: () => mapAssignmentRow({ ...assignmentRow, assigned_by: '' }),
      expected: { id: assignmentRow.id, status: 'pending' },
    },
    {
      name: 'mapAssessmentAttemptRow',
      happy: () => mapAssessmentAttemptRow(assessmentAttemptRow),
      invalidEnum: () => mapAssessmentAttemptRow({ ...assessmentAttemptRow, answers: { question1: 'b' } }),
      missingRequired: () => mapAssessmentAttemptRow({ ...assessmentAttemptRow, lesson_id: '' }),
      expected: { id: assessmentAttemptRow.id, answers: { question1: 2 } },
    },
    {
      name: 'mapSourceFileRow',
      happy: () => mapSourceFileRow(sourceFileRow),
      invalidEnum: () => mapSourceFileRow({ ...sourceFileRow, authority: 'draft' } as unknown as SourceFileRow),
      missingRequired: () => mapSourceFileRow({ ...sourceFileRow, title: '' }),
      expected: { id: sourceFileRow.id, authority: 'authoritative' },
    },
    {
      name: 'mapSourceFileVersionRow',
      happy: () => mapSourceFileVersionRow(sourceFileVersionRow),
      invalidEnum: () => mapSourceFileVersionRow({ ...sourceFileVersionRow, parse_status: 'parsed' } as unknown as SourceFileVersionRow),
      missingRequired: () => mapSourceFileVersionRow({ ...sourceFileVersionRow, head_revision_id: '' }),
      expected: { id: sourceFileVersionRow.id, parse_status: 'processed' },
    },
    {
      name: 'mapSourceSectionRow',
      happy: () => mapSourceSectionRow(sourceSectionRow),
      invalidEnum: () => mapSourceSectionRow({ ...sourceSectionRow, level: 7 }),
      missingRequired: () => mapSourceSectionRow({ ...sourceSectionRow, id: '' }),
      expected: { id: sourceSectionRow.id, level: 2 },
    },
    {
      name: 'mapModuleSourceBindingRow',
      happy: () => mapModuleSourceBindingRow(moduleSourceBindingRow),
      invalidEnum: () => mapModuleSourceBindingRow({ ...moduleSourceBindingRow, binding_kind: 'paragraph' }),
      missingRequired: () => mapModuleSourceBindingRow({ ...moduleSourceBindingRow, module_id: '' }),
      expected: { id: moduleSourceBindingRow.id, binding_kind: 'section' },
    },
  ]

  it.each(cases)('$name maps a valid row to a domain object', ({ happy, expected }) => {
    expect(happy()).toMatchObject(expected)
  })

  it.each(cases)('$name throws on invalid enum-like values', ({ invalidEnum }) => {
    expect(invalidEnum).toThrow(/invalid|expected/)
  })

  it.each(cases)('$name throws on missing required fields', ({ missingRequired }) => {
    expect(missingRequired).toThrow(/missing required field/)
  })

  it('captures Slice 10.6 media asset and transcript provenance row typings', () => {
    const transcriptSourceFileRow: SourceFileRow = {
      ...sourceFileRow,
      drive_file_id: `synthetic:video-transcript:${mediaAssetRow.id}`,
      authority: 'supporting',
      media_asset_id: mediaAssetRow.id,
      source_kind: 'synthetic_video_transcript',
      title: 'Welcome video transcript',
    }
    const transcriptSectionRow: SourceSectionRow = {
      ...sourceSectionRow,
      derived_from_section_ids: ['source-section-authoritative-1'],
      start_seconds: 60,
      end_seconds: 120,
      slug: 'video-000060-000120',
    }

    expect(mediaAssetRow).toMatchObject({
      provider: 'heygen',
      status: 'succeeded',
      transcript_source_file_id: transcriptSourceFileRow.id,
    })
    expect(transcriptSourceFileRow).toMatchObject({
      authority: 'supporting',
      source_kind: 'synthetic_video_transcript',
      media_asset_id: mediaAssetRow.id,
    })
    expect(transcriptSectionRow).toMatchObject({
      derived_from_section_ids: ['source-section-authoritative-1'],
      start_seconds: 60,
      end_seconds: 120,
    })
  })

  it('allows schema-valid empty source section heading and body', () => {
    expect(mapSourceSectionRow({ ...sourceSectionRow, heading: '', body: '' })).toMatchObject({
      heading: '',
      body: '',
    })
  })

  it('rejects lesson content with a mismatched discriminant', () => {
    expect(() => mapTrainingLessonRow({ ...lessonRow, content: { type: 'quiz', questions: [] } })).toThrow(
      /does not match lesson_type/,
    )
  })
})
