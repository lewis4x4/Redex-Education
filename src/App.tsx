import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import AuthGate from '@/components/auth/AuthGate'
import { AppShell } from '@/components/layout/AppShell'
import { NotFoundPage } from '@/components/layout/NotFoundPage'
import { RouteErrorBoundary } from '@/components/layout/RouteErrorBoundary'
import { RouteLoadingFallback } from '@/components/layout/RouteLoadingFallback'
import { LearnerWelcomePage } from '@/features/learner/pages/LearnerWelcomePage'
import { useAssignmentStore } from '@/features/assignments/store/assignmentStore'
import { useAssessmentAttemptStore } from '@/features/progress/store/assessmentAttemptStore'
import { useAuth } from '@/hooks/useAuth'
import { useEducation } from '@/hooks/useEducation'
import { useProfile } from '@/hooks/useProfile'
import { getModuleVersionId } from '@/lib/education/moduleVersions'
import type { LearnerProfile, ProgressStatus, User as DomainUser } from '@/lib/education'

const LearnerDashboardPage = lazy(() =>
  import('@/features/learner/pages/LearnerDashboardPage').then((m) => ({ default: m.LearnerDashboardPage })),
)

const ModulePlayer = lazy(() =>
  import('@/features/learner/components/ModulePlayer').then((m) => ({ default: m.ModulePlayer })),
)

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

const SignInPage = lazy(() =>
  import('@/features/auth/pages/SignInPage').then((m) => ({ default: m.SignInPage })),
)

const AuthCallbackPage = lazy(() =>
  import('@/features/auth/pages/AuthCallbackPage').then((m) => ({ default: m.AuthCallbackPage })),
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
// Phase 2 routes: learner and operator shells are protected by AuthGate.

function toLearnerProfile(profile: DomainUser | null, authUser: SupabaseUser | null): LearnerProfile | undefined {
  const userId = profile?.id ?? authUser?.id

  if (!userId) {
    return undefined
  }

  const displayName = profile?.display_name ?? authUser?.email?.split('@')[0] ?? 'Learner'
  const preferredName = displayName.split(' ').filter(Boolean)[0] ?? displayName

  return {
    id: `learner-profile-${userId}`,
    user_id: userId,
    org_id: profile?.org_id ?? 'org-redex',
    display_name: displayName,
    preferred_name: preferredName,
    role: profile?.role,
    current_streak_days: 0,
    total_learning_minutes: 0,
    certificates_earned: 0,
  }
}

function LearnerDashboardRoute() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile()
  const learner = toLearnerProfile(profile, user)

  return (
    <AppShell breadcrumb="Academy › My Learning">
      <AuthGate>
        <Suspense fallback={<RouteLoadingFallback />}>
          <LearnerDashboardPage
            learner={learner}
            onContinue={() => navigate('/learn/player/hr-basics-mod-001')}
            onStartJourney={() => navigate('/learn/player/hr-basics-mod-001')}
          />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function LearnerWelcomeRoute() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile()
  const learner = toLearnerProfile(profile, user)

  return (
    <AppShell breadcrumb="Academy › Welcome">
      <AuthGate>
        <LearnerWelcomePage learner={learner} onStartJourney={() => navigate('/learn/player/hr-basics-mod-001')} />
      </AuthGate>
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
    <AppShell breadcrumb="Academy › Module" playerMode>
      <Suspense fallback={<RouteLoadingFallback />}>
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
      </Suspense>
    </AppShell>
  )
}

function AdminRoute() {
  return (
    <AppShell breadcrumb="Foundry">
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <AdminDashboardPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function AssignmentAdminRoute() {
  return (
    <AppShell breadcrumb="Foundry › Assignments">
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <AssignmentAdminPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function AuditLogRoute() {
  return (
    <AppShell breadcrumb="Foundry › Audit log">
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <AuditLogPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function ManagerRoute() {
  return (
    <AppShell breadcrumb="Team">
      <AuthGate requiredRole={['manager', 'admin']}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <ManagerDashboardPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function SignInRoute() {
  return (
    <AppShell breadcrumb="Sign in">
      <Suspense fallback={<RouteLoadingFallback />}>
        <SignInPage />
      </Suspense>
    </AppShell>
  )
}

function AuthCallbackRoute() {
  return (
    <AppShell breadcrumb="Signing in">
      <Suspense fallback={<RouteLoadingFallback />}>
        <AuthCallbackPage />
      </Suspense>
    </AppShell>
  )
}

function FoundryStartRoute() {
  return (
    <AppShell breadcrumb="Foundry › New module">
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <FoundryStartPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function FoundrySourceRoute() {
  return (
    <AppShell breadcrumb="Foundry › Source material">
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <SourceBinderInputPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function FoundryQuestionsRoute() {
  return (
    <AppShell breadcrumb="Foundry › Setup questions">
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <FoundryQuestionsPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function OutlineReviewRoute() {
  return (
    <AppShell breadcrumb="Foundry › Outline review">
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <OutlineReviewPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function SourceLibraryRoute() {
  return (
    <AppShell breadcrumb="Foundry › Source Library">
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <SourceLibraryPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function ModuleGenerationPreviewRoute() {
  return (
    <AppShell breadcrumb="Foundry › Module preview">
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <ModuleGenerationPreviewPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function SelfCritiqueReviewRoute() {
  return (
    <AppShell breadcrumb="Foundry › Self-critique">
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <SelfCritiqueReviewPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function SideBySideReviewRoute() {
  return (
    <AppShell breadcrumb="Foundry › Side-by-side review">
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <SideBySideReviewPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function PublishBlockersRoute() {
  return (
    <AppShell breadcrumb="Foundry › Publish blockers">
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <PublishBlockersPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function PublishConfirmationRoute() {
  return (
    <AppShell breadcrumb="Foundry › Published">
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <PublishConfirmationPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function ModuleVersionHistoryRoute() {
  return (
    <AppShell breadcrumb="Foundry › Module versions">
      <AuthGate requiredRole={['admin', 'foundry_author']}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <ModuleVersionHistoryPage />
        </Suspense>
      </AuthGate>
    </AppShell>
  )
}

function SourceImpactReviewRoute() {
  return (
    <AppShell breadcrumb="Foundry › Source impact">
      <AuthGate requiredRole={['admin', 'foundry_author']}>
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
    <RouteErrorBoundary>
      <Routes>
      <Route path="/" element={<Navigate to="/learn" replace />} />
      <Route path="/learn" element={<LearnerDashboardRoute />} />
      <Route path="/learn/welcome" element={<LearnerWelcomeRoute />} />
      <Route path="/learn/player" element={<LearnerModuleRoute />} />
      <Route path="/learn/player/:moduleId" element={<LearnerModuleRoute />} />
      <Route path="/sign-in" element={<SignInRoute />} />
      <Route path="/auth/callback" element={<AuthCallbackRoute />} />
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
      <Route path="/admin/*" element={<NotFoundRoute />} />
        <Route path="*" element={<NotFoundRoute />} />
      </Routes>
    </RouteErrorBoundary>
  )
}
