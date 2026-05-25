import { realAiClient } from '../realAiClient';
import { mockAiClient } from '../mockAiClient';
import type { CourseFoundryAiClient } from '../courseFoundryAiClient';
import type { GeneratedLessonContent, ReadingLessonBlock } from '@/types/training';

export interface EvalResult {
  name: string;
  threshold: number;
  actual: number;
  passed: boolean;
}

export function getEvalAiClient(): CourseFoundryAiClient {
  return process.env.EVAL_USE_REAL_AI === 'true' ? realAiClient : mockAiClient;
}

export function percent(numerator: number, denominator: number): number {
  return denominator === 0 ? 100 : Math.round((numerator / denominator) * 10_000) / 100;
}

export function assertThreshold(name: string, actual: number, threshold: number): EvalResult {
  return {
    name,
    threshold,
    actual,
    passed: actual >= threshold,
  };
}

export function printEvalSummary(result: EvalResult): void {
  console.table([
    {
      Eval: result.name,
      Threshold: `${result.threshold}%`,
      Actual: `${result.actual}%`,
      Result: result.passed ? 'PASS' : 'FAIL',
    },
  ]);
}

export function sourceCitationIds(text: string): string[] {
  return [...text.matchAll(/\[source:\s*([^\]]+)\]/giu)]
    .flatMap((match) => match[1]?.split(',') ?? [])
    .map((value) => value.trim())
    .filter(Boolean);
}

export function stripSourceCitations(text: string): string {
  return text.replace(/\[source:\s*([^\]]+)\]/giu, '').trim();
}

export function readingBlockClaimTexts(blocks: ReadingLessonBlock[] | undefined): string[] {
  return (blocks ?? []).flatMap((block) => {
    switch (block.kind) {
      case 'prose':
      case 'callout':
        return [block.markdown];
      case 'policy_quote':
        return [block.quote_markdown];
      case 'inline_check':
        return [
          block.prompt,
          ...block.options,
          block.feedback_correct_markdown,
          block.feedback_incorrect_markdown,
          block.feedback_neutral_markdown,
        ].filter((text): text is string => Boolean(text));
      case 'collapsible':
        return [block.markdown];
      case 'config_block':
        return [block.description_markdown].filter((text): text is string => Boolean(text));
      case 'image':
        return [block.text_equivalent_markdown];
    }
  });
}

export function generatedLessonClaimTexts(lesson: GeneratedLessonContent): string[] {
  return [
    ...(lesson.body_markdown?.split(/\n+/u) ?? []),
    ...readingBlockClaimTexts(lesson.reading_blocks),
    ...(lesson.acknowledgment_text ? [lesson.acknowledgment_text] : []),
    ...(lesson.quiz_questions ?? []).flatMap((question) => [question.question, ...question.options]),
  ].map((claim) => claim.trim()).filter((claim) => stripSourceCitations(claim).length > 0);
}

export function readingProseTexts(lesson: GeneratedLessonContent): string[] {
  return (lesson.reading_blocks ?? []).flatMap((block) => {
    switch (block.kind) {
      case 'prose':
      case 'callout':
        return [stripSourceCitations(block.markdown)];
      default:
        return [];
    }
  }).filter((text) => text.trim().length > 0);
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/`{1,3}[^`]*`{1,3}/gu, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/[*_>#~|]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function countSyllables(word: string): number {
  const normalized = word.toLowerCase().replace(/[^a-z]/gu, '');

  if (!normalized) {
    return 0;
  }

  const withoutSilentE = normalized.replace(/e$/u, '');
  const groups = withoutSilentE.match(/[aeiouy]+/gu);

  return Math.max(1, groups?.length ?? 1);
}

export function fleschKincaidGrade(text: string): number {
  const plain = stripMarkdown(stripSourceCitations(text));
  const sentences = Math.max(1, plain.split(/[.!?]+/u).filter((sentence) => sentence.trim().length > 0).length);
  const words = plain.match(/[A-Za-z]+(?:'[A-Za-z]+)?/gu) ?? [];

  if (words.length === 0) {
    return 0;
  }

  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);

  return 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59;
}
