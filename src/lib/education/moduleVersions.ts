import type { ModuleVersion, UUID } from '@/types/training'
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
