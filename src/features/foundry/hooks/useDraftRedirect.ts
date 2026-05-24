import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFoundryDraftStore } from '@/features/foundry/store/foundryDraftStore';

export type RequiredDraftStage =
  | 'source'
  | 'questions'
  | 'outline'
  | 'preview'
  | 'critique'
  | 'sidebyside'
  | 'blockers';

export type DraftRedirectRequirement = RequiredDraftStage | null;

function resolveMissingPrereqRedirect(requiredStage: DraftRedirectRequirement, state: ReturnType<typeof useFoundryDraftStore.getState>): string | null {
  const hasDraft = state.currentDraft !== null;
  const hasSource = state.sourceMaterial !== null || state.selectedLibraryFileIds.length > 0;
  const hasQuestions = state.setupAnswers !== null;
  const hasOutline = state.outline !== null;
  const hasApprovedOutline = hasOutline && state.outline_status === 'approved';
  const hasPreview = state.generatedModule !== null;
  const hasCritique = state.critique !== null;
  const hasSideBySide = state.lessonReviews.length > 0;

  if (requiredStage === null) {
    return null;
  }

  if (!hasDraft) {
    return '/admin/foundry/start';
  }

  if (requiredStage === 'source') {
    return null;
  }

  if (!hasSource) {
    return '/admin/foundry/source';
  }

  if (requiredStage === 'questions') {
    return null;
  }

  if (!hasQuestions) {
    return '/admin/foundry/questions';
  }

  if (requiredStage === 'outline') {
    return null;
  }

  if (!hasApprovedOutline) {
    return '/admin/foundry/outline';
  }

  if (requiredStage === 'preview') {
    return null;
  }

  if (!hasPreview) {
    return '/admin/foundry/preview';
  }

  if (requiredStage === 'critique') {
    return null;
  }

  if (!hasCritique) {
    return '/admin/foundry/critique';
  }

  if (requiredStage === 'sidebyside') {
    return null;
  }

  if (!hasSideBySide) {
    return '/admin/foundry/sidebyside';
  }

  return null;
}

export function useDraftRedirect(requiredStage: DraftRedirectRequirement) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = useFoundryDraftStore();

  useEffect(() => {
    const redirectPath = resolveMissingPrereqRedirect(requiredStage, state);

    if (redirectPath && redirectPath !== location.pathname) {
      navigate(redirectPath, { replace: true });
    }
  }, [location.pathname, navigate, requiredStage, state]);
}
