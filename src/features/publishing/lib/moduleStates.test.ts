import { describe, expect, it } from 'vitest'

import { MOCK_GENERATED_MODULE } from '@/features/foundry/data/mockGeneratedModule'
import { MOCK_GENERATED_OUTLINE } from '@/features/foundry/data/mockGeneratedOutline'
import { MOCK_LESSON_REVIEWS } from '@/features/foundry/data/mockLessonReviews'
import { MOCK_SELF_CRITIQUE } from '@/features/foundry/data/mockSelfCritique'
import type { ModuleBasicsDraft } from '@/features/foundry/types'
import type { ModuleStateInput } from './moduleStates'
import {
  canTransition,
  inferModuleState,
  orderedStates,
  stateBadgeVariant,
  stateLabel,
  type ModuleApprovalState,
} from './moduleStates'

const draft: ModuleBasicsDraft = {
  title: 'HR Basics at Redex',
  parent_course_id: 'standalone',
  audience: 'New hires',
  criticality: 'required',
  training_type: 'general_informational',
  estimated_minutes: 20,
  updated_at: '2026-05-23T00:00:00.000Z',
}

const baseInput: ModuleStateInput = {
  currentDraft: null,
  sourceMaterial: null,
  setupAnswers: null,
  outline: null,
  outlineStatus: 'draft',
  generatedModule: null,
  critique: null,
  lessonReviews: [],
  blockerCount: 0,
  publishStatus: 'draft',
}

describe('moduleStates', () => {
  it.each<[string, Partial<ModuleStateInput>, ModuleApprovalState]>([
    ['archived', { isArchived: true, publishStatus: 'published' }, 'archived'],
    ['published', { publishStatus: 'published' }, 'published'],
    [
      'approved',
      { critique: MOCK_SELF_CRITIQUE, lessonReviews: MOCK_LESSON_REVIEWS, blockerCount: 0 },
      'approved',
    ],
    ['blocked', { blockerCount: 1, critique: MOCK_SELF_CRITIQUE }, 'blocked'],
    ['needs_review', { lessonReviews: MOCK_LESSON_REVIEWS }, 'needs_review'],
    ['self_critiqued', { critique: MOCK_SELF_CRITIQUE }, 'self_critiqued'],
    ['generated', { generatedModule: MOCK_GENERATED_MODULE }, 'generated'],
    ['outline_approved', { outline: MOCK_GENERATED_OUTLINE, outlineStatus: 'approved' }, 'outline_approved'],
    [
      'questions_complete',
      {
        setupAnswers: {
          criticality: 'basic_knowledge',
          assessment_style: 'light_quiz',
          audience_notes: 'New hires',
          experience_notes: 'Friendly onboarding',
          estimated_minutes: 20,
          source_control: 'strict',
          requires_admin_approval: true,
          requires_safety_review: false,
          updated_at: '2026-05-23T00:00:00.000Z',
        },
      },
      'questions_complete',
    ],
    [
      'source_added',
      {
        sourceMaterial: {
          id: 'source-1',
          title: 'HR source',
          type: 'markdown',
          processing_status: 'processed',
          sections: [],
        },
      },
      'source_added',
    ],
    ['draft with current draft', { currentDraft: draft }, 'draft'],
    ['draft fallback', {}, 'draft'],
  ])('infers %s', (_name, overrides, expected) => {
    expect(inferModuleState({ ...baseInput, ...overrides })).toBe(expected)
  })

  it('returns a defensive ordered state copy', () => {
    const states = orderedStates()
    states.pop()

    expect(orderedStates()).toEqual([
      'draft',
      'source_added',
      'questions_complete',
      'outline_approved',
      'generated',
      'self_critiqued',
      'needs_review',
      'blocked',
      'approved',
      'published',
      'archived',
    ])
  })

  it.each<[ModuleApprovalState, string, ReturnType<typeof stateBadgeVariant>]>([
    ['draft', 'Draft', 'neutral'],
    ['source_added', 'Source added', 'progress'],
    ['questions_complete', 'Questions complete', 'progress'],
    ['outline_approved', 'Outline approved', 'progress'],
    ['generated', 'Generated', 'progress'],
    ['self_critiqued', 'Self-critiqued', 'progress'],
    ['needs_review', 'Needs review', 'warning'],
    ['blocked', 'Blocked', 'danger'],
    ['approved', 'Approved', 'success'],
    ['published', 'Published', 'success'],
    ['archived', 'Archived', 'neutral'],
  ])('labels and variants %s', (state, label, variant) => {
    expect(stateLabel(state)).toBe(label)
    expect(stateBadgeVariant(state)).toBe(variant)
  })

  it('allows only explicit approval-state transitions', () => {
    expect(canTransition('draft', 'source_added')).toBe(true)
    expect(canTransition('needs_review', 'blocked')).toBe(true)
    expect(canTransition('needs_review', 'approved')).toBe(true)
    expect(canTransition('approved', 'published')).toBe(true)
    expect(canTransition('published', 'archived')).toBe(true)
    expect(canTransition('blocked', 'published')).toBe(false)
    expect(canTransition('archived', 'published')).toBe(false)
    expect(canTransition('generated', 'generated')).toBe(true)
  })
})
