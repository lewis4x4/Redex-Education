import type { ModuleSourceBinding, SourceFile, SourceFileVersion, SourceSection } from '@/types/training'
import {
  MOCK_MODULE_SOURCE_BINDINGS,
  MOCK_SOURCE_LIBRARY_FILES,
  MOCK_STORED_SOURCE_SECTIONS,
} from '@/features/source-binder/data/mockModuleSourceBindings'
import { DEMO_HR_BASICS_MODULE } from './demo-data'
import { getDataSource } from './dataSource'
import * as supabaseDataProvider from './supabaseDataProvider'

const MOCK_SOURCE_FILE_VERSIONS: SourceFileVersion[] = MOCK_SOURCE_LIBRARY_FILES.flatMap((file) => {
  if (!file.current_version_id) return []

  return [
    {
      id: file.current_version_id,
      source_file_id: file.id,
      head_revision_id: `${file.drive_file_id}-revision`,
      parse_status: file.processing_status,
      created_at: file.created_at,
    },
  ]
})

const MOCK_DOMAIN_MODULE_SOURCE_BINDINGS: ModuleSourceBinding[] = MOCK_MODULE_SOURCE_BINDINGS.map((binding) => {
  const sourceFile = MOCK_SOURCE_LIBRARY_FILES.find((file) => file.id === binding.source_file_id)

  return {
    id: `${binding.module_version_id}-${binding.section_id}`,
    module_id: DEMO_HR_BASICS_MODULE.id,
    source_file_id: binding.source_file_id,
    source_file_version_id: sourceFile?.current_version_id ?? binding.bound_revision_id,
    source_section_id: binding.section_id,
    binding_kind: 'section',
    flagged_for_review: false,
    created_at: '2026-05-22T20:00:00.000Z',
  }
})

export async function getSourceFiles(): Promise<SourceFile[]> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getSourceFiles()
  }

  return MOCK_SOURCE_LIBRARY_FILES
}

export async function getSourceFileVersions(sourceFileId: string): Promise<SourceFileVersion[]> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getSourceFileVersions(sourceFileId)
  }

  return MOCK_SOURCE_FILE_VERSIONS.filter((version) => version.source_file_id === sourceFileId)
}

export async function getSourceSections(sourceFileVersionId: string): Promise<SourceSection[]> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getSourceSections(sourceFileVersionId)
  }

  const matchingVersion = MOCK_SOURCE_FILE_VERSIONS.find((version) => version.id === sourceFileVersionId)
  return matchingVersion ? MOCK_STORED_SOURCE_SECTIONS : []
}

export async function getModuleSourceBindings(moduleVersionId: string): Promise<ModuleSourceBinding[]> {
  if (getDataSource() === 'supabase') {
    return supabaseDataProvider.getModuleSourceBindings(moduleVersionId)
  }

  return MOCK_DOMAIN_MODULE_SOURCE_BINDINGS.filter((binding) => {
    const sourceBinding = MOCK_MODULE_SOURCE_BINDINGS.find(
      (mockBinding) => `${mockBinding.module_version_id}-${mockBinding.section_id}` === binding.id,
    )
    return sourceBinding?.module_version_id === moduleVersionId
  })
}
