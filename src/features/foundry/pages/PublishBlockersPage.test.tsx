import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_LESSON_REVIEWS } from '@/features/foundry/data/mockLessonReviews'

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

describe('PublishBlockersPage', () => {
  let PublishBlockersPage: (typeof import('./PublishBlockersPage'))['PublishBlockersPage']
  let useFoundryDraftStore: (typeof import('@/features/foundry/store/foundryDraftStore'))['useFoundryDraftStore']

  beforeEach(async () => {
    vi.resetModules()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })

    ;({ useFoundryDraftStore } = await import('@/features/foundry/store/foundryDraftStore'))
    ;({ PublishBlockersPage } = await import('./PublishBlockersPage'))

    act(() => {
      useFoundryDraftStore.getState().resetFoundryDraft()
    })
  })

  function LocationProbe() {
    const location = useLocation()

    return <p data-testid="location-path">{location.pathname}</p>
  }

  function seedBasics() {
    useFoundryDraftStore.getState().setBasics({
      title: 'HR Basics at Redex',
      parent_course_id: 'standalone',
      audience: 'New hires',
      criticality: 'required',
      training_type: 'general_informational',
      estimated_minutes: 20,
    })
  }

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/admin/foundry/blockers']}>
        <Routes>
          <Route path="/admin/foundry/blockers" element={<PublishBlockersPage />} />
          <Route path="/admin/foundry/published" element={<div>Published route reached</div>} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('renders eyebrow, heading, subhead, and back link', () => {
    renderPage()

    expect(screen.getByText('REDEX AI COURSE FOUNDRY · STEP 8')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Publish blockers' })).toBeInTheDocument()
    expect(screen.getByText('All outstanding items that prevent this module from being published.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Back to side-by-side review' })).toBeInTheDocument()
  })

  it('falls back to HR Basics MOCK_PUBLISH_BLOCKERS when foundry data is empty', () => {
    const { container } = renderPage()

    expect(container.querySelectorAll('article')).toHaveLength(3)
    expect(screen.getByText('Lesson: Payroll and Timekeeping Basics')).toBeInTheDocument()
  })

  it('disables Publish module when blockers remain', () => {
    act(() => {
      seedBasics()
      useFoundryDraftStore.getState().setLessonReviews(MOCK_LESSON_REVIEWS)
    })

    renderPage()

    const publishButton = screen.getByRole('button', { name: 'Publish module' })
    expect(publishButton).toBeDisabled()
    expect(publishButton).toHaveAttribute('title', 'Resolve all blockers above to enable publishing')
  })

  it('enables Publish module when blockers are clear and module is not already published', () => {
    act(() => {
      seedBasics()
    })

    renderPage()

    expect(screen.getByRole('button', { name: 'Publish module' })).toBeEnabled()
    expect(screen.getByText('✓ Module is clear to publish.')).toBeInTheDocument()
  })

  it('publishes, timestamps the store, and navigates to the published route', async () => {
    const user = userEvent.setup()
    act(() => {
      seedBasics()
    })
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Publish module' }))

    expect(useFoundryDraftStore.getState().publishStatus).toBe('published')
    expect(useFoundryDraftStore.getState().publishedAt).toEqual(expect.any(String))
    expect(await screen.findByText('Published route reached')).toBeInTheDocument()
  })

  it('reactively enables Publish module when lesson review blockers are approved', async () => {
    act(() => {
      seedBasics()
      useFoundryDraftStore.getState().setLessonReviews(MOCK_LESSON_REVIEWS)
    })

    renderPage()

    expect(screen.getByRole('button', { name: 'Publish module' })).toBeDisabled()

    act(() => {
      useFoundryDraftStore.getState().approveLessonReview(2, 0)
    })

    await waitFor(() => expect(screen.getByRole('button', { name: 'Publish module' })).toBeEnabled())
  })
})
