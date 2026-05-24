import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Role } from '@/types/training'

export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  role: Role | null
  refreshSession: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
