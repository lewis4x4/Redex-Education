import { describe, expect, it } from 'vitest';

import { MOCK_GENERATED_MODULE } from '@/features/foundry/data/mockGeneratedModule';
import { MOCK_GENERATED_OUTLINE } from '@/features/foundry/data/mockGeneratedOutline';
import { MOCK_SELF_CRITIQUE } from '@/features/foundry/data/mockSelfCritique';

import {
  AnalyzeSourceOutputSchema,
  CritiqueModuleOutputSchema,
  GenerateAssessmentOutputSchema,
  GenerateLessonsOutputSchema,
  GenerateOutlineOutputSchema,
  RegenerateSectionOutputSchema,
  RegenerateWithFixesOutputSchema,
} from '../aiSchemas';
import { DEFAULT_AI_MODULE_BASICS, DEFAULT_AI_SETUP_ANSWERS, DEFAULT_AI_SOURCE_MATERIAL } from '../pageInputDefaults';
import { assertThreshold, getEvalAiClient, percent, printEvalSummary } from './evalShared';

const THRESHOLD = 100;

describe('jsonSchemaValidity eval', () => {
  it('validates mock generation outputs against AI Slice B Zod schemas', async () => {
    const client = getEvalAiClient();
    const checks = [
      AnalyzeSourceOutputSchema.safeParse(await client.analyzeSource({ sources: DEFAULT_AI_SOURCE_MATERIAL })).success,
      GenerateOutlineOutputSchema.safeParse(await client.generateOutline({
        basics: DEFAULT_AI_MODULE_BASICS,
        sources: DEFAULT_AI_SOURCE_MATERIAL,
        setupAnswers: DEFAULT_AI_SETUP_ANSWERS,
      })).success,
      GenerateLessonsOutputSchema.safeParse(await client.generateLessons({
        outline: MOCK_GENERATED_OUTLINE,
        sources: DEFAULT_AI_SOURCE_MATERIAL,
      })).success,
      GenerateAssessmentOutputSchema.safeParse(await client.generateAssessment({
        module: MOCK_GENERATED_MODULE,
        sources: DEFAULT_AI_SOURCE_MATERIAL,
      })).success,
      CritiqueModuleOutputSchema.safeParse(await client.critiqueModule({
        module: MOCK_GENERATED_MODULE,
        sources: DEFAULT_AI_SOURCE_MATERIAL,
      })).success,
      RegenerateWithFixesOutputSchema.safeParse(await client.regenerateWithFixes({
        module: MOCK_GENERATED_MODULE,
        critique: MOCK_SELF_CRITIQUE,
        selectedFixes: ['critique-issue-001'],
        sources: DEFAULT_AI_SOURCE_MATERIAL,
      })).success,
      RegenerateSectionOutputSchema.safeParse(await client.regenerateSection({
        moduleVersionId: 'module-version-hr-basics-v1',
        sourceSectionId: 'section-payroll-basics',
        affectedLessonIds: ['2'],
        sources: DEFAULT_AI_SOURCE_MATERIAL,
      })).success,
    ];
    const actual = percent(checks.filter(Boolean).length, checks.length);
    const result = assertThreshold('JSON-schema validity', actual, THRESHOLD);
    printEvalSummary(result);

    expect(result.passed).toBe(true);
  });
});
