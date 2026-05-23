import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MOCK_ADMIN_USER } from '@/lib/education';
import type {
  CourseOutlineDraft,
  GeneratedModulePreview,
  LessonGenerationStatus,
  LessonReviewItem,
  PublishBlocker,
  SelfCritiqueReport,
  SetupAnswers,
  SourceMaterial,
} from '@/lib/education';
import { useAuditLogStore } from '@/features/audit/store/auditLogStore';
import { inferModuleState } from '@/features/publishing/lib/moduleStates';
import { useModuleVersionsStore } from '@/features/publishing/store/moduleVersionsStore';
import { usePublishedModulesStore } from '@/features/publishing/store/publishedModulesStore';
import type { SetupAnswersInput } from '../schemas/foundrySchemas';
import type { ModuleBasicsDraft, ModuleBasicsFormValues } from '../types';
import type { AuditLog, ModuleVersion } from '@/lib/education';

const DEFAULT_MODULE_VERSION_ID = 'module-version-hr-basics-v1';

type MaybeModuleVersionCarrier = {
  id?: unknown;
  module_version_id?: unknown;
};

function readStringProperty(source: MaybeModuleVersionCarrier | null | undefined, key: keyof MaybeModuleVersionCarrier) {
  const value = source?.[key];

  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function slugifyModuleTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled-module';
}

function resolvePublishedModuleVersionId(
  currentDraft: ModuleBasicsDraft | null,
  generatedModule: GeneratedModulePreview | null,
): string {
  const explicitModuleVersionId =
    readStringProperty(currentDraft as MaybeModuleVersionCarrier | null, 'id') ??
    readStringProperty(generatedModule as MaybeModuleVersionCarrier | null, 'module_version_id');

  if (explicitModuleVersionId) {
    return explicitModuleVersionId;
  }

  const title = currentDraft?.title ?? generatedModule?.module_title ?? '';

  if (title.trim().toLowerCase() === 'hr basics at redex' || title.trim() === '') {
    return DEFAULT_MODULE_VERSION_ID;
  }

  return `module-version-${slugifyModuleTitle(title)}-v1`;
}

function parseVersionNumberFromVersionId(moduleVersionId: string): number | undefined {
  const match = moduleVersionId.match(/-v(\d+)$/u);
  const parsed = match?.[1] ? Number.parseInt(match[1], 10) : Number.NaN;

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function resolvePublishedModuleId(
  currentDraft: ModuleBasicsDraft | null,
  generatedModule: GeneratedModulePreview | null,
  moduleVersionId: string,
): string {
  if (currentDraft?.module_id) {
    return currentDraft.module_id;
  }

  const title = currentDraft?.title ?? generatedModule?.module_title ?? '';

  if (moduleVersionId === DEFAULT_MODULE_VERSION_ID || title.trim().toLowerCase() === 'hr basics at redex' || title.trim() === '') {
    return 'hr-basics-mod-001';
  }

  return `${slugifyModuleTitle(title)}-mod-001`;
}

function resolvePublishedVersionNumber(currentDraft: ModuleBasicsDraft | null, moduleVersionId: string): number {
  if (typeof currentDraft?.version_number === 'number' && currentDraft.version_number > 0) {
    return currentDraft.version_number;
  }

  return parseVersionNumberFromVersionId(moduleVersionId) ?? 1;
}

function resolveDraftModuleId(title: string, currentDraft?: ModuleBasicsDraft | null): string {
  if (currentDraft?.module_id) {
    return currentDraft.module_id;
  }

  if (title.trim().toLowerCase() === 'hr basics at redex' || title.trim() === '') {
    return 'hr-basics-mod-001';
  }

  return `${slugifyModuleTitle(title)}-mod-001`;
}

function recordAuditEvent(input: Omit<AuditLog, 'id' | 'occurred_at' | 'actor_user_id' | 'actor_name'>) {
  useAuditLogStore.getState().recordEvent({
    actor_user_id: MOCK_ADMIN_USER.id,
    actor_name: MOCK_ADMIN_USER.display_name,
    ...input,
  });
}

export type FoundryPublishStatus = 'draft' | 'ready_to_publish' | 'published';

const resetPublishState = {
  publishStatus: 'draft' as FoundryPublishStatus,
  publishedAt: null,
};

interface FoundryDraftState {
  /** The current working draft, or null if none */
  currentDraft: ModuleBasicsDraft | null;
  /** Save form values as the draft (sets updated_at) */
  setBasics: (values: ModuleBasicsFormValues) => void;
  /** Clear the working draft (e.g. on successful publish, or "Start over") */
  clearDraft: () => void;
  /** The current source material draft for Slice 2.3 source binder */
  sourceMaterial: SourceMaterial | null;
  /** Setup-question answers captured before outline generation */
  setupAnswers: SetupAnswers | null;
  /** Generated course outline draft for Slice 3.1 review */
  outline: CourseOutlineDraft | null;
  /** Local outline lifecycle status for review/regeneration UX */
  outline_status: 'draft' | 'approved' | 'regenerating';
  /** Generated module preview for Slice 3.2 */
  generatedModule: GeneratedModulePreview | null;
  /** Self-critique report for generated module */
  critique: SelfCritiqueReport | null;
  /** Set self-critique report */
  setCritique: (report: SelfCritiqueReport) => void;
  /** Publish lifecycle for the current Foundry draft */
  publishStatus: FoundryPublishStatus;
  /** ISO timestamp when the module was published, if published */
  publishedAt: string | null;
  /** Mark module published when no publish blockers remain; returns true when published. */
  setPublished: () => boolean;
  /** Reset publish lifecycle back to draft */
  resetPublishStatus: () => void;
  /** Reset the full Foundry draft flow back to an empty draft */
  resetFoundryDraft: () => void;
  /** Seed a new working draft from a forked module version. */
  seedDraftFromModuleVersion: (version: ModuleVersion) => void;
  /** Side-by-side review state for generated lessons */
  lessonReviews: LessonReviewItem[];
  /** Overwrite lesson review state */
  setLessonReviews: (items: LessonReviewItem[]) => void;
  /** Clear lesson review state */
  clearLessonReviews: () => void;
  /** Mark one lesson review item approved by lesson/module indices */
  approveLessonReview: (lessonIdx: number, moduleIdx: number) => void;
  /** Mark one lesson review item as needing regeneration by lesson/module indices */
  rejectLessonReview: (lessonIdx: number, moduleIdx: number) => void;
  /** Computes true when any lesson has unsupported_claim AND is not approved. */
  isPublishBlocked: () => boolean;
  /** Aggregates all blockers that prevent publishing. */
  getPublishBlockers: () => PublishBlocker[];
  /** Clear self-critique report */
  clearCritique: () => void;
  /** Mark one critique issue ignored and attach note */
  ignoreIssue: (issueId: string, note: string) => void;
  /** Remove ignore state for one critique issue */
  unignoreIssue: (issueId: string) => void;
  /** Save parsed source material */
  setSourceMaterial: (material: SourceMaterial) => void;
  /** Clear source material draft */
  clearSourceMaterial: () => void;
  /** Save setup-question answers as the draft (sets updated_at) */
  setSetupAnswers: (input: SetupAnswersInput) => void;
  /** Clear setup-question answers draft */
  clearSetupAnswers: () => void;
  /** Set generated outline and reset status to draft */
  setOutline: (draft: CourseOutlineDraft) => void;
  /** Mark current outline approved (no-op when no outline exists) */
  approveOutline: () => void;
  /** Clear current outline and reset status */
  clearOutline: () => void;
  /** Set regenerating status for simulated loading */
  regenerateOutlineStart: () => void;
  /** Set generated module preview */
  setGeneratedModule: (preview: GeneratedModulePreview) => void;
  /** Clear generated module preview */
  clearGeneratedModule: () => void;
  /** Update one generated lesson status by lesson/module indices (no-op if preview missing) */
  updateLessonStatus: (
    lessonIdx: number,
    moduleIdx: number,
    status: LessonGenerationStatus,
  ) => void;
  /** Drive file IDs selected from the Source Library for this draft */
  selectedLibraryFileIds: string[];
  /** Toggle a Drive-backed source file selection */
  toggleLibraryFile: (driveFileId: string) => void;
  /** Clear all Source Library selections */
  clearLibrarySelection: () => void;
}

export const useFoundryDraftStore = create<FoundryDraftState>()(
  persist(
    (set, get) => ({
      currentDraft: null,
      sourceMaterial: null,
      setupAnswers: null,
      outline: null,
      outline_status: 'draft',
      generatedModule: null,
      critique: null,
      publishStatus: 'draft',
      publishedAt: null,
      lessonReviews: [],
      selectedLibraryFileIds: [],
      setBasics: (values) => {
        const wasNewDraft = get().currentDraft === null;
        const moduleId = resolveDraftModuleId(values.title);

        set({
          currentDraft: {
            ...values,
            updated_at: new Date().toISOString(),
          },
          ...resetPublishState,
        });

        if (wasNewDraft) {
          recordAuditEvent({
            event_type: 'module_created',
            entity_type: 'module',
            entity_id: moduleId,
            entity_label: values.title,
          });
        }
      },
      clearDraft: () => set({ currentDraft: null, ...resetPublishState }),
      resetPublishStatus: () => set(resetPublishState),
      resetFoundryDraft: () =>
        set({
          currentDraft: null,
          sourceMaterial: null,
          setupAnswers: null,
          outline: null,
          outline_status: 'draft',
          generatedModule: null,
          critique: null,
          lessonReviews: [],
          selectedLibraryFileIds: [],
          ...resetPublishState,
        }),
      seedDraftFromModuleVersion: (version) => {
        set({
          currentDraft: {
            id: version.id,
            module_id: version.module_id,
            version_number: version.version_number,
            source_binder_version: version.source_binder_version,
            assessment_version: version.assessment_version,
            title: version.module_title,
            parent_course_id: 'standalone',
            audience: 'New hires',
            criticality: 'required',
            training_type: 'general_informational',
            estimated_minutes: 20,
            updated_at: new Date().toISOString(),
          },
          sourceMaterial: null,
          setupAnswers: null,
          outline: null,
          outline_status: 'draft',
          generatedModule: null,
          critique: null,
          lessonReviews: [],
          selectedLibraryFileIds: [],
          ...resetPublishState,
        });
        const alreadyRecordedFork = useAuditLogStore
          .getState()
          .events.some((event) => event.event_type === 'module_version_forked' && event.entity_id === version.id);

        if (!alreadyRecordedFork) {
          recordAuditEvent({
            event_type: 'module_version_forked',
            entity_type: 'module_version',
            entity_id: version.id,
            entity_label: `${version.module_title} v${version.version_number}`,
            metadata: { module_id: version.module_id, version_number: version.version_number },
          });
        }
      },
      setPublished: () => {
        const state = get();
        const blockers = state.getPublishBlockers();

        if (blockers.length > 0) {
          return false;
        }

        const moduleState = inferModuleState({
          currentDraft: state.currentDraft,
          sourceMaterial: state.sourceMaterial,
          setupAnswers: state.setupAnswers,
          outline: state.outline,
          outlineStatus: state.outline_status,
          generatedModule: state.generatedModule,
          critique: state.critique,
          lessonReviews: state.lessonReviews,
          blockerCount: blockers.length,
          publishStatus: state.publishStatus,
        });

        if (moduleState !== 'approved') {
          return false;
        }
        const moduleVersionId = resolvePublishedModuleVersionId(state.currentDraft, state.generatedModule);
        const moduleId = resolvePublishedModuleId(state.currentDraft, state.generatedModule, moduleVersionId);
        const versionNumber = resolvePublishedVersionNumber(state.currentDraft, moduleVersionId);
        const title = state.currentDraft?.title ?? state.generatedModule?.module_title ?? 'HR Basics at Redex';
        const wasAlreadyPublished = state.publishStatus === 'published';
        const moduleVersion = useModuleVersionsStore.getState().registerVersion({
          module_id: moduleId,
          module_title: title,
          version_number: versionNumber,
          status: 'published',
          approved_by: MOCK_ADMIN_USER.id,
          published_by: MOCK_ADMIN_USER.id,
          source_binder_version: state.currentDraft?.source_binder_version ?? 'sbv-1',
          assessment_version: state.currentDraft?.assessment_version ?? 'av-1',
        });

        usePublishedModulesStore.getState().registerPublishedModule({
          module_version_id: moduleVersion.id,
          title,
          published_by: MOCK_ADMIN_USER.id,
        });

        set({ publishStatus: 'published', publishedAt: moduleVersion.published_at ?? new Date().toISOString() });

        if (!wasAlreadyPublished) {
          recordAuditEvent({
            event_type: 'module_published',
            entity_type: 'module_version',
            entity_id: moduleVersion.id,
            entity_label: `${title} v${versionNumber}`,
            metadata: { module_id: moduleId, version_number: versionNumber },
          });
        }

        return true;
      },
      setCritique: (report) => {
        const wasMissingCritique = get().critique === null;
        set({ critique: report, ...resetPublishState });

        if (wasMissingCritique) {
          recordAuditEvent({
            event_type: 'self_critique_completed',
            entity_type: 'module',
            entity_id: resolveDraftModuleId(report.module_title, get().currentDraft),
            entity_label: report.module_title,
            metadata: { issue_count: report.issues.length, blocks_publish: report.blocks_publish },
          });
        }
      },
      setLessonReviews: (items) => set({ lessonReviews: items, ...resetPublishState }),
      clearLessonReviews: () => set({ lessonReviews: [], ...resetPublishState }),
      approveLessonReview: (lessonIdx, moduleIdx) => {
        const priorReview = get().lessonReviews.find(
          (item) => item.lesson_index === lessonIdx && item.module_index === moduleIdx,
        );

        set((state) => ({
          lessonReviews: state.lessonReviews.map((item) =>
            item.lesson_index === lessonIdx && item.module_index === moduleIdx
              ? { ...item, status: 'approved' }
              : item
          ),
          ...resetPublishState,
        }));

        if (priorReview && priorReview.status !== 'approved') {
          recordAuditEvent({
            event_type: 'lesson_approved',
            entity_type: 'lesson',
            entity_id: `${priorReview.module_index}-${priorReview.lesson_index}`,
            entity_label: priorReview.lesson_title,
            metadata: { module_index: priorReview.module_index, lesson_index: priorReview.lesson_index },
          });
        }
      },
      rejectLessonReview: (lessonIdx, moduleIdx) =>
        set((state) => ({
          lessonReviews: state.lessonReviews.map((item) =>
            item.lesson_index === lessonIdx && item.module_index === moduleIdx
              ? { ...item, status: 'needs_regeneration' }
              : item
          ),
          ...resetPublishState,
        })),
      isPublishBlocked: () =>
        get().lessonReviews.some(
          (item) => item.has_unsupported_claim && item.status !== 'approved'
        ),
      getPublishBlockers: () => {
        const state = get();
        const blockers: PublishBlocker[] = [];

        const sourceSections = state.sourceMaterial?.sections ?? [];
        for (const section of sourceSections) {
          if (!section.has_placeholders) {
            continue;
          }

          blockers.push({
            id: `source-placeholder-${section.id}`,
            source: 'source_placeholder',
            severity: 'blocker',
            location:
              section.heading.trim() !== ''
                ? `Source section: ${section.heading}`
                : `Source section #${section.position_index + 1}`,
            summary: 'Source section contains placeholder content that must be resolved.',
            detail: section.body.slice(0, 200) || 'Section body is empty.',
            resolve_route: '/admin/foundry/source',
          });
        }

        const critiqueIssues = state.critique?.issues ?? [];
        for (const issue of critiqueIssues) {
          if (issue.severity !== 'high' || issue.ignored) {
            continue;
          }

          blockers.push({
            id: `critique-${issue.id}`,
            source: 'critique_high_severity',
            severity: 'blocker',
            location: issue.lesson_title ?? 'Critique review',
            summary: issue.summary,
            detail: issue.detail,
            resolve_route: '/admin/foundry/critique',
          });
        }

        for (const review of state.lessonReviews) {
          if (!review.has_unsupported_claim || review.status === 'approved') {
            continue;
          }

          blockers.push({
            id: `lesson-unsupported-${review.lesson_index}-${review.module_index}`,
            source: 'lesson_unsupported_claim',
            severity: 'blocker',
            location: review.lesson_title,
            summary: 'Lesson has an unsupported claim pending resolution.',
            detail: review.unsupported_note,
            resolve_route: '/admin/foundry/sidebyside',
          });
        }

        return blockers;
      },
      clearCritique: () => set({ critique: null, ...resetPublishState }),
      ignoreIssue: (issueId, note) =>
        set((state) => {
          if (state.critique === null) {
            return state;
          }

          const issues = state.critique.issues.map((issue) =>
            issue.id === issueId
              ? {
                  ...issue,
                  ignored: true,
                  ignored_note: note,
                }
              : issue
          );

          return {
            critique: {
              ...state.critique,
              issues,
              blocks_publish: issues.some((issue) => issue.severity === 'high' && !issue.ignored),
            },
            ...resetPublishState,
          };
        }),
      unignoreIssue: (issueId) =>
        set((state) => {
          if (state.critique === null) {
            return state;
          }

          const issues = state.critique.issues.map((issue) =>
            issue.id === issueId
              ? {
                  ...issue,
                  ignored: false,
                  ignored_note: undefined,
                }
              : issue
          );

          return {
            critique: {
              ...state.critique,
              issues,
              blocks_publish: issues.some((issue) => issue.severity === 'high' && !issue.ignored),
            },
            ...resetPublishState,
          };
        }),
      setSourceMaterial: (material) => {
        const wasMissingSource = get().sourceMaterial === null;
        set({ sourceMaterial: material, ...resetPublishState });

        if (wasMissingSource) {
          recordAuditEvent({
            event_type: 'source_uploaded',
            entity_type: 'source_file',
            entity_id: material.id,
            entity_label: material.title,
            metadata: { source_type: material.type },
          });
        }
      },
      clearSourceMaterial: () => set({ sourceMaterial: null, ...resetPublishState }),
      setSetupAnswers: (input) =>
        set({
          setupAnswers: {
            ...input,
            updated_at: new Date().toISOString(),
          },
          ...resetPublishState,
        }),
      clearSetupAnswers: () => set({ setupAnswers: null, ...resetPublishState }),
      setOutline: (draft) => {
        const wasMissingOutline = get().outline === null;
        set({
          outline: draft,
          outline_status: 'draft',
          ...resetPublishState,
        });

        if (wasMissingOutline) {
          const lessonCount = draft.modules.reduce((total, module) => total + module.lessons.length, 0);
          recordAuditEvent({
            event_type: 'outline_generated',
            entity_type: 'module',
            entity_id: resolveDraftModuleId(draft.course_title, get().currentDraft),
            entity_label: draft.course_title,
            metadata: { modules: draft.modules.length, lessons: lessonCount },
          });
        }
      },
      approveOutline: () => {
        const state = get();
        const shouldRecord = state.outline !== null && state.outline_status !== 'approved';

        set((currentState) =>
          currentState.outline === null
            ? currentState
            : {
                outline_status: 'approved',
              }
        );

        if (shouldRecord && state.outline) {
          recordAuditEvent({
            event_type: 'outline_approved',
            entity_type: 'module',
            entity_id: resolveDraftModuleId(state.outline.course_title, state.currentDraft),
            entity_label: state.outline.course_title,
          });
        }
      },
      clearOutline: () =>
        set({
          outline: null,
          outline_status: 'draft',
          ...resetPublishState,
        }),
      regenerateOutlineStart: () => set({ outline_status: 'regenerating', ...resetPublishState }),
      setGeneratedModule: (preview) => {
        const wasMissingModule = get().generatedModule === null;
        set({ generatedModule: preview, ...resetPublishState });

        if (wasMissingModule) {
          recordAuditEvent({
            event_type: 'module_generated',
            entity_type: 'module',
            entity_id: resolveDraftModuleId(preview.module_title, get().currentDraft),
            entity_label: preview.module_title,
            metadata: { lessons: preview.lessons.length },
          });
        }
      },
      clearGeneratedModule: () => set({ generatedModule: null, ...resetPublishState }),
      updateLessonStatus: (lessonIdx, moduleIdx, status) =>
        set((state) => {
          if (state.generatedModule === null) {
            return state;
          }

          return {
            generatedModule: {
              ...state.generatedModule,
              lessons: state.generatedModule.lessons.map((lesson) =>
                lesson.lesson_index === lessonIdx && lesson.module_index === moduleIdx
                  ? { ...lesson, status }
                  : lesson
              ),
            },
            ...resetPublishState,
          };
        }),
      toggleLibraryFile: (driveFileId) =>
        set((state) => ({
          selectedLibraryFileIds: state.selectedLibraryFileIds.includes(driveFileId)
            ? state.selectedLibraryFileIds.filter((selectedId) => selectedId !== driveFileId)
            : [...state.selectedLibraryFileIds, driveFileId],
          ...resetPublishState,
        })),
      clearLibrarySelection: () => set({ selectedLibraryFileIds: [], ...resetPublishState }),
    }),
    {
      name: 'redex-foundry-draft-v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
