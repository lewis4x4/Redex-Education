function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function indexOfRequired(source: string, needle: string, message: string): number {
  const index = source.indexOf(needle);
  assert(index > -1, message);
  return index;
}

const maybeVitestDescribe = (globalThis as unknown as {
  describe?: { skip?: (name: string, fn: () => void) => void };
}).describe;

if (maybeVitestDescribe?.skip) {
  maybeVitestDescribe.skip("Deno-only generation worker tests", () => {});
}

if (typeof Deno !== "undefined") {
  async function readSourceOrSkip(path: string): Promise<string | null> {
    const url = new URL(path, import.meta.url);
    const permission = await Deno.permissions.query({ name: "read", path: url });
    return permission.state === "granted" ? await Deno.readTextFile(url) : null;
  }

  Deno.test("generation worker tracks source_binding between lesson and assessment stages", async () => {
    const source = await readSourceOrSkip("./index.ts");
    if (!source) return;
    const generateLessonsIndex = source.indexOf('"generate_lessons"');
    const sourceBindingIndex = source.indexOf('"source_binding"');
    const generateAssessmentsIndex = source.indexOf('"generate_assessments"');

    assert(generateLessonsIndex > -1, "generate_lessons stage must exist");
    assert(sourceBindingIndex > generateLessonsIndex, "source_binding must follow generate_lessons");
    assert(generateAssessmentsIndex > sourceBindingIndex, "generate_assessments must follow source_binding");
    assert(source.includes('return ["generate_lessons", "source_binding", "assemble"]'), "generateLessons operation should run source_binding");
  });

  Deno.test("section regeneration bypasses source_binding and assembles generate_lessons output", async () => {
    const source = await readSourceOrSkip("./index.ts");
    if (!source) return;

    assert(
      source.includes('job.job_type === "section" || operationFor(job) === "regenerateSection"') &&
        source.includes('return ["generate_lessons", "assemble"]'),
      "section/regenerateSection jobs should run only generate_lessons then assemble",
    );
    assert(
      source.includes('case "regenerateSection":\n      return generatedModule;'),
      "regenerateSection final output should come from generate_lessons/bound generated module output",
    );
  });

  Deno.test("generation worker uses lease-token compare-and-set and conservative retry/stale recovery", async () => {
    const source = await readSourceOrSkip("./index.ts");
    if (!source) return;

    assert(source.includes('.rpc("fail_stale_generation_jobs", { p_worker_id: workerId })'), "worker should fail expired running leases before claiming new work");
    assert(source.includes('.rpc("claim_next_generation_job", { p_worker_id: workerId })'), "worker should pass worker id to claim RPC");
    assert(source.includes('.eq("lease_token", job.lease_token).eq("status", "running")'), "worker updates should compare-and-set on lease_token and running status");
    assert(source.includes('query.eq("current_stage", expectedStage)'), "stage updates should guard the expected current_stage");
    assert(source.includes('return failureClass(error) === "infrastructure"'), "only known pre-provider infrastructure failures should retry");
    assert(source.includes('status: shouldRetry ? "queued" : "failed"'), "retryable infrastructure failures should requeue instead of terminally failing");
    assert(source.includes('next_run_at: shouldRetry ? nextRetryAt(job.attempt_count)'), "retryable infrastructure failures should set next_run_at backoff");
    assert(source.includes('}, shouldRetry ? 503 : 500)'), "stage execution errors must not return HTTP 200");
  });

  Deno.test("generation worker passes module version scope to source binding writer", async () => {
    const source = await readSourceOrSkip("./index.ts");
    if (!source) return;

    assert(source.includes("moduleVersionId: moduleVersionIdFor(job)"), "source binding writes must carry moduleVersionId");
    assert(source.includes('stringField(input, "moduleVersionId")'), "worker should prefer explicit input moduleVersionId for binding scope");
    assert(source.includes('"Source binding writes require an explicit UUID moduleVersionId/module_version_id."'), "worker must fail clearly instead of falling back to module_id");
    assert(source.includes('jobLease: jobLeaseFor(job, "source_binding")'), "replacement writes should be lease-scoped");
  });

  Deno.test("renderVideoLesson is the only operation mapped to media stages", async () => {
    const source = await readSourceOrSkip("./index.ts");
    if (!source) return;

    const renderVideoCase = indexOfRequired(source, 'case "renderVideoLesson":\n      return ["media_submit", "media_poll", "transcript_ingest", "assemble"]', "renderVideoLesson should run media stages then assemble");
    const sectionFallback = indexOfRequired(source, 'if (job.job_type === "section") {\n    return ["generate_lessons", "assemble"]', "section fallback should still bypass source binding for generic section jobs");
    assert(renderVideoCase < sectionFallback, "explicit renderVideoLesson operation should take precedence over generic section job_type fallback");
    assert(source.includes('case "generateLessons":\n      return ["generate_lessons", "source_binding", "assemble"]'), "generateLessons should not run media stages");
    assert(source.includes('case "regenerateWithFixes":\n      return ["generate_lessons", "source_binding", "self_critique", "assemble"]'), "regenerateWithFixes should not run media stages");
    assert(source.includes('return [\n    "parse",\n    "outline",\n    "generate_lessons",\n    "source_binding",\n    "generate_assessments",\n    "self_critique",\n    "assemble",\n  ];'), "default/full pipeline should preserve pre-media stages only");
  });

  Deno.test("media stages are HeyGen-env gated and keep poll-pending jobs queued", async () => {
    const source = await readSourceOrSkip("./index.ts");
    if (!source) return;

    assert(source.includes('Deno.env.get("REDEX_ENABLE_HEYGEN_MEDIA_STAGE") !== "true"'), "media stages should require the explicit env flag");
    const transcriptIngestStart = indexOfRequired(source, "async function runTranscriptIngestStage", "transcript ingest stage should exist");
    const transcriptIngestGate = source.indexOf("requireHeyGenMediaStageEnabled();", transcriptIngestStart);
    assert(transcriptIngestGate > transcriptIngestStart, "transcript_ingest should also respect the media-stage kill switch");
    assert(source.includes('const heygenApiKey = requireEnvValue("HEYGEN_API_KEY")'), "HeyGen submit/poll should require HEYGEN_API_KEY");
    assert(source.includes('const mediaBucket = requireEnvValue("REDEX_MEDIA_BUCKET")'), "successful media polling should require configured storage bucket");
    assert(source.includes('stageError instanceof MediaStagePendingError'), "worker should treat in-progress provider polls as non-failures");
    assert(source.includes('status: "queued",\n          current_stage: stage'), "poll-pending jobs should be requeued at the same stage");
    assert(source.includes('status: "pending",\n          error: undefined'), "poll-pending stage_map entry should remain pending instead of failed");
  });

  Deno.test("transcript ingest writes synthetic supporting source rows with media provenance", async () => {
    const workerSource = await readSourceOrSkip("./index.ts");
    const ingestSource = await readSourceOrSkip("../_shared/videoTranscriptIngest.ts");
    if (!workerSource || !ingestSource) return;

    assert(workerSource.includes("ingestVideoTranscript({"), "worker transcript stage should delegate to the shared transcript ingest helper");
    assert(ingestSource.includes('source_kind: "synthetic_video_transcript"'), "transcript source file should be marked synthetic_video_transcript");
    assert(ingestSource.includes('authority: "supporting"'), "transcript source file should be supporting authority only");
    assert(ingestSource.includes('derived_from_section_ids: segment.derived_from_section_ids'), "transcript sections should persist source-section provenance");
    assert(ingestSource.includes('transcript_source_file_id: sourceFileId'), "media asset should link to the transcript source file");
  });
}
