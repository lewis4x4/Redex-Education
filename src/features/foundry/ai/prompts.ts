import type { PromptDefinition, PromptKey } from './promptTypes'
import {
  CITATION_SENTINEL,
  CLOSED_CONTENT_PREAMBLE,
  JSON_OUTPUT_RULE,
  REDEX_POLICY_GUARDRAIL,
  VIDEO_SEGMENT_RULE,
} from './promptShared'

const citeRule = `${CITATION_SENTINEL} the source section it draws from using the format \`[source: <section_id>]\`. If a claim cannot be cited, flag it as \`[NEEDS_REVIEW: <reason>]\` instead of presenting it as Redex policy.`

const LEARNING_OUTCOMES_SYSTEM_RULE =
  'The author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.'

const prompt = (
  key: PromptKey,
  version: string,
  definition: Omit<PromptDefinition, 'id'>,
): PromptDefinition => ({
  id: { key, version },
  ...definition,
})

const system = (...parts: readonly string[]) =>
  [REDEX_POLICY_GUARDRAIL, citeRule, JSON_OUTPUT_RULE, LEARNING_OUTCOMES_SYSTEM_RULE, ...parts].join('\n\n')

const lessonSystem = (...parts: readonly string[]) =>
  [REDEX_POLICY_GUARDRAIL, CLOSED_CONTENT_PREAMBLE, JSON_OUTPUT_RULE, LEARNING_OUTCOMES_SYSTEM_RULE, ...parts].join('\n\n')

const sourceVariables = ['sourceBlocks', 'learningOutcomes'] as const
const lessonVariables = [
  'moduleBasics',
  'courseOutline',
  'lessonOutline',
  'sourceBlocks',
  'setupAnswers',
  'learningOutcomes',
] as const

const lessonTemplate =
  'Generate content for this lesson.\n\nLearning outcomes:\n{{learningOutcomes}}\n\nModule basics:\n{{moduleBasics}}\n\nCourse outline:\n{{courseOutline}}\n\nLesson outline:\n{{lessonOutline}}\n\nSetup answers:\n{{setupAnswers}}\n\nApproved source blocks:\n{{sourceBlocks}}'

const PROMPT_HISTORY = {
  source_analysis: [
    prompt('source_analysis', 'v1', {
      description:
        'Analyze a source binder, extract authority and topics, identify sections, and flag placeholders or unsupported material.',
      system: [
        REDEX_POLICY_GUARDRAIL,
        JSON_OUTPUT_RULE,
        LEARNING_OUTCOMES_SYSTEM_RULE,
        'Analyze the supplied Redex source binder as evidence, not as learner-facing training copy. Identify stable section_id values, headings, summaries, topic tags, authority levels, placeholder status, conflicts, and missing-source risks. Do not infer Redex policy beyond the supplied binder.',
      ].join('\n\n'),
      userTemplate:
        'Analyze this source binder and return SourceAnalysisOutput.\n\nLearning outcomes:\n{{learningOutcomes}}\n\nSource binder:\n{{sourceBinder}}',
      requiredVariables: ['sourceBinder', 'learningOutcomes'],
      outputSchemaName: 'SourceAnalysisOutput',
      requiresCitations: false,
      enforcedRules: ['Flags placeholders and missing policy instead of inventing content'],
    }),
  ],
  setup_question_inference: [
    prompt('setup_question_inference', 'v1', {
      description:
        'Infer the 3–5 most important setup questions an admin should answer before outline generation.',
      system: system(
        'Review the source binder, source analysis, and target audience. Generate 3–5 admin setup questions that materially affect structure, assessment strictness, scenario context, or learner framing. Each question must explain why the answer matters and cite the source section or setup gap that motivated it.',
      ),
      userTemplate:
        'Infer setup questions and return SetupQuestionInferenceOutput.\n\nLearning outcomes:\n{{learningOutcomes}}\n\nTarget audience:\n{{targetAudience}}\n\nSource analysis:\n{{sourceAnalysis}}\n\nSource blocks:\n{{sourceBlocks}}',
      requiredVariables: ['targetAudience', 'sourceAnalysis', ...sourceVariables],
      outputSchemaName: 'SetupQuestionInferenceOutput',
      requiresCitations: true,
      enforcedRules: ['Generate 3–5 setup questions', 'Questions must cite their source or gap'],
    }),
  ],
  outline_generation: [
    prompt('outline_generation', 'v1', {
      description:
        'Generate a source-cited CourseOutlineDraft from approved source blocks and admin setup answers.',
      system: system(
        'Create a CourseOutlineDraft that sequences lessons from simple context to applied practice and assessment. Every lesson summary, objective, prerequisite, and Redex policy point must cite supporting source sections. If source support is missing, include a missing-source warning instead of fabricating policy.',
      ),
      userTemplate:
        'Generate a CourseOutlineDraft.\n\nLearning outcomes:\n{{learningOutcomes}}\n\nModule basics:\n{{moduleBasics}}\n\nSetup answers:\n{{setupAnswers}}\n\nSource blocks:\n{{sourceBlocks}}',
      requiredVariables: ['moduleBasics', 'setupAnswers', ...sourceVariables],
      outputSchemaName: 'CourseOutlineDraft',
      requiresCitations: true,
      enforcedRules: ['Each lesson cites source sections', 'Unsupported lessons are flagged'],
    }),
  ],
  'lesson_generation.text': [
    prompt('lesson_generation.text', 'v1', {
      description:
        'Generate a source-grounded text lesson with structured blocks at approximately an 8th-grade reading level.',
      system: lessonSystem(
        'Generate TextLessonContent using prose, callout, policy-quote, inline-check, collapsible, config-block, and image blocks only where useful. Maintain approximately an 8th-grade reading level without diluting cited Redex policy. Every load-bearing paragraph, answer, instruction, quote, and visual rationale must cite source sections.',
      ),
      userTemplate: lessonTemplate,
      requiredVariables: lessonVariables,
      outputSchemaName: 'TextLessonContent',
      requiresCitations: true,
      enforcedRules: ['Closed-content only', 'Approximately 8th-grade reading level'],
    }),
  ],
  'lesson_generation.checklist': [
    prompt('lesson_generation.checklist', 'v1', {
      description:
        'Generate a source-grounded checklist lesson with step details and completion guidance.',
      system: lessonSystem(
        'Generate ChecklistLessonContent. Each checklist item must be one observable action or verification step with details_markdown explaining completion, common mistakes, and cited source support. If a procedure is incomplete, flag the missing step rather than filling it in.',
      ),
      userTemplate: lessonTemplate,
      requiredVariables: lessonVariables,
      outputSchemaName: 'ChecklistLessonContent',
      requiresCitations: true,
      enforcedRules: ['One observable action per checklist item', 'details_markdown per step'],
    }),
  ],
  'lesson_generation.scenario': [
    prompt('lesson_generation.scenario', 'v1', {
      description:
        'Generate a branching scenario lesson with worked-example intro, decision screens, choice feedback, and outcome summary.',
      system: lessonSystem(
        'Generate ScenarioLessonContent with a worked-example intro, a branching decision tree, one decision per screen, per-choice feedback, and an outcome summary. Feedback must explain why each choice is correct, partially correct, or incorrect using cited source sections. Do not invent exceptions, penalties, escalation paths, or customer facts.',
      ),
      userTemplate: lessonTemplate,
      requiredVariables: lessonVariables,
      outputSchemaName: 'ScenarioLessonContent',
      requiresCitations: true,
      enforcedRules: ['Worked example intro', 'One decision per screen', 'Per-choice feedback'],
    }),
  ],
  'lesson_generation.acknowledgment': [
    prompt('lesson_generation.acknowledgment', 'v1', {
      description:
        'Generate a policy acknowledgment lesson with source-cited statement markdown and signature requirement.',
      system: lessonSystem(
        'Generate AcknowledgmentLessonContent. statement_markdown must summarize exactly what the learner acknowledges with citations for each obligation. Include a signature or attestation requirement only when supported by source policy or module criticality; otherwise flag for admin review.',
      ),
      userTemplate: lessonTemplate,
      requiredVariables: lessonVariables,
      outputSchemaName: 'AcknowledgmentLessonContent',
      requiresCitations: true,
      enforcedRules: ['statement_markdown required', 'Signature requirement must be source-supported or flagged'],
    }),
  ],
  'lesson_generation.quiz': [
    prompt('lesson_generation.quiz', 'v1', {
      description:
        'Generate a quiz-style lesson shell that can include recognition, free-recall, sequencing, and confidence-rated item types.',
      system: lessonSystem(
        'Generate QuizLessonContent using Slice 11.3 item families: recognition, free_recall, sequencing, and confidence_rated. Include all four when source supports them; otherwise explain what is unsupported. Each prompt, correct answer, distractor rationale, sequence step, confidence cue, and remediation note must be source-cited.',
      ),
      userTemplate: lessonTemplate,
      requiredVariables: lessonVariables,
      outputSchemaName: 'QuizLessonContent',
      requiresCitations: true,
      enforcedRules: [
        'Consider recognition, free_recall, sequencing, and confidence_rated item types',
        'Distractors must be source-grounded misunderstandings',
      ],
    }),
  ],
  'lesson_generation.video': [
    prompt('lesson_generation.video', 'v1.1', {
      description:
        'Generate a source-grounded video lesson with chapters, transcript segments, checkpoints, and transcript provenance.',
      system: lessonSystem(
        VIDEO_SEGMENT_RULE,
        'Generate VideoLessonContent with chapters, transcript_segments, checkpoints, and source citations. transcript_segments must include start_seconds, end_seconds, text_markdown, and derived_from_section_ids. checkpoints should align to segment boundaries and include required/must_answer_correctly only when warranted. Include media/download/provenance fields when known; otherwise omit them.',
      ),
      userTemplate: lessonTemplate,
      requiredVariables: lessonVariables,
      outputSchemaName: 'VideoLessonContent',
      requiresCitations: true,
      enforcedRules: [
        'One segment = one idea',
        'Target 60–120 seconds per segment',
        'derived_from_section_ids required per segment',
      ],
    }),
  ],
  'lesson_generation.coach': [
    prompt('lesson_generation.coach', 'v1', {
      description: 'Generate a source-grounded coach lesson with prompts and guidance.',
      system: lessonSystem(
        'Generate CoachLessonContent with an intro and practical prompts grounded in cited source sections. Flag missing support instead of inventing policy.',
      ),
      userTemplate: lessonTemplate,
      requiredVariables: lessonVariables,
      outputSchemaName: 'CoachLessonContent',
      requiresCitations: true,
      enforcedRules: ['Coach prompts must be source-grounded'],
    }),
  ],
  'lesson_generation.assignment': [
    prompt('lesson_generation.assignment', 'v1', {
      description: 'Generate a source-grounded assignment lesson with clear instructions and rubric guidance.',
      system: lessonSystem(
        'Generate AssignmentLessonContent with explicit instructions, completion evidence, and rubric criteria grounded in source citations.',
      ),
      userTemplate: lessonTemplate,
      requiredVariables: lessonVariables,
      outputSchemaName: 'AssignmentLessonContent',
      requiresCitations: true,
      enforcedRules: ['Assignment instructions must be source-grounded'],
    }),
  ],
  'lesson_generation.reflection_prompt': [
    prompt('lesson_generation.reflection_prompt', 'v1', {
      description: 'Generate a source-grounded reflection prompt lesson.',
      system: lessonSystem(
        'Generate ReflectionPromptLessonContent with one clear reflective prompt grounded in cited source material.',
      ),
      userTemplate: lessonTemplate,
      requiredVariables: lessonVariables,
      outputSchemaName: 'ReflectionPromptLessonContent',
      requiresCitations: true,
      enforcedRules: ['Reflection prompt must be source-grounded'],
    }),
  ],
  'lesson_generation.video_script': [
    prompt('lesson_generation.video_script', 'v1.1', {
      description:
        'Generate a video script with chapters, semantic transcript segments, segment-boundary checkpoints, and transcript provenance.',
      system: lessonSystem(
        VIDEO_SEGMENT_RULE,
        'Generate VideoLessonContent with chapters, transcript_segments, checkpoints, and source citations. transcript_segments must include start_seconds, end_seconds, text_markdown, and derived_from_section_ids. checkpoints should align to segment boundaries and include required/must_answer_correctly only when warranted. Include media/download/provenance fields when known; otherwise omit them.',
      ),
      userTemplate: lessonTemplate,
      requiredVariables: lessonVariables,
      outputSchemaName: 'VideoLessonContent',
      requiresCitations: true,
      enforcedRules: [
        'One segment = one idea',
        'Target 60–120 seconds per segment',
        'derived_from_section_ids required per segment',
      ],
    }),
  ],
  'lesson_generation.hotspot_diagram': [
    prompt('lesson_generation.hotspot_diagram', 'v1', {
      description:
        'Generate source-grounded hotspot annotations for an image-based lesson; Phase 10.4 schema is represented by HotspotLessonContent.',
      system: lessonSystem(
        'Generate HotspotLessonContent for Phase 10.4, even if the downstream schema is still a stub. Define each hotspot with id, target label, position instructions, learner annotation, feedback, and citations. If image coordinates, labels, or support are missing, flag the hotspot instead of inventing visual details.',
      ),
      userTemplate: `${lessonTemplate}\n\nImage context (pass an empty string if unavailable):\n{{imageContext}}`,
      requiredVariables: [...lessonVariables, 'imageContext'],
      outputSchemaName: 'HotspotLessonContent',
      requiresCitations: true,
      enforcedRules: ['Phase 10.4 schema may be stubbed', 'No invented visual details'],
    }),
  ],
  'lesson_generation.drag_to_order': [
    prompt('lesson_generation.drag_to_order', 'v1', {
      description:
        'Generate source-grounded ordered procedure steps for a drag-to-order lesson; Phase 10.5 schema is represented by OrderingLessonContent.',
      system: lessonSystem(
        'Generate OrderingLessonContent for Phase 10.5. Return ordered steps[] where each step has id, label, optional detail_markdown, and optional source_section_id. Each step must be atomic and source-cited. If order is ambiguous or incomplete, flag it instead of inventing steps.',
      ),
      userTemplate: lessonTemplate,
      requiredVariables: lessonVariables,
      outputSchemaName: 'OrderingLessonContent',
      requiresCitations: true,
      enforcedRules: ['OrderingLessonContent schema required', 'No inferred procedure steps'],
    }),
  ],
  'lesson_generation.practical': [
    prompt('lesson_generation.practical', 'v1', {
      description:
        'Generate a practical lesson with an observation checklist; Phase 11.1 schema is represented by PracticalLessonContent.',
      system: lessonSystem(
        'Generate PracticalLessonContent for Phase 11.1, even if the downstream schema is still a stub. Define the practice task, setup conditions, observable success criteria, observation checklist, coaching notes, and remediation path. Do not invent tools, environments, safety requirements, supervisor actions, or thresholds.',
      ),
      userTemplate: lessonTemplate,
      requiredVariables: lessonVariables,
      outputSchemaName: 'PracticalLessonContent',
      requiresCitations: true,
      enforcedRules: ['Phase 11.1 schema may be stubbed', 'Observation checklist required'],
    }),
  ],
  assessment_generation: [
    prompt('assessment_generation', 'v1', {
      description:
        'Generate competency-tagged assessment items for the Slice 11.2 item-bank schema shape.',
      system: system(
        'Generate assessment items for the Slice 11.2 item-bank schema shape. Each item must include competency tags, criticality, difficulty, item type, prompt, expected answer or scoring rubric, remediation guidance, and cited source sections. Use recognition, free_recall, sequencing, confidence_rated, and scenario-style items only where source supports them.',
      ),
      userTemplate:
        'Generate assessment items and return AssessmentGenerationOutput.\n\nLearning outcomes:\n{{learningOutcomes}}\n\nModule basics:\n{{moduleBasics}}\n\nCourse outline:\n{{courseOutline}}\n\nSetup answers:\n{{setupAnswers}}\n\nApproved source blocks:\n{{sourceBlocks}}',
      requiredVariables: ['moduleBasics', 'courseOutline', 'setupAnswers', ...sourceVariables],
      outputSchemaName: 'AssessmentGenerationOutput',
      requiresCitations: true,
      enforcedRules: ['Competency tags required', 'Slice 11.2 item-bank shape'],
    }),
  ],
  self_critique: [
    prompt('self_critique', 'v1', {
      description:
        'Critique generated Foundry content for source support, publish blockers, and Slice 11.7 pedagogical quality issues.',
      system: system(
        'Review generated artifacts for unsupported claims, missing citations, invented Redex policy, unresolved source conflicts, placeholder leakage, stale prompt versions, and publish blockers. Also flag Slice 11.7 issues: weak_assessment_design, missing_worked_example, inert_content, cognitive_overload, and segment_too_long. Return severity, affected artifact id, source section ids, explanation, and actionable fix; do not rewrite content in this pass.',
      ),
      userTemplate:
        'Critique these generated artifacts and return SelfCritiqueOutput.\n\nLearning outcomes:\n{{learningOutcomes}}\n\nPrompt ids used:\n{{promptIds}}\n\nSource blocks:\n{{sourceBlocks}}\n\nCourse outline:\n{{courseOutline}}\n\nGenerated lessons:\n{{generatedLessons}}\n\nGenerated assessments:\n{{generatedAssessments}}',
      requiredVariables: [
        'promptIds',
        ...sourceVariables,
        'courseOutline',
        'generatedLessons',
        'generatedAssessments',
      ],
      outputSchemaName: 'SelfCritiqueOutput',
      requiresCitations: true,
      enforcedRules: [
        'Flags weak_assessment_design',
        'Flags missing_worked_example',
        'Flags inert_content',
        'Flags cognitive_overload',
        'Flags segment_too_long',
      ],
    }),
  ],
  regenerate_with_fixes: [
    prompt('regenerate_with_fixes', 'v1', {
      description:
        'Regenerate affected lesson sections from existing content, critique issues, and explicit fixes to apply.',
      system: lessonSystem(
        'Regenerate only affected sections of the existing lesson using critique issues and fixes-to-apply. Preserve unaffected structure, ids, citations, and approved wording where possible. If a requested fix cannot be supported by source, flag it as unsupported. Return content in the same lesson output schema as the input lesson type.',
      ),
      userTemplate:
        'Regenerate the affected lesson sections.\n\nLearning outcomes:\n{{learningOutcomes}}\n\nExisting lesson:\n{{existingLesson}}\n\nCritique issues:\n{{critiqueIssues}}\n\nFixes to apply:\n{{fixesToApply}}\n\nApproved source blocks:\n{{sourceBlocks}}',
      requiredVariables: ['existingLesson', 'critiqueIssues', 'fixesToApply', ...sourceVariables],
      outputSchemaName: 'RegeneratedLessonContent',
      requiresCitations: true,
      enforcedRules: ['Preserve unaffected sections', 'Output same lesson type as input'],
    }),
  ],
  regenerate_section: [
    prompt('regenerate_section', 'v1', {
      description:
        "Regenerate only lessons bound to a single source section for AI Slice C's section-scoped partial-regeneration job type.",
      system: lessonSystem(
        "Perform section-scoped regeneration for job_type: 'section'. Regenerate only lessons or fragments bound to the supplied source_section_id and module_version_id. Use the target source block as primary authority; use other source blocks only for context or conflict detection. If the target section is missing, placeholder, unclear, or unsupported, return review-needed results instead of fake policy.",
      ),
      userTemplate:
        'Regenerate only lessons bound to the target source section.\n\nLearning outcomes:\n{{learningOutcomes}}\n\nModule version id:\n{{moduleVersionId}}\n\nTarget source section id:\n{{sourceSectionId}}\n\nLessons bound to section:\n{{boundLessons}}\n\nTarget source block:\n{{targetSourceBlock}}\n\nOther approved source blocks:\n{{sourceBlocks}}',
      requiredVariables: [
        'moduleVersionId',
        'sourceSectionId',
        'boundLessons',
        'targetSourceBlock',
        ...sourceVariables,
      ],
      outputSchemaName: 'SectionRegenerationOutput',
      requiresCitations: true,
      enforcedRules: [
        "Supports job_type: 'section'",
        'Only regenerates lessons bound to the target source section',
      ],
    }),
  ],
  entailment_check: [
    prompt('entailment_check', 'v1', {
      description:
        'Judge whether one cited source section entails one generated claim without adding outside knowledge.',
      system: [
        REDEX_POLICY_GUARDRAIL,
        JSON_OUTPUT_RULE,
        LEARNING_OUTCOMES_SYSTEM_RULE,
        'You are a strict grounding judge. Decide whether the supplied source section ENTAILS the generated claim. Use only the section text. Return entailed=false when the claim adds policy, timing, people, obligations, exceptions, or certainty not present in the source. Provide one concise sentence of reasoning.',
      ].join('\n\n'),
      userTemplate:
        'Does this source section entail the claim? Return EntailmentCheckOutput.\n\nLearning outcomes:\n{{learningOutcomes}}\n\nClaim:\n{{claim}}\n\nSource section:\n{{sourceSection}}',
      requiredVariables: ['learningOutcomes', 'claim', 'sourceSection'],
      outputSchemaName: 'EntailmentCheckOutput',
      requiresCitations: false,
      enforcedRules: ['No outside knowledge', 'Strict entailment only'],
    }),
  ],
} as const satisfies Record<PromptKey, readonly PromptDefinition[]>

const latestPrompt = (key: PromptKey): PromptDefinition => {
  const latest = PROMPT_HISTORY[key].at(-1)

  if (!latest) {
    throw new Error(`Prompt not registered: ${key}`)
  }

  return latest
}

export const PROMPT_REGISTRY = Object.fromEntries(
  (Object.keys(PROMPT_HISTORY) as PromptKey[]).map((key) => [key, latestPrompt(key)]),
) as Record<PromptKey, PromptDefinition>

export function getPrompt(key: PromptKey, version?: string): PromptDefinition {
  const definitions = (PROMPT_HISTORY as Partial<Record<string, readonly PromptDefinition[]>>)[key]

  if (!definitions) {
    throw new Error(`Prompt not registered: ${key}`)
  }

  if (!version) {
    const latest = definitions.at(-1)

    if (!latest) {
      throw new Error(`Prompt not registered: ${key}`)
    }

    return latest
  }

  const match = definitions.find((definition) => definition.id.version === version)

  if (!match) {
    throw new Error(`Prompt version not registered: ${key}@${version}`)
  }

  return match
}

export function listPrompts(): readonly PromptDefinition[] {
  return Object.values(PROMPT_REGISTRY)
}

export function listPromptKeys(): readonly PromptKey[] {
  return Object.keys(PROMPT_REGISTRY) as PromptKey[]
}
