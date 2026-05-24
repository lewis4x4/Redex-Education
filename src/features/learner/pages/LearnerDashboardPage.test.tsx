import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { LearnerDashboardPage } from './LearnerDashboardPage';
import { useAssignmentStore } from '@/features/assignments/store/assignmentStore';
import { useMyProgress } from '@/hooks/useEducation';
import {
  MOCK_HR_ONBOARDING_ASSIGNMENT,
  MOCK_HR_ONBOARDING_ASSIGNMENT_ANA,
  MOCK_LEARNER_ANA_PROFILE,
  MOCK_LEARNER_MARCUS_PROFILE,
} from '@/lib/education';

vi.mock('@/hooks/useEducation', () => ({
  useMyProgress: vi.fn(),
}));

const useMyProgressMock = vi.mocked(useMyProgress);

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-path">{location.pathname}</div>;
}

function DashboardRouteHarness() {
  const navigate = useNavigate();

  return (
    <>
      <LearnerDashboardPage learner={MOCK_LEARNER_MARCUS_PROFILE} onContinue={() => navigate('/learn/player/hr-basics-mod-001')} />
      <LocationProbe />
    </>
  );
}

describe('LearnerDashboardPage HR Basics assignment', () => {
  beforeEach(() => {
    act(() => {
      useAssignmentStore.getState().resetAssignments();
    });

    useMyProgressMock.mockReturnValue({
      percentage: 0,
      completed: 0,
      total: 6,
      enrollment: { progress_percentage: 0 },
      completeLesson: vi.fn(),
    } as never);
  });

  it('shows HR Basics as Marcus primary assignment with six lessons and 20 minutes remaining', () => {
    render(<LearnerDashboardPage learner={MOCK_LEARNER_MARCUS_PROFILE} />);

    expect(screen.getByText('HR Basics at Redex')).toBeInTheDocument();
    expect(screen.getByText(/0 of 6 lessons complete/i)).toBeInTheDocument();
    expect(screen.getByText(/~20 minutes remaining/i)).toBeInTheDocument();
  });

  it('reflects computed days-until-due from Marcus assignment store state', () => {
    act(() => {
      useAssignmentStore.setState({
        assignments: [
          {
            ...MOCK_HR_ONBOARDING_ASSIGNMENT,
            due_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      });
    });

    render(<LearnerDashboardPage learner={MOCK_LEARNER_MARCUS_PROFILE} />);

    expect(screen.getByText('Due in 2 days')).toBeInTheDocument();
  });

  it('uses the passed learner profile when selecting assignment due state', () => {
    act(() => {
      useAssignmentStore.setState({
        assignments: [
          {
            ...MOCK_HR_ONBOARDING_ASSIGNMENT_ANA,
            due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      });
    });

    render(<LearnerDashboardPage learner={MOCK_LEARNER_ANA_PROFILE} />);

    expect(screen.getByText('Good morning, Ana. 👋')).toBeInTheDocument();
    expect(screen.getByText('Due in 7 days')).toBeInTheDocument();
  });

  it('shows overdue indicator when Marcus assignment is past due', () => {
    act(() => {
      useAssignmentStore.setState({
        assignments: [
          {
            ...MOCK_HR_ONBOARDING_ASSIGNMENT,
            due_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
          },
        ],
      });
    });

    render(<LearnerDashboardPage learner={MOCK_LEARNER_MARCUS_PROFILE} />);

    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('routes Continue Training to the HR Basics module player', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/learn']}>
        <Routes>
          <Route path="/learn" element={<DashboardRouteHarness />} />
          <Route path="/learn/player/:moduleId" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /continue training/i }));

    expect(screen.getByTestId('location-path')).toHaveTextContent('/learn/player/hr-basics-mod-001');
  });
});
