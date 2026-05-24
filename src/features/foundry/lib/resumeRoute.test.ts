import { describe, expect, it } from 'vitest'

import { inferResumeRoute, type FoundryResumeState } from './resumeRoute'

const currentDraft = {
  id: 'module-version-field-safety-refresher-v1',
  module_id: 'field-safety-refresher-mod-001',
  version_number: 1,
  title: 'Field Safety Refresher',
  parent_course_id: 'standalone',
  audience: 'New hires',
  criticality: 'required',
  training_type: 'general_informational',
  estimated_minutes: 20,
  updated_at: '2026-05-24T00:00:00.000Z',
} as const satisfies FoundryResumeState['currentDraft']

function makeState(overrides: Partial<FoundryResumeState> = {}): FoundryResumeState {
  return {
    currentDraft,
    sourceMaterial: { id: 'source-1', title: 'Source', type: 'markdown', processing_status: 'processed', sections: [] },
    selectedLibraryFileIds: [],
    setupAnswers: {
      criticality: 'operational',
      assessment_style: 'standard_quiz',
      audience_notes: 'New hires',
      experience_notes: 'First week',
      estimated_minutes: 20,
      source_control: 'strict',
      requires_admin_approval: true,
      requires_safety_review: false,
      updated_at: '2026-05-24T00:00:00.000Z',
    },
    outline: {
      course_title: 'Field Safety Refresher',
      description: 'A refresher.',
      learning_objectives: ['Refresh field safety expectations.'],
      modules: [{ title: 'Field Safety', lessons: [{ title: 'Basics', lesson_type: 'text', estimated_minutes: 5 }] }],
      missing_source_notes: [],
    },
    outline_status: 'approved',
    generatedModule: {
      module_title: 'Field Safety Refresher',
      lessons: [],
      generated_at: '2026-05-24T00:00:00.000Z',
      is_complete: true,
    },
    critique: {
      module_title: 'Field Safety Refresher',
      generated_at: '2026-05-24T00:00:00.000Z',
      issues: [],
      blocks_publish: false,
    },
    lessonReviews: [
      {
        lesson_index: 0,
        module_index: 0,
        lesson_title: 'Basics',
        confidence: 'high',
        has_unsupported_claim: false,
        status: 'approved',
        source_excerpts: [],
      },
    ],
    publishStatus: 'ready_to_publish',
    getPublishBlockers: () => [],
    ...overrides,
  }
}

describe('inferResumeRoute', () => {
  it('uses draft_metadata.current_stage when present', () => {
    expect(inferResumeRoute(makeState({ draft_metadata: { current_stage: 'source' } }))).toBe('/admin/foundry/source')
    expect(inferResumeRoute(makeState({ draft_metadata: { current_stage: 'sidebyside' } }))).toBe('/admin/foundry/sidebyside')
  })

  it.each([
    ['no current draft', { currentDraft: null }, '/admin/foundry/start'],
    ['draft without source or selected files', { sourceMaterial: null, selectedLibraryFileIds: [] }, '/admin/foundry/source'],
    ['draft with selected files but no setup answers', { sourceMaterial: null, selectedLibraryFileIds: ['drive-file-1'], setupAnswers: null }, '/admin/foundry/questions'],
    ['draft without outline', { outline: null }, '/admin/foundry/outline'],
    ['draft with unapproved outline', { outline_status: 'draft' }, '/admin/foundry/outline'],
    ['draft without generated module', { generatedModule: null }, '/admin/foundry/preview'],
    ['draft without critique', { critique: null }, '/admin/foundry/critique'],
    ['draft without lesson reviews', { lessonReviews: [] }, '/admin/foundry/sidebyside'],
    [
      'draft with publish blockers',
      {
        getPublishBlockers: () => [
          {
            id: 'blocker-1',
            source: 'lesson_unsupported_claim',
            severity: 'blocker',
            location: 'Basics',
            summary: 'Unsupported claim pending review.',
            detail: 'Needs review.',
            resolve_route: '/admin/foundry/sidebyside',
          },
        ],
      },
      '/admin/foundry/blockers',
    ],
    ['published draft', { publishStatus: 'published' }, '/admin/foundry/published'],
    ['ready draft that is not published', {}, '/admin/foundry/blockers'],
  ] satisfies Array<[string, Partial<FoundryResumeState>, ReturnType<typeof inferResumeRoute>]>)('routes %s', (_label, overrides, expectedRoute) => {
    expect(inferResumeRoute(makeState(overrides))).toBe(expectedRoute)
  })
})
