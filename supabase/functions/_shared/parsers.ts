export type SourceAuthorityLevel = "authoritative" | "supporting" | "context";
export type SourceAuthoritySource = "frontmatter" | "meta_md" | "default";

export interface SourceSection {
  id: string;
  level: number;
  heading: string;
  body: string;
  position_index: number;
  has_placeholders: boolean;
}

export interface ParsedFrontmatter {
  authority: SourceAuthorityLevel;
  authority_source: SourceAuthoritySource;
  topic?: string;
  title?: string;
  body: string;
}

export type ParsedMetaMd = Omit<ParsedFrontmatter, "body">;

const PLACEHOLDER_TOKENS = ["[PLACEHOLDER]", "[TODO]", "[FIXME]"] as const;
const HEADING_PATTERN = /^(#{1,6})\s+(.+)$/;
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

function slugify(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 32);

  return normalized || "preamble";
}

function hasPlaceholders(body: string): boolean {
  const normalized = body.toUpperCase();

  if (PLACEHOLDER_TOKENS.some((token) => normalized.includes(token))) {
    return true;
  }

  return normalized.includes("[PLACEHOLDER —");
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function parseSimpleYamlKeyValues(rawYaml: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of rawYaml.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#") || line.startsWith("-")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = stripWrappingQuotes(line.slice(separatorIndex + 1));

    if (key) {
      values[key] = value;
    }
  }

  return values;
}

function normalizeAuthority(
  value: string | undefined,
): SourceAuthorityLevel | null {
  if (
    value === "authoritative" || value === "supporting" || value === "context"
  ) {
    return value;
  }

  return null;
}

function parseFrontmatterBlock(
  rawMarkdown: string,
  sourceWhenAuthorityPresent: Exclude<SourceAuthoritySource, "default">,
): { metadata: ParsedMetaMd; body: string } {
  const match = rawMarkdown.match(FRONTMATTER_PATTERN);

  if (!match || match[1] === undefined) {
    return {
      metadata: { authority: "context", authority_source: "default" },
      body: rawMarkdown,
    };
  }

  const values = parseSimpleYamlKeyValues(match[1]);
  const authority = normalizeAuthority(values.authority);
  const metadata: ParsedMetaMd = {
    authority: authority ?? "context",
    authority_source: authority ? sourceWhenAuthorityPresent : "default",
  };

  if (values.topic) {
    metadata.topic = values.topic;
  }

  if (values.title) {
    metadata.title = values.title;
  }

  return {
    metadata,
    body: rawMarkdown.slice(match[0].length),
  };
}

/** Parse YAML-style leading frontmatter from markdown and return the stripped body. */
export function parseFrontmatter(rawMarkdown: string): ParsedFrontmatter {
  const parsed = parseFrontmatterBlock(rawMarkdown, "frontmatter");

  return {
    ...parsed.metadata,
    body: parsed.body,
  };
}

/** Parse a sibling `<filename>.meta.md` file for binary source metadata. */
export function parseMetaMd(rawMetaMd: string): ParsedMetaMd {
  return parseFrontmatterBlock(rawMetaMd, "meta_md").metadata;
}

/** Heading-driven markdown section parser ported for Deno edge-function runtime. */
export function parseMarkdownSections(rawText: string): SourceSection[] {
  if (rawText.trim() === "") {
    return [];
  }

  const lines = rawText.split("\n");
  const sections: SourceSection[] = [];
  let inCodeFence = false;

  let currentHeading = "";
  let currentLevel = 0;
  let currentBodyLines: string[] = [];

  const pushCurrentSection = (): void => {
    const body = currentBodyLines.join("\n").replace(/^\n+|\n+$/g, "");

    if (currentHeading === "" && body === "") {
      return;
    }

    const positionIndex = sections.length;
    const headingBase = currentHeading || "preamble";

    sections.push({
      id: `section-${positionIndex}-${slugify(headingBase)}`,
      level: currentLevel,
      heading: currentHeading,
      body,
      position_index: positionIndex,
      has_placeholders: hasPlaceholders(body),
    });
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("```")) {
      inCodeFence = !inCodeFence;
    }

    if (!inCodeFence) {
      const headingMatch = line.match(HEADING_PATTERN);

      if (headingMatch) {
        const headingHashes = headingMatch[1];
        const headingText = headingMatch[2];

        if (headingHashes !== undefined && headingText !== undefined) {
          pushCurrentSection();
          currentLevel = headingHashes.length;
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
