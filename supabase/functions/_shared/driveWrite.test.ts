import { createGoogleDriveWriteAdapter, DriveWriteError, FOLDER_MIME_TYPE } from "./driveWrite.ts";

const maybeVitestDescribe = (globalThis as unknown as {
  describe?: { skip?: (name: string, fn: () => void) => void };
}).describe;

if (maybeVitestDescribe?.skip) {
  maybeVitestDescribe.skip("Deno-only Drive write tests", () => {});
}

if (typeof Deno !== "undefined") {
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

Deno.test("driveWrite.ensureFolder rejects same-name folders without expected Redex metadata", async () => {
  const seenQueries: string[] = [];
  const fetchImpl = ((input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());

    if (init?.method === "POST") {
      throw new Error("ensureFolder should not create when a same-name metadata conflict exists");
    }

    const query = url.searchParams.get("q") ?? "";
    seenQueries.push(query);
    const includesExpectedMetadata = query.includes("appProperties has");

    return Promise.resolve(jsonResponse({
      files: includesExpectedMetadata
        ? []
        : [{
          id: "folder-existing",
          name: "module-folder",
          mimeType: FOLDER_MIME_TYPE,
          parents: ["root-folder"],
          appProperties: {},
        }],
    }));
  }) as typeof fetch;

  const drive = await createGoogleDriveWriteAdapter("access-token", fetchImpl);

  try {
    await drive.ensureFolder({
      parentId: "root-folder",
      name: "module-folder",
      appProperties: { redexProposalId: "proposal-1", redexFolderKind: "module_packet" },
    });
    throw new Error("expected drive_folder_conflict");
  } catch (error) {
    assert(error instanceof DriveWriteError, "expected DriveWriteError");
    assertEquals(error.code, "drive_folder_conflict", "error code");
    assertEquals(error.status, 409, "status");
  }

  assert(seenQueries.length >= 2, "expected metadata query and same-name fallback query");
});

Deno.test("driveWrite.ensureFolder reuses same-name folders when no metadata constraint is requested", async () => {
  let postCount = 0;
  const fetchImpl = ((input: string | URL | Request, init?: RequestInit) => {
    if (init?.method === "POST") {
      postCount += 1;
    }

    return Promise.resolve(jsonResponse({
      files: [{
        id: "folder-existing",
        name: "library-topic",
        mimeType: FOLDER_MIME_TYPE,
        parents: ["root-folder"],
      }],
    }));
  }) as typeof fetch;

  const drive = await createGoogleDriveWriteAdapter("access-token", fetchImpl);
  const folder = await drive.ensureFolder({ parentId: "root-folder", name: "library-topic" });

  assertEquals(folder.id, "folder-existing", "existing folder id");
  assert(folder.reused, "folder should be marked reused");
  assertEquals(postCount, 0, "no folder should be created");
});
}
