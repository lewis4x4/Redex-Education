import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import type { Role } from '@/types/training'
import { getMockRole } from './mock-role'
import { AuthContext } from './auth-context'

const ROLES: Role[] = ['admin', 'foundry_author', 'manager', 'learner']

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && ROLES.includes(value as Role)
}

function normalizeRole(value: unknown, fallback: Role | null = null): Role | null {
  return isRole(value) ? value : fallback
}

function decodeJwtPayload(accessToken: string | undefined): Record<string, unknown> | null {
  if (!accessToken) {
    return null
  }

  const [, payload] = accessToken.split('.')
  if (!payload) {
    return null
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch (error) {
    console.warn('[auth] Unable to decode Supabase access token claims.', error)
    return null
  }
}

function getRoleFromSession(session: Session | null): Role | null {
  // The Supabase custom-access-token hook injects redex_role as a top-level JWT
  // claim, not into user.app_metadata, so role checks must read the access token.
  const tokenClaims = decodeJwtPayload(session?.access_token)
  return normalizeRole(tokenClaims?.redex_role)
}

// eslint-disable-next-line react-refresh/only-export-components
export { getMockRole } from './mock-role'

export function AuthProvider({ children }: { children: ReactNode }) {
  const mockAuthEnabled = import.meta.env.VITE_MOCK_AUTH === 'true'
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(!mockAuthEnabled)

  useEffect(() => {
    if (mockAuthEnabled) {
      return undefined
    }

    let cancelled = false

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) {
        return
      }

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // THEN check for existing session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (cancelled) {
          return
        }

        if (error) {
          console.warn('[auth] Unable to load initial Supabase session.', error)
        }

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        console.warn('[auth] getSession() rejected while loading initial session.', error)
        setSession(null)
        setUser(null)
        setLoading(false)
      })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [mockAuthEnabled])

  const refreshSession = useCallback(async () => {
    if (mockAuthEnabled) {
      return
    }

    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession()

    if (error) {
      console.warn('[auth] Unable to refresh Supabase session.', error)
      throw error
    }

    setSession(session)
    setUser(session?.user ?? null)
  }, [mockAuthEnabled])

  const signOut = useCallback(async () => {
    if (mockAuthEnabled) {
      return
    }

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.warn('[auth] Unable to sign out of Supabase.', error)
      throw error
    }
  }, [mockAuthEnabled])

  const role = mockAuthEnabled ? getMockRole() : getRoleFromSession(session)

  const value = useMemo(
    () => ({ user, session, loading, role, refreshSession, signOut }),
    [user, session, loading, role, refreshSession, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}