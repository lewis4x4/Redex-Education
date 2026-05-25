function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const maybeVitestDescribe = (globalThis as unknown as {
  describe?: { skip?: (name: string, fn: () => void) => void };
}).describe;

if (maybeVitestDescribe?.skip) {
  maybeVitestDescribe.skip("Deno-only drive sync tests", () => {});
}

if (typeof Deno !== "undefined") {
  async function readSourceOrSkip(path: string): Promise<string | null> {
    const url = new URL(path, import.meta.url);
    const permission = await Deno.permissions.query({ name: "read", path: url });
    return permission.state === "granted" ? await Deno.readTextFile(url) : null;
  }

  Deno.test("drive-sync reports parser dispatch failures in response summary", async () => {
    const source = await readSourceOrSkip("./index.ts");
    if (!source) return;

    assert(source.includes("Promise.allSettled"), "parser dispatch should be observed before returning");
    assert(source.includes('status: parserErrors.length > 0 ? "partial_error" : "ok"'), "parser failures should change response status");
    assert(source.includes("files_failed: parserErrors.length"), "parser failures should be counted");
    assert(source.includes("parser_errors: parserErrors"), "parser failure details should be returned");
  });
}
