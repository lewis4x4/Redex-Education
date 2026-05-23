import type { SourceChangeEvent } from '@/lib/education'
import { useModuleVersionsStore } from '@/features/publishing/store/moduleVersionsStore'
import {
  HR_SOURCE_FILE_IDS,
  HR_SOURCE_SECTION_IDS,
  MOCK_FRESH_SOURCE_SECTIONS,
  MOCK_MODULE_SOURCE_BINDINGS,
  MOCK_SOURCE_LIBRARY_FILES,
  MOCK_STORED_SOURCE_SECTIONS,
} from '@/features/source-binder/data/mockModuleSourceBindings'
import { computeAffectedModules, computeChangedSections } from '@/features/source-binder/lib/sourceImpact'
import { useSourceChangeEventsStore } from '@/features/source-binder/store/sourceChangeEventsStore'

export const MOCK_DRIVE_SYNC_DELAY_MS = 600
export const MOCK_OLD_REVISION_ID = 'drive-rev-hr-onboarding-2026-05-22'
export const MOCK_NEW_REVISION_ID = 'drive-rev-hr-onboarding-2026-05-23-payroll-timekeeping'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export async function simulateDriveSync(): Promise<SourceChangeEvent[]> {
  await delay(MOCK_DRIVE_SYNC_DELAY_MS)

  const sourceFile = MOCK_SOURCE_LIBRARY_FILES.find((file) => file.drive_file_id === HR_SOURCE_FILE_IDS.ptoPolicy)

  if (!sourceFile) {
    return []
  }

  const changedSectionIds = computeChangedSections(sourceFile, MOCK_FRESH_SOURCE_SECTIONS, MOCK_STORED_SOURCE_SECTIONS).filter(
    (sectionId) => sectionId === HR_SOURCE_SECTION_IDS.payroll || sectionId === HR_SOURCE_SECTION_IDS.timekeeping,
  )

  if (changedSectionIds.length === 0) {
    return []
  }

  const recordedEvent = useSourceChangeEventsStore.getState().recordChangeEvent({
    id: 'source-change-hr-payroll-timekeeping',
    source_file_id: sourceFile.drive_file_id,
    source_file_name: sourceFile.title,
    section_ids_changed: changedSectionIds,
    old_revision_id: MOCK_OLD_REVISION_ID,
    new_revision_id: MOCK_NEW_REVISION_ID,
  })

  const affectedModules = computeAffectedModules(
    [recordedEvent],
    MOCK_MODULE_SOURCE_BINDINGS,
    useModuleVersionsStore.getState().versions,
  )

  for (const affected of affectedModules) {
    useModuleVersionsStore.getState().markVersionStale(affected.version.id, true)
  }

  return [recordedEvent]
}
