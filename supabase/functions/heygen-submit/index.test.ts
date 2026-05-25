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
  maybeVitestDescribe.skip("Deno-only heygen-submit function tests", () => {});
}

if (typeof Deno !== "undefined") {
  const { createHeyGenSubmitHandler } = await import("./handler.ts");

  const env = (values: Record<string, string>) => (name: string) => values[name];
  const request = (body: Record<string, unknown>, token = "service-role") =>
    new Request("https://example.supabase.co/functions/v1/heygen-submit", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  Deno.test("heygen-submit rejects non-service-role callers", async () => {
    const handler = createHeyGenSubmitHandler({
      getEnv: env({
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        REDEX_ENABLE_HEYGEN_MEDIA_STAGE: "true",
        HEYGEN_API_KEY: "heygen-key",
      }),
      fetcher: async () => new Response("{}"),
    });

    const response = await handler(request({ avatarId: "avatar", script: "script" }, "user-token"));
    const body = await response.json();

    assertEquals(response.status, 401);
    assertEquals(body.code, "auth_failed");
  });

  Deno.test("heygen-submit is gated by REDEX_ENABLE_HEYGEN_MEDIA_STAGE", async () => {
    const handler = createHeyGenSubmitHandler({
      getEnv: env({ SUPABASE_SERVICE_ROLE_KEY: "service-role", HEYGEN_API_KEY: "heygen-key" }),
      fetcher: async () => new Response("{}"),
    });

    const response = await handler(request({ avatarId: "avatar", script: "script" }));
    const body = await response.json();

    assertEquals(response.status, 503);
    assertEquals(body.code, "media_stage_disabled");
  });

  Deno.test("heygen-submit routes valid requests through the shared HeyGen submit helper", async () => {
    const seen: { url?: string; body?: Record<string, unknown>; idempotencyKey?: string | null } = {};
    const handler = createHeyGenSubmitHandler({
      getEnv: env({
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        REDEX_ENABLE_HEYGEN_MEDIA_STAGE: "true",
        HEYGEN_API_KEY: "heygen-key",
        HEYGEN_BASE_URL: "https://heygen.test/v3",
      }),
      fetcher: async (input, init) => {
        seen.url = String(input);
        seen.body = JSON.parse(String(init?.body));
        seen.idempotencyKey = init?.headers instanceof Headers ? init.headers.get("Idempotency-Key") : null;
        return new Response(JSON.stringify({ data: { video_id: "video-123", status: "submitted", output_format: "mp4" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });

    const response = await handler(request({
      avatarId: " avatar-1 ",
      script: " Approved script. ",
      title: "Safety",
      voiceId: "voice-1",
      callbackId: "job-1",
      idempotencyKey: "idem-1",
      baseUrl: "https://attacker.invalid/v3",
    }));
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.video_id, "video-123");
    assertEquals(body.provider_status, "pending");
    assertEquals(seen.url, "https://heygen.test/v3/videos");
    assertEquals(seen.body?.avatar_id, "avatar-1");
    assertEquals(seen.body?.script, "Approved script.");
    assertEquals(seen.idempotencyKey, "idem-1");
  });

  Deno.test("heygen-submit reports provider retryable errors without exposing credentials", async () => {
    const handler = createHeyGenSubmitHandler({
      getEnv: env({
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        REDEX_ENABLE_HEYGEN_MEDIA_STAGE: "true",
        HEYGEN_API_KEY: "heygen-key",
      }),
      fetcher: async () => new Response(JSON.stringify({ message: "rate limited" }), { status: 429 }),
    });

    const response = await handler(request({ avatarId: "avatar", script: "script" }));
    const body = await response.json();

    assertEquals(response.status, 502);
    assertEquals(body.code, "provider_retryable_error");
    assert(!JSON.stringify(body).includes("heygen-key"), "error response must not include HEYGEN_API_KEY");
  });
}
