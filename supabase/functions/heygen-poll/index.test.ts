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
  maybeVitestDescribe.skip("Deno-only heygen-poll function tests", () => {});
}

if (typeof Deno !== "undefined") {
  const { createHeyGenPollHandler } = await import("./handler.ts");

  const env = (values: Record<string, string>) => (name: string) => values[name];
  const request = (body: Record<string, unknown>, token = "service-role") =>
    new Request("https://example.supabase.co/functions/v1/heygen-poll", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  Deno.test("heygen-poll rejects non-service-role callers", async () => {
    const handler = createHeyGenPollHandler({
      getEnv: env({
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        REDEX_ENABLE_HEYGEN_MEDIA_STAGE: "true",
        HEYGEN_API_KEY: "heygen-key",
      }),
      fetcher: async () => new Response("{}"),
    });

    const response = await handler(request({ videoId: "video-123" }, "user-token"));
    const body = await response.json();

    assertEquals(response.status, 401);
    assertEquals(body.code, "auth_failed");
  });

  Deno.test("heygen-poll is gated by REDEX_ENABLE_HEYGEN_MEDIA_STAGE", async () => {
    const handler = createHeyGenPollHandler({
      getEnv: env({ SUPABASE_SERVICE_ROLE_KEY: "service-role", HEYGEN_API_KEY: "heygen-key" }),
      fetcher: async () => new Response("{}"),
    });

    const response = await handler(request({ videoId: "video-123" }));
    const body = await response.json();

    assertEquals(response.status, 503);
    assertEquals(body.code, "media_stage_disabled");
  });

  Deno.test("heygen-poll routes provider detail through the shared HeyGen poll helper", async () => {
    let seenUrl = "";
    const handler = createHeyGenPollHandler({
      getEnv: env({
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        REDEX_ENABLE_HEYGEN_MEDIA_STAGE: "true",
        HEYGEN_API_KEY: "heygen-key",
        HEYGEN_BASE_URL: "https://heygen.test/v3",
      }),
      fetcher: async (input) => {
        seenUrl = String(input);
        return new Response(JSON.stringify({
          data: {
            id: "video-123",
            status: "completed",
            video_url: "https://files.heygen.test/video-123.mp4",
            thumbnail_url: "https://files.heygen.test/video-123.jpg",
            subtitle_url: "https://files.heygen.test/video-123.srt",
            duration: 42,
          },
        }), { status: 200 });
      },
    });

    const response = await handler(request({ videoId: "video-123", baseUrl: "https://attacker.invalid/v3" }));
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(seenUrl, "https://heygen.test/v3/videos/video-123");
    assertEquals(body.provider_status, "succeeded");
    assertEquals(body.video_url, "https://files.heygen.test/video-123.mp4");
    assertEquals(body.duration_seconds, 42);
  });

  Deno.test("heygen-poll reports transient provider failures as retryable routing errors", async () => {
    const handler = createHeyGenPollHandler({
      getEnv: env({
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        REDEX_ENABLE_HEYGEN_MEDIA_STAGE: "true",
        HEYGEN_API_KEY: "heygen-key",
      }),
      fetcher: async () => new Response(JSON.stringify({ error: "temporary" }), { status: 503 }),
    });

    const response = await handler(request({ videoId: "video-123" }));
    const body = await response.json();

    assertEquals(response.status, 502);
    assertEquals(body.code, "provider_retryable_error");
    assert(body.message.includes("HeyGen get video request failed"), "provider error should preserve actionable routing message");
  });
}
