import { describe, expect, it } from 'vitest'

import { parseFrontmatter, parseManifest, parseMetaMd } from './manifest'

describe('manifest parsers', () => {
  it('parseFrontmatter populates all supported fields from full frontmatter', () => {
    const parsed = parseFrontmatter(`---\nauthority: authoritative\ntopic: hr_basics\ntitle: PTO Policy\n---\n# Body\nText`)

    expect(parsed).toEqual({
      authority: 'authoritative',
      authority_source: 'frontmatter',
      topic: 'hr_basics',
      title: 'PTO Policy',
      body: '# Body\nText',
    })
  })

  it('parseFrontmatter returns defaults when no frontmatter exists', () => {
    const raw = '# No frontmatter\nBody'
    const parsed = parseFrontmatter(raw)

    expect(parsed).toEqual({
      authority: 'context',
      authority_source: 'default',
      body: raw,
    })
  })

  it('parseFrontmatter defaults unknown authority to context', () => {
    const parsed = parseFrontmatter(`---\nauthority: unknown\ntopic: safety\n---\nBody`)

    expect(parsed.authority).toBe('context')
    expect(parsed.authority_source).toBe('default')
    expect(parsed.topic).toBe('safety')
  })

  it('parseFrontmatter strips only leading frontmatter when body contains --- later', () => {
    const parsed = parseFrontmatter(`---\nauthority: supporting\n---\nFirst line\n---\nSecond line`)

    expect(parsed.authority).toBe('supporting')
    expect(parsed.body).toBe('First line\n---\nSecond line')
  })

  it('parseMetaMd returns metadata only', () => {
    const parsed = parseMetaMd(`---\nauthority: authoritative\ntopic: communication\ntitle: Handbook\n---`)

    expect(parsed).toEqual({
      authority: 'authoritative',
      authority_source: 'meta_md',
      topic: 'communication',
      title: 'Handbook',
    })
  })

  it('parseManifest captures all listed drive_file_id entries', () => {
    const parsed = parseManifest(`---\nmodule_slug: hr_basics\nmodule_title: HR Basics\n---\nThis module is built from:\n- drive_file_id: file-one note: PTO\n- drive_file_id: file-two\n- drive_file_id: file-three note: Conduct`)

    expect(parsed.module_slug).toBe('hr_basics')
    expect(parsed.module_title).toBe('HR Basics')
    expect(parsed.entries).toEqual([
      { drive_file_id: 'file-one', note: 'PTO' },
      { drive_file_id: 'file-two' },
      { drive_file_id: 'file-three', note: 'Conduct' },
    ])
  })

  it('parseManifest skips malformed lines and keeps module_slug', () => {
    const parsed = parseManifest(`---\nmodule_slug: safety\n---\n- drive_file_id\n- note: missing id\n- drive_file_id: valid-one\n- drive_file_id:  note: blank`)

    expect(parsed.module_slug).toBe('safety')
    expect(parsed.entries).toEqual([{ drive_file_id: 'valid-one' }])
  })
})
