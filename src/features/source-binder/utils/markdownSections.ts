import type { SourceSection } from '@/lib/education';

/** Tokens that mark "this content is missing approved Redex policy". */
export const PLACEHOLDER_TOKENS = ['[PLACEHOLDER]', '[TODO]', '[FIXME]'] as const;

const HEADING_PATTERN = /^(#{1,6})\s+(.+)$/;

function slugify(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 32);

  return normalized || 'preamble';
}

function hasPlaceholders(body: string): boolean {
  const normalized = body.toUpperCase();

  if (PLACEHOLDER_TOKENS.some((token) => normalized.includes(token))) {
    return true;
  }

  return normalized.includes('[PLACEHOLDER —');
}

export function parseMarkdownSections(rawText: string): SourceSection[] {
  if (rawText.trim() === '') {
    return [];
  }

  const lines = rawText.split('\n');
  const sections: SourceSection[] = [];
  let inCodeFence = false;

  let currentHeading = '';
  let currentLevel: SourceSection['level'] = 0;
  let currentBodyLines: string[] = [];

  const pushCurrentSection = (): void => {
    const body = currentBodyLines.join('\n').replace(/^\n+|\n+$/g, '');

    if (currentHeading === '' && body === '') {
      return;
    }

    const position_index = sections.length;
    const headingBase = currentHeading || 'preamble';

    sections.push({
      id: `section-${position_index}-${slugify(headingBase)}`,
      level: currentLevel,
      heading: currentHeading,
      body,
      position_index,
      has_placeholders: hasPlaceholders(body),
    });
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('```')) {
      inCodeFence = !inCodeFence;
    }

    if (!inCodeFence) {
      const headingMatch = line.match(HEADING_PATTERN);

      if (headingMatch) {
        const headingHashes = headingMatch[1];
        const headingText = headingMatch[2];

        if (headingHashes !== undefined && headingText !== undefined) {
          pushCurrentSection();
          currentLevel = headingHashes.length as SourceSection['level'];
          currentHeading = headingText.trimEnd();
          currentBodyLines = [];
          continue;
        }
      }
    }

    currentBodyLines.push(line);
  }

  pushCurrentSection();

  return sections;
}
