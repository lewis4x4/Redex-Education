import type { Assignment } from '@/types/training'
import { getDataSource } from './dataSource'
import { MOCK_ASSIGNMENTS } from './mockAssignments'
import * as supabaseDataProvider from './supabaseDataProvider'

export async function getAssignmentsForUser(userId: string): Promise<Assignment[]> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getAssignmentsForUser(userId)
  }

  return MOCK_ASSIGNMENTS.filter((assignment) => assignment.assignee_user_id === userId)
}

export async function getAssignmentsForModule(moduleVersionId: string): Promise<Assignment[]> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getAssignmentsForModule(moduleVersionId)
  }

  return MOCK_ASSIGNMENTS.filter((assignment) => assignment.module_version_id === moduleVersionId)
}
