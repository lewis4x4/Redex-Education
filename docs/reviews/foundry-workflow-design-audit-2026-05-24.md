# Foundry Author Workflow Design Audit — 2026-05-24

**Scope**: The complete Course Foundry author chain — basics → source → setup questions → outline → module generation preview → AI self‑critique → side-by-side review → publish blockers → publish confirmation — plus the two learner-facing surfaces that consume what the author produced.
**Production URL**: https://redex.education/admin/foundry/*
**Commit at audit**: `8094d67` on `main`
**Auditor**: Read-only design audit (no source changes).
**Coordinating with**: parallel builder lanes (a) new `/admin/onboard` workflow and (b) AssignmentAdminPage + CTA button alignment. This audit stays out of those files.
**References**: `docs/design-bar.md`, `docs/decisions/006-redex-brand-token-system.md`, `docs/Redex_Brand_Guide_v1.0.pdf`, the two admin-dashboard audits at `docs/reviews/admin-dashboard-{design,functional}-audit-2026-05-24.md` (style + severity rubric).

---

## Executive summary

The Foundry author chain is functionally end‑to‑end — basics through publish — but it reads as **nine pages stapled together**, not as a single, narrating product surface. Five things are dragging it down across the whole flow:

1. **There is no Foundry-wide progress indicator.** Each page declares its position in plain text (`REDEX AI COURSE FOUNDRY · STEP 4`, etc.), but the basics page omits "STEP 1", the confirmation page omits a step number, the numbering is wrong (the workflow has 9 visible steps, not 8), and there is no shared visual stepper to ground the admin in *where they are* and *what is left*. Compounding that, the question wizard renders its own 6-step progress bar **inside** Foundry step 3 — so the admin sees `STEP 3` in the eyebrow and `Step 1 of 6` underneath with no relationship between them.
2. **The basics form is asking the wrong things, and the questions step then re-asks them with different semantics.** Audience, criticality, and estimated minutes are each captured in *both* `ModuleBasicsForm` and `QuestionWizard` with different shapes and validation. No field on the basics form asks the one thing a learner-grounded module actually needs: **what the learner should be able to do after this module** (learning outcomes — to be added in basics v2). The admin's literal question — *"are these the questions that should be asked?"* — is "no, not yet".
3. **Brand drift on primary CTAs across the whole flow.** Four CTA buttons (`ModuleBasicsForm` submit, source binder "Browse Source Library" + "Continue → Setup questions", and `QuestionWizard` "Next"/"Submit") bypass `variant="brand"` and use raw `bg-redex-red hover:bg-redex-red-hover` classes — silently dropping `shadow-sm` and `active:bg-redex-red-active`. This is exactly the ADR 006 violation the admin-dashboard audit just flagged on `FoundryEntryCard`, replicated five more times. Until every Foundry CTA routes through `variant="brand"`, the press-state and resting-shadow inconsistency from the admin dashboard will leak through every step of the author flow.
4. **Mock data and engineer language are leaking into customer surfaces.** `'HR Basics at Redex'` is hardcoded as the fallback module title on `PublishConfirmationPage.tsx:35`; `MOCK_PUBLISH_BLOCKERS` renders on `PublishBlockersPage` whenever the draft store is empty; the learner dashboard hardcodes "Sarah Chen", "HR Basics", "Systems & Tools", "Safety & Compliance" with hardcoded progress states; and engineer-internal phrases like `"Coming in Slice 3.2"` (outline-page tooltip) and `"Manual editing in Slice 3.4"` (critique toast) sit on customer-facing tooltips/toasts. The user has already named this anti-pattern explicitly for the assignments card; the Foundry flow has it too.
5. **Two anti-patterns the design bar already prohibits are present in the flow.** `ModuleGenerationPreviewPage` renders the primary CTA as **"✨ Generate Full Module in One Click (Preview Mode)"** — `design-bar §11` says emoji must mean something and treats "Magic Button" gamification as anti-pattern. `ModulePlayer`'s training-complete screen renders a giant 🎉 emoji over a 3xl celebration headline — `design-bar §11` is explicit: *"Certification moments: weight, not confetti. No animations beyond a calm transition."* Both undermine the dignified, source-grounded feel the rest of the product earns.

Everything below is sized so two builders can act on it in parallel:
- **Basics form v2** — slice that lands the learning-outcomes field, removes duplication, and brings the start page to brand parity.
- **AI prompt integration** — slice that flows the new outcomes into outline generation, self-critique gating, and the publish-confirmation summary.

A third "cross-cutting polish" slice catches the workflow-wide stepper, save-state language, and brand-drift fixes; everything else is captured as deferred follow-ups.

---

## Per-page findings

### 1. `src/features/foundry/pages/FoundryStartPage.tsx` — Module basics

The form-archetype entry to the whole workflow. The user's literal question — *"are these the questions that should be asked?"* — lands here.

#### P0-1 — Basics is missing a learning-outcomes field (the most important question)

| Field | Value |
|---|---|
| **What's wrong** | The basics form captures `title`, `parent_course_id`, `audience`, `criticality`, `training_type`, `estimated_minutes` — but **nothing about what the learner should be able to do**. Every downstream stage (outline generation, self-critique, side-by-side review, publish summary, learner preview, learner completion screen) has no learner-outcome anchor to align to. The AI is asked to generate an outline with `learning_objectives` (`CourseOutlineDraft.learning_objectives: string[]`) **without an admin-authored target** to ground against. |
| **Fix** | Add a `learning_outcomes: string[]` field to `ModuleBasicsDraft` and `ModuleBasicsFormValues` (`src/features/foundry/types.ts`), require **exactly 3 entries** in `moduleBasicsSchema` (`src/features/foundry/schemas/foundrySchemas.ts:14-35`), and render in the basics form a fixed-prefix triple input — see "Scope for the basics form v2 builder" below for the exact UI treatment. |
| **Acceptance** | Submitting basics without 3 outcomes shows a field-level validation error. Submitting with 3 outcomes persists them into the draft store and they are visible on every page from setup-questions onward as constant context. |

#### P0-2 — Eyebrow has no step indicator while every other Foundry page does

| Field | Value |
|---|---|
| **What's wrong** | `FoundryStartPage.tsx:23` reads `REDEX AI COURSE FOUNDRY` (no step). `SourceBinderInputPage.tsx:67` reads `REDEX AI COURSE FOUNDRY · STEP 2`. Result: implicit `STEP 1` is unlabeled, breaking the implicit visual stepper. |
| **Fix** | Update `FoundryStartPage.tsx:23` to `REDEX AI COURSE FOUNDRY · STEP 1`. Better: replace the inline eyebrow text with the shared stepper component proposed in cross-cutting finding C-1. |
| **Acceptance** | Eyebrow on the basics page reads `STEP 1` (or, post-stepper, the stepper highlights step 1). |

#### P0-3 — Submit button bypasses `variant="brand"` (same defect as the admin-dashboard CTA)

| Field | Value |
|---|---|
| **What's wrong** | `ModuleBasicsForm.tsx:202-208` builds the submit button with raw classes: `className="bg-redex-red text-white hover:bg-redex-red-hover disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"`. Identical defect to the one being fixed on `FoundryEntryCard` in the parallel CTA-alignment lane — silently drops `shadow-sm` and `active:bg-redex-red-active` (ADR 006 violation). |
| **Fix** | Replace with `<Button type="submit" variant="brand" disabled={!isValid} className="disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">Continue → Add source material</Button>`. |
| **Acceptance** | DevTools computed style shows `box-shadow: var(--tw-shadow)` (shadow-sm), `:active` darkens to `redex-red-active`. Matches `AssignmentsEntryCard`'s computed style at rest, hover, and active. |

#### P1-1 — Heading is a noun phrase with em-dash; the rest of the workflow uses sentence-style headings

| Field | Value |
|---|---|
| **What's wrong** | `FoundryStartPage.tsx:24`: `<h1>New module — basics</h1>`. Other pages: `Add source material`, `Setup questions`, `Review the generated outline`, `Review generated module`, `AI self-critique`, `Side-by-side review`, `Publish blockers`, `Module published`. The em-dash construction here is the only one in the chain. |
| **Fix** | Rename to `Module basics` (parallels `Setup questions`, `Publish blockers`). |
| **Acceptance** | All 9 page H1s follow consistent noun-or-imperative phrasing without em-dash interjections. |

#### P1-2 — Heading uses `text-3xl` with no `md:` step, breaking design-bar typography scale

| Field | Value |
|---|---|
| **What's wrong** | `FoundryStartPage.tsx:24` uses `text-3xl` only. `design-bar §2` specifies operational page titles as `text-2xl md:text-3xl`. Other Foundry pages already use `text-2xl md:text-3xl` (questions, source binder, outline, etc.). |
| **Fix** | Update to `<h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">`. |
| **Acceptance** | Heading renders 24px below `md` breakpoint, 30px at/above. |

#### P1-3 — Subhead uses `text-sm` (14px) not the design-bar body class

| Field | Value |
|---|---|
| **What's wrong** | `FoundryStartPage.tsx:25`: `<p className="text-sm text-slate-600">`. `design-bar §2` specifies body as `text-[15px] text-slate-600 leading-[1.45]`. |
| **Fix** | `<p className="text-[15px] text-slate-600 leading-[1.45]">`. |
| **Acceptance** | DevTools: `font-size: 15px; line-height: 21.75px`. |

#### P1-4 — Save-state language is vague

| Field | Value |
|---|---|
| **What's wrong** | `FoundryStartPage.tsx:42` reads `"Saved as you go"` with a `Save` icon. Implies real-time save but RHF doesn't write to the store until submit. The phrasing also drifts from `design-bar §9`'s recommended `"Your draft is saved automatically"`. |
| **Fix** | Replace with the canonical phrase from `design-bar §9`: `"Your draft is saved automatically."` Once the parallel draft-persistence work is live the claim becomes truthful. Until then, change the copy to `"Your basics will be saved when you continue"` so it doesn't lie about a feature that isn't there yet. |
| **Acceptance** | Reassurance copy matches the design-bar canon and the truth of when the save fires. |

#### P2-1 — Form card is Tier 1 depth but lacks a border

| Field | Value |
|---|---|
| **What's wrong** | `ModuleBasicsForm.tsx:66`: `<div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm md:p-8">` — no `border` class. `design-bar §4` Tier 1 is `rounded-2xl border border-slate-200 bg-white shadow-sm`. |
| **Fix** | Add `border border-slate-200`. |
| **Acceptance** | Card renders with a 1px slate-200 border matching other Tier 1 cards on the same page. |

#### P2-2 — "Cancel" button copy is generic

| Field | Value |
|---|---|
| **What's wrong** | `ModuleBasicsForm.tsx:218-220`: `<Button variant="outline">Cancel</Button>` — leaves the admin uncertain whether unsaved input is discarded. |
| **Fix** | After draft-persistence lands: `Save & exit` (matches the user's request that "Save & exit" be possible on each page). Until then: `Discard & return to dashboard` so the action's destructive nature is clear. |
| **Acceptance** | Cancel/exit affordance accurately reflects current persistence behavior; no admin clicks it expecting save when there is none. |

---

### 2. `src/features/foundry/components/ModuleBasicsForm.tsx` — Module basics form

Same file referenced under page #1. Findings P0-3, P1-1 → P1-4, P2-1 above apply to this component file.

#### P0-4 — Hardcoded `'Cancel'` callback navigates to `/admin` rather than a save-state-aware exit

| Field | Value |
|---|---|
| **What's wrong** | `FoundryStartPage.tsx:39` wires `onCancel={() => navigate('/admin')}`. The user's literal request asks for "Save & exit" to be possible at every step. Today, hitting Cancel mid-basics discards the in-progress input silently. |
| **Fix** | After the parallel draft-persistence work merges, change the wire-up to first call `useFoundryDraftStore.getState().saveDraftAndExit(...)` (the persistence agent's API), then navigate. Until then, prompt confirmation: `Discard this draft and return to the dashboard?`. |
| **Acceptance** | Cancel on a partially-filled basics form does not lose the field values once draft persistence is live. |

#### P1-5 — Field labels use `text-sm font-medium`, not the design-bar form label rhythm

| Field | Value |
|---|---|
| **What's wrong** | The form has 6 labels, each `text-sm font-medium text-slate-900` — fine in isolation, but inconsistent with the question wizard (`QuestionWizard.tsx:80` and similar lines: `text-lg font-semibold tracking-tight` as section headings + `text-sm font-medium` as field labels in the same step). |
| **Fix** | Out of scope for v1.1; flag for the basics-v2 builder to mirror the section-heading + field-label rhythm the wizard uses, so the two adjacent steps feel like one form. |
| **Acceptance** | Captured as a basics-v2 follow-up; see "Scope for the basics form v2 builder". |

---

### 3. `src/features/foundry/schemas/foundrySchemas.ts` — Foundry zod schemas

#### P0-5 — `moduleBasicsSchema` does not include `learning_outcomes`

| Field | Value |
|---|---|
| **What's wrong** | `foundrySchemas.ts:14-35` defines `moduleBasicsSchema` with 6 fields; `learning_outcomes` is not one of them. Until the schema declares the field, RHF/Zustand/Supabase persistence cannot validate or store it. |
| **Fix** | Add: ```ts
learning_outcomes: z
  .array(
    z
      .string()
      .min(3, 'Each outcome must be at least 3 characters')
      .max(120, 'Each outcome must be 120 characters or fewer')
      .trim(),
  )
  .length(3, 'Provide exactly 3 learning outcomes'),
``` |
| **Acceptance** | A `moduleBasicsSchema.safeParse({...without outcomes})` returns an error pointing at the missing/short outcomes array. |

#### P1-6 — `setupAnswersSchema` re-validates fields already validated by `moduleBasicsSchema`

| Field | Value |
|---|---|
| **What's wrong** | `setupAnswersSchema` (`foundrySchemas.ts:54-72`) defines `audience_notes` (max 280, required), `estimated_minutes` (5-300, int), and `criticality` (4 finer values). All three are restatements of fields already captured in basics — with different shapes and validation. This is the structural source of the "the questions step asks me the same thing again" complaint. |
| **Fix** | See cross-cutting finding C-2 below ("Setup questions duplicate basics fields"). Phased: rename `audience_notes` → `audience_detail` (additional context beyond basics audience), make it explicitly optional; drop the duplicate `estimated_minutes` (basics is canonical) or rename to `assessment_duration_override`. The wizard criticality is finer-grained than basics criticality (4 values vs 2) — that one is defensibly a refinement, not a duplicate, but the form copy must explain that. |
| **Acceptance** | The setup-questions step never asks the admin to re-state the audience, criticality, or duration in the same form the admin already typed during basics. The fine-grained wizard criticality is explicitly labeled as a refinement. |

---

### 4. `src/features/foundry/pages/FoundryQuestionsPage.tsx` — Setup questions

#### P0-6 — Page eyebrow says "STEP 3" but the page's own wizard has "Step 1 of 6"

| Field | Value |
|---|---|
| **What's wrong** | `FoundryQuestionsPage.tsx:23`: `REDEX AI COURSE FOUNDRY · STEP 3`. Inside the page, `QuestionWizard.tsx:73-78` renders its own progress bar: `Step 1 of 6` with a fill from `bg-redex-red`. Two competing progress models on one page; neither references the other. Admin sees "STEP 3" up top and "Step 1 of 6" 200px below with no shared meaning. |
| **Fix** | Replace the eyebrow's `STEP 3` with the shared Foundry stepper (cross-cutting C-1). Replace the wizard's own progress bar with a wizard-scoped sub-stepper visually distinct from the Foundry-wide one (e.g., dots instead of a bar). Or: collapse the wizard's 6 steps into a single scrolling form, which removes the nested-progress problem entirely. The audit recommends collapsing — see C-2 below. |
| **Acceptance** | The admin sees exactly one workflow-level progress indicator on the page, plus at most one clearly-subordinate sub-indicator if the wizard remains stepped. |

#### P1-7 — `Setup questions` is not a precise label for what the admin is doing

| Field | Value |
|---|---|
| **What's wrong** | `FoundryQuestionsPage.tsx:24`: `<h1>Setup questions</h1>`. The phrase is generic — could mean "questions to set up the module" or "questions the learner is set up to answer". Combined with the basics-step also having a form (which is technically also "setup questions"), the label confuses the model. |
| **Fix** | Rename to something that names the work, not the form chrome: `Tell the Foundry how to build this`. Or, if shorter is required: `Generation guidance`. |
| **Acceptance** | The page's purpose (steering AI generation behavior) is clear from the heading alone. |

#### P1-8 — Save card appears *after* first submit, with confusing "✓ Answers saved" + Continue layout

| Field | Value |
|---|---|
| **What's wrong** | `FoundryQuestionsPage.tsx:33-43`: after the first time the admin submits the wizard, a separate card appears below the wizard with `"✓ Answers saved"` on the left and `"Continue → Outline preview"` on the right. But submit already triggers `navigate('/admin/foundry/outline')` (line 18). The only path that reaches this card is if the admin returns to the page later. Even then, the card's relationship to the wizard above it is unclear. |
| **Fix** | When the page is re-entered with `setupAnswers !== null`, show the wizard pre-populated in **read-only summary mode** (card-styled list of answers) with an `Edit answers` button and a `Continue → Outline preview` button as the primary action. Don't show both the wizard *and* the saved-state card simultaneously. |
| **Acceptance** | Re-entering the questions page with saved answers shows a clean summary + primary continue CTA, no duplicate wizard below. |

#### P2-3 — "← Back to source binder" cancel target leaks workflow direction

| Field | Value |
|---|---|
| **What's wrong** | `FoundryQuestionsPage.tsx:32`: `onCancel={() => navigate('/admin/foundry/source')}`. "Cancel" on a wizard usually means "discard and exit", not "step back". |
| **Fix** | Replace `onCancel` with two affordances: a footer `← Back to source` link (matches the pattern on outline / preview / etc.) and a separate `Save & exit` button that goes to `/admin`. |
| **Acceptance** | The questions step has both a back-link and an exit affordance; their semantics are clear. |

---

### 5. `src/features/foundry/data/setupQuestions.ts` — Setup-question option labels

#### P1-9 — Helper text mixes voice and audience

| Field | Value |
|---|---|
| **What's wrong** | `setupQuestions.ts:13-32` (`CRITICALITY_OPTIONS`) helper texts: `"Low-stakes content. AI may rephrase freely; no acknowledgment required."`, `"Strict source grounding. Placeholder sections block publishing."`. These describe **what the AI/system will do** — which is right — but mix into a single sentence both AI behavior and policy consequences (blocking publish, requiring approval). The admin can't easily separate "what does the AI do differently?" from "what enforcement do I get?". |
| **Fix** | Restructure each option to two-line helper text: line 1 = AI behavior, line 2 = enforcement. Example for `compliance_high_risk`: `AI behavior: stays inside source text, flags every inference.` / `Enforcement: placeholder sections block publish; admin + safety reviewer approval required.` |
| **Acceptance** | The four criticality options each render two clearly-separated lines under their label. |

#### P2-4 — `QUESTION_GROUP_TITLES` array is exported but never imported

| Field | Value |
|---|---|
| **What's wrong** | `setupQuestions.ts:75-83`: `QUESTION_GROUP_TITLES` ("Module identity", "Audience", "Training type", "Criticality", "Assessment style", "Experience style", "Timing", "Source control", "Approval requirements") — 9 group titles that don't appear in `QuestionWizard.tsx` (which uses 6 inline section titles instead: "Identity & Audience", "Training type & Criticality", "Assessment", "Experience & Timing", "Source control", "Approval"). |
| **Fix** | Either (a) wire `QUESTION_GROUP_TITLES` through `QuestionWizard` as the canonical step titles + remove the inline strings, or (b) delete the unused export. Option (a) is preferred since the array is a clean catalog of what the wizard *should* cover. |
| **Acceptance** | The 9-title catalog is either the single source of truth for the wizard's section headings or it's removed. |

---

### 6. `src/features/source-binder/pages/SourceBinderInputPage.tsx` — Add source material

#### P0-7 — Two CTA buttons bypass `variant="brand"`

| Field | Value |
|---|---|
| **What's wrong** | `SourceBinderInputPage.tsx:84-92` ("Browse Source Library →") uses raw classes `bg-redex-red text-white hover:bg-redex-red-hover focus-visible:ring-redex-red`. `SourceBinderInputPage.tsx:139-145` ("Continue → Setup questions") uses raw classes `bg-redex-red hover:bg-redex-red-hover disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed`. Both miss `shadow-sm` and `active:bg-redex-red-active`. |
| **Fix** | Convert both to `<Button variant="brand" ...>` and drop the redundant red classes. Keep only the disabled-state overrides on Continue. |
| **Acceptance** | DevTools shows both buttons resolve to identical computed style at rest, hover, active — matching every other `variant="brand"` button in the chain. |

#### P0-8 — Source Library card competes with the paste/upload zone for the primary attention slot

| Field | Value |
|---|---|
| **What's wrong** | `SourceBinderInputPage.tsx:74-93` renders a Tier-1 card with a brand-red CTA ("Browse Source Library →") **above** the paste/upload panels. The page's stated purpose ("Paste markdown or upload an .md file to get started.") sits beneath an unrelated red CTA. Admin's eye is led to the library, but the page title sends them to paste. The mental-model question — *is the library the recommended path, or an alternative, or an addition?* — is never answered. |
| **Fix** | Split into a clear primary-path/secondary-path hierarchy. Recommended treatment: |
| | 1. **Primary**: the paste/upload zone keeps its current position and ergonomics.
| | 2. **Secondary**: replace the brand-red library card with a **subtle** secondary affordance ("Or pick from the Source Library →") rendered as a slate-trim chip below the paste zone, matching the secondary-link chip pattern recommended for the admin dashboard (P1-5 of the admin design audit).
| | 3. Update the subhead to acknowledge both paths: `Paste markdown, upload an .md file, or pick from the Source Library.` |
| **Acceptance** | The paste/upload zone is the visually-heaviest CTA on the page. The library affordance reads as an alternative, not the primary action. The subhead names all three paths. |

#### P1-10 — "Clear source" button has no confirmation

| Field | Value |
|---|---|
| **What's wrong** | `SourceBinderInputPage.tsx:134-136`: clicking "Clear source" calls `clearSourceMaterial()` immediately, destroying potentially hours of source paste. |
| **Fix** | Add a confirmation prompt: `Clear all source material? This cannot be undone.`. |
| **Acceptance** | Clicking Clear source surfaces a confirm dialog; canceling preserves state. |

#### P1-11 — Orphaned-state copy is hostile

| Field | Value |
|---|---|
| **What's wrong** | `SourceBinderInputPage.tsx:96-105` orphan-state copy: `"No working draft. Start from the dashboard to capture module basics first."` Reads like a 500 error. The admin lost their draft — give them an empathetic explanation and a clear path. |
| **Fix** | Rephrase: `It looks like you arrived here without starting from basics. Begin with module basics so we can tailor source ingestion to your audience.` and label the button `Start from basics →` (not "Go to dashboard"). |
| **Acceptance** | Orphan state reads as helpful, not blaming. |

#### P1-12 — "Authority-tagged · version-tracked · audit-grounded" reads as marketing

| Field | Value |
|---|---|
| **What's wrong** | `SourceBinderInputPage.tsx:80`: `<p className="text-sm font-medium text-slate-500">Authority-tagged · version-tracked · audit-grounded.</p>` — three claims separated by middots, no explanation. Looks like a feature-page tagline, not an admin operational page. |
| **Fix** | Replace with a one-line explanation of when to use the library: `Use the library when the source already lives in Drive — Foundry will respect the existing version chain.` |
| **Acceptance** | The library card describes when to use it, not what it is. |

#### P2-5 — No save-state language anywhere on the page

| Field | Value |
|---|---|
| **What's wrong** | The page does mutate the draft store on every keystroke (`handleRawTextChange` → `syncMaterial` → `setSourceMaterial`) but never confirms the save to the admin. |
| **Fix** | Add a small `Save` glyph + caption near the paste panel: `Source autosaves as you type` (truthful for this page — every keystroke writes to the store). |
| **Acceptance** | The admin can see at a glance that their paste is being saved. |

#### P2-6 — Footer has three buttons, no primary

| Field | Value |
|---|---|
| **What's wrong** | `SourceBinderInputPage.tsx:124-148`: footer has `← Back to basics` (outline), `Clear source` (outline), `Continue → Setup questions` (brand-red). The two outline buttons read visually equal-weight to the brand-red Continue. The destructive `Clear source` should be visually subordinate to both. |
| **Fix** | Move `Clear source` into a kebab/overflow menu, or move it inside the paste panel as `× Clear` so the footer carries only navigation. |
| **Acceptance** | Footer presents one and only one primary action; back-link is secondary; destructive actions live outside the footer. |

---

### 7. `src/features/foundry/pages/OutlineReviewPage.tsx` — Outline review

#### P0-9 — "Regenerate" has no confirmation or undo

| Field | Value |
|---|---|
| **What's wrong** | `OutlineReviewPage.tsx:51-57` (`handleRegenerate`) wipes the current outline and replaces it with a fresh AI generation. If the admin has been reading and forming intent against the current outline, this destroys their context with no way to recover. Toast confirms the action *after* it has happened. |
| **Fix** | Either (a) show a confirm dialog: `Regenerate the outline? Your current outline will be replaced. (We'll keep the previous outline in version history.)`, or (b) snapshot the previous outline into a history stack with an undo affordance. Option (a) is minimum viable. |
| **Acceptance** | Clicking Regenerate triggers a confirm; canceling preserves the current outline. |

#### P0-10 — "Edit outline" button title leaks engineer language

| Field | Value |
|---|---|
| **What's wrong** | `OutlineReviewPage.tsx:117-121`: `<Button variant="outline" disabled title="Coming in Slice 3.2 — full module generation preview">Edit outline</Button>`. The `title=` attribute is the native browser tooltip — a customer-facing surface — and contains `"Slice 3.2"`. |
| **Fix** | Replace tooltip text: `Manual outline editing coming soon.` |
| **Acceptance** | Hovering the disabled Edit outline button shows a tooltip with no internal/roadmap language. |

#### P0-11 — `learning_objectives` (already rendered by `GeneratedOutlineCard`) is the only place the term "learning" appears in the entire workflow

| Field | Value |
|---|---|
| **What's wrong** | `GeneratedOutlineCard.tsx:52-62` renders `outline.learning_objectives` as a "Learning objectives" list. These are AI-generated, never edited by the admin, never validated against the basics-step intent, and never re-surfaced downstream. Once the new `learning_outcomes` field is added to basics, these two concepts collide and confuse: the admin will see *their* outcomes on basics, then *AI-derived objectives* on outline, with no mapping between the two. |
| **Fix** | Two-part: (a) constraint the AI to derive `outline.learning_objectives` from the admin's `learning_outcomes` (one objective per outcome, matching verb/object pairs); (b) render side-by-side in `GeneratedOutlineCard` — left column "What you said the learner should be able to do" (the 3 basics outcomes, read-only), right column "How the outline ladders to each" (the AI-generated objective per outcome, with the source-bound lessons listed beneath). |
| **Acceptance** | The outline review page shows the admin a clear ladder from each authored outcome → AI's translation → the lessons that support it. |

#### P1-13 — Status pill location confuses with regeneration state

| Field | Value |
|---|---|
| **What's wrong** | `OutlineReviewPage.tsx:74-77`: the `Draft/Approved/Regenerating` status pill sits in the same row as `← Back to questions`, not near the action buttons. When `outlineStatus === 'regenerating'`, the admin sees the pill change but the Regenerate button is the one that should be giving feedback. |
| **Fix** | Move the status pill next to the action footer; while regenerating, swap the Regenerate button label to `Regenerating…` with a spinner and disable it. |
| **Acceptance** | Regeneration state shows feedback at the action surface, not far away in the header. |

#### P1-14 — "Approved" success card is bright emerald — out of brand

| Field | Value |
|---|---|
| **What's wrong** | `OutlineReviewPage.tsx:97-103`: when `outlineStatus === 'approved'`, the page renders a card with `border-emerald-200 bg-emerald-50` carrying `✓ Outline approved.` This is the third emerald card in the workflow (after critique resolved, side-by-side approved counts, blockers cleared) and dilutes the brand-red authority signal. `design-bar §5` says 10% red accent; the workflow currently uses far more emerald for approvals than red for brand. |
| **Fix** | Replace the emerald success treatment with a slate-on-white affirmation: `rounded-2xl border border-slate-200 bg-white shadow-sm` + a small green check glyph inline (not the whole card tinted). Reserve emerald fill for the **final** publish-confirmation moment. |
| **Acceptance** | Mid-flow approvals (outline, critique resolved, blockers cleared) all use the slate-card-with-emerald-glyph treatment; only the final publish-confirmation page uses an emerald-tinted card. |

#### P1-15 — The "Generating outline…" loading state has no skeleton

| Field | Value |
|---|---|
| **What's wrong** | `OutlineReviewPage.tsx:88-92`: while generating, the page shows a single small Tier-1 card with the pulse text `"Generating outline…"`. Below the eyebrow, the rest of the page is empty. Admin sees a near-empty page for ~600ms; layout shifts when the outline arrives. |
| **Fix** | Add a skeleton matching the eventual layout: a placeholder `GeneratedOutlineCard` block (header + 3 stat tiles + objectives list) plus a placeholder `LessonOutlineList`. Use `animate-pulse bg-slate-100 rounded-2xl` shapes matching real dimensions. |
| **Acceptance** | No visible layout shift between generating and generated states. |

#### P2-7 — No way to save and exit mid-review

| Field | Value |
|---|---|
| **What's wrong** | The footer has Regenerate / Edit outline (disabled) / Approve outline. No way to "park" the outline as-is and come back later. |
| **Fix** | Add a `Save & exit` outline button (Tertiary outline-variant) wired to the in-flight draft-persistence agent's exit API. |
| **Acceptance** | Admin can exit mid-outline-review and return to find the outline waiting. |

---

### 8. `src/features/foundry/pages/ModuleGenerationPreviewPage.tsx` — Module generation preview

#### P0-12 — "✨ Generate Full Module in One Click (Preview Mode)" violates `design-bar §11`

| Field | Value |
|---|---|
| **What's wrong** | `ModuleGenerationPreviewPage.tsx:88-95`: the primary CTA reads literally `"✨ Generate Full Module in One Click (Preview Mode)"`. `design-bar §11` prohibits decorative emoji ("emoji must mean something") and prohibits gamification mechanics. The phrase "Magic Button" / "in One Click" frames AI generation as a stunt, undermining the dignified source-grounded posture the rest of the product earns. The parenthetical `(Preview Mode)` is also redundant with the amber `PREVIEW ONLY` banner already on the page. |
| **Fix** | Replace with calm operational copy: `Generate every lesson from the approved outline`. Drop the sparkle emoji. Drop the "(Preview Mode)" parenthetical — the amber banner already carries that signal. |
| **Acceptance** | The CTA reads as a deliberate, source-grounded action, not a slot-machine. |

#### P0-13 — Mock-data fallback: the page silently uses `DEFAULT_AI_OUTLINE` / `DEFAULT_AI_SOURCE_MATERIAL` when state is missing

| Field | Value |
|---|---|
| **What's wrong** | `ModuleGenerationPreviewPage.tsx:34-38`: when the outline or source material is missing, the page falls back to `DEFAULT_AI_OUTLINE` (a hardcoded "HR Basics at Redex" outline from `pageInputDefaults.ts:37-46`) and silently generates against it. The admin gets a generated module that has nothing to do with what they entered, with no warning. |
| **Fix** | Refuse to generate when the outline or source material is missing. Render an empty-state card: `Approve an outline first` with a `← Back to outline review` button. Remove the `DEFAULT_AI_*` fallbacks from the call site; keep them only inside `pageInputDefaults.ts` for tests. |
| **Acceptance** | Visiting the preview page directly without an approved outline never produces an "HR Basics at Redex" mock module. |

#### P1-16 — `PREVIEW ONLY` banner uses shouting caps and verbose copy

| Field | Value |
|---|---|
| **What's wrong** | `ModuleGenerationPreviewPage.tsx:78-83`: banner reads `"PREVIEW ONLY — This module is NOT published. Review and approve each lesson before publishing."` Uppercase shouting + double negative ("is NOT") + redundant clause ("before publishing"). |
| **Fix** | Rewrite: `<strong>This is a preview.</strong> Nothing has been published. Review each lesson; you'll approve before publishing.` (Mixed-case strong tag carries the emphasis without shouting.) |
| **Acceptance** | The banner is calm, factual, and not louder than the page title. |

#### P1-17 — Lesson list "↑ No generated module yet" with up-arrow is unclear

| Field | Value |
|---|---|
| **What's wrong** | `ModuleGenerationPreviewPage.tsx:99-107`: the empty-state card renders a `↑` arrow centered above a "No generated module yet" headline. The arrow points up — at a button that is `variant="brand"` and labeled "Generate Full Module in One Click". Even after the P0-12 rename, the arrow is fragile to layout shifts. |
| **Fix** | Replace the `↑` glyph with a static `Sparkles` icon (lucide-react), tinted slate-400. Update the copy to: `Generate the module above to start reviewing lessons.` |
| **Acceptance** | The empty state communicates the call-to-action without depending on visual proximity to the button above. |

#### P1-18 — No place to display the admin's `learning_outcomes` for context

| Field | Value |
|---|---|
| **What's wrong** | The preview page is where the admin spends the most time reading AI-generated content. The 3 authored outcomes are the user's filter for "did the AI actually build the thing I asked for?" — but they're nowhere on this page. |
| **Fix** | Below the amber preview banner, add a sticky "What we promised the learner" card: 3 bullets matching the basics-step outcomes, with a small `Edit on basics` link. The lesson list on the right should add a "Supports outcome: ____" annotation per lesson where the AI mapped it. |
| **Acceptance** | The admin reads each lesson with the authored outcomes in peripheral vision the whole time. |

---

### 9. `src/features/foundry/pages/SelfCritiqueReviewPage.tsx` — AI self-critique

#### P0-14 — `'Manual editing in Slice 3.4'` toast leaks engineer language

| Field | Value |
|---|---|
| **What's wrong** | `SelfCritiqueReviewPage.tsx:107`: `onEditIssue={() => toast.info('Manual editing in Slice 3.4')}`. The toast is a customer-facing surface; `Slice 3.4` is internal roadmap terminology. |
| **Fix** | Replace with: `Manual issue editing is coming soon.` or, better, simply disable the Edit button when manual editing is unavailable and remove the toast. |
| **Acceptance** | No toast or tooltip in the workflow uses the word "Slice". |

#### P0-15 — Self-critique does not validate against the authored `learning_outcomes`

| Field | Value |
|---|---|
| **What's wrong** | The critique evaluates lessons for "unsupported claims, weak questions, missing references" (line 99-100) but never asks: *does the generated module actually deliver the 3 authored outcomes?* This is exactly where the critique should land hardest, and it currently doesn't run that check. |
| **Fix** | Add an outcome-coverage check to the critique pipeline (see "Scope for the AI prompt integration builder"). Surface results on this page as a fourth issue category: `Outcome coverage — outcome #2 ("…") is referenced in 0 lessons. Add a lesson or rework the assessment.` |
| **Acceptance** | Every authored outcome that has zero supporting lessons surfaces as a critique issue blocking approval. |

#### P1-19 — The "Return to source binder" footer link is a non-sequitur

| Field | Value |
|---|---|
| **What's wrong** | `SelfCritiqueReviewPage.tsx:130-132`: footer has a `Return to source binder` link to `/admin/foundry/source`. Why the admin would jump from critique back to source binder is not explained — the natural backward step is the module preview. |
| **Fix** | Either explain (e.g. `If the issues stem from source gaps, fix them in the source binder →`) or remove the link in favor of the natural `← Back to module preview` (which already exists in the header at line 84). |
| **Acceptance** | Every cross-page footer link in the workflow has a clear "why would I click this" justification visible to the admin. |

#### P1-20 — `Analyzing module…` loading card has no progress

| Field | Value |
|---|---|
| **What's wrong** | `SelfCritiqueReviewPage.tsx:92-99`: loading state shows a static "Analyzing module…" card with a pulse bar. Real critique runs may take longer than the current 700ms mock; admin needs a sense of "how long". |
| **Fix** | Add a step-by-step micro-status under the headline: `Checking source grounding…` → `Checking outcome coverage…` → `Checking assessments…` (cycle every ~400ms). Even on the mock client this reassures the admin the AI is doing work, not stalled. |
| **Acceptance** | The loading state communicates what the AI is currently doing, not just "analyzing". |

---

### 10. `src/features/foundry/pages/SideBySideReviewPage.tsx` — Side-by-side review

#### P0-16 — "🚫 Publish blocked" uses ban emoji + uppercase

| Field | Value |
|---|---|
| **What's wrong** | `SideBySideReviewPage.tsx:121-126`: blocker banner reads `"🚫 Publish blocked — Resolve unsupported claims before publishing"`. The 🚫 emoji is decorative ("emoji must mean something" per `design-bar §11`); the `AlertOctagon` lucide icon used immediately to its left already carries the semantic. Two redundant blocker icons in one line. |
| **Fix** | Drop the 🚫 emoji. Keep only the `AlertOctagon` glyph. |
| **Acceptance** | The blocker line has one visual signal (AlertOctagon), not two. |

#### P1-21 — Summary chips (X approved, Y pending, Z need regeneration) duplicate the per-lesson chip language

| Field | Value |
|---|---|
| **What's wrong** | `SideBySideReviewPage.tsx:107-118` renders three counter chips at the top of the page in the same emerald / amber / red palette and same chip chrome as the per-lesson status chips in the lesson list aside. Visually, the page reads as "chips, chips, chips, and more chips". Hierarchy is lost. |
| **Fix** | Render the summary as a compact horizontal stat strip with un-chipped numerals: `3 approved · 5 pending · 1 needs regeneration` — colored numbers, no surface chrome. Reserve chip chrome for the per-lesson list aside. |
| **Acceptance** | The page has one tier of chip language (per-lesson status) and one tier of plain-text summary, not two layers of identical chips. |

#### P1-22 — `Return to source binder` footer link, again

| Field | Value |
|---|---|
| **What's wrong** | Same as P1-19 — `SideBySideReviewPage.tsx:188-190` includes a `Return to source binder` link with no rationale. |
| **Fix** | Replace with `← Back to self-critique` (natural backward step) and add `Save & exit` if persistence is live. |
| **Acceptance** | All footer links in the workflow describe natural backward or save-and-exit motion only. |

#### P1-23 — `selectedLessonKey === null` falls through to lessonReviews[0] silently

| Field | Value |
|---|---|
| **What's wrong** | `SideBySideReviewPage.tsx:74-80` (`selectedReview` useMemo): if `selectedLessonKey` is `null`, it silently selects the first lesson. Admin doesn't realize they're "on" lesson 1; the lesson-list aside doesn't visually mark it as selected because `activeLessonKey` derives from `selectedReview`. |
| **Fix** | When `selectedLessonKey` is `null`, set it to the first lesson's key on mount via `useEffect` so the URL/state and the highlight match. |
| **Acceptance** | The first lesson in the aside is visibly highlighted on first arrival; clicking it does nothing (already selected). |

#### P2-8 — No way to see outcome-coverage on the side-by-side page

| Field | Value |
|---|---|
| **What's wrong** | Same critique-side issue as P1-18 — outcomes are absent. |
| **Fix** | Add the "What we promised the learner" sticky card to the page header, with `Supports outcome: __` annotations on each lesson row in the aside. |
| **Acceptance** | The admin can scan the aside and see which outcomes each lesson supports without leaving the page. |

---

### 11. `src/features/foundry/pages/PublishBlockersPage.tsx` — Publish blockers

#### P0-17 — Mock blockers leak when the draft store is empty

| Field | Value |
|---|---|
| **What's wrong** | `PublishBlockersPage.tsx:31-32`: ```ts
const blockers = storeBlockers.length === 0 && !hasAnyFoundryData ? MOCK_PUBLISH_BLOCKERS : storeBlockers
``` When the admin lands on this page without any draft data (e.g., direct nav, or after a draft reset), the page falls back to `MOCK_PUBLISH_BLOCKERS` (`mockMissingSource.ts:11-38`) and shows two "Payroll basics" / "Manager escalation path" mock blockers that have nothing to do with their work. This is the exact "mock-data leak into production" anti-pattern the user is hunting. |
| **Fix** | When `!hasAnyFoundryData`, render an empty-state card: `No active draft to check. Start a new module to see publish status.` with a `Start a new module →` CTA. Delete the `MOCK_PUBLISH_BLOCKERS` import and the fallback. Move the mock array to `*.test.ts` if any tests still need it. |
| **Acceptance** | Visiting `/admin/foundry/blockers` with no draft state never shows the "Payroll basics" / "Manager escalation path" mock blockers. |

#### P1-24 — Header pill (`ModuleStateBadge`) and footer publish button can disagree

| Field | Value |
|---|---|
| **What's wrong** | `PublishBlockersPage.tsx:69` renders a `ModuleStateBadge` for the inferred state. `PublishBlockersPage.tsx:105-110` renders the Publish button, disabled unless `moduleState === 'approved'`. The badge can read `pending_review` (admin sees yellow chip top-right) while the button below reads `Publish module` (disabled, slate). Two truths in one viewport. |
| **Fix** | Mirror the badge state in the publish button's label: when `moduleState === 'pending_review'`, the button label should be `Address pending reviews before publishing` (disabled). When `'in_progress'`: `Complete reviews to enable publishing` (disabled). Etc. |
| **Acceptance** | Top-right badge and bottom-right CTA tell the same story without the admin having to translate. |

#### P1-25 — `← Back to side-by-side review` is the only back-link; no save-and-exit

| Field | Value |
|---|---|
| **What's wrong** | `PublishBlockersPage.tsx:73-80`: only the back-link affordance exists. An admin who realizes they need to address blockers tomorrow has no save-and-exit path. |
| **Fix** | Add a `Save & exit` outline button next to the Publish button in the footer. Wire to the draft-persistence agent's exit API. |
| **Acceptance** | Admin can leave the blockers page mid-resolution and return later. |

---

### 12. `src/features/foundry/pages/PublishConfirmationPage.tsx` — Publish confirmation

#### P0-18 — `'HR Basics at Redex'` is hardcoded as the fallback module title

| Field | Value |
|---|---|
| **What's wrong** | `PublishConfirmationPage.tsx:35`: ```ts
const moduleTitle = currentDraft?.title || generatedModule?.module_title || 'HR Basics at Redex'
``` If both `currentDraft` and `generatedModule` are missing — a state the page can reach by direct nav after a draft reset — the page proudly announces `Module published` and `HR Basics at Redex` as the published title. This is the most prominent mock-leak in the entire workflow because it sits on a *celebration* surface. |
| **Fix** | When neither `currentDraft?.title` nor `generatedModule?.module_title` resolves, render a graceful fallback: redirect to `/admin/foundry/start` or render an empty-state card `No published module to confirm. Return to the dashboard to see recent publishes.` Delete the hardcoded string entirely. |
| **Acceptance** | Visiting `/admin/foundry/published` with no draft state never shows `HR Basics at Redex` as the headline. |

#### P0-19 — `'hr-basics-mod-001'` is hardcoded as the fallback module ID

| Field | Value |
|---|---|
| **What's wrong** | `PublishConfirmationPage.tsx:36-39`: ```ts
const moduleId =
  currentDraft?.module_id ??
  versions.find(...)?.module_id ??
  'hr-basics-mod-001'
``` The "Edit & create new version" button (line 41-52) then tries to fork that mock module ID. Worst case: the admin clicks "Edit & create new version", the page silently forks against `hr-basics-mod-001`, and starts a new draft from a nonexistent base. |
| **Fix** | Disable `Edit & create new version` when the module ID can't be resolved. Show a tooltip: `Module ID unavailable — return to dashboard and pick a module to fork.`. |
| **Acceptance** | The fork affordance is never wired to `hr-basics-mod-001`. |

#### P0-20 — Three footer buttons read equal-weight; no primary

| Field | Value |
|---|---|
| **What's wrong** | `PublishConfirmationPage.tsx:80-95`: footer has `Return to admin dashboard` (variant brand), `Edit & create new version` (variant outline), and `Start a new module` (variant outline). The first is the natural primary action, but visually all three sit on one row with similar visual weight at narrow widths. At medium widths the brand button does lead but it's not as dominant as it should be. |
| **Fix** | Restructure: `Return to admin dashboard` remains brand-red and primary. Move `Edit & create new version` and `Start a new module` to a separate "What's next?" sub-card or to a `flex justify-end gap-2` row beneath the primary, both outline-variant + smaller `size`. |
| **Acceptance** | The admin's eye lands first on `Return to admin dashboard`; secondary actions read as alternatives. |

#### P1-26 — Module-published summary card omits the authored `learning_outcomes`

| Field | Value |
|---|---|
| **What's wrong** | The publish confirmation is the moment the admin most wants reassurance: *we shipped the thing we said we'd ship.* The card currently shows module title + publish timestamp + a generic congrats paragraph. The 3 authored outcomes don't appear anywhere on the page. |
| **Fix** | Inside the white-on-emerald card, between the timestamp and the congrats paragraph, render: `<h3>What learners can now do</h3>` followed by the 3 outcomes as a check-bullet list. This is also exactly what the learner sees on their post-completion screen — symmetry between author and learner. |
| **Acceptance** | The publish-confirmation card displays the 3 authored outcomes. |

#### P1-27 — Emerald-tinted card chrome is one of three emerald cards in the workflow

| Field | Value |
|---|---|
| **What's wrong** | `PublishConfirmationPage.tsx:66-77` renders an emerald-tinted Tier 2/3 card. Same emerald used for outline approval (mid-flow), critique-resolved (mid-flow), and blockers-cleared (mid-flow). Per P1-14, those mid-flow emeralds should drop, leaving the publish-confirmation as the **only** emerald moment in the chain. |
| **Fix** | Keep the emerald only here. Coordinate with P1-14 fix. |
| **Acceptance** | Publish-confirmation is the singular emerald moment; mid-flow approvals use slate-card-with-emerald-glyph. |

#### P2-9 — `formatPublishedAt(null)` displays `Publish timestamp pending` even though publish is supposedly done

| Field | Value |
|---|---|
| **What's wrong** | `PublishConfirmationPage.tsx:9-21`: if `publishedAt === null`, the page shows `"Publish timestamp pending"`. But this page is reached only after publish — `publishedAt === null` is an error state, not a normal state. |
| **Fix** | If `publishedAt === null`, log a warning and redirect to `/admin`. Don't show the cheerful "Module published" headline above a "pending" timestamp. |
| **Acceptance** | The page only renders the success layout when `publishedAt` is a valid ISO timestamp. |

---

### 13. `src/features/learner/pages/LearnerDashboardPage.tsx` — Learner dashboard

This page consumes what the author chain produces. The audit surfaces only the points relevant to the Foundry chain (hardcoded mock data, missing outcomes display) — the broader dashboard polish is already captured by `design-bar §13`.

#### P0-21 — `Sarah Chen • People Ops` hardcoded as the buddy persona

| Field | Value |
|---|---|
| **What's wrong** | `LearnerDashboardPage.tsx:208-209`: ```tsx
<div className="font-medium">Your Onboarding Buddy</div>
<div className="text-slate-600">Sarah Chen • People Ops</div>
```
Mock persona renders in production. |
| **Fix** | Pull the buddy name from the learner profile / assignment record. If no buddy is assigned yet, render: `A buddy will be assigned during your first week.` |
| **Acceptance** | "Sarah Chen" never renders in production unless that is an actual user. |

#### P0-22 — Hardcoded onboarding progress list

| Field | Value |
|---|---|
| **What's wrong** | `LearnerDashboardPage.tsx:163-194`: the "Your Onboarding Progress" list hardcodes four items (`HR Basics`, `Systems & Tools`, `Safety & Compliance`, `Role-specific Training`) with hardcoded statuses (`Complete`, `In Progress`, `Not started`, `Not started`). Every learner sees the same fake progress. |
| **Fix** | Replace with a derived list from `useMyProgress()` / assignment store. If only one module is assigned, collapse to a single progress card. |
| **Acceptance** | Each learner sees their own real assigned modules and statuses, not the same hardcoded four. |

#### P1-28 — No "What you'll learn" preview before the learner starts

| Field | Value |
|---|---|
| **What's wrong** | The "Continue where you left off" card shows the module title, lessons-complete, progress, and minutes-remaining. It does **not** show the 3 authored outcomes — the reason the learner is here. Per the brief, outcomes should appear as "What you'll learn" before the learner starts. |
| **Fix** | Inside the "Continue where you left off" card, between the lesson-count line and the progress bar, add: `<p class="text-xs font-semibold uppercase tracking-wider text-slate-500">What you'll learn</p>` + a bullet list of the 3 outcomes. Collapse to a `Show outcomes` disclosure when progress > 0% to avoid visual repetition. |
| **Acceptance** | Before a learner clicks Continue, they can read what the module promises they'll be able to do. |

#### P1-29 — `currentAssignment.title` is hardcoded to `DEMO_HR_BASICS_COURSE.title`

| Field | Value |
|---|---|
| **What's wrong** | `LearnerDashboardPage.tsx:90`: the displayed module title comes from `DEMO_HR_BASICS_COURSE.title` — a demo constant. Compounds the `HR Basics at Redex` leak. |
| **Fix** | Pull from the assignment record's module title. |
| **Acceptance** | Module title on dashboard reflects the actual assigned module, not a demo constant. |

---

### 14. `src/features/learner/components/ModulePlayer.tsx` — Module player + completion screen

#### P0-23 — 🎉 emoji + celebratory layout violates `design-bar §11`

| Field | Value |
|---|---|
| **What's wrong** | `ModulePlayer.tsx:240-245`: the training-complete screen renders ```tsx
<div className="text-5xl" aria-hidden="true">🎉</div>
<div className="mt-4 text-xs font-semibold uppercase tracking-[3px] text-redex-red">TRAINING COMPLETE</div>
<h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">You've completed {module.title}</h2>
```
`design-bar §11` is explicit: *"Certification moments: weight, not confetti. No animations beyond a calm transition."* The 🎉 is the exact "confetti" the bar prohibits. |
| **Fix** | Replace the 🎉 with a calm `CheckCircle2` icon at 48-56px in `text-emerald-600`. Keep the eyebrow + headline + summary tiles. Move the "What you can now do" block (P0-24 below) into the prominent position where the emoji currently sits. |
| **Acceptance** | The completion screen reads dignified and earned, not confetti-cannon. |

#### P0-24 — No "What you can now do" on the completion screen

| Field | Value |
|---|---|
| **What's wrong** | `ModulePlayer.tsx:243-275`: the completion screen shows estimated time + quiz score in tiles, then a "Back to dashboard" CTA. The 3 authored outcomes — *the reason this matters* — never appear. The learner finishes the module without ever reading what they should now be able to do. |
| **Fix** | Below the headline, add: `<p class="text-xs font-semibold uppercase tracking-[3px] text-redex-red">What you can now do</p>` + the 3 outcomes as a check-bullet list. This becomes the centerpiece of the completion screen, displacing the time/score tiles to a smaller "Module details" sub-card. |
| **Acceptance** | Completion screen leads with the 3 outcomes; time/score become subordinate. |

#### P2-10 — Lock emoji 🔒 in quiz banner

| Field | Value |
|---|---|
| **What's wrong** | `ModulePlayer.tsx:296-298`: quiz-lock banner reads `"🔒 Pass the quiz above with N% or higher to unlock lesson completion and continue."` Emoji is decorative — same prohibition as the 🎉 above. |
| **Fix** | Replace the 🔒 with a `Lock` lucide icon at 16px. |
| **Acceptance** | No decorative emoji remain in the player. |

---

## Cross-cutting findings

### C-1 — There is no Foundry-wide stepper component

The author chain has 9 visible steps (basics, source, questions, outline, preview, critique, side-by-side, blockers, confirmation) but no shared visual stepper. Each page declares its own step in eyebrow text, inconsistently:

| Page | Eyebrow today | Expected |
|---|---|---|
| `FoundryStartPage` | `REDEX AI COURSE FOUNDRY` | `STEP 1` (or stepper) |
| `SourceBinderInputPage` | `· STEP 2` | `STEP 2` (or stepper) |
| `FoundryQuestionsPage` | `· STEP 3` | `STEP 3` (or stepper) |
| `OutlineReviewPage` | `· STEP 4` | `STEP 4` (or stepper) |
| `ModuleGenerationPreviewPage` | `· STEP 5` | `STEP 5` (or stepper) |
| `SelfCritiqueReviewPage` | `· STEP 6` | `STEP 6` (or stepper) |
| `SideBySideReviewPage` | `· STEP 7` | `STEP 7` (or stepper) |
| `PublishBlockersPage` | `· STEP 8` | `STEP 8` (or stepper) |
| `PublishConfirmationPage` | `REDEX AI COURSE FOUNDRY` | `STEP 9 — COMPLETE` (or stepper) |

**Fix** (P1 cross-cutting, blocks the polish slice but not the v2 basics slice): create `src/features/foundry/components/FoundryStepper.tsx` — a compact horizontal 9-dot stepper rendered as part of the page header on every Foundry page. Each dot has a state: `complete` (slate-900 fill), `current` (redex-red fill), `upcoming` (slate-300 outline). Hover/focus shows the step label. The stepper replaces the inline `· STEP N` eyebrow text on every page.

The component reads its current step from a route-derived helper (`getCurrentFoundryStepFromRoute(location.pathname)`), so individual pages don't pass a step number prop.

**Acceptance**: 9 dots across all 9 pages, exactly one is brand-red, hover shows step labels, focus moves through them with keyboard.

### C-2 — Setup questions duplicate basics fields with different semantics

| Field | Basics shape | Wizard shape | Verdict |
|---|---|---|---|
| Audience | `audience` — string, 2-80 chars, plain input | `audience_notes` — string, 2-280 chars, textarea | **Duplicate.** Wizard textarea is *additional* context, not a restatement. Rename to `audience_detail`, make optional. |
| Criticality | `criticality` — `required` \| `optional` | `criticality` — `informational` \| `basic_knowledge` \| `operational` \| `compliance_high_risk` | **Refinement, not duplicate** — but the schema field name collides and there's no explanation in the wizard that it's narrowing the basics answer. Rename wizard field to `risk_tier`. |
| Estimated minutes | `estimated_minutes` — number, 5-300 | `estimated_minutes` — number, 5-300 | **Pure duplicate.** Drop from wizard schema; let basics be canonical. If a separate "assessment duration override" is wanted later, name it explicitly. |

**Fix**: rename `audience_notes` → `audience_detail` (optional), `criticality` → `risk_tier`, drop wizard `estimated_minutes`. Add wizard intro copy: `These answers refine the basics you've already entered. Skip any that don't apply.`

Also: collapse the wizard from 6 internal steps to a single scrolling form with section headings (the section headings are already in `QUESTION_GROUP_TITLES`). The "Step 1 of 6" inside Foundry "STEP 3" is the headline nested-progress problem; flattening removes it.

**Acceptance**: The setup-questions step never asks the admin to re-state audience or duration; criticality refinement is clearly labeled as refinement; the wizard becomes a single scrolling form with the 9-title sub-headings.

### C-3 — Brand drift: five Foundry CTAs bypass `variant="brand"`

| File | Line | CTA |
|---|---|---|
| `ModuleBasicsForm.tsx` | 202-208 | `Continue → Add source material` |
| `SourceBinderInputPage.tsx` | 84-92 | `Browse Source Library →` |
| `SourceBinderInputPage.tsx` | 139-145 | `Continue → Setup questions` |
| `QuestionWizard.tsx` | 281-284 | `Next` |
| `QuestionWizard.tsx` | 287-292 | `Submit` |

All five drop `shadow-sm` and `active:bg-redex-red-active`. Same defect as the one being fixed on `FoundryEntryCard` in the parallel CTA-alignment lane. Until all five route through `variant="brand"`, the inconsistency leaks step-to-step.

**Fix**: convert each to `<Button variant="brand" ...>`, dropping the redundant `bg-redex-red text-white hover:bg-redex-red-hover` classes. Keep only disabled-state overrides where needed.

**Acceptance**: DevTools "Computed" panel shows identical `background-color`, `box-shadow`, and `:active` rule sets for every primary CTA across all 9 Foundry pages.

### C-4 — Save-state language is inconsistent across the workflow

| Page | Current save-state language | Truthful? |
|---|---|---|
| `FoundryStartPage` | `"Saved as you go"` with Save icon | ❌ misleading — RHF doesn't write until submit |
| `SourceBinderInputPage` | none | (truthful — every keystroke does save, but no signal) |
| `FoundryQuestionsPage` | `"✓ Answers saved"` card after submit | ✓ but only post-submit |
| `OutlineReviewPage` | Draft/Approved/Regenerating status pill | ✓ for outline, but says nothing about save |
| `ModuleGenerationPreviewPage` | `"PREVIEW ONLY — This module is NOT published"` banner | ✓ |
| `SelfCritiqueReviewPage` | none | — |
| `SideBySideReviewPage` | none | — |
| `PublishBlockersPage` | none | — |
| `PublishConfirmationPage` | publish timestamp | ✓ (terminal state) |

**Fix**: standardize on three save-state phrases used consistently across the workflow:

1. **"Your draft is saved automatically"** — on every page where typing autosaves (post draft-persistence lands). Render below the form footer in `text-xs text-slate-500` with a small `Save` lucide glyph.
2. **"Your basics will be saved when you continue"** — on `FoundryStartPage` only, until autosave is real. Once autosave is real, this collapses into #1.
3. **"AI is generating from your saved draft…"** — replaces "Generating outline…" / "Analyzing module…" with a phrase that says the draft is safe even while AI runs.

**Acceptance**: every Foundry page has a save-state signal visible without scrolling; the language is one of the three canonical phrases above.

### C-5 — Page-heading grammar drifts: noun phrases vs imperatives

Current page headings: `New module — basics`, `Add source material`, `Setup questions`, `Review the generated outline`, `Review generated module`, `AI self-critique`, `Side-by-side review`, `Publish blockers`, `Module published`.

Three sentence shapes are in use:
- Imperative verb phrase: `Add source material`, `Review the generated outline`, `Review generated module`
- Noun phrase: `Setup questions`, `AI self-critique`, `Side-by-side review`, `Publish blockers`
- Past-state noun phrase: `Module published`
- Em-dash construction: `New module — basics`

**Fix**: standardize on noun phrases everywhere except terminal states which can stay past-tense:

| File | Today | Recommended |
|---|---|---|
| FoundryStartPage | `New module — basics` | `Module basics` |
| SourceBinderInputPage | `Add source material` | `Source material` |
| FoundryQuestionsPage | `Setup questions` | `Generation guidance` |
| OutlineReviewPage | `Review the generated outline` | `Outline review` |
| ModuleGenerationPreviewPage | `Review generated module` | `Module preview` |
| SelfCritiqueReviewPage | `AI self-critique` | `Self-critique` |
| SideBySideReviewPage | `Side-by-side review` | `Side-by-side review` ✓ |
| PublishBlockersPage | `Publish blockers` | `Publish blockers` ✓ |
| PublishConfirmationPage | `Module published` | `Module published` ✓ |

**Acceptance**: every H1 in the chain follows noun-phrase or past-tense-noun-phrase shape; the em-dash construction is gone.

### C-6 — Engineer/roadmap language leaks into customer surfaces

| File | Line | String | Type |
|---|---|---|---|
| `OutlineReviewPage.tsx` | 121 | `"Coming in Slice 3.2 — full module generation preview"` | tooltip |
| `SelfCritiqueReviewPage.tsx` | 107 | `"Manual editing in Slice 3.4"` | toast |
| `AssignmentsEntryCard.tsx` | 30 (already flagged in admin-dashboard audit) | `"…Marcus Chen or a new-hire group using local mock assignment state"` | card body |

**Fix**: grep for `Slice` and `mock` in all customer-rendered string literals; replace each with user-facing copy.

**Acceptance**: `grep -nE "(Slice [0-9]+\.[0-9]+|local mock)" src/features/foundry/ src/features/source-binder/` returns no matches in customer-surface files.

### C-7 — Mock-data fallbacks render in production

| File | Line | Mock |
|---|---|---|
| `PublishConfirmationPage.tsx` | 35-39 | `'HR Basics at Redex'` + `'hr-basics-mod-001'` |
| `PublishBlockersPage.tsx` | 31-32 | `MOCK_PUBLISH_BLOCKERS` |
| `ModuleGenerationPreviewPage.tsx` | 35-38 | `DEFAULT_AI_OUTLINE` + `DEFAULT_AI_SOURCE_MATERIAL` |
| `OutlineReviewPage.tsx` | 39-44 | same defaults |
| `SelfCritiqueReviewPage.tsx` | 27-30 | `DEFAULT_AI_MODULE_PREVIEW` + `DEFAULT_AI_SOURCE_MATERIAL` |
| `LearnerDashboardPage.tsx` | 163-194 + 208-209 | hardcoded modules + buddy |

**Fix**: every "missing state" branch should render an empty/orphan state with a navigation back to a valid entry point — never a hardcoded "HR Basics at Redex" stand-in. The mock constants should remain in `pageInputDefaults.ts` / `mockMissingSource.ts` but no longer be imported by page-level components; only tests should reference them.

**Acceptance**: `grep -nE "(HR Basics at Redex|MOCK_PUBLISH_BLOCKERS|DEFAULT_AI_|Sarah Chen)" src/features/foundry/pages/ src/features/learner/pages/` returns no matches.

### C-8 — Approval-celebration cards drift from brand red to emerald in mid-flow

The workflow has emerald-tinted cards at three pre-publish moments (`OutlineReviewPage`, `SelfCritiqueReviewPage` → resolved state, `PublishBlockersPage` → cleared state). Each is a Tier 1 emerald-50 card that dilutes the brand-red authority signal per `design-bar §5` (10% red).

**Fix**: convert mid-flow approvals to slate-card-with-emerald-glyph (white card + small `CheckCircle2 text-emerald-600` inline icon + slate text). Reserve emerald-tinted card chrome for the single terminal publish-confirmation card.

**Acceptance**: only `PublishConfirmationPage` carries an emerald-tinted card; mid-flow approvals carry slate-card-with-glyph treatment.

### C-9 — No save-and-exit affordance on any mid-flow page

Pages 2-8 (source through blockers) have no `Save & exit` button. The user's brief explicitly asks: *"Is 'Save & exit' possible?"*. Currently it is not — the admin's only escape is `← Back to X` link-by-link or the global TopNav, both of which lose state if persistence isn't live.

**Fix**: every mid-flow page footer gets a tertiary `Save & exit` outline button beside the primary Continue. Wires to the parallel draft-persistence agent's exit API.

**Acceptance**: pages 2-8 each carry a `Save & exit` affordance in the footer.

### C-10 — No Foundry breadcrumb in `BreadcrumbBar`

`src/components/layout/BreadcrumbBar.tsx` exists for site-wide breadcrumbs. There is no Foundry-specific crumb showing the admin where in the chain they are, in addition to the visual stepper. This is a minor compounding factor to C-1 — until the stepper is in place, the breadcrumb is the only fallback.

**Fix** (defer): add Foundry crumbs (`Admin / Course Foundry / {step name}`) once the stepper lands. Until then, the eyebrow is the only signal.

**Acceptance**: breadcrumb mirrors the stepper position, so refreshes and deep-links land the admin in a navigable context.

---

## Learning-outcomes integration plan

The new `learning_outcomes` field is a `string[]` of exactly 3 entries, each phrased as **"After this module, the learner should be able to [verb] [object]."** The UI provides the constant prefix; the admin enters the verb-object phrase. Outcomes live on `ModuleBasicsDraft`, are validated in `moduleBasicsSchema`, persist via Zustand + Supabase (via the in-flight draft-persistence work), and surface across every author / admin / learner touchpoint below.

### Conceptual distinction vs the existing `learning_objectives`

| Concept | Owner | When set | Where stored | Where displayed today | Role going forward |
|---|---|---|---|---|---|
| `learning_outcomes` (NEW) | **Admin-authored on basics** | Step 1 (basics) | `ModuleBasicsDraft.learning_outcomes` | nowhere yet | Source of truth for "what learners get out of this" — used by AI as the alignment target |
| `learning_objectives` (EXISTING) | **AI-generated on outline** | Step 4 (outline gen) | `CourseOutlineDraft.learning_objectives` | `GeneratedOutlineCard` only | Becomes the AI's *translation* of the admin's outcomes into the actual generated outline; rendered alongside outcomes for traceability |

### Integration table — every surface that should display outcomes

| # | Surface | File | Treatment | Priority |
|---|---|---|---|---|
| 1 | **Basics form** — capture | `ModuleBasicsForm.tsx` | New section after `audience`: heading "What should learners be able to do?", helper "Three things they should be able to do after this module.", 3 input rows each with constant prefix `After this module, the learner should be able to` followed by an input expecting `[verb] [object].` Validation: exactly 3, each 3-120 chars. | P0 (basics v2) |
| 2 | **Setup questions** — context | `FoundryQuestionsPage.tsx` | Sticky read-only card at top of page: `<h2>What learners should walk away knowing</h2>` + 3 bullets. Admin sees this constantly while choosing criticality/assessment style. | P0 (basics v2 fallout) |
| 3 | **Outline review** — alignment | `OutlineReviewPage.tsx` + `GeneratedOutlineCard.tsx` | Two-column layout inside the outline card: left = "What you said" (the 3 outcomes), right = "How the outline ladders" (AI's `learning_objectives`, one per outcome, with the lessons that support each underneath). | P0 (AI integration) |
| 4 | **Module generation preview** — context | `ModuleGenerationPreviewPage.tsx` | Sticky "What we promised the learner" card below the amber preview banner; each lesson in the right pane gets a "Supports outcome #N" annotation. | P1 (AI integration) |
| 5 | **Self-critique** — coverage check | `SelfCritiqueReviewPage.tsx` + critique pipeline | Add `Outcome coverage` to the critique categories. Surfaces issues like `Outcome #2 ("…") is referenced in 0 lessons.` Blocks publish until every outcome has at least one supporting lesson. | P0 (AI integration) |
| 6 | **Side-by-side review** — per-lesson tag | `SideBySideReviewPage.tsx` | Lesson aside cards display a `Supports outcome: ___` chip per lesson. The header "Promised outcomes" sticky card matches #4. | P1 (AI integration) |
| 7 | **Publish blockers** — final check | `PublishBlockersPage.tsx` | Outcome-coverage gaps surface as a blocker category alongside source-placeholder + lesson-unsupported. Severity `blocker` if any outcome has 0 supporting lessons. | P1 (AI integration) |
| 8 | **Publish confirmation** — celebration | `PublishConfirmationPage.tsx` | Inside the white-on-emerald card, between timestamp and congrats: `<h3>What learners can now do</h3>` + 3 outcomes as check-bullet list. | P0 (AI integration + basics v2) |
| 9 | **Admin dashboard** — module list rows | `CourseStatusList.tsx` (Drafts/Needs review/Published) | First outcome as `item.meta` line beneath the title, truncated to ~60 chars. Hover/focus shows all 3 in a tooltip. | P1 (follow-up slice) |
| 10 | **Admin dashboard** — Foundry entry card | `FoundryEntryCard.tsx` | No outcomes (this is the start CTA, not a content surface). | n/a |
| 11 | **Module version history** | `ModuleVersionHistoryPage.tsx` | "Learning outcomes" subsection inside each version row's expanded view. Diff highlights when outcomes change between versions. | P2 (follow-up slice) |
| 12 | **Learner dashboard — Continue card** | `LearnerDashboardPage.tsx` | "What you'll learn" section inside the "Continue where you left off" card; collapsed to a `Show outcomes` disclosure once progress > 0%. | P0 (learner-side) |
| 13 | **Learner dashboard — module card** | `LearnerDashboardPage.tsx` | When the learner has multiple modules, each module card shows the first outcome inline (60-char truncate); full list on hover. | P1 (learner-side) |
| 14 | **Module preview** (pre-start screen, if added) | `ModulePlayer.tsx` (lesson 0 / intro screen) | "What you'll learn" centerpiece before the first lesson, as a "ready to begin?" gate. | P2 (learner-side follow-up) |
| 15 | **Module completion screen** | `ModulePlayer.tsx` (complete branch, lines 240-275) | "What you can now do" headline + 3 outcomes as check-bullet list — replaces the 🎉 emoji as the centerpiece. Time/score tiles become a subordinate "Module details" sub-card. | P0 (learner-side) |

### Schema + store shape (for builders)

```ts
// src/features/foundry/types.ts — add to ModuleBasicsDraft and ModuleBasicsFormValues
learning_outcomes: [string, string, string]; // exactly 3

// src/features/foundry/schemas/foundrySchemas.ts — add to moduleBasicsSchema
learning_outcomes: z
  .array(z.string().min(3).max(120).trim())
  .length(3, 'Provide exactly 3 learning outcomes'),

// Supabase column (coordinate with persistence agent)
ALTER TABLE redex.module_versions
  ADD COLUMN learning_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb
  CHECK (jsonb_typeof(learning_outcomes) = 'array' AND jsonb_array_length(learning_outcomes) = 3);
```

### AI prompt integration (for builders)

The AI client (`src/features/foundry/ai/*`) currently takes `basics`, `setupAnswers`, `sources` and produces an outline with self-generated `learning_objectives`. The new contract: outline generation **receives the 3 outcomes** and produces a `learning_objectives` array of length 3, one per outcome, in the same order. Self-critique receives the outcomes and adds an `Outcome coverage` issue category. See "Scope for the AI prompt integration builder" below for the exact contract.

---

## Scope for the basics form v2 builder

**Files touched in this slice:**

- `src/features/foundry/types.ts` — add `learning_outcomes`
- `src/features/foundry/schemas/foundrySchemas.ts` — add zod validation
- `src/features/foundry/components/ModuleBasicsForm.tsx` — add the 3-row outcome inputs
- `src/features/foundry/pages/FoundryStartPage.tsx` — heading/eyebrow/subhead polish + save-state copy
- `src/features/foundry/store/foundryDraftStore.ts` — wire outcomes through `setBasics`
- `src/features/foundry/components/__tests__/ModuleBasicsForm.test.tsx` (existing) — extend test fixtures with `learning_outcomes`

### Buildable slice — "Foundry basics v2"

1. **Add `learning_outcomes` to schema and types** — types.ts + foundrySchemas.ts. Required `[string, string, string]`. Each 3-120 chars, trimmed.

2. **Render the 3 outcome inputs in `ModuleBasicsForm`** — between `audience` (line 109-123) and `criticality` (line 125-159):

```tsx
<fieldset className="space-y-3">
  <legend className="block text-sm font-medium text-slate-900">
    What should learners be able to do? <span aria-hidden="true">*</span>
  </legend>
  <p className="text-xs text-slate-500">Three things they should be able to do after this module. Start each with a verb (describe, identify, complete, escalate…).</p>

  {[0, 1, 2].map((index) => (
    <div key={index} className="space-y-1">
      <label htmlFor={`outcome-${index}`} className="block text-xs font-medium text-slate-600">
        Outcome {index + 1}
      </label>
      <div className="flex items-stretch overflow-hidden rounded-md border border-slate-300 shadow-sm focus-within:border-redex-red focus-within:ring-1 focus-within:ring-redex-red">
        <span className="bg-slate-50 px-3 py-2 text-xs leading-[1.45] text-slate-500 whitespace-nowrap">
          After this module, the learner can
        </span>
        <input
          id={`outcome-${index}`}
          type="text"
          placeholder={['describe the company values.', 'identify the right escalation path.', 'complete the safety checklist.'][index]}
          className="flex-1 border-0 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-0"
          aria-invalid={errors.learning_outcomes?.[index] ? 'true' : 'false'}
          {...register(`learning_outcomes.${index}` as const)}
        />
      </div>
      <p aria-live="polite" className="text-sm text-red-600">
        {errors.learning_outcomes?.[index]?.message ?? ' '}
      </p>
    </div>
  ))}
</fieldset>
```

3. **Fix the basics-page header polish** — P0-2, P1-1, P1-2, P1-3:
   - eyebrow: append `· STEP 1` (or leave for the stepper agent if the stepper lands first)
   - H1: `Module basics` (not `New module — basics`)
   - H1 class: `text-2xl md:text-3xl font-semibold tracking-tight text-slate-900`
   - subhead class: `text-[15px] text-slate-600 leading-[1.45]`

4. **Convert submit button to `variant="brand"`** — P0-3. Drop raw `bg-redex-red text-white hover:bg-redex-red-hover` classes.

5. **Add Tier 1 border to the form card** — P2-1. Add `border border-slate-200` to `ModuleBasicsForm.tsx:66`.

6. **Save-state copy** — P1-4. Replace `"Saved as you go"` with `"Your basics will be saved when you continue"` (truthful pre-persistence) — or `"Your draft is saved automatically"` if persistence has landed by the time this slice ships.

7. **Tests** — extend `ModuleBasicsForm.test.tsx` to cover outcomes validation: rejecting 0, 1, 2, or 4 outcomes; rejecting short/long outcomes; happy-path submission delivering 3 outcomes to `onSubmit`.

### Out of scope for this slice

- Wiring outcomes through the AI client (separate slice, see below).
- Displaying outcomes on any non-basics page (separate slice).
- Database migration adding the `learning_outcomes` JSONB column (coordinate with persistence agent).
- The Foundry-wide stepper (separate cross-cutting slice).
- The 5 other CTA `variant="brand"` conversions (separate cross-cutting slice).

### Acceptance for the basics-v2 slice

- The basics form renders 3 outcome input rows between Audience and Criticality, each with the constant prefix and a verb-object completion input.
- Submitting basics without 3 valid outcomes is blocked with per-row error messages.
- Submitting with 3 valid outcomes navigates to `/admin/foundry/source` and the outcomes are present in `useFoundryDraftStore.getState().currentDraft.learning_outcomes`.
- The page eyebrow, H1, subhead, submit button, and form card chrome match the design-bar canon.
- No raw `bg-redex-red` className on the submit button.

---

## Scope for the AI prompt integration builder

**Files touched in this slice:**

- `src/features/foundry/ai/aiSchemas.ts` — extend prompt input/output shapes
- `src/features/foundry/ai/*` (mock client + real client) — pass outcomes into outline + critique calls
- `src/features/foundry/components/GeneratedOutlineCard.tsx` — render outcomes ↔ objectives ladder
- `src/features/foundry/components/SelfCritiquePanel.tsx` — add Outcome coverage issue category UI
- `src/features/foundry/store/foundryDraftStore.ts` — derive `outcome_coverage` summary from critique
- `src/features/foundry/pages/ModuleGenerationPreviewPage.tsx` — sticky "What we promised the learner" card
- `src/features/foundry/pages/SideBySideReviewPage.tsx` — same sticky card + per-lesson outcome tag
- `src/features/foundry/pages/PublishBlockersPage.tsx` — surface outcome-coverage as a blocker
- `src/features/foundry/pages/PublishConfirmationPage.tsx` — "What learners can now do" subsection

### Buildable slice — "Outcomes flow through the AI chain"

1. **Update AI schemas** — outline generation input now includes `learning_outcomes: [string, string, string]`. Outline output's `learning_objectives` must be `[string, string, string]` (one per outcome, same order). Self-critique input includes `learning_outcomes` and `lessons_supporting_each_outcome: number[]` (one count per outcome). Self-critique output adds `outcome_coverage_gaps: number[]` (zero-based indices of outcomes with 0 supporting lessons).

2. **Update prompt templates** — the system prompt for outline generation must say literally: *"You are given 3 learning outcomes the admin authored. Produce a `learning_objectives` array of length 3, one per outcome, in the same order. Each lesson you propose must support at least one outcome; lessons that don't tie to an outcome should be removed or merged."* Self-critique system prompt adds: *"Verify every authored outcome has at least one supporting lesson. Surface any outcome with zero supporting lessons as an outcome-coverage gap."*

3. **Render outcomes ↔ objectives ladder on outline review** — `GeneratedOutlineCard` becomes a two-column layout (`grid grid-cols-1 md:grid-cols-2`): left column "What you said the learner should be able to do" (basics outcomes, read-only, slate text); right column "How this outline ladders to each" (AI's objectives, one per row matched to the left). Below each objective on the right: the lesson titles that support it (truncated, max 3 + "see all on preview").

4. **Add outcome coverage to critique UI** — `SelfCritiquePanel` adds a new category panel: `Outcome coverage`. Lists any outcome with 0 supporting lessons as a `blocker`-severity issue with copy: `Outcome #N ("…") has no supporting lesson. Add a lesson that delivers this outcome, or rework the outcome.`

5. **Surface outcome-coverage gaps as publish blockers** — `PublishBlockersPage` adds the same outcome-coverage gaps to its `blockers` list (sourced from critique state, not a new query). Severity `blocker`, `resolve_route` = `/admin/foundry/critique`.

6. **Sticky "What we promised the learner" card** — render on `ModuleGenerationPreviewPage` (below amber banner) and on `SideBySideReviewPage` (below header). Shared component: `OutcomesPromiseCard.tsx`. Pull from `useFoundryDraftStore(state => state.currentDraft?.learning_outcomes)`.

7. **Per-lesson outcome tag on preview + side-by-side** — both pages annotate each lesson row in the right pane / aside with `Supports outcome #N` based on AI's outline mapping. Read from `outline.modules[m].lessons[l].supports_outcome_indices: number[]` (new field on the outline schema).

8. **"What learners can now do" on publish confirmation** — `PublishConfirmationPage` inside the white-on-emerald card, between timestamp and congrats paragraph, render `<h3 class="text-sm font-semibold uppercase tracking-wider text-emerald-700">What learners can now do</h3>` + the 3 outcomes as a check-bullet list.

### Out of scope for this slice

- Learner-side outcome displays on `LearnerDashboardPage` + `ModulePlayer` — bundle with the learner-side polish slice.
- Admin-dashboard module list outcome display (`CourseStatusList`) — defer.
- Module version history outcome diffs — defer.

### Acceptance for the AI-integration slice

- Outline generation receives the 3 basics outcomes and returns 3 objectives in same order.
- An outline with any outcome having 0 supporting lessons surfaces a blocker on `PublishBlockersPage` and an issue on `SelfCritiqueReviewPage`.
- Both `ModuleGenerationPreviewPage` and `SideBySideReviewPage` carry the sticky outcomes-promise card.
- `PublishConfirmationPage` shows the 3 outcomes as a check-bullet list inside the success card.

---

## Scope for follow-up slices (defer)

These items need work but should not bundle into either of the two active slices above.

### Slice F1 — Foundry-wide stepper + page-heading + save-state polish (cross-cutting visual)

- Build `FoundryStepper.tsx` (C-1).
- Replace inline `· STEP N` eyebrows with the stepper across all 9 pages.
- Standardize H1 grammar (C-5).
- Standardize save-state copy (C-4).
- Add `Save & exit` outline button to every mid-flow page footer (C-9, depends on draft-persistence work).
- Removes the emerald mid-flow celebration drift (C-8).

### Slice F2 — Cross-cutting brand parity sweep

- Convert the 5 remaining `bg-redex-red` raw-className CTAs to `variant="brand"` (C-3).
- Drop the `🚫` emoji + uppercase from the side-by-side publish-blocked banner (P0-16).
- Drop the `✨ ... One Click` magic-button language on the preview page (P0-12).
- Drop the `🎉` emoji + replace with `CheckCircle2` on the module-complete screen (P0-23).
- Drop the `🔒` emoji on the quiz-lock banner (P2-10).

### Slice F3 — Mock-data leak sweep

- Remove `'HR Basics at Redex'` hardcoded fallbacks (P0-18, P0-19, P1-29).
- Remove `MOCK_PUBLISH_BLOCKERS` fallback from `PublishBlockersPage` (P0-17).
- Remove `DEFAULT_AI_*` fallbacks from page-level call sites (P0-13).
- Wire `LearnerDashboardPage` to real assignments + buddy data (P0-21, P0-22).
- Replace engineer-language tooltips/toasts (`Slice 3.2`, `Slice 3.4`) (P0-10, P0-14).

### Slice F4 — Setup questions structural rework

- Rename `audience_notes` → `audience_detail` (optional), `criticality` → `risk_tier`, drop wizard `estimated_minutes` (C-2).
- Collapse 6-step internal wizard to single scrolling form using `QUESTION_GROUP_TITLES`.
- Add wizard intro: *"These answers refine the basics you've already entered."*
- Surface basics outcomes as the sticky context card (LO integration row 2).

### Slice F5 — Outline-review polish

- Add Regenerate confirmation dialog (P0-9).
- Skeleton during outline generation (P1-15).
- Move status pill near action footer (P1-13).
- Replace `Coming in Slice 3.2` tooltip (P0-10).

### Slice F6 — Preview + critique polish

- Empty-state for missing outline / sources (P0-13).
- Calmer PREVIEW banner copy (P1-16).
- Critique loading micro-status (P1-20).
- Footer back-link semantics fix on critique (P1-19) and side-by-side (P1-22).

### Slice F7 — Source-binder mental-model rework

- Demote the Source Library card from primary to secondary (P0-8).
- Clear-source confirmation (P1-10).
- Orphan-state copy rewrite (P1-11).
- Library tagline rewrite (P1-12).
- Footer button hierarchy (P2-6).

### Slice F8 — Learner-side outcome surfaces (depends on basics-v2 + AI-integration)

- "What you'll learn" inside Continue card on `LearnerDashboardPage` (LO row 12).
- "What you can now do" on `ModulePlayer` complete screen (LO row 15, P0-24).
- Replace `🎉` with `CheckCircle2` on complete screen (P0-23).

### Slice F9 — Admin dashboard + version history outcome surfaces

- First outcome as `item.meta` on `CourseStatusList` rows (LO row 9).
- Outcomes subsection on `ModuleVersionHistoryPage` (LO row 11).

### Slice F10 — Set 'Save & exit' canonical affordance (depends on draft-persistence)

- Adds the `Save & exit` outline button to every mid-flow Foundry page once draft-persistence has a real exit API.

---

## Verification before merging either active slice

- `npm run test` clean (extend existing fixtures with `learning_outcomes`).
- Visual screenshot diff vs `8094d67`: (a) basics page with 3-outcome input rows, (b) outline review with side-by-side outcomes ↔ objectives, (c) publish confirmation with "What learners can now do" subsection.
- Spot-check at `<md` (mobile): basics outcome rows stack with the constant prefix wrapping; outline-review ladder collapses to single-column.
- Manual click of every Foundry-page primary CTA to confirm pressed state visibly darkens to `redex-red-active` (the C-3 brand-parity check).
- `grep -nE "(Slice [0-9]+\.[0-9]+|HR Basics at Redex|Sarah Chen|MOCK_PUBLISH_BLOCKERS)" src/features/foundry/pages/ src/features/learner/pages/ src/features/source-binder/pages/` returns no matches in customer-surface files.

---

*End of audit.*
