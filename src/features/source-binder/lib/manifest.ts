import type { SourceAuthorityLevel } from '@/lib/education';

export interface ParsedManifestEntry {
  drive_file_id: string;
  note?: string;
}

export interface ParsedManifest {
  module_slug: string;
  module_title?: string;
  description?: string;
  entries: ParsedManifestEntry[];
}

export interface ParsedFrontmatter {
  authority: SourceAuthorityLevel;
  authority_source: 'frontmatter' | 'meta_md' | 'default';
  topic?: string;
  title?: string;
  body: string;
}

type ParsedAuthority = {
  authority: SourceAuthorityLevel;
  authority_source: ParsedFrontmatter['authority_source'];
};

const KNOWN_AUTHORITIES: ReadonlySet<SourceAuthorityLevel> = new Set([
  'authoritative',
  'supporting',
  'context',
]);

function parseSimpleKeyValueLines(raw: string): Record<string, string> {
  const output: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const colonIndex = trimmed.indexOf(':');

    if (colonIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    if (key !== '') {
      output[key] = value;
    }
  }

  return output;
}

function extractLeadingFrontmatter(raw: string): {
  fields?: Record<string, string>;
  body: string;
} {
  const hasLeadingDelimiter = raw.startsWith('---\n') || raw.startsWith('---\r\n');

  if (!hasLeadingDelimiter) {
    return { body: raw };
  }

  const firstLineEnd = raw.indexOf('\n');

  if (firstLineEnd === -1) {
    return { body: raw };
  }

  let cursor = firstLineEnd + 1;

  while (cursor <= raw.length) {
    const nextLineBreak = raw.indexOf('\n', cursor);
    const lineEnd = nextLineBreak === -1 ? raw.length : nextLineBreak;
    const line = raw.slice(cursor, lineEnd).replace(/\r$/, '');

    if (line.trim() === '---') {
      const fieldsRaw = raw.slice(firstLineEnd + 1, cursor);
      const bodyStart = nextLineBreak === -1 ? raw.length : nextLineBreak + 1;

      return {
        fields: parseSimpleKeyValueLines(fieldsRaw),
        body: raw.slice(bodyStart),
      };
    }

    if (nextLineBreak === -1) {
      break;
    }

    cursor = nextLineBreak + 1;
  }

  return { body: raw };
}

function resolveAuthority(
  rawAuthority: string | undefined,
  sourceWhenKnown: 'frontmatter' | 'meta_md',
): ParsedAuthority {
  if (rawAuthority !== undefined && KNOWN_AUTHORITIES.has(rawAuthority as SourceAuthorityLevel)) {
    return {
      authority: rawAuthority as SourceAuthorityLevel,
      authority_source: sourceWhenKnown,
    };
  }

  return {
    authority: 'context',
    authority_source: 'default',
  };
}

export function parseFrontmatter(rawMarkdown: string): ParsedFrontmatter {
  const { fields, body } = extractLeadingFrontmatter(rawMarkdown);

  if (fields === undefined) {
    return {
      authority: 'context',
      authority_source: 'default',
      body,
    };
  }

  const authority = resolveAuthority(fields.authority, 'frontmatter');

  return {
    ...authority,
    topic: fields.topic,
    title: fields.title,
    body,
  };
}

export function parseMetaMd(rawMetaMd: string): Omit<ParsedFrontmatter, 'body'> {
  const { fields } = extractLeadingFrontmatter(rawMetaMd);

  if (fields === undefined) {
    return {
      authority: 'context',
      authority_source: 'default',
    };
  }

  const authority = resolveAuthority(fields.authority, 'meta_md');

  return {
    ...authority,
    topic: fields.topic,
    title: fields.title,
  };
}

export function parseManifest(rawManifest: string): ParsedManifest {
  if (rawManifest.trim() === '') {
    return {
      module_slug: '',
      entries: [],
    };
  }

  const { fields, body } = extractLeadingFrontmatter(rawManifest);
  const bodyLines = body.split(/\r?\n/);
  const entries: ParsedManifestEntry[] = [];
  const descriptionLines: string[] = [];

  for (const line of bodyLines) {
    const entryMatch = line.match(
      /^\s*-\s*drive_file_id\s*:\s*(\S+)(?:\s+note\s*:\s*(.+))?\s*$/i,
    );

    if (!entryMatch) {
      const trimmed = line.trim();

      if (trimmed !== '') {
        descriptionLines.push(trimmed);
      }

      continue;
    }

    const driveFileId = entryMatch[1]?.trim();

    if (driveFileId === undefined || driveFileId === '') {
      continue;
    }

    const note = entryMatch[2]?.trim();

    entries.push(
      note === undefined || note === ''
        ? { drive_file_id: driveFileId }
        : { drive_file_id: driveFileId, note },
    );
  }

  const module_slug = fields?.module_slug?.trim() ?? '';

  if (module_slug === '') {
    throw new Error('Manifest frontmatter must include a non-empty module_slug.');
  }

  return {
    module_slug,
    module_title: fields?.module_title?.trim() || undefined,
    description: descriptionLines.length > 0 ? descriptionLines.join('\n') : undefined,
    entries,
  };
}
