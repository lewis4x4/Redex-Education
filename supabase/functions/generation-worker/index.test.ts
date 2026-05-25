function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
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
}
