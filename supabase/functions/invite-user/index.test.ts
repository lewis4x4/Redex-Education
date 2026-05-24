function assertEquals<T>(actual: T, expected: T) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Assertion failed.\nActual: ${JSON.stringify(actual)}\nExpected: ${JSON.stringify(expected)}`);
  }
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const maybeVitestDescribe = (globalThis as unknown as {
  describe?: { skip?: (name: string, fn: () => void) => void };
}).describe;

if (maybeVitestDescribe?.skip) {
  maybeVitestDescribe.skip("Deno-only invite-user function tests", () => {});
}

if (typeof Deno !== "undefined") {
  const { createInviteUserHandler } = await import("./handler.ts");

  Deno.test("invite-user calls auth.admin.inviteUserByEmail and upserts profile", async () => {
    const invitedEmails: string[] = [];
    const upsertRows: unknown[] = [];

    const handler = createInviteUserHandler({
      getEnv: (name) => {
        if (name === "REDEX_ALLOWED_ORIGINS") return "*";
        if (name === "SUPABASE_URL") return "https://example.supabase.co";
        if (name === "SUPABASE_SERVICE_ROLE_KEY") return "service-role";
        return undefined;
      },
      createSupabaseClient: () => ({
        auth: {
          getUser: async () => ({ data: { user: { id: "admin-user-id" } }, error: null }),
          admin: {
            inviteUserByEmail: async (email: string) => {
              invitedEmails.push(email);
              return { data: { user: { id: "new-user-id" } }, error: null };
            },
          },
        },
        from: (table: string) => {
          if (table !== "profiles") {
            throw new Error(`Unexpected table: ${table}`);
          }

          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: { id: "admin-user-id", org_id: "org-redex", role: "admin" }, error: null }),
              }),
            }),
            upsert: (values: Record<string, unknown>) => {
              upsertRows.push(values);
              return {
                select: () => ({
                  single: async () => ({ data: { id: "new-user-id" }, error: null }),
                }),
              };
            },
          };
        },
      }),
    });

    const response = await handler(
      new Request("https://example.supabase.co/functions/v1/invite-user", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer token",
          origin: "https://redex.education",
        },
        body: JSON.stringify({
          email: "new.person@redex.example",
          display_name: "New Person",
          role: "learner",
          department: "Operations",
          manager_id: "manager-id",
          start_date: "2026-06-01",
        }),
      }),
    );

    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(invitedEmails, ["new.person@redex.example"]);
    assert(upsertRows.length === 1, "Expected one profile upsert row");
    assertEquals((upsertRows[0] as Record<string, unknown>).id, "new-user-id");
    assertEquals(body, { ok: true, user_id: "new-user-id", profile_id: "new-user-id" });
  });
}
