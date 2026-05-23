import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { CritiqueIssue } from '@/lib/education'

import { CritiqueIssueCard } from './CritiqueIssueCard'

function buildIssue(overrides: Partial<CritiqueIssue> = {}): CritiqueIssue {
  return {
    id: 'issue-1',
    category: 'unsupported_claim',
    severity: 'high',
    summary: 'Summary text',
    detail: 'Detail text',
    ignored: false,
    ...overrides,
  }
}

describe('CritiqueIssueCard', () => {
  it('renders severity badge variant classes for high/medium/low', () => {
    const { rerender } = render(<CritiqueIssueCard issue={buildIssue({ severity: 'high' })} />)

    expect(screen.getByLabelText('high severity')).toHaveClass('bg-red-100')

    rerender(<CritiqueIssueCard issue={buildIssue({ severity: 'medium' })} />)
    expect(screen.getByLabelText('medium severity')).toHaveClass('bg-amber-100')

    rerender(<CritiqueIssueCard issue={buildIssue({ severity: 'low' })} />)
    expect(screen.getByLabelText('low severity')).toHaveClass('bg-slate-100')
  })

  it('renders category label, summary, detail, and suggested fix when present', () => {
    render(
      <CritiqueIssueCard
        issue={buildIssue({
          category: 'missing_source_reference',
          lesson_title: 'Lesson A',
          summary: 'Missing source',
          detail: 'Need citation.',
          suggested_fix: 'Add source citation.',
        })}
      />,
    )

    expect(screen.getByText('Missing source reference · Lesson A')).toBeInTheDocument()
    expect(screen.getByText('Missing source')).toBeInTheDocument()
    expect(screen.getByText('Need citation.')).toBeInTheDocument()
    expect(screen.getByText('Add source citation.')).toBeInTheDocument()
  })

  it('ignore flow collects note and calls onIgnore with note', async () => {
    const user = userEvent.setup()
    const onIgnore = vi.fn()

    render(<CritiqueIssueCard issue={buildIssue()} onIgnore={onIgnore} />)

    await user.click(screen.getByRole('button', { name: /Ignore issue/i }))
    await user.type(screen.getByLabelText('Ignore note'), 'Safe to ignore for now')
    await user.click(screen.getByRole('button', { name: /Save ignore note/i }))

    expect(onIgnore).toHaveBeenCalledWith('Safe to ignore for now')
  })

  it('ignored issue shows note, opacity class, and unignore action', async () => {
    const user = userEvent.setup()
    const onUnignore = vi.fn()

    render(
      <CritiqueIssueCard
        issue={buildIssue({
          ignored: true,
          ignored_note: 'Handled manually',
        })}
        onUnignore={onUnignore}
      />,
    )

    expect(screen.getByText('Ignored:')).toBeInTheDocument()
    expect(screen.getByText('Handled manually')).toBeInTheDocument()
    expect(screen.getByRole('article')).toHaveClass('opacity-60')

    await user.click(screen.getByRole('button', { name: /Unignore issue/i }))
    expect(onUnignore).toHaveBeenCalledTimes(1)
  })
})
