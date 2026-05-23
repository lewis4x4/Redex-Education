import { MOCK_GENERATED_MODULE } from '@/features/foundry/data/mockGeneratedModule';
import { MOCK_GENERATED_OUTLINE, MOCK_LESSON_SOURCE_BINDINGS } from '@/features/foundry/data/mockGeneratedOutline';
import { MOCK_LESSON_REVIEWS } from '@/features/foundry/data/mockLessonReviews';
import { MOCK_SELF_CRITIQUE } from '@/features/foundry/data/mockSelfCritique';
import type {
  GeneratedLessonContent,
  Lesson,
  LessonContent,
  LessonReviewItem,
  SourceFile,
} from '@/types/training';

import {
  AnalyzeSourceOutputSchema,
  CritiqueModuleOutputSchema,
  GenerateAssessmentOutputSchema,
  GenerateLessonsOutputSchema,
  GenerateOutlineOutputSchema,
  RegenerateSectionOutputSchema,
  RegenerateWithFixesOutputSchema,
  validateAiOutput,
} from './aiSchemas';
import type { AnalyzeSourceInput, CourseFoundryAiClient } from './courseFoundryAiClient';

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isSourceFileList(sources: AnalyzeSourceInput['sources']): sources is SourceFile[] {
  return Array.isArray(sources);
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
      return { type: 'video', video_url: '#', transcript_markdown: lesson.body_markdown };
    case 'text':
      return { type: 'text', body_markdown: lesson.body_markdown ?? '' };
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

    return validateAiOutput(GenerateLessonsOutputSchema, cloneJson(MOCK_GENERATED_MODULE));
  },

  async generateAssessment() {
    const quizLesson = MOCK_GENERATED_MODULE.lessons.find((lesson) => lesson.lesson_type === 'quiz');
    const output = {
      assessment_lesson_id: quizLesson ? `mock-assessment-${quizLesson.module_index}-${quizLesson.lesson_index}` : 'mock-assessment-empty',
      questions: quizLesson?.quiz_questions ?? [],
    };

    return validateAiOutput(GenerateAssessmentOutputSchema, cloneJson(output));
  },

  async critiqueModule() {
    return validateAiOutput(CritiqueModuleOutputSchema, cloneJson(MOCK_SELF_CRITIQUE));
  },

  async regenerateWithFixes(input) {
    const selectedFixSummary = input.selectedFixes.length > 0 ? input.selectedFixes.join(', ') : 'no selected fixes';
    const output = {
      ...cloneJson(MOCK_GENERATED_MODULE),
      generated_at: new Date().toISOString(),
      lessons: MOCK_GENERATED_MODULE.lessons.map((lesson, index) =>
        index === 0
          ? {
              ...lesson,
              status_note: `Regenerated with fixes: ${selectedFixSummary}`,
            }
          : lesson,
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
