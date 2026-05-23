import type { LearnerProfile, User } from '@/types/training'

const MS_PER_DAY = 24 * 60 * 60 * 1000

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * MS_PER_DAY).toISOString()
}

export const MOCK_LEARNER_MARCUS: User = {
  id: 'user-marcus',
  org_id: 'org-redex',
  email: 'marcus.chen@redex.example',
  display_name: 'Marcus Chen',
  role: 'learner',
  created_at: isoDaysAgo(30),
  updated_at: isoDaysAgo(1),
}

export const MOCK_LEARNER_MARCUS_PROFILE: LearnerProfile = {
  id: 'learner-profile-marcus',
  user_id: MOCK_LEARNER_MARCUS.id,
  org_id: MOCK_LEARNER_MARCUS.org_id,
  display_name: MOCK_LEARNER_MARCUS.display_name,
  preferred_name: 'Marcus',
  role: 'Operations Associate',
  department: 'Operations',
  current_streak_days: 4,
  total_learning_minutes: 72,
  certificates_earned: 1,
}

export const MOCK_LEARNER_ANA: User = {
  id: 'user-ana',
  org_id: 'org-redex',
  email: 'ana.rodriguez@redex.example',
  display_name: 'Ana Rodriguez',
  role: 'learner',
  created_at: isoDaysAgo(12),
  updated_at: isoDaysAgo(1),
}

export const MOCK_LEARNER_ANA_PROFILE: LearnerProfile = {
  id: 'learner-profile-ana',
  user_id: MOCK_LEARNER_ANA.id,
  org_id: MOCK_LEARNER_ANA.org_id,
  display_name: MOCK_LEARNER_ANA.display_name,
  preferred_name: 'Ana',
  role: 'Guest Services Associate',
  department: 'Guest Services',
  current_streak_days: 1,
  total_learning_minutes: 28,
  certificates_earned: 0,
}

export const MOCK_ADMIN_USER: User = {
  id: 'user-jordan-admin',
  org_id: 'org-redex',
  email: 'jordan.patel@redex.example',
  display_name: 'Jordan Patel',
  role: 'admin',
  created_at: isoDaysAgo(730),
  updated_at: isoDaysAgo(2),
}

export const MOCK_MANAGER_USER: User = {
  id: 'user-sarah-manager',
  org_id: 'org-redex',
  email: 'sarah.chen@redex.example',
  display_name: 'Sarah Chen',
  role: 'manager',
  created_at: isoDaysAgo(365),
  updated_at: isoDaysAgo(1),
}

export const MOCK_LEARNER_DEVON: User = {
  id: 'user-devon-lee',
  org_id: 'org-redex',
  email: 'devon.lee@redex.example',
  display_name: 'Devon Lee',
  role: 'learner',
  created_at: isoDaysAgo(90),
  updated_at: isoDaysAgo(3),
}

export const MOCK_ORG_PEOPLE: User[] = [
  MOCK_LEARNER_MARCUS,
  MOCK_LEARNER_ANA,
  MOCK_LEARNER_DEVON,
  MOCK_ADMIN_USER,
  MOCK_MANAGER_USER,
]
