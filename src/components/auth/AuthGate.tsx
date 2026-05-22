import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

interface AuthGateProps {
  children: ReactNode
  fallback?: ReactNode
}

function DefaultFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 text-sm text-muted-foreground">
      Authenticating…
    </div>
  )
}

function SignInRequiredPlaceholder() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <Card className="max-w-md border-redex-red/20 bg-card/95 text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-redex-red">Sign-in required</CardTitle>
          <CardDescription>
            Redex AI Course Foundry access will require an authenticated session.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Authentication UI is intentionally deferred; enable mock auth while building demo-only flows.
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthGate({ children, fallback = <DefaultFallback /> }: AuthGateProps) {
  const { loading, session } = useAuth()

  if (import.meta.env.VITE_MOCK_AUTH === 'true') {
    return <>{children}</>
  }

  if (loading) {
    return <>{fallback}</>
  }

  if (!session) {
    return <SignInRequiredPlaceholder />
  }

  return <>{children}</>
}
