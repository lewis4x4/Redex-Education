import { z } from 'zod';

import type {
  AnalyzeSourceOutput,
  BrainstormedPacket,
  CritiqueModuleOutput,
  GenerateAssessmentOutput,
  GenerateLessonsOutput,
  GenerateOutlineOutput,
  RegenerateSectionOutput,
  RegenerateWithFixesOutput,
} from './courseFoundryAiClient';

const LessonTypeSchema = z.enum([
  'text',
  'checklist',
  'acknowledgment',
  'quiz',
  'scenario',
  'video',
  'coach',
  'assignment',
  'reflection_prompt',
  'hotspot_diagram',
  'drag_to_order',
]);

const CriticalitySchema = z.enum(['required', 'recommended', 'optional', 'bonus']);
const LessonGenerationStatusSchema = z.enum([
  'draft',
  'needs_review',
  'unsupported_claim',
  'missing_source',
  'ready_for_approval',
]);
const LessonReviewStatusSchema = z.enum(['pending', 'approved', 'needs_regeneration']);
const LessonConfidenceLevelSchema = z.enum(['high', 'medium', 'low', 'unsupported']);
const CritiqueSeveritySchema = z.enum(['low', 'medium', 'high']);
const CritiqueIssueCategorySchema = z.enum([
  'unsupported_claim',
  'weak_question',
  'missing_source_reference',
  'confusing_language',
  'overly_corporate_wording',
  'missing_critical_info',
  'needs_admin_approval',
]);

const nonEmptyTrimmedString = z.string().trim().min(1);
const safeSlugString = z.string().trim().regex(/^[a-z0-9][a-z0-9-]*$/u, 'Use lowercase kebab-case with no path separators.');
const safeMarkdownFilename = z.string().trim().regex(/^[a-z0-9][a-z0-9_-]*\.md$/u, 'Use a safe lowercase markdown filename.');

export const AnalyzeSourceOutputSchema = z.object({
  topic: z.string(),
  authority: z.enum(['authoritative', 'supporting', 'context']),
  sections_detected: z.number().int().nonnegative(),
  has_placeholders: z.boolean(),
  missing_required_topics: z.array(z.string()),
}) satisfies z.ZodType<AnalyzeSourceOutput>;

const PacketLearningOutcomeSchema = z.object({
  id: nonEmptyTrimmedString,
  text: z.string().trim().min(8).max(180),
});

export const BrainstormedPacketSchema = z.object({
  suggested_module_slug: safeSlugString,
  suggested_module_title: nonEmptyTrimmedString,
  summary: nonEmptyTrimmedString,
  library_topic_slug: safeSlugString,
  module_folder_slug: safeSlugString,
  estimated_cost_cents: z.number().int().nonnegative(),
  documents: z.array(z.object({
    filename: safeMarkdownFilename,
    title: nonEmptyTrimmedString,
    authority: z.literal('context'),
    authority_provenance: z.literal('brainstormed'),
    status: z.literal('draft_for_review'),
    body_markdown: nonEmptyTrimmedString,
    notes_for_admin: z.string().optional(),
  })).min(3).max(6),
  manifest_markdown: nonEmptyTrimmedString,
  unresolved_questions: z.array(z.string()),
  sme_review_checklist: z.array(z.string()).min(1),
  module_basics: z.object({
    id: z.string().optional(),
    module_id: z.string().optional(),
    version_number: z.number().optional(),
    source_binder_version: z.string().optional(),
    assessment_version: z.string().optional(),
    persisted_course_id: z.string().optional(),
    persisted_module_id: z.string().optional(),
    title: nonEmptyTrimmedString,
    parent_course_id: nonEmptyTrimmedString,
    audience_archetype: z.enum([
      'new_hire',
      'all_employees',
      'field_team',
      'managers',
      'customer_support',
      'sales',
      'operations',
      'compliance_officers',
      'foundry_authors',
      'leadership',
    ]).optional(),
    audience_refinement: z.string().optional(),
    completion_required: z.enum(['required', 'recommended', 'optional']).optional(),
    training_type: z.enum([
      'hr',
      'operational',
      'safety',
      'compliance',
      'customer_specific',
      'role_specific',
      'general_informational',
    ]),
    learning_outcomes: z.array(PacketLearningOutcomeSchema).optional(),
    audience: z.string().optional(),
    criticality: z.enum(['required', 'optional']).optional(),
    estimated_minutes: z.number().int().min(5).max(300),
    updated_at: nonEmptyTrimmedString,
  }),
  setup_answers: z.object({
    criticality: z.enum(['informational', 'basic_knowledge', 'operational', 'compliance_high_risk']),
    assessment_style: z.enum(['no_assessment', 'light_quiz', 'standard_quiz', 'strict_quiz', 'scenario_based', 'acknowledgment_only']),
    audience_notes: nonEmptyTrimmedString,
    experience_notes: z.string(),
    estimated_minutes: z.number().int().min(5).max(300),
    source_control: z.enum(['strict', 'flexible']),
    requires_admin_approval: z.boolean(),
    requires_safety_review: z.boolean(),
  }),
}) satisfies z.ZodType<BrainstormedPacket>;

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
}) satisfies z.ZodType<GenerateOutlineOutput>;

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
        message: 'Ordering step ids must be unique.',
        path: [index, 'id'],
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
  kind: z.literal('prose'),
  heading: z.string().optional(),
  anchor_id: z.string().optional(),
  markdown: nonEmptyTrimmedString,
});

const ReadingCalloutBlockSchema = z.object({
  ...ReadingBlockBaseShape,
  kind: z.literal('callout'),
  tone: z.enum(['key_takeaway', 'note']),
  title: z.string().optional(),
  markdown: nonEmptyTrimmedString,
});

const ReadingPolicyQuoteBlockSchema = z.object({
  ...ReadingBlockBaseShape,
  kind: z.literal('policy_quote'),
  quote_markdown: nonEmptyTrimmedString,
  attribution: z.string().optional(),
  policy_ref: z.string().optional(),
});

const ReadingInlineCheckBlockSchema = z.object({
  ...ReadingBlockBaseShape,
  kind: z.literal('inline_check'),
  prompt: nonEmptyTrimmedString,
  options: z.array(nonEmptyTrimmedString).min(2),
  correct_option_index: z.number().int().nonnegative().optional(),
  feedback_correct_markdown: z.string().optional(),
  feedback_incorrect_markdown: z.string().optional(),
  feedback_neutral_markdown: z.string().optional(),
});

const ReadingCollapsibleBlockSchema = z.object({
  ...ReadingBlockBaseShape,
  kind: z.literal('collapsible'),
  intent: z.literal('reference'),
  title: nonEmptyTrimmedString,
  markdown: nonEmptyTrimmedString,
  default_open: z.boolean().optional(),
});

const ReadingConfigBlockSchema = z.object({
  ...ReadingBlockBaseShape,
  kind: z.literal('config_block'),
  title: z.string().optional(),
  description_markdown: z.string().optional(),
  code: nonEmptyTrimmedString,
  copy_label: z.string().optional(),
});

const ReadingImageBlockSchema = z.object({
  ...ReadingBlockBaseShape,
  kind: z.literal('image'),
  image_ref: z.object({
    source_image_id: z.string().optional(),
    storage_url: z.string().optional(),
    alt_text: nonEmptyTrimmedString,
    caption: nonEmptyTrimmedString,
    status: z.enum(['pending_ingest', 'ready', 'failed']).optional(),
  }),
  text_equivalent_markdown: nonEmptyTrimmedString,
});

const ReadingLessonBlockSchema = z.discriminatedUnion('kind', [
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
        message: 'Reading block ids must be unique.',
        path: [index, 'id'],
      });
      return;
    }

    seenBlockIds.add(block.id);

    if (block.kind === 'inline_check' && block.correct_option_index !== undefined && block.correct_option_index >= block.options.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'inline_check correct_option_index must reference an option.',
        path: [index, 'correct_option_index'],
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
  generated_from: z.enum(['foundry', 'manual_upload', 'external_url']).optional(),
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
  media_provider: z.enum(['heygen', 'manual', 'external']).optional(),
  media_status: z
    .enum(['pending', 'processing', 'ready', 'failed', 'stale'])
    .optional(),
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
  source_refs: z
    .array(
      z.object({
        drive_file_id: z.string(),
        section_count: z.number().int().nonnegative(),
      }),
    )
    .optional(),
}).superRefine((lesson, context) => {
  if (lesson.lesson_type === 'drag_to_order' && lesson.ordering_steps === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'drag_to_order generated lessons require valid ordering_steps.',
      path: ['ordering_steps'],
    });
  }

  const hasTextBody = typeof lesson.body_markdown === 'string' && lesson.body_markdown.trim().length > 0;

  if (lesson.lesson_type === 'text' && lesson.status !== 'missing_source' && !hasTextBody) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'text generated lessons require non-empty body_markdown fallback.',
      path: ['body_markdown'],
    });
  }
});

export const GenerateLessonsOutputSchema = z.object({
  module_title: z.string(),
  lessons: z.array(GeneratedLessonContentSchema),
  generated_at: z.string(),
  is_complete: z.boolean(),
  lesson_reviews: z
    .array(
      z.object({
        lesson_index: z.number().int().nonnegative(),
        module_index: z.number().int().nonnegative(),
        lesson_title: z.string(),
        confidence: LessonConfidenceLevelSchema,
        has_unsupported_claim: z.boolean(),
        unsupported_note: z.string().optional(),
        status: LessonReviewStatusSchema,
        source_excerpts: z.array(
          z.object({
            drive_file_id: z.string(),
            source_title: z.string(),
            section_heading: z.string(),
            section_body: z.string(),
            highlighted_span: z
              .object({
                start: z.number().int().nonnegative(),
                end: z.number().int().nonnegative(),
              })
              .optional(),
          }),
        ),
      }),
    )
    .optional(),
}) satisfies z.ZodType<GenerateLessonsOutput>;

export const GenerateAssessmentOutputSchema = z.object({
  assessment_lesson_id: z.string(),
  questions: z.array(QuizQuestionSchema),
}) satisfies z.ZodType<GenerateAssessmentOutput>;

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
}) satisfies z.ZodType<CritiqueModuleOutput>;

export const RegenerateWithFixesOutputSchema = GenerateLessonsOutputSchema satisfies z.ZodType<RegenerateWithFixesOutput>;

const TextLessonContentSchema = z.object({
  type: z.literal('text'),
  body_markdown: z.string().optional(),
  estimated_read_minutes: z.number().optional(),
  blocks: ReadingBlocksSchema.optional(),
}).superRefine((content, context) => {
  const hasBody = typeof content.body_markdown === 'string' && content.body_markdown.trim().length > 0;
  const hasBlocks = content.blocks !== undefined && content.blocks.length > 0;

  if (!hasBody && !hasBlocks) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'TextLessonContent requires body_markdown fallback or structured blocks.',
      path: ['body_markdown'],
    });
  }
});
const ChecklistLessonContentSchema = z.object({
  type: z.literal('checklist'),
  intro_markdown: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      details_markdown: z.string().optional(),
    }),
  ),
  require_all: z.boolean().optional(),
});
const AcknowledgmentLessonContentSchema = z.object({
  type: z.literal('acknowledgment'),
  statement_markdown: z.string(),
  required_signature: z.enum(['click', 'name']).optional(),
  policy_ref: z.string().optional(),
});
const QuizLessonContentSchema = z.object({
  type: z.literal('quiz'),
  questions: z.array(QuizQuestionSchema),
  passing_threshold: z.number().optional(),
  allow_retakes: z.boolean().optional(),
});
const ScenarioLessonContentSchema = z.object({
  type: z.literal('scenario'),
  intro_markdown: z.string(),
  steps: z.array(
    z.object({
      id: z.string(),
      prompt_markdown: z.string(),
      choices: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          is_correct: z.boolean().optional(),
          feedback_markdown: z.string().optional(),
        }),
      ),
    }),
  ),
  outcome_summary_markdown: z.string().optional(),
});
const VideoLessonContentSchema = z.object({
  type: z.literal('video'),
  video_url: z.string(),
  duration_seconds: z.number().optional(),
  transcript_markdown: z.string().optional(),
  poster_url: z.string().optional(),
  media_asset_id: z.string().optional(),
  media_provider: z.enum(['heygen', 'manual', 'external']).optional(),
  media_status: z.enum(['pending', 'processing', 'ready', 'failed', 'stale']).optional(),
  download_url: z.string().optional(),
  downloads: z.array(VideoDownloadSchema).optional(),
  provenance: VideoProvenanceSchema.optional(),
  chapters: z.array(VideoChapterSchema).optional(),
  transcript_segments: z.array(VideoTranscriptSegmentSchema).optional(),
  checkpoints: z.array(VideoCheckpointSchema).optional(),
});
const CoachLessonContentSchema = z.object({
  type: z.literal('coach'),
  intro_markdown: z.string(),
  prompts: z.array(z.string()).optional(),
  coach_id: z.string().optional(),
});
const AssignmentLessonContentSchema = z.object({
  type: z.literal('assignment'),
  instructions: z.string(),
  rubric: z
    .object({
      criteria: z.array(
        z.object({
          label: z.string(),
          description: z.string().optional(),
          weight: z.number().optional(),
        }),
      ),
    })
    .optional(),
});
const ReflectionPromptLessonContentSchema = z.object({
  type: z.literal('reflection_prompt'),
  prompt: z.string(),
});
const HotspotLessonContentSchema = z.object({
  type: z.literal('hotspot_diagram'),
  intro_markdown: z.string().optional(),
  image_ref: z.object({
    url: z.string(),
    alt_text: z.string(),
    caption: z.string().optional(),
    source_image_id: z.string().optional(),
  }),
  hotspots: z.array(
    z.object({
      id: z.string(),
      x: z.number(),
      y: z.number(),
      title: z.string(),
      details_markdown: z.string(),
      source_section_id: z.string().optional(),
    }),
  ),
});
const OrderingLessonContentSchema = z.object({
  type: z.literal('drag_to_order'),
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
  resources: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
        type: z.enum(['pdf', 'link', 'video', 'notion']),
      }),
    )
    .optional(),
});

const SourceExcerptSchema = z.object({
  drive_file_id: z.string(),
  source_title: z.string(),
  section_heading: z.string(),
  section_body: z.string(),
  highlighted_span: z
    .object({
      start: z.number().int().nonnegative(),
      end: z.number().int().nonnegative(),
    })
    .optional(),
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
}) satisfies z.ZodType<RegenerateSectionOutput>;

export function validateAiOutput<T>(schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ');

    throw new Error(`AI output validation failed: ${details}`);
  }

  return result.data;
}
