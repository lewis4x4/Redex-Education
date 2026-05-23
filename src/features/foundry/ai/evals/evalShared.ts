import { realAiClient } from '../realAiClient';
import { mockAiClient } from '../mockAiClient';
import type { CourseFoundryAiClient } from '../courseFoundryAiClient';

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
