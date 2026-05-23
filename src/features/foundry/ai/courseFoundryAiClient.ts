import type {
  CourseOutlineDraft,
  GeneratedModulePreview,
  Lesson,
  LessonReviewItem,
  SelfCritiqueReport,
  SetupAnswers,
  SourceFile,
  SourceMaterial,
} from '@/types/training';
import type { ModuleBasicsDraft } from '@/features/foundry/types';

export interface AnalyzeSourceInput {
  sources: SourceFile[] | SourceMaterial;
}

export interface AnalyzeSourceOutput {
  topic: string;
  authority: 'authoritative' | 'supporting' | 'context';
  sections_detected: number;
  has_placeholders: boolean;
  missing_required_topics: string[];
}

export interface GenerateOutlineInput {
  basics: ModuleBasicsDraft;
  sources: SourceMaterial;
  setupAnswers: SetupAnswers;
}
export type GenerateOutlineOutput = CourseOutlineDraft;

export interface GenerateLessonsInput {
  outline: CourseOutlineDraft;
  sources: SourceMaterial;
}
export type GenerateLessonsOutput = GeneratedModulePreview;

export interface GenerateAssessmentInput {
  module: GeneratedModulePreview;
  sources: SourceMaterial;
}
export type GenerateAssessmentOutput = {
  assessment_lesson_id: string;
  questions: import('@/types/training').QuizQuestion[];
};

export interface CritiqueModuleInput {
  module: GeneratedModulePreview;
  sources: SourceMaterial;
}
export type CritiqueModuleOutput = SelfCritiqueReport;

export interface RegenerateWithFixesInput {
  module: GeneratedModulePreview;
  critique: SelfCritiqueReport;
  selectedFixes: string[];
  sources: SourceMaterial;
}
export type RegenerateWithFixesOutput = GeneratedModulePreview;

export interface RegenerateSectionInput {
  moduleVersionId: string;
  sourceSectionId: string;
  affectedLessonIds: string[];
  sources: SourceMaterial;
}
export interface RegenerateSectionOutput {
  regeneratedLessons: Lesson[];
  newReviewItems: LessonReviewItem[];
}

/**
 * Provider-agnostic Course Foundry AI client. UI MUST call this interface,
 * not any vendor SDK directly. Two implementations:
 *   - mockAiClient — returns existing demo data, preserves all current
 *     mock-mode behavior (Phase 3 critique, side-by-side review, etc.)
 *   - realAiClient — proxies to edge functions (AI Slice C); never holds
 *     any provider key client-side.
 */
export interface CourseFoundryAiClient {
  analyzeSource(input: AnalyzeSourceInput): Promise<AnalyzeSourceOutput>;
  generateOutline(input: GenerateOutlineInput): Promise<GenerateOutlineOutput>;
  generateLessons(input: GenerateLessonsInput): Promise<GenerateLessonsOutput>;
  generateAssessment(input: GenerateAssessmentInput): Promise<GenerateAssessmentOutput>;
  critiqueModule(input: CritiqueModuleInput): Promise<CritiqueModuleOutput>;
  regenerateWithFixes(input: RegenerateWithFixesInput): Promise<RegenerateWithFixesOutput>;
  regenerateSection(input: RegenerateSectionInput): Promise<RegenerateSectionOutput>;
}
