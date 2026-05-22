# Redex Education — Build Blueprint (Architecture Reference)

**Product:** Redex Education — AI-powered training platform at education.redexops.com
**Owner:** Brian Lewis (Speedy)
**Version:** v1.2 · 2026-05-22 — synced to the live Codex/Linear build
**Source:** Synthesis of a 12-agent architecture swarm
**Role of this document:** the deep-architecture *reference*. The *execution spine* is the Codex/Linear roadmap (`docs/2025__redex-education__codex-linear-roadmap-handoff.md`), tracked in the Build Bible. This blueprint supplies the depth the roadmap defers to its later phases — see the §0 cross-reference map. The two documents stay in sync, never fork.
**Build target:** Custom — Vite + React/TypeScript + Tailwind + shadcn/ui, Supabase, Netlify + Cloudflare. Single-tenant (Redex employees only).

---

## 0. Naming & How This Document Relates to the Codex Build

**Product naming** — use consistently (from the Codex roadmap):

| Name | Refers to |
|---|---|
| **Redex Education** | The overall product, repo, and docs |
| **Redex Academy** | The employee-facing learner experience |
| **Redex AI Course Foundry** | The admin-side training-generation engine |
| **Redex Training OS** | The long-term platform vision |

**Two documents, one product.** The Codex/Linear roadmap is the **execution spine** — it builds the product in mock-first vertical slices. This blueprint is the **architecture reference** — it carries the depth the roadmap defers. They must stay in sync. Where this blueprint maps onto the roadmap:

| Blueprint section | Roadmap phase / slice |
|---|---|
| §3 System Architecture | Phase 0 (Slices 0.1–0.2) shell; Phase 8 backend |
| §4 Data Model | Phase 4 (domain types) → Phase 8 (Slice 8.2 schema) |
| §5 Generation Engine | Phase 3 (Source Binder + AI loop) + AI Slices A–C |
| §6 The Course Foundry | Phase 2 (Slices 2.1–2.4) + Phase 3 |
| §7 Learner Experience | Phase 1 (Slices 1.1–1.4) |
| §8 Assessment | Slice 1.4 + Slice 2.4 (criticality / assessment style) |
| §9 Branching Simulations | Phase 3 moonshot backlog (post-MVP) |
| §10 Multimedia Pipeline | Post-MVP (welcome video aside) |
| §11 Gamification | Post-MVP — both docs agree: no leaderboards |
| §12 Curriculum & Paths | Phase 6 |
| §13 Analytics & Reporting | Phase 6 (Slice 6.3) + Phase 7 (Slice 7.4 audit) |
| §19 Brand System | Roadmap §25 / Slice 0.2 design tokens |

The roadmap is correct that the MVP is mock-first and that video, simulations, and gamification are post-MVP — this blueprint's §15 phasing already agreed. Nothing here overrides the roadmap; it deepens it.

---

## 1. Executive Summary

This is the consolidated build plan for a training platform that does two hard things at once:

1. **For the learner** — feels nothing like compliance training. A new hire logs in via a magic link, lands on one welcome screen, and glides page-to-page through bite-sized, interactive lessons with zero navigation confusion. The opposite of the courses everyone hates.

2. **For the admin** — removes the instructional-designer bottleneck entirely. Brian (or any admin) drops in a markdown research/data file, answers a short wizard, and the system auto-generates a complete course or module: written lessons, interactive elements, an adaptive quiz, HeyGen avatar video, ElevenLabs voiceover, and — for high-stakes content — a branching simulation.

The architecture is event-sourced, the AI generation is staged and human-gated, and the whole thing runs for roughly **$190–$550/month** at steady state. The single biggest technical risk — AI hallucinating wrong training content — is contained by a mandatory grounding-validation pass plus a human review gate that is never removed, even in the moonshot phase.

The recommended path is **three phases**: an MVP that ships text + quiz generation in ~5–7 weeks and is genuinely useful on day one; a v2 that adds multimedia; and a moonshot phase that adds branching simulations and adaptive auto-piloting — gated behind real adoption data.

---

## 2. Product Vision & Operating Principles

The 12-agent swarm converged on a tight set of principles that govern every downstream decision:

- **The learner is never asked "what do I do now?"** One primary action per screen, always.
- **Generation is staged, grounded, and human-gated.** The AI teaches *only* what the source markdown contains. Nothing publishes without a human approving it.
- **Ruthless brevity.** Single-concept pages, ~2-minute micro-units, avatar video segments under 90 seconds.
- **Interactivity is woven in, not bolted on.** A knowledge check sits right after the concept it tests — not stacked at the end as a gate.
- **Intrinsic motivation first.** Points and badges are scaffolding tied to the 8 core values, not the point. No public leaderboards in a ~20-person company.
- **A course can mix rigor.** Difficulty is set per module, not per course — one onboarding course can hold an informational HR module and a mission-critical safety module.
- **Every course always has a renderable form.** A failed video render never blocks publication.

---

## 3. System Architecture

### 3.1 Frontend — React / TypeScript / Tailwind, one SPA, three surfaces

| Surface | Purpose | Route group |
|---|---|---|
| **App shell** | Auth gate, role-aware nav, Supabase session provider | `/auth/*` |
| **Course Player** | The learner experience — course/module nav, video, interactives, quizzes, simulations, progress | `/learn/*` |
| **Course Foundry (admin)** | Source Binder intake, the generation wizard, the job dashboard, review/publish, user management, analytics | `/admin/*` |

- **Routing:** React Router with route groups lazy-loaded per surface — learners never download the admin bundle.
- **State:** TanStack Query for all server state (cache, polling, invalidation) + lightweight Zustand for player-local UI state (current slide, quiz attempt). No Redux.

### 3.2 Backend — Supabase

Postgres is the system of record. Edge Functions handle **short, synchronous** work only: `submit-generation-job`, auth/role-claim hooks, enrollment actions, `progress-upsert`, `signed-media-url` (mints short-lived R2 URLs), `quiz-grade`. Supabase Realtime broadcasts job-status and progress changes to the UI.

### 3.3 The hardest problem — async AI generation

Edge Functions time out (~150s). A full course generation (LLM text + interactives + quizzes + HeyGen render + ElevenLabs TTS) takes **many minutes**. Solution — a **durable, staged pipeline on Cloudflare Queues + Workers**:

1. `submit-generation-job` writes a `generation_jobs` row (`status: queued`, JSONB stage map) and pushes a message to a **Cloudflare Queue**.
2. A **consumer Worker** runs the pipeline as discrete, independently-retryable stages: `parse → outline → generate_text → generate_interactives → generate_quizzes → render_voiceover → render_video → assemble → publish_draft`.
3. HeyGen/ElevenLabs are themselves async — the Worker submits a render and **re-enqueues a delayed poll message** rather than blocking. Native Queue retry/backoff; dead-letter queue for failures.
4. After each stage the Worker updates the `generation_jobs` row, so progress is **stage-granular and resumable** — a failed stage retries without redoing completed work.
5. Finished media lands in **R2**; metadata rows go to Postgres.

**Progress tracking:** Supabase Realtime subscription on the job row (with a TanStack Query polling fallback for resilience).

### 3.4 Deployment topology

- **Netlify** — hosts the React SPA (build, CDN, deploy previews, branch deploys).
- **Cloudflare** — Workers (generation pipeline), Queues (job bus), R2 (all media — video/audio/images, zero egress fees), KV (cached published course manifests, invalidated on publish).
- **Supabase** — managed Postgres, Auth, Edge Functions, Realtime.

### 3.5 Auth & roles

- **Supabase Auth**, magic-link / email, single-tenant — domain-restricted signup or admin invite only.
- **Three roles:** `admin` (manage users, generation, publish), `trainer` (author, upload dumps, review drafts), `learner` (consume, take quizzes). Role stored in `profiles`, mirrored into the JWT via a custom access-token hook so RLS reads `auth.jwt()` with no extra query.
- **RLS on every table.** Learners read only `published` content and read/write only their own progress rows. Generation Workers use the service role (never exposed to the browser); all media access goes through short-lived signed R2 URLs.

### 3.6 How this maps to the Codex/Linear build

The roadmap builds **mock-first**: the entire UI (learner + Course Foundry) is built against mock data through its early phases, with Supabase and real AI wired in later. This blueprint's architecture lands in the roadmap's **Phase 3** (Source Binder + AI review loop), **Phase 8** (Supabase integration), and **AI Slices A–C**. When Codex reaches those phases, lock the `generation_jobs` schema and stage enum first — both the Cloudflare Worker and the frontend depend on that contract. Critical path inside the AI/backend phases: schema → job contract → generation Worker → Foundry dashboard → player.

---

## 4. Data Model (Supabase / Postgres)

### Content hierarchy
- **courses** — `id`, `slug`, `title`, `description`, `role_track` (operations/sales/support/admin), `phase` (foundation/role/advanced), `status` (draft/published/archived), `is_continuing_ed`, `recurrence_interval`, `passing_score`, `estimated_minutes`, `created_by`, `published_at`.
- **modules** — `id`, `course_id`→courses, `title`, `sort_order`, `summary`. Unique `(course_id, sort_order)`.
- **lessons** — `id`, `module_id`→modules, `title`, `sort_order`, `estimated_minutes`.
- **content_blocks** — `id`, `lesson_id`→lessons, `block_type` (text/image/video/interactive/simulation/quiz_ref), `sort_order`, `body` JSONB, `media_asset_id`, `simulation_id`. *JSONB for the variable rendering payload; keep `block_type` + FKs as real columns so joins and RLS stay relational.*

### Assessments
- **quizzes** — `id`, `course_id`, `title`, `passing_score`, `max_attempts`, `is_final`.
- **questions** — `id`, `quiz_id`, `prompt`, `question_type`, `sort_order`, `points`, `explanation`.
- **question_options** — `id`, `question_id`, `label`, `is_correct`, `sort_order`, `rationale`.
- **quiz_attempts** — `id`, `quiz_id`, `user_id`, `started_at`, `submitted_at`, `score`, `passed`, `answers` JSONB.

### Identity & assignment
- **app_users** — `id` = `auth.users.id`, `display_name`, `email`, `primary_role_track`, `hire_date`, `is_active`.
- **roles** / **user_roles** — supports a user being both trainer and learner.
- **enrollments** — `id`, `user_id`, `course_id`, `assigned_by`, `assignment_type` (auto_role/manual/path), `due_date`, `status`, `enrolled_at`, `completed_at`. Unique `(user_id, course_id)`.
- **learning_paths** / **path_courses** (`path_id, course_id, phase, sort_order, required`) / **path_enrollments**.
- **prerequisites** — `(course_id, prerequisite_course_id)` self-referencing edge table; DAG enforced in app logic.

### Progress
- **lesson_progress** — `(user_id, lesson_id)` unique, `status`, `last_block_id`, `completed_at`.
- **course_progress** — denormalized rollup, `percent_complete`, `status`, `last_activity_at`; updated by trigger from `lesson_progress` for cheap dashboard reads.
- **certificates** — `id`, `user_id`, `course_id`, `issued_at`, `expires_at`, `serial_no`, `pdf_asset_id`.

### Generation & media
- **generation_jobs** — `id`, `created_by`, `target_course_id`, `source_binder_id`, `source_binder_version`, `status`, `stage_map` JSONB, `output` JSONB, `error`, `cost_cents`, `model_used`, timestamps.
- **media_assets** — `id`, `asset_type`, `r2_key`, `mime_type`, `file_size`, `heygen_video_id`, `source_job_id`.

### Source Binder & approval audit (adopted from the Codex roadmap)
- **source_binders** — `id`, `title`, `description`, `version`, `status`, `created_by`. The persistent, *versioned* home of approved source material. Courses are generated from a binder version, not from a throwaway upload.
- **source_documents** — `id`, `source_binder_id`, `title`, `doc_type` (markdown/pdf/sop/transcript), `raw_content`, `uploaded_by`.
- **source_sections** — `id`, `source_document_id`, `heading`, `body`, `content_hash`, `has_placeholder`. The grounding unit every generated claim cites; `has_placeholder` flags `[PLACEHOLDER]` / `[TODO]` text.
- **generated_content_reviews** — `id`, `lesson_id` / `question_id`, `reviewer_id`, `decision` (approved/edited/regenerate), `notes`, `reviewed_at`. The human-approval record for each generated artifact.
- **acknowledgments** — `id`, `user_id`, `module_id`, `module_version`, `statement`, `acknowledged_at`. Captures "I have read and understood" for informational / compliance modules.
- **audit_logs** — `id`, `actor_id`, `action`, `entity_type`, `entity_id`, `metadata` JSONB, `created_at`. Append-only record of every consequential action (module created, source uploaded, outline approved, module published, assignment created, employee completed).

### Simulations
- **simulations** — `id`, `module_id`, `title`, `persona`, `objective`, `pass_threshold`, `entry_node_id`.
- **sim_nodes** — `id`, `simulation_id`, `node_type` (situation/outcome), `narration`, `is_terminal`, `outcome_quality`.
- **sim_choices** — `id`, `node_id`, `label`, `target_node_id`, `score_delta`, `is_critical_failure`, `feedback`.
- **sim_attempts** — `id`, `user_id`, `simulation_id`, `path` JSONB, `total_score`, `result`, `completed_at`.

### Gamification & events
- **xp_ledger** — append-only: `user_id`, `amount`, `reason`, `source_type`, `source_id`, `created_at`. No learner UPDATE/DELETE.
- **badges** / **badge_awards** (`user_id, badge_id, awarded_at` unique; supports manager/peer awards).
- **streaks** — 1:1 user, `current_streak`, `longest_streak`, `last_active_date`.
- **learning_events** — append-only event store; every dashboard metric is derived from this (see §13).

### Indexes & RLS
Index all FK columns plus hot composites: `enrollments(user_id, status)`, `lesson_progress(user_id, lesson_id)`, `quiz_attempts(user_id, quiz_id)`, `xp_ledger(user_id, created_at)`, `generation_jobs(status, created_at)`, `courses(role_track, status)`. RLS: content tables are SELECT-for-authenticated (published-only for learners), writes admin-only; per-user tables are scoped `WHERE user_id = auth.uid()` with an `is_admin()` OR-clause; progress writes funnel through Edge Functions (service role) so completion logic and XP awards are atomic.

---

## 5. The AI Course-Generation Engine

A 7-stage pipeline. Every intermediate artifact is persisted (keyed by job ID) so any stage can re-run independently.

| # | Stage | In → Out | Approach |
|---|---|---|---|
| 1 | **Ingest & Parse** | Source Binder document(s) → normalized section index | Parse each source document to an AST. Split on headings into ordered **source_sections**, each with a stable `content_hash`, type tag, token count, and a `has_placeholder` flag. This section index is the **grounding corpus** — everything downstream cites section IDs. |
| 2 | **Structure & Blueprint** | block index → course/module/lesson outline + objectives | A reasoning model clusters blocks into a module→lesson hierarchy and drafts Bloom's-taxonomy learning objectives, each linked to its source blocks. Output is structured JSON, cheap to re-run. |
| 3 | **Admin Wizard Interview** | blueprint → `generation_config` | The admin reviews/edits the proposed outline and answers the wizard (§6). Answers parameterize every later prompt. |
| 4 | **Lesson Content Generation** | blueprint + config + blocks → lesson bodies + interactives | Per-lesson, parallelized. Each prompt receives **only that lesson's linked source blocks** plus a closed-content instruction: teach exclusively from supplied blocks. Workhorse model (Sonnet-class); structured output schema. Every section carries source-block citations. |
| 5 | **Assessment / Video / Simulation Generation** | lesson content + config → quiz items, video scripts, sim graphs | Quiz items generated against objectives, tagged to source blocks; video scripts scene-segmented for HeyGen/ElevenLabs handoff; simulation graphs as constrained JSON. |
| 6 | **Grounding Validation & AI Self-Critique** | artifacts + cited sections → pass/flag + critique | Three layers: (a) deterministic — every claim/answer must reference a real source-section ID, orphans auto-fail; (b) LLM-as-judge entailment check — a separate model verifies each statement is *entailed* by its cited sections; (c) **AI self-critique** — the model reviews its own output for weak or ambiguous quiz questions, confusing or overly corporate wording, and missing critical information. Every finding gets a severity; high-severity items **block publish**. All findings surface in an admin-visible self-critique panel — flagged, never silently kept. |
| 7 | **Human Review, Edit & Versioning** | validated draft → published version | Reviewer sees content side-by-side with cited source and validation flags. Inline edit, approve, or **partial regeneration** of a single lesson/question. Immutable versioned rows; editing the source markdown produces a content diff so only changed blocks regenerate — surgical updates, not full rebuilds. |

**Model strategy:** top-tier reasoning model for planning (Stage 2) and judging (Stage 6); mid-tier model for bulk generation (Stages 4–5); plain code for deterministic checks. All prompts share a closed-content system preamble; wizard config values are injected as explicit constraints.

---

## 6. The Course Foundry — Admin Generation Wizard

The admin drops a markdown file into a full-width editor with live preview and drag-drop upload. A "completeness meter" flags gaps ("no learning objectives detected"). The system pre-fills every answer it can infer from the dump — the admin mostly *confirms*. The wizard runs as ~6 short stepped screens with a **"Skip — use smart defaults"** express path and a live cost/time estimate for video generation.

### A. Placement & Identity
- Course or module? — radio · default: Module
- Attach to which course / create new — searchable dropdown · default: prompt
- Title — text, AI-suggested
- Internal description / objectives — textarea, AI-drafted
- Category / tag — multi-select · default: AI-suggested

### B. Audience
- Target role(s) — multi-select of Redex roles · default: All
- New-hire onboarding vs. continuing ed — toggle · default: Continuing Ed
- Assumed prior knowledge — slider: None / Some / Experienced · default: None
- Prerequisite courses — multi-select · default: None

### C. Depth & Length
- Target length — slider: Quick (5m) / Standard (15m) / Deep (30m+) · default: Standard
- Number of lessons/sections — stepper, AI-suggested · default: auto
- Detail level — slider: Overview / Balanced / Comprehensive · default: Balanced

### D. Tone & Presentation
- Tone — segmented: Formal / Conversational / Energetic · default: Conversational
- Reading level — slider: Plain / Standard / Technical · default: Standard
- Include real-world examples/scenarios — toggle · default: On

### E. Media
- Avatar video on/off — toggle · default: On
- Presenter — radio: Brian (culture) / Allie (operational) / Auto-pick by category · default: Auto
- ElevenLabs voiceover on/off — toggle · default: On
- Include images/diagrams — toggle · default: On
- Include branching simulation — toggle · default: Off (auto-suggest On for Mission-Critical)

### F. Assessment
- **Graded test at all?** — toggle · default: On
- **Number of quiz questions** — slider 3–25, AI-suggested · default: 8
- **Difficulty / strictness tier** — segmented: None / Light Check / Standard / Mission-Critical · default: Standard
- Question mix — multi-select: Multiple choice / True-false / Scenario / Short answer · default: MC + Scenario
- Passing score — slider 50–100% · default: 80%
- Retake rules — dropdown: Unlimited / Limited (N) / Lockout + admin reset · default: Unlimited
- Randomize / shuffle questions — toggle · default: On
- Show correct answers — dropdown: Immediately / After pass / Never · default: After pass
- Knowledge checks between lessons — toggle · default: On

### G. Completion & Compliance
- Issues certificate — toggle · default: Off (On for Mission-Critical)
- Due date / deadline — date picker · default: None
- Recurrence (continuing ed) — dropdown: None / Quarterly / Annual / Custom · default: None
- Mandatory vs. optional — toggle · default: Mandatory for onboarding
- Manager sign-off required — toggle · default: Off

### H. Generation Scope
- Generate everything vs. text-only first — radio · default: Everything
- Notify on completion — toggle · default: On

### Review → Publish workflow
After generation: a **Draft Review** screen with a left nav listing every generated asset (lessons, quiz, video scripts, simulation), each individually editable inline. Video/voice render asynchronously with status chips (Queued / Rendering / Ready); a single asset can be regenerated without rebuilding the course. **Module state machine** (from the roadmap): **Draft → Source Added → Questions Complete → Outline Approved → Generated → Self-Critiqued → Needs Review → Blocked → Approved → Published → Archived**. Publish is gated — unavailable while any blocker (missing source, unsupported claim, open high-severity critique) is unresolved. A **Preview as Employee** mode plays the full course. Editing a live course creates a new version with a re-attest prompt for employees who already completed it.

---

## 7. The Learner Experience

### The flow, login → completion
1. **First-run (≤90s).** Magic-link email — no password. First login lands on a personalized welcome screen (not a dashboard): "Welcome to Redex, [First Name]," a 30-second HeyGen message from Brian, one button — **Start Onboarding**.
2. **"My Learning" home.** A vertical stack of large course cards: progress ring, Resume/Start label, time remaining, status pill. Onboarding pinned to top. This is the *only* navigation hub — everything else is linear.
3. **Course player.** Collapsible left rail (module/lesson outline with checkmarks), a wide center reading column (~680px), a persistent bottom bar with **Back / Next** and a thin full-course progress bar.
4. **Lessons.** Short single-concept pages — never an endless scroll. One idea per page: heading, 2–4 short paragraphs, supporting media (avatar video, audio toggle, diagram). Interactive elements woven inline — a knowledge check right after the concept it tests; a simulation where a real decision would occur. Passive → active alternates every 1–2 pages.
5. **Completion.** Confetti micro-animation, avatar congratulations, a shareable completion badge, and a clear "what's next" (next module auto-unlocks).

### The 8 friction-killers
1. **Magic-link auth** — zero passwords.
2. **Resume-where-you-left-off as default** — reopening any course jumps to the last incomplete page, never the table of contents.
3. **Continuous autosave** — every page advance, answer, and video position writes to Supabase (debounced). No save button exists.
4. **One primary action per screen** — exactly one dominant red button; secondary actions stay quiet.
5. **Single-concept pages** — fast visible progress, "Next" is a constant small reward.
6. **Interactivity woven into reading** — low-stakes, immediate-feedback checks that reinforce rather than judge.
7. **Always-visible progress, two layers** — thin course bar (bottom) + per-lesson checkmarks (left rail).
8. **Mobile-first + accessibility** — left rail collapses, Back/Next become full-width thumb buttons, keyboard navigation, captions on all media, WCAG AA contrast, respects reduced-motion.

**Emotional arc:** Welcomed → Oriented → Capable → Engaged → Accomplished.

---

## 8. Assessment & Adaptive Testing

Difficulty is a **per-module rigor tier** set in the wizard. The AI generates a question *bank* (2–3× the served count); learners get a randomized subset per attempt. Completion is always recorded — whether it requires a *passing score* or just an *acknowledgment* depends on the tier.

| Tier | Bloom's level | Question mix | Served / Bank | Pass | Retake rule |
|---|---|---|---|---|---|
| **None (Informational)** | n/a | No graded test; optional 1 attestation item | 0 / 0 | Completion = scroll-to-end + dwell time + attest click | n/a |
| **Light Check** | Remember / Understand | 100% recall MCQ | 3 / 8 | 70% | Unlimited, no cooldown |
| **Standard** | Understand / Apply | 50% recall, 50% application; MCQ + multi-select + 1 matching/order | 5 / 15 | 80% | Unlimited; 15-min soft cooldown after 3rd fail |
| **Mission-Critical** | Apply / Analyze / Evaluate | 30% recall, 40% scenario, 30% multi-select edge cases; ≥2 free-text AI-graded | 8 / 25 | 90% + 100% on flagged critical items | Unlimited; 24h cooldown + module re-review after 3rd fail |

**Question types:** MCQ, multi-select, scenario-based ("what would you do"), drag-to-order, matching, free-text with AI rubric grading (Mission-Critical only; low-confidence scores queue for admin review).

**Quality controls:** (1) teaching explanations are mandatory on *every* option, right and wrong — the generator rejects any question missing per-distractor rationale; (2) source-grounding — each question cites the markdown heading it derives from, verified by a second AI pass; (3) a distractor-quality pass rejects giveaways and bans "all/none of the above"; (4) admin review gate before publish; (5) bank oversampling + per-attempt shuffle defeats answer-sharing; (6) optional adaptive escalation on Mission-Critical (harder items when the learner is doing well, served count fixed for fairness); (7) anti-gaming — cooldowns, dwell-time minimums, and answer-distribution analytics that flag any item everyone passes or fails.

---

## 9. Branching Simulations (high-stakes modules)

A simulation is a **directed node-graph**: 3–5 decision points, 2–4 choices each, every choice leading to a consequence and a score delta. The learner *is* the technician/salesperson; the platform *is* the customer/environment.

- **Data model:** `simulations` → `sim_nodes` (situation/outcome) → `sim_choices` (label, target node, score delta, `is_critical_failure`, feedback) → `sim_attempts` (full path traversed).
- **Auto-generation — hybrid (recommended):** the AI generates a *fixed, finite authored graph once* at course-generation time, stored and then played deterministically. The generation prompt is constrained by a strict JSON schema and hard caps (exactly 3–5 decision nodes, 2–4 choices each, one clearly-best choice per node). Branches **converge** back into shared downstream nodes — a "diamond" lattice, not a full binary tree — capping total nodes at ~12–18. Fully LLM-driven live role-play is rejected (per-play cost, non-reproducible scoring, no analytics, hallucination risk on safety facts).
- **Learner UX:** a focused chat-like "scene" view — persona/objective up front, situation narration, 2–4 choice cards, inline micro-feedback on each choice. **Score stays hidden during play.** Ends on a debrief screen: outcome quality, score vs. threshold, a path recap with "what an expert would do," and one-click replay.
- **Simulation-vs-quiz rule:** *if you can fail it by saying the wrong thing to a person or doing steps out of order, simulate it; if you can fail it only by not knowing a fact, quiz it.* High-stakes modules may carry both.

---

## 10. Multimedia Auto-Generation Pipeline

Five stages: script parsing → asset generation (HeyGen / ElevenLabs / images) → post-processing (captions) → R2 storage → CDN delivery with signed URLs.

- **HeyGen avatar video** — `POST /v2/video/generate` with a fixed `avatar_id` (Brian = culture/welcome, Allie = operational/technical), script, voice, and a `callback_url`. Renders async over several minutes. Webhook is the primary completion signal; a 30–60s poll is the fallback. Downloaded MP4 is re-hosted on R2 (HeyGen URLs expire). Modules kept to ~5 min.
- **ElevenLabs voiceover** — for modules that don't need a full avatar, or narration over diagrams. Use **Flash/Turbo v2.5** (0.5 credit/char) for cost.
- **Images/diagrams** — illustrative `[VISUAL: …]` cues routed to an image model; simple flowcharts rendered as templated SVG/Mermaid (accurate and free).
- **Captions** — WebVTT auto-generated from the source script timestamps; no STT cost; accessibility + searchability.
- **Async/queue** — a `render_jobs` table; a Cloudflare Worker dispatches with concurrency limits; idempotent jobs keyed to module + version. The course publishes only when all module renders are `complete`.
- **Fallbacks** — render fails → 2 retries → degrade to voiceover + slides → degrade to text-only. Every module always has a renderable form; a failed render never blocks publish.

### Cost (verified against current vendor pricing)
- HeyGen standard avatar 1080p ≈ **$1.00/min**.
- ElevenLabs ≈ **$0.18–$0.30 per 1,000 characters** (Flash tier).
- **Typical 5-module course (~25 min):** all-avatar ≈ $25; voiceover-only ≈ $5–7; images ≈ $1. **Realistic blended course: ~$15–28.** (Avatar IV 4K would push to $100+ — not recommended for routine training.)

---

## 11. Gamification & Motivation

Built for **intrinsic motivation first** — Self-Determination Theory's three needs: competence, autonomy, relatedness. In a ~20-person company, relatedness is the strongest and cheapest lever.

**Recommended system:**
- **XP & Levels** — XP for *completion* (never logins or time-on-page). Levels named after a real Redex career progression: Apprentice → Technician → Senior Tech → Master Installer → Mentor. XP is cumulative, never reset.
- **Skill Tracks** — 4–6 themed tracks instead of one global bar; required onboarding is linear, continuing ed lets learners choose which track to advance (autonomy).
- **Badges tied to the 8 core values** — one badge family per value; the centerpiece. Critically, allow **manager- and peer-awarded** value badges for real on-the-job behavior, displayed alongside earned-in-platform ones — this bridges training to actual work.
- **Streaks — soft version only** — a *weekly* "learning habit" streak (not daily), with 1–2 automatic freeze days/month so a busy install week doesn't punish anyone.
- **Real certificates** — dated, shareable, tied to recertification dates.
- **Celebration moments** — confetti on completion, a custom animation on core-value badge unlock, a full-screen "you're now a [Level]" moment. Variable reinforcement keeps it fresh.
- **Recognition feed, not a leaderboard** — a company-wide "Wins" feed of badge unlocks, level-ups, and manager shout-outs.

**Avoid (these backfire):** competitive leaderboards (publicly shame the bottom half of a 20-person org); XP for logins/streaks/time-on-page; hard daily streaks with loss; over-rewarding trivial actions (overjustification effect); mandatory public stats; badge inflation; rewarding speed.

---

## 12. Curriculum Structure & Learning Paths

**5-level model:** Learning Path (assignment unit) → Phase (sequencing band) → Course (master container) → Module (atomic completable unit, one per markdown file). **Track** is a tag/category on courses, not a hierarchy level.

- **Role-based assignment.** One canonical path per role: Operations, Sales, Support, Admin. Each = Phase 1 Foundation (shared 6 modules, authored once, referenced by all paths) + that role's Phase 2 track + Phase 3 Advanced. On hire, `role → default path` via a data-driven mapping table (no deploy needed to add roles).
- **Sequencing — phase-gated, module-flexible.** Cannot start the role track until Foundation is 100% complete; Advanced unlocks after the role track. *Within* a course, modules are ordered but open — learners move freely among modules in an unlocked course rather than hard-locking each. Equipment Knowledge's 6 sub-modules = 6 ordered modules in one course (flat hierarchy).
- **Day one.** Admin creates the user with a role → system auto-enrolls into the resolved path and generates progress records → new hire sees a "Your Path" dashboard with Phase 1 active and Phases 2–3 visibly locked with stated unlock criteria. No manual course-picking.
- **Continuing ed.** Two enrollment types: **Required Path** (finite, gated onboarding) and **Catalog** (browsable library) — the latter split into *Assigned CE* (annual safety refresher, recurring compliance; on interval expiry a fresh enrollment regenerates) and *Elective* (new-product training, self-enroll, no gating).
- **Pipeline integration.** New modules write into an existing master course by markdown frontmatter (`course: equipment-knowledge`, `module_order: 3`); already-enrolled learners get a fresh incomplete progress record and their course completion reopens.

---

## 13. Analytics & Reporting

Everything is computed from a single append-only **`learning_events`** table (event-sourced, fully auditable). Required events: `course_assigned/started/completed`, `module_started/completed`, `lesson_viewed` (+ duration), `quiz_started/question_answered/submitted/passed/failed`, `content_rated/flagged`, `certificate_issued`, `assignment_overdue`, `reminder_sent`, `escalated_to_manager`. Nightly materialized views (`progress_summary`, `course_quality_stats`) keep dashboards fast.

- **Learner view** — "My Learning" home: assigned courses with progress rings, **What's Next**, Overdue/Due-Soon banners, the role-track path map, scores, certificates, recurrence dates.
- **Admin/manager dashboard** — a roster × course **compliance grid**; per-course drill-down with completion rate, avg score, time-on-task, and a **module-by-module drop-off funnel**; a per-learner people view; an overdue queue with escalation status.
- **Per-course quality analytics** — the loop back to better content: a question-difficulty table flagging items with <40% correct as "bad question / unclear content," an abandonment heatmap, a ratings rollup, time anomalies. Output: a ranked "Content Needing Review" list feeding the markdown regeneration workflow.
- **Certification & compliance** — auto-generated PDF certificates (unique cert ID), the immutable `learning_events` log as the audit trail, CSV/PDF exports for HR/insurance audits, per-learner Compliant / At-Risk / Non-Compliant status.
- **Continuing-ed scheduling & escalation** — `recurrence_rule` on assignments; reminder cadence at due-30d/7d/1d/overdue; escalation ladder: overdue → learner reminder; +7d → manager alert; +14d → flagged on the admin compliance report.

---

## 14. Best-in-Class Patterns Adopted

From a competitive scan of Duolingo, Sana, Coursebox, Disco, Synthesia, Colossyan, TalentLMS/Docebo, 7taps, and Articulate:

**Must-have to feel world-class:** one-card-per-source generation (Sana); immediate, tightly-coupled celebration fired *before* the screen dismisses (Duolingo); personal streaks with a grace/freeze day, no public leaderboards; ruthless 2-minute micro-units (7taps); auto-generated branching decision scenarios — the core anti-boredom feature (Articulate, cited 30–50% retention lift); in-video knowledge checks that pause and branch, avatar segments short and conversational (Colossyan); adaptive quizzing + scheduled spaced repetition; mobile-first delivery with progress tracking and completion reporting (table stakes).

**The failure mode to explicitly avoid:** Coursebox-style "raw AI text dumped into cards" that reads like a wiki, not a course. **Every AI-generated card must pass through an interactivity layer before publishing.**

**Nice-to-have / defer:** an AI coach-tutor agent for learner Q&A (Disco model); xAPI awareness for future content imports.

---

## 15. Phased Roadmap

The core risk is auto-generation quality, so the MVP delivers value *without* betting everything on it.

**MVP — text + quiz generation + delivery (~5–7 weeks, ~6–8 blueprints)**
Course/module hierarchy; admin markdown ingest + generation wizard (question count, difficulty, test-or-not); LLM-generated written lessons + adaptive quizzes (text only); grounding validation; human review/edit/publish gate; learner enrollment, magic-link auth, the frictionless player, progress tracking, pass/fail completion records; basic admin dashboard; RLS-secured single-tenant auth. **No avatar video, no voiceover, no branching sims.** This alone replaces ad-hoc onboarding and produces auditable completion records — real value on day one.

**v2 — multimedia + adaptivity (~4–6 weeks, ~5–6 blueprints)**
ElevenLabs voiceover (cheap, low-risk — ship before video to de-risk the audio pipeline); HeyGen avatar video per module + the async render queue; richer interactive elements (drag-match, scenario cards); spaced-repetition continuing-ed scheduling; certificates; manager/role reporting; gamification (XP, levels, value badges, streaks, recognition feed).

**Moonshot — branching simulations + auto-pilot (~6–9 weeks, ~6–8 blueprints)**
Branching decision simulations; adaptive learning paths that re-sequence per learner performance; one-click full-course generation with minimal review; the analytics-driven content-refresh loop. Highest effort, lowest certainty — **gate behind v2 adoption data.**

**Total: ~17–22 blueprints, ~15–22 calendar weeks**, plus a 25–30% buffer for QA/Security fix-loops on AI-generated-content features.

---

## 16. Cost Model

**Steady-state infrastructure:** Supabase Pro ~$25/mo · Netlify $0–19/mo · Cloudflare Workers/Queues/KV/R2 ~$5–10/mo → **~$35–55/mo**.

**To generate one typical 5-module course:** LLM (lessons + quizzes) ~$3–8 · ElevenLabs voiceover ~$3–5 · HeyGen video (~15 min) ~$5–15 · images ~$1 → **~$11–28 all-in.** Cost scales with *iteration* (regeneration after review), not headcount.

**Steady-state monthly run cost:** HeyGen API plan ~$99–300/mo (largest fixed cost, the real exposure) · ElevenLabs ~$22–99/mo · LLM API ~$20–100/mo · infra ~$50/mo → **~$190–550/mo total**, dominated by HeyGen.

---

## 17. Risk Register

| # | Risk | Mitigation |
|---|---|---|
| 1 | **AI hallucination → wrong training content** (liability) | Mandatory human review/publish gate in MVP — never auto-publish. Grounding validation (§5, Stage 6). Cite source spans. Record admin sign-off per module. |
| 2 | **Content QA burden on one admin** | Diff-style review UI, section-level approve, batch editing. Track review time as a metric. |
| 3 | **Single-admin bottleneck** | Multi-admin roles, course templates/cloning, draft-sharing — design the schema for it in MVP even if the UI lands in v2. |
| 4 | **Scope creep kills the moonshot** | Hard phase gates. Moonshot features blocked until v2 adoption metrics hit a threshold. |
| 5 | **HeyGen video-cost blowout** | Cache/reuse rendered video. Require text + voiceover sign-off *before* video render. Monthly spend cap + alerting. |
| 6 | **Generated-quiz quality** (wrong answers, weak distractors) | Quiz-specific validation pass, answer-key verification, learner-flagging of bad questions feeding a fix queue. |
| 7 | **Low learner adoption** | MVP ties completion to real onboarding requirements; manager dashboards; keep modules short. |
| 8 | **Async video pipeline fragility** | Job queue with retries + DLQ. Decouple video from publish — publish text first, attach video when ready. |
| 9 | **Vendor lock-in / API changes** (HeyGen, ElevenLabs) | Abstract media generation behind an internal interface; voiceover-only fallback. |
| 10 | **RLS / data-isolation misconfiguration** | Security-agent RLS review on every blueprint touching learner data; deny-by-default policies. |

---

## 18. Decisions Resolved — All Pre-Build Questions Answered

All six pre-build questions are answered (Brian, 2026-05-22):

1. **HeyGen avatars** — Exist. Brian and Allie avatars are ready; video generation is unblocked.
2. **Identity** — Microsoft 365 shop, no Google Workspace. Auth is **standalone email invite + magic link** — no SSO integration in the MVP. (Microsoft Entra SSO is a clean later add if wanted.)
3. **Roster** — Employees are entered manually by an admin. The MVP needs a simple "Add employee" admin screen (name, email, role); no HR-system sync.
4. **Pilot course** — "HR Onboarding — Who To Contact" — small, informational, no graded test. Proves the pipeline end to end at low risk.
5. **Frontmatter spec** — Recommended schema confirmed in §20. Optional by design — frontmatter pre-fills the wizard; anything omitted, the wizard asks.
6. **Brand** — Redex Brand Guide v1.0 received and applied in §19. Note: the brand red is **#ED1B24** (corrected from the earlier working value).

**Locked scope:** custom build on the standard stack; AI generation goes all the way (text + interactives + quizzes + video + simulations); single-tenant, Redex employees only.

**Build status:** the project is live — building via Codex + Linear in mock-first vertical slices, tracked in the Build Bible. As of 2026-05-22, Slice 0.1 (repo foundation) is complete and Slice 0.2 (App Shell) is underway. This blueprint (v1.2) is the architecture reference the roadmap's Phase 3 / Phase 8 / AI slices draw from — see §0.

---

## 19. Brand System (from Redex Brand Guide v1.0)

**Color palette — the primary three:**

| Token | Hex | RGB | Use |
|---|---|---|---|
| Redex Red | **#ED1B24** | 237, 27, 36 | CTAs, accents, key highlights, progress, the logo arc. Never a full background for large areas. |
| Redex Black | **#000000** | 0, 0, 0 | Body text, headers, dark surfaces. |
| Redex White | **#FFFFFF** | 255, 255, 255 | Default background, breathing space. |

**Color ratio — 60 / 30 / 10:** white-light 60%, black-dark 30%, red accent 10%. This is a natural fit for the learner UI — a predominantly white product, black type, red reserved for the *single primary action per screen*. That constraint is the §7 friction-killer and the brand ratio expressed as the same rule.

**Typography:**
- **Nexa Bold** — all headings (H1 32–40, H2 24–28, H3 18–20px), UI headers, CTA text, the tagline. Load Nexa Bold as a web font; Helvetica/Arial Bold is the system fallback.
- **Bitsumishi** — logo wordmark only. Never used in the app UI.
- **Body & captions** — system sans-serif (Inter / SF Pro / Segoe UI). Body 14–16px Redex Black; captions/labels 10–12px at 60% black.

**Logo:** primary full-color on white; reversed version on dark surfaces; **circle mark only for the favicon / app icon** (32px+). Clear space equal to the height of the "E". Use the provided files — never recreate the logo.

**Voice for AI-generated course content:** authoritative, direct, technical, reliable. The right tone band for training modules is the guide's *Technical Docs* setting — "precise, instructional, zero ambiguity" — eased slightly toward *Internal Comms* warmth for welcome and culture modules. The course generator's tone prompt is seeded from this, not invented per course.

**Implementation:** these values become the Tailwind theme tokens (`redex-red`, `redex-black`, `redex-white`) and one CSS variable set, locked in the first frontend blueprint so every downstream agent inherits them.

---

## 20. Source Markdown Frontmatter Spec (recommended)

**Yes — this is the recommendation.** Each data-dump markdown file opens with an *optional* YAML frontmatter block. Optional is deliberate: a well-prepared dump pre-fills the wizard so the admin barely clicks, but anything omitted simply becomes a wizard question. A raw dump with no frontmatter still works — the wizard just asks everything.

```yaml
---
title: HR Onboarding — Who To Contact
type: module                        # course | module
course: redex-onboarding-foundation # parent course slug (omit when type: course)
module_order: 2                     # position within the parent course
track: foundation                   # foundation | operations | sales | support | admin
roles: [all]                        # all | operations | sales | support | admin
audience: onboarding                # onboarding | continuing-ed
difficulty: none                    # none | light | standard | mission-critical
estimated_minutes: 8
presenter: auto                     # brian | allie | auto (auto = brian for culture, allie for ops)
media: [video, voiceover, images]   # subset of: video, voiceover, images
simulation: false
quiz_questions: 0                    # 0 when difficulty: none
passing_score: null                  # e.g. 80; null when no graded test
certificate: false
recurrence: none                     # none | quarterly | annual
mandatory: true
source_owner: Allie Lewis
version: 1
---
```

**Rules:** `title` and `type` are the only strictly required fields; `course` + `module_order` become required when `type: module`. The wizard always displays the resolved values for confirmation before generation — frontmatter never silently overrides a human. On regeneration, a bumped `version` plus the source-hash diff (§5, Stage 7) drives surgical per-block updates instead of a full rebuild.

---

*Prepared by the Redex CEO co-pilot. Synthesis of 12 specialized architecture agents covering learner UX, the generation engine, admin authoring, full-stack architecture, the data model, assessment, multimedia, gamification, simulations, analytics, curriculum mapping, competitive research, and cost/risk. v1.1 incorporated the Redex Brand Guide v1.0; v1.2 syncs naming, the Source Binder model, audit tables, AI self-critique, and the module state machine to the live Codex/Linear build.*
