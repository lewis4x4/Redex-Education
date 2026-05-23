import type { Assignment } from '@/types/training'

import {
  MOCK_ADMIN_USER,
  MOCK_LEARNER_ANA,
  MOCK_LEARNER_DEVON,
  MOCK_LEARNER_MARCUS,
} from './mockOrgPeople'

const MS_PER_DAY = 24 * 60 * 60 * 1000

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * MS_PER_DAY).toISOString()
}

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * MS_PER_DAY).toISOString()
}

export const MOCK_HR_ONBOARDING_ASSIGNMENT: Assignment = {
  id: 'assignment-hr-basics-marcus',
  module_version_id: 'module-version-hr-basics-v1',
  assignee_user_id: MOCK_LEARNER_MARCUS.id,
  assigned_by: MOCK_ADMIN_USER.id,
  assigned_at: isoDaysAgo(5),
  due_at: isoDaysFromNow(5),
  status: 'in_progress',
}

export const MOCK_HR_ONBOARDING_ASSIGNMENT_ANA: Assignment = {
  id: 'assignment-hr-basics-ana',
  module_version_id: 'module-version-hr-basics-v1',
  assignee_user_id: MOCK_LEARNER_ANA.id,
  assigned_by: MOCK_ADMIN_USER.id,
  assigned_at: isoDaysAgo(2),
  due_at: isoDaysFromNow(10),
  status: 'pending',
}

export const MOCK_HR_ONBOARDING_ASSIGNMENT_COMPLETED: Assignment = {
  id: 'assignment-hr-basics-devon',
  module_version_id: 'module-version-hr-basics-v1',
  assignee_user_id: MOCK_LEARNER_DEVON.id,
  assigned_by: MOCK_ADMIN_USER.id,
  assigned_at: isoDaysAgo(20),
  due_at: isoDaysAgo(2),
  status: 'completed',
}

export const MOCK_ASSIGNMENTS: Assignment[] = [
  MOCK_HR_ONBOARDING_ASSIGNMENT,
  MOCK_HR_ONBOARDING_ASSIGNMENT_ANA,
  MOCK_HR_ONBOARDING_ASSIGNMENT_COMPLETED,
]
