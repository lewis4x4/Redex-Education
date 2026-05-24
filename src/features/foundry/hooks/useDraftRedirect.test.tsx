import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

function createStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

describe('useDraftRedirect', () => {
  let useFoundryDraftStore: (typeof import('@/features/foundry/store/foundryDraftStore'))['useFoundryDraftStore'];
  let useDraftRedirect: (typeof import('./useDraftRedirect'))['useDraftRedirect'];

  beforeEach(async () => {
    vi.resetModules();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    });

    ({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'));
    ({ useDraftRedirect } = await import('./useDraftRedirect'));

    act(() => {
      useFoundryDraftStore.getState().resetFoundryDraft();
    });
  });

  function GuardedPage() {
    useDraftRedirect('preview');
    return <div>Preview page</div>;
  }

  it('redirects to start when draft is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/foundry/preview']}>
        <Routes>
          <Route path="/admin/foundry/preview" element={<GuardedPage />} />
          <Route path="/admin/foundry/start" element={<div>Start page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Start page')).toBeInTheDocument();
  });

  it('redirects to questions when source exists but setup answers are missing', async () => {
    act(() => {
      useFoundryDraftStore.getState().setBasics({
        title: 'Safety Basics',
        parent_course_id: 'standalone',
        audience_archetype: 'new_hire',
        audience_refinement: '',
        completion_required: 'recommended',
        training_type: 'safety',
        learning_outcomes: [{ id: 'outcome-1', text: 'Apply safe work practices in daily tasks' }],
        estimated_minutes: 30,
      });
      useFoundryDraftStore.getState().setSourceMaterial({
        id: 'source-1',
        title: 'Source',
        type: 'markdown',
        raw_text: '# Source',
        processing_status: 'processed',
        sections: [],
      });
    });

    render(
      <MemoryRouter initialEntries={['/admin/foundry/preview']}>
        <Routes>
          <Route path="/admin/foundry/preview" element={<GuardedPage />} />
          <Route path="/admin/foundry/questions" element={<div>Questions page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Questions page')).toBeInTheDocument();
  });
});
