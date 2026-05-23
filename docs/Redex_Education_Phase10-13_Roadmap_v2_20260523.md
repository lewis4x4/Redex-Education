# REDEX EDUCATION — PHASE 10+ ROADMAP v2 (CODEX + LINEAR HANDOFF EXTENSION)

## Purpose of This File

This is the **build-ready extension** to the master roadmap (`docs/2025__redex-education__codex-linear-roadmap-handoff.md`). It is drop-in compatible: same slice format, same Linear ticket convention, same Build Bible discipline. Codex should treat it as a continuation of the existing roadmap.

**v2 supersedes v1.** It integrates the verdicts of a five-lens analyst panel (pedagogy, competitive benchmark, product/UX, technical/AI architecture, business/ROI) that stress-tested Brian's own 8-agent swarm document and six candidate enhancements. **Companion:** `Redex_Education_Moonshot_Strategy_v2_20260523.md` — read it first.

It covers:
1. **Part 1 — The Finish Line.** Close-out of the existing roadmap (Phase 8 backend + AI wiring). Launch blocker. No Phase 10+ slice begins until Part 1 is accepted.
2. **Parts 2–5 — Phases 10–13.** The new phases: lesson-experience engine, competency certification, field-readiness, adaptive layer.

---

## Revision Note — 2026-05-23 (v2)

v2 changes, all from the Round 2 panel. The finish-first sequencing is **unchanged**; net new work is ≈2 slices plus schema/rule additions. Discipline note: the enhancements below are deliberately *absorbed* into existing slices wherever possible — do not let them fragment into a month of separate tickets and delay the pilot.

| Round 2 change | Where it lands |
|---|---|
| Cost telemetry on the generation pipeline (the financial meter) — **pulled forward** | AI Slice C (schema columns) + Slice 10.12 |
| Section-level partial regeneration promoted to a first-class job type | AI Slice C |
| Media-richness policy + per-module cost cap | New Slice 10.12 |
| Unified video player component (chapters, timestamp deep-link, checkpoints, transcript sync) | Slice 10.6 (reframed) |
| Inline video knowledge-checkpoints (E4) — **absorbed, not a new ticket** | Slice 10.6 |
| Video transcript captured into the grounded corpus (E2) | Slice 10.6 + Slice 13.1/13.2 |
| 60–120s video-segment guideline (E6) — a rule, not a slice | AI Slice A + Slice 10.6 |
| Collapsibles (reference-only) + monospace config block (E5) — syntax highlighting & tabs dropped | Slice 10.7 |
| Governed embedded images, ingested Drive→Supabase Storage (E5) | New Slice 10.8 |
| Unified competency-tagged item bank | New Slice 11.2 |
| Value-based recognition on manager attestation (E1) — ships at/after pilot | Slice 11.1 + Slice 11.6 |
| Video/transcript staleness on source change | Cross-cutting note + Slice 10.6 |

---

## Sequencing Overview

```txt
PART 1 — THE FINISH LINE (launch blocker)
  Phase 8 close-out + AI wiring (with cost telemetry from day one) + real HR content
        │
        ▼
PHASE 10 — LESSON EXPERIENCE ENGINE        ─┐ interleave; both ship (in
PHASE 11 — COMPETENCY & CERTIFICATION      ─┘ some form) before the pilot
        │
        ▼
      ◆ PILOT — real HR onboarding cohort, measured ◆
        │
        ▼
PHASE 12 — FIELD-READY (mobile + offline)   — may start in parallel once Phase 10 types exist
        │
        ▼
PHASE 13 — REDEX COACH & ADAPTIVE LAYER     — pilot-gated; build only what the pilot proves
```

---

## Linear Setup — New Labels & Milestones

Add to the existing label set: `lesson-engine`, `competency`, `practical`, `mobile`, `coach`, `adaptive`, `ai-generation`, `cost-telemetry`.

Add to the existing milestone set: 8. Backend Live · 9. Course Foundry AI Live · 10. Lesson Experience Engine Ready · 11. Competency & Certification Ready · 12. HR Onboarding Pilot Launched · 13. Field-Ready · 14. Adaptive Layer Ready.

---

# PART 1 — THE FINISH LINE

Goal: make the product **real** — persistent across users, role-secured, powered by real AI in the Course Foundry, and **instrumented for cost from the first generation call**. No Phase 10+ slice begins until Part 1 is accepted.

---

## SLICE 8.3 — Replace Mock Reads With Supabase Reads

### Goal
Replace mock/demo reads with real Supabase reads, behind the existing `@/lib/education` facade.

### End State
Learner dashboard, admin course list, assignments, and progress read from Supabase. The facade surface is unchanged for UI consumers.

### Priority Order
1. Profiles/users. 2. Courses/modules/lessons. 3. Assignments. 4. Progress. 5. Source binders.

### Likely Files
```txt
src/lib/education/index.ts
src/integrations/supabase/queries/*.ts
src/integrations/supabase/db-rows.ts
src/contexts/EducationContext.tsx
```

### Acceptance Criteria
- Learner dashboard, admin course list, assignments, progress all read from Supabase.
- Row→domain mapping stays at the integration boundary (`db-rows.ts`).
- Demo seed data removed from runtime paths only when the real read is stable.
- Build Bible updated.

### Linear Ticket Title
```txt
Supabase: replace mock reads with database reads
```

---

## SLICE 8.4 — Write Flows to Supabase

### Goal
Persist real user actions.

### Flows
Create module draft · add source binder content · save setup answers · save generated outline · save generated lessons · publish module · assign training · save learner progress · save quiz attempt · record acknowledgment.

### Acceptance Criteria
- Key MVP flows persist correctly; no duplicate records on repeated clicks (idempotency guards).
- Errors handled cleanly with user-visible recovery.
- Server-side progress replaces the `localStorage` source of truth (localStorage becomes an offline cache only — see Slice 12.4).
- Build Bible updated.

### Linear Ticket Title
```txt
Supabase: persist course foundry and learner progress flows
```

---

## SLICE 8.5 — Schema Reconciliation & Regenerate Types (CORRECTNESS BUG)

### Goal
Resolve local/remote schema drift and fix the wrong generated types file.

### Background
Three migrations exist; the third (`20260523000100_create_mvp_complete_schema_and_rls.sql`) is not applied remotely — the remote `training_modules` shape differs. `src/integrations/supabase/types.ts` is generated from an **unrelated project** (it contains `devices`, `panels`, `bookings`, `activity_log`) — every typed query against it is type-unsafe. Correctness bug, not cosmetic.

### End State
Local and remote schema match; `types.ts` regenerated from the real schema; all typed queries sound.

### Acceptance Criteria
- A reconciliation migration aligns remote with local; `supabase migration list` is clean.
- `types.ts` regenerated via `supabase gen types` — no `devices`/`panels`/`bookings`.
- `npm run typecheck` passes with the regenerated types in use.
- Build Bible "Database Changes" updated.

### Linear Ticket Title
```txt
Supabase: reconcile schema drift and regenerate database types
```

---

## SLICE 8.6 — Profiles, Roles & Real RLS

### Goal
Replace placeholder open RLS (`for all to authenticated using (true)`) with real role-gated security.

### End State
RLS enforces: learners read only their own assignments/progress; managers read their team; admins access the Foundry. The JWT carries the role claim.

### Likely Files
```txt
supabase/migrations/<new>_rls_role_policies.sql
supabase/functions/custom-access-token-hook/index.ts
src/hooks/use-auth.tsx
src/components/auth/AuthGate.tsx
```

### Data Requirements
`profiles` populated for all real users. A custom-access-token hook mirrors `profiles.role` into the JWT claim. A `SECURITY DEFINER is_admin()` / `is_manager_of()` helper backs the policies.

### Acceptance Criteria
- Role-specific RLS on every table — no `using (true)` placeholders remain.
- A learner JWT cannot read another learner's progress or any Foundry table.
- A manager JWT reads only their team.
- `AuthGate` enforces real role checks, not just session presence.
- Build Bible updated.

### Linear Ticket Title
```txt
Supabase: add profiles, role claims, and role-gated RLS
```

---

## AI SLICE A — Prompt Registry

### Goal
A central, versioned prompt registry for all Course Foundry generation steps.

### Prompts
Source analysis · setup-question inference · outline generation · lesson generation (one per lesson type — see Phase 10) · assessment generation · self-critique · regenerate-with-fixes.

### v2 Additions
- Every lesson-generation prompt embeds the closed-content preamble: *"Teach exclusively from the supplied approved source blocks. Never invent Redex policy. If source is missing, placeholder, unclear, or unsupported, flag it — do not generate fake policy."*
- The **video-script prompt** embeds the segment rule: *one segment = one idea, target 60–120 seconds, split on semantic boundaries — never a hard mid-thought cut* (E6).
- A **regenerate-with-fixes / section-regeneration prompt** scoped to a single source section (supports the partial-regeneration job type in AI Slice C).

### Likely Files
```txt
src/features/foundry/ai/prompts.ts
src/features/foundry/ai/promptTypes.ts
```

### Acceptance Criteria
- Prompts centralized and individually versioned (version stored on generated artifacts for audit).
- Closed-content preamble and segment rule present.
- Prompts require per-claim source citation and prohibit invented Redex policy.
- Build Bible "AI Prompt Changes" updated.

### Linear Ticket Title
```txt
AI: create Course Foundry prompt registry
```

---

## AI SLICE B — AI Service Interface

### Goal
A provider-agnostic AI client abstraction.

### Interface
`analyzeSource` · `generateOutline` · `generateLessons` · `generateAssessment` · `critiqueModule` · `regenerateWithFixes` · `regenerateSection`.

### Acceptance Criteria
- `mockAiClient` implements the interface and preserves dev/test behavior.
- Every step emits JSON validated against existing Zod schemas.
- UI calls the interface, never a vendor SDK directly.
- Build Bible updated.

### Linear Ticket Title
```txt
AI: create Course Foundry AI service interface
```

---

## AI SLICE C — Secure Staged Generation Pipeline (+ Cost Telemetry + Partial Regeneration)

### Goal
Build the real, secure, server-side generation pipeline as a durable staged job — instrumented for cost and capable of section-level regeneration from day one.

### Background
Supabase Edge Functions time out (~150s); a full module generation runs minutes. Generation must be a durable staged job. **Round 2 finding:** cost telemetry and partial regeneration must be in this schema from the start — retrofitting either later is painful, and the cost meter must exist before real AI is ever switched on.

### End State
`submit-generation-job` writes a `generation_jobs` row and enqueues work; a `pg_cron`-driven worker processes stages — `parse → outline → generate_lessons → generate_assessments → self_critique → assemble` — each independently retryable. The Foundry polls job status. A job may target a full module or a single source section.

### Likely Files
```txt
supabase/functions/submit-generation-job/index.ts
supabase/functions/generation-worker/index.ts
supabase/migrations/<new>_generation_jobs.sql
src/features/foundry/ai/courseFoundryAiClient.ts
```

### Data Requirements
`generation_jobs` table:
- Core: `id`, `module_id`, `status`, `stage_map` (JSONB), `model_used`, `prompt_version`, timestamps.
- **Cost telemetry (v2):** `estimated_cost_cents`, `actual_cost_cents`, `cost_breakdown` (JSONB — per-stage: parse / outline / lessons / assessments / voiceover / avatar_video).
- **Partial regeneration (v2):** `job_type` (`'full' | 'section'`), `target_section_id` (nullable FK to `source_sections`).
v1 worker: `pg_cron` claim-and-process. Stay Supabase-only — no Cloudflare for v1.

### Acceptance Criteria
- No AI/provider key is ever in the browser bundle — all calls go through edge functions on the service role.
- A failed stage retries without redoing completed stages.
- A full module generation completes without an edge-function timeout.
- Every job records `actual_cost_cents` and a per-stage `cost_breakdown`.
- A `job_type: 'section'` job regenerates only the lessons bound to `target_section_id`, recording its own (small) cost.
- The Foundry shows live job/stage status (feeds Slice 10.11 generation theater).
- `netlify.toml` CSP updated minimally for any new endpoints.
- Build Bible updated.

### Linear Ticket Title
```txt
AI: build secure staged generation pipeline with cost telemetry and section regeneration
```

---

## AI SLICE D — Real Generation Wiring, Source Bindings & Eval Harness

### Goal
Wire real generation end-to-end, write source bindings, and protect grounding with evals.

### Data Requirements
The generator **writes** `module_source_bindings` (module/lesson/claim/question → source file + version + section). Conflicting sources rank by authority (`authoritative` > `supporting` > `context`); equal-authority conflicts are flagged for a human, never auto-resolved. Each generated unit fails if its claim is not entailed by a cited section (LLM-as-judge entailment check).

### Acceptance Criteria
- Generating from the real HR sample source produces grounded lessons with real source bindings.
- Every generated claim/lesson/question has a `module_source_bindings` row; orphaned claims auto-fail.
- Missing/placeholder source produces the missing-source blocker — generation does not fabricate.
- Eval harness runs in CI: grounding rate, placeholder-detection recall, JSON-schema validity, refusal correctness — all above threshold.
- Build Bible updated.

### Linear Ticket Title
```txt
AI: wire real generation with source bindings and eval harness
```

---

## SLICE 9.1 — Real HR Source Content Readiness (PEOPLE-PROCESS — PARALLEL TRACK)

### Goal
Get one genuinely HR-approved Redex onboarding source document into the Drive `_library/`. Not a code slice — a content/people task with the longest lead time in the plan. **Start it the day Slice 8.3 starts.**

### Acceptance Criteria
- One real, HR-approved HR onboarding source document in Drive `_library/` with `authority: authoritative` frontmatter.
- No `[PLACEHOLDER]` / `[TODO]` markers in pilot-required sections.
- Ingests cleanly via `drive-sync` + `parse-source-file`.

### Linear Ticket Title
```txt
Content: ingest first real HR-approved onboarding source document
```

---

## SLICE 9.2 — Docs & Build Bible Reconciliation

### Goal
Reconcile documentation drift — the Build Bible "Current Phase" marker disagrees with the README and architecture doc; a stale source-of-truth misroutes the AI build pipeline.

### Acceptance Criteria
- Build Bible "Current Phase / Current Slice / Completed" reflect true state.
- README, architecture.md, Build Bible agree on phase/status/test counts.
- Glossary updated for new vocabulary (lesson types, competency, certification, item bank).

### Linear Ticket Title
```txt
Docs: reconcile Build Bible and project docs to true state
```

---

# PART 2 — PHASE 10: LESSON EXPERIENCE ENGINE

Goal: kill "Markdown reader with a quiz." Build the rich lesson-type renderers the schema already declares, add the security-trade-native types, build a real video player, upgrade text lessons, teach the Foundry to generate structured content, and put cost governance on media generation.

**Design constraint:** every renderer holds the design bar (`docs/design-bar.md`) — premium, restrained, never childish. A lesson should feel *authored*, not *dumped*.

---

## SLICE 10.1 — Exhaustive Lesson Renderer & Shared Lesson Scaffold

### Goal
Make `LessonContentRenderer` an exhaustive `switch` over every `LessonContent` variant; give every lesson a consistent scaffold.

### End State
`LessonContentRenderer` exhaustively switches on `content.type` — adding a `LessonType` without a renderer is a compile error. Every lesson renders inside a shared scaffold: lesson-type eyebrow, "Lesson X of Y", estimated time, a one-line "what you'll be able to do" objective.

### Likely Files
```txt
src/features/learner/components/LessonContentRenderer.tsx
src/features/learner/components/LessonScaffold.tsx
src/types/training.ts
```

### Acceptance Criteria
- Exhaustive switch; unimplemented types render an explicit branded "coming soon" state, never a gray fallback.
- Every lesson renders inside `LessonScaffold`.
- Build Bible updated.

### Linear Ticket Title
```txt
Lesson Engine: exhaustive lesson renderer and shared scaffold
```

---

## SLICE 10.2 — Guided Checklist & Upgraded Acknowledgment Renderers

### Goal
Build the `checklist` renderer; elevate `acknowledgment` to a real compliance artifact.

### Expected UI
- **Checklist:** each `ChecklistItem` a card with expandable `details_markdown`; satisfying check state; completion gated on `require_all`. The field-procedure workhorse.
- **Acknowledgment:** policy reference rendered with gravity; optional typed-name signature (`required_signature: 'name'`); captured timestamp.

### Likely Files
```txt
src/features/learner/components/lessons/ChecklistLesson.tsx
src/features/learner/components/lessons/AcknowledgmentLesson.tsx
```

### Acceptance Criteria
- Checklist completion respects `require_all`; detail expands/collapses.
- Acknowledgment captures signature (when required) + timestamp; renders policy reference prominently.
- Both hold the design bar and work on mobile widths.
- Build Bible updated.

### Linear Ticket Title
```txt
Lesson Engine: build checklist and upgraded acknowledgment lessons
```

---

## SLICE 10.3 — Branching Scenario Lesson Renderer (CENTERPIECE)

### Goal
Build the `scenario` lesson renderer — the single biggest "this is not an LMS" signal. `ScenarioLessonContent`/`ScenarioStep`/`ScenarioChoice` are already typed; only the renderer is missing.

### End State
A learner moves through a branching decision scenario — one decision per screen, framed as a real Redex situation — with immediate per-choice feedback and an outcome summary. An optional worked-example intro step precedes the first decision (cognitive-load management for entry-level hires).

### Expected UI
- Optional worked-example intro (narrated correct walkthrough).
- One decision per screen; `prompt_markdown` framed as a real situation.
- `ScenarioChoice` cards; immediate `feedback_markdown` — coaching tone, no score-shaming.
- `outcome_summary_markdown` recap.

### Likely Files
```txt
src/features/learner/components/lessons/ScenarioLesson.tsx
src/features/learner/components/lessons/ScenarioChoiceCard.tsx
```

### Acceptance Criteria
- Branching graph navigates correctly; every choice yields explanatory feedback tied to source.
- Outcome summary renders; wrong paths are recoverable.
- Works on mobile, thumb-first.
- Build Bible updated.

### Linear Ticket Title
```txt
Lesson Engine: build branching scenario lesson type
```

---

## SLICE 10.4 — Hotspot / Diagram Lesson Type (NEW VARIANT)

### Goal
Add a `hotspot_diagram` lesson type — the security-trade-native format competitors cannot author.

### End State
A learner explores an image (wiring panel, camera mount, network rack) with tappable pins; each pin opens a labeled explainer.

### Likely Files
```txt
src/types/training.ts                                  (new LessonType + HotspotLessonContent)
src/features/learner/components/lessons/HotspotLesson.tsx
src/features/foundry/ai/prompts.ts
```

### Data Requirements
New `LessonType: 'hotspot_diagram'`; `HotspotLessonContent` = `image_ref` + `hotspots[]` (normalized x/y, title, `details_markdown`, optional `source_section_id`). Image references resolve from the Drive→Storage image set (Slice 10.8).

### Acceptance Criteria
- Renders an image with tappable pins; each pin opens an explainer.
- Renderer added to the exhaustive switch; touch-sized pins on mobile.
- Build Bible updated.

### Linear Ticket Title
```txt
Lesson Engine: add hotspot/diagram lesson type
```

---

## SLICE 10.5 — Drag-to-Order / Sequence Lesson Type (NEW VARIANT)

### Goal
Add a `drag_to_order` lesson type for procedural recall without a quiz.

### Likely Files
```txt
src/types/training.ts                                  (new LessonType + OrderingLessonContent)
src/features/learner/components/lessons/OrderingLesson.tsx
src/features/foundry/ai/prompts.ts
```

### Data Requirements
New `LessonType: 'drag_to_order'`; `OrderingLessonContent` = ordered `steps[]` (label, optional `detail_markdown`, `source_section_id`).

### Acceptance Criteria
- Steps render shuffled; drag and keyboard reordering both work (accessibility).
- Check action reveals correctness per position with feedback; retry allowed.
- Renderer in the exhaustive switch; mobile thumb-first.
- Build Bible updated.

### Linear Ticket Title
```txt
Lesson Engine: add drag-to-order sequence lesson type
```

---

## SLICE 10.6 — Redex Video Player + Interactive Checkpoints + Transcript Capture

### Goal
Replace the `video` stub with one real, reusable **Redex Video Player** component, wire the HeyGen avatar pipeline, embed interactive knowledge-checkpoints, and capture the transcript into the grounded corpus.

### Background — why one slice
Round 2 found that three separate enhancements (E2 transcript, E4 video checkpoints, E6 segment rule) all depend on one component that does not exist. Spec and build the player **once** here — chapter markers, timestamp deep-linking (`?t=`), inline checkpoint cards, transcript sync — or the team builds three half-players. Video is generated **only from an already-approved lesson script** — it sits *after* human review; the human approves the script, never the rendered avatar video.

### End State
Video lessons play in the Redex Video Player with chapters, a synced transcript, and inline knowledge-checkpoints. The Foundry submits approved scripts to HeyGen as an async stage. Each video's transcript is captured into the grounded source corpus for Redex Coach.

### Expected UI
- Real player; chapter markers; synced scrollable `transcript_markdown`; poster; resume-from-position; `?t=` deep-link support.
- **Interactive checkpoints (E4):** at a segment boundary the video pauses and a check card replaces the video frame *in place* (no modal). One question, generative-retrieval style, immediate feedback. **Non-punitive** — a wrong answer offers "re-watch that part" (uses the `?t=` jump); it does not lock the learner out. Hard gating (must answer to proceed) is allowed; "must answer *correctly*" is reserved for genuinely safety-critical steps.
- "Download for offline" affordance (feeds Phase 12).

### Likely Files
```txt
src/features/learner/components/video/RedexVideoPlayer.tsx
src/features/learner/components/lessons/VideoLesson.tsx
supabase/functions/heygen-submit/index.ts
supabase/functions/heygen-poll/index.ts
supabase/functions/transcript-ingest/index.ts
supabase/migrations/<new>_media_assets.sql
```

### Data Requirements
- `media_assets` table (`heygen_video_id`, `status`, `storage_path`, `duration_seconds`, `cost_credits`). HeyGen render is an async stage: submit → re-enqueue delayed poll → store MP4 in Supabase Storage → write `media_assets` → populate `VideoLessonContent.video_url` with a short-lived signed URL. Avatar (Brian = founder/culture, Allie = trainer/ops) selectable per module/segment.
- `VideoLessonContent` gains `checkpoints[]` — each `{ at_seconds, question }` (question drawn from the Slice 11.2 item bank where available).
- **Transcript capture (E2):** the transcript is written into the grounded corpus as a **synthetic source document** — `authority: 'supporting'` (never `authoritative`), chunked by segment with timestamps preserved, and carrying a `derived_from_section_ids` link to the source sections the script was generated from (see Slice 13.1). This makes video content citeable by Redex Coach without letting a machine paraphrase pose as an independent source.
- **Staleness:** transcript chunks and `media_assets` are version-bound to the source they derive from. When that source changes (existing roadmap Slice 7.3), the video and its transcript chunks are flagged stale alongside the lessons — extend 7.3's impact computation to cover them.

### Acceptance Criteria
- One `RedexVideoPlayer` component serves all video; chapters, transcript sync, and `?t=` deep-link all work; resumes from last position.
- Inline checkpoints pause playback in place, are non-punitive, and a wrong answer offers a segment re-watch.
- HeyGen submission runs as an async stage; a render failure is retryable and visible.
- The transcript is captured into the corpus as a `supporting`-authority synthetic document with `derived_from_section_ids` provenance and timestamped chunks.
- HeyGen credit cost is recorded in `media_assets.cost_credits` and surfaced in the wizard (feeds Slice 10.12).
- Build Bible updated.

### Linear Ticket Title
```txt
Lesson Engine: build Redex video player with interactive checkpoints and transcript capture
```

---

## SLICE 10.7 — Upgraded Reading Lesson (Text Lesson v2)

### Goal
Make the `text` lesson a designed reading experience, not raw markdown.

### End State
Text lessons render structured blocks: section anchors, "Key takeaway" callout cards, policy language in a distinct quoted treatment, inline non-graded "quick check" chips, **reference collapsibles**, and a **copyable monospace config block**.

### Expected UI
- Structured blocks, not an undifferentiated wall of text.
- Tier-1 callout cards (thin red left border) for key takeaways; quoted treatment for policy language.
- **Collapsibles (E5):** for *reference and optional depth only* (spec tables, edge cases, "more detail") — **never** for procedure steps or assessed content. Hiding core content defeats first-time learning.
- **Config block (E5):** a copyable monospace block for the narrow real case — network configs, IP schemas, controller commands. This is reference formatting, **not** developer-style language syntax highlighting (dropped) and **not** tabs (dropped — they hide content and fail on narrow screens).
- Inline quick-checks are non-graded and non-blocking.

### Likely Files
```txt
src/features/learner/components/lessons/ReadingLesson.tsx
src/types/training.ts                  (TextLessonContent → blocks[]: prose, callout, policy-quote, inline-check, collapsible, config-block, image)
src/features/foundry/ai/prompts.ts      (lesson generation emits structured blocks)
```

### Data Requirements
Extend `TextLessonContent` from a single `body_markdown` to a `blocks[]` model. The lesson-generation prompt emits structured blocks; collapsibles are tagged `reference` so the generator never places required steps inside one. Reading level targeted at ~8th grade.

### Acceptance Criteria
- Reading lessons render structured blocks; collapsibles hold only reference/optional content.
- A config block renders monospace and is copyable; no developer syntax-highlighting library is added.
- Generated prose hits the target reading level (eval-checked).
- Build Bible updated.

### Linear Ticket Title
```txt
Lesson Engine: upgrade text lessons to structured reading experience
```

---

## SLICE 10.8 — Embedded Source Images (Drive → Storage Ingest)

### Goal
Let lessons embed real images (wiring diagrams, equipment photos, floor plans) safely — a dedicated slice because hot-linking Drive does not work.

### Background
Drive image URLs expire and require auth; `rehype-sanitize` and the Netlify CSP will strip or block them. Images must be **downloaded into Supabase Storage at ingest** and the markdown rewritten to stable Storage URLs.

### End State
`parse-source-file` (which already authenticates to Drive) downloads referenced images into Supabase Storage, rewrites references to Storage URLs, and records them. The reading renderer and hotspot lessons render images with captions and alt text.

### Likely Files
```txt
supabase/functions/parse-source-file/index.ts   (image download + rewrite)
src/features/learner/components/lessons/ReadingLesson.tsx
netlify.toml                                     (CSP img-src widened to the Storage bucket)
```

### Data Requirements
A `source_images` record (source file, Storage path, alt text, caption). `rehype-sanitize` config widened to allow `img` from the Storage origin only.

### Acceptance Criteria
- Images referenced in source markdown are ingested into Supabase Storage; lessons render them from stable URLs.
- Every image has alt text and a caption; images lazy-load (poor wifi); no image is the sole carrier of required information.
- CSP allows the Storage origin and nothing broader.
- Build Bible updated.

### Linear Ticket Title
```txt
Lesson Engine: ingest and embed source images via Supabase Storage
```

---

## SLICE 10.9 — Foundry Generation of Structured Lesson Types

### Goal
Teach the Course Foundry to generate the new structured/interactive lesson types — not just prose. Each type needs its own generation prompt and output schema. **Renderers (10.2–10.8) must exist before the Foundry generates that type.**

### End State
During generation the Foundry selects appropriate lesson types per learning objective and emits valid structured content — checklist, scenario, hotspot, drag-to-order, video script + checkpoints, structured reading — schema-validated and source-bound.

### Likely Files
```txt
src/features/foundry/ai/prompts.ts
src/features/foundry/ai/types.ts
src/features/foundry/schemas/foundrySchemas.ts
src/features/foundry/ai/evals/*
```

### Acceptance Criteria
- The generator produces every structured lesson type, each validated against its Zod schema; invalid output is rejected/regenerated.
- Video-script generation emits segment boundaries + checkpoint questions together (E4/E6).
- Every generated unit is source-bound (`module_source_bindings`).
- Eval harness extended to cover structured-type validity and grounding.
- Build Bible updated.

### Linear Ticket Title
```txt
Foundry: generate structured and interactive lesson types
```

---

## SLICE 10.10 — Foundry Generation Theater

### Goal
Stage the "raw knowledge becomes training" moment — currently a flat 500ms timer.

### End State
While a generation job runs, the Foundry shows an honest, live, staged progression driven by real `generation_jobs` stage state: "Extracting source → Analyzing → Outlining → Drafting lesson 3 of 6 → Self-critiquing → Assembling." Restrained, premium — confidence, not confetti. A calm budget meter (Slice 10.12) fills alongside.

### Likely Files
```txt
src/features/foundry/components/GenerationTheater.tsx
src/features/foundry/components/GenerationStatusBadge.tsx
src/features/foundry/pages/ModuleGenerationPreviewPage.tsx
```

### Acceptance Criteria
- Progress reflects real job/stage state from `generation_jobs`, not a fake timer.
- Stage failures are visible and retryable.
- Holds the design bar; no childish animation.
- Build Bible updated.

### Linear Ticket Title
```txt
Foundry: add staged generation theater
```

---

## SLICE 10.11 — Module Workspace Home & Foundry Progress Rail

### Goal
Give the admin (likely Allie — a content designer, not an engineer) a persistent map of the multi-step Foundry pipeline.

### End State
Each module has a "Module Workspace" home showing pipeline stage, blocker count, source freshness, and generation cost-to-date; a persistent progress rail is visible across all Foundry steps.

### Likely Files
```txt
src/features/foundry/pages/ModuleWorkspacePage.tsx
src/features/foundry/components/FoundryProgressRail.tsx
```

### Acceptance Criteria
- The Module Workspace shows accurate stage, blockers, source freshness, and cost-to-date.
- The progress rail is consistent across all Foundry steps; an admin can resume mid-pipeline without confusion.
- Build Bible updated.

### Linear Ticket Title
```txt
Foundry: build module workspace home and progress rail
```

---

## SLICE 10.12 — Media-Richness Policy & Generation Cost Controls

### Goal
Govern the cost of media generation — the financial control panel for a generative platform. (Cost *telemetry* lands in AI Slice C; this slice builds the *policy and controls* on top of it.)

### Background
Round 2 flagged this as the highest-ROI item: avatar video runs roughly $1–5/min; without governance an internal tool's AI bill is invisible until it arrives. Media choice should be driven by **content type**, not perceived module importance — procedural/spatial content (wiring runs, camera placement) is often taught *better* by annotated diagrams + voiceover than by a talking head; avatar video is strongest for culture, judgment, and "why it matters" framing.

### End State
The Foundry setup wizard offers a **"Media richness" choice** (Standard = ElevenLabs voiceover + diagrams; Premium = HeyGen avatar video), auto-recommended from `TrainingType` + `WizardCriticality` (compliance / culture → Premium; procedural → Standard). A per-module and per-month cost cap acts as a pre-flight gate that **downgrades to voiceover rather than failing**.

### Expected UI
- "Media richness" choice in Foundry setup with the projected cost as a quiet caption, not the headline.
- A calm budget meter in the generation theater (Slice 10.10) that fills as stages run.
- If a module would exceed cap: the theater pauses and offers "Generate remaining segments as voiceover?" — never a hard failure.
- An admin cost view: cost per module, cost per month vs. cap.

### Likely Files
```txt
src/features/foundry/components/MediaRichnessSelector.tsx
src/features/foundry/components/GenerationBudgetMeter.tsx
src/features/admin/pages/GenerationCostPage.tsx
supabase/migrations/<new>_media_policy.sql
```

### Data Requirements
`media_policy` org-config row: `TrainingType` + `WizardCriticality` → allowed media tier; per-module cap; monthly cap. The worker reads it as a pre-flight gate. Cost data comes from `generation_jobs.cost_breakdown` (AI Slice C). Cost logging should begin even on mock generation so the meter is calibrated before real AI goes live.

### Acceptance Criteria
- Setup wizard offers the Media-richness choice with an auto-recommended default by content type/criticality.
- A module exceeding the per-module or monthly cap is downgraded to voiceover with an admin-visible flag — never a hard failure.
- The admin cost view shows cost per module and month-to-date vs. cap.
- The cost meter is populated (from mock generation if real AI is not yet wired).
- Build Bible updated.

### Linear Ticket Title
```txt
Foundry: build media-richness policy and generation cost controls
```

---

# PART 3 — PHASE 11: COMPETENCY, PRACTICAL VERIFICATION & CERTIFICATION

Goal: close the liability gap. Today the platform can mark someone "trained" on a multiple-choice quiz alone. Phase 11 recovers practical verification and the 30/60/90 "Redex Operator Certified" ladder the lean MVP dropped, upgrades assessment beyond recognition testing, and unifies all retrieval practice into one competency-tagged item bank.

---

## SLICE 11.1 — Practical Lesson Type & Manager Attestation

### Goal
Add a `practical` lesson type whose completion requires a second human's sign-off — and let that attestation carry a core-value tag (the basis for recognition, E1).

### Background
Recognition quizzes cannot certify field competence. A practical lesson is completed by a lead tech / manager attesting — not by the learner clicking. The original brief specified hands-on verification ("wire 3 practice panels, pass inspection by a lead tech").

### End State
A learner sees practical instructions and an observation checklist; a lead tech/manager completes and signs the attestation; only then is the lesson complete. The attestation optionally records a **specific observed behavior** tagged to one of Redex's 8 core values — this is the data the recognition surface (Slice 11.6) draws on. No separate "badge" process: recognition rides the attestation that already has to happen.

### Expected UI
- **Learner view:** practical instructions + the observation checklist as visible expectations.
- **Reviewer view:** the observation checklist, pass/fail, notes, typed-name signature, timestamp, and an optional "Recognize a specific behavior" field (free text + one core-value tag — a cited instance, e.g. "re-terminated the cable run at Glenwood without prompting").

### Likely Files
```txt
src/types/training.ts                                       (LessonType 'practical' + PracticalLessonContent)
src/features/learner/components/lessons/PracticalLesson.tsx
src/features/manager/components/PracticalAttestationForm.tsx
supabase/migrations/<new>_manager_attestations.sql
```

### Data Requirements
`PracticalLessonContent` = instructions + observation checklist. `manager_attestations` record (lesson, learner, reviewer, pass/fail, notes, signature, timestamp, optional `core_value_id`, optional `recognition_note`). Completion requires an attestation row. `recognition_created` added to `AUDIT_EVENT_TYPES`.

### Acceptance Criteria
- A practical lesson cannot be completed by the learner alone — it requires a reviewer attestation.
- The attestation records reviewer identity, result, notes, signature, timestamp.
- An optional recognition (behavior + core-value tag) can be captured on the same form; it is never required.
- Attestations appear in the audit log and the manager review queue (Slice 11.6).
- Build Bible updated.

### Linear Ticket Title
```txt
Competency: add practical lesson type with manager attestation
```

---

## SLICE 11.2 — Unified Competency-Tagged Item Bank

### Goal
Build one shared assessment-item bank, every item tagged to a competency — the single retrieval system behind video checkpoints, quizzes, and spaced boosters.

### Background — the strongest Round 2 finding
Without this, video checkpoints (Slice 10.6), quiz pools (Slice 11.3), and 7/30/90 boosters (Slice 13.4) would be three disconnected question sets. With it, a learner who misses a checkpoint on "mantrap sequencing" sees that exact competency resurface in their 7-day booster. It is the connective tissue between the lesson experience and the adaptive engine. **Build it before Slice 11.3 populates pools and before Slice 13.4.**

### End State
A central `assessment_items` bank. Every item is competency-tagged, source-bound, and reusable across any retrieval surface (checkpoint, quiz, booster). Every learner answer is recorded against the item and the competency.

### Likely Files
```txt
src/types/training.ts                          (AssessmentItem, ItemAttempt)
supabase/migrations/<new>_item_bank.sql
src/features/foundry/ai/prompts.ts             (generation emits competency-tagged items)
src/features/learner/lib/itemBank.ts
```

### Data Requirements
`assessment_items` (id, competency_id, item kind — recognition / free-recall / sequencing / confidence-rated / scenario, payload JSONB, `source_section_id`, difficulty). `item_attempts` (item, learner, surface — checkpoint / quiz / booster, correct, confidence, answered_at). Quizzes, checkpoints, and boosters all *draw from* this bank rather than carrying their own questions.

### Acceptance Criteria
- All assessment items live in one competency-tagged, source-bound bank.
- Video checkpoints, quizzes, and boosters all draw from the bank; none carry private question sets.
- Every answer is recorded as an `item_attempt` with its surface, feeding Slice 11.8 and Slice 13.4.
- The Foundry generates competency-tagged items.
- Build Bible updated.

### Linear Ticket Title
```txt
Competency: build unified competency-tagged assessment item bank
```

---

## SLICE 11.3 — Retrieval-Practice Assessment Upgrade

### Goal
Move assessment beyond single-mode recognition multiple-choice. Quizzes draw from the Slice 11.2 item bank.

### Question Kinds
`recognition` (current MC) · `free_recall` (short typed answer, rubric/AI-scored) · `sequencing` (order the steps) · `confidence_rated` (answer + "how sure are you").

### Likely Files
```txt
src/types/training.ts
src/features/learner/components/Quiz.tsx
src/features/learner/components/quiz/*.tsx
src/features/foundry/ai/prompts.ts
```

### Acceptance Criteria
- All four question kinds render and score correctly.
- A quiz draws a varied set from the competency-tagged bank — retakes are not the identical static questions.
- Confidence ratings are stored (confident-and-wrong is a coaching signal).
- Build Bible updated.

### Linear Ticket Title
```txt
Competency: upgrade assessment to retrieval-practice question types
```

---

## SLICE 11.4 — Competency Model & Competency-Based Progression

### Goal
Introduce competencies — what an employee can demonstrably do — and progress against them.

### End State
Modules map to competencies; a competency is earned by demonstrated evidence (passed scenarios + signed practicals + assessment performance), not lesson-count or seat-time.

### Likely Files
```txt
src/types/training.ts                          (Competency, CompetencyEvidence)
supabase/migrations/<new>_competencies.sql
src/features/learner/components/CompetencyProgress.tsx
src/features/foundry/components/CompetencyMappingPanel.tsx
```

### Data Requirements
`competencies`; `module_competencies` mapping; `competency_evidence` (learner, competency, evidence source — lesson / attestation / item_attempt — earned-at).

### Acceptance Criteria
- Modules can be mapped to competencies; the Foundry can suggest mappings.
- A competency is earned only when its required evidence exists.
- The learner dashboard shows competency progress, not just lesson percentage.
- Build Bible updated.

### Linear Ticket Title
```txt
Competency: add competency model and competency-based progression
```

---

## SLICE 11.5 — Certification Ladder & 30/60/90 Milestone Spine

### Goal
Recover the certification ladder: Foundation Certified → Role Specialist L1 → Role Specialist L2 → Redex Operator Certified.

### End State
A learner progresses a visible 30/60/90-day milestone spine; each milestone is a real, dated, version-bound certification record earned by competency, not time.

### Expected UI
A persistent, dignified milestone path (extend the welcome screen's journey track). A milestone earns a restrained certification moment — weight, not confetti. No points, no leaderboards.

### Likely Files
```txt
src/types/training.ts                          (Certification, MilestoneDefinition)
supabase/migrations/<new>_certifications.sql
src/features/learner/components/CertificationLadder.tsx
src/features/learner/pages/LearnerDashboardPage.tsx
```

### Data Requirements
`certifications` (learner, milestone, earned-at, awarding-criteria snapshot, content version). Milestone definitions: required competencies/modules per level.

### Acceptance Criteria
- The four-tier ladder is defined and a learner can progress it.
- A certification is earned only when the milestone's competency requirements are met.
- Certifications are dated and bound to the content version completed.
- The milestone spine is visible on the learner dashboard.
- Build Bible updated.

### Linear Ticket Title
```txt
Competency: build certification ladder and milestone spine
```

---

## SLICE 11.6 — Manager Coaching Loop & Recognition Surface

### Goal
Upgrade the manager dashboard from visibility to action, and add a dignified recognition surface (E1).

### End State
Managers get a review queue (practicals, free-recall, scenarios needing a look), per-learner coaching notes, an auto-flag when a learner fails the same scenario/practical twice, and a quiet "Recognize someone" action. Learners see a restrained Recognition strip.

### Expected UI
- Review queue; per-learner coaching-note field; "needs a conversation" auto-flag.
- **Recognition (E1):** a manager "Recognize someone" action; on the learner dashboard, a single Tier-1 "Recognition" card showing the most recent 1–2 shout-outs as a factual sentence (manager name, core value, one line of cited context). **No counts, no badge wall, no progress-to-next-badge, no confetti.** Peer-originated recognition requires manager co-sign before it posts. Treat it like a Stripe receipt — clean, factual, dignified. **This surface ships at or after the pilot — it must not delay the pilot.**

### Likely Files
```txt
src/features/manager/pages/ManagerDashboardPage.tsx
src/features/manager/components/ReviewQueue.tsx
src/features/manager/components/CoachingNotes.tsx
src/features/manager/components/RecognizeAction.tsx
src/features/learner/components/RecognitionStrip.tsx
```

### Acceptance Criteria
- The review queue surfaces items needing manager action.
- Coaching notes persist per learner; a repeated failure auto-flags "needs a conversation."
- Recognition is manager-originated (or manager co-signed); the learner surface shows no counts or badge walls and holds the design bar.
- Build Bible updated.

### Linear Ticket Title
```txt
Manager: build coaching loop and recognition surface
```

---

## SLICE 11.7 — Pedagogical-Quality Critique Pass

### Goal
Extend the Foundry self-critique to catch content that is source-grounded but pedagogically inert.

### End State
Self-critique adds a pedagogical-quality pass: does each lesson have a worked example where needed? Is the assessment testing recall vs. mere recognition? Are scenario choices decision-forcing or fake? Is a segment too wordy?

### Likely Files
```txt
src/features/foundry/ai/prompts.ts
src/features/foundry/components/SelfCritiquePanel.tsx
src/features/foundry/components/CritiqueIssueCard.tsx
src/types/training.ts                              (new CritiqueIssueCategory values)
```

### Data Requirements
New `CritiqueIssueCategory` values: `weak_assessment_design`, `missing_worked_example`, `inert_content`, `cognitive_overload`, `segment_too_long`.

### Acceptance Criteria
- Self-critique flags pedagogical-quality issues, not only grounding issues.
- High-severity pedagogical issues block publish (consistent with existing blocker behavior).
- Build Bible updated.

### Linear Ticket Title
```txt
Foundry: add pedagogical-quality critique pass
```

---

## SLICE 11.8 — Knowledge-Gap Analytics

### Goal
Close the loop from learner performance back into content quality — at item *and* video-segment resolution.

### End State
Admins see which assessment items learners repeatedly miss, per module — and, because checkpoint misses (Slice 10.6) are recorded as `item_attempts` with `surface: 'checkpoint'`, which exact ~90-second video segments learners fail. That is a sharper SOP-quality signal than end-of-lesson scores.

### Expected UI
Per-module "concepts not landing" view: items ranked by miss rate, each linked to its bound source section, lesson, and (for checkpoints) video timestamp.

### Likely Files
```txt
src/features/admin/pages/KnowledgeGapPage.tsx
src/features/admin/components/ItemMissRateTable.tsx
```

### Acceptance Criteria
- Item-level miss rates aggregate from `item_attempts` across all surfaces (quiz, checkpoint, booster).
- Each high-miss item links to its bound source section, lesson, and video timestamp where applicable.
- This is the only analytics surface built in this phase — no general BI dashboard.
- Build Bible updated.

### Linear Ticket Title
```txt
Analytics: build knowledge-gap (concepts-not-landing) view
```

---

# ◆ PILOT GATE ◆

After Phase 10 and Phase 11 ship (in some form) and real HR source content exists, **run a real HR onboarding pilot with a named first cohort.** Measure: completion rate, time-to-complete, quiz/scenario/checkpoint performance, practical pass rate, generation cost per module, and qualitative feedback. Phase 12 may proceed in parallel; **Phase 13 does not start until pilot data justifies specific slices.** The E1 recognition surface ships at or after this gate, never before it.

---

# PART 4 — PHASE 12: FIELD-READY — MOBILE & OFFLINE

Goal: make the platform usable by the actual workforce — field techs on phones, on job sites, with spotty or no wifi. May begin in parallel once Phase 10 lesson types exist.

---

## SLICE 12.1 — Mobile-First Module Player

### Goal
Make the module player genuinely mobile-first, not desktop-shrunk.

### End State
On phones the left lesson rail collapses to a top progress bar + bottom-sheet outline; controls and targets are sized for gloved hands.

### Likely Files
```txt
src/features/learner/components/ModulePlayer.tsx
src/features/learner/components/ModuleOutlineSheet.tsx
```

### Acceptance Criteria
- The player is fully usable one-handed on a phone.
- The lesson rail collapses to a top bar + bottom-sheet outline on small viewports.
- Back/Next and primary actions are thumb-reachable.
- Build Bible updated.

### Linear Ticket Title
```txt
Mobile: build mobile-first module player
```

---

## SLICE 12.2 — Mobile-First Rich Lesson Types

### Goal
Ensure scenario, hotspot, drag-to-order, checklist, and video-checkpoint lessons are thumb-first, not desktop-then-shrunk.

### Acceptance Criteria
- Hotspot pins, drag handles, scenario choice cards, and video checkpoint cards are touch-sized and usable on a phone.
- Drag interactions have a keyboard/tap-accessible alternative.
- No lesson type degrades or breaks below 380px width.
- Build Bible updated.

### Linear Ticket Title
```txt
Mobile: make rich lesson types thumb-first
```

---

## SLICE 12.3 — Offline Lesson Caching

### Goal
Pre-cache an assigned module so a tech can complete it offline.

### End State
A service worker pre-caches an assigned module's full lesson payload (including video where the learner opts in) while on wifi; lessons render and complete with no connection.

### Likely Files
```txt
src/service-worker.ts
vite.config.ts                       (PWA/service-worker plugin)
src/features/learner/lib/offlineCache.ts
```

### Acceptance Criteria
- An assigned module's lessons load and render fully offline after a wifi pre-cache.
- Video lessons offer explicit "download for offline" rather than silently failing on cellular.
- Cache size is bounded and visible.
- Build Bible updated.

### Linear Ticket Title
```txt
Mobile: add offline lesson caching
```

---

## SLICE 12.4 — Offline Progress Queue & Sync

### Goal
Let learners complete lessons, checkpoints, and quizzes offline, then sync on reconnect.

### End State
Progress, item attempts, and acknowledgments made offline queue locally (extending the existing `redex-education-progress-v1` pattern) and sync to Supabase on reconnect.

### Likely Files
```txt
src/features/learner/lib/offlineQueue.ts
src/contexts/EducationContext.tsx
src/components/layout/ConnectivityIndicator.tsx
```

### Acceptance Criteria
- Lesson completion, item attempts, and acknowledgments succeed offline and persist locally.
- On reconnect, queued events sync without duplicates.
- A quiet, honest indicator shows "Saved — will sync when you're back online."
- No work is ever lost; no hard failure on connection loss.
- Build Bible updated.

### Linear Ticket Title
```txt
Mobile: add offline progress queue and sync
```

---

## SLICE 12.5 — Audio Narration

### Goal
Add audio narration to text/reading lessons (ElevenLabs) — for commutes, job sites, and the literacy range of entry-level field hires.

### Likely Files
```txt
supabase/functions/narration-generate/index.ts
src/features/learner/components/lessons/ReadingLesson.tsx
```

### Acceptance Criteria
- Reading lessons offer play/pause audio narration.
- Narration is generated as an optional Foundry stage from approved lesson text, cached in storage, and its cost recorded in `generation_jobs.cost_breakdown`.
- Narrated audio is included in the offline cache when present.
- Build Bible updated.

### Linear Ticket Title
```txt
Mobile: add audio narration to reading lessons
```

---

# PART 5 — PHASE 13: REDEX COACH & ADAPTIVE LAYER (PILOT-GATED)

Goal: the genuine differentiators — a source-grounded AI tutor that can cite text *and* video, and a spaced-repetition retention layer. **Do not begin until the HR onboarding pilot produces data.** Build only the slices the pilot proves are needed.

---

## SLICE 13.1 — Source Embeddings (pgvector)

### Goal
Make the source corpus — including video transcripts — retrievable for free-form questions.

### End State
`source_sections` (and transcript chunks captured in Slice 10.6) carry embeddings; a retrieval helper returns the most relevant approved sections for a query.

### Likely Files
```txt
supabase/migrations/<new>_pgvector_source_embeddings.sql
supabase/functions/embed-source-sections/index.ts
```

### Data Requirements
`pgvector` extension; `embedding` column on `source_sections` and on transcript chunks; embeddings generated on parse / on transcript capture. Transcript chunks carry the `derived_from_section_ids` provenance link added in Slice 10.6.

### Acceptance Criteria
- Every source section and transcript chunk has an embedding; retrieval returns ranked relevant content.
- Retrieval respects authority ordering (`authoritative` > `supporting` > `context`).
- Build Bible updated.

### Linear Ticket Title
```txt
Coach: add pgvector source embeddings and retrieval
```

---

## SLICE 13.2 — Redex Coach Edge Function & Guardrails

### Goal
Build the source-grounded AI tutor backend with hard, server-enforced guardrails — able to cite text and video.

### Guardrails (all server-side, never client-trusted)
- **Refuse outside approved source.** If retrieval returns nothing above a relevance threshold, Coach answers "I don't have approved content on that" — it never falls back to model knowledge.
- **Cite the section.** Every answer returns the source file + section (or video + timestamp) it drew from.
- **No double-counting provenance.** A transcript chunk and its parent source section (linked via `derived_from_section_ids`) must never be cited together as two independent sources — the retrieval layer deduplicates by provenance so a machine paraphrase cannot pose as corroboration.
- **No quiz-answer leakage.** Coach never receives item-bank answer keys. Before module completion the eligible corpus excludes assessment content and Coach cannot summarize the whole module to bypass required learning; after completion it may answer broader review questions.

### Likely Files
```txt
supabase/functions/redex-coach/index.ts
src/features/foundry/ai/prompts.ts        (closed-content Coach system prompt)
```

### Acceptance Criteria
- Coach answers only from retrieved approved content; off-source questions are refused.
- Every answer cites its source section or video timestamp.
- Transcript/parent-section deduplication is enforced.
- Coach cannot reveal assessment answers or bypass required learning pre-completion.
- A "no approved content" miss is logged (feeds the module-suggestion backlog).
- Build Bible updated.

### Linear Ticket Title
```txt
Coach: build source-grounded tutor edge function with guardrails
```

---

## SLICE 13.3 — Redex Coach In-Lesson Panel

### Goal
Surface Coach as a calm in-lesson help panel.

### End State
Inside a lesson, a learner can open Coach to ask "Explain this more simply," "Where am I," "Who do I contact" — answers cite the source, and a video citation deep-links to the exact timestamp.

### Likely Files
```txt
src/features/learner/components/coach/CoachPanel.tsx
src/features/learner/components/lessons/CoachLesson.tsx
```

### Acceptance Criteria
- Coach opens as a non-intrusive panel within the module player.
- Answers render with their source citation; a video citation deep-links via `?t=` (Slice 10.6 player).
- The panel holds the design bar; calm, not chatty or childish; works on mobile.
- Build Bible updated.

### Linear Ticket Title
```txt
Coach: build in-lesson Coach panel
```

---

## SLICE 13.4 — Spaced Retrieval Boosters

### Goal
Make knowledge stick past week one with spaced retrieval, drawing from the unified item bank.

### End State
After a learner completes a module, the system schedules short booster checks (3–4 items) at ~7- and ~30-day intervals (and ~90 for high-criticality competencies), surfaced on the learner dashboard. Boosters are **weighted toward competencies the learner missed** at video checkpoints or in quizzes (using `item_attempts`).

### Likely Files
```txt
supabase/migrations/<new>_booster_schedule.sql
supabase/functions/schedule-boosters/index.ts   (pg_cron-driven)
src/features/learner/components/BoosterCard.tsx
```

### Data Requirements
`booster_checks` schedule (learner, competency, due-at, items drawn from the Slice 11.2 bank, status). Item selection biases toward the learner's weak competencies from `item_attempts`.

### Acceptance Criteria
- Completing a module schedules 7- and 30-day boosters (90-day for high-criticality competencies).
- Boosters draw from the unified item bank and bias toward the learner's missed competencies.
- Due boosters surface on the learner dashboard as short, low-pressure checks.
- Booster performance feeds knowledge-gap analytics (Slice 11.8).
- Build Bible updated.

### Linear Ticket Title
```txt
Adaptive: add spaced-retrieval booster checks
```

---

## SLICE 13.5 — Light Adaptive Pacing

### Goal
Use performance signals to lightly tailor the path — without overbuilding.

### End State
When a learner repeatedly struggles with a competency, the dashboard recommends a short, focused refresher; strong performers are not slowed down.

### Likely Files
```txt
src/features/learner/lib/adaptiveRecommendations.ts
src/features/learner/components/RecommendedRefresherCard.tsx
```

### Acceptance Criteria
- A repeated competency struggle (from `item_attempts`) surfaces a focused refresher recommendation.
- Recommendations are suggestions, never forced gates.
- No full adaptive-engine complexity — a lightweight rules layer.
- Build Bible updated.

### Linear Ticket Title
```txt
Adaptive: add light performance-based recommendations
```

---

# PART 6 — EXPLICIT BACKLOG — DO NOT BUILD (YET)

Capture in Linear with `backlog` + `deferred`. Each requires a real, named trigger before it earns a slice.

| Item | Why deferred | Trigger to revisit |
|---|---|---|
| Role-Twin / skill-profile engine | Over-engineering for this workforce size | Workforce outgrows a spreadsheet |
| Advanced environmental simulations | Expensive; the scenario lesson type (10.3) captures ~80% of value | A high-risk procedure the scenario type genuinely cannot teach |
| External certification / SCORM export / certificate PDFs | Internal tool; the audit log covers defensibility | A client or regulator explicitly requires it |
| Standalone analytics/BI engine | Completion reporting + knowledge-gap view (11.8) cover the pilot | A reporting need the focused views cannot meet |
| Auto-suggest new modules | Cute, not core | Coach "no approved content" miss logs show a clear repeated pattern |
| Additional source connectors (SharePoint, wiki) | Drive Source Library is sufficient | Real source material lives where Drive cannot reach |
| Leaderboards / streaks-as-mechanic / XP / badge walls | Violates the non-negotiables; bad pedagogy; demoralizes the slowest (newest) hires. Recognition (Slice 11.6) is the sanctioned form — manager-originated, dignified, no counts | Never — explicitly rejected |
| Developer-style syntax highlighting / content tabs | Leaked in from a software-team mental model; Redex techs do not read code; tabs hide content | Never for syntax highlighting; the config block (10.7) covers the real need |
| Multi-tenant / selling the platform externally | Locked decision: single-tenant internal | Out of scope by decision |

---

# CODEX EXECUTION NOTES

1. **Part 1 is a hard gate.** No Phase 10+ slice begins until Part 1 (Phase 8 close-out + AI wiring) is accepted.
2. **Cost telemetry before real AI.** AI Slice C ships the `generation_jobs` cost columns; begin logging cost-per-module even on mock generation. The meter must exist before generation goes live.
3. **Renderer before generator.** For every lesson type, build the renderer (Phases 10.2–10.8) before teaching the Foundry to generate it (10.9).
4. **Exhaustive switch.** After Slice 10.1, adding a `LessonType` without a renderer must be a compile error.
5. **One video player.** Slices 10.6, the E2/E4/E6 work, and Coach's video citations all depend on the single `RedexVideoPlayer` component — build it once.
6. **One item bank.** Video checkpoints (10.6), quizzes (11.3), and boosters (13.4) must all draw from the Slice 11.2 bank — never private question sets.
7. **Source binding is load-bearing.** Every generated unit writes `module_source_bindings`. Transcripts enter the corpus as `supporting` authority with `derived_from_section_ids` provenance — never `authoritative`.
8. **Evals guard grounding.** Prompt changes run against the eval harness in CI; a drop in grounding rate or refusal correctness blocks merge.
9. **Resist fragmentation.** E4 and E6 are absorbed into Slice 10.6 / AI Slice A — they do not get their own tickets. The discipline that keeps the pilot on schedule is not letting enhancements multiply into review cycles.
10. **Recognition ships at/after the pilot** (Slice 11.6 surface) — never before it. Hold the design bar; recognition is dignified and manager-originated, never gamified.
11. **Update the Build Bible every slice.** Hold the design bar (`docs/design-bar.md`) on every new surface. Stay Supabase + Netlify for v1 — no Cloudflare.

---

*End of Phase 10+ roadmap v2. Companion: `Redex_Education_Moonshot_Strategy_v2_20260523.md`. Supersedes the v1 roadmap.*
