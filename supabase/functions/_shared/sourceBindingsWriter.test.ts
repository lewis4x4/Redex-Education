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
  maybeVitestDescribe.skip("Deno-only source binding writer tests", () => {});
}

if (typeof Deno !== "undefined") {
  const { computeBindingPlan, extractCitedClaims, writeSourceBindings } = await import("./sourceBindingsWriter.ts");

  const baseModule = {
    module_title: "HR Basics",
    generated_at: "2026-05-23T00:00:00.000Z",
    is_complete: true,
    lessons: [
      {
        lesson_index: 0,
        module_index: 0,
        title: "Welcome",
        lesson_type: "text",
        body_markdown: "People Ops supports HR questions. [source: section-1]",
        status: "draft",
      },
    ],
  };

  const sourceSections = [
    {
      id: "section-1",
      heading: "HR help",
      body: "People Ops supports HR questions.",
      has_placeholders: false,
      source_file_id: "file-1",
      source_file_version_id: "version-1",
      authority: "authoritative" as const,
    },
    {
      id: "section-2",
      heading: "Manager help",
      body: "Managers support HR questions.",
      has_placeholders: false,
      source_file_id: "file-2",
      source_file_version_id: "version-2",
      authority: "authoritative" as const,
      conflicts_with: ["section-3"],
    },
    {
      id: "section-3",
      heading: "People Ops help",
      body: "People Ops, not managers, owns HR questions.",
      has_placeholders: false,
      source_file_id: "file-3",
      source_file_version_id: "version-3",
      authority: "authoritative" as const,
      conflicts_with: ["section-2"],
    },
    {
      id: "section-4",
      heading: "Context note",
      body: "Context-only old note.",
      has_placeholders: false,
      source_file_id: "file-4",
      source_file_version_id: "version-4",
      authority: "context" as const,
    },
  ];

  Deno.test("computeBindingPlan writes one section binding for a cited claim", () => {
    const plan = computeBindingPlan({ moduleId: "module-1", generatedModule: baseModule, sourceSections });

    assertEquals(plan.bindings.length, 1);
    assertEquals(plan.bindings[0]?.source_section_id, "section-1");
    assertEquals(plan.unsupportedClaims.length, 0);
  });

  Deno.test("computeBindingPlan flags equal-authority conflicts for human review", () => {
    const module = {
      ...baseModule,
      lessons: [{ ...baseModule.lessons[0], body_markdown: "HR ownership differs. [source: section-2, section-3]" }],
    };
    const plan = computeBindingPlan({ moduleId: "module-1", generatedModule: module, sourceSections });

    assertEquals(plan.flaggedConflicts.length, 1);
    assertEquals(plan.bindings.every((binding) => binding.flagged_for_review), true);
    assertEquals(plan.bindings[0]?.flag_reason, "equal_authority_conflict");
  });

  Deno.test("computeBindingPlan keeps the higher authority citation over lower authority citations", () => {
    const module = {
      ...baseModule,
      lessons: [{ ...baseModule.lessons[0], body_markdown: "People Ops owns HR questions. [source: section-1, section-4]" }],
    };
    const plan = computeBindingPlan({ moduleId: "module-1", generatedModule: module, sourceSections });

    assertEquals(plan.bindings.length, 1);
    assertEquals(plan.bindings[0]?.source_section_id, "section-1");
    assertEquals(plan.flaggedConflicts.length, 0);
  });

  Deno.test("extractCitedClaims reports bare prose as unsupported", () => {
    const module = {
      ...baseModule,
      lessons: [{ ...baseModule.lessons[0], body_markdown: "People Ops supports HR questions." }],
    };
    const result = extractCitedClaims(module);

    assertEquals(result.claims.length, 0);
    assertEquals(result.unsupportedClaims[0]?.reason, "missing_citation");
  });

  Deno.test("writeSourceBindings upserts planned rows", async () => {
    const upserts: unknown[] = [];
    const supabase = {
      from(table: string) {
        return {
          upsert(rows: unknown[]) {
            assertEquals(table, "module_source_bindings");
            upserts.push(...rows);
            return Promise.resolve({ error: null });
          },
        };
      },
    };

    const result = await writeSourceBindings({
      supabase: supabase as never,
      moduleId: "module-1",
      generatedModule: baseModule,
      sourceSections,
    });

    assertEquals(result.writtenCount, 1);
    assertEquals(upserts.length, 1);
    assert(JSON.stringify(upserts[0]).includes("section-1"), "upsert should include cited section id");
  });
}
