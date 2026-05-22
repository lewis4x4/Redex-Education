import { describe, expect, it } from 'vitest'

import { parseMarkdownSections } from './markdownSections'

describe('parseMarkdownSections', () => {
  it('returns an empty array for empty input', () => {
    expect(parseMarkdownSections('')).toEqual([])
  })

  it('returns one level-0 section for plain text without headings', () => {
    const sections = parseMarkdownSections('  Hello world\n\nThis is plain text.  ')

    expect(sections).toHaveLength(1)
    expect(sections[0]).toMatchObject({
      level: 0,
      heading: '',
      body: '  Hello world\n\nThis is plain text.  ',
      position_index: 0,
      id: 'section-0-preamble',
    })
  })

  it('parses a single H1 section', () => {
    const sections = parseMarkdownSections('# Hello\nWorld')

    expect(sections).toHaveLength(1)
    expect(sections[0]).toMatchObject({
      level: 1,
      heading: 'Hello',
      body: 'World',
      position_index: 0,
      id: 'section-0-hello',
    })
  })

  it('splits content across H1 and H2 sections', () => {
    const sections = parseMarkdownSections('# Intro\nTop body\n## Details\nDetail body')

    expect(sections).toHaveLength(2)
    expect(sections[0]).toMatchObject({ level: 1, heading: 'Intro', body: 'Top body' })
    expect(sections[1]).toMatchObject({ level: 2, heading: 'Details', body: 'Detail body' })
  })

  it('preserves section order and levels for mixed heading hierarchy', () => {
    const sections = parseMarkdownSections(
      '# One\nA\n## Two\nB\n### Three\nC\n## Four\nD\n# Five\nE',
    )

    expect(sections).toHaveLength(5)
    expect(sections.map((section) => section.level)).toEqual([1, 2, 3, 2, 1])
    expect(sections.map((section) => section.heading)).toEqual(['One', 'Two', 'Three', 'Four', 'Five'])
  })

  it('creates a preamble section when content appears before first heading', () => {
    const sections = parseMarkdownSections('Lead paragraph\n\n# Heading\nBody')

    expect(sections).toHaveLength(2)
    expect(sections[0]).toMatchObject({ level: 0, heading: '', body: 'Lead paragraph' })
    expect(sections[1]).toMatchObject({ level: 1, heading: 'Heading', body: 'Body' })
  })

  it('does not treat # lines inside code fences as headings', () => {
    const sections = parseMarkdownSections('# Intro\n```\n# Hello\n```\nAfter fence')

    expect(sections).toHaveLength(1)
    expect(sections[0]).toMatchObject({
      heading: 'Intro',
      body: '```\n# Hello\n```\nAfter fence',
    })
  })

  it('flags placeholder tokens and em-dash placeholder marker', () => {
    const sections = parseMarkdownSections(
      '# A\n[PLACEHOLDER]\n# B\n[TODO]\n# C\n[FIXME]\n# D\n[PLACEHOLDER — policy team]',
    )

    expect(sections).toHaveLength(4)
    expect(sections.every((section) => section.has_placeholders)).toBe(true)
  })

  it('generates stable deterministic section ids for repeated parsing', () => {
    const input = '# Welcome to Redex\nBody\n## Next Step\nMore body'

    const first = parseMarkdownSections(input)
    const second = parseMarkdownSections(input)

    expect(first.map((section) => section.id)).toEqual(second.map((section) => section.id))
    expect(first[0]?.id).toBe('section-0-welcome-to-redex')
    expect(first[1]?.id).toBe('section-1-next-step')
  })

  it('trims leading/trailing newlines in body while preserving internal blank lines', () => {
    const sections = parseMarkdownSections('# Heading\n\nLine one\n\nLine two\n\n')

    expect(sections).toHaveLength(1)
    expect(sections[0]?.body).toBe('Line one\n\nLine two')
  })
})
