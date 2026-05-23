import { PLACEHOLDER_TOKENS } from './markdownSections';

export type ValidationSeverity = 'warning' | 'blocker';

export interface SourceValidationIssue {
  severity: ValidationSeverity;
  token_matched: string;
  /** Approximate character offset where the issue starts. */
  position: number;
  /** 50-char window around the match for context. */
  context_snippet: string;
}

/** Returns the standard warning copy. */
export const MISSING_SOURCE_WARNING =
  '⚠️ MISSING SOURCE — Admin must provide approved content before publishing.' as const;

function getContextSnippet(text: string, position: number): string {
  const windowRadius = 25;
  const start = Math.max(0, position - windowRadius);
  const end = Math.min(text.length, position + windowRadius);
  return text.slice(start, end);
}

/** Per-blocker presentation helper. */
export function classifyMissingSourceSeverity(snippet: string): ValidationSeverity {
  const normalized = snippet.toUpperCase();

  if (
    normalized.includes('[TODO]') &&
    !normalized.includes('[PLACEHOLDER]') &&
    !normalized.includes('[FIXME]')
  ) {
    return 'warning';
  }

  if (
    normalized.includes('[PLACEHOLDER]') ||
    normalized.includes('[FIXME]') ||
    normalized.includes('ADMIN MUST PROVIDE')
  ) {
    return 'blocker';
  }

  return 'warning';
}

/** Detects missing-source tokens in a text. Returns empty array if clean. */
export function detectMissingSource(text: string): SourceValidationIssue[] {
  const issues: SourceValidationIssue[] = [];
  const normalized = text.toUpperCase();

  for (const token of PLACEHOLDER_TOKENS) {
    const tokenNormalized = token.toUpperCase();
    let position = normalized.indexOf(tokenNormalized);

    while (position !== -1) {
      const context_snippet = getContextSnippet(text, position);
      issues.push({
        severity: classifyMissingSourceSeverity(context_snippet),
        token_matched: token,
        position,
        context_snippet,
      });

      position = normalized.indexOf(tokenNormalized, position + token.length);
    }
  }

  const policyPattern = 'ADMIN MUST PROVIDE APPROVED CONTENT BEFORE PUBLISHING';
  let policyPosition = normalized.indexOf(policyPattern);

  while (policyPosition !== -1) {
    const context_snippet = getContextSnippet(text, policyPosition);
    issues.push({
      severity: classifyMissingSourceSeverity(context_snippet),
      token_matched: 'ADMIN MUST PROVIDE',
      position: policyPosition,
      context_snippet,
    });
    policyPosition = normalized.indexOf(policyPattern, policyPosition + policyPattern.length);
  }

  return issues.sort((a, b) => a.position - b.position);
}

/** True when text contains any [PLACEHOLDER]-shaped content. */
export function hasMissingSource(text: string): boolean {
  const normalized = text.toUpperCase();

  if (PLACEHOLDER_TOKENS.some((token) => normalized.includes(token.toUpperCase()))) {
    return true;
  }

  return normalized.includes('ADMIN MUST PROVIDE APPROVED CONTENT BEFORE PUBLISHING');
}
