import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/integrations/supabase/client'

function getSafeRedirectPath(value: string | null): string {
  if (!value) {
    return '/learn'
  }

  try {
    const decoded = decodeURIComponent(value)
    return decoded.startsWith('/') && !decoded.startsWith('//') ? decoded : '/learn'
  } catch {
    return value.startsWith('/') && !value.startsWith('//') ? value : '/learn'
  }
}

function getAuthCode(search: string): string | null {
  return new URLSearchParams(search).get('code')
}

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const redirectTo = getSafeRedirectPath(searchParams.get('redirect_to'))
    const code = getAuthCode(window.location.search)
    const hash = window.location.hash ?? ''
    const hasImplicitTokens = hash.includes('access_token=') || hash.includes('refresh_token=')
    let settled = false
    let timeoutId: number | undefined

    function finishSuccess() {
      if (settled) {
        return
      }

      settled = true
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
      navigate(redirectTo, { replace: true })
    }

    function finishError(message: string) {
      if (settled) {
        return
      }

      settled = true
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
      setErrorMessage(message)
    }

    // Listen for session-established events from EITHER:
    //  - PKCE exchangeCodeForSession (below)
    //  - Supabase client's automatic hash-fragment detection (implicit flow)
    //  - An existing session already in localStorage (user navigated here mid-session)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        finishSuccess()
      }
    })

    // Also check for an existing session synchronously — covers the case where the
    // user navigated to /auth/callback while already signed in (no event will fire).
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        finishSuccess()
      }
    })

    if (code) {
      // PKCE flow — exchange the code for a session.
      void supabase.auth
        .exchangeCodeForSession(code)
        .then(({ data, error }) => {
          if (error) {
            finishError(error.message)
            return
          }

          if (data.session) {
            finishSuccess()
          }
        })
        .catch((error: unknown) => {
          finishError(error instanceof Error ? error.message : 'We could not finish signing you in.')
        })
    } else if (!hasImplicitTokens) {
      // No PKCE code and no implicit-flow hash tokens. Give the existing-session
      // check + the auth listener a brief window to fire before declaring failure.
      timeoutId = window.setTimeout(() => {
        finishError('The sign-in link is missing or expired. Please request a new magic link.')
      }, 1500)
    }
    // If hasImplicitTokens is true, the Supabase client auto-detects the hash and
    // emits a SIGNED_IN event — onAuthStateChange will call finishSuccess.

    return () => {
      settled = true
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
      subscription.unsubscribe()
    }
  }, [navigate])

  if (errorMessage) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md border-redex-red/20 bg-card/95 text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-redex-red">Sign-in link failed</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="brand">
              <Link to="/sign-in">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-12 text-sm text-muted-foreground">
      Completing secure sign-in…
    </div>
  )
}
