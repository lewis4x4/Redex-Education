function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals<T>(actual: T, expected: T) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Assertion failed.\nActual: ${JSON.stringify(actual)}\nExpected: ${JSON.stringify(expected)}`);
  }
}

const maybeVitestDescribe = (globalThis as unknown as {
  describe?: { skip?: (name: string, fn: () => void) => void };
}).describe;

if (maybeVitestDescribe?.skip) {
  maybeVitestDescribe.skip("Deno-only transcript-ingest function tests", () => {});
}

if (typeof Deno !== "undefined") {
  const { createTranscriptIngestHandler } = await import("./handler.ts");

  const mediaAssetId = "11111111-1111-4111-8111-111111111111";
  const derivedSectionId = "22222222-2222-4222-8222-222222222222";
  const env = (values: Record<string, string>) => (name: string) => values[name];
  const request = (body: Record<string, unknown>, token = "service-role") =>
    new Request("https://example.supabase.co/functions/v1/transcript-ingest", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const validBody = () => ({
    mediaAssetId,
    storagePath: "heygen/module/media.mp4",
    lessonTitle: "Safety Basics",
    transcript_segments: [{
      start_seconds: 0,
      end_seconds: 15,
      text_markdown: "Welcome to safety basics.",
      derived_from_section_ids: [derivedSectionId],
    }],
  });

  function createFakeSupabase(calls: { upserts: Array<{ table: string; row: Record<string, unknown> }>; inserts: Array<{ table: string; rows: unknown[] }>; updates: Array<{ table: string; row: Record<string, unknown> }> }) {
    return {
      from: (table: string) => {
        if (table === "media_assets") {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: { id: mediaAssetId }, error: null }) }),
            }),
            update: (row: Record<string, unknown>) => {
              calls.updates.push({ table, row });
              return { eq: async () => ({ error: null }) };
            },
          };
        }

        if (table === "source_files") {
          return {
            upsert: (row: Record<string, unknown>) => {
              calls.upserts.push({ table, row });
              return { select: () => ({ single: async () => ({ data: { id: "source-file-id" }, error: null }) }) };
            },
            update: (row: Record<string, unknown>) => {
              calls.updates.push({ table, row });
              return { eq: async () => ({ error: null }) };
            },
          };
        }

        if (table === "source_file_versions") {
          return {
            upsert: (row: Record<string, unknown>) => {
              calls.upserts.push({ table, row });
              return { select: () => ({ single: async () => ({ data: { id: "source-version-id" }, error: null }) }) };
            },
          };
        }

        if (table === "source_sections") {
          return {
            delete: () => ({ eq: async () => ({ error: null }) }),
            insert: (rows: unknown[]) => {
              calls.inserts.push({ table, rows });
              return { select: async () => ({ data: [{ id: "section-id" }], error: null }) };
            },
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    };
  }

  Deno.test("transcript-ingest rejects non-service-role callers", async () => {
    const handler = createTranscriptIngestHandler({
      getEnv: env({
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        SUPABASE_URL: "https://example.supabase.co",
        REDEX_ENABLE_HEYGEN_MEDIA_STAGE: "true",
      }),
      createSupabaseClient: () => createFakeSupabase({ upserts: [], inserts: [], updates: [] }),
    });

    const response = await handler(request(validBody(), "user-token"));
    const body = await response.json();

    assertEquals(response.status, 401);
    assertEquals(body.code, "auth_failed");
  });

  Deno.test("transcript-ingest is gated by REDEX_ENABLE_HEYGEN_MEDIA_STAGE", async () => {
    const handler = createTranscriptIngestHandler({
      getEnv: env({ SUPABASE_SERVICE_ROLE_KEY: "service-role", SUPABASE_URL: "https://example.supabase.co" }),
      createSupabaseClient: () => createFakeSupabase({ upserts: [], inserts: [], updates: [] }),
    });

    const response = await handler(request(validBody()));
    const body = await response.json();

    assertEquals(response.status, 503);
    assertEquals(body.code, "media_stage_disabled");
  });

  Deno.test("transcript-ingest rejects transcript segments without provenance", async () => {
    const handler = createTranscriptIngestHandler({
      getEnv: env({
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        SUPABASE_URL: "https://example.supabase.co",
        REDEX_ENABLE_HEYGEN_MEDIA_STAGE: "true",
      }),
      createSupabaseClient: () => createFakeSupabase({ upserts: [], inserts: [], updates: [] }),
    });

    const response = await handler(request({
      ...validBody(),
      transcript_segments: [{ start_seconds: 0, end_seconds: 15, text_markdown: "Missing provenance." }],
    }));
    const body = await response.json();

    assertEquals(response.status, 400);
    assertEquals(body.code, "missing_transcript_provenance");
  });

  Deno.test("transcript-ingest rejects malformed provenance IDs instead of dropping them", async () => {
    const handler = createTranscriptIngestHandler({
      getEnv: env({
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        SUPABASE_URL: "https://example.supabase.co",
        REDEX_ENABLE_HEYGEN_MEDIA_STAGE: "true",
      }),
      createSupabaseClient: () => createFakeSupabase({ upserts: [], inserts: [], updates: [] }),
    });

    const response = await handler(request({
      ...validBody(),
      transcript_segments: [{
        start_seconds: 0,
        end_seconds: 15,
        text_markdown: "Mixed provenance.",
        derived_from_section_ids: [derivedSectionId, "not-a-uuid"],
      }],
    }));
    const body = await response.json();

    assertEquals(response.status, 400);
    assertEquals(body.code, "invalid_transcript_provenance");
  });

  Deno.test("transcript-ingest writes synthetic supporting transcript source rows", async () => {
    const calls = { upserts: [] as Array<{ table: string; row: Record<string, unknown> }>, inserts: [] as Array<{ table: string; rows: unknown[] }>, updates: [] as Array<{ table: string; row: Record<string, unknown> }> };
    const handler = createTranscriptIngestHandler({
      getEnv: env({
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        SUPABASE_URL: "https://example.supabase.co",
        REDEX_ENABLE_HEYGEN_MEDIA_STAGE: "true",
      }),
      createSupabaseClient: () => createFakeSupabase(calls),
    });

    const response = await handler(request(validBody()));
    const body = await response.json();
    const sourceFile = calls.upserts.find((call) => call.table === "source_files")?.row;
    const sectionRows = calls.inserts.find((call) => call.table === "source_sections")?.rows as Array<Record<string, unknown>> | undefined;

    assertEquals(response.status, 200);
    assertEquals(body.source_file_id, "source-file-id");
    assertEquals(sourceFile?.authority, "supporting");
    assertEquals(sourceFile?.source_kind, "synthetic_video_transcript");
    assertEquals(sourceFile?.media_asset_id, mediaAssetId);
    assertEquals(sectionRows?.[0].derived_from_section_ids, [derivedSectionId]);
    assert(calls.updates.some((call) => call.table === "media_assets" && call.row.transcript_source_file_id === "source-file-id"), "media asset should link transcript source file");
  });
}
