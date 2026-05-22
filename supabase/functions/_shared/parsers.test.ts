import { parseFrontmatter, parseMarkdownSections, parseMetaMd } from './parsers.ts'

function assertEquals<T>(actual: T, expected: T) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Assertion failed.\nActual: ${JSON.stringify(actual)}\nExpected: ${JSON.stringify(expected)}`)
  }
}

if (typeof (globalThis as { describe?: unknown }).describe === 'function') {
  const vitestDescribe = (globalThis as { describe: (name: string, fn: () => void) => void }).describe
  vitestDescribe.skip('Deno-only parser sanity tests', () => {})
}

if (typeof Deno !== 'undefined') {
  Deno.test('parseMarkdownSections returns [] for empty input', () => {
    assertEquals(parseMarkdownSections(''), [])
  })

  Deno.test('parseFrontmatter parses full frontmatter shape', () => {
    const parsed = parseFrontmatter(`---\nauthority: authoritative\ntopic: hr_basics\ntitle: PTO\n---\n# Body`)

    assertEquals(parsed.authority, 'authoritative')
    assertEquals(parsed.authority_source, 'frontmatter')
    assertEquals(parsed.topic, 'hr_basics')
    assertEquals(parsed.title, 'PTO')
    assertEquals(parsed.body, '# Body')
  })

  Deno.test('parseMetaMd returns frontmatter without body', () => {
    const parsed = parseMetaMd(`---\nauthority: supporting\ntopic: safety\ntitle: Safety PDF\n---`)

    assertEquals(parsed, {
      authority: 'supporting',
      authority_source: 'meta_md',
      topic: 'safety',
      title: 'Safety PDF',
    })
  })
}
