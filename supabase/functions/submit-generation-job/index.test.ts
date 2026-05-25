import {
  EdgeFunctionError,
  idempotencyKeyFor,
  maxAttemptsForOperation,
  operationFrom,
  type ParsedSubmitGenerationJobRequest,
  validateSubmitInputPayload,
} from "./validation.ts";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const maybeVitestDescribe = (globalThis as unknown as {
  describe?: { skip?: (name: string, fn: () => void) => void };
}).describe;

if (maybeVitestDescribe?.skip) {
  maybeVitestDescribe.skip("Deno-only submit generation job tests", () => {});
}

if (typeof Deno !== "undefined") {
  const moduleVersionId = "11111111-1111-4111-8111-111111111111";
  const lessonId = "22222222-2222-4222-8222-222222222222";
  const sourceSectionId = "33333333-3333-4333-8333-333333333333";

  function validRenderVideoPayload(): Record<string, unknown> {
    return {
      operation: "renderVideoLesson",
      input: {
        moduleVersionId,
        lessonId,
        lessonTitle: "Workplace safety overview",
        approvedScriptMarkdown: "Welcome to this approved video lesson script.",
        avatarId: "brian",
        video: {
          duration_seconds: 30,
          chapters: [],
          checkpoints: [],
          transcript_segments: [
            {
              id: "segment-1",
              start_seconds: 0,
              end_seconds: 30,
              text_markdown: "Use the approved process for every incident.",
              derived_from_section_ids: [sourceSectionId],
            },
          ],
        },
      },
    };
  }

  function assertEdgeError(fn: () => void, code: string): void {
    try {
      fn();
    } catch (error) {
      if (!(error instanceof EdgeFunctionError)) {
        throw new Error(`expected ${code} to throw EdgeFunctionError`);
      }
      assert(error.code === code, `expected ${code}, got ${error.code}`);
      return;
    }

    throw new Error(`expected ${code} to be thrown`);
  }

  async function readSourceOrSkip(path: string): Promise<string | null> {
    const url = new URL(path, import.meta.url);
    const permission = await Deno.permissions.query({
      name: "read",
      path: url,
    });
    return permission.state === "granted" ? await Deno.readTextFile(url) : null;
  }

  Deno.test("submit-generation-job allows existing operations and explicit renderVideoLesson", () => {
    validateSubmitInputPayload({
      operation: "generateLessons",
      input: { moduleVersionId },
    });
    validateSubmitInputPayload({
      raw: "legacy full-pipeline payload without explicit operation",
    });
    validateSubmitInputPayload(validRenderVideoPayload());

    assert(
      operationFrom({ input: {} }) === "fullPipeline",
      "missing operation should preserve fullPipeline default",
    );
    assertEdgeError(
      () =>
        validateSubmitInputPayload({
          operation: "deleteEverything",
          input: {},
        }),
      "unsupported_operation",
    );
    assertEdgeError(
      () => validateSubmitInputPayload({ operation: 42, input: {} }),
      "invalid_operation",
    );
  });

  Deno.test("submit-generation-job validates renderVideoLesson payload contract", () => {
    const missingModuleVersion = validRenderVideoPayload();
    delete ((missingModuleVersion.input as Record<string, unknown>)
      .moduleVersionId);
    assertEdgeError(
      () => validateSubmitInputPayload(missingModuleVersion),
      "missing_module_version_id",
    );

    const invalidModuleVersion = validRenderVideoPayload();
    (invalidModuleVersion.input as Record<string, unknown>).moduleVersionId =
      "not-a-uuid";
    assertEdgeError(
      () => validateSubmitInputPayload(invalidModuleVersion),
      "invalid_module_version_id",
    );

    const missingTarget = validRenderVideoPayload();
    delete ((missingTarget.input as Record<string, unknown>).lessonId);
    assertEdgeError(
      () => validateSubmitInputPayload(missingTarget),
      "missing_lesson_target",
    );

    const validLessonIndexTarget = validRenderVideoPayload();
    delete ((validLessonIndexTarget.input as Record<string, unknown>).lessonId);
    (validLessonIndexTarget.input as Record<string, unknown>).lessonIndex = 0;
    validateSubmitInputPayload(validLessonIndexTarget);

    const invalidLessonIndex = validRenderVideoPayload();
    (invalidLessonIndex.input as Record<string, unknown>).lessonIndex = -1;
    assertEdgeError(
      () => validateSubmitInputPayload(invalidLessonIndex),
      "invalid_lesson_index",
    );

    const missingScript = validRenderVideoPayload();
    (missingScript.input as Record<string, unknown>).approvedScriptMarkdown =
      "   ";
    assertEdgeError(
      () => validateSubmitInputPayload(missingScript),
      "missing_approved_script",
    );
  });

  Deno.test("submit-generation-job requires transcript provenance for renderVideoLesson", () => {
    const missingSegments = validRenderVideoPayload();
    const missingSegmentsVideo =
      (missingSegments.input as Record<string, unknown>).video as Record<
        string,
        unknown
      >;
    missingSegmentsVideo.transcript_segments = [];
    assertEdgeError(
      () => validateSubmitInputPayload(missingSegments),
      "missing_transcript_segments",
    );

    const missingProvenance = validRenderVideoPayload();
    const missingProvenanceVideo =
      (missingProvenance.input as Record<string, unknown>).video as Record<
        string,
        unknown
      >;
    const [segment] = missingProvenanceVideo.transcript_segments as Array<
      Record<string, unknown>
    >;
    segment.derived_from_section_ids = [];
    assertEdgeError(
      () => validateSubmitInputPayload(missingProvenance),
      "missing_transcript_provenance",
    );

    const invalidProvenance = validRenderVideoPayload();
    const invalidProvenanceVideo =
      (invalidProvenance.input as Record<string, unknown>).video as Record<
        string,
        unknown
      >;
    const [invalidSegment] = invalidProvenanceVideo
      .transcript_segments as Array<Record<string, unknown>>;
    invalidSegment.derived_from_section_ids = ["not-a-uuid"];
    assertEdgeError(
      () => validateSubmitInputPayload(invalidProvenance),
      "invalid_transcript_provenance",
    );
  });

  Deno.test("submit-generation-job gives renderVideoLesson enough poll attempts only for media jobs", () => {
    const prior = Deno.env.get("HEYGEN_MAX_POLLS");

    try {
      Deno.env.delete("HEYGEN_MAX_POLLS");
      assert(
        maxAttemptsForOperation("renderVideoLesson") === 63,
        "renderVideoLesson should default to 60 polls plus 3 setup stages",
      );
      assert(
        maxAttemptsForOperation("generateLessons") === null,
        "non-media operations should use the DB default max_attempts",
      );

      Deno.env.set("HEYGEN_MAX_POLLS", "12");
      assert(
        maxAttemptsForOperation("renderVideoLesson") === 15,
        "configured HEYGEN_MAX_POLLS should add the 3-stage buffer",
      );

      Deno.env.set("HEYGEN_MAX_POLLS", "not-a-number");
      assert(
        maxAttemptsForOperation("renderVideoLesson") === 63,
        "invalid HEYGEN_MAX_POLLS should fall back to the safe default",
      );
    } finally {
      if (prior === undefined) {
        Deno.env.delete("HEYGEN_MAX_POLLS");
      } else {
        Deno.env.set("HEYGEN_MAX_POLLS", prior);
      }
    }
  });

  Deno.test("submit-generation-job preserves idempotency key dimensions", async () => {
    const body: ParsedSubmitGenerationJobRequest = {
      moduleId: "module-1",
      jobType: "full",
      targetSectionId: null,
      promptVersion: "v1.1",
      inputPayload: validRenderVideoPayload(),
    };

    const sameKey = await idempotencyKeyFor({
      ...body,
      inputPayload: validRenderVideoPayload(),
    });
    const originalKey = await idempotencyKeyFor(body);
    assert(
      originalKey === sameKey,
      "same body should produce the same idempotency key",
    );
    assert(
      originalKey.includes("module-1:full:full:renderVideoLesson:v1.1:"),
      "key should retain existing module/job/target/operation/version dimensions",
    );

    const changedInput = validRenderVideoPayload();
    ((changedInput.input as Record<string, unknown>).video as Record<
      string,
      unknown
    >).duration_seconds = 45;
    const changedKey = await idempotencyKeyFor({
      ...body,
      inputPayload: changedInput,
    });
    assert(
      changedKey !== originalKey,
      "input payload changes should still alter the idempotency hash",
    );
  });

  Deno.test("submit-generation-job lets renderVideoLesson use section job type without targetSectionId", async () => {
    const source = await readSourceOrSkip("./index.ts");
    if (!source) return;

    assert(
      source.includes('operation !== "renderVideoLesson"'),
      "section targetSectionId requirement should not block lesson-targeted renderVideoLesson jobs",
    );
  });

  Deno.test("submit-generation-job remains the service-role enqueue path", async () => {
    const source = await readSourceOrSkip("./index.ts");
    const migration = await readSourceOrSkip(
      "../../migrations/20260524190000_phase3_4_backend_hardening.sql",
    );
    if (!source || !migration) return;

    assert(
      source.includes("createClient(supabaseUrl, serviceRoleKey"),
      "edge function should use service role for enqueue",
    );
    assert(
      source.includes('.from("profiles")') &&
        source.includes('["admin", "foundry_author"].includes(profile.role)'),
      "caller role should be checked from profiles",
    );
    assert(
      source.includes('status: "queued"'),
      "edge function should only enqueue queued jobs",
    );
    assert(
      migration.includes(
        "revoke insert, update, delete on redex.generation_jobs from authenticated",
      ),
      "authenticated clients must not directly mutate generation_jobs",
    );
    assert(
      migration.includes("drop policy if exists generation_jobs_insert"),
      "authenticated insert policy should be dropped",
    );
  });
}
