import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { getMockRole } from '@/hooks/mock-role'
import type { Role } from '@/types/training'

interface AuthGateProps {
  children: ReactNode
  fallback?: ReactNode
  requiredRole?: Role | Role[]
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'admin',
  foundry_author: 'foundry author',
  manager: 'manager',
  learner: 'learner',
}

function normalizeRequiredRoles(requiredRole: Role | Role[] | undefined): Role[] {
  return Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : []
}

function hasRequiredRole(role: Role | null, requiredRole: Role | Role[] | undefined): boolean {
  const allowedRoles = normalizeRequiredRoles(requiredRole)
  return allowedRoles.length === 0 || (role !== null && allowedRoles.includes(role))
}

function formatRequiredRoles(requiredRole: Role | Role[] | undefined): string {
  return normalizeRequiredRoles(requiredRole).map((role) => ROLE_LABELS[role]).join(' or ')
}

function DefaultFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 text-sm text-muted-foreground">
      Authenticating…
    </div>
  )
}

function AccessDeniedCard({ requiredRole }: { requiredRole: Role | Role[] | undefined }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <Card className="max-w-md border-redex-red/20 bg-card/95 text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-redex-red">Access denied</CardTitle>
          <CardDescription>This section requires {formatRequiredRoles(requiredRole)} access.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          If this looks wrong, ask a Redex admin to update your profile role.
        </CardContent>
      </Card>
    </div>
  )
}

export function SignInRequiredPlaceholder() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <Card className="max-w-md border-redex-red/20 bg-card/95 text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-redex-red">Sign-in required</CardTitle>
          <CardDescription>Redex Education access requires an authenticated session.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <Link className="font-medium text-redex-red underline-offset-4 hover:underline" to="/sign-in">
            Go to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthGate({ children, fallback = <DefaultFallback />, requiredRole }: AuthGateProps) {
  const { loading, role, session } = useAuth()
  const location = useLocation()

  if (import.meta.env.VITE_MOCK_AUTH === 'true') {
    return hasRequiredRole(getMockRole(), requiredRole) ? <>{children}</> : <AccessDeniedCard requiredRole={requiredRole} />
  }

  if (loading) {
    return <>{fallback}</>
  }

  if (!session) {
    const redirectTo = `${location.pathname}${location.search}`
    return <Navigate to={`/sign-in?redirect_to=${encodeURIComponent(redirectTo)}`} replace />
  }

  if (!hasRequiredRole(role, requiredRole)) {
    return <AccessDeniedCard requiredRole={requiredRole} />
  }

  return <>{children}</>
}
