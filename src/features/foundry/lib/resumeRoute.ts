import type {
  CourseOutlineDraft,
  GeneratedModulePreview,
  LessonReviewItem,
  PublishBlocker,
  SelfCritiqueReport,
  SetupAnswers,
  SourceMaterial,
} from '@/lib/education'
import type { ModuleBasicsDraft } from '@/features/foundry/types'
import type { FoundryDraftMetadata } from '@/types/training'

export type FoundryResumeRoute =
  | '/admin/foundry/start'
  | '/admin/foundry/source'
  | '/admin/foundry/questions'
  | '/admin/foundry/outline'
  | '/admin/foundry/preview'
  | '/admin/foundry/critique'
  | '/admin/foundry/sidebyside'
  | '/admin/foundry/blockers'
  | '/admin/foundry/published'

export interface FoundryResumeState {
  currentDraft: ModuleBasicsDraft | null
  sourceMaterial: SourceMaterial | null
  selectedLibraryFileIds: string[]
  setupAnswers: SetupAnswers | null
  outline: CourseOutlineDraft | null
  outline_status: 'draft' | 'approved' | 'regenerating'
  generatedModule: GeneratedModulePreview | null
  critique: SelfCritiqueReport | null
  lessonReviews: LessonReviewItem[]
  publishStatus: string
  getPublishBlockers?: () => PublishBlocker[]
  draft_metadata?: FoundryDraftMetadata
}

const STAGE_TO_ROUTE: Record<string, FoundryResumeRoute> = {
  basics: '/admin/foundry/start',
  source: '/admin/foundry/source',
  questions: '/admin/foundry/questions',
  outline: '/admin/foundry/outline',
  preview: '/admin/foundry/preview',
  critique: '/admin/foundry/critique',
  sidebyside: '/admin/foundry/sidebyside',
  blockers: '/admin/foundry/blockers',
  published: '/admin/foundry/published',
}

export function inferResumeRoute(draftState: FoundryResumeState): FoundryResumeRoute {
  const stageRoute = draftState.draft_metadata?.current_stage
    ? STAGE_TO_ROUTE[draftState.draft_metadata.current_stage]
    : undefined

  if (stageRoute) {
    return stageRoute
  }
  if (draftState.currentDraft === null) {
    return '/admin/foundry/start'
  }

  if (draftState.sourceMaterial === null && draftState.selectedLibraryFileIds.length === 0) {
    return '/admin/foundry/source'
  }

  if (draftState.setupAnswers === null) {
    return '/admin/foundry/questions'
  }

  if (draftState.outline === null || draftState.outline_status !== 'approved') {
    return '/admin/foundry/outline'
  }

  if (draftState.generatedModule === null) {
    return '/admin/foundry/preview'
  }

  if (draftState.critique === null) {
    return '/admin/foundry/critique'
  }

  if (draftState.lessonReviews.length === 0) {
    return '/admin/foundry/sidebyside'
  }

  if ((draftState.getPublishBlockers?.() ?? []).length > 0) {
    return '/admin/foundry/blockers'
  }

  if (draftState.publishStatus === 'published') {
    return '/admin/foundry/published'
  }

  return '/admin/foundry/blockers'
}
