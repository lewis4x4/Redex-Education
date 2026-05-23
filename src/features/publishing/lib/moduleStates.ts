import type {
  CourseOutlineDraft,
  GeneratedModulePreview,
  LessonReviewItem,
  SelfCritiqueReport,
  SetupAnswers,
  SourceMaterial,
} from '@/lib/education'
import type { ModuleBasicsDraft } from '@/features/foundry/types'

export type ModuleApprovalState =
  | 'draft'
  | 'source_added'
  | 'questions_complete'
  | 'outline_approved'
  | 'generated'
  | 'self_critiqued'
  | 'needs_review'
  | 'blocked'
  | 'approved'
  | 'published'
  | 'archived'

export interface ModuleStateInput {
  currentDraft: ModuleBasicsDraft | null
  sourceMaterial: SourceMaterial | null
  setupAnswers: SetupAnswers | null
  outline: CourseOutlineDraft | null
  outlineStatus: 'draft' | 'approved' | 'regenerating'
  generatedModule: GeneratedModulePreview | null
  critique: SelfCritiqueReport | null
  lessonReviews: LessonReviewItem[]
  blockerCount: number
  publishStatus: 'draft' | 'ready_to_publish' | 'published'
  isArchived?: boolean
}

const ORDERED_STATES: ModuleApprovalState[] = [
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
]

const STATE_LABELS: Record<ModuleApprovalState, string> = {
  draft: 'Draft',
  source_added: 'Source added',
  questions_complete: 'Questions complete',
  outline_approved: 'Outline approved',
  generated: 'Generated',
  self_critiqued: 'Self-critiqued',
  needs_review: 'Needs review',
  blocked: 'Blocked',
  approved: 'Approved',
  published: 'Published',
  archived: 'Archived',
}

const STATE_BADGE_VARIANTS: Record<
  ModuleApprovalState,
  'neutral' | 'progress' | 'warning' | 'success' | 'danger'
> = {
  draft: 'neutral',
  source_added: 'progress',
  questions_complete: 'progress',
  outline_approved: 'progress',
  generated: 'progress',
  self_critiqued: 'progress',
  needs_review: 'warning',
  blocked: 'danger',
  approved: 'success',
  published: 'success',
  archived: 'neutral',
}

const ALLOWED_TRANSITIONS: Record<ModuleApprovalState, ModuleApprovalState[]> = {
  draft: ['source_added', 'archived'],
  source_added: ['questions_complete', 'archived'],
  questions_complete: ['outline_approved', 'archived'],
  outline_approved: ['generated', 'archived'],
  generated: ['self_critiqued', 'archived'],
  self_critiqued: ['needs_review', 'archived'],
  needs_review: ['blocked', 'approved', 'archived'],
  blocked: ['approved', 'archived'],
  approved: ['published', 'archived'],
  published: ['archived'],
  archived: [],
}

/** Pure inference from foundryDraftStore state. */
export function inferModuleState(input: ModuleStateInput): ModuleApprovalState {
  if (input.isArchived) {
    return 'archived'
  }

  if (input.publishStatus === 'published') {
    return 'published'
  }

  if (input.blockerCount === 0 && input.lessonReviews.length > 0 && input.critique) {
    return 'approved'
  }

  if (input.blockerCount > 0) {
    return 'blocked'
  }

  if (input.lessonReviews.length > 0) {
    return 'needs_review'
  }

  if (input.critique) {
    return 'self_critiqued'
  }

  if (input.generatedModule) {
    return 'generated'
  }

  if (input.outline && input.outlineStatus === 'approved') {
    return 'outline_approved'
  }

  if (input.setupAnswers) {
    return 'questions_complete'
  }

  if (input.sourceMaterial) {
    return 'source_added'
  }

  return 'draft'
}

/** Returns ordered list of states (for progress visualization). */
export function orderedStates(): ModuleApprovalState[] {
  return [...ORDERED_STATES]
}

/** Human-readable label for a state (for badges). */
export function stateLabel(state: ModuleApprovalState): string {
  return STATE_LABELS[state]
}

/** Tailwind color class for state badge (Redex tokens). */
export function stateBadgeVariant(
  state: ModuleApprovalState,
): 'neutral' | 'progress' | 'warning' | 'success' | 'danger' {
  return STATE_BADGE_VARIANTS[state]
}

/** Whether a state can transition to a target state. */
export function canTransition(from: ModuleApprovalState, to: ModuleApprovalState): boolean {
  return from === to || ALLOWED_TRANSITIONS[from].includes(to)
}
