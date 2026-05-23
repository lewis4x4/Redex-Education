import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { AffectedModule } from '@/features/source-binder/lib/sourceImpact'
import { AffectedModulesPanel } from './AffectedModulesPanel'

const affected: AffectedModule = {
  version: {
    id: 'module-version-hr-basics-v1',
    module_id: 'hr-basics-mod-001',
    module_title: 'HR Basics at Redex',
    version_number: 1,
    status: 'published',
    source_stale: true,
    created_at: '2026-05-23T00:00:00.000Z',
  },
  affectedLessonIds: ['hr-basics-lesson-3-payroll-timekeeping'],
  affectedSectionIds: ['section-payroll-basics'],
  changedSourceFileIds: ['file-1'],
}

describe('AffectedModulesPanel', () => {
  it('renders empty state', () => {
    render(<AffectedModulesPanel affected={[]} />)

    expect(screen.getByRole('heading', { name: 'No affected modules' })).toBeInTheDocument()
  })

  it('renders stale module details and regenerates selected lessons', async () => {
    const user = userEvent.setup()
    const onRegenerate = vi.fn()

    render(<AffectedModulesPanel affected={[affected]} onRegenerate={onRegenerate} />)

    expect(screen.getByText('HR Basics at Redex · v1')).toBeInTheDocument()
    expect(screen.getByText('Stale')).toBeInTheDocument()
    expect(screen.getByText('payroll basics')).toBeInTheDocument()
    expect(screen.getByLabelText('Payroll and Timekeeping Basics')).toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Regenerate affected lessons' }))

    expect(onRegenerate).toHaveBeenCalledWith('module-version-hr-basics-v1', ['hr-basics-lesson-3-payroll-timekeeping'])
  })
})
