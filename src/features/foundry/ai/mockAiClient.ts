import { MOCK_GENERATED_MODULE } from '@/features/foundry/data/mockGeneratedModule';
import { MOCK_GENERATED_OUTLINE, MOCK_LESSON_SOURCE_BINDINGS } from '@/features/foundry/data/mockGeneratedOutline';
import { MOCK_LESSON_REVIEWS } from '@/features/foundry/data/mockLessonReviews';
import { MOCK_SELF_CRITIQUE } from '@/features/foundry/data/mockSelfCritique';
import type {
  GeneratedLessonContent,
  Lesson,
  LessonContent,
  LessonReviewItem,
  OrderingStep,
  SourceFile,
} from '@/types/training';

import {
  AnalyzeSourceOutputSchema,
  BrainstormedPacketSchema,
  CritiqueModuleOutputSchema,
  GenerateAssessmentOutputSchema,
  GenerateLessonsOutputSchema,
  GenerateOutlineOutputSchema,
  RegenerateSectionOutputSchema,
  RegenerateWithFixesOutputSchema,
  validateAiOutput,
} from './aiSchemas';
import type { AnalyzeSourceInput, BrainstormSourcePacketInput, CourseFoundryAiClient } from './courseFoundryAiClient';

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isSourceFileList(sources: AnalyzeSourceInput['sources']): sources is SourceFile[] {
  return Array.isArray(sources);
}

function slugifyPacketValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled-module';
}

function titleCasePacketValue(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Untitled Module';
}

function mockBrainstormedPacket(input: BrainstormSourcePacketInput) {
  const topicTitle = titleCasePacketValue(input.topic);
  const topicSlug = slugifyPacketValue(input.topic);
  const now = new Date().toISOString();
  const filenamePrefix = `redexacademy_${topicSlug.replace(/-/g, '_')}`;

  return {
    suggested_module_slug: topicSlug,
    suggested_module_title: topicTitle,
    summary: `${topicTitle} is a brainstormed starter packet. Treat it as context until an SME reviews the technical claims.`,
    library_topic_slug: topicSlug,
    module_folder_slug: `operations-${topicSlug}`,
    estimated_cost_cents: 18,
    documents: [
      {
        filename: `${filenamePrefix}_reference_brief_v1.md`,
        title: `${topicTitle} Reference Brief`,
        authority: 'context' as const,
        authority_provenance: 'brainstormed' as const,
        status: 'draft_for_review' as const,
        body_markdown: `---\ntitle: ${topicTitle} Reference Brief\nauthority: context\nauthority_provenance: brainstormed\nstatus: draft_for_review\n---\n\n# ${topicTitle} Reference Brief\n\nThis draft captures the core concepts the module may need to teach. Replace or promote it only after Redex SME review.\n\n## Key concepts\n\n- Define the terms and tools involved in ${topicTitle}.\n- Identify safety or quality checks that should be verified by a lead.\n- List external standards or manufacturer documents that should become authoritative sources.`,
        notes_for_admin: 'Starter reference only; review against authoritative Redex and vendor sources.',
      },
      {
        filename: `${filenamePrefix}_module_build_plan_v1.md`,
        title: `${topicTitle} Module Build Plan`,
        authority: 'context' as const,
        authority_provenance: 'brainstormed' as const,
        status: 'draft_for_review' as const,
        body_markdown: `---\ntitle: ${topicTitle} Module Build Plan\nauthority: context\nauthority_provenance: brainstormed\nstatus: draft_for_review\n---\n\n# ${topicTitle} Module Build Plan\n\n## Audience\n\n${input.audience_hint ?? 'field_team'} learners who need a concise Redex-ready module.\n\n## Proposed lesson outline\n\n1. Why this topic matters at Redex.\n2. Tools, terminology, and safety checks.\n3. Procedure or decision flow.\n4. Practical verification and review.`,
        notes_for_admin: 'Use this to shape the module; do not treat it as technical authority.',
      },
      {
        filename: `${filenamePrefix}_sme_review_checklist_v1.md`,
        title: `${topicTitle} SME Review Checklist`,
        authority: 'context' as const,
        authority_provenance: 'brainstormed' as const,
        status: 'draft_for_review' as const,
        body_markdown: `---\ntitle: ${topicTitle} SME Review Checklist\nauthority: context\nauthority_provenance: brainstormed\nstatus: draft_for_review\n---\n\n# ${topicTitle} SME Review Checklist\n\n- Confirm every procedure step is Redex-approved.\n- Replace generic wording with Redex-specific practice.\n- Add authoritative docs, photos, diagrams, or field examples.\n- Identify anything that requires safety, compliance, or manager sign-off.`,
        notes_for_admin: 'Checklist for promotion from brainstormed context to reviewed source.',
      },
    ],
    manifest_markdown: `---\nmodule_slug: ${topicSlug}\nmodule_title: ${topicTitle}\nauthority: context\nauthority_provenance: brainstormed\nstatus: draft_for_review\n---\n\n# ${topicTitle}\n\nThis manifest is advisory. Supabase remains the system of record and Drive IDs are filled by the Redex intake backend after upload.\n\n- filename_ref: ${filenamePrefix}_reference_brief_v1.md note: brainstormed context source\n- filename_ref: ${filenamePrefix}_module_build_plan_v1.md note: module planning context\n- filename_ref: ${filenamePrefix}_sme_review_checklist_v1.md note: SME review checklist\n`,
    unresolved_questions: [
      'Which Redex SME must approve the final technical source?',
      'Which Redex SOP, vendor document, photo, or diagram should replace this brainstormed context?',
    ],
    sme_review_checklist: [
      'Confirm no brainstormed claim is promoted without a reviewed source.',
      'Mark authoritative materials explicitly before generation.',
      'Confirm whether the module requires safety review or practical sign-off.',
    ],
    module_basics: {
      title: topicTitle,
      parent_course_id: 'standalone',
      audience_archetype: input.audience_hint ?? 'field_team',
      audience_refinement: 'Generated from automated packet intake; confirm before generation.',
      completion_required: 'required' as const,
      training_type: 'operational' as const,
      learning_outcomes: [
        { id: `${topicSlug}-outcome-1`, text: `Explain the purpose and Redex relevance of ${topicTitle}.` },
        { id: `${topicSlug}-outcome-2`, text: `Identify the reviewed source material required before publishing ${topicTitle}.` },
      ],
      estimated_minutes: 15,
      updated_at: now,
    },
    setup_answers: {
      criticality: 'operational' as const,
      assessment_style: 'standard_quiz' as const,
      audience_notes: `Primary audience: ${input.audience_hint ?? 'field_team'}. Confirm exact role scope before generation.`,
      experience_notes: 'Use Redex-specific examples once authoritative source material is attached.',
      estimated_minutes: 15,
      source_control: 'strict' as const,
      requires_admin_approval: true,
      requires_safety_review: true,
    },
  };
}

function analyzeSourceInput(input: AnalyzeSourceInput) {
  if (isSourceFileList(input.sources)) {
    const firstSource = input.sources[0];
    const topic = firstSource?.topic ?? firstSource?.title ?? 'Untitled source';

    return {
      topic,
      authority: firstSource?.authority ?? 'context',
      sections_detected: 0,
      has_placeholders: false,
      missing_required_topics: input.sources.length === 0 ? ['No source files supplied'] : [],
    };
  }

  const sections = input.sources.sections;
  const placeholderSections = sections.filter((section) => section.has_placeholders);

  return {
    topic: input.sources.title,
    authority: 'authoritative' as const,
    sections_detected: sections.length,
    has_placeholders: placeholderSections.length > 0,
    missing_required_topics: placeholderSections.map((section) => section.heading || `Section ${section.position_index + 1}`),
  };
}

const MOCK_ORDERING_STEPS: OrderingStep[] = [
  {
    id: 'mock-ordering-step-1',
    label: 'Confirm the source request',
    detail_markdown: 'Read the source-backed instruction before taking action.',
  },
  {
    id: 'mock-ordering-step-2',
    label: 'Complete the required action',
    detail_markdown: 'Apply the approved Redex process and document the result.',
  },
];

function hasValidOrderingSteps(steps: OrderingStep[] | undefined): steps is [OrderingStep, OrderingStep, ...OrderingStep[]] {
  if (!steps || steps.length < 2) {
    return false;
  }

  const stepIds = new Set<string>();

  return steps.every((step) => {
    const stepId = step.id.trim();
    const hasRequiredFields = stepId.length > 0 && step.label.trim().length > 0;
    const isDuplicate = stepIds.has(stepId);
    stepIds.add(stepId);

    return hasRequiredFields && !isDuplicate;
  });
}

function orderingStepsForMock(lesson: GeneratedLessonContent): OrderingStep[] {
  return hasValidOrderingSteps(lesson.ordering_steps) ? lesson.ordering_steps : MOCK_ORDERING_STEPS;
}

function withMockOrderingSteps(lesson: GeneratedLessonContent): GeneratedLessonContent {
  if (lesson.lesson_type !== 'drag_to_order' || hasValidOrderingSteps(lesson.ordering_steps)) {
    return lesson;
  }

  return {
    ...lesson,
    ordering_steps: MOCK_ORDERING_STEPS,
  };
}

function lessonContentFor(lesson: GeneratedLessonContent): LessonContent {
  switch (lesson.lesson_type) {
    case 'acknowledgment':
      return {
        type: 'acknowledgment',
        statement_markdown: lesson.acknowledgment_text ?? lesson.body_markdown ?? '',
      };
    case 'assignment':
      return { type: 'assignment', instructions: lesson.body_markdown ?? '' };
    case 'checklist':
      return {
        type: 'checklist',
        intro_markdown: lesson.body_markdown,
        items: [],
      };
    case 'coach':
      return { type: 'coach', intro_markdown: lesson.body_markdown ?? '' };
    case 'quiz':
      return { type: 'quiz', questions: lesson.quiz_questions ?? [] };
    case 'reflection_prompt':
      return { type: 'reflection_prompt', prompt: lesson.body_markdown ?? '' };
    case 'scenario':
      return { type: 'scenario', intro_markdown: lesson.body_markdown ?? '', steps: [] };
    case 'video':
      return {
        type: 'video',
        video_url: lesson.video_url ?? '#',
        duration_seconds: lesson.duration_seconds,
        transcript_markdown: lesson.transcript_markdown ?? lesson.video_script_markdown ?? lesson.body_markdown,
        poster_url: lesson.poster_url,
        media_asset_id: lesson.media_asset_id,
        media_provider: lesson.media_provider,
        media_status: lesson.media_status,
        download_url: lesson.download_url,
        downloads: lesson.downloads,
        provenance: lesson.provenance,
        chapters: lesson.chapters ?? lesson.video_chapters,
        transcript_segments: lesson.transcript_segments ?? lesson.video_transcript_segments,
        checkpoints: lesson.checkpoints ?? lesson.video_checkpoints,
      };
    case 'text':
      return {
        type: 'text',
        body_markdown: lesson.body_markdown ?? '',
        blocks: lesson.reading_blocks,
      };
    case 'hotspot_diagram':
      return {
        type: 'hotspot_diagram',
        intro_markdown: lesson.body_markdown,
        image_ref: {
          url: '#',
          alt_text: 'Hotspot diagram placeholder',
        },
        hotspots: [],
      };
    case 'drag_to_order':
      return {
        type: 'drag_to_order',
        intro_markdown: lesson.body_markdown,
        steps: orderingStepsForMock(lesson),
      };
  }
}

function toRegeneratedDomainLesson(moduleVersionId: string, lesson: GeneratedLessonContent): Lesson {
  return {
    id: `${moduleVersionId}-lesson-${lesson.module_index}-${lesson.lesson_index}`,
    module_id: moduleVersionId,
    title: `${lesson.title} (regenerated)`,
    lesson_type: lesson.lesson_type,
    criticality: 'required',
    order_index: lesson.lesson_index,
    estimated_minutes: 5,
    content: lessonContentFor({
      ...lesson,
      body_markdown: lesson.body_markdown
        ? `${lesson.body_markdown}\n\n_Regenerated from updated source section._`
        : lesson.body_markdown,
    }),
  };
}

function matchesAffectedLesson(lesson: GeneratedLessonContent, affectedLessonIds: string[]) {
  if (affectedLessonIds.length === 0) {
    return false;
  }

  const generatedId = `${lesson.module_index}-${lesson.lesson_index}`;

  return affectedLessonIds.includes(generatedId) || affectedLessonIds.includes(String(lesson.lesson_index)) || affectedLessonIds.includes(lesson.title);
}

export const mockLessonSourceBindings = MOCK_LESSON_SOURCE_BINDINGS;
export const mockInitialLessonReviews = MOCK_LESSON_REVIEWS;

export const mockAiClient: CourseFoundryAiClient = {
  async brainstormSourcePacket(input) {
    return validateAiOutput(BrainstormedPacketSchema, mockBrainstormedPacket(input));
  },

  async analyzeSource(input) {
    return validateAiOutput(AnalyzeSourceOutputSchema, analyzeSourceInput(input));
  },

  async generateOutline() {
    return validateAiOutput(GenerateOutlineOutputSchema, cloneJson(MOCK_GENERATED_OUTLINE));
  },

  async generateLessons(input) {
    if (input.sources.id === 'source-absent-eval') {
      return validateAiOutput(GenerateLessonsOutputSchema, {
        module_title: MOCK_GENERATED_MODULE.module_title,
        lessons: [
          {
            lesson_index: 0,
            module_index: 0,
            title: 'Missing source blocker',
            lesson_type: 'text',
            body_markdown: '',
            status: 'missing_source',
            status_note: 'Missing source: generation refused instead of fabricating Redex policy.',
          },
        ],
        generated_at: new Date().toISOString(),
        is_complete: false,
      });
    }

    const outcomeVerb = input.learning_outcomes?.[0]?.text.split(' ')[0]
    const generated = cloneJson(MOCK_GENERATED_MODULE)

    generated.lessons = generated.lessons.map(withMockOrderingSteps);

    if (outcomeVerb) {
      generated.lessons = generated.lessons.map((lesson, index) =>
        index < 3 ? { ...lesson, title: `${lesson.title} — ${outcomeVerb}` } : lesson,
      )
    }

    return validateAiOutput(GenerateLessonsOutputSchema, generated);
  },

  async generateAssessment() {
    const quizLesson = MOCK_GENERATED_MODULE.lessons.find((lesson) => lesson.lesson_type === 'quiz');
    const output = {
      assessment_lesson_id: quizLesson ? `mock-assessment-${quizLesson.module_index}-${quizLesson.lesson_index}` : 'mock-assessment-empty',
      questions: quizLesson?.quiz_questions ?? [],
    };

    return validateAiOutput(GenerateAssessmentOutputSchema, cloneJson(output));
  },

  async critiqueModule(input) {
    const report = cloneJson(MOCK_SELF_CRITIQUE)

    if (input.learning_outcomes?.length) {
      report.issues = report.issues.map((issue, index) =>
        index === 0
          ? {
              ...issue,
              detail: `${issue.detail} Outcome focus: ${input.learning_outcomes?.[0]?.text}`,
            }
          : issue,
      )
    }

    return validateAiOutput(CritiqueModuleOutputSchema, report);
  },

  async regenerateWithFixes(input) {
    const selectedFixSummary = input.selectedFixes.length > 0 ? input.selectedFixes.join(', ') : 'no selected fixes';
    const output = {
      ...cloneJson(MOCK_GENERATED_MODULE),
      generated_at: new Date().toISOString(),
      lessons: MOCK_GENERATED_MODULE.lessons.map((lesson, index) =>
        withMockOrderingSteps(
          index === 0
            ? {
                ...lesson,
                status_note: `Regenerated with fixes: ${selectedFixSummary}`,
              }
            : lesson,
        ),
      ),
    };

    return validateAiOutput(RegenerateWithFixesOutputSchema, output);
  },

  async regenerateSection(input) {
    const matchedLessons = MOCK_GENERATED_MODULE.lessons.filter((lesson) =>
      matchesAffectedLesson(lesson, input.affectedLessonIds),
    );
    const selectedLessons = (matchedLessons.length > 0 ? matchedLessons : MOCK_GENERATED_MODULE.lessons.slice(0, 2)).slice(0, 2);
    const selectedLessonKeys = new Set(selectedLessons.map((lesson) => `${lesson.module_index}-${lesson.lesson_index}`));
    const newReviewItems: LessonReviewItem[] = MOCK_LESSON_REVIEWS.filter((review) =>
      selectedLessonKeys.has(`${review.module_index}-${review.lesson_index}`),
    ).map((review) => ({
      ...review,
      confidence: review.confidence === 'unsupported' ? 'medium' : review.confidence,
      has_unsupported_claim: false,
      unsupported_note: undefined,
      status: 'pending',
    }));

    const output = {
      regeneratedLessons: selectedLessons.map((lesson) => toRegeneratedDomainLesson(input.moduleVersionId, lesson)),
      newReviewItems,
    };

    return validateAiOutput(RegenerateSectionOutputSchema, cloneJson(output));
  },
};
