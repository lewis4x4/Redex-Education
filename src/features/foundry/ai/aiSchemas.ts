import { z } from 'zod';

import type {
  AnalyzeSourceOutput,
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

export const AnalyzeSourceOutputSchema = z.object({
  topic: z.string(),
  authority: z.enum(['authoritative', 'supporting', 'context']),
  sections_detected: z.number().int().nonnegative(),
  has_placeholders: z.boolean(),
  missing_required_topics: z.array(z.string()),
}) satisfies z.ZodType<AnalyzeSourceOutput>;

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

const QuizQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correct_index: z.number().int().nonnegative().optional(),
});

const GeneratedLessonContentSchema = z.object({
  lesson_index: z.number().int().nonnegative(),
  module_index: z.number().int().nonnegative(),
  title: z.string(),
  lesson_type: LessonTypeSchema,
  body_markdown: z.string().optional(),
  quiz_questions: z.array(QuizQuestionSchema).optional(),
  acknowledgment_text: z.string().optional(),
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
});

export const GenerateLessonsOutputSchema = z.object({
  module_title: z.string(),
  lessons: z.array(GeneratedLessonContentSchema),
  generated_at: z.string(),
  is_complete: z.boolean(),
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
  body_markdown: z.string(),
  estimated_read_minutes: z.number().optional(),
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

const LessonContentSchema = z.discriminatedUnion('type', [
  TextLessonContentSchema,
  ChecklistLessonContentSchema,
  AcknowledgmentLessonContentSchema,
  QuizLessonContentSchema,
  ScenarioLessonContentSchema,
  VideoLessonContentSchema,
  CoachLessonContentSchema,
  AssignmentLessonContentSchema,
  ReflectionPromptLessonContentSchema,
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
