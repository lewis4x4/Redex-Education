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
  const {
    COURSE_FOUNDRY_SERVER_PROMPT_REGISTRY,
    VIDEO_SEGMENT_RULE,
    createCourseFoundryAiClientServer,
    ProviderNotConfiguredError,
  } = await import("./courseFoundryAiClientServer.ts");

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



  Deno.test("server AI client normalizes incomplete source analysis output", async () => {
    const originalFetch = globalThis.fetch;
    Deno.env.set("AI_PROVIDER", "anthropic");
    Deno.env.set("AI_PROVIDER_API_KEY", "test-key");
    Deno.env.set("AI_MODEL", "claude-test");
    globalThis.fetch = (() => {
      return Promise.resolve(new Response(JSON.stringify({
        content: [{ type: "text", text: JSON.stringify({
          topic: "Wire Gauge & Type",
          authority: "Unknown – no author, organisation, or credentialing body identifiable from the supplied material",
        }) }],
        usage: { input_tokens: 1000, output_tokens: 500 },
      }), { status: 200 }));
    }) as typeof fetch;

    try {
      const result = await createCourseFoundryAiClientServer().analyzeSource({ sources: { text: "source" } });

      assertEquals(result.output, {
        topic: "Wire Gauge & Type",
        authority: "context",
        sections_detected: 0,
        has_placeholders: false,
        missing_required_topics: [],
      });
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

  Deno.test("server AI client checks entailment with mocked provider output", async () => {
    const originalFetch = globalThis.fetch;
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    Deno.env.set("AI_PROVIDER", "anthropic");
    Deno.env.set("AI_PROVIDER_API_KEY", "test-key");
    Deno.env.set("AI_MODEL", "claude-test");
    globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return Promise.resolve(new Response(JSON.stringify({
        content: [{ type: "text", text: JSON.stringify({
          entailed: false,
          confidence: "high",
          reasoning: "The claim adds a response deadline not present in the source.",
        }) }],
        usage: { input_tokens: 500, output_tokens: 50 },
      }), { status: 200 }));
    }) as typeof fetch;

    try {
      const result = await createCourseFoundryAiClientServer().checkEntailment({
        claim: "Employees must respond within one hour.",
        sourceSection: { id: "section-1", heading: "Communications", body: "Employees should use business hours for routine messages." },
      });

      assertEquals(result.output.entailed, false);
      assertEquals(result.output.confidence, "high");
      assertEquals(result.prompt_version, "entailment_check@v1");
      assert(String(calls[0]?.init?.body).includes("temperature"), "entailment calls should request deterministic judging");
    } finally {
      globalThis.fetch = originalFetch;
      Deno.env.delete("AI_PROVIDER");
      Deno.env.delete("AI_PROVIDER_API_KEY");
      Deno.env.delete("AI_MODEL");
    }
  });

  Deno.test("server AI client rejects invalid generated drag-to-order lessons", async () => {
    const originalFetch = globalThis.fetch;
    Deno.env.set("AI_PROVIDER", "openai");
    Deno.env.set("AI_PROVIDER_API_KEY", "test-key");
    Deno.env.set("AI_MODEL", "openai-test");
    globalThis.fetch = (() => {
      return Promise.resolve(new Response(JSON.stringify({
        output_text: JSON.stringify({
          module_title: "HR Basics",
          lessons: [
            {
              lesson_index: 0,
              module_index: 0,
              title: "Order the procedure",
              lesson_type: "drag_to_order",
              status: "draft",
              ordering_steps: [
                { id: "step-1", label: "First" },
                { id: "step-1", label: "Duplicate" },
              ],
            },
          ],
          generated_at: "2026-05-25T03:00:00.000Z",
          is_complete: true,
        }),
        usage: { input_tokens: 1000, output_tokens: 500 },
      }), { status: 200 }));
    }) as typeof fetch;

    try {
      await createCourseFoundryAiClientServer().generateLessons({
        outline: { modules: [{ lessons: [{ lesson_type: "drag_to_order" }] }] },
        sources: { text: "source" },
      });
      throw new Error("Expected invalid drag-to-order output to fail validation");
    } catch (error) {
      assert(String((error as Error).message).includes("Ordering step ids must be unique"), "validation should reject duplicate ordering step ids");
    } finally {
      globalThis.fetch = originalFetch;
      Deno.env.delete("AI_PROVIDER");
      Deno.env.delete("AI_PROVIDER_API_KEY");
      Deno.env.delete("AI_MODEL");
    }
  });

  Deno.test("server generated text schema rejects reading_blocks without body_markdown fallback", async () => {
    const originalFetch = globalThis.fetch;
    Deno.env.set("AI_PROVIDER", "openai");
    Deno.env.set("AI_PROVIDER_API_KEY", "test-key");
    Deno.env.set("AI_MODEL", "openai-test");
    globalThis.fetch = (() => {
      return Promise.resolve(new Response(JSON.stringify({
        output_text: JSON.stringify({
          module_title: "HR Basics",
          lessons: [
            {
              lesson_index: 0,
              module_index: 0,
              title: "Welcome",
              lesson_type: "text",
              reading_blocks: [
                { id: "block-1", kind: "prose", markdown: "Welcome to Redex. [source: section-1]" },
              ],
              status: "draft",
            },
          ],
          generated_at: "2026-05-25T03:00:00.000Z",
          is_complete: true,
        }),
        usage: { input_tokens: 1000, output_tokens: 500 },
      }), { status: 200 }));
    }) as typeof fetch;

    try {
      await createCourseFoundryAiClientServer().generateLessons({
        outline: { modules: [{ lessons: [{ lesson_type: "text" }] }] },
        sources: { text: "source" },
      });
      throw new Error("Expected invalid text output without body_markdown to fail validation");
    } catch (error) {
      assert(
        String((error as Error).message).includes("text generated lessons require non-empty body_markdown fallback"),
        "validation should reject text lessons that omit body_markdown fallback",
      );
    } finally {
      globalThis.fetch = originalFetch;
      Deno.env.delete("AI_PROVIDER");
      Deno.env.delete("AI_PROVIDER_API_KEY");
      Deno.env.delete("AI_MODEL");
    }
  });

  Deno.test("server text prompt and schema accept structured reading blocks with body_markdown fallback", async () => {
    const originalFetch = globalThis.fetch;
    Deno.env.set("AI_PROVIDER", "openai");
    Deno.env.set("AI_PROVIDER_API_KEY", "test-key");
    Deno.env.set("AI_MODEL", "openai-test");
    globalThis.fetch = (() => {
      return Promise.resolve(new Response(JSON.stringify({
        output_text: JSON.stringify({
          module_title: "HR Basics",
          lessons: [
            {
              lesson_index: 0,
              module_index: 0,
              title: "Welcome",
              lesson_type: "text",
              body_markdown: "Welcome to Redex. [source: section-1]",
              reading_blocks: [
                { id: "block-1", kind: "prose", markdown: "Welcome to Redex. [source: section-1]" },
                {
                  id: "block-2",
                  kind: "inline_check",
                  prompt: "What should you do?",
                  options: ["Ask", "Wait"],
                  correct_option_index: 0,
                },
              ],
              status: "draft",
            },
          ],
          generated_at: "2026-05-25T03:00:00.000Z",
          is_complete: true,
        }),
        usage: { input_tokens: 1000, output_tokens: 500 },
      }), { status: 200 }));
    }) as typeof fetch;

    try {
      const result = await createCourseFoundryAiClientServer().generateLessons({
        outline: { modules: [{ lessons: [{ lesson_type: "text" }] }] },
        sources: { text: "source" },
      });

      assertEquals(result.prompt_version, "lesson_generation.text@v1.1");
      assertEquals(result.output.lessons[0]?.reading_blocks?.length, 2);
      assert(COURSE_FOUNDRY_SERVER_PROMPT_REGISTRY["lesson_generation.text"].system.includes("reading_blocks"), "text prompt should require reading_blocks");
      assert(COURSE_FOUNDRY_SERVER_PROMPT_REGISTRY["lesson_generation.text"].system.includes("8th-grade"), "text prompt should include readability target");
    } finally {
      globalThis.fetch = originalFetch;
      Deno.env.delete("AI_PROVIDER");
      Deno.env.delete("AI_PROVIDER_API_KEY");
      Deno.env.delete("AI_MODEL");
    }
  });

  Deno.test("server video prompts include the explicit video segment rule", () => {
    const videoPrompt = COURSE_FOUNDRY_SERVER_PROMPT_REGISTRY["lesson_generation.video"];
    const videoScriptPrompt = COURSE_FOUNDRY_SERVER_PROMPT_REGISTRY["lesson_generation.video_script"];

    assert(videoPrompt, "lesson_generation.video prompt should exist");
    assert(videoScriptPrompt, "lesson_generation.video_script prompt should exist");
    assert(
      videoPrompt.system.includes(VIDEO_SEGMENT_RULE),
      "lesson_generation.video should include VIDEO_SEGMENT_RULE",
    );
    assert(
      videoScriptPrompt.system.includes(VIDEO_SEGMENT_RULE),
      "lesson_generation.video_script should include VIDEO_SEGMENT_RULE",
    );
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
