# Wire-Gauge Quality — Native Lesson System Design Plan

**Status:** Draft design (no implementation)
**Date:** 2026-05-25
**Author:** JARVIS (PAI)
**Scope:** Promote the Claude Co-Design "Wire Gauge" prototype quality into a *native, repeatable* Redex Academy capability. Do not ask AI (or human authors) to freehand the visual every time. The app should own the primitives; AI fills them.
**Out of scope:** Foundry generation prompt changes (covered by Slice 10.9), Coach UI (Phase 13), recognition surfaces (Phase 11.6), Drive ingest plumbing (Slice 10.8 covers it). This plan touches only the visual / authoring contract.

---

## 1. What the prototype actually proved

The Wire Gauge prototype is a high-fidelity Redex Academy module (AWG / cabling subject) rendered as a single learner-facing surface. The screenshots show these primitives in use:

| Prototype primitive | Native equivalent today | Gap |
|---|---|---|
| Top-of-module **DRAFT / UNVERIFIED** banner | None (we have draft *status* in data, no visible banner) | New: `ModuleVerificationBanner` |
| White / black / red color system | `--redex-red`, `--redex-offwhite`, slate scale, ADR 006 tokens | Already correct — enforce, don't add hues |
| **Centered content column** | `LessonScaffold` uses `mx-auto max-w-3xl`; ModulePlayer wraps in `max-w-2xl` for hero / completion | New shared `ReadingColumn` token so every renderer gets it identically |
| **Progress bar** (module + lesson) | One copy in `ModulePlayer` (sidebar); none on lesson surface | Promote to `ProgressBar` primitive, add `ModuleProgressHeader` |
| **Lesson cards** (module overview, "what's in this module") | Sidebar list only; no overview / TOC card | New `LessonTocCard` + `ModuleOverviewSheet` |
| **AWG diagrams** (annotated images with labels) | `ReadingImageBlock` (image + caption + text equivalent) | Extend image block with annotation overlay; or formalise as new `annotated_diagram` block |
| **Expandable tables** | None — `ReadingCollapsibleBlock` exists for reference markdown only | New `ReadingTableBlock` (paged / expandable rows, sortable, mobile card-fallback) |
| **Knowledge check feedback** (right/wrong + explanation) | `InlineCheckBlock` + `Quiz` lesson | Already there; need a shared `KnowledgeCheckFeedback` primitive to share styling between inline + graded quiz |

**Read this table as the punch list.** The rest of this document elaborates how each row lands without breaking the design bar (`docs/design-bar.md`), the v2 constraints from `Redex_Education_Phase10-13_Roadmap_v2_20260523.md`, or the brand-token system (ADR 006).

---

## 2. Operating principles

These are the rules the visual system has to encode so a prototype-quality module is the *default*, not the heroic exception.

1. **Authoring is by composition, not freehand.** The Foundry (AI) emits typed blocks. The app owns the rendering of each block. No code path takes "free markdown" and crosses its fingers.
2. **Every renderer holds the design bar.** This is already a v2 constraint. The way we keep that promise is: there are *fewer* renderers than there are lesson topics, and they pass a visual contract test before they ship.
3. **The brand system is the floor, not a suggestion.** No raw hex, no new red hues, no new shadow tiers. Tier 1 / Tier 2 / Tier 3 cards (`docs/design-bar.md` §4) cover 100% of surfaces.
4. **Provenance + draft status are visible.** AI-drafted content (`authority_provenance: 'brainstormed'`) and unpublished module versions surface a calm banner, not a red alarm. This is non-negotiable for the Wire-Gauge style (its "DRAFT / UNVERIFIED" ribbon is the most-quoted detail in the screenshots).
5. **Mobile is a first-class learner surface.** Field techs review on phones. Every primitive has a thumb-first layout (`Slice 10.4/10.5` constraint, already in v2 acceptance).
6. **Accessibility is part of the visual.** `aria-pressed`, `aria-controls`, focus rings, alt + caption + text-equivalent for images. The Slice 10.7 review locked these in; we make them a primitive-level invariant.
7. **No gamification.** Calls out the v2 ban: no badge walls, no XP, no streak counters, no confetti. Quizzes pass or don't pass; modules complete or don't.

---

## 3. Component inventory — the primitives the app must own

Each entry lists: **kind**, **owns**, **inputs (props or block type)**, **states**, **A11y**, **mobile**, **acceptance signal**. Items already in-tree are marked `(exists)`. New items are unmarked.

### 3.1 Layout primitives

| Component | Owns | Inputs | States | A11y | Mobile | Acceptance |
|---|---|---|---|---|---|---|
| `ReadingColumn` | The centered max-width content column used by every learner reading surface (lesson body, module overview, completion screen). | `children`, optional `density: 'comfortable' \| 'compact'` | n/a | Lands semantic `<main>` or `<article>` at the right level | Falls to full width below `sm:`; padding tier `p-4 → p-6 → p-8` | Hard-coded `max-w-3xl mx-auto` removed from `LessonScaffold` and replaced. Visual diff on a snapshot test detects regression. |
| `ModuleProgressHeader` | Sticky top bar with module title, lesson position, progress bar, and (when applicable) `DRAFT/UNVERIFIED` chip. | `module`, `lessonNumber`, `totalLessons`, `progress`, `verificationStatus` | `complete`, `in_progress`, `draft`, `unverified` | `role="progressbar"`, `aria-valuenow/min/max`; banner uses `role="status"` not `role="alert"` | Collapses to a slim two-line layout < `sm` | One component replaces the ad-hoc progress UI currently in `ModulePlayer` (lines ~252–301) and the per-lesson header strip (lines ~310–319). |
| `LessonScaffold` *(exists — extend)* | Per-lesson eyebrow + title + objective + time-to-complete + children. Already present at `src/features/learner/components/LessonScaffold.tsx`. | `lesson`, `lessonNumber`, `totalLessons`, `objective`, `children` | n/a | Already labelled-by lesson title | Mobile-tested. | Extend to accept a `verificationStatus` prop so a learner sees the same draft banner whether they're on the lesson or the module overview. |
| `ModuleOverviewSheet` | The "what's in this module" surface a learner sees before they start (or returns to via sidebar). Replaces the bare sidebar in `ModulePlayer` when expanded on mobile. | `module`, `lessons[]`, `progressMap`, `verificationStatus` | `prelaunch`, `in_progress`, `complete` | Real table of contents semantics; lesson links keyboard-traversable | Drawer on mobile, side panel ≥ md | Single component drives both the post-completion summary and the in-flight TOC. |
| `LessonFooterBar` | The sticky Previous / Mark Complete / locked-reason bar at the bottom of every lesson. | `previousEnabled`, `nextLabel`, `lockedReason`, `onPrev`, `onNext` | `idle`, `locked`, `submitting`, `last_lesson` | `aria-disabled` on the locked CTA; locked reason has `role="note"`; focus order obvious | Stacks vertically < `sm` with full-width buttons | Replaces inline footer JSX in `ModulePlayer` lines ~424–449 + ~451–474. |

### 3.2 Verification / provenance primitives

| Component | Owns | States | Visual rules |
|---|---|---|---|
| `ModuleVerificationBanner` | The DRAFT / UNVERIFIED / RATIFIED ribbon at the top of the centered column. | `draft` (yellow, calm) · `unverified` (amber, more prominent) · `ratified` (hidden) · `archived` (slate, info-only) | Uses `bg-warning-bg` + `text-amber-900` for draft, `bg-redex-red/[0.06]` + `text-redex-red` border-left for `unverified`. **No fill > 20% of the column**. Includes a one-line reason ("AI-drafted — SME approval required" / "Last reviewed > 90 days") and a single quiet link to learn more. |
| `LessonBlockProvenanceCaption` | Small "Based on: HR Handbook §3" caption beneath a block where the author wants the learner to see provenance. | Always optional — renderer ignores when `source_section_ids` is empty. | `text-xs text-slate-500`, no leading icon, no border. Pulled from `ReadingLessonBlockBase.source_section_ids` (already a typed property — see `src/types/training.ts:311–314`). |
| `AuthorityProvenanceBadge` | Foundry-side badge in the Source Library / outline review showing `brainstormed` vs `human_authored` vs `imported`. | Three pill colors mapped to `--redex-red/10`, slate, emerald respectively. | Never used in the *learner* surface; this is admin-only governance. Referenced by ADR for Option B (`docs/designs/foundry-topic-to-packet-option-b-2026-05-25.md`). |

**Why `unverified` is its own state:** the prototype's DRAFT/UNVERIFIED banner conveys two distinct signals — the *module version* isn't published yet, and *some block* in it is AI-drafted-but-not-SME-ratified. Folding both into one banner is dishonest. Two states, two visual treatments, both calm.

### 3.3 Reading-lesson block primitives (all new blocks join the existing `ReadingLessonBlock` discriminated union)

These extend `ReadingLessonBlock` in `src/types/training.ts:375–382`. Adding a new `kind` is a type-level operation that forces an exhaustive switch in `ReadingLesson.tsx` — that's the existing pattern and we keep it.

| `kind` | Owns | Required fields | A11y rules | Mobile rules | Acceptance |
|---|---|---|---|---|---|
| `prose` *(exists)* | Plain heading + body. | `heading?`, `markdown`, `anchor_id?` | Real `<a href="#id">` anchor link (only when `anchor_id` set — Slice 10.7 review P2-1) | Word-wrap respected | No change |
| `callout` *(exists)* | "Key takeaway" / "Note" pull-out. | `tone`, `title?`, `markdown` | `aside` element; tone reflected in eyebrow color (red for key takeaway, slate for note) | Full-width on mobile | No change |
| `policy_quote` *(exists)* | Verbatim policy excerpt. | `quote_markdown`, `attribution?`, `policy_ref?` | `<blockquote>` element; `cite` for attribution | No change | Drop wrapper `italic` (Slice 10.7 review P2-4) |
| `inline_check` *(exists)* | Non-graded "quick check" inside reading. | `prompt`, `options[]`, `correct_option_index?`, feedback strings | `role="group"` + `aria-labelledby`; option buttons use `aria-pressed` | Options stack on mobile, full-width | Already covered by Slice 10.7 review P1-3 |
| `collapsible` *(exists)* | Reference panel hidden behind disclosure. | `title`, `markdown`, `default_open?` | `aria-expanded`; panel always rendered with `hidden` attr (P1-4) | No change | Already covered by Slice 10.7 review P1-4 |
| `config_block` *(exists)* | Dark, copyable code/config. | `title?`, `description_markdown?`, `code`, `copy_label?` | `prose-invert` for the description (P1-1); `aria-live` for copy status | Horizontal scroll for the code | Already covered |
| `image` *(exists, extend)* | Image with caption + text equivalent. | `image_ref{}`, `text_equivalent_markdown` | Distinguish `ready-but-no-URL` from `pending` (P2-3) | Full-width image | Slice 10.7 review P2-3 lands the wording |
| `annotated_diagram` **(new)** | An image with labelled callout pins / leader lines / regions (the AWG diagram pattern). | `image_ref{}`, `annotations: { id, label, kind: 'pin'\|'region', position, anchor_section_id? }[]`, `text_equivalent_markdown` | Each pin is a real `<button>` with `aria-describedby` pointing at its panel; full keyboard support; text equivalent is always present | Pins enlarge to 44px tap targets; long-press opens panel; on `< sm` the diagram switches to a numbered list view that mirrors the pins | Two visual modes (interactive diagram on `≥ md`, numbered list on mobile) must be visually verified together. |
| `comparison_table` **(new)** | Sortable / expandable table — the "AWG ↔ amps ↔ application" pattern. | `columns[]`, `rows[][]`, `caption`, `expandable_row_columns?` (which cells expand), `default_sort_column?` | Real `<table>` with `<caption>`, `scope="col"`; row expansion uses `<details>`-style disclosure and `aria-expanded` | On `< sm` the table re-renders as a stack of cards, one card per row, with the header label inline next to each cell value | Snapshot test renders both desktop and mobile variants. |
| `step_list` **(new)** | Numbered procedure with optional sub-detail per step (the "how to terminate Cat 6" pattern). Distinct from `checklist` lesson type (which is gradable). | `intro_markdown?`, `steps[]: { id, title, body_markdown, image_ref? }` | Ordered list semantics; sub-detail uses `details/summary` | Sub-detail collapses on mobile, full on desktop | Renders as authored content, never with a "complete the step" checkbox — that's the checklist lesson's job. |
| `key_value_facts` **(new)** | Definition list — for the "spec sheet" pattern (wire diameter, max amps, max distance, etc.). | `items[]: { term, definition_markdown, source_section_id? }` | Real `<dl>` / `<dt>` / `<dd>` | Single column on mobile, two-column on `sm+` | Replaces the temptation to use a comparison table for 4–6 facts. |

Block kinds that must **not** be added: `raw_html`, `iframe_embed`, `custom_widget`. The contract is "AI emits a kind we already render, or it doesn't render at all."

### 3.4 Knowledge-check primitives

| Component | Owns | Notes |
|---|---|---|
| `KnowledgeCheckFeedback` **(new shared primitive)** | The feedback panel shown after an answer in both `InlineCheckBlock` *and* `Quiz`. | One source of truth for ✓ / ✗ visual treatment + explanation rendering. Today `Quiz.tsx` rolls its own feedback layout; `InlineCheckBlock` in `ReadingLesson.tsx` rolls another. The prototype shows them with identical styling — that's correct, and the primitive enforces it. |
| `QuestionOption` **(new shared primitive)** | A single selectable option (used by Quiz + InlineCheckBlock). | Encapsulates `aria-pressed`, focus ring, selected styling, correct/incorrect styling. Removes the divergence between `ScenarioChoiceCard` (which already does this for scenarios) and the ad-hoc buttons in Quiz / InlineCheck. |
| `KnowledgeCheckResultBadge` **(new)** | "Passed 80% / 100%" pill on the post-quiz summary and on the module-complete card. | Replaces ad-hoc strings in `ModulePlayer` (e.g. "Passed", "Not passed" — line ~388). |

### 3.5 Foundry-side authoring helpers (admin)

Even though the user's brief is learner-side, the only way to *get* prototype-quality content reliably is to give the Foundry typed primitives, not free markdown. These admin-side helpers belong in this design because they're how the AI output stays inside the visual contract.

| Helper | Purpose |
|---|---|
| `BlockKindPalette` | A visible-to-admin list of every supported `kind` (with examples) used in the outline editor and the side-by-side review. Admins see "your generated lesson uses 3 prose, 1 callout, 1 annotated_diagram" — making the cost / coverage visible. |
| `BlockPreviewPanel` | A side-panel preview of an individual block during outline review — identical rendering to the learner. |
| `BlockRegenerationButton` | Per-block regenerate (works with Slice 10.9 / AI Slice C section-level regen). |
| `ProvenanceTrail` | "This lesson cites sections X, Y, Z from doc D" — already partially exists; promote to a shared component. |

---

## 4. Visual contract — what "prototype quality" actually requires

The plan is meaningless unless we can detect when we've drifted off it. The Wire-Gauge prototype embodies the following visual properties; the system must encode them as tested invariants.

### 4.1 Tier-mapped surfaces (no novel tiers)

Every surface maps to one of the existing card tiers in `docs/design-bar.md` §4. New surfaces in this plan:

- **Module overview card** → Tier 2 (featured, `shadow-md`, `p-6 md:p-8`).
- **Module verification banner** → flat, not a card (a strip). No shadow.
- **Reading block** (prose / callout / etc.) → Tier 1 default, except `policy_quote` which uses the slate-50 quote variant already in `ReadingLesson.tsx`.
- **Knowledge check (inline or graded)** → Tier 1 with `border-redex-red/20 bg-redex-red/5` accent.
- **Annotated diagram** → Tier 1 white card *behind* the image; image itself has a slate-200 border (matches existing `ImageBlock`).
- **Completion / module-complete celebration** → Tier 3 hero card, already implemented at `ModulePlayer.tsx:333–384`. **No confetti.** No animation longer than the existing calm fade.

### 4.2 Typography hard rules

The existing scale in `docs/design-bar.md` §2 is sufficient. Two clarifications for the lesson surface specifically:

- **Block heading** (`prose.heading`, `callout.title`, `collapsible.title`, `config_block.title`, `annotated_diagram` caption, `comparison_table` caption) → `text-xl font-semibold tracking-tight text-slate-900` on desktop, `text-lg` on `< sm`.
- **Inline check / quiz question prompt** → `text-base font-semibold text-slate-900`. The eyebrow ("Quick check — not graded" or "Knowledge check") uses `text-xs font-semibold uppercase tracking-[2px] text-redex-red`.

### 4.3 Color usage

The 60/30/10 ratio (white/gray/red) is canon. The plan adds one rule:

- **Verification states use the warning hue, not the red hue.** `unverified` and `draft` banners use amber/warm tokens. Red is reserved for active brand moments (CTAs, eyebrows, knowledge-check feedback). This prevents "everything that needs attention" from collapsing into red soup.

### 4.4 Spacing rhythm

- **Block stack rhythm:** `space-y-5` (existing in `ReadingLesson.tsx`). Promote to a `ReadingBlockStack` wrapper so a new renderer can't accidentally use `space-y-3` and ship a denser-than-bar surface.
- **Lesson-to-lesson rhythm in the player:** the new `LessonFooterBar` sits below the column with `pt-8`.

### 4.5 Interaction polish

- **Focus rings:** every interactive primitive ships with `focus-visible:ring-2 focus-visible:ring-redex-red focus-visible:ring-offset-2`. Slice 10.7 review P3-5 already calls this out for `ReadingLesson`; the new primitives bake it in so it can't drift.
- **Hover:** subtle border darkening, no scale transforms (those break the "weight, not confetti" rule from `docs/design-bar.md` §11).
- **Transitions:** `transition-colors duration-150` ceiling. No spring animations, no entrance animations beyond fade-in of feedback panels.
- **Disclosure:** all expansion / collapse uses CSS `hidden` attribute (Slice 10.7 review P1-4). No height-animation jank.

---

## 5. Acceptance criteria — design

These are the gates a slice must clear to count as "Wire-Gauge quality."

**AC-1.** Every learner-facing surface uses `ReadingColumn`. There is exactly one max-width definition in the codebase for centered reading content. Grep gate: `grep -r "max-w-3xl mx-auto" src/features/learner` returns only `ReadingColumn.tsx`.

**AC-2.** Every new `ReadingLessonBlock.kind` lands with: a frontend renderer, a Zod schema in both `src/features/foundry/ai/aiSchemas.ts` and `supabase/functions/_shared/courseFoundryAiClientServer.ts` (mirrored), a prompt update, a snapshot test, and a Storybook-style visual gallery story.

**AC-3.** `ModuleVerificationBanner` renders for every module-version with `publish_status != 'published'` *or* any constituent lesson block referencing a `source_files` row with `authority_provenance = 'brainstormed'` that hasn't been promoted. The banner state mapping is unit-tested.

**AC-4.** No raw hex outside of `tailwind.config.ts`, `src/index.css`, ADR JSDoc, and migration files. CI enforces via a lint rule (today's brand-token discipline is informal; we make it enforceable).

**AC-5.** Every primitive in §3 passes:
- An axe-core a11y snapshot at default state and at each documented `state`.
- A keyboard-only walkthrough test (`tab` + `enter` + `space` + arrow keys for radiogroup-like primitives).
- A mobile (`< sm`) snapshot.

**AC-6.** No new red hues. No new shadow tiers. No new card border radii. (Lint script: any `rounded-` value not in `{md, lg, xl, 2xl, 3xl, full}` fails review.)

**AC-7.** No animation that exceeds 200ms. CI grep for `duration-300` / `duration-500` / `animate-` (except `animate-pulse` for loading) fails the build.

**AC-8.** Every lesson type renderer has a `data-testid="<type>-lesson"` (the Slice 10.7 review notes the `reading-lesson-v2` testid breaks this pattern — fix during this plan's first slice).

**AC-9.** A representative "Wire Gauge" reference module exists in `src/lib/education/demo-data.ts` (or equivalent) using *only* the typed primitives — no raw `body_markdown`. This is the **visual reference module**: future visual regressions are diffed against its rendered output.

**AC-10.** Pilot smoke: a learner on a 4" iPhone SE can complete a full Wire-Gauge-style module — sidebar collapse, sticky progress, knowledge checks, table expansion, diagram pin tap — without horizontal scroll or a focus trap.

---

## 6. Visual QA strategy

### 6.1 Three layers of defense

1. **Per-primitive snapshot tests** (Vitest + RTL + jsdom). Every primitive in §3 has one snapshot per documented state. Cheap. Catches "someone touched the className of `LessonFooterBar`" regressions.
2. **Reference-module visual diff** (Playwright + a single rendered snapshot of the Wire-Gauge demo module on three viewports: `375`, `768`, `1280`). Run on every PR that touches `src/features/learner` or `src/components/ui`. This is the load-bearing gate. If the Wire-Gauge module renders differently, you broke the visual contract.
3. **Manual visual review checklist** for slice PRs that introduce a new block kind. The checklist is the §4 rules above + a 10-item bullet review per new block — see §6.3.

### 6.2 Why not a full design system documentation site

We're not Vercel. A Storybook would be value-positive but is *not* required by this plan. A single `src/features/learner/components/__visual__/` directory with a `LessonGalleryPage` route (admin-only, dev-only) is sufficient: it renders every primitive in every state on one page, and serves both as the Playwright fixture and the manual review surface. Cheaper than Storybook, lives next to the code, doesn't drift.

### 6.3 Per-PR design checklist (paste into the PR description)

- [ ] Eyebrow present where applicable (`text-sm font-semibold uppercase tracking-[3px] text-redex-red`)
- [ ] No raw hex in the diff
- [ ] No new `rounded-` / `shadow-` / red hue tokens
- [ ] Tier 1 / 2 / 3 mapping noted in the PR description
- [ ] Focus ring on every interactive element
- [ ] `aria-pressed` / `aria-expanded` / `aria-controls` where appropriate
- [ ] Mobile snapshot reviewed
- [ ] No emoji used decoratively
- [ ] No animation > 200ms
- [ ] Renders inside `ReadingColumn` (for learner surfaces)
- [ ] `data-testid` follows the `<surface>-<role>` convention

### 6.4 Automated guards

| Guard | How | Where |
|---|---|---|
| No raw hex | Regex lint on `#[0-9a-fA-F]{3,8}` excluding `.css` / `tailwind.config.ts` / `*.md` | `.github/workflows/ci.yml` step |
| No new red hues | Regex lint on `red-[0-9]` (Tailwind palette) in `src/**/*.tsx` | Same |
| Block exhaustiveness | TypeScript exhaustive switch in `ReadingLesson.tsx` (already enforced via `assertNever` in non-render code paths) | `tsc --strict` |
| No long animations | Regex lint on `duration-(300\|500\|700\|1000)` in `src/**/*.tsx` | CI lint step |
| Single max-width | Regex lint on `max-w-3xl mx-auto` outside of `ReadingColumn.tsx` | CI lint step |

---

## 7. Phased delivery

These slices land on top of the existing Phase 10 roadmap and don't fragment it. Each is shippable on its own.

### Phase A — Foundation (no AI, no new blocks)

- A1. Introduce `ReadingColumn`, `ModuleProgressHeader`, `LessonFooterBar`, `ModuleVerificationBanner`. Refactor `ModulePlayer.tsx` and `LessonScaffold.tsx` to consume them. No behavioural change; pure visual hardening.
- A2. Introduce `KnowledgeCheckFeedback`, `QuestionOption`, `KnowledgeCheckResultBadge`. Refactor `Quiz`, `InlineCheckBlock`, `ScenarioChoiceCard` to consume them.
- A3. Land Slice 10.7 review fixes (P1-1 through P1-4, P2-5) — these are pre-requisites for the visual contract.
- A4. Add the automated guards in §6.4 to CI.
- A5. Create the dev-only `LessonGalleryPage` route at `/admin/_visual/lesson-gallery` (admin role; `import.meta.env.DEV` only) rendering every existing block in every state.

**Acceptance:** A learner sees no visual change. CI gates green. A11y axe-core baseline established for the gallery page.

### Phase B — New block kinds (visual + types)

- B1. `comparison_table` block — type, Zod schema, renderer, snapshot, mobile card fallback, gallery entry.
- B2. `key_value_facts` block — same.
- B3. `step_list` block — same.
- B4. `annotated_diagram` block — type, Zod schema, renderer (interactive + mobile list mode), text-equivalent enforcement.

**Acceptance:** Each block lands in the gallery; the Wire-Gauge reference demo lesson exercises all four.

### Phase C — Foundry generation of new blocks

- C1. Extend the lesson-generation prompts (`prompts.ts` v1.x bump) so the AI knows about the new kinds and picks them appropriately (a "spec sheet" topic should pick `key_value_facts`; a "comparison" topic should pick `comparison_table`).
- C2. Evals: `blockKindCoverage.eval.ts` (modules with multi-fact content use `key_value_facts` more often than long prose), `tableSchemaValidity.eval.ts`, `diagramAnnotationGrounding.eval.ts` (every annotation cites a section_id).

**Acceptance:** A "Wire Gauge"-class topic generated through the Foundry produces a module that, when rendered, looks within 5% (pixel diff) of the prototype on the reference viewport.

### Phase D — Provenance + draft surfaces

- D1. `ModuleVerificationBanner` reads `module_version.publish_status` and any constituent block's `authority_provenance`. Banner state derived in a shared selector.
- D2. `LessonBlockProvenanceCaption` opt-in caption per block; ship the toggle in the admin outline review ("Show provenance to learners — recommended for compliance modules").
- D3. `AuthorityProvenanceBadge` lands in the Source Library and outline review (admin only).

**Acceptance:** A draft Foundry module shows the DRAFT banner. A published module with all-human-authored sources shows nothing. A published module with even one `brainstormed` unpromoted source shows the `unverified` variant.

### Phase E — Polish + pilot readiness

- E1. Mobile passes for the four new blocks (the table is the load-bearing one).
- E2. Playwright reference-module diff lands in CI.
- E3. Per-PR design checklist becomes the PR template default for `src/features/learner/**` changes.

**Acceptance:** A pilot cohort can complete the Wire-Gauge reference module on phone, tablet, and laptop without a visual or interaction defect.

---

## 8. Risks and mitigations

### 8.1 "Component sprawl" — too many primitives
The plan adds ~15 primitives. If they're not well-named or well-discovered, authors will sidestep them and freehand.

**Mitigation:** The `LessonGalleryPage` is the discovery surface (§A5). Every primitive has one entry. Every new lesson PR that doesn't reference a primitive in the gallery gets flagged.

### 8.2 Mobile complexity for `annotated_diagram`
Interactive pins on a 4" screen are hostile.

**Mitigation:** Two visual modes (§3.3). The mobile mode is a numbered list that mirrors the pins. It's not a degraded experience — it's a different valid presentation.

### 8.3 Visual diff brittleness
Playwright snapshot tests routinely fail on minor unrelated changes (font hinting, etc.).

**Mitigation:** Diff threshold set at 1% pixel difference; reference snapshot rebuilt only via explicit `--update-snapshots` flag in the PR. The Wire-Gauge module is small enough (one module, ~6 lessons, ~20 blocks) that a 1% threshold is achievable.

### 8.4 Foundry can't pick the right block kind
AI defaults to prose for everything, defeating the new kinds.

**Mitigation:** Evals in Phase C2. If a topic with `key_value_facts`-shaped source content produces all-prose output, the eval fails the generation and triggers a regeneration with a sharper prompt.

### 8.5 The "DRAFT" banner becomes ambient noise
Every pre-publish module shows it; admins stop reading.

**Mitigation:** Different visual treatment for `draft` (admin-only preview state, calm) vs `unverified` (visible to learners on a published module that contains AI-drafted unpromoted content). The first one is informational. The second one is rare and should stay rare.

### 8.6 Tests block PR throughput
Snapshot + Playwright + axe-core + lint guards add review time.

**Mitigation:** Snapshot tests run inside Vitest (already in CI). Playwright runs only on `src/features/learner/**` or `src/components/ui/**` diffs. Total added CI time: < 90s.

### 8.7 The "centered column" is wrong for some surfaces
Module overview, admin foundry review, mobile drawer — none of these are centered columns.

**Mitigation:** `ReadingColumn` is opt-in. Admin surfaces stay full-width. The rule is "every *learner* reading surface uses it." The component name makes the scope obvious.

### 8.8 Backward compatibility with legacy `body_markdown`
Some lessons in the wild still have only `body_markdown` and no `blocks[]`.

**Mitigation:** Already handled by `ReadingLesson.tsx` (lines ~248–266). The new blocks are additive. The fallback path stays. No migration required.

---

## 9. Why this is the right scope

The user's brief asks for "the visual component system needed to reproduce/beat this quality consistently" without freehanding. The honest answer is:

- We do **not** need a new design system.
- We do **not** need a Storybook.
- We do **not** need to fork `shadcn/ui` or add Radix primitives we aren't using.
- We do **not** need a CSS-in-JS migration.
- We do **not** need a visual editor.

We need:

1. **Three new layout primitives** that capture the column, the progress header, and the footer bar.
2. **Four new block kinds** that capture comparison tables, key/value fact lists, step lists, and annotated diagrams.
3. **Three shared interaction primitives** (`KnowledgeCheckFeedback`, `QuestionOption`, `KnowledgeCheckResultBadge`) so quiz and inline check stop diverging.
4. **One verification banner** that makes draft / AI-drafted state visible without alarmist red.
5. **Five CI guards** that make the brand-token + tier discipline enforceable instead of aspirational.
6. **One dev-only gallery page** that doubles as visual fixture and discovery surface.

That's ≈ 15 components, ≈ 4 type/schema additions, ≈ 5 CI gates, and one demo module. It fits inside the existing Phase 10 roadmap as **Slices 10.13 (Foundation + Banner) → 10.14 (New Block Kinds) → 10.15 (Foundry-aware) → 10.16 (Provenance Surface)**, none of which need to displace Phase 11 / 12 / 13 work.

---

## 10. References

- Visual fidelity bar: [`docs/design-bar.md`](../design-bar.md)
- Brand token decision: [`docs/decisions/006-redex-brand-token-system.md`](../decisions/006-redex-brand-token-system.md)
- Slice 10.7 reading lesson review: [`docs/reviews/slice-10-7-reading-lesson-v2-design-review-2026-05-25.md`](../reviews/slice-10-7-reading-lesson-v2-design-review-2026-05-25.md)
- Phase 10-13 roadmap v2: [`docs/Redex_Education_Phase10-13_Roadmap_v2_20260523.md`](../Redex_Education_Phase10-13_Roadmap_v2_20260523.md)
- Moonshot strategy v2: [`docs/Redex_Education_Moonshot_Strategy_v2_20260523.md`](../Redex_Education_Moonshot_Strategy_v2_20260523.md)
- Build bible: [`docs/redex_education_build_bible.md`](../redex_education_build_bible.md)
- Foundry topic-to-packet design: [`docs/designs/foundry-topic-to-packet-option-b-2026-05-25.md`](./foundry-topic-to-packet-option-b-2026-05-25.md)
- Reading lesson renderer: [`src/features/learner/components/lessons/ReadingLesson.tsx`](../../src/features/learner/components/lessons/ReadingLesson.tsx)
- Lesson scaffold: [`src/features/learner/components/LessonScaffold.tsx`](../../src/features/learner/components/LessonScaffold.tsx)
- Module player: [`src/features/learner/components/ModulePlayer.tsx`](../../src/features/learner/components/ModulePlayer.tsx)
- Domain types: [`src/types/training.ts`](../../src/types/training.ts)
- Brand tokens (CSS): [`src/index.css`](../../src/index.css)
- Tailwind config: [`tailwind.config.ts`](../../tailwind.config.ts)

---

**Report path:** `docs/designs/wire-gauge-quality-native-lesson-system-2026-05-25.md`
