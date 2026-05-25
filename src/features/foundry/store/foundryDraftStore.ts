import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  CourseOutlineDraft,
  FoundryDraftStage,
  GeneratedModulePreview,
  Lesson,
  LessonGenerationStatus,
  LessonReviewItem,
  OrderingStep,
  PublishBlocker,
  SelfCritiqueReport,
  SetupAnswers,
  SourceMaterial,
} from '@/lib/education';
import { useAuditLogStore } from '@/features/audit/store/auditLogStore';
import { stableClientUUID } from '@/integrations/supabase/mutations/_idempotency';
import { getDataSource } from '@/lib/education/dataSource';
import { toWriteError, type WriteError } from '@/lib/education/writeErrors';
import { inferResumeRoute, type FoundryResumeRoute } from '@/features/foundry/lib/resumeRoute';
import { inferModuleState } from '@/features/publishing/lib/moduleStates';
import { useModuleVersionsStore } from '@/features/publishing/store/moduleVersionsStore';
import { usePublishedModulesStore } from '@/features/publishing/store/publishedModulesStore';
import type { SetupAnswersInput } from '../schemas/foundrySchemas';
import type { BrainstormedPacket } from '@/features/foundry/ai/courseFoundryAiClient';
import type { ModuleBasicsDraft, ModuleBasicsFormValues } from '../types';
import type { AuditLog, FoundryDraftMetadata, LearningOutcome, ModuleVersion, UUID } from '@/lib/education';

const DEFAULT_MODULE_VERSION_ID = 'module-version-hr-basics-v1';

type MaybeModuleVersionCarrier = {
  id?: unknown;
  module_version_id?: unknown;
};

export interface FoundryResumeAdminItem {
  module_version_id: string;
  module_id: string;
  module_title: string;
  version_number: number;
  draft_metadata?: ModuleVersion['draft_metadata'];
}

type DraftMetadataSnapshot = {
  current_stage: FoundryDraftStage;
  last_actor?: { user_id: UUID; display_name: string };
  module_version_id?: string;
  module_id?: string;
  module_title?: string;
  basics?: FoundryDraftMetadata['basics'];
  sourceMaterial?: SourceMaterial | null;
  selectedLibraryFileIds?: string[];
  setupAnswers?: SetupAnswers | null;
  outline_status?: 'draft' | 'approved' | 'regenerating';
  publishStatus?: FoundryPublishStatus;
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
  if (currentDraft?.persisted_module_id) {
    return currentDraft.persisted_module_id;
  }

  if (currentDraft?.module_id) {
    return currentDraft.module_id;
  }

  if (title.trim().toLowerCase() === 'hr basics at redex' || title.trim() === '') {
    return 'hr-basics-mod-001';
  }

  return `${slugifyModuleTitle(title)}-mod-001`;
}

function resolveCourseIdForWrite(currentDraft: ModuleBasicsDraft | null, fallbackTitle: string): string {
  if (currentDraft?.persisted_course_id) {
    return currentDraft.persisted_course_id;
  }

  if (currentDraft?.parent_course_id && currentDraft.parent_course_id !== 'standalone') {
    return currentDraft.parent_course_id;
  }

  return slugifyModuleTitle(currentDraft?.title ?? fallbackTitle);
}

function hasValidOrderingSteps(steps: OrderingStep[] | undefined): steps is [OrderingStep, OrderingStep, ...OrderingStep[]] {
  if (!steps || steps.length < 2) {
    return false;
  }

  const stepIds = new Set<string>();

  return steps.every((step) => {
    const stepId = step.id.trim();
    const hasRequiredFields = stepId.length > 0 && step.label.trim().length > 0;
    const isDuplicate = stepIds.has(stepId);
    stepIds.add(stepId);

    return hasRequiredFields && !isDuplicate;
  });
}

function invalidOrderingLessonReviewText(lesson: GeneratedModulePreview['lessons'][number]): string {
  return [
    lesson.body_markdown,
    lesson.status_note,
    '⚠️ This generated drag-to-order lesson needs review because it did not include at least two valid, uniquely identified ordering steps.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function generatedLessonContent(lesson: GeneratedModulePreview['lessons'][number]): Lesson['content'] {
  if (lesson.lesson_type === 'quiz') {
    return { type: 'quiz', questions: lesson.quiz_questions ?? [] };
  }

  if (lesson.lesson_type === 'acknowledgment') {
    return { type: 'acknowledgment', statement_markdown: lesson.acknowledgment_text ?? lesson.body_markdown ?? '' };
  }

  if (lesson.lesson_type === 'drag_to_order') {
    if (hasValidOrderingSteps(lesson.ordering_steps)) {
      return { type: 'drag_to_order', intro_markdown: lesson.body_markdown, steps: lesson.ordering_steps };
    }

    return { type: 'text', body_markdown: invalidOrderingLessonReviewText(lesson) };
  }

  if (lesson.lesson_type === 'video') {
    return {
      type: 'video',
      video_url: lesson.video_url ?? '#',
      duration_seconds: lesson.duration_seconds,
      transcript_markdown: lesson.transcript_markdown ?? lesson.video_script_markdown ?? lesson.body_markdown,
      poster_url: lesson.poster_url,
      media_asset_id: lesson.media_asset_id,
      media_provider: lesson.media_provider,
      media_status: lesson.media_status,
      download_url: lesson.download_url,
      downloads: lesson.downloads,
      provenance: lesson.provenance,
      chapters: lesson.chapters ?? lesson.video_chapters,
      transcript_segments: lesson.transcript_segments ?? lesson.video_transcript_segments,
      checkpoints: lesson.checkpoints ?? lesson.video_checkpoints,
    };
  }

  return { type: lesson.lesson_type, body_markdown: lesson.body_markdown ?? '' } as Lesson['content'];
}

function generatedLessonsToDomain(preview: GeneratedModulePreview, moduleId: string): Lesson[] {
  return preview.lessons.map((lesson) => ({
    id: `${moduleId}-lesson-${lesson.module_index}-${lesson.lesson_index}`,
    module_id: moduleId,
    title: lesson.title,
    lesson_type: lesson.lesson_type,
    criticality: 'required',
    order_index: lesson.lesson_index,
    estimated_minutes: 5,
    content: generatedLessonContent(lesson),
  }));
}

function shouldPersistToSupabase(): boolean {
  return getDataSource() === 'supabase';
}

export interface ActorInfo {
  userId: UUID;
  displayName: string;
}

const SYSTEM_ACTOR: ActorInfo = {
  userId: 'system',
  displayName: 'Redex system',
};

function createLearningOutcome(overrides?: Partial<LearningOutcome>): LearningOutcome {
  return {
    id: overrides?.id ?? `outcome-${Math.random().toString(36).slice(2, 10)}`,
    text: overrides?.text ?? '',
  };
}

const DEFAULT_BASICS_VALUES = {
  audience_archetype: 'new_hire' as const,
  audience_refinement: '',
  completion_required: 'recommended' as const,
  training_type: 'general_informational' as const,
  estimated_minutes: 30,
};

function normalizeLearningOutcomes(outcomes?: LearningOutcome[]): LearningOutcome[] {
  if (!outcomes || outcomes.length === 0) {
    return [createLearningOutcome()];
  }

  return outcomes.slice(0, 3).map((outcome) => createLearningOutcome(outcome));
}

function toAuditActor(actor?: ActorInfo) {
  const resolved = actor ?? SYSTEM_ACTOR;

  return {
    actor_user_id: resolved.userId,
    actor_name: resolved.displayName,
  };
}

function recordAuditEvent(
  input: Omit<AuditLog, 'id' | 'occurred_at' | 'actor_user_id' | 'actor_name'>,
  actor?: ActorInfo,
) {
  useAuditLogStore.getState().recordEvent({
    ...toAuditActor(actor),
    ...input,
  });
}

function hydrateFromDraftMetadata(snapshot: DraftMetadataSnapshot, item: FoundryResumeAdminItem) {
  const basics = snapshot.basics;

  useFoundryDraftStore.setState((state) => ({
    currentDraft: {
      id: item.module_version_id,
      module_id: item.module_id,
      version_number: item.version_number,
      title: item.module_title,
      parent_course_id: 'standalone',
      audience_archetype: basics?.audience_archetype ?? DEFAULT_BASICS_VALUES.audience_archetype,
      audience_refinement: basics?.audience_refinement ?? DEFAULT_BASICS_VALUES.audience_refinement,
      completion_required: basics?.completion_required ?? DEFAULT_BASICS_VALUES.completion_required,
      training_type: basics?.training_type ?? DEFAULT_BASICS_VALUES.training_type,
      learning_outcomes: normalizeLearningOutcomes(basics?.learning_outcomes),
      estimated_minutes: basics?.estimated_minutes ?? DEFAULT_BASICS_VALUES.estimated_minutes,
      updated_at: new Date().toISOString(),
    },
    sourceMaterial: snapshot.sourceMaterial ?? state.sourceMaterial,
    selectedLibraryFileIds: snapshot.selectedLibraryFileIds ?? state.selectedLibraryFileIds,
    setupAnswers: snapshot.setupAnswers ?? state.setupAnswers,
    outline_status: snapshot.outline_status ?? state.outline_status,
    publishStatus: snapshot.publishStatus ?? state.publishStatus,
    lastWriteError: null,
  }))
}

export type FoundryPublishStatus = 'draft' | 'ready_to_publish' | 'published';

export type PacketDraftStatus = 'drafting' | 'reviewing' | 'accepted' | 'discarded' | 'failed';

export interface PacketDraftIntakeStatus {
  status: 'queued' | 'uploading_to_drive' | 'drive_uploaded' | 'registering' | 'registered' | 'upload_failed' | 'registration_failed' | 'sync_failed';
  proposal_id: string;
  job_id: string;
  proposal_status: string;
  job_status: string;
  last_error_message?: string;
  drive_folder_id?: string;
  library_drive_folder_id?: string;
  module_drive_folder_id?: string;
  manifest_drive_file_id?: string;
  files?: Array<{ filename?: string; drive_file_id?: string }>;
}

export interface PacketDraftState {
  topic: string;
  status: PacketDraftStatus;
  packet?: BrainstormedPacket;
  last_error_message?: string;
  intake_status?: PacketDraftIntakeStatus;
}

const resetPublishState = {
  publishStatus: 'draft' as FoundryPublishStatus,
  publishedAt: null,
};

interface FoundryDraftState {
  /** The current working draft, or null if none */
  currentDraft: ModuleBasicsDraft | null;
  /** Last async Supabase write failure; mock mode never sets this. */
  lastWriteError: WriteError | null;
  /** Topic-to-packet proposal state for automated module intake. */
  packetDraft: PacketDraftState | null;
  setPacketDraft: (packetDraft: PacketDraftState | null) => void;
  clearPacketDraft: () => void;
  clearLastWriteError: () => void;
  persistDraftStage: (stage: FoundryDraftStage, actor?: ActorInfo) => Promise<ModuleVersion | null>;
  /** Save form values as the draft (sets updated_at) */
  setBasics: (values: ModuleBasicsFormValues, actor?: ActorInfo) => void;
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
  setCritique: (report: SelfCritiqueReport, actor?: ActorInfo) => void;
  /** Publish lifecycle for the current Foundry draft */
  publishStatus: FoundryPublishStatus;
  /** ISO timestamp when the module was published, if published */
  publishedAt: string | null;
  /** Mark module published when no publish blockers remain; returns true when published. */
  setPublished: (actor?: ActorInfo) => boolean;
  /** Reset publish lifecycle back to draft */
  resetPublishStatus: () => void;
  /** Reset the full Foundry draft flow back to an empty draft */
  resetFoundryDraft: () => void;
  /** Seed a new working draft from a forked module version. */
  seedDraftFromModuleVersion: (version: ModuleVersion, actor?: ActorInfo) => void;
  /** Resume a dashboard draft, preserving state when it already matches the active draft. */
  resumeDraftFromAdminItem: (item: FoundryResumeAdminItem) => FoundryResumeRoute;
  /** Side-by-side review state for generated lessons */
  lessonReviews: LessonReviewItem[];
  /** Overwrite lesson review state */
  setLessonReviews: (items: LessonReviewItem[]) => void;
  /** Clear lesson review state */
  clearLessonReviews: () => void;
  /** Mark one lesson review item approved by lesson/module indices */
  approveLessonReview: (lessonIdx: number, moduleIdx: number, actor?: ActorInfo) => void;
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
  setSourceMaterial: (material: SourceMaterial, actor?: ActorInfo) => void;
  /** Clear source material draft */
  clearSourceMaterial: () => void;
  /** Save setup-question answers as the draft (sets updated_at) */
  setSetupAnswers: (input: SetupAnswersInput) => void;
  /** Clear setup-question answers draft */
  clearSetupAnswers: () => void;
  /** Set generated outline and reset status to draft */
  setOutline: (draft: CourseOutlineDraft, actor?: ActorInfo) => void;
  /** Mark current outline approved (no-op when no outline exists) */
  approveOutline: (actor?: ActorInfo) => void;
  /** Clear current outline and reset status */
  clearOutline: () => void;
  /** Set regenerating status for simulated loading */
  regenerateOutlineStart: () => void;
  /** Set generated module preview */
  setGeneratedModule: (preview: GeneratedModulePreview, actor?: ActorInfo) => void;
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
      lastWriteError: null,
      packetDraft: null,
      setPacketDraft: (packetDraft) => set({ packetDraft }),
      clearPacketDraft: () => set({ packetDraft: null }),
      clearLastWriteError: () => set({ lastWriteError: null }),
      persistDraftStage: async (stage, actor) => {
        if (!shouldPersistToSupabase()) {
          return null;
        }

        const state = get();
        const moduleTitle = state.currentDraft?.title;

        if (!moduleTitle) {
          return null;
        }

        try {
          const { upsertModuleDraft } = await import('@/lib/education/moduleVersions')
          const persisted = await upsertModuleDraft({
            module_id: state.currentDraft?.module_id,
            module_title: moduleTitle,
            current_stage: stage,
            actor: actor ? { user_id: actor.userId, display_name: actor.displayName } : undefined,
            basics: state.currentDraft
              ? {
                audience_archetype: state.currentDraft.audience_archetype,
                audience_refinement: state.currentDraft.audience_refinement,
                completion_required: state.currentDraft.completion_required,
                training_type: state.currentDraft.training_type,
                estimated_minutes: state.currentDraft.estimated_minutes,
                learning_outcomes: state.currentDraft.learning_outcomes,
              }
              : undefined,
          })

          set((currentState) => ({
            currentDraft: currentState.currentDraft
              ? {
                ...currentState.currentDraft,
                id: persisted.id,
                module_id: persisted.module_id,
                version_number: persisted.version_number,
              }
              : currentState.currentDraft,
            lastWriteError: null,
          }))

          return persisted
        } catch (error: unknown) {
          set({ lastWriteError: toWriteError('persistDraftStage', error) })
          return null
        }
      },
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
      setBasics: (values, actor) => {
        const state = get();
        const wasNewDraft = state.currentDraft === null;
        const moduleId = resolveDraftModuleId(values.title);
        const previousDraft = state.currentDraft;

        const currentDraft = {
          ...values,
          audience_archetype: values.audience_archetype ?? DEFAULT_BASICS_VALUES.audience_archetype,
          audience_refinement: values.audience_refinement ?? DEFAULT_BASICS_VALUES.audience_refinement,
          completion_required: values.completion_required ?? DEFAULT_BASICS_VALUES.completion_required,
          learning_outcomes: normalizeLearningOutcomes(values.learning_outcomes),
          updated_at: new Date().toISOString(),
        };

        const didMaterialBasicsChange =
          !previousDraft ||
          previousDraft.title !== currentDraft.title ||
          previousDraft.audience_archetype !== currentDraft.audience_archetype ||
          (previousDraft.audience_refinement ?? '') !== (currentDraft.audience_refinement ?? '') ||
          previousDraft.completion_required !== currentDraft.completion_required ||
          previousDraft.training_type !== currentDraft.training_type ||
          JSON.stringify(previousDraft.learning_outcomes) !== JSON.stringify(currentDraft.learning_outcomes);

        set((priorState) => ({
          currentDraft,
          ...resetPublishState,
          ...(didMaterialBasicsChange
            ? {
              outline: null,
              generatedModule: null,
              critique: null,
              lessonReviews: [],
              outline_status: 'draft' as const,
            }
            : { outline_status: priorState.outline_status }),
        }));

        if (shouldPersistToSupabase()) {
          void import('@/integrations/supabase/mutations')
            .then(({ createModuleDraft }) => createModuleDraft(currentDraft))
            .then((course) =>
              set((state) => ({
                currentDraft: state.currentDraft
                  ? { ...state.currentDraft, persisted_course_id: course.id, parent_course_id: course.id }
                  : state.currentDraft,
                lastWriteError: null,
              })),
            )
            .catch((error: unknown) => set({ lastWriteError: toWriteError('setBasics', error) }));
        }

        void get().persistDraftStage('basics', actor)

        if (wasNewDraft) {
          recordAuditEvent({
            event_type: 'module_created',
            entity_type: 'module',
            entity_id: moduleId,
            entity_label: values.title,
          }, actor);
        }
      },
        clearDraft: () => set({ currentDraft: null, packetDraft: null, lastWriteError: null, ...resetPublishState }),
      resetPublishStatus: () => set(resetPublishState),
      resetFoundryDraft: () =>
        set({
          currentDraft: null,
          packetDraft: null,
          lastWriteError: null,
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
      seedDraftFromModuleVersion: (version, actor) => {
        const basics = version.draft_metadata?.basics;

        set({
          lastWriteError: null,
          currentDraft: {
            id: version.id,
            module_id: version.module_id,
            version_number: version.version_number,
            source_binder_version: version.source_binder_version,
            assessment_version: version.assessment_version,
            title: version.module_title,
            parent_course_id: 'standalone',
            audience_archetype: basics?.audience_archetype ?? DEFAULT_BASICS_VALUES.audience_archetype,
            audience_refinement: basics?.audience_refinement ?? DEFAULT_BASICS_VALUES.audience_refinement,
            completion_required: basics?.completion_required ?? DEFAULT_BASICS_VALUES.completion_required,
            training_type: basics?.training_type ?? DEFAULT_BASICS_VALUES.training_type,
            learning_outcomes: normalizeLearningOutcomes(basics?.learning_outcomes),
            estimated_minutes: basics?.estimated_minutes ?? DEFAULT_BASICS_VALUES.estimated_minutes,
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
          }, actor);
        }
      },
      resumeDraftFromAdminItem: (item) => {
        const state = get();
        const draft = state.currentDraft;
        const matchesCurrentDraft =
          draft !== null &&
          (draft.id === item.module_version_id ||
            (draft.module_id === item.module_id && draft.version_number === item.version_number));

        if (matchesCurrentDraft) {
          return inferResumeRoute({ ...state, draft_metadata: item.draft_metadata });
        }

        const dashboardBasics = item.draft_metadata?.basics;

        set({
          lastWriteError: null,
          currentDraft: {
            id: item.module_version_id,
            module_id: item.module_id,
            version_number: item.version_number,
            title: item.module_title,
            parent_course_id: 'standalone',
            audience_archetype: dashboardBasics?.audience_archetype ?? DEFAULT_BASICS_VALUES.audience_archetype,
            audience_refinement: dashboardBasics?.audience_refinement ?? DEFAULT_BASICS_VALUES.audience_refinement,
            completion_required: dashboardBasics?.completion_required ?? DEFAULT_BASICS_VALUES.completion_required,
            training_type: dashboardBasics?.training_type ?? DEFAULT_BASICS_VALUES.training_type,
            learning_outcomes: normalizeLearningOutcomes(dashboardBasics?.learning_outcomes),
            estimated_minutes: dashboardBasics?.estimated_minutes ?? DEFAULT_BASICS_VALUES.estimated_minutes,
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

        if (shouldPersistToSupabase()) {
          void import('@/integrations/supabase/queries/moduleVersions')
            .then(({ fetchDraftByModuleVersionId }) => fetchDraftByModuleVersionId(item.module_version_id))
            .then((draftRow) => {
              const metadata = draftRow?.draft_metadata as DraftMetadataSnapshot | undefined

              if (!metadata) {
                console.warn('[foundryDraftStore] resumeDraftFromAdminItem missing draft_metadata.basics; using defaults', {
                  module_version_id: item.module_version_id,
                });
                return
              }

              hydrateFromDraftMetadata(metadata, item)
            })
            .catch((error: unknown) => set({ lastWriteError: toWriteError('resumeDraftFromAdminItem', error) }))
        }

        return inferResumeRoute({ ...get(), draft_metadata: item.draft_metadata });
      },
      setPublished: (actor) => {
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
          approved_by: (actor ?? SYSTEM_ACTOR).userId,
          published_by: (actor ?? SYSTEM_ACTOR).userId,
          source_binder_version: state.currentDraft?.source_binder_version ?? 'sbv-1',
          assessment_version: state.currentDraft?.assessment_version ?? 'av-1',
        });

        usePublishedModulesStore.getState().registerPublishedModule({
          module_version_id: moduleVersion.id,
          title,
          published_by: (actor ?? SYSTEM_ACTOR).userId,
        });

        set({ publishStatus: 'published', publishedAt: moduleVersion.published_at ?? new Date().toISOString() });
        void get().persistDraftStage('published', actor)

        if (shouldPersistToSupabase()) {
          void import('@/integrations/supabase/mutations')
            .then(({ publishModuleVersion }) =>
              publishModuleVersion({
                course_id: resolveCourseIdForWrite(state.currentDraft, title),
                module_id: moduleId,
                approved_by: (actor ?? SYSTEM_ACTOR).userId,
              }),
            )
            .then(() => set({ lastWriteError: null }))
            .catch((error: unknown) => set({ lastWriteError: toWriteError('setPublished', error) }));
        }

        if (!wasAlreadyPublished) {
          recordAuditEvent({
            event_type: 'module_published',
            entity_type: 'module_version',
            entity_id: moduleVersion.id,
            entity_label: `${title} v${versionNumber}`,
            metadata: { module_id: moduleId, version_number: versionNumber },
          }, actor);
        }

        return true;
      },
      setCritique: (report, actor) => {
        const wasMissingCritique = get().critique === null;
        set({ critique: report, ...resetPublishState });

        void get().persistDraftStage('critique', actor)

        if (wasMissingCritique) {
          recordAuditEvent({
            event_type: 'self_critique_completed',
            entity_type: 'module',
            entity_id: resolveDraftModuleId(report.module_title, get().currentDraft),
            entity_label: report.module_title,
            metadata: { issue_count: report.issues.length, blocks_publish: report.blocks_publish },
          }, actor);
        }
      },
      setLessonReviews: (items) => {
        set({ lessonReviews: items, ...resetPublishState })
        void get().persistDraftStage('sidebyside')
      },
      clearLessonReviews: () => set({ lessonReviews: [], ...resetPublishState }),
      approveLessonReview: (lessonIdx, moduleIdx, actor) => {
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
          }, actor);
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
      setSourceMaterial: (material, actor) => {
        const state = get();
        const wasMissingSource = state.sourceMaterial === null;
        set({ sourceMaterial: material, ...resetPublishState });

        if (shouldPersistToSupabase()) {
          void import('@/integrations/supabase/mutations')
            .then(({ saveSourceMaterial }) =>
              saveSourceMaterial({
                course_id: resolveCourseIdForWrite(state.currentDraft, material.title),
                material,
              }),
            )
            .then(() => set({ lastWriteError: null }))
            .catch((error: unknown) => set({ lastWriteError: toWriteError('setSourceMaterial', error) }));
        }

        void get().persistDraftStage('source', actor)

        if (wasMissingSource) {
          recordAuditEvent({
            event_type: 'source_uploaded',
            entity_type: 'source_file',
            entity_id: material.id,
            entity_label: material.title,
            metadata: { source_type: material.type },
          }, actor);
        }
      },
      clearSourceMaterial: () => set({ sourceMaterial: null, ...resetPublishState }),
      setSetupAnswers: (input) => {
        const answers = {
          ...input,
          updated_at: new Date().toISOString(),
        };

        set({
          setupAnswers: answers,
          ...resetPublishState,
        });

        if (shouldPersistToSupabase()) {
          void import('@/integrations/supabase/mutations')
            .then(({ saveSetupAnswers }) =>
              saveSetupAnswers({
                course_id: resolveCourseIdForWrite(get().currentDraft, 'setup-answers'),
                answers,
              }),
            )
            .then(() => set({ lastWriteError: null }))
            .catch((error: unknown) => set({ lastWriteError: toWriteError('setSetupAnswers', error) }));
        }

        void get().persistDraftStage('questions')
      },
      clearSetupAnswers: () => set({ setupAnswers: null, ...resetPublishState }),
      setOutline: (draft, actor) => {
        const state = get();
        const wasMissingOutline = state.outline === null;
        const courseId = resolveCourseIdForWrite(state.currentDraft, draft.course_title);
        const firstPersistedModuleId = draft.modules[0]
          ? stableClientUUID(`training_modules:${courseId}:0:${draft.modules[0].title}`)
          : undefined;
        set((currentState) => ({
          currentDraft:
            currentState.currentDraft && firstPersistedModuleId
              ? { ...currentState.currentDraft, persisted_module_id: firstPersistedModuleId }
              : currentState.currentDraft,
          outline: draft,
          outline_status: 'draft',
          ...resetPublishState,
        }));

        if (shouldPersistToSupabase()) {
          void import('@/integrations/supabase/mutations')
            .then(({ saveGeneratedOutline }) =>
              saveGeneratedOutline({
                course_id: courseId,
                outline: draft,
              }),
            )
            .then((modules) =>
              set((currentState) => ({
                currentDraft:
                  currentState.currentDraft && modules[0]
                    ? { ...currentState.currentDraft, persisted_module_id: modules[0].id }
                    : currentState.currentDraft,
                lastWriteError: null,
              })),
            )
            .catch((error: unknown) => set({ lastWriteError: toWriteError('setOutline', error) }));
        }

        void get().persistDraftStage('outline', actor)

        if (wasMissingOutline) {
          const lessonCount = draft.modules.reduce((total, module) => total + module.lessons.length, 0);
          recordAuditEvent({
            event_type: 'outline_generated',
            entity_type: 'module',
            entity_id: resolveDraftModuleId(draft.course_title, get().currentDraft),
            entity_label: draft.course_title,
            metadata: { modules: draft.modules.length, lessons: lessonCount },
          }, actor);
        }
      },
      approveOutline: (actor) => {
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
          }, actor);
        }
      },
      clearOutline: () =>
        set({
          outline: null,
          outline_status: 'draft',
          ...resetPublishState,
        }),
      regenerateOutlineStart: () => set({ outline_status: 'regenerating', ...resetPublishState }),
      setGeneratedModule: (preview, actor) => {
        const state = get();
        const wasMissingModule = state.generatedModule === null;
        set({ generatedModule: preview, ...resetPublishState });

        if (shouldPersistToSupabase()) {
          const moduleId = resolveDraftModuleId(preview.module_title, state.currentDraft);
          void import('@/integrations/supabase/mutations')
            .then(({ saveGeneratedLessons }) =>
              saveGeneratedLessons({ module_id: moduleId, lessons: generatedLessonsToDomain(preview, moduleId) }),
            )
            .then(() => set({ lastWriteError: null }))
            .catch((error: unknown) => set({ lastWriteError: toWriteError('setGeneratedModule', error) }));
        }

        void get().persistDraftStage('preview', actor)

        if (wasMissingModule) {
          recordAuditEvent({
            event_type: 'module_generated',
            entity_type: 'module',
            entity_id: resolveDraftModuleId(preview.module_title, get().currentDraft),
            entity_label: preview.module_title,
            metadata: { lessons: preview.lessons.length },
          }, actor);
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
