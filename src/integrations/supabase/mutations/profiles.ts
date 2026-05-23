import { supabase } from '@/integrations/supabase/client'
import { mapProfileRow } from '@/integrations/supabase/db-rows'
import type { User } from '@/types/training'
import { safeRetry } from './_idempotency'
import { requireMutationData, throwOnMutationError } from './_response'

/**
 * Upserts a profile row keyed by auth user id.
 *
 * redex.profiles.id references auth.users(id), so this will fail until the
 * matching Supabase auth user exists (Slice 8.6 wires real auth + RLS).
 */
export async function upsertProfile(user: User): Promise<User> {
  const result = await safeRetry(() =>
    supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          org_id: user.org_id,
          email: user.email,
          display_name: user.display_name,
          role: user.role,
          updated_at: user.updated_at,
        },
        { onConflict: 'id' },
      )
      .select('*')
      .single(),
  )

  throwOnMutationError('upsert profile', result.error)
  return mapProfileRow(requireMutationData('upsert profile', result.data))
}
