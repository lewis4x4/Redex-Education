import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LearnerWelcomePage } from '@/features/learner/pages/LearnerWelcomePage'
import { LearnerDashboardPage } from '@/features/learner/pages/LearnerDashboardPage'
import { ModulePlayer } from '@/features/learner/components/ModulePlayer'
import { useEducation } from '@/contexts/EducationContext'
import type { ProgressStatus } from '@/lib/education/training-types'

// Redex Academy - Active Build
// Slice 0.2 + Slice 1.1 in progress
// Experience toggle is now live in the TopNav (matching the v3 mockup)

type LearnerView = 'welcome' | 'dashboard' | 'player';

function LearnerExperience({ experience, onExperienceChange }: { 
  experience: 'learner' | 'admin'; 
  onExperienceChange: (exp: 'learner' | 'admin') => void;
}) {
  const [view, setView] = useState<LearnerView>('welcome');
  const education = useEducation();

  const demoModule = education.getDemoModule();
  const demoLessons = education.getDemoLessons();

  // Live completed lesson ids from the Education Progress Context (localStorage backed)
  // Passed to ModulePlayer so its sidebar + progress bar reflect real persisted state on entry/return
  const completedLessonIds = demoLessons
    .filter((l) => education.getLessonStatus(l.id) === 'completed')
    .map((l) => l.id);

  const handleStartJourney = () => {
    setView('player');
  };

  const handleExitPlayer = () => {
    setView('dashboard');
  };

  const handleCompleteModule = () => {
    // After completing the orientation module, drop user on the live dashboard
    setView('dashboard');
  };

  const handleContinueFromDashboard = () => {
    setView('player');
  };

  // Dynamic breadcrumb for the current learner view
  const getBreadcrumb = () => {
    if (view === 'welcome') return 'Learner flow › First-day welcome';
    if (view === 'dashboard') return 'Learner flow › My Learning Dashboard';
    return 'Learner flow › Orientation Module Player';
  };

  const renderContent = () => {
    if (view === 'player') {
      return (
        <ModulePlayer
          module={demoModule}
          lessons={demoLessons}
          completedLessonIds={completedLessonIds}
          onProgressUpdate={(lessonId: string, status: ProgressStatus) => {
            education.recordLessonProgress(lessonId, status);
          }}
          onCompleteModule={handleCompleteModule}
          onExit={handleExitPlayer}
        />
      );
    }

    if (view === 'dashboard') {
      return (
        <LearnerDashboardPage
          onContinue={handleContinueFromDashboard}
          onStartJourney={handleStartJourney}
        />
      );
    }

    // welcome
    return <LearnerWelcomePage onStartJourney={handleStartJourney} />;
  };

  return (
    <AppShell 
      experience={experience} 
      onExperienceChange={onExperienceChange}
      breadcrumb={getBreadcrumb()}
      playerMode={view === 'player'}
    >
      {renderContent()}
    </AppShell>
  );
}

function AdminExperience({ experience, onExperienceChange }: { 
  experience: 'learner' | 'admin'; 
  onExperienceChange: (exp: 'learner' | 'admin') => void;
}) {
  return (
    <AppShell 
      experience={experience} 
      onExperienceChange={onExperienceChange}
      breadcrumb="Admin flow › Course Foundry"
    >
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h1 className="text-3xl font-semibold mb-3">Redex AI Course Foundry</h1>
        <p className="text-[#6b7280]">Admin creation tools coming in the next slices.</p>
        <p className="text-xs text-[#6b7280] mt-4">Click "Learner experience" in the header to return to the welcome mockup.</p>
      </div>
    </AppShell>
  )
}

export default function App() {
  const [experience, setExperience] = useState<'learner' | 'admin'>('learner')

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            experience === 'learner' 
              ? <LearnerExperience experience={experience} onExperienceChange={setExperience} /> 
              : <AdminExperience experience={experience} onExperienceChange={setExperience} />
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}
