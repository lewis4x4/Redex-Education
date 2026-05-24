import type { FoundryDraftMetadata, FoundryDraftStage, ModuleVersion, UUID } from '@/types/training'
import { getDataSource } from './dataSource'
import * as supabaseDataProvider from './supabaseDataProvider'

export const MODULE_TO_VERSION_MAP: Record<string, string> = {
  'hr-basics-mod-001': 'module-version-hr-basics-v1',
}

export function getModuleVersionId(moduleId: string): string | undefined {
  return MODULE_TO_VERSION_MAP[moduleId]
}

function mockModeNotSupported(): Error {
  return new Error('mock mode: use useModuleVersionsStore directly')
}

function mockFoundryDraftModeNotSupported(): Error {
  return new Error('mock mode: use useFoundryDraftStore directly')
}

export async function getModuleVersionHistory(moduleId: UUID): Promise<ModuleVersion[]> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getModuleVersionHistory(moduleId)
  }

  throw mockModeNotSupported()
}

export async function archiveModuleVersion(versionId: UUID): Promise<ModuleVersion> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.archiveModuleVersion(versionId)
  }

  throw mockModeNotSupported()
}

export async function upsertModuleDraft(input: {
  module_id?: UUID
  module_title: string
  current_stage: FoundryDraftStage
  actor?: { user_id: UUID; display_name: string }
  basics?: FoundryDraftMetadata['basics']
}): Promise<ModuleVersion> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.upsertModuleDraft(input)
  }

  throw mockFoundryDraftModeNotSupported()
}

export async function forkModuleVersion(sourceVersionId: UUID): Promise<ModuleVersion> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.forkModuleVersion(sourceVersionId)
  }

  throw mockModeNotSupported()
}
