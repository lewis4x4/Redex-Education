import type { DriveFileRef, DriveWriteAdapter } from "../_shared/driveWrite.ts";
import {
  EdgeFunctionError as SubmitEdgeFunctionError,
  packetPayloadHash,
  validateSubmitModuleIntakeProposalRequest,
  type BrainstormedPacketInput,
} from "../submit-module-intake-proposal/core.ts";

export class EdgeFunctionError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public stage = "worker",
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
  rpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<DbResult<T>>;
}

export interface DriveSyncJobRow {
  id: string;
  module_intake_proposal_id: string | null;
  job_type: string;
  status: string;
  dedupe_key: string;
  target_payload?: unknown;
  checkpoint_payload?: unknown;
  result_payload?: unknown;
  attempt_count: number;
  max_attempts: number;
}

export interface ModuleIntakeProposalRow {
  id: string;
  proposed_module_slug: string;
  proposed_module_title: string;
  library_topic: string;
  library_topic_slug: string;
  module_folder_slug: string;
  packet_payload: Record<string, unknown>;
  proposed_entries: unknown[];
  manifest_snapshot: Record<string, unknown> | null;
  created_by: string | null;
}

interface ExistingFolderRow {
  folder_kind: "library_topic" | "module_packet";
  drive_folder_id: string;
  parent_drive_folder_id: string | null;
  folder_name: string;
  manifest_drive_file_id: string | null;
}

interface PacketDocument {
  filename: string;
  title: string;
  body_markdown: string;
}

interface PacketFileUpload {
  filename: string;
  title: string;
  content: string;
  mimeType: "text/markdown" | "text/plain" | "application/json";
  sourceKind: "document" | "manifest" | "packet_json";
}

interface ValidatedJobPacket {
  packet: BrainstormedPacketInput;
  libraryTopic: string;
  packetHash: string;
}

export interface ProcessDriveSyncJobResult {
  status: "idle" | "succeeded" | "failed" | "retry_scheduled";
  job_id?: string;
  proposal_id?: string;
  files_registered?: number;
  error_code?: string;
  error_message?: string;
}

function errorCode(error: unknown): string {
  if (error instanceof EdgeFunctionError) {
    return error.code;
  }

  const message = error instanceof Error ? error.message : String(error);
  if (message.startsWith("drive_api_error")) return "drive_api_error";
  if (message.startsWith("missing_env")) return "missing_env";

  return "worker_failed";
}

function errorStage(error: unknown): string {
  return error instanceof EdgeFunctionError ? error.stage : "worker";
}

function errorStatus(error: unknown): number {
  return error instanceof EdgeFunctionError ? error.status : 500;
}

async function execute<T>(query: unknown, code: string): Promise<T | null> {
  const { data, error } = await (query as PromiseLike<DbResult<T>>);

  if (error) {
    throw new EdgeFunctionError(code, error.message, 500, "database");
  }

  return data;
}

async function single<T>(query: Promise<DbResult<T>>, code: string, fallback: string): Promise<T> {
  const { data, error } = await query;

  if (error || !data) {
    throw new EdgeFunctionError(code, error?.message ?? fallback, 500, "database");
  }

  return data;
}

async function updateById(
  supabase: SupabaseLike,
  table: string,
  id: string,
  values: Record<string, unknown>,
): Promise<void> {
  await execute<{ id: string }>(
    supabase.from(table).update(values).eq("id", id).select("id").maybeSingle<{ id: string }>(),
    "db_write_failed",
  );
}

async function appendEvent(
  supabase: SupabaseLike,
  input: {
    proposalId: string | null;
    jobId: string | null;
    eventKind: string;
    driveId?: string;
    ok?: boolean;
    errorCode?: string;
    errorMessage?: string;
    sizeBytes?: number;
    sha256?: string;
    actorId?: string | null;
    payload?: Record<string, unknown>;
  },
): Promise<void> {
  await execute<{ id: string }>(
    supabase.from("intake_events")
      .insert({
        module_intake_proposal_id: input.proposalId,
        drive_sync_job_id: input.jobId,
        event_kind: input.eventKind,
        drive_id: input.driveId,
        ok: input.ok ?? true,
        error_class: input.ok === false ? "drive_sync_worker" : undefined,
        error_code: input.errorCode,
        error_message: input.errorMessage,
        size_bytes: input.sizeBytes,
        sha256: input.sha256,
        actor: "drive_sync_worker",
        actor_id: input.actorId,
        payload: input.payload ?? {},
      })
      .select("id")
      .maybeSingle<{ id: string }>(),
    "db_write_failed",
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new EdgeFunctionError("invalid_job_payload", `${field} is required in drive_sync_jobs.target_payload.`, 400, "validation");
  }

  return value;
}

async function validatedPacketFromJob(job: DriveSyncJobRow): Promise<ValidatedJobPacket> {
  if (!isRecord(job.target_payload)) {
    throw new EdgeFunctionError("invalid_job_payload", "drive_sync_jobs.target_payload must be an object.", 400, "validation");
  }

  const targetPayload = job.target_payload;
  const clientIdempotencyKey = stringField(targetPayload.client_idempotency_key, "client_idempotency_key");
  const packetHash = stringField(targetPayload.packet_hash, "packet_hash");

  try {
    const parsed = validateSubmitModuleIntakeProposalRequest({
      client_idempotency_key: clientIdempotencyKey,
      library_topic: typeof targetPayload.library_topic === "string" ? targetPayload.library_topic : undefined,
      packet: targetPayload.packet,
    });
    const actualHash = await packetPayloadHash(parsed.packet);

    if (actualHash !== packetHash) {
      throw new EdgeFunctionError("packet_hash_mismatch", "Drive sync job packet hash does not match target packet payload.", 400, "validation");
    }

    return { packet: parsed.packet, libraryTopic: parsed.libraryTopic, packetHash };
  } catch (error) {
    if (error instanceof EdgeFunctionError) {
      throw error;
    }

    if (error instanceof SubmitEdgeFunctionError) {
      throw new EdgeFunctionError(error.code, error.message, error.status, "validation");
    }

    throw error;
  }
}

function proposalWithValidatedPacket(
  proposal: ModuleIntakeProposalRow,
  validated: ValidatedJobPacket,
): ModuleIntakeProposalRow {
  return {
    ...proposal,
    proposed_module_slug: validated.packet.suggested_module_slug,
    proposed_module_title: validated.packet.suggested_module_title,
    library_topic: validated.libraryTopic,
    library_topic_slug: validated.packet.library_topic_slug,
    module_folder_slug: validated.packet.module_folder_slug,
    packet_payload: validated.packet as unknown as Record<string, unknown>,
    proposed_entries: validated.packet.documents,
    manifest_snapshot: {
      filename: "redex_packet_manifest.md",
      mime_type: "text/markdown",
      body_markdown: validated.packet.manifest_markdown,
      authority: "context",
      authority_provenance: "brainstormed",
      packet_hash: validated.packetHash,
    },
  };
}

function asPacketDocument(value: unknown, index: number): PacketDocument {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new EdgeFunctionError("invalid_packet_payload", `documents[${index}] must be an object.`, 400, "validation");
  }

  const record = value as Record<string, unknown>;
  if (typeof record.filename !== "string" || typeof record.title !== "string" || typeof record.body_markdown !== "string") {
    throw new EdgeFunctionError("invalid_packet_payload", `documents[${index}] is missing filename/title/body_markdown.`, 400, "validation");
  }

  if (record.authority !== "context" || record.authority_provenance !== "brainstormed") {
    throw new EdgeFunctionError("unsafe_authority", `documents[${index}] must remain brainstormed context.`, 400, "validation");
  }

  return {
    filename: record.filename,
    title: record.title,
    body_markdown: record.body_markdown,
  };
}

function packetFilesFromProposal(proposal: ModuleIntakeProposalRow): PacketFileUpload[] {
  const documentsValue = proposal.packet_payload.documents;
  const documents = Array.isArray(documentsValue) ? documentsValue.map(asPacketDocument) : [];
  const manifestMarkdown = typeof proposal.packet_payload.manifest_markdown === "string"
    ? proposal.packet_payload.manifest_markdown
    : proposal.manifest_snapshot && typeof proposal.manifest_snapshot.body_markdown === "string"
    ? proposal.manifest_snapshot.body_markdown
    : null;

  if (documents.length === 0 || !manifestMarkdown) {
    throw new EdgeFunctionError("invalid_packet_payload", "Packet payload must include documents and manifest_markdown.", 400, "validation");
  }

  return [
    ...documents.map((document) => ({
      filename: document.filename,
      title: document.title,
      content: document.body_markdown,
      mimeType: "text/markdown" as const,
      sourceKind: "document" as const,
    })),
    {
      filename: "redex_packet_manifest.md",
      title: `${proposal.proposed_module_title} Packet Manifest`,
      content: manifestMarkdown,
      mimeType: "text/markdown" as const,
      sourceKind: "manifest" as const,
    },
    {
      filename: "redex_packet_snapshot.json",
      title: `${proposal.proposed_module_title} Packet Snapshot`,
      content: JSON.stringify({
        proposal_id: proposal.id,
        proposed_module_slug: proposal.proposed_module_slug,
        proposed_module_title: proposal.proposed_module_title,
        library_topic_slug: proposal.library_topic_slug,
        module_folder_slug: proposal.module_folder_slug,
        packet: proposal.packet_payload,
      }, null, 2),
      mimeType: "application/json" as const,
      sourceKind: "packet_json" as const,
    },
  ];
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));

  return bytesToHex(digest);
}

async function loadProposal(supabase: SupabaseLike, proposalId: string): Promise<ModuleIntakeProposalRow> {
  return single<ModuleIntakeProposalRow>(
    supabase.from("module_intake_proposals")
      .select("id,proposed_module_slug,proposed_module_title,library_topic,library_topic_slug,module_folder_slug,packet_payload,proposed_entries,manifest_snapshot,created_by")
      .eq("id", proposalId)
      .single<ModuleIntakeProposalRow>(),
    "db_read_failed",
    "Module intake proposal was not found.",
  );
}

async function loadExistingFolders(
  supabase: SupabaseLike,
  proposalId: string,
): Promise<Map<string, ExistingFolderRow>> {
  const rows = await execute<ExistingFolderRow[]>(
    supabase.from("module_drive_folders")
      .select("folder_kind,drive_folder_id,parent_drive_folder_id,folder_name,manifest_drive_file_id")
      .eq("module_intake_proposal_id", proposalId),
    "db_read_failed",
  );

  return new Map((rows ?? []).map((row) => [row.folder_kind, row]));
}

async function upsertFolderRecord(
  supabase: SupabaseLike,
  proposal: ModuleIntakeProposalRow,
  folderKind: "library_topic" | "module_packet",
  folder: DriveFileRef,
  parentDriveFolderId: string | null,
  folderSlug: string,
  manifestDriveFileId?: string | null,
): Promise<void> {
  await execute<{ id: string }>(
    supabase.from("module_drive_folders")
      .upsert({
        module_intake_proposal_id: proposal.id,
        folder_kind: folderKind,
        drive_folder_id: folder.id,
        parent_drive_folder_id: parentDriveFolderId,
        folder_name: folder.name,
        folder_slug: folderSlug,
        manifest_drive_file_id: manifestDriveFileId ?? null,
        last_seen_at: new Date().toISOString(),
        created_by: proposal.created_by,
      }, { onConflict: "module_intake_proposal_id,folder_kind" })
      .select("id")
      .maybeSingle<{ id: string }>(),
    "db_write_failed",
  );
}

async function ensureFolders(
  supabase: SupabaseLike,
  drive: DriveWriteAdapter,
  rootFolderId: string,
  proposal: ModuleIntakeProposalRow,
): Promise<{ libraryFolder: DriveFileRef; moduleFolder: DriveFileRef }> {
  const existingFolders = await loadExistingFolders(supabase, proposal.id);
  const existingLibrary = existingFolders.get("library_topic");
  const libraryFolder = existingLibrary
    ? {
      id: existingLibrary.drive_folder_id,
      name: existingLibrary.folder_name,
      mimeType: "application/vnd.google-apps.folder",
      reused: true,
    }
    : await drive.ensureFolder({
      parentId: rootFolderId,
      name: proposal.library_topic_slug,
      description: `Redex Library topic: ${proposal.library_topic}`,
    });

  await upsertFolderRecord(
    supabase,
    proposal,
    "library_topic",
    libraryFolder,
    rootFolderId,
    proposal.library_topic_slug,
  );
  await appendEvent(supabase, {
    proposalId: proposal.id,
    jobId: null,
    eventKind: "library_topic_folder_ready",
    driveId: libraryFolder.id,
    actorId: proposal.created_by,
    payload: { reused: libraryFolder.reused, folder_name: libraryFolder.name },
  });

  const existingModule = existingFolders.get("module_packet");
  const moduleFolder = existingModule
    ? {
      id: existingModule.drive_folder_id,
      name: existingModule.folder_name,
      mimeType: "application/vnd.google-apps.folder",
      reused: true,
    }
    : await drive.ensureFolder({
      parentId: libraryFolder.id,
      name: proposal.module_folder_slug,
      description: `Redex brainstormed module packet: ${proposal.proposed_module_title}`,
      appProperties: {
        redexProposalId: proposal.id,
        redexFolderKind: "module_packet",
      },
    });

  await upsertFolderRecord(
    supabase,
    proposal,
    "module_packet",
    moduleFolder,
    libraryFolder.id,
    proposal.module_folder_slug,
  );
  await appendEvent(supabase, {
    proposalId: proposal.id,
    jobId: null,
    eventKind: "module_packet_folder_ready",
    driveId: moduleFolder.id,
    actorId: proposal.created_by,
    payload: { reused: moduleFolder.reused, folder_name: moduleFolder.name },
  });

  return { libraryFolder, moduleFolder };
}

async function registerSourceFiles(
  supabase: SupabaseLike,
  proposal: ModuleIntakeProposalRow,
  libraryFolder: DriveFileRef,
  moduleFolder: DriveFileRef,
  uploadedFiles: Array<PacketFileUpload & { driveFile: DriveFileRef; sha256: string; sizeBytes: number }>,
): Promise<number> {
  const now = new Date().toISOString();
  const rows = uploadedFiles.map((file) => ({
    drive_file_id: file.driveFile.id,
    drive_path: `_library/${libraryFolder.name}/${moduleFolder.name}/${file.filename}`,
    title: file.title,
    mime_type: file.mimeType,
    authority: "context",
    authority_provenance: "brainstormed",
    authority_source: "default",
    topic: proposal.library_topic,
    last_synced_at: now,
    processing_status: "pending",
  }));
  const upserted = await execute<Array<{ id: string; drive_file_id: string }>>(
    supabase.from("source_files")
      .upsert(rows, { onConflict: "drive_file_id" })
      .select("id,drive_file_id"),
    "db_write_failed",
  );

  for (const file of uploadedFiles) {
    await appendEvent(supabase, {
      proposalId: proposal.id,
      jobId: null,
      eventKind: "source_file_registered",
      driveId: file.driveFile.id,
      actorId: proposal.created_by,
      sizeBytes: file.sizeBytes,
      sha256: file.sha256,
      payload: {
        filename: file.filename,
        title: file.title,
        source_kind: file.sourceKind,
        authority: "context",
        authority_provenance: "brainstormed",
        reused_drive_file: file.driveFile.reused,
      },
    });
  }

  return upserted?.length ?? rows.length;
}

async function processPacketUploadRegisterJob(
  supabase: SupabaseLike,
  drive: DriveWriteAdapter,
  rootFolderId: string,
  job: DriveSyncJobRow,
): Promise<ProcessDriveSyncJobResult> {
  if (!job.module_intake_proposal_id) {
    throw new EdgeFunctionError("invalid_job", "Drive sync job is missing module_intake_proposal_id.", 400, "validation");
  }

  const storedProposal = await loadProposal(supabase, job.module_intake_proposal_id);
  const proposal = proposalWithValidatedPacket(storedProposal, await validatedPacketFromJob(job));
  await updateById(supabase, "module_intake_proposals", proposal.id, { status: "uploading_to_drive" });
  await appendEvent(supabase, {
    proposalId: proposal.id,
    jobId: job.id,
    eventKind: "drive_job_started",
    actorId: proposal.created_by,
    payload: { dedupe_key: job.dedupe_key, attempt_count: job.attempt_count },
  });

  const { libraryFolder, moduleFolder } = await ensureFolders(supabase, drive, rootFolderId, proposal);
  const packetFiles = packetFilesFromProposal(proposal);
  const uploadedFiles: Array<PacketFileUpload & { driveFile: DriveFileRef; sha256: string; sizeBytes: number }> = [];

  for (const packetFile of packetFiles) {
    const sizeBytes = new TextEncoder().encode(packetFile.content).byteLength;
    const sha256 = await sha256Hex(packetFile.content);
    const driveFile = await drive.ensureTextFile({
      parentId: moduleFolder.id,
      name: packetFile.filename,
      mimeType: packetFile.mimeType,
      content: packetFile.content,
      description: `Redex ${packetFile.sourceKind} for proposal ${proposal.id}`,
      appProperties: {
        redexProposalId: proposal.id,
        redexDedupeKey: `${proposal.id}:${packetFile.filename}:${sha256}`,
        redexSourceKind: packetFile.sourceKind,
      },
    });
    uploadedFiles.push({ ...packetFile, driveFile, sha256, sizeBytes });
    await appendEvent(supabase, {
      proposalId: proposal.id,
      jobId: job.id,
      eventKind: "packet_file_ready",
      driveId: driveFile.id,
      actorId: proposal.created_by,
      sizeBytes,
      sha256,
      payload: { filename: packetFile.filename, source_kind: packetFile.sourceKind, reused: driveFile.reused },
    });
  }

  const manifestDriveFileId = uploadedFiles.find((file) => file.sourceKind === "manifest")?.driveFile.id ?? null;
  await upsertFolderRecord(
    supabase,
    proposal,
    "module_packet",
    moduleFolder,
    libraryFolder.id,
    proposal.module_folder_slug,
    manifestDriveFileId,
  );

  await updateById(supabase, "module_intake_proposals", proposal.id, { status: "registering" });
  const filesRegistered = await registerSourceFiles(supabase, proposal, libraryFolder, moduleFolder, uploadedFiles);
  const resultPayload = {
    library_drive_folder_id: libraryFolder.id,
    module_drive_folder_id: moduleFolder.id,
    manifest_drive_file_id: manifestDriveFileId,
    files: uploadedFiles.map((file) => ({
      filename: file.filename,
      drive_file_id: file.driveFile.id,
      mime_type: file.mimeType,
      source_kind: file.sourceKind,
      sha256: file.sha256,
      reused: file.driveFile.reused,
    })),
  };

  await updateById(supabase, "module_intake_proposals", proposal.id, {
    status: "registered",
    drive_folder_id: moduleFolder.id,
    library_drive_folder_id: libraryFolder.id,
    module_drive_folder_id: moduleFolder.id,
    manifest_drive_file_id: manifestDriveFileId,
    last_error_code: null,
    last_error_message: null,
    completed_at: new Date().toISOString(),
  });
  await updateById(supabase, "drive_sync_jobs", job.id, {
    status: "succeeded",
    drive_folder_id: moduleFolder.id,
    library_drive_folder_id: libraryFolder.id,
    module_drive_folder_id: moduleFolder.id,
    result_payload: resultPayload,
    lease_token: null,
    locked_at: null,
    lease_expires_at: null,
    last_error_code: null,
    last_error_message: null,
    last_error_stage: null,
    completed_at: new Date().toISOString(),
  });
  await appendEvent(supabase, {
    proposalId: proposal.id,
    jobId: job.id,
    eventKind: "drive_job_succeeded",
    driveId: moduleFolder.id,
    actorId: proposal.created_by,
    payload: resultPayload,
  });

  return {
    status: "succeeded",
    job_id: job.id,
    proposal_id: proposal.id,
    files_registered: filesRegistered,
  };
}

async function markJobFailure(
  supabase: SupabaseLike,
  job: DriveSyncJobRow,
  error: unknown,
): Promise<ProcessDriveSyncJobResult> {
  const code = errorCode(error);
  const message = error instanceof Error ? error.message : String(error);
  const stage = errorStage(error);
  const terminal = job.attempt_count >= job.max_attempts || errorStatus(error) < 500;
  const nextRunAt = new Date(Date.now() + Math.max(job.attempt_count, 1) * 60_000).toISOString();

  const jobUpdate: Record<string, unknown> = {
    status: terminal ? "failed" : "queued",
    lease_token: null,
    locked_at: null,
    lease_expires_at: null,
    last_failure_class: "drive_sync_worker",
    last_error_code: code,
    last_error_message: message,
    last_error_stage: stage,
    completed_at: terminal ? new Date().toISOString() : null,
  };

  if (!terminal) {
    jobUpdate.next_run_at = nextRunAt;
  }

  await updateById(supabase, "drive_sync_jobs", job.id, jobUpdate);

  if (job.module_intake_proposal_id) {
    const proposalStatus = stage === "database" || stage === "register" ? "registration_failed" : "upload_failed";
    await updateById(supabase, "module_intake_proposals", job.module_intake_proposal_id, {
      status: proposalStatus,
      last_error_code: code,
      last_error_message: message,
    });
    await appendEvent(supabase, {
      proposalId: job.module_intake_proposal_id,
      jobId: job.id,
      eventKind: "drive_job_failed",
      ok: false,
      errorCode: code,
      errorMessage: message,
      payload: { terminal, stage, next_run_at: terminal ? null : nextRunAt },
    });
  }

  return {
    status: terminal ? "failed" : "retry_scheduled",
    job_id: job.id,
    proposal_id: job.module_intake_proposal_id ?? undefined,
    error_code: code,
    error_message: message,
  };
}

export async function processClaimedDriveSyncJob(
  supabase: SupabaseLike,
  drive: DriveWriteAdapter,
  rootFolderId: string,
  job: DriveSyncJobRow,
): Promise<ProcessDriveSyncJobResult> {
  try {
    if (job.job_type !== "packet_upload_register") {
      throw new EdgeFunctionError("unsupported_job_type", `Unsupported drive sync job_type: ${job.job_type}`, 400, "validation");
    }

    return await processPacketUploadRegisterJob(supabase, drive, rootFolderId, job);
  } catch (error) {
    return markJobFailure(supabase, job, error);
  }
}

export async function claimAndProcessNextDriveSyncJob(
  supabase: SupabaseLike,
  drive: DriveWriteAdapter,
  rootFolderId: string,
  workerId: string,
): Promise<ProcessDriveSyncJobResult> {
  const { data, error } = await supabase.rpc<DriveSyncJobRow[]>("claim_next_drive_sync_job", {
    p_worker_id: workerId,
  });

  if (error) {
    throw new EdgeFunctionError("db_read_failed", error.message, 500, "database");
  }

  const job = data?.[0];
  if (!job) {
    return { status: "idle" };
  }

  return processClaimedDriveSyncJob(supabase, drive, rootFolderId, job);
}
