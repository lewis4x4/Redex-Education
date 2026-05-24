import { supabase } from '@/integrations/supabase/client'
import { insertAssignment } from '@/integrations/supabase/mutations/assignments'
import { useAuditLogStore } from '@/features/audit/store/auditLogStore'
import type { Role, UUID } from '@/types/training'

export interface OnboardNewPersonInput {
  email: string
  display_name: string
  role: Role
  department?: string
  manager_id?: UUID
  start_date?: string
  auto_assigned_module_version_ids: UUID[]
  assigned_by: UUID
  actor_name: string
}

interface InviteUserResponse {
  ok: boolean
  user_id: UUID
  profile_id: UUID
}

export async function onboardNewPerson(input: OnboardNewPersonInput): Promise<{ user_id: UUID; profile_id: UUID }> {
  const { data, error } = await supabase.functions.invoke<InviteUserResponse>('invite-user', {
    body: {
      email: input.email,
      display_name: input.display_name,
      role: input.role,
      department: input.department ?? null,
      manager_id: input.manager_id ?? null,
      start_date: input.start_date ?? null,
    },
  })

  if (error) {
    throw new Error(`Failed to onboard user: ${error.message}`)
  }

  if (!data?.ok || !data.user_id || !data.profile_id) {
    throw new Error('Failed to onboard user: invite-user returned no user payload')
  }

  for (const moduleVersionId of input.auto_assigned_module_version_ids) {
    await insertAssignment({
      module_version_id: moduleVersionId,
      assignee_user_id: data.profile_id,
      assigned_by: input.assigned_by,
    })
  }

  useAuditLogStore.getState().recordEvent({
    event_type: 'user_onboarded',
    actor_user_id: input.assigned_by,
    actor_name: input.actor_name,
    entity_type: 'user',
    entity_id: data.profile_id,
    entity_label: `${input.display_name} (${input.email})`,
    metadata: {
      role: input.role,
      assigned_module_count: input.auto_assigned_module_version_ids.length,
    },
  })

  return { user_id: data.user_id, profile_id: data.profile_id }
}
