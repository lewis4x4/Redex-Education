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

    if (!code) {
      finishError('The sign-in link is missing an auth code. Please request a new magic link.')
      return undefined
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        finishSuccess()
      }
    })

    void supabase.auth
      .exchangeCodeForSession(code)
      .then(({ data, error }) => {
        if (error) {
          finishError(error.message)
          return
        }

        if (data.session) {
          finishSuccess()
          return
        }

        timeoutId = window.setTimeout(() => {
          finishError('We could not finish signing you in. Please request a new magic link.')
        }, 1500)
      })
      .catch((error: unknown) => {
        finishError(error instanceof Error ? error.message : 'We could not finish signing you in.')
      })

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
