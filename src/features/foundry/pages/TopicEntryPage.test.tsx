import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

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

describe('TopicEntryPage', () => {
  let TopicEntryPage: (typeof import('./TopicEntryPage'))['TopicEntryPage']
  let useFoundryDraftStore: (typeof import('@/features/foundry/store/foundryDraftStore'))['useFoundryDraftStore']

  beforeEach(async () => {
    vi.resetModules()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    vi.doMock('@/features/foundry/ai', async () => {
      const actual = await vi.importActual<typeof import('@/features/foundry/ai')>('@/features/foundry/ai')
      return {
        ...actual,
        getCourseFoundryAiMode: () => 'mock',
      }
    })

    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))
    ;({ TopicEntryPage } = await import('./TopicEntryPage'))

    act(() => {
      useFoundryDraftStore.getState().resetFoundryDraft()
      useFoundryDraftStore.getState().clearPacketDraft()
    })
  })

  function renderWithRoutes() {
    return render(
      <MemoryRouter initialEntries={['/admin/foundry/topic']}>
        <Routes>
          <Route path="/admin/foundry/topic" element={<TopicEntryPage />} />
          <Route path="/admin/foundry/outline" element={<div>Reached outline route</div>} />
          <Route path="/admin/foundry/start" element={<div>Reached manual route</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('drafts a guarded packet proposal from a topic', async () => {
    const user = userEvent.setup()
    renderWithRoutes()

    await user.type(screen.getByRole('textbox', { name: /module topic/i }), 'Cat 6 Training Module')
    await user.click(screen.getByRole('button', { name: /draft packet/i }))

    expect(await screen.findByRole('heading', { name: 'Cat 6 Training Module' })).toBeInTheDocument()
    expect(screen.getByText(/Proposal safety guardrail/i)).toBeInTheDocument()
    expect(screen.getAllByText(/brainstormed/i).length).toBeGreaterThan(0)
    expect(useFoundryDraftStore.getState().packetDraft).toEqual(expect.objectContaining({ status: 'reviewing' }))
  })

  it('accepts a packet into basics review without launching generation or seeding source/setup/outline', async () => {
    const user = userEvent.setup()
    renderWithRoutes()

    await user.type(screen.getByRole('textbox', { name: /module topic/i }), 'Cat 6 Training Module')
    await user.click(screen.getByRole('button', { name: /draft packet/i }))
    await user.click(await screen.findByRole('button', { name: /accept into draft/i }))

    expect(await screen.findByText('Reached manual route')).toBeInTheDocument()
    expect(useFoundryDraftStore.getState().currentDraft).toEqual(expect.objectContaining({ title: 'Cat 6 Training Module' }))
    expect(useFoundryDraftStore.getState().packetDraft).toEqual(expect.objectContaining({ status: 'accepted' }))
    expect(useFoundryDraftStore.getState().sourceMaterial).toBeNull()
    expect(useFoundryDraftStore.getState().setupAnswers).toBeNull()
    expect(useFoundryDraftStore.getState().outline).toBeNull()
  })

  it('submits intake in real mode and stores queued proposal/job ids', async () => {
    const submitModuleIntakeProposal = vi.fn().mockResolvedValue({
      status: 'queued',
      proposalId: 'proposal-123',
      jobId: 'job-123',
      proposalStatus: 'queued',
      jobStatus: 'queued',
    })

    vi.resetModules()
    vi.doMock('@/features/foundry/ai', async () => {
      const actual = await vi.importActual<typeof import('@/features/foundry/ai')>('@/features/foundry/ai')
      return { ...actual, getCourseFoundryAiMode: () => 'real' }
    })
    vi.doMock('@/features/foundry/ai/moduleIntakeClient', () => ({
      submitModuleIntakeProposal,
      fetchModuleIntakeStatus: vi.fn(),
    }))
    vi.doMock('@/features/foundry/lib/featureFlags', async () => {
      const actual = await vi.importActual<typeof import('@/features/foundry/lib/featureFlags')>('@/features/foundry/lib/featureFlags')
      return { ...actual, isModuleIntakeBackendEnabled: () => true }
    })

    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))
    ;({ TopicEntryPage } = await import('./TopicEntryPage'))

    act(() => {
      useFoundryDraftStore.getState().resetFoundryDraft()
      useFoundryDraftStore.getState().clearPacketDraft()
    })

    const user = userEvent.setup()
    renderWithRoutes()
    await user.type(screen.getByRole('textbox', { name: /module topic/i }), 'Cat 6 Training Module')
    await user.click(screen.getByRole('button', { name: /draft packet/i }))
    await user.click(await screen.findByRole('button', { name: /accept into draft/i }))

    expect(await screen.findByText('Reached manual route')).toBeInTheDocument()
    expect(submitModuleIntakeProposal).toHaveBeenCalledTimes(1)
    expect(useFoundryDraftStore.getState().packetDraft?.intake_status).toEqual(expect.objectContaining({
      status: 'queued',
      proposal_id: 'proposal-123',
      job_id: 'job-123',
    }))
  })

  it('stores failed intake status when real-mode submit fails but still routes to manual basics', async () => {
    const submitModuleIntakeProposal = vi.fn().mockRejectedValue(new Error('submit failed'))

    vi.resetModules()
    vi.doMock('@/features/foundry/ai', async () => {
      const actual = await vi.importActual<typeof import('@/features/foundry/ai')>('@/features/foundry/ai')
      return { ...actual, getCourseFoundryAiMode: () => 'real' }
    })
    vi.doMock('@/features/foundry/ai/moduleIntakeClient', () => ({
      submitModuleIntakeProposal,
      fetchModuleIntakeStatus: vi.fn(),
    }))
    vi.doMock('@/features/foundry/lib/featureFlags', async () => {
      const actual = await vi.importActual<typeof import('@/features/foundry/lib/featureFlags')>('@/features/foundry/lib/featureFlags')
      return { ...actual, isModuleIntakeBackendEnabled: () => true }
    })

    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))
    ;({ TopicEntryPage } = await import('./TopicEntryPage'))

    act(() => {
      useFoundryDraftStore.getState().resetFoundryDraft()
      useFoundryDraftStore.getState().clearPacketDraft()
    })

    const user = userEvent.setup()
    renderWithRoutes()
    await user.type(screen.getByRole('textbox', { name: /module topic/i }), 'Cat 6 Training Module')
    await user.click(screen.getByRole('button', { name: /draft packet/i }))
    await user.click(await screen.findByRole('button', { name: /accept into draft/i }))

    expect(await screen.findByText('Reached manual route')).toBeInTheDocument()
    expect(useFoundryDraftStore.getState().packetDraft?.intake_status?.status).toBe('upload_failed')
    expect(useFoundryDraftStore.getState().packetDraft?.intake_status?.last_error_message).toBe('submit failed')
  })
})
