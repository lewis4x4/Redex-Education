import type {
  CanonicalAudience,
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

export interface LearningOutcomeInput {
  id: string;
  text: string;
}

export interface BrainstormSourcePacketInput {
  topic: string;
  audience_hint?: CanonicalAudience;
}

export interface BrainstormedDocument {
  filename: string;
  title: string;
  authority: 'context';
  authority_provenance: 'brainstormed';
  status: 'draft_for_review';
  body_markdown: string;
  notes_for_admin?: string;
}

export interface BrainstormedPacket {
  suggested_module_slug: string;
  suggested_module_title: string;
  summary: string;
  library_topic_slug: string;
  module_folder_slug: string;
  estimated_cost_cents: number;
  documents: BrainstormedDocument[];
  manifest_markdown: string;
  unresolved_questions: string[];
  sme_review_checklist: string[];
  module_basics: ModuleBasicsDraft;
  setup_answers: Omit<SetupAnswers, 'updated_at'>;
}

export interface GenerateOutlineInput {
  basics: ModuleBasicsDraft;
  sources: SourceMaterial;
  setupAnswers: SetupAnswers;
  learning_outcomes?: LearningOutcomeInput[];
}
export type GenerateOutlineOutput = CourseOutlineDraft;

export interface GenerateLessonsInput {
  outline: CourseOutlineDraft;
  sources: SourceMaterial;
  learning_outcomes?: LearningOutcomeInput[];
}
export type GenerateLessonsOutput = GeneratedModulePreview & { lesson_reviews?: LessonReviewItem[] };

export interface GenerateAssessmentInput {
  module: GeneratedModulePreview;
  sources: SourceMaterial;
  learning_outcomes?: LearningOutcomeInput[];
}
export type GenerateAssessmentOutput = {
  assessment_lesson_id: string;
  questions: import('@/types/training').QuizQuestion[];
};

export interface CritiqueModuleInput {
  module: GeneratedModulePreview;
  sources: SourceMaterial;
  courseOutline?: CourseOutlineDraft;
  generatedAssessments?: GenerateAssessmentOutput;
  promptIds?: string[];
  learning_outcomes?: LearningOutcomeInput[];
}
export type CritiqueModuleOutput = SelfCritiqueReport;

export interface RegenerateWithFixesInput {
  module: GeneratedModulePreview;
  critique: SelfCritiqueReport;
  selectedFixes: string[];
  sources: SourceMaterial;
  learning_outcomes?: LearningOutcomeInput[];
}
export type RegenerateWithFixesOutput = GeneratedModulePreview;

export interface RegenerateSectionInput {
  moduleVersionId: string;
  sourceSectionId: string;
  affectedLessonIds: string[];
  sources: SourceMaterial;
  learning_outcomes?: LearningOutcomeInput[];
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
  brainstormSourcePacket(input: BrainstormSourcePacketInput): Promise<BrainstormedPacket>;
  analyzeSource(input: AnalyzeSourceInput): Promise<AnalyzeSourceOutput>;
  generateOutline(input: GenerateOutlineInput): Promise<GenerateOutlineOutput>;
  generateLessons(input: GenerateLessonsInput): Promise<GenerateLessonsOutput>;
  generateAssessment(input: GenerateAssessmentInput): Promise<GenerateAssessmentOutput>;
  critiqueModule(input: CritiqueModuleInput): Promise<CritiqueModuleOutput>;
  regenerateWithFixes(input: RegenerateWithFixesInput): Promise<RegenerateWithFixesOutput>;
  regenerateSection(input: RegenerateSectionInput): Promise<RegenerateSectionOutput>;
}
