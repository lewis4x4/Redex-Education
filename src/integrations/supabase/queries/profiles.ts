import { supabase } from '@/integrations/supabase/client'
import { mapProfileRow } from '@/integrations/supabase/db-rows'
import type { User } from '@/types/training'

export async function fetchProfileByUserId(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data === null ? null : mapProfileRow(data)
}

export async function fetchProfilesByIds(
  ids: string[],
): Promise<Map<string, { display_name: string | null; preferred_name: string | null }>> {
  if (ids.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase.from('profiles').select('*').in('id', ids)

  if (error) throw error

  return new Map(
    (data ?? []).map((profile) => {
      const profileRecord = profile as Record<string, unknown>
      return [
        profile.id,
        {
          display_name: profile.display_name,
          preferred_name:
            typeof profileRecord.preferred_name === 'string' ? profileRecord.preferred_name : null,
        },
      ]
    }),
  )
}

export async function fetchAllProfiles(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('display_name', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapProfileRow)
}

export async function fetchProfilesByManagerId(managerId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('manager_id', managerId)
    .order('display_name', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapProfileRow)
}
