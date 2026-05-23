import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import AuthGate from '@/components/auth/AuthGate'
import { AppShell } from '@/components/layout/AppShell'
import { NotFoundPage } from '@/components/layout/NotFoundPage'
import { RouteLoadingFallback } from '@/components/layout/RouteLoadingFallback'
import { LearnerDashboardPage } from '@/features/learner/pages/LearnerDashboardPage'
import { LearnerWelcomePage } from '@/features/learner/pages/LearnerWelcomePage'
import { useAssignmentStore } from '@/features/assignments/store/assignmentStore'
import { ModulePlayer } from '@/features/learner/components/ModulePlayer'
import { useAssessmentAttemptStore } from '@/features/progress/store/assessmentAttemptStore'
import { useEducation } from '@/hooks/useEducation'
import { getModuleVersionId } from '@/lib/education/moduleVersions'
import type { ProgressStatus } from '@/lib/education'

const AdminDashboardPage = lazy(() =>
  import('@/features/admin/pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
)

const AssignmentAdminPage = lazy(() =>
  import('@/features/assignments/pages/AssignmentAdminPage').then((m) => ({ default: m.AssignmentAdminPage })),
)

const AuditLogPage = lazy(() =>
  import('@/features/audit/pages/AuditLogPage').then((m) => ({ default: m.AuditLogPage })),
)

const ManagerDashboardPage = lazy(() =>
  import('@/features/manager/pages/ManagerDashboardPage').then((m) => ({ default: m.ManagerDashboardPage })),
)

const SourceBinderInputPage = lazy(() =>
  import('@/features/source-binder/pages/SourceBinderInputPage').then((m) => ({ default: m.SourceBinderInputPage })),
)

const SourceLibraryPage = lazy(() =>
  import('@/features/source-binder/pages/SourceLibraryPage').then((m) => ({ default: m.SourceLibraryPage })),
)

const SourceImpactReviewPage = lazy(() =>
  import('@/features/source-binder/pages/SourceImpactReviewPage').then((m) => ({ default: m.SourceImpactReviewPage })),
)

const FoundryStartPage = lazy(() =>
  import('@/features/foundry/pages/FoundryStartPage').then((m) => ({ default: m.FoundryStartPage })),
)

const FoundryQuestionsPage = lazy(() =>
  import('@/features/foundry/pages/FoundryQuestionsPage').then((m) => ({ default: m.FoundryQuestionsPage })),
)

const OutlineReviewPage = lazy(() =>
  import('@/features/foundry/pages/OutlineReviewPage').then((m) => ({ default: m.OutlineReviewPage })),
)

const ModuleGenerationPreviewPage = lazy(() =>
  import('@/features/foundry/pages/ModuleGenerationPreviewPage').then((m) => ({ default: m.ModuleGenerationPreviewPage })),
)

const SelfCritiqueReviewPage = lazy(() =>
  import('@/features/foundry/pages/SelfCritiqueReviewPage').then((m) => ({ default: m.SelfCritiqueReviewPage })),
)

const SideBySideReviewPage = lazy(() =>
  import('@/features/foundry/pages/SideBySideReviewPage').then((m) => ({ default: m.SideBySideReviewPage })),
)

const PublishBlockersPage = lazy(() =>
  import('@/features/foundry/pages/PublishBlockersPage').then((m) => ({ default: m.PublishBlockersPage })),
)

const PublishConfirmationPage = lazy(() =>
  import('@/features/foundry/pages/PublishConfirmationPage').then((m) => ({ default: m.PublishConfirmationPage })),
)

const ModuleVersionHistoryPage = lazy(() =>
  import('@/features/publishing/pages/ModuleVersionHistoryPage').then((m) => ({ default: m.ModuleVersionHistoryPage })),
)

// Redex Academy - Active Build
// Phase 2 routes: learner demo stays open; admin shell is protected by AuthGate.

function LearnerDashboardRoute() {
  const navigate = useNavigate()

  return (
    <AppShell breadcrumb="Learner flow › My Learning Dashboard">
      <LearnerDashboardPage
        onContinue={() => navigate('/learn/player/hr-basics-mod-001')}
        onStartJourney={() => navigate('/learn/player/hr-basics-mod-001')}
      />
    </AppShell>
  )
}

function LearnerWelcomeRoute() {
  const navigate = useNavigate()

  return (
    <AppShell breadcrumb="Learner flow › First-day welcome">
      <LearnerWelcomePage onStartJourney={() => navigate('/learn/player/hr-basics-mod-001')} />
    </AppShell>
  )
}

function LearnerModuleRoute() {
  const { moduleId = 'hr-basics-mod-001' } = useParams<{ moduleId?: string }>()
  const navigate = useNavigate()
  const education = useEducation()
  const recordAttempt = useAssessmentAttemptStore((state) => state.recordAttempt)
  const assignments = useAssignmentStore((state) => state.assignments)
  const updateAssignmentStatus = useAssignmentStore((state) => state.updateAssignmentStatus)

  const routeModule = education.getModule(moduleId)

  if (!routeModule) {
    return <Navigate to="/learn" replace />
  }

  const moduleLessons = education.getLessonsForModule(moduleId)
  const moduleEnrollment = education.getMyEnrollments().find((enrollment) => enrollment.course_id === routeModule.course_id)

  // Live completed lesson ids from the Education Progress Context (localStorage backed)
  // Passed to ModulePlayer so its sidebar + progress bar reflect real persisted state on entry/return.
  const completedLessonIds = moduleLessons
    .filter((lesson) => education.getLessonStatus(lesson.id) === 'completed')
    .map((lesson) => lesson.id)

  const completeActiveAssignment = () => {
    const moduleVersionId = getModuleVersionId(routeModule.id)
    const activeAssignment = moduleVersionId
      ? assignments.find(
          (assignment) =>
            assignment.module_version_id === moduleVersionId &&
            assignment.assignee_user_id === moduleEnrollment?.user_id &&
            assignment.status !== 'completed',
        )
      : undefined

    if (activeAssignment) {
      updateAssignmentStatus(activeAssignment.id, 'completed')
    }
  }

  const completedLessonIdSet = new Set(completedLessonIds)

  return (
    <AppShell breadcrumb="Learner flow › Module Player" playerMode>
      <ModulePlayer
        key={routeModule.id}
        module={routeModule}
        lessons={moduleLessons}
        completedLessonIds={completedLessonIds}
        onProgressUpdate={(lessonId: string, status: ProgressStatus) => {
          education.recordLessonProgress(lessonId, status)

          const isCompletingModule =
            status === 'completed' &&
            moduleLessons.length > 0 &&
            moduleLessons.every((lesson) => completedLessonIdSet.has(lesson.id) || lesson.id === lessonId)

          if (isCompletingModule) {
            completeActiveAssignment()
          }
        }}
        onQuizAttempt={(lessonId, attempt) => {
          if (!moduleEnrollment) {
            return
          }

          recordAttempt({
            enrollment_id: moduleEnrollment.id,
            lesson_id: lessonId,
            score_percent: attempt.score,
            passed: attempt.passed,
            answers: attempt.answers,
            actor_user_id: moduleEnrollment.user_id,
          })
        }}
        onCompleteModule={() => {
          completeActiveAssignment()
          navigate('/learn')
        }}
        onExit={() => navigate('/learn')}
      />
    </AppShell>
  )
}

function AdminRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Course Foundry">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <AdminDashboardPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function AssignmentAdminRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Assignments">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <AssignmentAdminPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function AuditLogRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Audit log">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <AuditLogPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function ManagerRoute() {
  return (
    <AppShell breadcrumb="Manager flow › Team training">
      <Suspense fallback={<RouteLoadingFallback />}>
        <ManagerDashboardPage />
      </Suspense>
    </AppShell>
  )
}

function FoundryStartRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Course Foundry › New module">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <FoundryStartPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function FoundrySourceRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Course Foundry › Source material">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <SourceBinderInputPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function FoundryQuestionsRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Course Foundry › Setup questions">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <FoundryQuestionsPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function OutlineReviewRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Course Foundry › Outline review">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <OutlineReviewPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function SourceLibraryRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Course Foundry › Source Library">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <SourceLibraryPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function ModuleGenerationPreviewRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Course Foundry › Module preview">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <ModuleGenerationPreviewPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function SelfCritiqueReviewRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Course Foundry › Self-critique">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <SelfCritiqueReviewPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function SideBySideReviewRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Course Foundry › Side-by-side review">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <SideBySideReviewPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function PublishBlockersRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Course Foundry › Publish blockers">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <PublishBlockersPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function PublishConfirmationRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Course Foundry › Published">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <PublishConfirmationPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function ModuleVersionHistoryRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Module versions">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <ModuleVersionHistoryPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function SourceImpactReviewRoute() {
  return (
    <AppShell breadcrumb="Admin flow › Source impact">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <SourceImpactReviewPage />
        </Suspense>
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
      <Route path="/admin/assignments" element={<AssignmentAdminRoute />} />
      <Route path="/admin/audit" element={<AuditLogRoute />} />
      <Route path="/admin/source-impact" element={<SourceImpactReviewRoute />} />
      <Route path="/admin/modules/:moduleId/versions" element={<ModuleVersionHistoryRoute />} />
      <Route path="/manager" element={<ManagerRoute />} />
      <Route path="/admin/foundry/start" element={<FoundryStartRoute />} />
      <Route path="/admin/foundry/source" element={<FoundrySourceRoute />} />
      <Route path="/admin/foundry/questions" element={<FoundryQuestionsRoute />} />
      <Route path="/admin/foundry/outline" element={<OutlineReviewRoute />} />
      <Route path="/admin/foundry/preview" element={<ModuleGenerationPreviewRoute />} />
      <Route path="/admin/foundry/critique" element={<SelfCritiqueReviewRoute />} />
      <Route path="/admin/foundry/sidebyside" element={<SideBySideReviewRoute />} />
      <Route path="/admin/foundry/blockers" element={<PublishBlockersRoute />} />
      <Route path="/admin/foundry/published" element={<PublishConfirmationRoute />} />
      <Route path="/admin/foundry/library" element={<SourceLibraryRoute />} />
      <Route path="/admin/*" element={<AdminRoute />} />
      <Route path="*" element={<NotFoundRoute />} />
    </Routes>
  )
}
