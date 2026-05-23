import { supabase } from '@/integrations/supabase/client'
import {
  mapModuleSourceBindingRow,
  mapSourceFileRow,
  mapSourceFileVersionRow,
  mapSourceSectionRow,
} from '@/integrations/supabase/db-rows'
import type { ModuleSourceBinding, SourceFile, SourceFileVersion, SourceSection } from '@/types/training'

export async function fetchSourceFiles(): Promise<SourceFile[]> {
  const { data, error } = await supabase
    .from('source_files')
    .select('*')
    .order('topic', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapSourceFileRow)
}

export async function fetchSourceFileVersions(sourceFileId: string): Promise<SourceFileVersion[]> {
  const { data, error } = await supabase
    .from('source_file_versions')
    .select('*')
    .eq('source_file_id', sourceFileId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapSourceFileVersionRow)
}

export async function fetchSourceSections(sourceFileVersionId: string): Promise<SourceSection[]> {
  const { data, error } = await supabase
    .from('source_sections')
    .select('*')
    .eq('source_file_version_id', sourceFileVersionId)
    .order('position_index', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapSourceSectionRow)
}

export async function fetchModuleSourceBindings(moduleVersionId: string): Promise<ModuleSourceBinding[]> {
  const { data, error } = await supabase
    .from('module_source_bindings')
    .select('*')
    .eq('module_version_id', moduleVersionId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapModuleSourceBindingRow)
}
