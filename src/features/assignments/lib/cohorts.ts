import type { Role } from '@/types/training'

export interface Cohort {
  id: string
  label: string
  /** Maps to Assignment.assignee_role */
  role: Extract<Role, 'learner' | 'manager' | 'admin' | 'foundry_author'>
  description?: string
}

export const COHORTS: Cohort[] = [
  {
    id: 'new-hires',
    label: 'All new hires',
    role: 'learner',
    description: 'Auto-assigned during onboarding.',
  },
  {
    id: 'operations-team',
    label: 'Operations team',
    role: 'learner',
    description: 'Operations Associates.',
  },
  {
    id: 'guest-services-team',
    label: 'Guest Services team',
    role: 'learner',
    description: 'Guest Services Associates.',
  },
]
