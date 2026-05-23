import { supabase } from '@/integrations/supabase/client'
import { mapAssignmentRow } from '@/integrations/supabase/db-rows'
import type { Assignment } from '@/types/training'

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
