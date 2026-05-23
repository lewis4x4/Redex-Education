import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/integrations/supabase/client'

export function SignInPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    setErrorMessage(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    setSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setMessage('Check your email for a Redex Education sign-in link.')
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md border-redex-red/20 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-redex-red">Sign in to Redex Education</CardTitle>
          <CardDescription>Enter your work email and we’ll send a magic link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                Email
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-redex-red focus:ring-1 focus:ring-redex-red"
                id="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@redex.example"
                required
                type="email"
                value={email}
              />
            </div>

            <Button className="w-full" disabled={submitting} type="submit" variant="brand">
              {submitting ? 'Sending…' : 'Send magic link'}
            </Button>
          </form>

          {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}
          {errorMessage ? <p className="mt-4 text-sm text-destructive">{errorMessage}</p> : null}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Returning to demo mode?{' '}
            <Link className="font-medium text-redex-red underline-offset-4 hover:underline" to="/learn">
              Back to Redex Academy
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
