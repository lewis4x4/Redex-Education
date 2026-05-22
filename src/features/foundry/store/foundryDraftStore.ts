import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SourceMaterial } from '@/lib/education';
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
  /** Save parsed source material */
  setSourceMaterial: (material: SourceMaterial) => void;
  /** Clear source material draft */
  clearSourceMaterial: () => void;
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
