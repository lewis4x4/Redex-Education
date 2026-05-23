import type { ModuleVersion, SourceChangeEvent, SourceFile, SourceSection } from '@/lib/education'
import type { ModuleSourceBinding } from '@/features/source-binder/data/mockModuleSourceBindings'

export interface AffectedModule {
  version: ModuleVersion
  affectedLessonIds: string[]
  affectedSectionIds: string[]
  changedSourceFileIds: string[]
}

function sortUnique(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

function sectionKey(section: SourceSection): string {
  return section.id || section.heading.toLowerCase().trim()
}

function sectionChanged(fresh: SourceSection, stored: SourceSection): boolean {
  return (
    fresh.heading !== stored.heading ||
    fresh.body !== stored.body ||
    fresh.level !== stored.level ||
    fresh.has_placeholders !== stored.has_placeholders
  )
}

export function computeChangedSections(
  _file: SourceFile,
  freshSections: SourceSection[],
  storedSections: SourceSection[],
): string[] {
  const storedByKey = new Map(storedSections.map((section) => [sectionKey(section), section]))
  const freshByKey = new Map(freshSections.map((section) => [sectionKey(section), section]))
  const changedIds: string[] = []

  for (const freshSection of freshSections) {
    const storedSection = storedByKey.get(sectionKey(freshSection))

    if (!storedSection || sectionChanged(freshSection, storedSection)) {
      changedIds.push(freshSection.id)
    }
  }

  for (const storedSection of storedSections) {
    if (!freshByKey.has(sectionKey(storedSection))) {
      changedIds.push(storedSection.id)
    }
  }

  return sortUnique(changedIds)
}

export function computeAffectedModules(
  events: SourceChangeEvent[],
  bindings: ModuleSourceBinding[],
  versions: ModuleVersion[],
): AffectedModule[] {
  if (events.length === 0 || bindings.length === 0 || versions.length === 0) {
    return []
  }

  const versionById = new Map(versions.map((version) => [version.id, version]))
  const affectedByVersion = new Map<
    string,
    {
      lessonIds: Set<string>
      sectionIds: Set<string>
      sourceFileIds: Set<string>
    }
  >()

  for (const event of events) {
    if (event.status === 'resolved') {
      continue
    }

    const changedSectionIds = new Set(event.section_ids_changed)
    const matchingBindings = bindings.filter(
      (binding) => binding.source_file_id === event.source_file_id && changedSectionIds.has(binding.section_id),
    )

    for (const binding of matchingBindings) {
      if (!versionById.has(binding.module_version_id)) {
        continue
      }

      const record =
        affectedByVersion.get(binding.module_version_id) ??
        {
          lessonIds: new Set<string>(),
          sectionIds: new Set<string>(),
          sourceFileIds: new Set<string>(),
        }

      for (const lessonId of binding.lesson_ids) {
        record.lessonIds.add(lessonId)
      }

      record.sectionIds.add(binding.section_id)
      record.sourceFileIds.add(event.source_file_id)
      affectedByVersion.set(binding.module_version_id, record)
    }
  }

  return Array.from(affectedByVersion.entries())
    .map(([versionId, record]) => {
      const version = versionById.get(versionId)

      if (!version) {
        return undefined
      }

      return {
        version,
        affectedLessonIds: sortUnique(record.lessonIds),
        affectedSectionIds: sortUnique(record.sectionIds),
        changedSourceFileIds: sortUnique(record.sourceFileIds),
      }
    })
    .filter((affected): affected is AffectedModule => affected !== undefined)
    .sort((a, b) => a.version.module_title.localeCompare(b.version.module_title))
}
