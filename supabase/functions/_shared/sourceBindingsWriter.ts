import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type RedexSupabaseClient = SupabaseClient<any, "public", "redex", any, any>;

export type SourceAuthority = "authoritative" | "supporting" | "context";
export type BindingKind = "whole_file" | "section";

export interface ClaimBinding {
  module_id: string;
  source_file_id: string;
  source_file_version_id: string;
  source_section_id: string | null;
  binding_kind: BindingKind;
}

export interface GeneratedLessonContent {
  lesson_index: number;
  module_index: number;
  title: string;
  lesson_type: string;
  body_markdown?: string;
  acknowledgment_text?: string;
  quiz_questions?: Array<{ id: string; question: string; options: string[] }>;
  status?: string;
  status_note?: string;
}

export interface GeneratedModulePreview {
  module_title: string;
  lessons: GeneratedLessonContent[];
  generated_at: string;
  is_complete: boolean;
}

export interface SourceSection {
  id: string;
  heading: string;
  body: string;
  has_placeholders?: boolean;
  source_file_version_id?: string;
  source_file_id?: string;
  authority?: SourceAuthority;
  conflicts_with?: string[];
  citation_id?: string;
}

export interface ResolvedSourceSection extends SourceSection {
  source_file_id: string;
  source_file_version_id: string;
  authority: SourceAuthority;
  citation_id?: string;
}

export interface CitedClaim {
  lesson_index: number;
  module_index: number;
  lesson_title: string;
  artifact_kind: "lesson" | "question";
  claim: string;
  section_ids: string[];
}

export interface UnsupportedClaimReport {
  lesson_index: number;
  module_index: number;
  lesson_title: string;
  artifact_kind: "lesson" | "question";
  claim: string;
  reason: "missing_citation" | "unresolved_source_section";
}

export interface ConflictReport {
  lesson_index: number;
  module_index: number;
  lesson_title: string;
  claim: string;
  section_ids: string[];
  authority: SourceAuthority;
  reason: "equal_authority_conflict";
}

export interface BindingPlan {
  bindings: Array<ClaimBinding & { flagged_for_review: boolean; flag_reason: string | null }>;
  claims: CitedClaim[];
  unsupportedClaims: UnsupportedClaimReport[];
  flaggedConflicts: ConflictReport[];
  placeholderSectionIds: string[];
}

export interface SourceBindingWriteResult {
  writtenCount: number;
  flaggedConflicts: ConflictReport[];
  unsupportedClaims: UnsupportedClaimReport[];
  placeholderSectionIds: string[];
  claims: CitedClaim[];
  resolvedSourceSections: ResolvedSourceSection[];
}

const AUTHORITY_RANK: Record<SourceAuthority, number> = {
  context: 0,
  supporting: 1,
  authoritative: 2,
};

const SOURCE_CITATION_RE = /\[source:\s*([^\]]+)\]/giu;

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function citationIds(text: string): string[] {
  return unique(
    [...text.matchAll(SOURCE_CITATION_RE)]
      .flatMap((match) => match[1]?.split(",") ?? [])
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function stripSourceCitations(text: string): string {
  return text.replace(SOURCE_CITATION_RE, "").replace(/\s+/gu, " ").trim();
}

function splitClaimFragments(text: string): string[] {
  return text
    .split(/\n{2,}|\n|(?<=[.!?])\s+(?=[A-Z0-9“"'])/u)
    .map((fragment) => fragment.trim())
    .filter((fragment) => stripSourceCitations(fragment).length > 0);
}

function lessonTexts(lesson: GeneratedLessonContent): Array<{ artifact_kind: "lesson" | "question"; text: string }> {
  const texts: Array<{ artifact_kind: "lesson" | "question"; text: string }> = [];

  if (lesson.body_markdown) {
    texts.push({ artifact_kind: "lesson", text: lesson.body_markdown });
  }

  if (lesson.acknowledgment_text) {
    texts.push({ artifact_kind: "lesson", text: lesson.acknowledgment_text });
  }

  for (const question of lesson.quiz_questions ?? []) {
    texts.push({ artifact_kind: "question", text: question.question });
    for (const option of question.options) {
      texts.push({ artifact_kind: "question", text: option });
    }
  }

  return texts;
}

export function extractCitedClaims(generatedModule: GeneratedModulePreview): {
  claims: CitedClaim[];
  unsupportedClaims: UnsupportedClaimReport[];
} {
  const claims: CitedClaim[] = [];
  const unsupportedClaims: UnsupportedClaimReport[] = [];

  for (const lesson of generatedModule.lessons) {
    for (const { artifact_kind, text } of lessonTexts(lesson)) {
      for (const fragment of splitClaimFragments(text)) {
        const section_ids = citationIds(fragment);
        const claim = stripSourceCitations(fragment);

        if (section_ids.length === 0) {
          unsupportedClaims.push({
            lesson_index: lesson.lesson_index,
            module_index: lesson.module_index,
            lesson_title: lesson.title,
            artifact_kind,
            claim,
            reason: "missing_citation",
          });
          continue;
        }

        claims.push({
          lesson_index: lesson.lesson_index,
          module_index: lesson.module_index,
          lesson_title: lesson.title,
          artifact_kind,
          claim,
          section_ids,
        });
      }
    }
  }

  return { claims, unsupportedClaims };
}

function sortedByAuthority(sections: ResolvedSourceSection[]): ResolvedSourceSection[] {
  return [...sections].sort((a, b) => AUTHORITY_RANK[b.authority] - AUTHORITY_RANK[a.authority]);
}

function hasExplicitConflict(sections: ResolvedSourceSection[]): boolean {
  const ids = new Set(sections.map((section) => section.id));

  return sections.some((section) => section.conflicts_with?.some((conflictId) => ids.has(conflictId)));
}

function sameTopAuthorityConflict(sections: ResolvedSourceSection[]): ResolvedSourceSection[] {
  const ranked = sortedByAuthority(sections);
  const top = ranked[0];

  if (!top) {
    return [];
  }

  const topSections = ranked.filter((section) => section.authority === top.authority);

  if (topSections.length < 2 || !hasExplicitConflict(topSections)) {
    return [];
  }

  return topSections;
}

export function computeBindingPlan(params: {
  moduleId: string;
  generatedModule: GeneratedModulePreview;
  sourceSections: ResolvedSourceSection[];
}): BindingPlan {
  const { claims, unsupportedClaims } = extractCitedClaims(params.generatedModule);
  const sourceById = new Map(params.sourceSections.flatMap((section) => [
    [section.id, section] as const,
    ...(section.citation_id ? [[section.citation_id, section] as const] : []),
  ]));
  const bindings = new Map<string, ClaimBinding & { flagged_for_review: boolean; flag_reason: string | null }>();
  const flaggedConflicts: ConflictReport[] = [];
  const placeholderSectionIds: string[] = [];

  for (const claim of claims) {
    const resolved = claim.section_ids
      .map((id) => sourceById.get(id))
      .filter((section): section is ResolvedSourceSection => Boolean(section));
    const missing = claim.section_ids.filter((id) => !sourceById.has(id));

    for (const _missingId of missing) {
      unsupportedClaims.push({
        lesson_index: claim.lesson_index,
        module_index: claim.module_index,
        lesson_title: claim.lesson_title,
        artifact_kind: claim.artifact_kind,
        claim: claim.claim,
        reason: "unresolved_source_section",
      });
    }

    for (const section of resolved) {
      if (section.has_placeholders) {
        placeholderSectionIds.push(section.id);
      }
    }

    if (resolved.length === 0) {
      continue;
    }

    const conflictSections = sameTopAuthorityConflict(resolved);
    const writableSections = conflictSections.length > 0
      ? conflictSections
      : sortedByAuthority(resolved).filter((section, _index, ranked) => section.authority === ranked[0]?.authority);

    if (conflictSections.length > 0) {
      const authority = conflictSections[0]?.authority ?? "context";
      flaggedConflicts.push({
        lesson_index: claim.lesson_index,
        module_index: claim.module_index,
        lesson_title: claim.lesson_title,
        claim: claim.claim,
        section_ids: conflictSections.map((section) => section.id),
        authority,
        reason: "equal_authority_conflict",
      });
    }

    for (const section of writableSections) {
      const key = `${params.moduleId}:${section.source_file_id}:${section.id}`;
      bindings.set(key, {
        module_id: params.moduleId,
        source_file_id: section.source_file_id,
        source_file_version_id: section.source_file_version_id,
        source_section_id: section.id,
        binding_kind: "section",
        flagged_for_review: conflictSections.some((conflictSection) => conflictSection.id === section.id),
        flag_reason: conflictSections.some((conflictSection) => conflictSection.id === section.id)
          ? "equal_authority_conflict"
          : null,
      });
    }
  }

  return {
    bindings: [...bindings.values()],
    claims,
    unsupportedClaims,
    flaggedConflicts,
    placeholderSectionIds: unique(placeholderSectionIds),
  };
}

function recordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null) : [];
}

function stringValue(row: Record<string, unknown>, key: string): string | undefined {
  return typeof row[key] === "string" ? row[key] as string : undefined;
}

function authorityValue(value: unknown): SourceAuthority {
  return value === "authoritative" || value === "supporting" || value === "context" ? value : "context";
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

async function resolveSourceSections(
  supabase: RedexSupabaseClient,
  citedSectionIds: string[],
  suppliedSections: SourceSection[],
): Promise<ResolvedSourceSection[]> {
  const suppliedById = new Map(suppliedSections.map((section) => [section.id, section]));
  const sections = new Map<string, SourceSection>();

  for (const id of citedSectionIds) {
    const supplied = suppliedById.get(id);

    if (supplied) {
      sections.set(id, supplied);
    }
  }

  const missingSectionIds = citedSectionIds.filter((id) => {
    const section = sections.get(id);
    return !section?.source_file_version_id;
  });
  const missingUuidIds = unique(missingSectionIds.filter(isUuid));
  const missingSlugs = unique(missingSectionIds.filter((id) => !isUuid(id)));
  const loadRows = async (column: "id" | "slug", values: string[]) => {
    if (values.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("source_sections")
      .select("id,slug,source_file_version_id,heading,body,has_placeholders")
      .in(column, values);

    if (error) {
      throw new Error(`Failed to resolve source sections: ${error.message}`);
    }

    return recordArray(data);
  };

  for (const row of [...await loadRows("id", missingUuidIds), ...await loadRows("slug", missingSlugs)]) {
    const id = stringValue(row, "id");
    const slug = stringValue(row, "slug");
    const source_file_version_id = stringValue(row, "source_file_version_id");
    const citationKey = slug && suppliedById.has(slug) ? slug : id;

    if (!id || !citationKey || !source_file_version_id) {
      continue;
    }

    const supplied = suppliedById.get(citationKey);
    sections.set(citationKey, {
      ...supplied,
      id,
      citation_id: citationKey,
      source_file_version_id,
      heading: stringValue(row, "heading") ?? supplied?.heading ?? "",
      body: stringValue(row, "body") ?? supplied?.body ?? "",
      has_placeholders: typeof row.has_placeholders === "boolean" ? row.has_placeholders : supplied?.has_placeholders,
    });
  }

  const versionIds = unique([...sections.values()]
    .filter((section) => !section.source_file_id)
    .map((section) => section.source_file_version_id)
    .filter((id): id is string => Boolean(id)));
  const versionToFile = new Map<string, string>();

  if (versionIds.length > 0) {
    const { data, error } = await supabase
      .from("source_file_versions")
      .select("id,source_file_id")
      .in("id", versionIds);

    if (error) {
      throw new Error(`Failed to resolve source file versions: ${error.message}`);
    }

    for (const row of recordArray(data)) {
      const id = stringValue(row, "id");
      const sourceFileId = stringValue(row, "source_file_id");

      if (id && sourceFileId) {
        versionToFile.set(id, sourceFileId);
      }
    }
  }

  const suppliedFileIds = [...sections.values()].map((section) => section.source_file_id).filter((id): id is string => Boolean(id));
  const fileIds = unique([...suppliedFileIds, ...versionToFile.values()]);
  const fileIdsMissingAuthority = fileIds.filter((fileId) => [...sections.values()].some((section) => (section.source_file_id ?? (section.source_file_version_id ? versionToFile.get(section.source_file_version_id) : undefined)) === fileId && !section.authority));
  const fileAuthority = new Map<string, SourceAuthority>();

  if (fileIdsMissingAuthority.length > 0) {
    const { data, error } = await supabase
      .from("source_files")
      .select("id,authority")
      .in("id", fileIdsMissingAuthority);

    if (error) {
      throw new Error(`Failed to resolve source files: ${error.message}`);
    }

    for (const row of recordArray(data)) {
      const id = stringValue(row, "id");

      if (id) {
        fileAuthority.set(id, authorityValue(row.authority));
      }
    }
  }

  return [...sections.values()].flatMap((section) => {
    const source_file_version_id = section.source_file_version_id;
    const source_file_id = section.source_file_id ?? (source_file_version_id ? versionToFile.get(source_file_version_id) : undefined);

    if (!source_file_version_id || !source_file_id) {
      return [];
    }

    return [{
      ...section,
      source_file_id,
      source_file_version_id,
      authority: section.authority ?? fileAuthority.get(source_file_id) ?? "context",
    }];
  });
}

export async function writeSourceBindings(params: {
  supabase: RedexSupabaseClient;
  moduleId: string;
  generatedModule: GeneratedModulePreview;
  sourceSections: SourceSection[];
}): Promise<SourceBindingWriteResult> {
  const { claims } = extractCitedClaims(params.generatedModule);
  const citedSectionIds = unique(claims.flatMap((claim) => claim.section_ids));
  const sourceSections = await resolveSourceSections(params.supabase, citedSectionIds, params.sourceSections);
  const plan = computeBindingPlan({
    moduleId: params.moduleId,
    generatedModule: params.generatedModule,
    sourceSections,
  });

  if (plan.bindings.length > 0) {
    const { error } = await params.supabase
      .from("module_source_bindings")
      .upsert(
        plan.bindings.map((binding) => ({
          module_id: binding.module_id,
          source_file_id: binding.source_file_id,
          source_file_version_id: binding.source_file_version_id,
          source_section_id: binding.source_section_id,
          binding_kind: binding.binding_kind,
          flagged_for_review: binding.flagged_for_review,
          flag_reason: binding.flag_reason,
        })),
        { onConflict: "module_id,source_file_id,source_section_id" },
      );

    if (error) {
      throw new Error(`Failed to write source bindings: ${error.message}`);
    }
  }

  return {
    writtenCount: plan.bindings.length,
    flaggedConflicts: plan.flaggedConflicts,
    unsupportedClaims: plan.unsupportedClaims,
    placeholderSectionIds: plan.placeholderSectionIds,
    claims: plan.claims,
    resolvedSourceSections: sourceSections,
  };
}
