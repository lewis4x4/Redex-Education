import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_GENERATED_OUTLINE } from '@/features/foundry/data/mockGeneratedOutline'

function createStorageMock(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
  }
}

describe('useFoundryDraftStore', () => {
  let useFoundryDraftStore: (typeof import('./foundryDraftStore'))['useFoundryDraftStore']

  beforeEach(async () => {
    vi.resetModules()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useFoundryDraftStore } = await import('./foundryDraftStore'))

    act(() => {
      useFoundryDraftStore.getState().clearDraft()
      useFoundryDraftStore.getState().clearSourceMaterial()
      useFoundryDraftStore.getState().clearSetupAnswers()
      useFoundryDraftStore.getState().clearOutline()
      useFoundryDraftStore.getState().clearLibrarySelection()
    })
  })

  it('starts with no current draft', () => {
    expect(useFoundryDraftStore.getState().currentDraft).toBeNull()
  })

  it('setBasics stores form values and sets updated_at timestamp', () => {
    act(() => {
      useFoundryDraftStore.getState().setBasics({
        title: 'Field Safety Refresher',
        parent_course_id: 'standalone',
        audience: 'New hires',
        criticality: 'required',
        training_type: 'safety',
        estimated_minutes: 30,
      })
    })

    const draft = useFoundryDraftStore.getState().currentDraft
    expect(draft).toEqual(
      expect.objectContaining({
        title: 'Field Safety Refresher',
        parent_course_id: 'standalone',
        audience: 'New hires',
        criticality: 'required',
        training_type: 'safety',
        estimated_minutes: 30,
      }),
    )
    expect(typeof draft?.updated_at).toBe('string')
  })

  it('clearDraft resets current draft to null', () => {
    act(() => {
      useFoundryDraftStore.getState().setBasics({
        title: 'Draft to clear',
        parent_course_id: 'standalone',
        audience: 'Field team',
        criticality: 'optional',
        training_type: 'operational',
        estimated_minutes: 20,
      })
    })

    act(() => {
      useFoundryDraftStore.getState().clearDraft()
    })

    expect(useFoundryDraftStore.getState().currentDraft).toBeNull()
  })

  it('persists draft state to localStorage', () => {
    act(() => {
      useFoundryDraftStore.getState().setBasics({
        title: 'Persist me',
        parent_course_id: 'course-001',
        audience: 'Managers',
        criticality: 'required',
        training_type: 'compliance',
        estimated_minutes: 40,
      })
    })

    const persisted = localStorage.getItem('redex-foundry-draft-v1')
    expect(persisted).not.toBeNull()

    const parsed = JSON.parse(persisted as string) as {
      state: { currentDraft: { title: string } }
      version: number
    }

    expect(parsed.version).toBe(0)
    expect(parsed.state.currentDraft.title).toBe('Persist me')
  })

  it('starts with sourceMaterial as null', () => {
    expect(useFoundryDraftStore.getState().sourceMaterial).toBeNull()
  })

  it('setSourceMaterial writes source material state', () => {
    act(() => {
      useFoundryDraftStore.getState().setSourceMaterial({
        id: 'source-1',
        title: 'Source one',
        type: 'markdown',
        raw_text: '# Intro',
        raw_text_preview: '# Intro',
        processing_status: 'processed',
        sections: [],
      })
    })

    expect(useFoundryDraftStore.getState().sourceMaterial).toEqual(
      expect.objectContaining({ id: 'source-1', title: 'Source one', type: 'markdown' }),
    )
  })

  it('clearSourceMaterial resets source material to null', () => {
    act(() => {
      useFoundryDraftStore.getState().setSourceMaterial({
        id: 'source-2',
        title: 'Clear me',
        type: 'markdown',
        processing_status: 'processed',
        sections: [],
      })
    })

    act(() => {
      useFoundryDraftStore.getState().clearSourceMaterial()
    })

    expect(useFoundryDraftStore.getState().sourceMaterial).toBeNull()
  })

  it('clearDraft does not clear sourceMaterial', () => {
    act(() => {
      useFoundryDraftStore.getState().setBasics({
        title: 'Draft',
        parent_course_id: 'standalone',
        audience: 'Ops',
        criticality: 'required',
        training_type: 'operational',
        estimated_minutes: 15,
      })
      useFoundryDraftStore.getState().setSourceMaterial({
        id: 'source-3',
        title: 'Independent source',
        type: 'markdown',
        processing_status: 'processed',
        sections: [],
      })
    })

    act(() => {
      useFoundryDraftStore.getState().clearDraft()
    })

    expect(useFoundryDraftStore.getState().currentDraft).toBeNull()
    expect(useFoundryDraftStore.getState().sourceMaterial).toEqual(
      expect.objectContaining({ id: 'source-3', title: 'Independent source' }),
    )
  })

  it('persists both currentDraft and sourceMaterial in localStorage payload', () => {
    act(() => {
      useFoundryDraftStore.getState().setBasics({
        title: 'Persist draft + source',
        parent_course_id: 'course-001',
        audience: 'Managers',
        criticality: 'required',
        training_type: 'compliance',
        estimated_minutes: 40,
      })
      useFoundryDraftStore.getState().setSourceMaterial({
        id: 'source-4',
        title: 'Persisted source',
        type: 'markdown',
        raw_text: '# Persisted source',
        processing_status: 'processed',
        sections: [],
      })
    })

    const persisted = localStorage.getItem('redex-foundry-draft-v1')
    expect(persisted).not.toBeNull()

    const parsed = JSON.parse(persisted as string) as {
      state: {
        currentDraft: { title: string }
        sourceMaterial: { title: string; type: string }
      }
    }

    expect(parsed.state.currentDraft.title).toBe('Persist draft + source')
    expect(parsed.state.sourceMaterial).toEqual(
      expect.objectContaining({ title: 'Persisted source', type: 'markdown' }),
    )
  })

  it('starts with setupAnswers as null', () => {
    expect(useFoundryDraftStore.getState().setupAnswers).toBeNull()
  })

  it('setSetupAnswers stores values and sets updated_at timestamp', () => {
    act(() => {
      useFoundryDraftStore.getState().setSetupAnswers({
        criticality: 'operational',
        assessment_style: 'standard_quiz',
        audience_notes: 'Field operators',
        experience_notes: 'Scenario walk-through',
        estimated_minutes: 30,
        source_control: 'strict',
        requires_admin_approval: true,
        requires_safety_review: false,
      })
    })

    const answers = useFoundryDraftStore.getState().setupAnswers
    expect(answers).toEqual(
      expect.objectContaining({
        criticality: 'operational',
        assessment_style: 'standard_quiz',
        audience_notes: 'Field operators',
      }),
    )
    expect(answers?.updated_at).toEqual(expect.any(String))
    expect(new Date(answers?.updated_at ?? '').toString()).not.toBe('Invalid Date')
  })

  it('clearSetupAnswers resets setupAnswers to null', () => {
    act(() => {
      useFoundryDraftStore.getState().setSetupAnswers({
        criticality: 'informational',
        assessment_style: 'light_quiz',
        audience_notes: 'Everyone',
        experience_notes: '',
        estimated_minutes: 20,
        source_control: 'flexible',
        requires_admin_approval: false,
        requires_safety_review: false,
      })
    })

    act(() => {
      useFoundryDraftStore.getState().clearSetupAnswers()
    })

    expect(useFoundryDraftStore.getState().setupAnswers).toBeNull()
  })

  it('starts with outline null and outline_status draft', () => {
    expect(useFoundryDraftStore.getState().outline).toBeNull()
    expect(useFoundryDraftStore.getState().outline_status).toBe('draft')
  })

  it('setOutline saves outline and resets outline_status to draft', () => {
    act(() => {
      useFoundryDraftStore.getState().regenerateOutlineStart()
    })

    expect(useFoundryDraftStore.getState().outline_status).toBe('regenerating')

    act(() => {
      useFoundryDraftStore.getState().setOutline(MOCK_GENERATED_OUTLINE)
    })

    expect(useFoundryDraftStore.getState().outline).toEqual(MOCK_GENERATED_OUTLINE)
    expect(useFoundryDraftStore.getState().outline_status).toBe('draft')
  })

  it('approveOutline only sets approved when outline exists', () => {
    act(() => {
      useFoundryDraftStore.getState().approveOutline()
    })

    expect(useFoundryDraftStore.getState().outline_status).toBe('draft')

    act(() => {
      useFoundryDraftStore.getState().setOutline(MOCK_GENERATED_OUTLINE)
      useFoundryDraftStore.getState().approveOutline()
    })

    expect(useFoundryDraftStore.getState().outline_status).toBe('approved')
  })

  it('starts with selectedLibraryFileIds as an empty array', () => {
    expect(useFoundryDraftStore.getState().selectedLibraryFileIds).toEqual([])
  })

  it('toggleLibraryFile adds when absent and removes when present', () => {
    act(() => {
      useFoundryDraftStore.getState().toggleLibraryFile('drive-file-1')
    })
    expect(useFoundryDraftStore.getState().selectedLibraryFileIds).toEqual(['drive-file-1'])

    act(() => {
      useFoundryDraftStore.getState().toggleLibraryFile('drive-file-1')
    })
    expect(useFoundryDraftStore.getState().selectedLibraryFileIds).toEqual([])
  })

  it('clearLibrarySelection resets selectedLibraryFileIds and persists the array', () => {
    act(() => {
      useFoundryDraftStore.getState().toggleLibraryFile('drive-file-1')
      useFoundryDraftStore.getState().toggleLibraryFile('drive-file-2')
    })

    let persisted = localStorage.getItem('redex-foundry-draft-v1')
    expect(persisted).not.toBeNull()
    let parsed = JSON.parse(persisted as string) as {
      state: { selectedLibraryFileIds: string[] }
    }
    expect(parsed.state.selectedLibraryFileIds).toEqual(['drive-file-1', 'drive-file-2'])

    act(() => {
      useFoundryDraftStore.getState().clearLibrarySelection()
    })

    expect(useFoundryDraftStore.getState().selectedLibraryFileIds).toEqual([])

    persisted = localStorage.getItem('redex-foundry-draft-v1')
    expect(persisted).not.toBeNull()
    parsed = JSON.parse(persisted as string) as {
      state: { selectedLibraryFileIds: string[] }
    }
    expect(parsed.state.selectedLibraryFileIds).toEqual([])
  })
})
