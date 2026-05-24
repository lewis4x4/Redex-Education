import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '@/hooks/auth-context'
import {
  MOCK_ADMIN_USER,
  MOCK_LEARNER_MARCUS,
  MOCK_MANAGER_USER,
} from '@/lib/education'
import type { User } from '@/types/training'

const noop = () => undefined

function getMockProfile(role: User['role'] | null): User {
  if (role === 'learner') {
    return MOCK_LEARNER_MARCUS
  }

  if (role === 'manager') {
    return MOCK_MANAGER_USER
  }

  if (role === 'foundry_author') {
    return { ...MOCK_ADMIN_USER, role: 'foundry_author' }
  }

  return MOCK_ADMIN_USER
}

export function useProfile(): { profile: User | null; loading: boolean; refetch: () => void } {
  const authContext = useContext(AuthContext)
  const userId = authContext?.user?.id ?? null
  const role = authContext?.role ?? null
  const mockAuthEnabled = import.meta.env.VITE_MOCK_AUTH === 'true'
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const mockProfile = useMemo(() => getMockProfile(role), [role])
  const refetch = useCallback(() => setReloadKey((current) => current + 1), [])

  useEffect(() => {
    if (mockAuthEnabled || !userId) {
      return undefined
    }

    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true)
      }
    })

    import('@/integrations/supabase/queries/profiles')
      .then(({ fetchProfileByUserId }) => fetchProfileByUserId(userId))
      .then((nextProfile) => {
        if (cancelled) {
          return
        }

        setProfile(nextProfile)
        setLoading(false)
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }

        console.warn('[profile] Unable to load signed-in user profile.', error)
        setProfile(null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [mockAuthEnabled, reloadKey, userId])

  if (mockAuthEnabled) {
    return { profile: mockProfile, loading: false, refetch: noop }
  }

  if (!userId) {
    return { profile: null, loading: false, refetch: noop }
  }

  return { profile, loading, refetch }
}
