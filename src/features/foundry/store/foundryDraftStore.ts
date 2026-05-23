import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  CourseOutlineDraft,
  GeneratedModulePreview,
  LessonGenerationStatus,
  SetupAnswers,
  SourceMaterial,
} from '@/lib/education';
import type { SetupAnswersInput } from '../schemas/foundrySchemas';
import type { ModuleBasicsDraft, ModuleBasicsFormValues } from '../types';

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
    (set) => ({
      currentDraft: null,
      sourceMaterial: null,
      setupAnswers: null,
      outline: null,
      outline_status: 'draft',
      generatedModule: null,
      selectedLibraryFileIds: [],
      setBasics: (values) =>
        set({
          currentDraft: {
            ...values,
            updated_at: new Date().toISOString(),
          },
        }),
      clearDraft: () => set({ currentDraft: null }),
      setSourceMaterial: (material) => set({ sourceMaterial: material }),
      clearSourceMaterial: () => set({ sourceMaterial: null }),
      setSetupAnswers: (input) =>
        set({
          setupAnswers: {
            ...input,
            updated_at: new Date().toISOString(),
          },
        }),
      clearSetupAnswers: () => set({ setupAnswers: null }),
      setOutline: (draft) =>
        set({
          outline: draft,
          outline_status: 'draft',
        }),
      approveOutline: () =>
        set((state) =>
          state.outline === null
            ? state
            : {
                outline_status: 'approved',
              }
        ),
      clearOutline: () =>
        set({
          outline: null,
          outline_status: 'draft',
        }),
      regenerateOutlineStart: () => set({ outline_status: 'regenerating' }),
      setGeneratedModule: (preview) => set({ generatedModule: preview }),
      clearGeneratedModule: () => set({ generatedModule: null }),
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
          };
        }),
      toggleLibraryFile: (driveFileId) =>
        set((state) => ({
          selectedLibraryFileIds: state.selectedLibraryFileIds.includes(driveFileId)
            ? state.selectedLibraryFileIds.filter((selectedId) => selectedId !== driveFileId)
            : [...state.selectedLibraryFileIds, driveFileId],
        })),
      clearLibrarySelection: () => set({ selectedLibraryFileIds: [] }),
    }),
    {
      name: 'redex-foundry-draft-v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
