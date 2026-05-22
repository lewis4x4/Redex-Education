import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CourseStatusList, type CourseStatusListItem } from './CourseStatusList'

const items: CourseStatusListItem[] = [
  { id: '1', title: 'Field Safety Refresher', status: 'Draft', meta: 'Updated 2 hours ago' },
  { id: '2', title: 'HR Onboarding — Pilot Module', status: 'Needs review', meta: 'Awaiting HR sign-off' },
  { id: '3', title: 'Time & Attendance Basics', status: 'Published', meta: 'Published 1 week ago' },
  { id: '4', title: 'Communication Standards', status: 'Archived', meta: 'Archived last quarter' },
]

describe('CourseStatusList', () => {
  it('renders title, items, and badges', () => {
    render(<CourseStatusList title="Module statuses" items={items} />)

    expect(screen.getByRole('heading', { name: 'Module statuses' })).toBeInTheDocument()
    for (const item of items) {
      expect(screen.getByText(item.title)).toBeInTheDocument()
      expect(screen.getByText(item.status)).toBeInTheDocument()
    }
  })

  it('announces badge status labels for each status type', () => {
    render(<CourseStatusList title="Module statuses" items={items} />)

    expect(screen.getByLabelText('Status: Draft')).toBeInTheDocument()
    expect(screen.getByLabelText('Status: Needs review')).toBeInTheDocument()
    expect(screen.getByLabelText('Status: Published')).toBeInTheDocument()
    expect(screen.getByLabelText('Status: Archived')).toBeInTheDocument()
  })

  it('shows empty message and default check icon when there are no items', () => {
    const { container } = render(
      <CourseStatusList title="Needs review" items={[]} emptyMessage="All caught up. No modules awaiting review." />,
    )

    expect(screen.getByText('All caught up. No modules awaiting review.')).toBeInTheDocument()
    expect(container.querySelector('svg.h-8.w-8')).toBeInTheDocument()
  })

  it('shows item count in the header', () => {
    render(<CourseStatusList title="Module statuses" items={items} />)

    expect(screen.getByLabelText('4 items')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })
})
