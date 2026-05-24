import type { PublishedModuleRecord } from '@/features/publishing/store/publishedModulesStore'
import { supabase } from '@/integrations/supabase/client'
import { mapAssignmentRow, mapModuleVersionRow } from '@/integrations/supabase/db-rows'
import { fetchProfilesByIds } from '@/integrations/supabase/queries/profiles'
import type { Assignment } from '@/types/training'

export interface AssignmentWithNames extends Assignment {
  assignee_display_name?: string
  assigned_by_display_name?: string
}

export async function fetchAssignmentsForUser(userId: string): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('assignee_user_id', userId)
    .order('assigned_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapAssignmentRow)
}

export async function fetchAssignmentsForModule(moduleVersionId: string): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('module_version_id', moduleVersionId)
    .order('assigned_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapAssignmentRow)
}

export async function fetchPublishedModuleAssignments(): Promise<PublishedModuleRecord[]> {
  const { data, error } = await supabase
    .from('module_versions')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => {
    const moduleVersion = mapModuleVersionRow(row)
    return {
      id: moduleVersion.id,
      module_version_id: moduleVersion.id,
      title: moduleVersion.module_title,
      published_at: moduleVersion.published_at ?? moduleVersion.created_at,
      published_by: moduleVersion.published_by ?? 'system',
    }
  })
}

export async function fetchAllAssignmentsWithNames(): Promise<AssignmentWithNames[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .order('assigned_at', { ascending: false })

  if (error) throw error

  const assignments = (data ?? []).map(mapAssignmentRow)
  const profileIds = Array.from(
    new Set(
      assignments
        .flatMap((assignment) => [assignment.assignee_user_id, assignment.assigned_by])
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  )

  const profilesById = await fetchProfilesByIds(profileIds)

  return assignments.map((assignment) => ({
    ...assignment,
    assignee_display_name: assignment.assignee_user_id
      ? (profilesById.get(assignment.assignee_user_id)?.display_name ?? undefined)
      : undefined,
    assigned_by_display_name: profilesById.get(assignment.assigned_by)?.display_name ?? undefined,
  }))
}
