import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { SelfCritiqueReport } from '@/lib/education'

import { SelfCritiquePanel } from './SelfCritiquePanel'

const baseReport: SelfCritiqueReport = {
  module_title: 'Module',
  generated_at: '2026-05-22T12:30:00.000Z',
  blocks_publish: true,
  issues: [
    {
      id: 'h1',
      category: 'unsupported_claim',
      severity: 'high',
      summary: 'High issue',
      detail: 'High detail',
      ignored: false,
    },
    {
      id: 'm1',
      category: 'weak_question',
      severity: 'medium',
      summary: 'Medium issue',
      detail: 'Medium detail',
      ignored: false,
    },
    {
      id: 'l1',
      category: 'overly_corporate_wording',
      severity: 'low',
      summary: 'Low issue',
      detail: 'Low detail',
      ignored: false,
    },
  ],
}

describe('SelfCritiquePanel', () => {
  it('renders publish-blocked banner when blocks_publish is true', () => {
    render(<SelfCritiquePanel report={baseReport} />)

    expect(screen.getByText('🚫 Publish blocked')).toBeInTheDocument()
  })

  it('groups issues by severity headings', () => {
    render(<SelfCritiquePanel report={baseReport} />)

    expect(screen.getByRole('heading', { name: 'High severity (1)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Medium severity (1)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Low severity (1)' })).toBeInTheDocument()
  })

  it('shows empty state when report has no issues', () => {
    render(
      <SelfCritiquePanel
        report={{
          ...baseReport,
          blocks_publish: false,
          issues: [],
        }}
      />,
    )

    expect(screen.getByText(/No issues found/i)).toBeInTheDocument()
  })
})
