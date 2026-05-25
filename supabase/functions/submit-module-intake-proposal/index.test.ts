import {
  driveJobDedupeKey,
  EdgeFunctionError,
  submitModuleIntakeProposal,
  validateSubmitModuleIntakeProposalRequest,
  type DbResult,
  type QueryBuilderLike,
  type SupabaseLike,
} from "./core.ts";

const maybeVitestDescribe = (globalThis as unknown as {
  describe?: { skip?: (name: string, fn: () => void) => void };
}).describe;

if (maybeVitestDescribe?.skip) {
  maybeVitestDescribe.skip("Deno-only submit module intake proposal tests", () => {});
}

if (typeof Deno !== "undefined") {

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}

function assertEdgeError(fn: () => void, code: string): void {
  try {
    fn();
  } catch (error) {
    assert(error instanceof EdgeFunctionError, "expected EdgeFunctionError");
    assertEquals(error.code, code, "error code");
    return;
  }

  throw new Error(`expected ${code} to be thrown`);
}

function validPacket(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    suggested_module_slug: "cat-6-training",
    suggested_module_title: "Cat 6 Training",
    summary: "Brainstormed starter packet for review.",
    library_topic_slug: "cat-6-training",
    module_folder_slug: "operations-cat-6-training",
    estimated_cost_cents: 18,
    documents: [
      {
        filename: "redexacademy_cat_6_reference_brief_v1.md",
        title: "Reference Brief",
        authority: "context",
        authority_provenance: "brainstormed",
        status: "draft_for_review",
        body_markdown: "---\nauthority: context\nauthority_provenance: brainstormed\n---\n# Reference\nDraft only.",
      },
      {
        filename: "redexacademy_cat_6_build_plan_v1.md",
        title: "Build Plan",
        authority: "context",
        authority_provenance: "brainstormed",
        status: "draft_for_review",
        body_markdown: "---\nauthority: context\nauthority_provenance: brainstormed\n---\n# Build Plan\nDraft only.",
      },
      {
        filename: "redexacademy_cat_6_review_checklist_v1.md",
        title: "Review Checklist",
        authority: "context",
        authority_provenance: "brainstormed",
        status: "draft_for_review",
        body_markdown: "---\nauthority: context\nauthority_provenance: brainstormed\n---\n# Review Checklist\nDraft only.",
      },
    ],
    manifest_markdown: "---\nauthority: context\nauthority_provenance: brainstormed\n---\n# Manifest",
    unresolved_questions: [],
    sme_review_checklist: ["SME must review before promotion."],
    module_basics: { title: "Cat 6 Training" },
    setup_answers: { source_control: "strict" },
    ...overrides,
  };
}

function validRequest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    client_idempotency_key: "topic:cat-6-training:v1",
    library_topic: "Cat 6 Training",
    audience_hint: "field_team",
    packet: validPacket(),
    ...overrides,
  };
}

interface MockTables {
  module_intake_proposals: Array<Record<string, unknown>>;
  drive_sync_jobs: Array<Record<string, unknown>>;
  intake_events: Array<Record<string, unknown>>;
  injectJobConflictOnInsert?: boolean;
}

type MockTableName = "module_intake_proposals" | "drive_sync_jobs" | "intake_events";

class MockQuery implements QueryBuilderLike {
  private operation: "select" | "insert" | "upsert" | "update" = "select";
  private payload: unknown;
  private filters: Array<{ column: string; value: unknown }> = [];

  constructor(private tables: MockTables, private table: MockTableName) {}

  select(_columns?: string): QueryBuilderLike {
    return this;
  }

  eq(column: string, value: unknown): QueryBuilderLike {
    this.filters.push({ column, value });
    return this;
  }

  in(_column: string, _values: unknown[]): QueryBuilderLike {
    return this;
  }

  order(_column: string, _options?: { ascending?: boolean }): QueryBuilderLike {
    return this;
  }

  limit(_count: number): QueryBuilderLike {
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

  private async run(): Promise<DbResult<unknown>> {
    const rows = this.tables[this.table];

    if (this.operation === "insert") {
      const row: Record<string, unknown> = { id: `${this.table}-${rows.length + 1}`, ...(this.payload as Record<string, unknown>) };
      if (this.table === "module_intake_proposals") {
        const folderConflict = rows.find((existing) =>
          existing.library_topic_slug === row.library_topic_slug &&
          existing.module_folder_slug === row.module_folder_slug &&
          existing.client_idempotency_key !== row.client_idempotency_key
        );
        if (folderConflict) {
          return { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint module_intake_proposals_library_module_folder_uidx" } };
        }
      }
      if (this.table === "drive_sync_jobs" && this.tables.injectJobConflictOnInsert) {
        this.tables.injectJobConflictOnInsert = false;
        rows.push(row);
        return { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" } };
      }
      rows.push(row);
      return { data: [row], error: null };
    }

    if (this.operation === "upsert") {
      const incoming = this.payload as Record<string, unknown>;
      const conflictColumn = this.table === "module_intake_proposals" ? "client_idempotency_key" : "dedupe_key";
      const existing = rows.find((row) => row[conflictColumn] === incoming[conflictColumn]);
      if (existing) {
        Object.assign(existing, incoming);
        return { data: [existing], error: null };
      }

      const row = { id: `${this.table}-${rows.length + 1}`, ...incoming };
      rows.push(row);
      return { data: [row], error: null };
    }

    if (this.operation === "update") {
      const updated = rows.filter((row) => this.matches(row));
      for (const row of updated) Object.assign(row, this.payload as Record<string, unknown>);
      return { data: updated, error: null };
    }

    return { data: rows.filter((row) => this.matches(row)), error: null };
  }
}

function createSupabaseMock(tables: MockTables): SupabaseLike {
  return {
    from(table: string): QueryBuilderLike {
      return new MockQuery(tables, table as MockTableName);
    },
  };
}

Deno.test("submit-module-intake-proposal validates safe brainstormed packet shape", () => {
  const parsed = validateSubmitModuleIntakeProposalRequest(validRequest());
  assertEquals(parsed.packet.suggested_module_slug, "cat-6-training", "module slug should parse");

  assertEdgeError(
    () => validateSubmitModuleIntakeProposalRequest(validRequest({ packet: validPacket({ suggested_module_slug: "../cat6" }) })),
    "unsafe_slug",
  );
  const unsafeFilenameDocuments = validPacket().documents as Array<Record<string, unknown>>;
  unsafeFilenameDocuments[0] = { ...unsafeFilenameDocuments[0], filename: "../evil.md" };
  assertEdgeError(
    () => validateSubmitModuleIntakeProposalRequest(validRequest({
      packet: validPacket({ documents: unsafeFilenameDocuments }),
    })),
    "unsafe_filename",
  );

  const unsafeAuthorityDocuments = validPacket().documents as Array<Record<string, unknown>>;
  unsafeAuthorityDocuments[0] = { ...unsafeAuthorityDocuments[0], authority: "authoritative" };
  assertEdgeError(
    () => validateSubmitModuleIntakeProposalRequest(validRequest({
      packet: validPacket({ documents: unsafeAuthorityDocuments }),
    })),
    "unsafe_authority",
  );
});

Deno.test("submit-module-intake-proposal upserts proposal and enqueues one deterministic job", async () => {
  const tables: MockTables = { module_intake_proposals: [], drive_sync_jobs: [], intake_events: [] };
  const supabase = createSupabaseMock(tables);
  const result = await submitModuleIntakeProposal(supabase, "user-1", validRequest());

  assertEquals(result.proposal_status, "queued", "proposal should be queued");
  assertEquals(result.job_status, "queued", "job should be queued");
  assertEquals(result.dedupe_key, driveJobDedupeKey("topic:cat-6-training:v1"), "dedupe key should be deterministic");
  assertEquals(tables.module_intake_proposals.length, 1, "one proposal row");
  assertEquals(tables.drive_sync_jobs.length, 1, "one job row");
  assertEquals(tables.intake_events.length, 1, "one intake event");
  assertEquals(tables.drive_sync_jobs[0].job_type as string, "packet_upload_register", "job type");

  const duplicate = await submitModuleIntakeProposal(supabase, "user-1", validRequest());
  assert(duplicate.reused_job, "duplicate submit should reuse existing job");
  assertEquals(tables.drive_sync_jobs.length, 1, "duplicate submit must not enqueue another job");

  try {
    await submitModuleIntakeProposal(supabase, "user-1", validRequest({
      packet: validPacket({ summary: "Changed packet under same idempotency key." }),
    }));
    throw new Error("expected idempotency conflict");
  } catch (error) {
    assert(error instanceof EdgeFunctionError, "expected EdgeFunctionError");
    assertEquals(error.code, "idempotency_conflict", "conflict code");
  }
});

Deno.test("submit-module-intake-proposal rereads and reuses a concurrent unique-conflict job", async () => {
  const tables: MockTables = {
    module_intake_proposals: [],
    drive_sync_jobs: [],
    intake_events: [],
    injectJobConflictOnInsert: true,
  };
  const supabase = createSupabaseMock(tables);

  const result = await submitModuleIntakeProposal(supabase, "user-1", validRequest());

  assert(result.reused_job, "unique-conflict reread should reuse the concurrently inserted job");
  assertEquals(tables.module_intake_proposals.length, 1, "proposal should not be duplicated");
  assertEquals(tables.drive_sync_jobs.length, 1, "job should not be duplicated after conflict reread");
  assertEquals(tables.intake_events.length, 1, "resubmitted event should be appended");
});

Deno.test("submit-module-intake-proposal returns a deterministic 409 for proposal folder conflicts", async () => {
  const existingPacket = validPacket();
  const tables: MockTables = {
    module_intake_proposals: [{
      id: "proposal-existing",
      status: "queued",
      client_idempotency_key: "topic:other-key:v1",
      library_topic_slug: "cat-6-training",
      module_folder_slug: "operations-cat-6-training",
      packet_payload: existingPacket,
    }],
    drive_sync_jobs: [],
    intake_events: [],
  };
  const supabase = createSupabaseMock(tables);

  try {
    await submitModuleIntakeProposal(supabase, "user-1", validRequest());
    throw new Error("expected proposal_folder_conflict");
  } catch (error) {
    assert(error instanceof EdgeFunctionError, "expected EdgeFunctionError");
    assertEquals(error.code, "proposal_folder_conflict", "error code");
    assertEquals(error.status, 409, "status");
  }

  assertEquals(tables.drive_sync_jobs.length, 0, "folder conflict must not enqueue a job");
});

Deno.test("submit-module-intake-proposal rejects orphaned idempotency jobs without mutating proposals", async () => {
  const dedupeKey = driveJobDedupeKey("topic:cat-6-training:v1");
  const tables: MockTables = {
    module_intake_proposals: [],
    drive_sync_jobs: [{ id: "job-1", status: "queued", dedupe_key: dedupeKey, target_payload: {} }],
    intake_events: [],
  };
  const supabase = createSupabaseMock(tables);

  try {
    await submitModuleIntakeProposal(supabase, "user-1", validRequest());
    throw new Error("expected proposal_not_found");
  } catch (error) {
    assert(error instanceof EdgeFunctionError, "expected EdgeFunctionError");
    assertEquals(error.code, "proposal_not_found", "error code");
  }

  assertEquals(tables.module_intake_proposals.length, 0, "orphaned job should not create a replacement proposal");
});
}
