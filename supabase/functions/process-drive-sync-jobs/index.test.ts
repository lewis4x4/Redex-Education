import type { DriveFileRef, DriveWriteAdapter, EnsureFolderInput, EnsureTextFileInput } from "../_shared/driveWrite.ts";
import { packetPayloadHash, validateSubmitModuleIntakeProposalRequest, type BrainstormedPacketInput } from "../submit-module-intake-proposal/core.ts";
import {
  processClaimedDriveSyncJob,
  type DbResult,
  type DriveSyncJobRow,
  type QueryBuilderLike,
  type SupabaseLike,
} from "./core.ts";

const maybeVitestDescribe = (globalThis as unknown as {
  describe?: { skip?: (name: string, fn: () => void) => void };
}).describe;

if (maybeVitestDescribe?.skip) {
  maybeVitestDescribe.skip("Deno-only process drive sync jobs tests", () => {});
}

if (typeof Deno !== "undefined") {

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}

interface Tables {
  module_intake_proposals: Array<Record<string, unknown>>;
  module_drive_folders: Array<Record<string, unknown>>;
  drive_sync_jobs: Array<Record<string, unknown>>;
  source_files: Array<Record<string, unknown>>;
  intake_events: Array<Record<string, unknown>>;
}

class MockQuery implements QueryBuilderLike {
  private operation: "select" | "insert" | "upsert" | "update" = "select";
  private payload: unknown;
  private filters: Array<{ column: string; value: unknown }> = [];

  constructor(private tables: Tables, private table: keyof Tables) {}

  select(_columns?: string): QueryBuilderLike { return this; }
  in(_column: string, _values: unknown[]): QueryBuilderLike { return this; }
  order(_column: string, _options?: { ascending?: boolean }): QueryBuilderLike { return this; }
  limit(_count: number): QueryBuilderLike { return this; }

  eq(column: string, value: unknown): QueryBuilderLike {
    this.filters.push({ column, value });
    return this;
  }

  insert(values: unknown): QueryBuilderLike {
    this.operation = "insert";
    this.payload = values;
    return this;
  }

  upsert(values: unknown, _options?: { onConflict?: string }): QueryBuilderLike {
    this.operation = "upsert";
    this.payload = values;
    return this;
  }

  update(values: unknown): QueryBuilderLike {
    this.operation = "update";
    this.payload = values;
    return this;
  }

  async single<T = unknown>(): Promise<DbResult<T>> {
    const result = await this.run();
    const rows = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
    return { data: (rows[0] ?? null) as T | null, error: result.error };
  }

  async maybeSingle<T = unknown>(): Promise<DbResult<T>> {
    return this.single<T>();
  }

  then<TResult1 = DbResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }

  private matches(row: Record<string, unknown>): boolean {
    return this.filters.every((filter) => row[filter.column] === filter.value);
  }

  private conflictKey(row: Record<string, unknown>): string {
    if (this.table === "module_drive_folders") {
      return `${row.module_intake_proposal_id}:${row.folder_kind}`;
    }
    if (this.table === "source_files") {
      return String(row.drive_file_id);
    }
    if (this.table === "drive_sync_jobs") {
      return String(row.dedupe_key ?? row.id);
    }
    return String(row.id ?? crypto.randomUUID());
  }

  private async run(): Promise<DbResult<unknown>> {
    const rows = this.tables[this.table];

    if (this.operation === "insert") {
      const values = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted = values.map((value) => ({ id: `${this.table}-${rows.length + 1}`, ...(value as Record<string, unknown>) }));
      rows.push(...inserted);
      return { data: inserted, error: null };
    }

    if (this.operation === "upsert") {
      const values = Array.isArray(this.payload) ? this.payload : [this.payload];
      const upserted: Array<Record<string, unknown>> = [];
      for (const value of values) {
        const incoming = value as Record<string, unknown>;
        const key = this.conflictKey(incoming);
        const existing = rows.find((row) => this.conflictKey(row) === key);
        if (existing) {
          Object.assign(existing, incoming);
          upserted.push(existing);
        } else {
          const row = { id: `${this.table}-${rows.length + 1}`, ...incoming };
          rows.push(row);
          upserted.push(row);
        }
      }
      return { data: upserted, error: null };
    }

    if (this.operation === "update") {
      const updated = rows.filter((row) => this.matches(row));
      for (const row of updated) Object.assign(row, this.payload as Record<string, unknown>);
      return { data: updated, error: null };
    }

    return { data: rows.filter((row) => this.matches(row)), error: null };
  }
}

class MockSupabase implements SupabaseLike {
  constructor(public tables: Tables) {}

  from(table: string): QueryBuilderLike {
    return new MockQuery(this.tables, table as keyof Tables);
  }

  async rpc<T = unknown>(_fn: string, _args: Record<string, unknown>): Promise<DbResult<T>> {
    return { data: [] as T, error: null };
  }
}

class FakeDrive implements DriveWriteAdapter {
  folders: DriveFileRef[] = [];
  files: DriveFileRef[] = [];
  failUploads = false;

  async ensureFolder(input: EnsureFolderInput): Promise<DriveFileRef> {
    const existing = this.folders.find((folder) => folder.parents?.[0] === input.parentId && folder.name === input.name);
    if (existing) return { ...existing, reused: true };

    const folder: DriveFileRef = {
      id: `folder-${this.folders.length + 1}`,
      name: input.name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [input.parentId],
      reused: false,
    };
    this.folders.push(folder);
    return folder;
  }

  async ensureTextFile(input: EnsureTextFileInput): Promise<DriveFileRef> {
    if (this.failUploads) {
      throw new Error("drive_api_error: upload failed");
    }

    const existing = this.files.find((file) => file.parents?.[0] === input.parentId && file.name === input.name);
    if (existing) return { ...existing, reused: true };

    const file: DriveFileRef = {
      id: `file-${this.files.length + 1}`,
      name: input.name,
      mimeType: input.mimeType,
      parents: [input.parentId],
      reused: false,
    };
    this.files.push(file);
    return file;
  }
}

function packet(): Record<string, unknown> {
  return {
    suggested_module_slug: "cat-6-training",
    suggested_module_title: "Cat 6 Training",
    summary: "Draft packet.",
    library_topic_slug: "cat-6-training",
    module_folder_slug: "operations-cat-6-training",
    documents: [
      {
        filename: "redexacademy_cat_6_reference_brief_v1.md",
        title: "Reference Brief",
        authority: "context",
        authority_provenance: "brainstormed",
        status: "draft_for_review",
        body_markdown: "---\nauthority: context\nauthority_provenance: brainstormed\n---\n# Reference",
      },
      {
        filename: "redexacademy_cat_6_build_plan_v1.md",
        title: "Build Plan",
        authority: "context",
        authority_provenance: "brainstormed",
        status: "draft_for_review",
        body_markdown: "---\nauthority: context\nauthority_provenance: brainstormed\n---\n# Build Plan",
      },
      {
        filename: "redexacademy_cat_6_review_checklist_v1.md",
        title: "Review Checklist",
        authority: "context",
        authority_provenance: "brainstormed",
        status: "draft_for_review",
        body_markdown: "---\nauthority: context\nauthority_provenance: brainstormed\n---\n# Review Checklist",
      },
    ],
    manifest_markdown: "---\nauthority: context\nauthority_provenance: brainstormed\n---\n# Manifest",
    sme_review_checklist: ["Review before promotion."],
  };
}

async function tables(): Promise<Tables> {
  const packetPayload = packet();

  return {
    module_intake_proposals: [
      {
        id: "proposal-1",
        proposed_module_slug: "cat-6-training",
        proposed_module_title: "Cat 6 Training",
        library_topic: "Cat 6 Training",
        library_topic_slug: "cat-6-training",
        module_folder_slug: "operations-cat-6-training",
        packet_payload: packet(),
        proposed_entries: (packet().documents as unknown[]),
        manifest_snapshot: { body_markdown: (packet().manifest_markdown as string) },
        created_by: "user-1",
        status: "queued",
      },
    ],
    module_drive_folders: [],
    drive_sync_jobs: [await job(packetPayload) as unknown as Record<string, unknown>],
    source_files: [],
    intake_events: [],
  };
}

async function job(packetPayload: Record<string, unknown> = packet(), overrides: Partial<DriveSyncJobRow> = {}): Promise<DriveSyncJobRow> {
  const parsedPacket = validateSubmitModuleIntakeProposalRequest({
    client_idempotency_key: "topic:cat-6-training:v1",
    library_topic: "Cat 6 Training",
    packet: packetPayload,
  }).packet;
  const packetHash = await packetPayloadHash(parsedPacket as unknown as BrainstormedPacketInput);
  return {
    id: "job-1",
    module_intake_proposal_id: "proposal-1",
    job_type: "packet_upload_register",
    status: "running",
    dedupe_key: "module-intake:topic:cat-6-training:v1:packet_upload_register",
    attempt_count: 1,
    max_attempts: 3,
    target_payload: {
      client_idempotency_key: "topic:cat-6-training:v1",
      packet_hash: packetHash,
      packet: parsedPacket,
      library_topic: "Cat 6 Training",
    },
    ...overrides,
  };
}

Deno.test("process-drive-sync-jobs creates folders/files and registers brainstormed context sources", async () => {
  const db = new MockSupabase(await tables());
  const drive = new FakeDrive();
  const result = await processClaimedDriveSyncJob(db, drive, "root-folder", await job());

  assertEquals(result.status, "succeeded", "job should succeed");
  assertEquals(db.tables.module_drive_folders.length, 2, "library and module folders registered");
  assertEquals(drive.files.length, 5, "documents, manifest, and packet JSON uploaded");
  assertEquals(db.tables.source_files.length, 5, "source files registered");
  assertEquals(db.tables.source_files[0].authority as string, "context", "source authority");
  assertEquals(db.tables.source_files[0].authority_provenance as string, "brainstormed", "source provenance");
  assertEquals(db.tables.module_intake_proposals[0].status as string, "registered", "proposal status");
  assertEquals(db.tables.drive_sync_jobs[0].status as string, "succeeded", "job status");
});

Deno.test("process-drive-sync-jobs retries idempotently without duplicate Drive or source rows", async () => {
  const db = new MockSupabase(await tables());
  const drive = new FakeDrive();

  await processClaimedDriveSyncJob(db, drive, "root-folder", await job());
  await processClaimedDriveSyncJob(db, drive, "root-folder", await job(packet(), { attempt_count: 2 }));

  assertEquals(db.tables.module_drive_folders.length, 2, "folder rows should be upserted");
  assertEquals(drive.folders.length, 2, "Drive folders should not duplicate");
  assertEquals(drive.files.length, 5, "Drive files should not duplicate");
  assertEquals(db.tables.source_files.length, 5, "source rows should not duplicate");
});

Deno.test("process-drive-sync-jobs marks terminal upload failures", async () => {
  const db = new MockSupabase(await tables());
  const drive = new FakeDrive();
  drive.failUploads = true;

  const result = await processClaimedDriveSyncJob(db, drive, "root-folder", await job(packet(), { max_attempts: 1 }));

  assertEquals(result.status, "failed", "failure should be terminal at max attempts");
  assertEquals(db.tables.drive_sync_jobs[0].status as string, "failed", "job status should fail");
  assertEquals(db.tables.module_intake_proposals[0].status as string, "upload_failed", "proposal status should fail upload");
  assert(db.tables.intake_events.some((event) => event.event_kind === "drive_job_failed" && event.ok === false), "failure event should be appended");
});

Deno.test("process-drive-sync-jobs does not invoke generation", async () => {
  const source = await Deno.readTextFile(new URL("./core.ts", import.meta.url));
  assert(!source.includes("submit-generation-job"), "worker core must not invoke generation");
});
}
