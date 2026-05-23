import { act, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ManagerDashboardPage } from './ManagerDashboardPage'
import { useAssignmentStore } from '@/features/assignments/store/assignmentStore'
import { useAssessmentAttemptStore } from '@/features/progress/store/assessmentAttemptStore'
import { useEducation } from '@/hooks/useEducation'
import { DEMO_HR_BASICS_LESSONS, MOCK_HR_ONBOARDING_ASSIGNMENT } from '@/lib/education'

vi.mock('@/hooks/useEducation', () => ({
  useEducation: vi.fn(),
}))

const useEducationMock = vi.mocked(useEducation)
let completedLessonIds = new Set<string>()

function mockEducation() {
  useEducationMock.mockImplementation(() => ({
    currentEnrollment: {
      id: 'enroll-marcus-hr-basics-001',
      user_id: 'user-marcus',
      course_id: 'course-hr-basics-001',
      status: 'active',
      progress_percentage: 0,
      started_at: '2026-05-23T00:00:00.000Z',
    },
    getLessonsForModule: () => DEMO_HR_BASICS_LESSONS,
    getLessonStatus: (lessonId: string) => (completedLessonIds.has(lessonId) ? 'completed' : 'not_started'),
    getMyEnrollments: () => [],
    getCourse: () => undefined,
    getModule: () => undefined,
    recordLessonProgress: vi.fn(),
    getProgressSummary: () => ({ completed: completedLessonIds.size, total: DEMO_HR_BASICS_LESSONS.length, percentage: 0 }),
    completeLesson: vi.fn(),
    getDemoCourse: vi.fn(),
    getDemoModule: vi.fn(),
    getDemoLessons: vi.fn(),
  } as never))
}

describe('ManagerDashboardPage', () => {
  beforeEach(() => {
    completedLessonIds = new Set(['hr-basics-lesson-1-welcome', 'hr-basics-lesson-2-contact', 'hr-basics-lesson-3-payroll-timekeeping'])
    mockEducation()

    act(() => {
      useAssignmentStore.getState().resetAssignments()
      useAssessmentAttemptStore.getState().resetAttempts()
    })
  })

  it('renders Sarah Chen manager view with Marcus, Ana, and Devon initial statuses', () => {
    render(<ManagerDashboardPage />)

    expect(screen.getByRole('heading', { name: 'Team training progress' })).toBeInTheDocument()
    expect(screen.getByText(/Sarah Chen can see/i)).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Marcus Chen/i })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Ana Rodriguez/i })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Devon Lee/i })).toBeInTheDocument()

    expect(within(screen.getByRole('row', { name: /Marcus Chen/i })).getByText('In progress')).toBeInTheDocument()
    expect(within(screen.getByRole('row', { name: /Ana Rodriguez/i })).getByText('Not started')).toBeInTheDocument()
    expect(within(screen.getByRole('row', { name: /Devon Lee/i })).getByText('Completed')).toBeInTheDocument()
  })

  it('updates Marcus to completed when assignment, lesson progress, and quiz attempt complete', async () => {
    render(<ManagerDashboardPage />)

    act(() => {
      completedLessonIds = new Set(DEMO_HR_BASICS_LESSONS.map((lesson) => lesson.id))
      useAssessmentAttemptStore.getState().recordAttempt({
        enrollment_id: 'enroll-marcus-hr-basics-001',
        lesson_id: 'hr-basics-lesson-6-final-quiz',
        score_percent: 100,
        passed: true,
        answers: {},
      })
      useAssignmentStore.getState().updateAssignmentStatus(MOCK_HR_ONBOARDING_ASSIGNMENT.id, 'completed')
    })

    await waitFor(() => {
      const marcusRow = screen.getByRole('row', { name: /Marcus Chen/i })
      expect(within(marcusRow).getByText('Completed')).toBeInTheDocument()
      expect(within(marcusRow).getAllByText('100%')).toHaveLength(2)
    })
  })
})
