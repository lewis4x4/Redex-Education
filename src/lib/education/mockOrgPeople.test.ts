import { describe, expect, it } from 'vitest'

import {
  MOCK_ADMIN_USER,
  MOCK_LEARNER_ANA,
  MOCK_LEARNER_ANA_PROFILE,
  MOCK_LEARNER_MARCUS,
  MOCK_LEARNER_MARCUS_PROFILE,
  MOCK_MANAGER_USER,
  MOCK_LEARNER_DEVON,
} from './mockOrgPeople'

describe('mockOrgPeople', () => {
  it('uses unique ids for all mock users', () => {
    const users = [MOCK_LEARNER_MARCUS, MOCK_LEARNER_ANA, MOCK_ADMIN_USER, MOCK_MANAGER_USER, MOCK_LEARNER_DEVON]
    const uniqueIds = new Set(users.map((user) => user.id))

    expect(uniqueIds.size).toBe(users.length)
  })

  it('keeps learner profiles linked to learner users', () => {
    expect(MOCK_LEARNER_MARCUS_PROFILE.user_id).toBe(MOCK_LEARNER_MARCUS.id)
    expect(MOCK_LEARNER_ANA_PROFILE.user_id).toBe(MOCK_LEARNER_ANA.id)
    expect(MOCK_LEARNER_MARCUS.role).toBe('learner')
    expect(MOCK_LEARNER_ANA.role).toBe('learner')
  })

  it('seeds expected canonical names and emails', () => {
    expect(MOCK_LEARNER_MARCUS.display_name).toBe('Marcus Chen')
    expect(MOCK_LEARNER_ANA.display_name).toBe('Ana Rodriguez')
    expect(MOCK_ADMIN_USER.display_name).toBe('Jordan Patel')
    expect(MOCK_MANAGER_USER.email).toBe('sarah.chen@redex.example')
  })

  it('stores valid ISO timestamps for user records', () => {
    const users = [MOCK_LEARNER_MARCUS, MOCK_LEARNER_ANA, MOCK_ADMIN_USER, MOCK_MANAGER_USER, MOCK_LEARNER_DEVON]

    for (const user of users) {
      expect(Number.isNaN(Date.parse(user.created_at))).toBe(false)
      expect(Number.isNaN(Date.parse(user.updated_at))).toBe(false)
    }
  })
})
