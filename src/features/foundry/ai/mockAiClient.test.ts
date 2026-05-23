import { describe, expect, it } from 'vitest';

import { MOCK_GENERATED_MODULE } from '@/features/foundry/data/mockGeneratedModule';
import { MOCK_GENERATED_OUTLINE } from '@/features/foundry/data/mockGeneratedOutline';
import { MOCK_SELF_CRITIQUE } from '@/features/foundry/data/mockSelfCritique';
import type { SourceMaterial } from '@/types/training';

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
import { mockAiClient } from './mockAiClient';
import {
  DEFAULT_AI_MODULE_BASICS,
  DEFAULT_AI_SETUP_ANSWERS,
  DEFAULT_AI_SOURCE_MATERIAL,
} from './pageInputDefaults';

const sourceWithPlaceholders: SourceMaterial = {
  ...DEFAULT_AI_SOURCE_MATERIAL,
  title: 'Payroll policy',
  sections: [
    {
      id: 'source-section-1',
      level: 2,
      heading: 'Payroll basics',
      body: '[PLACEHOLDER — approved copy pending]',
      position_index: 0,
      has_placeholders: true,
    },
  ],
};

describe('mockAiClient', () => {
  it('analyzes source input and validates the output shape', async () => {
    const output = await mockAiClient.analyzeSource({ sources: sourceWithPlaceholders });

    expect(validateAiOutput(AnalyzeSourceOutputSchema, output)).toEqual({
      topic: 'Payroll policy',
      authority: 'authoritative',
      sections_detected: 1,
      has_placeholders: true,
      missing_required_topics: ['Payroll basics'],
    });
  });

  it('generates the existing mock outline through the interface', async () => {
    const output = await mockAiClient.generateOutline({
      basics: DEFAULT_AI_MODULE_BASICS,
      sources: DEFAULT_AI_SOURCE_MATERIAL,
      setupAnswers: DEFAULT_AI_SETUP_ANSWERS,
    });

    expect(validateAiOutput(GenerateOutlineOutputSchema, output)).toEqual(MOCK_GENERATED_OUTLINE);
  });

  it('generates the existing mock module through the interface', async () => {
    const output = await mockAiClient.generateLessons({
      outline: MOCK_GENERATED_OUTLINE,
      sources: DEFAULT_AI_SOURCE_MATERIAL,
    });

    expect(validateAiOutput(GenerateLessonsOutputSchema, output)).toEqual(MOCK_GENERATED_MODULE);
  });

  it('generates assessment output from the mock quiz lesson', async () => {
    const output = await mockAiClient.generateAssessment({
      module: MOCK_GENERATED_MODULE,
      sources: DEFAULT_AI_SOURCE_MATERIAL,
    });

    const quizLesson = MOCK_GENERATED_MODULE.lessons.find((lesson) => lesson.lesson_type === 'quiz');

    expect(validateAiOutput(GenerateAssessmentOutputSchema, output).questions).toEqual(quizLesson?.quiz_questions);
    expect(output.assessment_lesson_id).toBe('mock-assessment-0-5');
  });

  it('critiques the module using the existing mock self-critique report', async () => {
    const output = await mockAiClient.critiqueModule({
      module: MOCK_GENERATED_MODULE,
      sources: DEFAULT_AI_SOURCE_MATERIAL,
    });

    expect(validateAiOutput(CritiqueModuleOutputSchema, output)).toEqual(MOCK_SELF_CRITIQUE);
  });

  it('regenerates with fixes and returns a validated generated module preview', async () => {
    const output = await mockAiClient.regenerateWithFixes({
      module: MOCK_GENERATED_MODULE,
      critique: MOCK_SELF_CRITIQUE,
      selectedFixes: ['critique-issue-001'],
      sources: DEFAULT_AI_SOURCE_MATERIAL,
    });

    const validated = validateAiOutput(RegenerateWithFixesOutputSchema, output);
    expect(validated.lessons).toHaveLength(MOCK_GENERATED_MODULE.lessons.length);
    expect(validated.lessons[0]?.status_note).toContain('critique-issue-001');
  });

  it('regenerates section-bound lessons and returns review items', async () => {
    const output = await mockAiClient.regenerateSection({
      moduleVersionId: 'module-version-hr-basics-v1',
      sourceSectionId: 'source-section-1',
      affectedLessonIds: ['2'],
      sources: DEFAULT_AI_SOURCE_MATERIAL,
    });

    const validated = validateAiOutput(RegenerateSectionOutputSchema, output);
    expect(validated.regeneratedLessons).toHaveLength(1);
    expect(validated.regeneratedLessons[0]?.title).toContain('Payroll and Timekeeping Basics');
    expect(validated.newReviewItems[0]).toMatchObject({
      lesson_index: 2,
      has_unsupported_claim: false,
      status: 'pending',
    });
  });
});
