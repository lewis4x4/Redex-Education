import { describe, expect, it } from 'vitest'

import type { PromptKey } from './promptTypes'
import {
  CITATION_SENTINEL,
  CLOSED_CONTENT_PREAMBLE,
  REDEX_POLICY_GUARDRAIL,
  VIDEO_SEGMENT_RULE,
} from './promptShared'
import { getPrompt, listPromptKeys, listPrompts, PROMPT_REGISTRY } from './prompts'

const EXPECTED_PROMPT_VERSIONS = {
  source_analysis: 'v1',
  setup_question_inference: 'v1',
  outline_generation: 'v1',
  'lesson_generation.text': 'v1',
  'lesson_generation.checklist': 'v1',
  'lesson_generation.scenario': 'v1',
  'lesson_generation.acknowledgment': 'v1',
  'lesson_generation.quiz': 'v1',
  'lesson_generation.video_script': 'v1',
  'lesson_generation.hotspot_diagram': 'v1',
  'lesson_generation.drag_to_order': 'v1',
  'lesson_generation.practical': 'v1',
  assessment_generation: 'v1',
  self_critique: 'v1',
  regenerate_with_fixes: 'v1',
  regenerate_section: 'v1',
  entailment_check: 'v1',
} as const satisfies Record<PromptKey, string>

const EXPECTED_PROMPT_KEYS = Object.keys(EXPECTED_PROMPT_VERSIONS) as PromptKey[]

describe('PROMPT_REGISTRY', () => {
  it('registers every PromptKey with a PromptDefinition', () => {
    expect([...listPromptKeys()].sort()).toEqual([...EXPECTED_PROMPT_KEYS].sort())

    for (const key of EXPECTED_PROMPT_KEYS) {
      expect(PROMPT_REGISTRY[key]).toMatchObject({
        id: { key, version: EXPECTED_PROMPT_VERSIONS[key] },
        requiresCitations: expect.any(Boolean),
      })
      expect(PROMPT_REGISTRY[key].description).toBeTruthy()
      expect(PROMPT_REGISTRY[key].system).toBeTruthy()
      expect(PROMPT_REGISTRY[key].userTemplate).toBeTruthy()
      expect(PROMPT_REGISTRY[key].requiredVariables.length).toBeGreaterThan(0)
      expect(PROMPT_REGISTRY[key].outputSchemaName).toBeTruthy()
    }
  })

  it('includes the closed-content preamble in every lesson-generation prompt', () => {
    const lessonPrompts = listPrompts().filter((definition) =>
      definition.id.key.startsWith('lesson_generation.'),
    )

    expect(lessonPrompts).toHaveLength(9)

    for (const definition of lessonPrompts) {
      expect(definition.system).toContain(CLOSED_CONTENT_PREAMBLE)
    }
  })

  it('includes the video segment rule in the video script prompt', () => {
    expect(getPrompt('lesson_generation.video_script').system).toContain(VIDEO_SEGMENT_RULE)
  })

  it('returns the latest version when no version is provided', () => {
    expect(getPrompt('outline_generation')).toBe(PROMPT_REGISTRY.outline_generation)
  })

  it('returns a specific version when provided', () => {
    expect(getPrompt('outline_generation', 'v1')).toBe(PROMPT_REGISTRY.outline_generation)
  })

  it('throws for an unregistered key', () => {
    expect(() => getPrompt('non_existent_key' as PromptKey)).toThrow(
      'Prompt not registered: non_existent_key',
    )
  })

  it('includes the canonical Redex policy guardrail in every prompt', () => {
    for (const definition of listPrompts()) {
      expect(definition.system).toContain(REDEX_POLICY_GUARDRAIL)
    }
  })

  it('requires citation prompts to mention the citation sentinel in system text', () => {
    const citationPrompts = listPrompts().filter((definition) => definition.requiresCitations)

    for (const definition of citationPrompts) {
      expect(definition.system).toContain(CITATION_SENTINEL)
    }
  })

  it('locks the registry count', () => {
    expect(listPrompts()).toHaveLength(17)
    expect(listPrompts().length).toMatchInlineSnapshot(`17`)
  })
})
