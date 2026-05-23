import type { SourceFile, SourceSection } from '@/lib/education'

export const HR_SOURCE_FILE_IDS = {
  codeOfConduct: '1-3pY84GBgYxWi0C6Y_HVRE-l9R2l9is7',
  ptoPolicy: '1kx1FUDCJCyG5FGWi0X1SFMi7F_sjD47R',
  newHireChecklist: '1wgolsCH2BOX5ZLICM05AtZLYqtiHsiEr',
} as const

export const HR_SOURCE_SECTION_IDS = {
  welcome: 'section-welcome-to-redex',
  hrContact: 'section-who-to-contact-for-hr-help',
  payroll: 'section-payroll-basics',
  timekeeping: 'section-timekeeping-expectations',
  firstWeek: 'section-first-week-expectations',
  communication: 'section-communication-expectations',
  escalation: 'section-manager-escalation-path',
} as const

export interface ModuleSourceBinding {
  module_version_id: string
  source_file_id: string
  section_id: string
  bound_revision_id: string
  lesson_ids: string[]
}

export interface MockSourceSectionDiff {
  source_file_id: string
  source_file_name: string
  section_id: string
  heading: string
  oldContent: string
  newContent: string
}

const BOUND_REVISION_ID = 'drive-rev-hr-onboarding-2026-05-22'

/**
 * Slice 7.3 mock of the future `module_source_bindings` persisted contract.
 * One row is seeded per HR Basics lesson, keyed by module version + source section.
 */
export const MOCK_MODULE_SOURCE_BINDINGS: ModuleSourceBinding[] = [
  {
    module_version_id: 'module-version-hr-basics-v1',
    source_file_id: HR_SOURCE_FILE_IDS.codeOfConduct,
    section_id: HR_SOURCE_SECTION_IDS.welcome,
    bound_revision_id: BOUND_REVISION_ID,
    lesson_ids: ['hr-basics-lesson-1-welcome'],
  },
  {
    module_version_id: 'module-version-hr-basics-v1',
    source_file_id: HR_SOURCE_FILE_IDS.codeOfConduct,
    section_id: HR_SOURCE_SECTION_IDS.hrContact,
    bound_revision_id: BOUND_REVISION_ID,
    lesson_ids: ['hr-basics-lesson-2-contact'],
  },
  {
    module_version_id: 'module-version-hr-basics-v1',
    source_file_id: HR_SOURCE_FILE_IDS.ptoPolicy,
    section_id: HR_SOURCE_SECTION_IDS.payroll,
    bound_revision_id: BOUND_REVISION_ID,
    lesson_ids: ['hr-basics-lesson-3-payroll-timekeeping'],
  },
  {
    module_version_id: 'module-version-hr-basics-v1',
    source_file_id: HR_SOURCE_FILE_IDS.newHireChecklist,
    section_id: HR_SOURCE_SECTION_IDS.firstWeek,
    bound_revision_id: BOUND_REVISION_ID,
    lesson_ids: ['hr-basics-lesson-4-first-week'],
  },
  {
    module_version_id: 'module-version-hr-basics-v1',
    source_file_id: HR_SOURCE_FILE_IDS.codeOfConduct,
    section_id: HR_SOURCE_SECTION_IDS.communication,
    bound_revision_id: BOUND_REVISION_ID,
    lesson_ids: ['hr-basics-lesson-5-acknowledgment'],
  },
  {
    module_version_id: 'module-version-hr-basics-v1',
    source_file_id: HR_SOURCE_FILE_IDS.ptoPolicy,
    section_id: HR_SOURCE_SECTION_IDS.timekeeping,
    bound_revision_id: BOUND_REVISION_ID,
    lesson_ids: ['hr-basics-lesson-6-final-quiz'],
  },
]

export const MOCK_SOURCE_LIBRARY_FILES: SourceFile[] = [
  {
    id: HR_SOURCE_FILE_IDS.codeOfConduct,
    drive_file_id: HR_SOURCE_FILE_IDS.codeOfConduct,
    drive_path: '_library/hr_basics/code-of-conduct.md',
    title: 'code-of-conduct.md',
    mime_type: 'text/markdown',
    authority: 'authoritative',
    authority_source: 'frontmatter',
    topic: 'hr_basics',
    current_version_id: 'source-version-code-of-conduct-2026-05-22',
    last_synced_at: '2026-05-22T20:00:00.000Z',
    processing_status: 'processed',
    created_at: '2026-05-22T20:00:00.000Z',
    updated_at: '2026-05-22T20:00:00.000Z',
  },
  {
    id: HR_SOURCE_FILE_IDS.ptoPolicy,
    drive_file_id: HR_SOURCE_FILE_IDS.ptoPolicy,
    drive_path: '_library/hr_basics/pto-policy.md',
    title: 'pto-policy.md',
    mime_type: 'text/markdown',
    authority: 'authoritative',
    authority_source: 'frontmatter',
    topic: 'hr_basics',
    current_version_id: 'source-version-pto-policy-2026-05-22',
    last_synced_at: '2026-05-22T20:00:00.000Z',
    processing_status: 'processed',
    created_at: '2026-05-22T20:00:00.000Z',
    updated_at: '2026-05-22T20:00:00.000Z',
  },
  {
    id: HR_SOURCE_FILE_IDS.newHireChecklist,
    drive_file_id: HR_SOURCE_FILE_IDS.newHireChecklist,
    drive_path: '_library/hr_basics/new-hire-checklist.md',
    title: 'new-hire-checklist.md',
    mime_type: 'text/markdown',
    authority: 'supporting',
    authority_source: 'frontmatter',
    topic: 'hr_basics',
    current_version_id: 'source-version-new-hire-checklist-2026-05-22',
    last_synced_at: '2026-05-22T20:00:00.000Z',
    processing_status: 'processed',
    created_at: '2026-05-22T20:00:00.000Z',
    updated_at: '2026-05-22T20:00:00.000Z',
  },
]

export const MOCK_STORED_SOURCE_SECTIONS: SourceSection[] = [
  {
    id: HR_SOURCE_SECTION_IDS.payroll,
    level: 2,
    heading: 'Payroll basics',
    body: '[PLACEHOLDER — Redex must provide approved policy language]',
    position_index: 0,
    has_placeholders: true,
  },
  {
    id: HR_SOURCE_SECTION_IDS.timekeeping,
    level: 2,
    heading: 'Timekeeping expectations',
    body: '[PLACEHOLDER — Redex must provide approved policy language]',
    position_index: 1,
    has_placeholders: true,
  },
]

export const MOCK_FRESH_SOURCE_SECTIONS: SourceSection[] = [
  {
    id: HR_SOURCE_SECTION_IDS.payroll,
    level: 2,
    heading: 'Payroll basics',
    body: 'Payroll is processed bi-weekly through direct deposit. New hires receive setup instructions from People Ops during their first week.',
    position_index: 0,
    has_placeholders: false,
  },
  {
    id: HR_SOURCE_SECTION_IDS.timekeeping,
    level: 2,
    heading: 'Timekeeping expectations',
    body: 'Hourly employees submit daily clock-in and clock-out records. Managers review corrections before payroll closes.',
    position_index: 1,
    has_placeholders: false,
  },
]

export const MOCK_SOURCE_SECTION_DIFFS: MockSourceSectionDiff[] = [
  {
    source_file_id: HR_SOURCE_FILE_IDS.ptoPolicy,
    source_file_name: 'pto-policy.md',
    section_id: HR_SOURCE_SECTION_IDS.payroll,
    heading: 'Payroll basics',
    oldContent: '[PLACEHOLDER — Redex must provide approved policy language]',
    newContent:
      'Payroll is processed bi-weekly through direct deposit. New hires receive setup instructions from People Ops during their first week.',
  },
  {
    source_file_id: HR_SOURCE_FILE_IDS.ptoPolicy,
    source_file_name: 'pto-policy.md',
    section_id: HR_SOURCE_SECTION_IDS.timekeeping,
    heading: 'Timekeeping expectations',
    oldContent: '[PLACEHOLDER — Redex must provide approved policy language]',
    newContent: 'Hourly employees submit daily clock-in and clock-out records. Managers review corrections before payroll closes.',
  },
]
