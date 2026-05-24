/**
 * Identifies a specific prompt in the registry. The id is stable; the version
 * is bumped whenever the prompt body or output schema changes.
 */
export interface PromptId {
  readonly key: PromptKey
  /** semver-ish: 'v1', 'v1.1', etc. */
  readonly version: string
}

export type PromptKey =
  | 'source_analysis'
  | 'setup_question_inference'
  | 'outline_generation'
  | 'lesson_generation.text'
  | 'lesson_generation.checklist'
  | 'lesson_generation.scenario'
  | 'lesson_generation.acknowledgment'
  | 'lesson_generation.quiz'
  | 'lesson_generation.video'
  | 'lesson_generation.coach'
  | 'lesson_generation.assignment'
  | 'lesson_generation.reflection_prompt'
  | 'lesson_generation.video_script'
  | 'lesson_generation.hotspot_diagram'
  | 'lesson_generation.drag_to_order'
  | 'lesson_generation.practical'
  | 'assessment_generation'
  | 'self_critique'
  | 'regenerate_with_fixes'
  | 'regenerate_section'
  | 'entailment_check'

/**
 * A complete prompt definition. Stored in the registry and referenced
 * by PromptId. Includes the system prompt body, output schema hint
 * (used by the AI service interface to enforce structure), and the
 * version stored on every generated artifact for audit.
 */
export interface PromptDefinition {
  readonly id: PromptId
  readonly description: string
  /** Full system prompt text — closed-content preamble included where required. */
  readonly system: string
  /** User-message template; takes runtime variables. */
  readonly userTemplate: string
  /** Required variable names for userTemplate. Validated at call time. */
  readonly requiredVariables: readonly string[]
  /**
   * Output schema hint — informs AI Slice B's Zod validation.
   * For mock mode this can be ignored; for real generation it's load-bearing.
   */
  readonly outputSchemaName: string
  /** Whether this prompt MUST cite source per-claim. */
  readonly requiresCitations: boolean
  /** Optional hard rules (segment length, etc.) that prompts of this kind enforce. */
  readonly enforcedRules?: readonly string[]
}
