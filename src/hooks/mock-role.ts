import type { Role } from '@/types/training'

const ROLES: Role[] = ['admin', 'foundry_author', 'manager', 'learner']

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && ROLES.includes(value as Role)
}

export function getMockRole(): Role {
  return isRole(import.meta.env.VITE_MOCK_AUTH_ROLE) ? import.meta.env.VITE_MOCK_AUTH_ROLE : 'admin'
}
