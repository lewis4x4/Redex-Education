import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import type { Role } from '@/types/training'
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
  const appMetadataRole = normalizeRole(session?.user?.app_metadata?.redex_role)
  if (appMetadataRole) {
    return appMetadataRole
  }

  const tokenClaims = decodeJwtPayload(session?.access_token)
  return normalizeRole(tokenClaims?.redex_role)
}

function getMockRole(): Role {
  return normalizeRole(import.meta.env.VITE_MOCK_AUTH_ROLE, 'admin') ?? 'admin'
}

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

  const role = mockAuthEnabled ? getMockRole() : getRoleFromSession(session)

  const value = useMemo(
    () => ({ user, session, loading, role }),
    [user, session, loading, role],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}