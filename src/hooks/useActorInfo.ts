import { useContext, useMemo } from 'react'
import { AuthContext } from '@/hooks/auth-context'
import { useProfile } from '@/hooks/useProfile'
import type { UUID } from '@/types/training'

export interface ActorInfo {
  userId: UUID
  displayName: string
}

export function useActorInfo(): ActorInfo | undefined {
  const { profile } = useProfile()
  const authContext = useContext(AuthContext)

  return useMemo(() => {
    if (profile) {
      return { userId: profile.id, displayName: profile.display_name }
    }

    const user = authContext?.user
    if (user?.id) {
      return { userId: user.id, displayName: user.email ?? 'Signed-in user' }
    }

    return undefined
  }, [authContext?.user, profile])
}
