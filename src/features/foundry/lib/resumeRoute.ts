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
}

export function inferResumeRoute(draftState: FoundryResumeState): FoundryResumeRoute {
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
