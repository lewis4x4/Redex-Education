# Redex Education Glossary

## 1) Brand & product naming

| Name | Use for | Don't use for |
|---|---|---|
| **Redex Education** | Repo, platform, internal docs, public landing context | Learner-facing in-app copy |
| **Redex Academy** | Learner-facing brand, `/learn/*` routes, employee training experience | Admin authoring surfaces or engine internals |
| **Redex AI Course Foundry** | Admin authoring engine, `/admin/*` routes, foundry workflows | Learner UI copy |
| **Redex Training OS** | Long-term platform vision language | Day-to-day UI labels or routine code naming |

See [Decisions (ADR index)](./decisions/README.md) for the rationale behind implementation choices.

## 2) Domain glossary (alphabetical)

### Acknowledgment lesson
A lesson type where learners confirm they have read or understood required material. In roadmap-required types, this aligns with **Acknowledgment** and supports compliance-style completion tracking.

### Assessment / Quiz
A graded learning checkpoint attached to lesson or module flow. The roadmap defines assessment configuration options (No assessment, Light quiz, Standard quiz, Strict quiz, Scenario-based assessment, Acknowledgment only) in Slice 2.4.

### Assignment
Admin action that assigns a published module to a user or role/group, with due-date semantics (roadmap Phase 6, Slice 6.1).

### Audit log
Chronological record of training and publishing actions (module lifecycle, assignment, quiz attempts, completions). Defined in roadmap Phase 7, Slice 7.4.

### Build Bible
`docs/redex_education_build_bible.md`: the phase-by-phase execution ledger for what changed, how it was verified, and known gaps.

### Course
Top-level training container for related modules in the domain model (roadmap Required Types list includes `Course`).

### Course Foundry
Short form for **Redex AI Course Foundry**: the admin-side workflow for generating, reviewing, and publishing training modules.

### Certification ladder
Slice 11.5 certification structure: Foundation Certified → Role Specialist L1 → Role Specialist L2 → Redex Operator Certified. Each tier is earned by competency evidence, not seat time.

### 30/60/90 milestone spine
Visible certification path on the learner dashboard. Each milestone is dated, version-bound, and earned by competency rather than time.

### Generation theater
Slice 10.10 live staged progress display while the Foundry generates a module. It replaces the prior flat 500 ms timer with visible generation stages.

### Grounded corpus
The retrieval corpus Redex Coach may use: approved Drive Source Library documents plus video transcripts tagged `authority: supporting` with `derived_from_section_ids` provenance. Coach retrieves from this corpus only.

### Item bank
The unified competency-tagged `assessment_items` table from Slice 11.2. It feeds video checkpoints (10.6), quizzes (11.3), and spaced boosters (13.4); no surface carries private question sets.

### Knowledge-gap analytics
Slice 11.8 item-level miss-rate view per module. Each high-miss item links to its bound source section and, for video checkpoints, the relevant video timestamp.

### Competency
What an employee can demonstrably do (Slice 11.4). Earned by evidence — passed scenarios, signed practicals, and assessment performance — not by lesson count or seat time.

### Cost telemetry
Generation-pipeline cost fields on `generation_jobs`: `estimated_cost_cents`, `actual_cost_cents`, and `cost_breakdown` as per-stage JSONB. Logging starts even on mock generation in AI Slice C.

### Criticality (Informational / Basic Knowledge / Operational / Compliance / Safety / High-Risk)
Risk/importance classification used in foundry setup and assessment expectations. Roadmap Slice 2.4 defines options directly and groups compliance/safety/high-risk paths under stricter review expectations.

### Lesson
A unit of instruction within a module; typed and structured by lesson content and completion behavior.

### LessonType (`text`, `checklist`, `acknowledgment`, `quiz`, `scenario`, `video`, `coach`, `assignment`, `reflection_prompt`, `practical`, `hotspot_diagram`, `drag_to_order`)
Canonical lesson variant taxonomy established in the training domain types and used to route rendering/behavior. v2 adds `practical`, `hotspot_diagram`, and `drag_to_order`; source code must add matching `LessonContent` variants before those types are rendered in production (`docs/Redex_Education_Phase10-13_Roadmap_v2_20260523.md`, Slice 10.1 / 11.1).

### Manager visibility
Manager-facing reporting capability to see team completion, incomplete/overdue state, progress percentages, and score context (roadmap Phase 6, Slice 6.3).

### Manager attestation
Reviewer sign-off record on a practical lesson. It may carry an optional core-value tag for the Slice 11.6 recognition surface.

### Media richness
Slice 10.12 Foundry setup choice between Standard (voiceover + diagrams) and Premium (HeyGen avatar video). Default is driven by `TrainingType` + `WizardCriticality`.

### Mock auth
Development/demo auth bypass controlled by `VITE_MOCK_AUTH`; allows gated route scaffolds to render without full production sign-in flow.

### Module
A grouped collection of lessons under a course; publish/versioning semantics apply at module level in roadmap Phase 7.

### Outline review
Admin checkpoint where generated module outline is reviewed, edited, approved, or regenerated before full module generation (roadmap Phase 3, Slice 3.1).

### Phase X.Y / Slice
Roadmap execution unit: each slice has a defined goal, likely files, acceptance criteria, and a required Build Bible update.

### Placeholder source policy
Rule that detects placeholders/missing source (`[PLACEHOLDER]`, `[TODO]`, unsupported claims, unclear policy) and blocks publishing until approved content exists.

### Practical lesson
`LessonType: 'practical'` from Slice 11.1. Completion requires a manager / lead-tech attestation rather than learner self-completion.

### Progress record
Learner progress entry for lesson/module state, including completion timestamps and related progress percentages (roadmap Required Types includes `ProgressRecord`).

### Published module
A module that has passed approval gates and is in a publishable/assignable state under the Phase 7 state model.

### Redex Coach
Source-grounded AI tutor planned for Phase 13. It cites approved text and video timestamps, and refuses to answer off-source questions.

### Section-level regeneration
`generation_jobs.job_type: 'section'` plus `target_section_id`. Regenerates only the lessons bound to one source section; AI Slice C makes this first-class from day one.

### Self-critique
AI review step that flags unsupported claims, weak questions, missing references, confusing language, and high-severity blockers before publish (roadmap Phase 3, Slice 3.3).

### Side-by-side review
Admin comparison step that pairs generated content with source references to validate support and approve/regenerate content (roadmap Phase 3, Slice 3.4).

### Source Binder
Structured source input boundary for foundry workflows; references and source sections are modeled in required types and used for generation/review/version-impact flows.

### Source material
Approved input content (markdown/docs/policies) that generated lessons and assessments must trace back to.

### Spaced retrieval booster
Slice 13.4 short 3–4 item check scheduled at roughly 7 / 30 / 90 days after completion. Items come from the Slice 11.2 bank and are weighted toward competencies the learner missed.

### Vertical slice
An end-to-end, testable increment that crosses UI/state/domain boundaries and delivers working user-visible value.

### Versioning
Published content lifecycle behavior where edits to published modules create new versions with tracked metadata (version number, publish date, approver, source/assessment version, completers per version) per roadmap Phase 7, Slice 7.2.

## 3) Technical glossary (alphabetical)

### ADR
Architecture Decision Record: a short, dated design decision doc capturing context, decision, and consequences.

### AuthGate
Route-level auth enforcement scaffold used for `/admin/*` paths with mock-auth bypass support.

### BrowserRouter
React Router v7 browser-history router used at app root in `main.tsx`.

### Education facade
`@/lib/education` public boundary that re-exports domain types and demo data to keep UI consumers off low-level boundaries.

### Hook/provider split
Convention separating context definition, provider component, and public hook into distinct files to improve HMR compliance and test seams.

### Hydration
Restoring persisted client state (for example progress) from `localStorage` during app initialization.

### HeyGen
Avatar video vendor selected for v1 (build-vs-buy: buy). Slice 10.6 uses HeyGen for avatar video generation behind a server-side boundary.

### jest-dom matchers
Testing Library matcher extensions added to Vitest `expect` (e.g., semantic DOM assertions).

### manualChunks
Vite/Rolldown output splitting function that separates dependency groups into stable vendor chunks.

### `noUncheckedIndexedAccess`
TypeScript strictness flag that turns indexed access into `T | undefined`, forcing explicit guards.

### Permission-Policy
HTTP response header that restricts browser feature APIs (camera/microphone/geolocation/etc.).

### pgvector
Postgres vector extension. Slice 13.1 uses it for source-section and transcript-chunk embeddings that power grounded retrieval.

### Provider stack
Ordered root composition in `main.tsx` (`BrowserRouter` → `AuthProvider` → `EducationProvider` → app/toaster).

### Row type / Domain type
Boundary distinction between storage-layer row shapes and application-level domain shapes; mapped at integration boundaries.

### shadcn/ui
Pattern of copying UI primitives into the codebase for local ownership and customization.

### StrictMode
React development mode behavior that intentionally re-runs mount lifecycles to expose side-effect bugs.

### Token (CSS)
Named design-system value (HSL in `:root`) consumed by Tailwind/utilities/components.

### userEvent
High-fidelity Testing Library interaction utility preferred over low-level synthetic event helpers.

### Vendor chunk
Bundled JavaScript output chunk containing third-party dependencies for better caching.

### Vitest
Vite-native test runner used for unit/component tests in this repo.
