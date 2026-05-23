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
  Deno.test("generation worker tracks source_binding between lesson and assessment stages", async () => {
    const source = await Deno.readTextFile(new URL("./index.ts", import.meta.url));
    const generateLessonsIndex = source.indexOf('"generate_lessons"');
    const sourceBindingIndex = source.indexOf('"source_binding"');
    const generateAssessmentsIndex = source.indexOf('"generate_assessments"');

    assert(generateLessonsIndex > -1, "generate_lessons stage must exist");
    assert(sourceBindingIndex > generateLessonsIndex, "source_binding must follow generate_lessons");
    assert(generateAssessmentsIndex > sourceBindingIndex, "generate_assessments must follow source_binding");
    assert(source.includes('return ["generate_lessons", "source_binding", "assemble"]'), "generateLessons operation should run source_binding");
    assert(source.includes('return ["parse", "generate_lessons", "source_binding", "self_critique", "assemble"]'), "section jobs should run source_binding");
  });
}
