import { supabase } from '@/integrations/supabase/client'
import { mapProfileRow, mapModuleVersionRow } from '@/integrations/supabase/db-rows'
import type { ModuleVersion, User, UUID } from '@/types/training'

export interface OnboardingAuditableModule extends ModuleVersion {
  criticality?: 'required' | 'recommended' | 'optional' | 'bonus'
}

export interface OnboardingCandidate extends User {
  onboarding_completion_percent: number
  last_activity: string
}

export async function fetchAuditableModulesForOnboarding(audience: string): Promise<OnboardingAuditableModule[]> {
  void audience
  const { data, error } = await supabase
    .from('module_versions')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []).map(mapModuleVersionRow)

  const moduleIds = [...new Set(rows.map((row) => row.module_id))]
  const { data: moduleRows, error: moduleError } = await supabase
    .from('training_modules')
    .select('id, criticality')
    .in('id', moduleIds)

  if (moduleError) throw moduleError

  const criticalityByModuleId = new Map<string, OnboardingAuditableModule['criticality']>(
    (moduleRows ?? []).map((row) => [row.id, row.criticality as OnboardingAuditableModule['criticality']]),
  )

  return rows.map((row) => ({
    ...row,
    criticality: criticalityByModuleId.get(row.module_id),
  }))
}

export async function fetchOnboardingCandidates(): Promise<OnboardingCandidate[]> {
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'learner')
    .order('created_at', { ascending: false })

  if (profilesError) throw profilesError

  const profiles = (profilesData ?? []).map(mapProfileRow)
  const learnerIds = profiles.map((profile) => profile.id)

  if (learnerIds.length === 0) {
    return []
  }

  const { data: assignmentsData, error: assignmentsError } = await supabase
    .from('assignments')
    .select('assignee_user_id,status,assigned_at')
    .in('assignee_user_id', learnerIds as UUID[])

  if (assignmentsError) throw assignmentsError

  const assignmentRows = assignmentsData ?? []

  return profiles.map((profile) => {
    const personAssignments = assignmentRows.filter((row) => row.assignee_user_id === profile.id)
    const totalAssignments = personAssignments.length
    const completedAssignments = personAssignments.filter((row) => row.status === 'completed').length
    const completion = totalAssignments === 0 ? 0 : Math.round((completedAssignments / totalAssignments) * 100)

    const lastAssignmentAt = personAssignments
      .map((row) => row.assigned_at)
      .filter((value): value is string => typeof value === 'string')
      .sort((a, b) => b.localeCompare(a))[0]

    return {
      ...profile,
      onboarding_completion_percent: completion,
      last_activity: lastAssignmentAt ?? profile.updated_at,
    }
  })
}
