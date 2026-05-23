import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { PublishBlocker } from '@/lib/education'

import { PublishBlockerList } from './PublishBlockerList'

const blockers: PublishBlocker[] = [
  {
    id: 'source-1',
    source: 'source_placeholder',
    severity: 'blocker',
    location: 'Source section: Handbook',
    summary: 'Source section contains placeholder content that must be resolved.',
    detail: 'Contains [PLACEHOLDER] token.',
    resolve_route: '/admin/foundry/source',
  },
  {
    id: 'source-2',
    source: 'lesson_unsupported_claim',
    severity: 'warning',
    location: 'Lesson: Intro',
    summary: 'Lesson has unsupported phrasing to review.',
    detail: 'Unsupported claim detail.',
    resolve_route: '/admin/foundry/sidebyside',
  },
]

describe('PublishBlockerList', () => {
  it("renders empty state with clear-to-publish message and CheckCircle2 icon", () => {
    const { container } = render(<PublishBlockerList blockers={[]} />)

    expect(screen.getByText("No publish blockers. You're clear to publish.")).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders blocker rows with severity icon, source label, summary, and collapsible details', () => {
    const { container } = render(<PublishBlockerList blockers={blockers} />)

    expect(screen.getByText('Source file placeholder')).toBeInTheDocument()
    expect(screen.getByText('Lesson with unsupported claim')).toBeInTheDocument()
    expect(screen.getByText('Source section contains placeholder content that must be resolved.')).toBeInTheDocument()
    expect(screen.getByText('Lesson has unsupported phrasing to review.')).toBeInTheDocument()
    expect(screen.getAllByText('Details')).toHaveLength(2)
    expect(container.querySelector('.lucide-octagon-alert')).toBeInTheDocument()
    expect(container.querySelector('.lucide-triangle-alert')).toBeInTheDocument()
  })

  it('calls onResolve with the correct blocker when Resolve is clicked', () => {
    const onResolve = vi.fn()
    render(<PublishBlockerList blockers={blockers} onResolve={onResolve} />)

    fireEvent.click(screen.getByRole('button', { name: /Resolve Source section contains placeholder/i }))

    expect(onResolve).toHaveBeenCalledTimes(1)
    expect(onResolve).toHaveBeenCalledWith(blockers[0])
  })
})
