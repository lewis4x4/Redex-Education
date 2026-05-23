import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { LearnerDashboardPage } from './LearnerDashboardPage';
import { useMyProgress } from '@/hooks/useEducation';

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
      <LearnerDashboardPage onContinue={() => navigate('/learn/player/hr-basics-mod-001')} />
      <LocationProbe />
    </>
  );
}

describe('LearnerDashboardPage HR Basics assignment', () => {
  beforeEach(() => {
    useMyProgressMock.mockReturnValue({
      percentage: 0,
      completed: 0,
      total: 6,
      enrollment: { progress_percentage: 0 },
      completeLesson: vi.fn(),
    } as never);
  });

  it('shows HR Basics as Marcus primary assignment with six lessons and 20 minutes remaining', () => {
    render(<LearnerDashboardPage />);

    expect(screen.getByText('HR Basics at Redex')).toBeInTheDocument();
    expect(screen.getByText(/0 of 6 lessons complete/i)).toBeInTheDocument();
    expect(screen.getByText(/~20 minutes remaining/i)).toBeInTheDocument();
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
