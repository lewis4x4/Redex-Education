import { describe, expect, it } from 'vitest'

import { MOCK_LEARNER_ANA, MOCK_LEARNER_DEVON, MOCK_LEARNER_MARCUS, MOCK_MANAGER_USER } from './mockOrgPeople'
import { getDirectReports } from './mockManagerReports'

describe('mockManagerReports', () => {
  it('returns Sarah Chen direct reports in stable order', () => {
    expect(getDirectReports(MOCK_MANAGER_USER.id)).toEqual([
      MOCK_LEARNER_MARCUS,
      MOCK_LEARNER_ANA,
      MOCK_LEARNER_DEVON,
    ])
  })
})
