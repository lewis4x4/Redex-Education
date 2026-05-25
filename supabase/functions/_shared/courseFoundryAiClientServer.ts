import { z } from "https://esm.sh/zod@3.25.76";

export class ProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`AI_PROVIDER_API_KEY is required before ${provider} generation can run.`);
    this.name = "ProviderNotConfiguredError";
  }
}

class AiProviderError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
    this.name = "AiProviderError";
  }
}

export type AiProvider = "anthropic" | "openai";

type PromptKey =
  | "source_analysis"
  | "outline_generation"
  | "lesson_generation.text"
  | "lesson_generation.quiz"
  | "lesson_generation.checklist"
  | "lesson_generation.acknowledgment"
  | "lesson_generation.scenario"
  | "lesson_generation.video"
  | "lesson_generation.video_script"
  | "lesson_generation.coach"
  | "lesson_generation.assignment"
  | "lesson_generation.reflection_prompt"
  | "lesson_generation.hotspot_diagram"
  | "lesson_generation.drag_to_order"
  | "assessment_generation"
  | "self_critique"
  | "regenerate_with_fixes"
  | "regenerate_section"
  | "entailment_check";

interface PromptDefinition {
  id: { key: PromptKey; version: string };
  system: string;
  user: string;
}

export interface CostedAiResult<T> {
  output: T;
  cost_cents: number;
  estimated_cost_cents: number;
  model_used: string;
  prompt_version: string;
}

export interface AnalyzeSourceInput {
  sources: unknown;
}

export interface GenerateOutlineInput {
  basics: unknown;
  sources: unknown;
  setupAnswers: unknown;
  learning_outcomes?: Array<{ id: string; text: string }>;
}

export interface GenerateLessonsInput {
  outline: unknown;
  sources: unknown;
  targetSectionId?: string | null;
  learning_outcomes?: Array<{ id: string; text: string }>;
}

export interface GenerateAssessmentInput {
  module: unknown;
  sources: unknown;
}

export interface CritiqueModuleInput {
  module: unknown;
  sources: unknown;
  assessments?: unknown;
  courseOutline?: unknown;
  generatedAssessments?: unknown;
  promptIds?: string[];
  learning_outcomes?: Array<{ id: string; text: string }>;
}

export interface RegenerateWithFixesInput {
  module: unknown;
  critique: unknown;
  selectedFixes: string[];
  sources: unknown;
}

export interface RegenerateSectionInput {
  moduleVersionId: string;
  sourceSectionId: string;
  affectedLessonIds: string[];
  sources: unknown;
}

export interface EntailmentCheckInput {
  claim: string;
  sourceSection: { id: string; heading: string; body: string };
}

export interface EntailmentCheckOutput {
  entailed: boolean;
  confidence: "high" | "low";
  reasoning: string;
}

const JSON_OUTPUT_RULE = "Return only valid JSON matching the requested schema. Do not wrap the JSON in markdown fences.";
const REDEX_POLICY_GUARDRAIL = "You generate Redex Education training drafts only from supplied Redex source material. Do not invent Redex policy.";
export const VIDEO_SEGMENT_RULE = "Treat each video segment as one semantic idea and target approximately 60-120 seconds per segment unless source density requires shorter clips.";

const PROMPTS: Record<PromptKey, PromptDefinition> = {
  source_analysis: {
    id: { key: "source_analysis", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nAnalyze the supplied Redex source binder as evidence. Identify topic, authority, section count, placeholder status, and missing-source risks.`,
    user: "Analyze this source binder and return AnalyzeSourceOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  outline_generation: {
    id: { key: "outline_generation", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nCreate a source-grounded CourseOutlineDraft. Unsupported lessons must be flagged in missing_source_notes instead of fabricated.`,
    user: "Generate a CourseOutlineDraft.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  "lesson_generation.text": {
    id: { key: "lesson_generation.text", version: "v1.1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nGenerate source-grounded text lessons with reading_blocks and body_markdown fallback. Use prose, callout, policy_quote, inline_check, collapsible, config_block, and image blocks only where useful. Keep prose near an 8th-grade reading level. Collapsible blocks must be reference-only and must not hide required steps or assessed content. Config blocks are plain copyable code with no syntax-highlighting requirement. Include image blocks only for source-backed image metadata; pending image blocks are placeholders for later ingest and must include alt text, caption, and text equivalent. Every load-bearing claim must cite source sections with [source: <section_id>] or be flagged for review.`,
    user: "Generate lessons and return GenerateLessonsOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  "lesson_generation.quiz": {
    id: { key: "lesson_generation.quiz", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nGenerate source-grounded quiz lesson drafts.`,
    user: "Generate lessons and return GenerateLessonsOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  "lesson_generation.checklist": {
    id: { key: "lesson_generation.checklist", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nGenerate source-grounded checklist lesson drafts.`,
    user: "Generate lessons and return GenerateLessonsOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  "lesson_generation.acknowledgment": {
    id: { key: "lesson_generation.acknowledgment", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nGenerate source-grounded acknowledgment lesson drafts.`,
    user: "Generate lessons and return GenerateLessonsOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  "lesson_generation.scenario": {
    id: { key: "lesson_generation.scenario", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nGenerate source-grounded scenario lesson drafts.`,
    user: "Generate lessons and return GenerateLessonsOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  "lesson_generation.video": {
    id: { key: "lesson_generation.video", version: "v1.1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\n${VIDEO_SEGMENT_RULE}\n\nGenerate source-grounded VideoLessonContent with chapters, transcript_segments, checkpoints, and source citations. transcript_segments must include start_seconds, end_seconds, text_markdown, and derived_from_section_ids. checkpoints should align to segment boundaries and include required/must_answer_correctly only when warranted. Include media/download/provenance fields when known; otherwise omit them.`,
    user: "Generate lessons and return GenerateLessonsOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  "lesson_generation.video_script": {
    id: { key: "lesson_generation.video_script", version: "v1.1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\n${VIDEO_SEGMENT_RULE}\n\nGenerate source-grounded VideoLessonContent with chapters, transcript_segments, checkpoints, and source citations. transcript_segments must include start_seconds, end_seconds, text_markdown, and derived_from_section_ids. checkpoints should align to segment boundaries and include required/must_answer_correctly only when warranted. Include media/download/provenance fields when known; otherwise omit them.`,
    user: "Generate lessons and return GenerateLessonsOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  "lesson_generation.coach": {
    id: { key: "lesson_generation.coach", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nGenerate source-grounded coach lesson drafts.`,
    user: "Generate lessons and return GenerateLessonsOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  "lesson_generation.assignment": {
    id: { key: "lesson_generation.assignment", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nGenerate source-grounded assignment lesson drafts.`,
    user: "Generate lessons and return GenerateLessonsOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  "lesson_generation.reflection_prompt": {
    id: { key: "lesson_generation.reflection_prompt", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nGenerate source-grounded reflection prompt lesson drafts.`,
    user: "Generate lessons and return GenerateLessonsOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  "lesson_generation.hotspot_diagram": {
    id: { key: "lesson_generation.hotspot_diagram", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nGenerate source-grounded hotspot diagram lesson drafts.`,
    user: "Generate lessons and return GenerateLessonsOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  "lesson_generation.drag_to_order": {
    id: { key: "lesson_generation.drag_to_order", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nGenerate source-grounded OrderingLessonContent with ordered steps[]. Each step must be atomic and source-supported. If order is ambiguous or incomplete, flag it instead of inventing steps.`,
    user: "Generate lessons and return GenerateLessonsOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  assessment_generation: {
    id: { key: "assessment_generation", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nGenerate source-grounded assessment questions with plausible distractors and remediation guidance.`,
    user: "Generate assessments and return GenerateAssessmentOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  self_critique: {
    id: { key: "self_critique", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nCritique generated Foundry content for unsupported claims, weak questions, missing citations, confusing language, and publish blockers.`,
    user: "Critique generated artifacts and return CritiqueModuleOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nPrompt ids:\n{{promptIds}}\n\nCourse outline:\n{{courseOutline}}\n\nGenerated assessments:\n{{generatedAssessments}}\n\nInput JSON:\n{{input}}",
  },
  regenerate_with_fixes: {
    id: { key: "regenerate_with_fixes", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nRegenerate only the selected fixes and preserve unchanged source-grounded content.`,
    user: "Regenerate with selected fixes and return GenerateLessonsOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  regenerate_section: {
    id: { key: "regenerate_section", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nRegenerate only lessons bound to the target source section. Do not alter unrelated lessons.`,
    user: "Regenerate the target source section and return RegenerateSectionOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  },
  entailment_check: {
    id: { key: "entailment_check", version: "v1" },
    system: `${REDEX_POLICY_GUARDRAIL}\n\n${JSON_OUTPUT_RULE}\n\nThe author has stated the following learning outcomes. Every generated lesson and assessment must directly serve these outcomes. Each outcome should be measurable in the assessment.\n\nYou are a strict grounding judge. Decide whether the source section ENTAILS the generated claim. Use only the section text. Return entailed=false when the claim adds policy, timing, people, obligations, exceptions, or certainty not present in the source. Provide one concise sentence of reasoning.`,
    user: "Does the source section below ENTAIL the claim? Return EntailmentCheckOutput.\n\nLearning outcomes:\n{{learning_outcomes}}\n\nInput JSON:\n{{input}}",
  }
};

export const COURSE_FOUNDRY_SERVER_PROMPT_REGISTRY: Readonly<Record<PromptKey, PromptDefinition>> = PROMPTS;

const LessonTypeSchema = z.enum([
  "text",
  "checklist",
  "acknowledgment",
  "quiz",
  "scenario",
  "video",
  "coach",
  "assignment",
  "reflection_prompt",
  "hotspot_diagram",
  "drag_to_order",
]);
const CriticalitySchema = z.enum(["required", "recommended", "optional", "bonus"]);
const LessonGenerationStatusSchema = z.enum([
  "draft",
  "needs_review",
  "unsupported_claim",
  "missing_source",
  "ready_for_approval",
]);
const LessonReviewStatusSchema = z.enum(["pending", "approved", "needs_regeneration"]);
const LessonConfidenceLevelSchema = z.enum(["high", "medium", "low", "unsupported"]);
const CritiqueSeveritySchema = z.enum(["low", "medium", "high"]);
const CritiqueIssueCategorySchema = z.enum([
  "unsupported_claim",
  "weak_question",
  "missing_source_reference",
  "confusing_language",
  "overly_corporate_wording",
  "missing_critical_info",
  "needs_admin_approval",
]);

type AnalyzeSourceOutput = {
  topic: string;
  authority: "authoritative" | "supporting" | "context";
  sections_detected: number;
  has_placeholders: boolean;
  missing_required_topics: string[];
};

const SourceAuthoritySchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return "context";
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "authoritative" || normalized === "supporting" || normalized === "context") {
    return normalized;
  }

  return "context";
}, z.enum(["authoritative", "supporting", "context"]));

export const AnalyzeSourceOutputSchema = z.object({
  topic: z.string().catch("Untitled source"),
  authority: SourceAuthoritySchema,
  sections_detected: z.coerce.number().int().nonnegative().catch(0),
  has_placeholders: z.boolean().catch(false),
  missing_required_topics: z.array(z.string()).catch([]),
}) as z.ZodType<AnalyzeSourceOutput>;

const CourseOutlineLessonSchema = z.object({
  title: z.string(),
  lesson_type: LessonTypeSchema,
  estimated_minutes: z.number().int().nonnegative(),
});
const CourseOutlineModuleSchema = z.object({
  title: z.string(),
  lessons: z.array(CourseOutlineLessonSchema),
});
export const GenerateOutlineOutputSchema = z.object({
  course_title: z.string(),
  description: z.string(),
  learning_objectives: z.array(z.string()),
  modules: z.array(CourseOutlineModuleSchema),
  missing_source_notes: z.array(z.string()).optional(),
});

const nonEmptyTrimmedString = z.string().trim().min(1);
const OrderingStepSchema = z.object({
  id: nonEmptyTrimmedString,
  label: nonEmptyTrimmedString,
  detail_markdown: z.string().optional(),
  source_section_id: z.string().optional(),
});
const OrderingStepsSchema = z.array(OrderingStepSchema).min(2).superRefine((steps, context) => {
  const seenStepIds = new Set<string>();

  steps.forEach((step, index) => {
    if (seenStepIds.has(step.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ordering step ids must be unique.",
        path: [index, "id"],
      });
      return;
    }

    seenStepIds.add(step.id);
  });
});

const QuizQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correct_index: z.number().int().nonnegative().optional(),
});
const ReadingBlockBaseShape = {
  id: nonEmptyTrimmedString,
  source_section_ids: z.array(nonEmptyTrimmedString).optional(),
};
const ReadingProseBlockSchema = z.object({
  ...ReadingBlockBaseShape,
  kind: z.literal("prose"),
  heading: z.string().optional(),
  anchor_id: z.string().optional(),
  markdown: nonEmptyTrimmedString,
});
const ReadingCalloutBlockSchema = z.object({
  ...ReadingBlockBaseShape,
  kind: z.literal("callout"),
  tone: z.enum(["key_takeaway", "note"]),
  title: z.string().optional(),
  markdown: nonEmptyTrimmedString,
});
const ReadingPolicyQuoteBlockSchema = z.object({
  ...ReadingBlockBaseShape,
  kind: z.literal("policy_quote"),
  quote_markdown: nonEmptyTrimmedString,
  attribution: z.string().optional(),
  policy_ref: z.string().optional(),
});
const ReadingInlineCheckBlockSchema = z.object({
  ...ReadingBlockBaseShape,
  kind: z.literal("inline_check"),
  prompt: nonEmptyTrimmedString,
  options: z.array(nonEmptyTrimmedString).min(2),
  correct_option_index: z.number().int().nonnegative().optional(),
  feedback_correct_markdown: z.string().optional(),
  feedback_incorrect_markdown: z.string().optional(),
  feedback_neutral_markdown: z.string().optional(),
});
const ReadingCollapsibleBlockSchema = z.object({
  ...ReadingBlockBaseShape,
  kind: z.literal("collapsible"),
  intent: z.literal("reference"),
  title: nonEmptyTrimmedString,
  markdown: nonEmptyTrimmedString,
  default_open: z.boolean().optional(),
});
const ReadingConfigBlockSchema = z.object({
  ...ReadingBlockBaseShape,
  kind: z.literal("config_block"),
  title: z.string().optional(),
  description_markdown: z.string().optional(),
  code: nonEmptyTrimmedString,
  copy_label: z.string().optional(),
});
const ReadingImageBlockSchema = z.object({
  ...ReadingBlockBaseShape,
  kind: z.literal("image"),
  image_ref: z.object({
    source_image_id: z.string().optional(),
    storage_url: z.string().optional(),
    alt_text: nonEmptyTrimmedString,
    caption: nonEmptyTrimmedString,
    status: z.enum(["pending_ingest", "ready", "failed"]).optional(),
  }),
  text_equivalent_markdown: nonEmptyTrimmedString,
});
const ReadingLessonBlockSchema = z.discriminatedUnion("kind", [
  ReadingProseBlockSchema,
  ReadingCalloutBlockSchema,
  ReadingPolicyQuoteBlockSchema,
  ReadingInlineCheckBlockSchema,
  ReadingCollapsibleBlockSchema,
  ReadingConfigBlockSchema,
  ReadingImageBlockSchema,
]);
const ReadingBlocksSchema = z.array(ReadingLessonBlockSchema).min(1).superRefine((blocks, context) => {
  const seenBlockIds = new Set<string>();

  blocks.forEach((block, index) => {
    if (seenBlockIds.has(block.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reading block ids must be unique.",
        path: [index, "id"],
      });
      return;
    }

    seenBlockIds.add(block.id);

    if (block.kind === "inline_check" && block.correct_option_index !== undefined && block.correct_option_index >= block.options.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "inline_check correct_option_index must reference an option.",
        path: [index, "correct_option_index"],
      });
    }
  });
});
const VideoDownloadSchema = z.object({
  url: z.string(),
  label: z.string().optional(),
  mime_type: z.string().optional(),
  size_bytes: z.number().int().nonnegative().optional(),
  expires_at: z.string().optional(),
});
const VideoProvenanceSchema = z.object({
  generated_from: z.enum(["foundry", "manual_upload", "external_url"]).optional(),
  source_file_ids: z.array(z.string()).optional(),
  source_section_ids: z.array(z.string()).optional(),
  media_asset_id: z.string().optional(),
  provider_asset_id: z.string().optional(),
  approved_by: z.string().optional(),
  generated_at: z.string().optional(),
  notes_markdown: z.string().optional(),
});
const VideoChapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  start_seconds: z.number().nonnegative(),
  end_seconds: z.number().nonnegative().optional(),
  source_section_ids: z.array(z.string()).optional(),
});
const VideoTranscriptSegmentSchema = z.object({
  id: z.string(),
  start_seconds: z.number().nonnegative(),
  end_seconds: z.number().nonnegative(),
  text_markdown: z.string(),
  derived_from_section_ids: z.array(z.string()),
});
const VideoCheckpointSchema = z.object({
  id: z.string(),
  at_seconds: z.number().nonnegative(),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correct_index: z.number().int().nonnegative().optional(),
  feedback_correct_markdown: z.string().optional(),
  feedback_incorrect_markdown: z.string().optional(),
  source_section_ids: z.array(z.string()).optional(),
  segment_start_seconds: z.number().nonnegative().optional(),
  required: z.boolean().optional(),
  must_answer_correctly: z.boolean().optional(),
});
const GeneratedLessonContentSchema = z.object({
  lesson_index: z.number().int().nonnegative(),
  module_index: z.number().int().nonnegative(),
  title: z.string(),
  lesson_type: LessonTypeSchema,
  body_markdown: z.string().optional(),
  reading_blocks: ReadingBlocksSchema.optional(),
  quiz_questions: z.array(QuizQuestionSchema).optional(),
  acknowledgment_text: z.string().optional(),
  ordering_steps: OrderingStepsSchema.optional(),
  video_script_markdown: z.string().optional(),
  video_url: z.string().optional(),
  duration_seconds: z.number().optional(),
  transcript_markdown: z.string().optional(),
  poster_url: z.string().optional(),
  media_asset_id: z.string().optional(),
  media_provider: z.enum(["heygen", "manual", "external"]).optional(),
  media_status: z.enum(["pending", "processing", "ready", "failed", "stale"]).optional(),
  download_url: z.string().optional(),
  downloads: z.array(VideoDownloadSchema).optional(),
  provenance: VideoProvenanceSchema.optional(),
  chapters: z.array(VideoChapterSchema).optional(),
  transcript_segments: z.array(VideoTranscriptSegmentSchema).optional(),
  checkpoints: z.array(VideoCheckpointSchema).optional(),
  video_chapters: z.array(VideoChapterSchema).optional(),
  video_transcript_segments: z.array(VideoTranscriptSegmentSchema).optional(),
  video_checkpoints: z.array(VideoCheckpointSchema).optional(),
  derived_from_section_ids: z.array(z.string()).optional(),
  status: LessonGenerationStatusSchema,
  status_note: z.string().optional(),
  source_refs: z.array(z.object({
    drive_file_id: z.string(),
    section_count: z.number().int().nonnegative(),
  })).optional(),
}).superRefine((lesson, context) => {
  if (lesson.lesson_type === "drag_to_order" && lesson.ordering_steps === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "drag_to_order generated lessons require valid ordering_steps.",
      path: ["ordering_steps"],
    });
  }

  const hasTextBody = typeof lesson.body_markdown === "string" && lesson.body_markdown.trim().length > 0;

  if (lesson.lesson_type === "text" && lesson.status !== "missing_source" && !hasTextBody) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "text generated lessons require non-empty body_markdown fallback.",
      path: ["body_markdown"],
    });
  }
});
export const GenerateLessonsOutputSchema = z.object({
  module_title: z.string(),
  lessons: z.array(GeneratedLessonContentSchema),
  generated_at: z.string(),
  is_complete: z.boolean(),
});
export const GenerateAssessmentOutputSchema = z.object({
  assessment_lesson_id: z.string(),
  questions: z.array(QuizQuestionSchema),
});

const CritiqueIssueSchema = z.object({
  id: z.string(),
  category: CritiqueIssueCategorySchema,
  severity: CritiqueSeveritySchema,
  lesson_title: z.string().optional(),
  module_index: z.number().int().nonnegative().optional(),
  summary: z.string(),
  detail: z.string(),
  suggested_fix: z.string().optional(),
  ignored: z.boolean(),
  ignored_note: z.string().optional(),
});
export const CritiqueModuleOutputSchema = z.object({
  module_title: z.string(),
  generated_at: z.string(),
  issues: z.array(CritiqueIssueSchema),
  blocks_publish: z.boolean(),
});
export const RegenerateWithFixesOutputSchema = GenerateLessonsOutputSchema;

const TextLessonContentSchema = z.object({
  type: z.literal("text"),
  body_markdown: z.string().optional(),
  estimated_read_minutes: z.number().optional(),
  blocks: ReadingBlocksSchema.optional(),
}).superRefine((content, context) => {
  const hasBody = typeof content.body_markdown === "string" && content.body_markdown.trim().length > 0;
  const hasBlocks = content.blocks !== undefined && content.blocks.length > 0;

  if (!hasBody && !hasBlocks) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "TextLessonContent requires body_markdown fallback or structured blocks.",
      path: ["body_markdown"],
    });
  }
});
const ChecklistLessonContentSchema = z.object({ type: z.literal("checklist"), intro_markdown: z.string().optional(), items: z.array(z.object({ id: z.string(), label: z.string(), details_markdown: z.string().optional() })), require_all: z.boolean().optional() });
const AcknowledgmentLessonContentSchema = z.object({ type: z.literal("acknowledgment"), statement_markdown: z.string(), required_signature: z.enum(["click", "name"]).optional(), policy_ref: z.string().optional() });
const QuizLessonContentSchema = z.object({ type: z.literal("quiz"), questions: z.array(QuizQuestionSchema), passing_threshold: z.number().optional(), allow_retakes: z.boolean().optional() });
const ScenarioLessonContentSchema = z.object({ type: z.literal("scenario"), intro_markdown: z.string(), steps: z.array(z.object({ id: z.string(), prompt_markdown: z.string(), choices: z.array(z.object({ id: z.string(), label: z.string(), is_correct: z.boolean().optional(), feedback_markdown: z.string().optional() })) })), outcome_summary_markdown: z.string().optional() });
const VideoLessonContentSchema = z.object({
  type: z.literal("video"),
  video_url: z.string(),
  duration_seconds: z.number().optional(),
  transcript_markdown: z.string().optional(),
  poster_url: z.string().optional(),
  media_asset_id: z.string().optional(),
  media_provider: z.enum(["heygen", "manual", "external"]).optional(),
  media_status: z.enum(["pending", "processing", "ready", "failed", "stale"]).optional(),
  download_url: z.string().optional(),
  downloads: z.array(VideoDownloadSchema).optional(),
  provenance: VideoProvenanceSchema.optional(),
  chapters: z.array(VideoChapterSchema).optional(),
  transcript_segments: z.array(VideoTranscriptSegmentSchema).optional(),
  checkpoints: z.array(VideoCheckpointSchema).optional(),
});
const CoachLessonContentSchema = z.object({ type: z.literal("coach"), intro_markdown: z.string(), prompts: z.array(z.string()).optional(), coach_id: z.string().optional() });
const AssignmentLessonContentSchema = z.object({ type: z.literal("assignment"), instructions: z.string(), rubric: z.object({ criteria: z.array(z.object({ label: z.string(), description: z.string().optional(), weight: z.number().optional() })) }).optional() });
const ReflectionPromptLessonContentSchema = z.object({ type: z.literal("reflection_prompt"), prompt: z.string() });
const HotspotLessonContentSchema = z.object({
  type: z.literal("hotspot_diagram"),
  intro_markdown: z.string().optional(),
  image_ref: z.object({
    url: z.string(),
    alt_text: z.string(),
    caption: z.string().optional(),
    source_image_id: z.string().optional(),
  }),
  hotspots: z.array(z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    title: z.string(),
    details_markdown: z.string(),
    source_section_id: z.string().optional(),
  })),
});
const OrderingLessonContentSchema = z.object({
  type: z.literal("drag_to_order"),
  intro_markdown: z.string().optional(),
  steps: OrderingStepsSchema,
});
const LessonContentSchema = z.union([
  TextLessonContentSchema,
  ChecklistLessonContentSchema,
  AcknowledgmentLessonContentSchema,
  QuizLessonContentSchema,
  ScenarioLessonContentSchema,
  VideoLessonContentSchema,
  CoachLessonContentSchema,
  AssignmentLessonContentSchema,
  ReflectionPromptLessonContentSchema,
  HotspotLessonContentSchema,
  OrderingLessonContentSchema,
]);
const LessonSchema = z.object({
  id: z.string(),
  module_id: z.string(),
  title: z.string(),
  lesson_type: LessonTypeSchema,
  criticality: CriticalitySchema,
  order_index: z.number().int().nonnegative(),
  estimated_minutes: z.number().int().nonnegative(),
  content: LessonContentSchema,
  resources: z.array(z.object({ label: z.string(), url: z.string(), type: z.enum(["pdf", "link", "video", "notion"]) })).optional(),
});
const SourceExcerptSchema = z.object({
  drive_file_id: z.string(),
  source_title: z.string(),
  section_heading: z.string(),
  section_body: z.string(),
  highlighted_span: z.object({ start: z.number().int().nonnegative(), end: z.number().int().nonnegative() }).optional(),
});
const LessonReviewItemSchema = z.object({
  lesson_index: z.number().int().nonnegative(),
  module_index: z.number().int().nonnegative(),
  lesson_title: z.string(),
  confidence: LessonConfidenceLevelSchema,
  has_unsupported_claim: z.boolean(),
  unsupported_note: z.string().optional(),
  status: LessonReviewStatusSchema,
  source_excerpts: z.array(SourceExcerptSchema),
});
export const RegenerateSectionOutputSchema = z.object({
  regeneratedLessons: z.array(LessonSchema),
  newReviewItems: z.array(LessonReviewItemSchema),
});

export const EntailmentCheckOutputSchema = z.object({
  entailed: z.boolean(),
  confidence: z.enum(["high", "low"]),
  reasoning: z.string(),
});

type AnthropicResponse = {
  content?: Array<{ type?: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
};

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  usage?: { input_tokens?: number; output_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
};

function providerFromEnv(): AiProvider {
  const provider = (Deno.env.get("AI_PROVIDER") ?? "anthropic").toLowerCase();

  if (provider === "openai") {
    return "openai";
  }

  return "anthropic";
}

function modelFor(provider: AiProvider): string {
  return Deno.env.get("AI_MODEL") ?? (provider === "openai" ? "gpt-5" : "claude-sonnet-4-5");
}

function apiKeyFor(provider: AiProvider): string {
  const key = Deno.env.get("AI_PROVIDER_API_KEY");

  if (!key) {
    throw new ProviderNotConfiguredError(provider);
  }

  return key;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildUserPrompt(prompt: PromptDefinition, input: unknown): string {
  const payload: Record<string, unknown> = isRecord(input) ? input : {};

  return prompt.user
    .replace("{{learning_outcomes}}", JSON.stringify(payload.learning_outcomes ?? [], null, 2))
    .replace("{{promptIds}}", JSON.stringify(payload.promptIds ?? [], null, 2))
    .replace("{{courseOutline}}", JSON.stringify(payload.courseOutline ?? null, null, 2))
    .replace("{{generatedAssessments}}", JSON.stringify(payload.generatedAssessments ?? payload.assessments ?? null, null, 2))
    .replace("{{input}}", JSON.stringify(input, null, 2));
}

function parseProviderJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (_error) {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/u);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as unknown;
    }

    throw new AiProviderError("AI provider returned non-JSON output.");
  }
}

function tokenEstimate(value: string): number {
  return Math.max(1, Math.ceil(value.length / 4));
}

function costFromUsage(provider: AiProvider, inputTokens: number, outputTokens: number): number {
  const defaultInputCentsPerMillion = provider === "openai" ? 125 : 300;
  const defaultOutputCentsPerMillion = provider === "openai" ? 1000 : 1500;
  const inputRate = Number(Deno.env.get("AI_INPUT_COST_CENTS_PER_MILLION_TOKENS") ?? defaultInputCentsPerMillion);
  const outputRate = Number(Deno.env.get("AI_OUTPUT_COST_CENTS_PER_MILLION_TOKENS") ?? defaultOutputCentsPerMillion);
  const cost = (inputTokens / 1_000_000) * inputRate + (outputTokens / 1_000_000) * outputRate;

  return Math.max(0, Math.round(cost));
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!response.ok) {
    throw new AiProviderError(`AI provider request failed (${response.status}) ${text}`, 502);
  }

  return JSON.parse(text) as T;
}

async function callAnthropic(prompt: PromptDefinition, input: unknown): Promise<{ text: string; inputTokens: number; outputTokens: number; model: string }> {
  const provider: AiProvider = "anthropic";
  const model = modelFor(provider);
  const userPrompt = buildUserPrompt(prompt, input);
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKeyFor(provider),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: prompt.id.key === "entailment_check" ? 256 : Number(Deno.env.get("AI_MAX_TOKENS") ?? 4096),
      temperature: prompt.id.key === "entailment_check" ? 0 : undefined,
      system: prompt.system,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const payload = await readJsonResponse<AnthropicResponse>(response);
  const text = payload.content?.find((item) => item.type === "text" && item.text)?.text;

  if (!text) {
    throw new AiProviderError("Anthropic response did not include text content.");
  }

  return {
    text,
    inputTokens: payload.usage?.input_tokens ?? tokenEstimate(`${prompt.system}\n${userPrompt}`),
    outputTokens: payload.usage?.output_tokens ?? tokenEstimate(text),
    model,
  };
}

function openAiText(payload: OpenAiResponse): string | null {
  if (payload.output_text) {
    return payload.output_text;
  }

  for (const item of payload.output ?? []) {
    const text = item.content?.find((content) => content.type === "output_text" || content.type === "text")?.text;

    if (text) {
      return text;
    }
  }

  return null;
}

async function callOpenAi(prompt: PromptDefinition, input: unknown): Promise<{ text: string; inputTokens: number; outputTokens: number; model: string }> {
  const provider: AiProvider = "openai";
  const model = modelFor(provider);
  const userPrompt = buildUserPrompt(prompt, input);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKeyFor(provider)}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: prompt.system },
        { role: "user", content: userPrompt },
      ],
      text: { format: { type: "json_object" } },
      temperature: prompt.id.key === "entailment_check" ? 0 : undefined,
    }),
  });
  const payload = await readJsonResponse<OpenAiResponse>(response);
  const text = openAiText(payload);

  if (!text) {
    throw new AiProviderError("OpenAI response did not include output text.");
  }

  return {
    text,
    inputTokens: payload.usage?.input_tokens ?? payload.usage?.prompt_tokens ?? tokenEstimate(`${prompt.system}\n${userPrompt}`),
    outputTokens: payload.usage?.output_tokens ?? payload.usage?.completion_tokens ?? tokenEstimate(text),
    model,
  };
}

async function invokeProvider<T>(promptKey: PromptKey, input: unknown, schema: z.ZodType<T>): Promise<CostedAiResult<T>> {
  const provider = providerFromEnv();
  const prompt = PROMPTS[promptKey];
  const estimatedInputTokens = tokenEstimate(`${prompt.system}\n${buildUserPrompt(prompt, input)}`);
  const estimatedCost = costFromUsage(provider, estimatedInputTokens, 1200);
  const raw = provider === "openai"
    ? await callOpenAi(prompt, input)
    : await callAnthropic(prompt, input);
  const parsed = schema.safeParse(parseProviderJson(raw.text));

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
      .join("; ");
    throw new AiProviderError(`AI output validation failed: ${details}`);
  }

  return {
    output: parsed.data,
    cost_cents: costFromUsage(provider, raw.inputTokens, raw.outputTokens),
    estimated_cost_cents: estimatedCost,
    model_used: raw.model,
    prompt_version: `${prompt.id.key}@${prompt.id.version}`,
  };
}

export interface CourseFoundryAiClientServer {
  analyzeSource(input: AnalyzeSourceInput): Promise<CostedAiResult<z.infer<typeof AnalyzeSourceOutputSchema>>>;
  generateOutline(input: GenerateOutlineInput): Promise<CostedAiResult<z.infer<typeof GenerateOutlineOutputSchema>>>;
  generateLessons(input: GenerateLessonsInput): Promise<CostedAiResult<z.infer<typeof GenerateLessonsOutputSchema>>>;
  generateAssessment(input: GenerateAssessmentInput): Promise<CostedAiResult<z.infer<typeof GenerateAssessmentOutputSchema>>>;
  critiqueModule(input: CritiqueModuleInput): Promise<CostedAiResult<z.infer<typeof CritiqueModuleOutputSchema>>>;
  regenerateWithFixes(input: RegenerateWithFixesInput): Promise<CostedAiResult<z.infer<typeof RegenerateWithFixesOutputSchema>>>;
  regenerateSection(input: RegenerateSectionInput): Promise<CostedAiResult<z.infer<typeof RegenerateSectionOutputSchema>>>;
  checkEntailment(input: EntailmentCheckInput): Promise<CostedAiResult<EntailmentCheckOutput>>;
}

const PROMPT_KEY_BY_LESSON_TYPE: Record<string, PromptKey> = {
  text: "lesson_generation.text",
  quiz: "lesson_generation.quiz",
  checklist: "lesson_generation.checklist",
  acknowledgment: "lesson_generation.acknowledgment",
  scenario: "lesson_generation.scenario",
  video: "lesson_generation.video",
  coach: "lesson_generation.coach",
  assignment: "lesson_generation.assignment",
  reflection_prompt: "lesson_generation.reflection_prompt",
  hotspot_diagram: "lesson_generation.hotspot_diagram",
  drag_to_order: "lesson_generation.drag_to_order",
};

export function createCourseFoundryAiClientServer(): CourseFoundryAiClientServer {
  return {
    analyzeSource(input) {
      return invokeProvider("source_analysis", input, AnalyzeSourceOutputSchema);
    },
    generateOutline(input) {
      return invokeProvider("outline_generation", input, GenerateOutlineOutputSchema);
    },
    generateLessons(input) {
      const outlineRecord = input.outline as { modules?: Array<{ lessons?: Array<{ lesson_type?: string }> }> } | undefined;
      const lessonType = outlineRecord?.modules?.[0]?.lessons?.[0]?.lesson_type ?? "text";
      const promptKey = PROMPT_KEY_BY_LESSON_TYPE[lessonType] ?? "lesson_generation.text";
      return invokeProvider(promptKey, input, GenerateLessonsOutputSchema);
    },
    generateAssessment(input) {
      return invokeProvider("assessment_generation", input, GenerateAssessmentOutputSchema);
    },
    critiqueModule(input) {
      return invokeProvider("self_critique", input, CritiqueModuleOutputSchema);
    },
    regenerateWithFixes(input) {
      return invokeProvider("regenerate_with_fixes", input, RegenerateWithFixesOutputSchema);
    },
    regenerateSection(input) {
      return invokeProvider("regenerate_section", input, RegenerateSectionOutputSchema);
    },
    async checkEntailment(input) {
      return invokeProvider("entailment_check", input, EntailmentCheckOutputSchema);
    },
  };
}
