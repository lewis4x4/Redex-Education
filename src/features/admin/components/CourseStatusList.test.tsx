import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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

  it('renders item titles as links when getItemHref returns a path', () => {
    render(
      <MemoryRouter>
        <CourseStatusList title="Module statuses" items={items} getItemHref={(item) => `/admin/modules/${item.id}/versions`} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Field Safety Refresher' })).toHaveAttribute(
      'href',
      '/admin/modules/1/versions',
    )
  })

  it('renders optional item actions separately from title links', () => {
    render(
      <MemoryRouter>
        <CourseStatusList
          title="Module statuses"
          items={items}
          getItemHref={(item) => `/admin/modules/${item.id}/versions`}
          renderItemActions={(item) => <button type="button">Action for {item.title}</button>}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Field Safety Refresher' })).toHaveAttribute(
      'href',
      '/admin/modules/1/versions',
    )
    expect(screen.getByRole('button', { name: 'Action for Field Safety Refresher' })).toBeInTheDocument()
  })

  it('keeps titles static and renders no actions when optional props are omitted', () => {
    render(<CourseStatusList title="Module statuses" items={items} />)

    expect(screen.queryByRole('link', { name: 'Field Safety Refresher' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /action for/i })).not.toBeInTheDocument()
    expect(screen.getByText('Field Safety Refresher')).toBeInTheDocument()
  })
})
