import type { User, UUID } from '@/types/training'

import {
  MOCK_LEARNER_ANA,
  MOCK_LEARNER_DEVON,
  MOCK_LEARNER_MARCUS,
  MOCK_MANAGER_USER,
} from './mockOrgPeople'

const MOCK_ORG_PEOPLE: User[] = [MOCK_LEARNER_MARCUS, MOCK_LEARNER_ANA, MOCK_LEARNER_DEVON, MOCK_MANAGER_USER]

export const MOCK_MANAGER_REPORTS: Record<UUID, UUID[]> = {
  [MOCK_MANAGER_USER.id]: [MOCK_LEARNER_MARCUS.id, MOCK_LEARNER_ANA.id, MOCK_LEARNER_DEVON.id],
}

export function getDirectReports(managerId: string): User[] {
  const reportIds = MOCK_MANAGER_REPORTS[managerId] ?? []

  return reportIds
    .map((reportId) => MOCK_ORG_PEOPLE.find((person) => person.id === reportId))
    .filter((person): person is User => person !== undefined)
}

export default {
  MOCK_MANAGER_REPORTS,
  getDirectReports,
}
