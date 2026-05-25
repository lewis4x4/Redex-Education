export interface VideoTranscriptSegmentInput {
  id?: string;
  start_seconds: number;
  end_seconds: number;
  text_markdown: string;
  derived_from_section_ids: string[];
}

export interface TranscriptIngestInput {
  supabase: {
    from: (table: string) => any;
  };
  mediaAssetId: string;
  storagePath: string;
  lessonTitle: string;
  transcriptSegments: VideoTranscriptSegmentInput[];
}

export interface TranscriptIngestResult {
  media_asset_id: string;
  source_file_id: string;
  source_file_version_id: string;
  source_section_ids: string[];
}

export class TranscriptIngestError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "TranscriptIngestError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

export function validateTranscriptSegments(value: unknown): VideoTranscriptSegmentInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TranscriptIngestError("missing_transcript_segments", "Transcript ingest requires at least one transcript segment.", 400);
  }

  return value.map((segment, index): VideoTranscriptSegmentInput => {
    if (!isRecord(segment)) {
      throw new TranscriptIngestError("invalid_transcript_segment", `Transcript segment ${index} must be an object.`, 400);
    }

    const start = segment.start_seconds;
    const end = segment.end_seconds;
    const text = stringField(segment, "text_markdown");
    const rawDerived = Array.isArray(segment.derived_from_section_ids) ? segment.derived_from_section_ids : [];
    const invalidDerivedIndex = rawDerived.findIndex((sectionId) => typeof sectionId !== "string" || !isUuid(sectionId));

    if (invalidDerivedIndex >= 0) {
      throw new TranscriptIngestError(
        "invalid_transcript_provenance",
        `Transcript segment ${index} has an invalid derived_from_section_ids entry at index ${invalidDerivedIndex}.`,
        400,
      );
    }

    const derived = rawDerived as string[];

    if (typeof start !== "number" || !Number.isFinite(start) || start < 0) {
      throw new TranscriptIngestError("invalid_transcript_segment", `Transcript segment ${index} requires a non-negative start_seconds.`, 400);
    }

    if (typeof end !== "number" || !Number.isFinite(end) || end < start) {
      throw new TranscriptIngestError("invalid_transcript_segment", `Transcript segment ${index} requires end_seconds >= start_seconds.`, 400);
    }

    if (!text) {
      throw new TranscriptIngestError("invalid_transcript_segment", `Transcript segment ${index} requires text_markdown.`, 400);
    }

    if (derived.length === 0) {
      throw new TranscriptIngestError("missing_transcript_provenance", `Transcript segment ${index} requires derived_from_section_ids provenance.`, 400);
    }

    return {
      id: stringField(segment, "id"),
      start_seconds: start,
      end_seconds: end,
      text_markdown: text,
      derived_from_section_ids: derived,
    };
  });
}

function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function transcriptMarkdown(transcriptSegments: VideoTranscriptSegmentInput[]): string {
  return transcriptSegments
    .map((segment) => `## ${formatSeconds(segment.start_seconds)}–${formatSeconds(segment.end_seconds)}\n\n${segment.text_markdown}`)
    .join("\n\n");
}

function transcriptSlug(segment: VideoTranscriptSegmentInput): string {
  const start = Math.floor(segment.start_seconds).toString().padStart(6, "0");
  const end = Math.floor(segment.end_seconds).toString().padStart(6, "0");
  return `video-${start}-${end}`;
}

export async function ingestVideoTranscript(input: TranscriptIngestInput): Promise<TranscriptIngestResult> {
  const mediaAssetId = input.mediaAssetId.trim();
  const storagePath = input.storagePath.trim();
  const lessonTitle = input.lessonTitle.trim();
  const transcriptSegments = validateTranscriptSegments(input.transcriptSegments);

  if (!mediaAssetId || !isUuid(mediaAssetId)) {
    throw new TranscriptIngestError("invalid_media_asset_id", "mediaAssetId must be a UUID.", 400);
  }

  if (!storagePath) {
    throw new TranscriptIngestError("missing_storage_path", "storagePath is required for transcript ingest.", 400);
  }

  if (!lessonTitle) {
    throw new TranscriptIngestError("missing_lesson_title", "lessonTitle is required for transcript ingest.", 400);
  }

  const { data: mediaAsset, error: mediaAssetError } = await input.supabase
    .from("media_assets")
    .select("id")
    .eq("id", mediaAssetId)
    .maybeSingle();

  if (mediaAssetError) {
    throw new TranscriptIngestError("media_asset_read_failed", mediaAssetError.message, 500);
  }

  if (!mediaAsset) {
    throw new TranscriptIngestError("media_asset_not_found", "Media asset was not found before transcript ingest.", 500);
  }

  const rawText = transcriptMarkdown(transcriptSegments);
  const sourceDriveFileId = `synthetic:video-transcript:${mediaAssetId}`;
  const { data: sourceFile, error: sourceFileError } = await input.supabase
    .from("source_files")
    .upsert({
      drive_file_id: sourceDriveFileId,
      title: `${lessonTitle} video transcript`,
      mime_type: "text/markdown",
      authority: "supporting",
      authority_source: "default",
      processing_status: "processed",
      source_kind: "synthetic_video_transcript",
      media_asset_id: mediaAssetId,
      drive_path: storagePath,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: "drive_file_id" })
    .select("id")
    .single();

  if (sourceFileError || !sourceFile) {
    throw new TranscriptIngestError("transcript_source_file_write_failed", sourceFileError?.message ?? "Could not write transcript source file.", 500);
  }

  const sourceFileId = (sourceFile as { id: string }).id;
  const { data: sourceVersion, error: sourceVersionError } = await input.supabase
    .from("source_file_versions")
    .upsert({
      source_file_id: sourceFileId,
      head_revision_id: `media:${mediaAssetId}:v1`,
      raw_text: rawText,
      raw_text_preview: rawText.slice(0, 500),
      parse_status: "processed",
      size_bytes: new TextEncoder().encode(rawText).length,
    }, { onConflict: "source_file_id,head_revision_id" })
    .select("id")
    .single();

  if (sourceVersionError || !sourceVersion) {
    throw new TranscriptIngestError("transcript_source_version_write_failed", sourceVersionError?.message ?? "Could not write transcript source version.", 500);
  }

  const sourceVersionId = (sourceVersion as { id: string }).id;
  const { error: deleteSectionsError } = await input.supabase
    .from("source_sections")
    .delete()
    .eq("source_file_version_id", sourceVersionId);

  if (deleteSectionsError) {
    throw new TranscriptIngestError("transcript_sections_prune_failed", deleteSectionsError.message, 500);
  }

  const sectionRows = transcriptSegments.map((segment, index) => ({
    source_file_version_id: sourceVersionId,
    level: 2,
    heading: `${formatSeconds(segment.start_seconds)}–${formatSeconds(segment.end_seconds)}`,
    body: segment.text_markdown,
    position_index: index,
    slug: transcriptSlug(segment),
    start_seconds: Math.round(segment.start_seconds),
    end_seconds: Math.round(segment.end_seconds),
    derived_from_section_ids: segment.derived_from_section_ids,
    has_placeholders: false,
  }));
  const { data: sourceSections, error: sectionsError } = await input.supabase
    .from("source_sections")
    .insert(sectionRows)
    .select("id");

  if (sectionsError) {
    throw new TranscriptIngestError("transcript_sections_write_failed", sectionsError.message, 500);
  }

  const { error: updateSourceFileError } = await input.supabase
    .from("source_files")
    .update({ current_version_id: sourceVersionId })
    .eq("id", sourceFileId);

  if (updateSourceFileError) {
    throw new TranscriptIngestError("transcript_source_file_update_failed", updateSourceFileError.message, 500);
  }

  const { error: updateMediaAssetError } = await input.supabase
    .from("media_assets")
    .update({ transcript_source_file_id: sourceFileId })
    .eq("id", mediaAssetId);

  if (updateMediaAssetError) {
    throw new TranscriptIngestError("media_asset_write_failed", updateMediaAssetError.message, 500);
  }

  return {
    media_asset_id: mediaAssetId,
    source_file_id: sourceFileId,
    source_file_version_id: sourceVersionId,
    source_section_ids: Array.isArray(sourceSections)
      ? sourceSections.map((section) => isRecord(section) ? section.id : null).filter((id): id is string => typeof id === "string")
      : [],
  };
}
