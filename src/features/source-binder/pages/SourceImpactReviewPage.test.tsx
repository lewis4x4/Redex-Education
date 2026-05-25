import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuditLogStore } from '@/features/audit/store/auditLogStore'
import { useModuleVersionsStore } from '@/features/publishing/store/moduleVersionsStore'
import { useSourceChangeEventsStore } from '@/features/source-binder/store/sourceChangeEventsStore'
import { SourceImpactReviewPage } from './SourceImpactReviewPage'

describe('SourceImpactReviewPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    act(() => {
      useAuditLogStore.getState().resetEvents()
      useModuleVersionsStore.getState().resetVersions()
      useSourceChangeEventsStore.getState().resetEvents()
    })
  })

  it('clearly labels demo-only state and disables live-looking actions', () => {
    render(<SourceImpactReviewPage />)

    expect(screen.getByText('Demo data only')).toBeInTheDocument()
    expect(
      screen.getByText(/does not run live Drive sync or live regeneration actions/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sync from Drive' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Regenerate affected lessons' })).not.toBeInTheDocument()
  })
})
