import { supabase } from '@/integrations/supabase/client'
import { mapAssignmentRow } from '@/integrations/supabase/db-rows'
import type { Assignment, ISODateTime, Role, UUID } from '@/types/training'
import { createClientSideUUID, normalizeClientUUID, safeRetry } from './_idempotency'
import { requireMutationData, throwOnMutationError } from './_response'

type AssignmentStatus = Assignment['status']

export async function createAssignment(input: {
  id?: UUID
  module_version_id: UUID
  assignee_user_id?: UUID
  assignee_role?: Role
  assigned_by: UUID
  due_at?: ISODateTime
}): Promise<Assignment> {
  const result = await safeRetry(() =>
    supabase
      .from('assignments')
      .insert({
        id: input.id ? normalizeClientUUID(input.id, 'assignments') : createClientSideUUID('assignment'),
        module_version_id: normalizeClientUUID(input.module_version_id, 'module_versions'),
        assignee_user_id: input.assignee_user_id ? normalizeClientUUID(input.assignee_user_id, 'profiles') : null,
        assignee_role: input.assignee_role ?? null,
        assigned_by: normalizeClientUUID(input.assigned_by, 'profiles'),
        due_at: input.due_at ?? null,
        status: 'pending',
      })
      .select('*')
      .single(),
  )

  throwOnMutationError('insert assignment', result.error)
  return mapAssignmentRow(requireMutationData('insert assignment', result.data))
}

export const insertAssignment = createAssignment

export async function updateAssignmentStatus(input: { id: UUID; status: AssignmentStatus }): Promise<Assignment> {
  const result = await safeRetry(() =>
    supabase
      .from('assignments')
      .update({ status: input.status })
      .eq('id', normalizeClientUUID(input.id, 'assignments'))
      .select('*')
      .single(),
  )

  throwOnMutationError('update assignment status', result.error)
  return mapAssignmentRow(requireMutationData('update assignment status', result.data))
}
