# Slice 10.7 — Reading Lesson v2 Design Review

**Date:** 2026-05-25
**Reviewer:** JARVIS (PAI)
**Scope:** Uncommitted Slice 10.7 work — `ReadingLesson` learner renderer, related tests, domain types, and the AI/schema seams that drive real-course readiness.
**Out of scope:** Slice 10.8 image ingest (Drive → Storage), broad design refactors, redo of `ModulePlayer` semantics.

---

## 1. Context

Slice 10.7 upgrades `text` lessons from "raw markdown body" into a designed reading experience composed of typed blocks (prose, callout, policy quote, non-graded inline check, reference-only collapsible, copyable config, image placeholder). The work introduces:

- A new `src/features/learner/components/lessons/ReadingLesson.tsx` rendered by `LessonContentRenderer` for `content.type === 'text'`.
- Discriminated `ReadingLessonBlock` union added to `src/types/training.ts` with backward-compatible `body_markdown` fallback.
- Mirrored Zod schemas in `src/features/foundry/ai/aiSchemas.ts` and `supabase/functions/_shared/courseFoundryAiClientServer.ts`.
- Prompt bump `lesson_generation.text` → `v1.1` with structured-block + 8th-grade rules.
- New `readingLevel.eval.ts` and grounding-eval extension for structured prose.
- One demo lesson and one mock generated lesson exercise the new shape; everything else keeps `body_markdown` and proves fallback.

`ModulePlayer` is unchanged. Text lessons remain manual-completion via the footer button; inline checks are local and non-completing — confirmed by tests and by re-reading `requiresInlineCompletion` (it does not include `'text'`).

Overall: **the slice is well-scoped, the contract changes are coherent across frontend/server, tests cover the happy paths, and there are no broken type seams.** The findings below are surgical — primarily a11y polish, one real visual contrast bug, and a couple of real-course robustness gaps.

---

## 2. Findings — Prioritized

### P1 — Real bugs / a11y blockers

#### P1-1. ConfigBlock description text is unreadable on the dark surface

`Markdown` is a shared inner wrapper hard-coded to `text-slate-700`:

```tsx
// src/features/learner/components/lessons/ReadingLesson.tsx:11–17
function Markdown({ children }: { children: string }) {
  return (
    <div className="prose max-w-none text-slate-700">
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{children}</ReactMarkdown>
    </div>
  );
}
```

…but `ConfigBlock` is intentionally dark (`bg-slate-950 text-white`) and renders the description through `<Markdown>` inside a `text-slate-300` parent (line 124–126). The inner `text-slate-700` wins over both the white section text and the slate-300 wrapper, so the description sits in ~slate-700 over slate-950 — visually invisible and well below WCAG AA contrast.

**Severity:** real visual regression on a flagship reading-experience block.

**Recommended fix** (small, safe):

```tsx
// Before
function Markdown({ children }: { children: string }) {
  return (
    <div className="prose max-w-none text-slate-700">
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{children}</ReactMarkdown>
    </div>
  );
}

// After
function Markdown({ children, tone = 'light' }: { children: string; tone?: 'light' | 'dark' }) {
  const toneClasses = tone === 'dark' ? 'prose-invert text-slate-200' : 'text-slate-700';
  return (
    <div className={`prose max-w-none ${toneClasses}`}>
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{children}</ReactMarkdown>
    </div>
  );
}
```

Then in `ConfigBlock`:

```tsx
{block.description_markdown ? (
  <div className="mt-2 text-sm text-slate-300">
    <Markdown tone="dark">{block.description_markdown}</Markdown>
  </div>
) : null}
```

`prose-invert` is supplied by `@tailwindcss/typography`, which is already in use elsewhere (`prose` class is in production CSS). No new dependency.

---

#### P1-2. Unknown block kinds crash the whole lesson

`ReadingBlock`'s `default` branch calls `assertNever(block)` which throws:

```tsx
// ReadingLesson.tsx:228–233 (default case)
default:
  return assertNever(block);
```

This is correct as a TypeScript exhaustiveness check, but at runtime in a real course it means: if a generated lesson or persisted row contains a `kind` we don't render yet (forward compatibility with later slices, schema drift between server and a slightly stale client, etc.), the entire `ReadingLesson` throws and `ModulePlayer` is left to render an unstyled React error. There is no `RouteErrorBoundary` scoped at the lesson surface to soak this.

**Severity:** fragile under real-course conditions where back-end can ship new block kinds before every client updates.

**Recommended fix:**

```tsx
default: {
  if (import.meta.env.DEV) {
    console.warn('Unhandled reading block variant', block);
  }
  return (
    <aside
      className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
      role="note"
    >
      This content block isn't supported in your current version of Redex Academy. Refresh to load the latest update — the rest of the lesson will continue to work.
    </aside>
  );
}
```

The `assertNever` helper can stay defined for TS-only narrowing elsewhere if desired, but should not be invoked at render time.

---

#### P1-3. Inline check buttons have no programmatic "selected" indicator and no labelled-by linking to the prompt

```tsx
// ReadingLesson.tsx:47–56 (option button)
<button
  type="button"
  className={...selected styling...}
  onClick={() => setSelectedIndex(index)}
>
  {option}
</button>
```

There is no `aria-pressed` (or `role="radio"` inside a `role="radiogroup"`), so screen reader users get no signal about which option they picked — the difference is purely visual (border + text color). The outer section uses `aria-label="Inline quick check"`, which *overrides* the actual prompt, so a screen reader announces the generic label instead of the question.

**Severity:** blocking for accessible learner experience on a flagship interaction.

**Recommended fix:**

```tsx
// section
<section
  role="group"
  aria-labelledby={`${block.id}-prompt`}
  className="rounded-2xl border border-redex-red/20 bg-redex-red/5 p-5"
>
  <p className="text-xs font-semibold uppercase tracking-[2px] text-redex-red">Quick check — not graded</p>
  <h4 id={`${block.id}-prompt`} className="mt-2 text-base font-semibold text-slate-900">
    {block.prompt}
  </h4>

  {/* option buttons */}
  <button
    key={`${block.id}-${index}`}             // see P3-1 — key on index, not label
    type="button"
    aria-pressed={selectedIndex === index}
    className={...}
    onClick={() => setSelectedIndex(index)}
  >
    {option}
  </button>
```

(Optional, larger: switch the option list to a true radiogroup. The `aria-pressed` toggle pattern is the smallest change that fixes the announce-and-state issue without restructuring.)

---

#### P1-4. Collapsible panel is unmounted when closed, but `aria-controls` still points at the (missing) id

```tsx
// ReadingLesson.tsx:96–101
{open ? (
  <div id={panelId} className="mt-4 border-t border-slate-200 pt-4">
    <Markdown>{block.markdown}</Markdown>
  </div>
) : null}
```

While `aria-expanded` is correctly toggled, the ARIA APG contract is that `aria-controls` should reference an element that exists in the DOM. Some screen readers (NVDA, JAWS) announce "controls reference to nonexistent element" or skip cues entirely. The fix is trivial — render the panel always and use the `hidden` attribute when closed.

**Recommended fix:**

```tsx
<div id={panelId} hidden={!open} className="mt-4 border-t border-slate-200 pt-4">
  <Markdown>{block.markdown}</Markdown>
</div>
```

This is a one-line change and is purely additive — the existing test that asserts `queryByText(...)` not in DOM continues to pass because `hidden` removes the content from the accessibility tree and the default visual tree.

---

### P2 — A11y polish / real-course feel

#### P2-1. Prose anchor `#` is decorative text inside the heading, not a real link

```tsx
// ReadingLesson.tsx:177–182
{block.heading ? (
  <h3 className="mb-4 text-xl font-semibold tracking-tight text-slate-900">
    {block.heading}
    <span className="ml-2 text-sm font-normal text-slate-400">#</span>
  </h3>
) : null}
```

Two issues:

1. The `#` is rendered always — even when `anchor_id` is not set, so it can't function as a deep link at all.
2. When `anchor_id` *is* set, it's still a plain `<span>` — no `href`, no `aria-hidden`. A screen reader will announce the heading as "Start here, number sign", which is noise.

**Recommended fix** — only render the `#` when `anchor_id` is provided, and make it a real link with proper a11y:

```tsx
{block.heading ? (
  <h3 id={blockAnchorId(block)} className="mb-4 text-xl font-semibold tracking-tight text-slate-900">
    {block.heading}
    {block.anchor_id ? (
      <a
        href={`#${block.anchor_id}`}
        className="ml-2 text-sm font-normal text-slate-400 hover:text-redex-red focus:text-redex-red"
        aria-label={`Link to ${block.heading}`}
      >
        #
      </a>
    ) : null}
  </h3>
) : null}
```

Note: the current code applies the anchor id to the *section* wrapper. Moving the `id` to the `<h3>` is more useful for in-page jumps and matches typical reading-experience convention. If you keep the section id for layout reasons, add the heading id as well — both anchors are cheap.

---

#### P2-2. ConfigBlock copy feedback is stateful but never resets, and is not announced to AT

Once the user clicks Copy:

- Button label becomes `Copied` forever (`copyState` only flips back to `idle` if the page re-renders the component fresh).
- The "Copy unavailable. Select the code manually." line is a plain `<p>` — no `role="status"` or `aria-live`, so screen readers don't hear it.

Also, the copy button's accessible name is just "Copy" or `block.copy_label`. If multiple config blocks coexist (a real possibility in HR onboarding / ops modules), every button is named identically.

**Recommended fix** — auto-reset and announce:

```tsx
async function copyCode() {
  if (!navigator.clipboard?.writeText) {
    setCopyState('unavailable');
    return;
  }
  try {
    await navigator.clipboard.writeText(block.code);
    setCopyState('copied');
    window.setTimeout(() => setCopyState('idle'), 2000);
  } catch {
    setCopyState('unavailable');
  }
}

// button
<button
  type="button"
  aria-label={`Copy ${block.title ?? 'configuration'} to clipboard`}
  className="..."
  onClick={copyCode}
>
  {copyState === 'copied' ? 'Copied' : block.copy_label ?? 'Copy'}
</button>

// announcement region — replace the bare <p>
<p
  role="status"
  aria-live="polite"
  className={`mt-2 text-xs text-slate-300 ${copyState === 'unavailable' ? '' : 'sr-only'}`}
>
  {copyState === 'unavailable'
    ? 'Copy unavailable. Select the code manually.'
    : copyState === 'copied' ? 'Code copied to clipboard.' : ''}
</p>
```

Note: the current test `expect(screen.getByText(/Copy unavailable|Copied/i)).toBeInTheDocument()` will continue to pass — `Copied` appears on the button and "Copy unavailable" appears in the status line.

---

#### P2-3. Image block with `status === 'ready'` but no `storage_url` silently shows "pending ingest"

```tsx
// ReadingLesson.tsx:142–145
const isReady = Boolean(image_ref.storage_url) && image_ref.status !== 'failed';
const statusLabel = image_ref.status === 'failed' ? 'Image unavailable' : 'Image pending ingest';
```

When status is `'ready'` but URL is missing — typically an authoring mistake or a Storage race — learners see "Image pending ingest", which is misleading. For real courses you want a distinguishable signal so QA/admins can tell "the author marked this ready but the asset never arrived" apart from "ingestion still in flight."

**Recommended fix** (small):

```tsx
const hasUrl = Boolean(image_ref.storage_url);
const isReady = hasUrl && image_ref.status !== 'failed';
const statusLabel =
  image_ref.status === 'failed'
    ? 'Image unavailable'
    : image_ref.status === 'ready' && !hasUrl
      ? 'Image missing — contact your trainer'
      : 'Image pending ingest';
```

The `text_equivalent_markdown` continues to carry the educational meaning regardless of placeholder state — that part is correct.

Schema-side improvement (separate, non-blocking): consider tightening the Zod schema in a future slice so that `status === 'ready'` requires `storage_url`. Out of scope for 10.7 to avoid invalidating in-flight mock fixtures.

---

#### P2-4. PolicyQuote applies `italic` to the wrapper, cascading into all markdown formatting inside the quote

```tsx
// ReadingLesson.tsx:196–198
<div className="mt-3 border-l-4 border-redex-red pl-4 italic">
  <Markdown>{block.quote_markdown}</Markdown>
</div>
```

A policy quote with embedded `**bold**`, lists, or links will render all of it as italic. For real HR/compliance content (where bolding key terms inside a quoted passage is common), this distorts authorial intent.

**Recommended fix:** drop `italic` from the wrapper and add it only to the textual prose via the typography plugin — or use a `<cite>`/visually-styled quotation mark indicator. Smallest safe change:

```tsx
<div className="mt-3 border-l-4 border-redex-red pl-4 text-slate-800">
  <div className="prose max-w-none italic prose-strong:not-italic prose-em:not-italic">
    <Markdown>{block.quote_markdown}</Markdown>
  </div>
</div>
```

(The `prose-strong:not-italic` modifier requires `@tailwindcss/typography` v0.5+, already present.)

If you prefer to defer styling polish, an acceptable minimal fix is just removing `italic` from the wrapper and accepting upright policy quotes for v1.

---

#### P2-5. Empty fallback renders dev placeholder copy in real courses

```tsx
// ReadingLesson.tsx:240–246
if (blocks.length === 0) {
  const markdownBody = content.body_markdown || 'Text lesson content would render here as rich markdown.';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <Markdown>{markdownBody}</Markdown>
    </div>
  );
}
```

If a published lesson reaches a learner with no `blocks` and an empty `body_markdown`, the literal string "Text lesson content would render here as rich markdown." shows up in production. Combined with the Zod superRefine on the AI schema (which already requires one or the other), this is mostly defensive — but the failure mode is a polished-looking card with developer copy inside, which is worse than a clear error panel.

**Recommended fix:**

```tsx
if (blocks.length === 0) {
  const markdownBody = content.body_markdown?.trim();

  if (!markdownBody) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8" role="status">
        <p className="text-xs font-semibold uppercase tracking-[3px] text-amber-700">Lesson content unavailable</p>
        <p className="mt-3 text-sm text-amber-900">
          This reading lesson has no published content yet. Please contact your trainer or refresh the lesson.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <Markdown>{markdownBody}</Markdown>
    </div>
  );
}
```

This mirrors the `ChecklistLesson` "unavailable" amber pattern already used in the codebase (`ChecklistLesson.tsx:51–58`).

---

### P3 — Robustness / polish (defer if shipping today)

#### P3-1. Inline check option `key` collides on duplicate labels

```tsx
// ReadingLesson.tsx:46
key={`${block.id}-${option}`}
```

If an authoring mistake produces two identical option strings, React keys collide and selection state breaks. Switch to the index:

```tsx
key={`${block.id}-option-${index}`}
```

Trivial change, safe.

---

#### P3-2. `data-testid="reading-lesson-v2"` is version-tagged; the other lesson surfaces aren't

Other lesson components don't expose versioned testids (e.g. there is no `checklist-lesson-v1`). If a v3 lands, the testid becomes a stale signal. Consider `data-testid="reading-lesson"` to match the rest of the family. If you want to keep the version signal, attach it as a separate data attribute (`data-variant="blocks"` vs `data-variant="legacy-markdown"`), which would actually be useful for the legacy/structured paths.

---

#### P3-3. `source_section_ids` provenance is in the schema but never surfaces to the learner

Every block carries optional `source_section_ids`, the AI prompts insist on `[source: <section_id>]` citations, but the renderer never exposes provenance to the learner. That's a defensible v1 choice (provenance lives in admin/audit), but if real courses want learners to see "based on: HR Handbook §3", the design hook is already there. Worth a one-line note in the roadmap.

---

#### P3-4. Long single-word options can overflow horizontally

Inline check option buttons use `text-left text-sm font-medium` with no `whitespace-normal break-words`. Most real options will wrap fine via the natural soft-wrap, but a single very long token (URL, code identifier) will push the button width. Add `whitespace-normal break-words` to be safe.

---

#### P3-5. Focus styles fall back to browser defaults

Other lesson components (`ChecklistLesson`, `Quiz`) explicitly set `focus:ring-redex-red`. `ReadingLesson` buttons rely on browser default focus rings. For keyboard learners this is functional but not on-brand and inconsistent. Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-redex-red focus-visible:ring-offset-2` to the inline check option button, collapsible toggle, and config block copy button.

---

### Test coverage gaps

These are the cases the current `LessonContentRenderer.test.tsx` does *not* cover, in priority order:

1. **`status === 'failed'` image** — verify the "Image unavailable" label and that the text equivalent still renders. Trivial addition next to the existing pending/ready tests.
2. **Empty body + empty blocks** — verify the "Lesson content unavailable" amber panel (assuming P2-5 lands). Locks in real-course behavior.
3. **Unknown block kind graceful fallback** — once P1-2 lands, add a regression test that an unknown `kind` renders the amber notice and does NOT throw. Tests can pass an object cast to `ReadingLessonBlock` to exercise the runtime branch.
4. **`aria-pressed` on inline check options** — once P1-3 lands, assert the selected option has `aria-pressed="true"` after click and the others have `aria-pressed="false"`.
5. **Multiple inline checks coexist independently** — render two `inline_check` blocks, click an option in one, verify the other remains unselected. Confirms the per-block local state model.
6. **Anchor link present when `anchor_id` is set; absent otherwise** — once P2-1 lands.

None of these block the slice landing, but I'd ship at least #1 and #2 alongside P1/P2 fixes since they're cheap and protect the most user-visible states.

---

### Domain types — observations (no required changes)

- `TextLessonContent.blocks` is optional and the renderer correctly treats `undefined` and `[]` identically. The Zod refinement requires at least one of `body_markdown` or non-empty `blocks` — good. Backward compatibility is preserved as planned.
- `ReadingProseBlock.anchor_id` is a free-form string. Renderer uses it verbatim as a DOM id. Authors could supply whitespace/uppercase that browsers tolerate but URL fragments don't. Not a 10.7 blocker; a future slug-normalizer in the foundry is cleaner than client-side coercion.
- `ReadingImageBlock.image_ref.status` is optional. When omitted, the renderer treats presence-of-`storage_url` as authoritative. That's intentional, matches the 10.8 prep boundary, and is fine.
- `ReadingCollapsibleBlock.intent` is literal `'reference'` — schema-enforced. Keeps the "no graded/required content hidden behind a disclosure" invariant. Good guardrail.
- `GeneratedLessonContent.reading_blocks` flows through `mockAiClient.ts` `lessonContentFor` correctly. `body_markdown` is preserved alongside structured blocks. Good rollback story.

---

## 3. Suggested minimum landing path

If you want to ship Slice 10.7 today with the smallest set of safe changes:

1. **Land P1-1** (ConfigBlock dark contrast) — single helper change, single use site.
2. **Land P1-2** (graceful fallback for unknown kinds) — one default case rewrite.
3. **Land P1-3** (inline check `aria-pressed` + `aria-labelledby`) — three lines.
4. **Land P1-4** (collapsible `hidden` instead of conditional render) — one line.
5. **Land P2-5** (empty content amber panel) — mirrors existing ChecklistLesson convention.
6. **Add tests** for #1, #2, #3 from the gaps list.

P2-1 through P2-4 and the P3 items can land in a small follow-up commit without holding the slice.

---

## 4. What is already good

- Backward compatibility model (legacy `body_markdown` + new `blocks?`) is exactly the right shape and is exercised by both demo data and mock generated content.
- Discriminated-union shape with `kind` is consistent with the existing `LessonContent` model and gives renderers TypeScript exhaustiveness for free.
- Frontend and server Zod schemas are mirrored, including the `superRefine` duplicate-id and inline-check bounds checks.
- Prompt version bumped to `v1.1` with corresponding `prompts.test.ts` assertions and `realAiClient.test.ts` routing assertions — registry count guard remains intact.
- New `readingLevel.eval.ts` plugs into the existing eval harness pattern and uses prose/callouts only (correctly excludes formal policy quotes and code).
- `ModulePlayer` semantics are untouched; text lessons remain manual-completion and the inline check never gates progress — verified in `requiresInlineCompletion`.
- Tests cover the most learner-visible states (structured render, fallback, inline check no-completion, switch-lesson state reset, collapsible a11y disclosure, copy-fallback path, ready/pending image).
- No new runtime dependencies introduced.

---

## 5. Open question for the team

`ReadingImageBlock` requires `alt_text`, `caption`, and `text_equivalent_markdown` — three pieces of textual provenance for the same image. In the ready state, alt + figcaption + a heavyweight "Text equivalent" panel may produce repetitive announcements for screen readers and visual redundancy for sighted learners. Worth a brief design decision before Slice 10.8 ships real images:

- Is `text_equivalent_markdown` meant to be the *long description* (different content from alt/caption) or a duplicate-but-richer narration?
- Should the renderer collapse the "Text equivalent" panel by default when an image is ready, and expand it when pending/failed?

No change needed in 10.7; flagging so the team can answer once for the whole image lifecycle rather than discovering it during 10.8.

---

**Report path:** `docs/reviews/slice-10-7-reading-lesson-v2-design-review-2026-05-25.md`
