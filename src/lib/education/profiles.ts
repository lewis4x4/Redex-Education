import { getDataSource } from './dataSource'
import { MOCK_ORG_PEOPLE } from './mockOrgPeople'
import { getDirectReports as getMockDirectReports } from './mockManagerReports'
import * as supabaseDataProvider from './supabaseDataProvider'
import type { User } from '@/types/training'

export async function getProfileByUserId(userId: string): Promise<User | null> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getProfileByUserId(userId)
  }

  return MOCK_ORG_PEOPLE.find((person) => person.id === userId) ?? null
}

export async function getAllProfiles(): Promise<User[]> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getAllProfiles()
  }

  return MOCK_ORG_PEOPLE
}

export async function getDirectReports(managerId: string): Promise<User[]> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getDirectReports(managerId)
  }

  return getMockDirectReports(managerId)
}
