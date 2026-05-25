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
  async function readSourceOrSkip(path: string): Promise<string | null> {
    const url = new URL(path, import.meta.url);
    const permission = await Deno.permissions.query({ name: "read", path: url });
    return permission.state === "granted" ? await Deno.readTextFile(url) : null;
  }

  Deno.test("submit-generation-job remains the service-role enqueue path", async () => {
    const source = await readSourceOrSkip("./index.ts");
    const migration = await readSourceOrSkip("../../migrations/20260524190000_phase3_4_backend_hardening.sql");
    if (!source || !migration) return;

    assert(source.includes('createClient(supabaseUrl, serviceRoleKey'), "edge function should use service role for enqueue");
    assert(source.includes('.from("profiles")') && source.includes('["admin", "foundry_author"].includes(profile.role)'), "caller role should be checked from profiles");
    assert(source.includes('status: "queued"'), "edge function should only enqueue queued jobs");
    assert(migration.includes("revoke insert, update, delete on redex.generation_jobs from authenticated"), "authenticated clients must not directly mutate generation_jobs");
    assert(migration.includes("drop policy if exists generation_jobs_insert"), "authenticated insert policy should be dropped");
  });
}
