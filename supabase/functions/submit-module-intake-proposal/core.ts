export class EdgeFunctionError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export interface DbErrorLike {
  code?: string;
  message: string;
}

export interface DbResult<T> {
  data: T | null;
  error: DbErrorLike | null;
}

export interface QueryBuilderLike extends PromiseLike<DbResult<unknown>> {
  select(columns?: string): QueryBuilderLike;
  eq(column: string, value: unknown): QueryBuilderLike;
  in(column: string, values: unknown[]): QueryBuilderLike;
  order(column: string, options?: { ascending?: boolean }): QueryBuilderLike;
  limit(count: number): QueryBuilderLike;
  insert(values: unknown): QueryBuilderLike;
  upsert(values: unknown, options?: { onConflict?: string }): QueryBuilderLike;
  update(values: unknown): QueryBuilderLike;
  single<T = unknown>(): Promise<DbResult<T>>;
  maybeSingle<T = unknown>(): Promise<DbResult<T>>;
}

export interface SupabaseLike {
  from(table: string): QueryBuilderLike;
}

interface BrainstormedDocumentInput {
  filename: string;
  title: string;
  authority: "context";
  authority_provenance: "brainstormed";
  status: "draft_for_review";
  body_markdown: string;
  notes_for_admin?: string;
}

export interface BrainstormedPacketInput {
  suggested_module_slug: string;
  suggested_module_title: string;
  summary: string;
  library_topic_slug: string;
  module_folder_slug: string;
  estimated_cost_cents?: number;
  documents: BrainstormedDocumentInput[];
  manifest_markdown: string;
  unresolved_questions?: string[];
  sme_review_checklist: string[];
  module_basics?: Record<string, unknown>;
  setup_answers?: Record<string, unknown>;
}

export interface SubmitModuleIntakeProposalRequest {
  client_idempotency_key?: string;
  library_topic?: string;
  audience_hint?: string;
  packet?: unknown;
  proposal?: unknown;
}

export interface ParsedModuleIntakeProposalRequest {
  clientIdempotencyKey: string;
  libraryTopic: string;
  audienceHint: string | null;
  packet: BrainstormedPacketInput;
}

export interface ProposalRow {
  id: string;
  status: string;
  client_idempotency_key: string;
  packet_payload?: Record<string, unknown> | null;
}

export interface DriveSyncJobRow {
  id: string;
  status: string;
  dedupe_key: string;
  module_intake_proposal_id?: string | null;
  target_payload?: Record<string, unknown> | null;
}

export interface SubmitModuleIntakeProposalResult {
  proposal_id: string;
  job_id: string;
  proposal_status: string;
  job_status: string;
  dedupe_key: string;
  reused_job: boolean;
}

const SAFE_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/u;
const SAFE_IDEMPOTENCY_RE = /^[A-Za-z0-9._:-]{8,160}$/u;
const SAFE_FILENAME_RE = /^[a-z0-9][a-z0-9_-]{0,119}\.md$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown, field: string, maxLength = 500): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new EdgeFunctionError("invalid_request", `${field} is required.`, 400);
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new EdgeFunctionError("invalid_request", `${field} is too long.`, 400);
  }

  return trimmed;
}

function safeSlug(value: unknown, field: string): string {
  const slug = nonEmptyString(value, field, 80);

  if (!SAFE_SLUG_RE.test(slug)) {
    throw new EdgeFunctionError(
      "unsafe_slug",
      `${field} must be a lowercase URL-safe slug without path separators.`,
      400,
    );
  }

  return slug;
}

function safeFilename(value: unknown, field: string): string {
  const filename = nonEmptyString(value, field, 120);

  if (!SAFE_FILENAME_RE.test(filename) || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    throw new EdgeFunctionError(
      "unsafe_filename",
      `${field} must be a safe lowercase .md filename.`,
      400,
    );
  }

  return filename;
}

function rejectAuthoritativeMarkers(markdown: string, field: string): void {
  const unsafeAuthority = /^\s*authority\s*:\s*(authoritative|supporting)\s*$/imu.test(markdown);
  const unsafeProvenance = /^\s*authority_provenance\s*:\s*(human_authored|imported)\s*$/imu.test(markdown);

  if (unsafeAuthority || unsafeProvenance) {
    throw new EdgeFunctionError(
      "unsafe_authority",
      `${field} must remain authority=context and authority_provenance=brainstormed.`,
      400,
    );
  }
}

function parseDocument(value: unknown, index: number): BrainstormedDocumentInput {
  if (!isRecord(value)) {
    throw new EdgeFunctionError("invalid_request", `documents[${index}] must be an object.`, 400);
  }

  if (value.authority !== "context" || value.authority_provenance !== "brainstormed") {
    throw new EdgeFunctionError(
      "unsafe_authority",
      `documents[${index}] must be brainstormed context, not authoritative content.`,
      400,
    );
  }

  if (value.status !== "draft_for_review") {
    throw new EdgeFunctionError("invalid_request", `documents[${index}].status must be draft_for_review.`, 400);
  }

  const bodyMarkdown = nonEmptyString(value.body_markdown, `documents[${index}].body_markdown`, 100_000);
  rejectAuthoritativeMarkers(bodyMarkdown, `documents[${index}].body_markdown`);

  return {
    filename: safeFilename(value.filename, `documents[${index}].filename`),
    title: nonEmptyString(value.title, `documents[${index}].title`, 250),
    authority: "context",
    authority_provenance: "brainstormed",
    status: "draft_for_review",
    body_markdown: bodyMarkdown,
    notes_for_admin: typeof value.notes_for_admin === "string" ? value.notes_for_admin.slice(0, 2_000) : undefined,
  };
}

function parsePacket(value: unknown): BrainstormedPacketInput {
  if (!isRecord(value)) {
    throw new EdgeFunctionError("invalid_request", "packet is required.", 400);
  }

  if (!Array.isArray(value.documents) || value.documents.length < 3 || value.documents.length > 6) {
    throw new EdgeFunctionError("invalid_request", "packet.documents must include 3 to 6 markdown files.", 400);
  }

  const manifestMarkdown = nonEmptyString(value.manifest_markdown, "packet.manifest_markdown", 100_000);
  rejectAuthoritativeMarkers(manifestMarkdown, "packet.manifest_markdown");

  const checklist = Array.isArray(value.sme_review_checklist)
    ? value.sme_review_checklist.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  if (checklist.length === 0) {
    throw new EdgeFunctionError("invalid_request", "packet.sme_review_checklist is required.", 400);
  }

  return {
    suggested_module_slug: safeSlug(value.suggested_module_slug, "packet.suggested_module_slug"),
    suggested_module_title: nonEmptyString(value.suggested_module_title, "packet.suggested_module_title", 250),
    summary: nonEmptyString(value.summary, "packet.summary", 10_000),
    library_topic_slug: safeSlug(value.library_topic_slug, "packet.library_topic_slug"),
    module_folder_slug: safeSlug(value.module_folder_slug, "packet.module_folder_slug"),
    estimated_cost_cents: typeof value.estimated_cost_cents === "number" ? value.estimated_cost_cents : undefined,
    documents: value.documents.map(parseDocument),
    manifest_markdown: manifestMarkdown,
    unresolved_questions: Array.isArray(value.unresolved_questions)
      ? value.unresolved_questions.filter((item): item is string => typeof item === "string")
      : [],
    sme_review_checklist: checklist,
    module_basics: isRecord(value.module_basics) ? value.module_basics : undefined,
    setup_answers: isRecord(value.setup_answers) ? value.setup_answers : undefined,
  };
}

export function validateSubmitModuleIntakeProposalRequest(
  body: SubmitModuleIntakeProposalRequest,
): ParsedModuleIntakeProposalRequest {
  if (!isRecord(body)) {
    throw new EdgeFunctionError("invalid_request", "Request body must be a JSON object.", 400);
  }

  const clientIdempotencyKey = nonEmptyString(body.client_idempotency_key, "client_idempotency_key", 160);
  if (!SAFE_IDEMPOTENCY_RE.test(clientIdempotencyKey)) {
    throw new EdgeFunctionError(
      "unsafe_idempotency_key",
      "client_idempotency_key may only contain letters, numbers, '.', '_', ':', and '-'.",
      400,
    );
  }

  const packet = parsePacket(body.packet ?? body.proposal);

  return {
    clientIdempotencyKey,
    libraryTopic: nonEmptyString(body.library_topic ?? packet.suggested_module_title, "library_topic", 250),
    audienceHint: typeof body.audience_hint === "string" && body.audience_hint.trim()
      ? body.audience_hint.trim().slice(0, 250)
      : null,
    packet,
  };
}

async function singleOrThrow<T>(query: Promise<DbResult<T>>, code: string, fallback: string): Promise<T> {
  const { data, error } = await query;

  if (error || !data) {
    throw new EdgeFunctionError(code, error?.message ?? fallback, 500);
  }

  return data;
}

async function maybeSingleOrThrow<T>(query: Promise<DbResult<T>>, code: string): Promise<T | null> {
  const { data, error } = await query;

  if (error) {
    throw new EdgeFunctionError(code, error.message, 500);
  }

  return data;
}

async function insertEvent(
  supabase: SupabaseLike,
  proposalId: string,
  jobId: string | null,
  actorId: string,
  eventKind: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  await maybeSingleOrThrow<{ id: string }>(
    supabase.from("intake_events")
      .insert({
        module_intake_proposal_id: proposalId,
        drive_sync_job_id: jobId,
        event_kind: eventKind,
        actor: "foundry_author",
        actor_id: actorId,
        payload,
      })
      .select("id")
      .maybeSingle<{ id: string }>(),
    "db_write_failed",
  );
}

export function driveJobDedupeKey(clientIdempotencyKey: string): string {
  return `module-intake:${clientIdempotencyKey}:packet_upload_register`;
}

function stableJsonStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJsonStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJsonStringify(record[key])}`).join(",")}}`;
  }

  return JSON.stringify(value);
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function packetPayloadHash(packet: BrainstormedPacketInput): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stableJsonStringify(packet)));

  return bytesToHex(digest);
}

function jobPacketHash(job: DriveSyncJobRow): string | null {
  const hash = job.target_payload?.packet_hash;

  return typeof hash === "string" ? hash : null;
}

function isUniqueViolation(error: unknown): boolean {
  if (!isRecord(error)) {
    return false;
  }

  const code = typeof error.code === "string" ? error.code : "";
  const message = typeof error.message === "string" ? error.message.toLowerCase() : "";

  return code === "23505" || message.includes("duplicate key") || message.includes("unique constraint");
}

async function insertOne<T>(query: Promise<DbResult<T>>, fallback: string): Promise<T> {
  const { data, error } = await query;

  if (error || !data) {
    if (error && isUniqueViolation(error)) {
      throw new EdgeFunctionError("unique_conflict", error.message, 409);
    }

    throw new EdgeFunctionError("db_write_failed", error?.message ?? fallback, 500);
  }

  return data;
}

async function readProposalByIdempotencyKey(
  supabase: SupabaseLike,
  clientIdempotencyKey: string,
): Promise<ProposalRow | null> {
  return maybeSingleOrThrow<ProposalRow>(
    supabase.from("module_intake_proposals")
      .select("id,status,client_idempotency_key,packet_payload")
      .eq("client_idempotency_key", clientIdempotencyKey)
      .maybeSingle<ProposalRow>(),
    "db_read_failed",
  );
}

async function readJobByDedupeKey(
  supabase: SupabaseLike,
  dedupeKey: string,
): Promise<DriveSyncJobRow | null> {
  return maybeSingleOrThrow<DriveSyncJobRow>(
    supabase.from("drive_sync_jobs")
      .select("id,status,dedupe_key,module_intake_proposal_id,target_payload")
      .eq("dedupe_key", dedupeKey)
      .maybeSingle<DriveSyncJobRow>(),
    "db_read_failed",
  );
}

async function readProposalByFolder(
  supabase: SupabaseLike,
  libraryTopicSlug: string,
  moduleFolderSlug: string,
): Promise<ProposalRow | null> {
  return maybeSingleOrThrow<ProposalRow>(
    supabase.from("module_intake_proposals")
      .select("id,status,client_idempotency_key,packet_payload")
      .eq("library_topic_slug", libraryTopicSlug)
      .eq("module_folder_slug", moduleFolderSlug)
      .maybeSingle<ProposalRow>(),
    "db_read_failed",
  );
}

async function assertExistingProposalPacketMatches(proposal: ProposalRow, packetHash: string): Promise<void> {
  if (!proposal.packet_payload) {
    return;
  }

  const existingPacket = parsePacket(proposal.packet_payload);
  const existingHash = await packetPayloadHash(existingPacket);

  if (existingHash !== packetHash) {
    throw new EdgeFunctionError(
      "idempotency_conflict",
      "client_idempotency_key was already used for a different packet payload.",
      409,
    );
  }
}

async function returnReusedJob(
  supabase: SupabaseLike,
  userId: string,
  proposal: ProposalRow,
  job: DriveSyncJobRow,
  dedupeKey: string,
): Promise<SubmitModuleIntakeProposalResult> {
  await insertEvent(supabase, proposal.id, job.id, userId, "proposal_resubmitted", {
    dedupe_key: dedupeKey,
    reused_job: true,
  });

  return {
    proposal_id: proposal.id,
    job_id: job.id,
    proposal_status: proposal.status,
    job_status: job.status,
    dedupe_key: dedupeKey,
    reused_job: true,
  };
}

export async function submitModuleIntakeProposal(
  supabase: SupabaseLike,
  userId: string,
  body: SubmitModuleIntakeProposalRequest,
): Promise<SubmitModuleIntakeProposalResult> {
  const parsed = validateSubmitModuleIntakeProposalRequest(body);
  const packetHash = await packetPayloadHash(parsed.packet);
  const dedupeKey = driveJobDedupeKey(parsed.clientIdempotencyKey);
  const existingJob = await readJobByDedupeKey(supabase, dedupeKey);

  if (existingJob) {
    const existingHash = jobPacketHash(existingJob);
    if (existingHash && existingHash !== packetHash) {
      throw new EdgeFunctionError(
        "idempotency_conflict",
        "client_idempotency_key was already used for a different packet payload.",
        409,
      );
    }

    const existingProposal = await readProposalByIdempotencyKey(supabase, parsed.clientIdempotencyKey);
    if (!existingProposal) {
      throw new EdgeFunctionError(
        "proposal_not_found",
        "A Drive sync job exists for this idempotency key, but its proposal row was not found.",
        409,
      );
    }

    await assertExistingProposalPacketMatches(existingProposal, packetHash);
    return returnReusedJob(supabase, userId, existingProposal, existingJob, dedupeKey);
  }

  const proposalPayload = {
    client_idempotency_key: parsed.clientIdempotencyKey,
    proposed_module_slug: parsed.packet.suggested_module_slug,
    proposed_module_title: parsed.packet.suggested_module_title,
    library_topic: parsed.libraryTopic,
    library_topic_slug: parsed.packet.library_topic_slug,
    module_folder_slug: parsed.packet.module_folder_slug,
    audience_hint: parsed.audienceHint,
    status: "queued",
    packet_payload: parsed.packet,
    proposed_entries: parsed.packet.documents,
    manifest_snapshot: {
      filename: "redex_packet_manifest.md",
      mime_type: "text/markdown",
      body_markdown: parsed.packet.manifest_markdown,
      authority: "context",
      authority_provenance: "brainstormed",
    },
    created_by: userId,
  };

  let proposal = await readProposalByIdempotencyKey(supabase, parsed.clientIdempotencyKey);
  if (proposal) {
    await assertExistingProposalPacketMatches(proposal, packetHash);
  } else {
    try {
      proposal = await insertOne<ProposalRow>(
        supabase.from("module_intake_proposals")
          .insert(proposalPayload)
          .select("id,status,client_idempotency_key,packet_payload")
          .single<ProposalRow>(),
        "Failed to insert module intake proposal.",
      );
    } catch (error) {
      if (!(error instanceof EdgeFunctionError) || error.code !== "unique_conflict") {
        throw error;
      }

      proposal = await readProposalByIdempotencyKey(supabase, parsed.clientIdempotencyKey);
      if (proposal) {
        await assertExistingProposalPacketMatches(proposal, packetHash);
      } else {
        const folderConflict = await readProposalByFolder(
          supabase,
          parsed.packet.library_topic_slug,
          parsed.packet.module_folder_slug,
        );

        if (folderConflict) {
          throw new EdgeFunctionError(
            "proposal_folder_conflict",
            "Another active module intake proposal already uses this library topic and module folder slug.",
            409,
          );
        }

        throw new EdgeFunctionError("unique_conflict", error.message, 409);
      }
    }
  }

  try {
    const job = await insertOne<DriveSyncJobRow>(
      supabase.from("drive_sync_jobs")
        .insert({
          module_intake_proposal_id: proposal.id,
          job_type: "packet_upload_register",
          status: "queued",
          dedupe_key: dedupeKey,
          target_payload: {
            client_idempotency_key: parsed.clientIdempotencyKey,
            proposal_id: proposal.id,
            packet_hash: packetHash,
            packet: parsed.packet,
            library_topic: parsed.libraryTopic,
          },
          submitted_by: userId,
        })
        .select("id,status,dedupe_key,module_intake_proposal_id,target_payload")
        .single<DriveSyncJobRow>(),
      "Failed to enqueue Drive sync job.",
    );

    await insertEvent(supabase, proposal.id, job.id, userId, "proposal_submitted", {
      dedupe_key: dedupeKey,
      job_type: "packet_upload_register",
    });

    return {
      proposal_id: proposal.id,
      job_id: job.id,
      proposal_status: proposal.status,
      job_status: job.status,
      dedupe_key: dedupeKey,
      reused_job: false,
    };
  } catch (error) {
    if (!(error instanceof EdgeFunctionError) || error.code !== "unique_conflict") {
      throw error;
    }

    const conflictedJob = await readJobByDedupeKey(supabase, dedupeKey);
    if (!conflictedJob) {
      throw new EdgeFunctionError("db_write_failed", "Drive sync job conflicted but could not be reread.", 500);
    }

    const existingHash = jobPacketHash(conflictedJob);
    if (existingHash && existingHash !== packetHash) {
      throw new EdgeFunctionError(
        "idempotency_conflict",
        "client_idempotency_key was already used for a different packet payload.",
        409,
      );
    }

    return returnReusedJob(supabase, userId, proposal, conflictedJob, dedupeKey);
  }
}
