import { describe, expect, it } from 'vitest'

import type { ModuleVersion, SourceChangeEvent, SourceFile, SourceSection } from '@/lib/education'
import type { ModuleSourceBinding } from '@/features/source-binder/data/mockModuleSourceBindings'
import { computeAffectedModules, computeChangedSections } from './sourceImpact'

const publishedVersion: ModuleVersion = {
  id: 'version-a',
  module_id: 'module-a',
  module_title: 'Module A',
  version_number: 1,
  status: 'published',
  created_at: '2026-05-23T00:00:00.000Z',
}

const unrelatedVersion: ModuleVersion = {
  id: 'version-b',
  module_id: 'module-b',
  module_title: 'Module B',
  version_number: 1,
  status: 'published',
  created_at: '2026-05-23T00:00:00.000Z',
}

function event(sectionIds: string[]): SourceChangeEvent {
  return {
    id: 'event-1',
    source_file_id: 'file-1',
    source_file_name: 'policy.md',
    section_ids_changed: sectionIds,
    old_revision_id: 'old-rev',
    new_revision_id: 'new-rev',
    detected_at: '2026-05-23T00:00:00.000Z',
    status: 'unreviewed',
  }
}

function section(id: string, body: string): SourceSection {
  return {
    id,
    level: 2,
    heading: id,
    body,
    position_index: 0,
    has_placeholders: body.includes('[PLACEHOLDER]'),
  }
}

describe('sourceImpact', () => {
  it('flags only modules bound to changed sections', () => {
    const bindings: ModuleSourceBinding[] = [
      {
        module_version_id: 'version-a',
        source_file_id: 'file-1',
        section_id: 'section-a',
        bound_revision_id: 'old-rev',
        lesson_ids: ['lesson-a'],
      },
      {
        module_version_id: 'version-b',
        source_file_id: 'file-1',
        section_id: 'section-b',
        bound_revision_id: 'old-rev',
        lesson_ids: ['lesson-b'],
      },
    ]

    expect(computeAffectedModules([event(['section-a'])], bindings, [publishedVersion, unrelatedVersion])).toEqual([
      {
        version: publishedVersion,
        affectedLessonIds: ['lesson-a'],
        affectedSectionIds: ['section-a'],
        changedSourceFileIds: ['file-1'],
      },
    ])
  })

  it('detects content diffs at section level', () => {
    const file = { id: 'file-1', drive_file_id: 'file-1', title: 'policy.md' } as SourceFile

    expect(
      computeChangedSections(file, [section('section-a', 'updated'), section('section-b', 'same')], [section('section-a', 'old'), section('section-b', 'same')]),
    ).toEqual(['section-a'])
  })

  it('detects deleted stored sections as changes', () => {
    const file = { id: 'file-1', drive_file_id: 'file-1', title: 'policy.md' } as SourceFile

    expect(computeChangedSections(file, [section('section-a', 'same')], [section('section-a', 'same'), section('section-c', 'removed')])).toEqual([
      'section-c',
    ])
  })

  it('returns empty affected modules for empty events, missing bindings, and missing versions', () => {
    const bindings: ModuleSourceBinding[] = [
      {
        module_version_id: 'missing-version',
        source_file_id: 'file-1',
        section_id: 'section-a',
        bound_revision_id: 'old-rev',
        lesson_ids: ['lesson-a'],
      },
    ]

    expect(computeAffectedModules([], bindings, [publishedVersion])).toEqual([])
    expect(computeAffectedModules([event(['section-a'])], [], [publishedVersion])).toEqual([])
    expect(computeAffectedModules([event(['section-a'])], bindings, [publishedVersion])).toEqual([])
  })
})
