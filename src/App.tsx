import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import AuthGate from '@/components/auth/AuthGate'
import { AppShell } from '@/components/layout/AppShell'
import { NotFoundPage } from '@/components/layout/NotFoundPage'
import { LearnerWelcomePage } from '@/features/learner/pages/LearnerWelcomePage'
import { LearnerDashboardPage } from '@/features/learner/pages/LearnerDashboardPage'
import { ModulePlayer } from '@/features/learner/components/ModulePlayer'
import { AdminPlaceholderPage } from '@/features/admin/pages/AdminPlaceholderPage'
import { useEducation } from '@/hooks/useEducation'
import type { ProgressStatus } from '@/lib/education'

// Redex Academy - Active Build
// Phase 2 routes: learner demo stays open; admin shell is protected by AuthGate.

function LearnerDashboardRoute() {
  const navigate = useNavigate()

  return (
    <AppShell breadcrumb="Learner flow › My Learning Dashboard">
      <LearnerDashboardPage
        onContinue={() => navigate('/learn/player/mod-001')}
        onStartJourney={() => navigate('/learn/player/mod-001')}
      />
    </AppShell>
  )
}

function LearnerWelcomeRoute() {
  const navigate = useNavigate()

  return (
    <AppShell breadcrumb="Learner flow › First-day welcome">
      <LearnerWelcomePage onStartJourney={() => navigate('/learn/player/mod-001')} />
    </AppShell>
  )
}

function LearnerModuleRoute() {
  const { moduleId = 'mod-001' } = useParams<{ moduleId?: string }>()
  const navigate = useNavigate()
  const education = useEducation()

  const routeModule = education.getModule(moduleId)

  if (!routeModule) {
    return <Navigate to="/learn" replace />
  }

  const moduleLessons = education.getLessonsForModule(moduleId)

  // Live completed lesson ids from the Education Progress Context (localStorage backed)
  // Passed to ModulePlayer so its sidebar + progress bar reflect real persisted state on entry/return.
  const completedLessonIds = moduleLessons
    .filter((lesson) => education.getLessonStatus(lesson.id) === 'completed')
    .map((lesson) => lesson.id)

  return (
    <AppShell breadcrumb="Learner flow › Orientation Module Player" playerMode>
      <ModulePlayer
        key={routeModule.id}
        module={routeModule}
        lessons={moduleLessons}
        completedLessonIds={completedLessonIds}
        onProgressUpdate={(lessonId: string, status: ProgressStatus) => {
          education.recordLessonProgress(lessonId, status)
        }}
        onCompleteModule={() => navigate('/learn')}
        onExit={() => navigate('/learn')}
      />
    </AppShell>
  )
}

function AdminRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Course Foundry">
      <AuthGate>
        <AdminPlaceholderPage />
      </AuthGate>
    </AppShell>
  )
}

function NotFoundRoute() {
  return (
    <AppShell breadcrumb="Page not found">
      <NotFoundPage />
    </AppShell>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/learn" replace />} />
      <Route path="/learn" element={<LearnerDashboardRoute />} />
      <Route path="/learn/welcome" element={<LearnerWelcomeRoute />} />
      <Route path="/learn/player" element={<LearnerModuleRoute />} />
      <Route path="/learn/player/:moduleId" element={<LearnerModuleRoute />} />
      <Route path="/admin" element={<AdminRoute />} />
      <Route path="/admin/*" element={<AdminRoute />} />
      <Route path="*" element={<NotFoundRoute />} />
    </Routes>
  )
}
