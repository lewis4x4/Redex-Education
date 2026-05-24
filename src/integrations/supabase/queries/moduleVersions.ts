import { supabase } from '@/integrations/supabase/client'
import { mapModuleVersionRow } from '@/integrations/supabase/db-rows'
import type { ModuleVersion } from '@/types/training'

export async function fetchModuleVersionHistory(moduleId: string): Promise<ModuleVersion[]> {
  const { data, error } = await supabase
    .from('module_versions')
    .select('*')
    .eq('module_id', moduleId)
    .order('version_number', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapModuleVersionRow)
}
