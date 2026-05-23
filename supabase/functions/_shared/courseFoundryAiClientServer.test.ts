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
  maybeVitestDescribe.skip("Deno-only server AI client tests", () => {});
}

if (typeof Deno !== "undefined") {
  const { createCourseFoundryAiClientServer, ProviderNotConfiguredError } = await import("./courseFoundryAiClientServer.ts");

  Deno.test("server AI client calls Anthropic and validates costed output", async () => {
    const originalFetch = globalThis.fetch;
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    Deno.env.set("AI_PROVIDER", "anthropic");
    Deno.env.set("AI_PROVIDER_API_KEY", "test-key");
    Deno.env.set("AI_MODEL", "claude-test");
    globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return Promise.resolve(new Response(JSON.stringify({
        content: [{ type: "text", text: JSON.stringify({
          topic: "hr",
          authority: "authoritative",
          sections_detected: 2,
          has_placeholders: false,
          missing_required_topics: [],
        }) }],
        usage: { input_tokens: 1000, output_tokens: 500 },
      }), { status: 200 }));
    }) as typeof fetch;

    try {
      const result = await createCourseFoundryAiClientServer().analyzeSource({ sources: { text: "source" } });

      assertEquals(result.output.topic, "hr");
      assertEquals(result.model_used, "claude-test");
      assertEquals(result.prompt_version, "source_analysis@v1");
      assertEquals(calls[0]?.url, "https://api.anthropic.com/v1/messages");
      assert(String(calls[0]?.init?.body).includes("source_analysis") === false, "prompt id should not leak as prose-only requirement");
      assert(result.cost_cents >= 0, "cost should be recorded");
    } finally {
      globalThis.fetch = originalFetch;
      Deno.env.delete("AI_PROVIDER");
      Deno.env.delete("AI_PROVIDER_API_KEY");
      Deno.env.delete("AI_MODEL");
    }
  });

  Deno.test("server AI client switches to OpenAI", async () => {
    const originalFetch = globalThis.fetch;
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    Deno.env.set("AI_PROVIDER", "openai");
    Deno.env.set("AI_PROVIDER_API_KEY", "test-key");
    Deno.env.set("AI_MODEL", "openai-test");
    globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return Promise.resolve(new Response(JSON.stringify({
        output_text: JSON.stringify({
          course_title: "HR Basics",
          description: "Draft",
          learning_objectives: ["Learn HR basics"],
          modules: [{ title: "HR Basics", lessons: [{ title: "Welcome", lesson_type: "text", estimated_minutes: 3 }] }],
        }),
        usage: { input_tokens: 1000, output_tokens: 500 },
      }), { status: 200 }));
    }) as typeof fetch;

    try {
      const result = await createCourseFoundryAiClientServer().generateOutline({
        basics: { title: "HR" },
        sources: { text: "source" },
        setupAnswers: {},
      });

      assertEquals(result.output.course_title, "HR Basics");
      assertEquals(result.model_used, "openai-test");
      assertEquals(calls[0]?.url, "https://api.openai.com/v1/responses");
    } finally {
      globalThis.fetch = originalFetch;
      Deno.env.delete("AI_PROVIDER");
      Deno.env.delete("AI_PROVIDER_API_KEY");
      Deno.env.delete("AI_MODEL");
    }
  });

  Deno.test("server AI client throws clearly when provider key is missing", async () => {
    Deno.env.set("AI_PROVIDER", "anthropic");
    Deno.env.delete("AI_PROVIDER_API_KEY");

    try {
      await createCourseFoundryAiClientServer().analyzeSource({ sources: {} });
      throw new Error("Expected missing provider key to throw");
    } catch (error) {
      assert(error instanceof ProviderNotConfiguredError, "expected ProviderNotConfiguredError");
      assert(String((error as Error).message).includes("AI_PROVIDER_API_KEY"), "error should name missing secret");
    } finally {
      Deno.env.delete("AI_PROVIDER");
    }
  });
}
