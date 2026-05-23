> **Status (2026-05-23): Historical for Phase 10+.**
> Phases 0–9.x in this document are the controlling spec.
> Phase 10+ work is governed by `docs/Redex_Education_Phase10-13_Roadmap_v2_20260523.md` (with companion `docs/Redex_Education_Moonshot_Strategy_v2_20260523.md`).
> v2 introduces Part 1 (Finish-Line gate), the Pilot gate before Phase 13, and explicit non-negotiables (no leaderboards / streaks-as-mechanic / badge walls / syntax highlighting / content tabs / multi-tenant).
> v2 also corrects: `src/integrations/supabase/types.ts` is from an unrelated project (Slice 8.5); cost telemetry must precede real AI (AI Slice C); section-level regeneration is first-class; one unified item bank (Slice 11.2); one `RedexVideoPlayer` component (Slice 10.6).
> See ADR 015 (Supabase-only generation pipeline) and ADR 016 (single video player).

# REDEX EDUCATION — CODEX + LINEAR ROADMAP HANDOFF

## Purpose of This File

This markdown file is the master roadmap handoff for building **Redex Education** using Codex and Linear.

It is designed for a coding AI agent to understand:

- What is being built.
- Why it is being built.
- What the final product should feel like.
- How the work should be sliced.
- What each slice should produce.
- How Linear tickets should be created and sequenced.
- What must be accepted before moving to the next slice.

This is not a brainstorm document.

This is the build roadmap.

---

## Revision Note — 2026-05-22 (Architecture Revision)

This roadmap was revised on 2026-05-22 after a six-angle audit of the live codebase. Key changes:

1. The **Source Binder now has two intake paths** — paste markdown (Slice 2.3, unchanged) and a **Google Drive Source Library** (new Slice 2.4).
2. The old Slice 2.4 (AI Setup Questions Wizard) is renumbered to **Slice 2.5**.
3. Phase 3, Phase 4, Slice 7.3, and Slice 8.2 were updated to reference the Drive-based source model and the module↔source binding.
4. **Notion is not used** — the registry lives in Supabase. Rationale: `docs/decisions/010-drive-source-library-notion-dropped.md`.

Slice 2.3's spec text was deliberately left untouched — it was under active build at revision time.

---

# 1. Product Name

**Redex Education**  
Also referred to as: **Redex Academy**, **Redex Training OS**, or **Redex AI Course Foundry**.

Preferred user-facing name for now: **Redex Academy**  
Preferred internal product name: **Redex Education**

Domain target:

```txt
education.redexops.com
```

GitHub repo:

```txt
https://github.com/lewis4x4/Redex-Education
```

---

# 2. Executive Product Definition

Redex Education is an AI-powered internal training platform for Redex employees.

It is not a traditional LMS.

The product has two connected systems:

## 1. Employee Learning Journey

A simple, guided, beautiful training experience for new hires and existing Redex employees.

Employees should always know:

1. What do I need to do now?
2. How far along am I?
3. Who can help me if I am stuck?

## 2. Admin AI Course Foundry

An admin-side system that allows Redex to upload or paste raw company knowledge and automatically generate structured, interactive training modules.

The Course Foundry must convert:

- Markdown
- PDFs
- SOPs
- Videos
- Screenshots
- HR policies
- Safety policies
- Field procedures
- Customer-specific requirements
- Manager notes

Into:

- Courses
- Modules
- Lessons
- Scenarios
- Knowledge checks
- Final quizzes
- Acknowledgments
- Review cards
- Manager notes
- Completion records
- Versioned published training

The core loop is:

```txt
Source Material
→ Source Binder
→ AI Setup Questions
→ AI Outline
→ Admin Outline Approval
→ AI Lesson + Assessment Generation
→ AI Self-Critique
→ Admin Side-by-Side Review
→ Regenerate or Edit
→ Publish
→ Assign
→ Employee Completes
→ Progress + Audit Tracking
```

---

# 3. The Real Problem Being Solved

Redex needs excellent employee training, but building courses manually is too labor-intensive.

Redex does not currently have a dedicated instructional design department.

The company can gather source information, but it needs a system that turns raw knowledge into polished, usable, approved training.

The product must solve this:

```txt
Raw Redex knowledge in → Approved interactive training out.
```

That is the core breakthrough.

---

# 4. Product North Star

Build a training operating system where Redex can rapidly create, approve, publish, assign, and track high-quality training without manually designing every course from scratch.

The product should feel:

- Simple for employees.
- Powerful for admins.
- Trustworthy for HR, safety, and compliance.
- Premium and modern.
- Practical, not gimmicky.
- Redex-specific, not generic LMS software.

---

# 5. Product Non-Negotiables

1. Do not build a generic LMS clone.
2. Do not let AI publish without human approval.
3. Do not allow AI to invent Redex policy.
4. Do not bury employees in confusing navigation.
5. Do not require admins to manually design every lesson.
6. Do not overbuild Phase 3 features before the Course Foundry loop works.
7. Do not skip source grounding.
8. Do not skip versioning for published modules.
9. Do not skip completion and progress tracking.
10. Do not lose the core product loop.

---

# 6. Current Recommended Tech Foundation

Assume the project has already been initialized with:

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui-style component foundation
- React Router
- TanStack Query
- Zod
- React Hook Form
- Zustand
- Lucide React
- Framer Motion
- Recharts
- Date-fns
- Supabase client installed but not necessarily connected yet

If any of this is not installed, create a Linear setup ticket first and complete foundation setup before product work.

---

# 7. Build Philosophy for Codex

Codex should build this in controlled vertical slices.

Each slice must:

- Have a clear outcome.
- Be small enough to review.
- Include UI, state, types, and mock data where backend is not ready.
- Avoid fake production behavior.
- Update the Build Bible.
- Include acceptance notes.
- Commit cleanly.

Do not build randomly across the app.

Do not create giant unreviewable commits.

Do not jump ahead to Phase 3 ideas.

Do not introduce backend complexity before the frontend workflow is understood.

---

# 8. Required Project Bible

Maintain this file throughout the build:

```txt
docs/REDEX_EDUCATION_BUILD_BIBLE.md
```

Every slice must update it.

## Required Build Bible Sections

```md
# REDEX EDUCATION BUILD BIBLE

## Current Phase

## Current Slice

## Source of Truth

## Completed

## In Progress

## Open Decisions

## Known Gaps

## Database Changes

## AI Prompt Changes

## UX Decisions

## Linear Ticket Mapping

## Acceptance Criteria Status

## Test Notes

## Next Actions
```

The Build Bible is the running source of truth for the coding agent and project owner.

---

# 9. Agent Lens Review Used to Shape This Roadmap

This roadmap was reviewed from the following build perspectives:

1. **CEO/Product Lens** — protects the business outcome and core loop.
2. **Employee UX Lens** — ensures employees do not hate using it.
3. **Admin Workflow Lens** — reduces course creation labor.
4. **AI Course Generation Lens** — makes generation useful, structured, and reviewable.
5. **Source Grounding Lens** — prevents hallucinated Redex policy.
6. **HR/Compliance Lens** — protects approvals, versioning, and audit trail.
7. **Technical Architecture Lens** — keeps slices buildable.
8. **Data Model Lens** — ensures future persistence is possible.
9. **Linear/Codex Execution Lens** — makes the work ticket-friendly.
10. **Moonshot Lens** — preserves future extensibility without bloating MVP.

The result is a slice-based roadmap designed to build the product in the correct order.

---

# 10. Phasing Overview

## Phase 0 — Foundation and Product Skeleton

Goal: Confirm the repo foundation and create the app’s structural shell.

## Phase 1 — Learner Experience Prototype

Goal: Build a beautiful employee-facing onboarding flow using mock data.

## Phase 2 — Admin Course Foundry Prototype

Goal: Build the admin-side course creation workflow using mock data.

## Phase 3 — Source Binder and AI Review Loop

Goal: Add source material handling, setup questions, AI generation states, self-critique, and review screens.

## Phase 4 — Course/Module/Lesson Data Model

Goal: Convert mock flows into structured typed data that can later persist to Supabase.

## Phase 5 — HR Onboarding Vertical Slice

Goal: Build the first complete training module from source to employee completion.

## Phase 6 — Assignment, Progress, and Manager Visibility

Goal: Track employee assignments, completion, quiz status, and manager/admin visibility.

## Phase 7 — Publishing, Versioning, Audit Trail

Goal: Ensure approved content is versioned and changes are auditable.

## Phase 8 — Supabase Integration

Goal: Move from local/mock data to real persistence.

## Phase 9 — Phase 2/3 Enhancements Backlog

Goal: Capture future moonshot features without polluting MVP.

---

# 11. Linear Setup Guidance

Create Linear issues as slices, not random tasks.

Each issue should include:

- Objective
- Files likely touched
- Expected UI/end state
- Data requirements
- Acceptance criteria
- Test steps
- Build Bible update requirement

Recommended Linear labels:

- `foundation`
- `learner`
- `admin`
- `foundry`
- `source-binder`
- `ai-workflow`
- `assessment`
- `progress`
- `manager`
- `versioning`
- `supabase`
- `polish`
- `backlog`

Recommended Linear milestones:

1. Foundation Ready
2. Learner Prototype Ready
3. Course Foundry Prototype Ready
4. HR Module Vertical Slice Ready
5. Assignment + Progress Ready
6. Publish + Versioning Ready
7. Supabase MVP Ready

---

# 12. Slice Roadmap

---

## SLICE 0.1 — Verify Repo Foundation

### Goal

Ensure the repo is ready for real product work.

### End State

The app runs locally, builds cleanly, has the expected folder structure, and includes the Build Bible.

### Likely Files

```txt
package.json
vite.config.ts
tsconfig.json
tsconfig.app.json
src/App.tsx
src/index.css
docs/REDEX_EDUCATION_BUILD_BIBLE.md
```

### Requirements

- Confirm React + TypeScript app runs.
- Confirm Tailwind works.
- Confirm shadcn/ui components work or minimal UI component foundation exists.
- Confirm alias import `@/` works.
- Confirm `npm run build` passes.
- Confirm Build Bible exists.

### Acceptance Criteria

- `npm install` works.
- `npm run dev` works.
- `npm run build` passes.
- Build Bible is present and updated.
- Repo has clean initial commit.

### Linear Ticket Title

```txt
Foundation: verify Redex Education repo setup
```

---

## SLICE 0.2 — App Shell and Navigation Frame

### Goal

Create the global app shell used by learner, admin, and manager views.

### End State

The app has a premium Redex Academy shell with top navigation, product identity, route switching, and basic layout structure.

### Expected UI

Top header:

- Redex Academy logo mark.
- Product name.
- Experience toggle or route tabs:
  - Learner experience
  - Admin experience
  - Manager experience if needed later
- Breadcrumb row below header.

Main page:

- Centered layout.
- Premium card surfaces.
- Red/black/gray visual language.

### Likely Files

```txt
src/App.tsx
src/app/router.tsx
src/components/layout/AppShell.tsx
src/components/layout/TopNav.tsx
src/components/layout/BreadcrumbBar.tsx
src/components/layout/PageContainer.tsx
src/lib/navigation.ts
```

### Acceptance Criteria

- Routes exist for learner and admin placeholder pages.
- Header remains consistent across pages.
- Visual style is premium and not generic.
- Works on desktop and reasonable tablet widths.
- Build Bible updated.

### Linear Ticket Title

```txt
Foundation: build global app shell and route frame
```

---

# 13. Phase 1 — Learner Experience Prototype

Phase 1 focuses only on the employee experience.

The goal is to prove that Redex training can feel simple, guided, and premium.

Do not build real AI generation yet.

Use mock data.

---

## SLICE 1.1 — Learner First-Day Welcome Screen

### Goal

Build the first screen a new Redex employee sees.

### End State

A polished first-day welcome screen inspired by the mockups already reviewed.

The screen should communicate:

- Welcome to Redex.
- You are set up and ready.
- This will take about 20 minutes.
- Progress saves automatically.
- One path, start to finish.
- Clear CTA to start onboarding.

### Expected UI

Include:

- Eyebrow: `WELCOME TO THE TEAM`
- Headline: `Good to have you, Marcus.`
- Short helper copy.
- Welcome video card placeholder.
- CTA: `Start onboarding →`
- Reassurance text: `No passwords. No menus to learn. One path, start to finish.`

Visual style:

- Premium Apple/Stripe-style cleanliness.
- Redex red accent.
- Dark header.
- Light gray page background.
- Large rounded white card.
- Not childish.

### Likely Files

```txt
src/features/employee/pages/LearnerWelcomePage.tsx
src/features/employee/components/WelcomeHero.tsx
src/features/employee/components/WelcomeVideoCard.tsx
src/features/employee/data/mockLearner.ts
src/types/training.ts
```

### Acceptance Criteria

- Learner welcome route renders.
- CTA leads to onboarding journey page placeholder.
- Uses mock employee name.
- Looks premium and clean.
- Build passes.
- Build Bible updated.

### Linear Ticket Title

```txt
Learner: build first-day welcome screen
```

---

## SLICE 1.2 — Learner Journey Dashboard

### Goal

Build the learner’s assigned training overview.

### End State

Employee can see assigned onboarding path and what to do next.

### Expected UI

Dashboard should answer:

1. What do I need to do now?
2. How far along am I?
3. Who do I ask if I’m stuck?

Include:

- Current assigned course card.
- Progress bar.
- Estimated time remaining.
- Due date if available.
- Next lesson CTA.
- Support/contact card.
- Recently completed list placeholder.

### Likely Files

```txt
src/features/employee/pages/LearnerDashboardPage.tsx
src/features/employee/components/AssignedTrainingCard.tsx
src/features/employee/components/ProgressSummaryCard.tsx
src/features/employee/components/LearnerHelpCard.tsx
src/features/employee/data/mockAssignments.ts
```

### Acceptance Criteria

- Dashboard shows assigned HR onboarding course.
- Primary CTA is obvious.
- Progress is visible but not overwhelming.
- No admin complexity exposed.
- Build Bible updated.

### Linear Ticket Title

```txt
Learner: build assigned training dashboard
```

---

## SLICE 1.3 — Learner Module Player Shell

### Goal

Build the module player used to complete lessons.

### End State

Employee can move through a module using mock lessons.

### Expected UI

Include:

- Module title.
- Lesson title.
- Progress indicator.
- Lesson content card.
- Previous / Next controls.
- Save/progress indicator.
- Optional help button.

Lesson types for prototype:

- Text lesson.
- Checklist lesson.
- Acknowledgment lesson.
- Knowledge check placeholder.

### Likely Files

```txt
src/features/employee/pages/ModulePlayerPage.tsx
src/features/employee/components/ModulePlayer.tsx
src/features/employee/components/LessonRenderer.tsx
src/features/employee/components/ModuleProgressRail.tsx
src/features/employee/components/LessonControls.tsx
src/features/employee/data/mockHrModule.ts
```

### Acceptance Criteria

- Employee can navigate through mock lessons.
- Progress visually updates.
- Lesson renderer handles at least text, checklist, and acknowledgment types.
- No real backend required yet.
- Build Bible updated.

### Linear Ticket Title

```txt
Learner: build module player shell with mock lessons
```

---

## SLICE 1.4 — Learner Quiz and Completion Screen

### Goal

Add a basic quiz and module completion flow.

### End State

Employee can answer mock quiz questions and see a completion screen.

### Expected UI

Quiz:

- Question card.
- Multiple choice answers.
- Submit answer.
- Feedback after answer if enabled.
- Score summary.

Completion:

- Completed status.
- Score if quiz exists.
- Completion date.
- Next step CTA.

### Likely Files

```txt
src/features/employee/components/QuizRenderer.tsx
src/features/employee/components/QuizQuestionCard.tsx
src/features/employee/pages/ModuleCompletePage.tsx
src/features/employee/utils/quizScoring.ts
```

### Acceptance Criteria

- Quiz can be completed with mock questions.
- Score calculates locally.
- Completion screen renders.
- Passing/failing state exists.
- Build Bible updated.

### Linear Ticket Title

```txt
Learner: add quiz and completion flow
```

---

# 14. Phase 2 — Admin Course Foundry Prototype

Phase 2 builds the admin creation experience with mock data.

The admin must feel like the system guides them through course creation.

Do not connect real AI yet.

Simulate AI states and generated content.

---

## SLICE 2.1 — Admin Dashboard Shell

### Goal

Build the admin landing page.

### End State

Admin can see courses, drafts, review needs, and entry point into the Course Foundry.

### Expected UI

Include:

- Create new module CTA.
- Draft modules.
- Needs review.
- Published modules.
- Assigned training summary.
- Basic analytics cards.

### Likely Files

```txt
src/features/admin/pages/AdminDashboardPage.tsx
src/features/admin/components/AdminMetricCard.tsx
src/features/admin/components/FoundryEntryCard.tsx
src/features/admin/components/CourseStatusList.tsx
src/features/admin/data/mockAdmin.ts
```

### Acceptance Criteria

- Admin dashboard route works.
- Primary CTA leads to Course Foundry start.
- Draft/review/published states visible.
- Build Bible updated.

### Linear Ticket Title

```txt
Admin: build admin dashboard shell
```

---

## SLICE 2.2 — Course Foundry Start Flow

### Goal

Build the starting point for creating a module.

### End State

Admin can start a new module and choose whether it is standalone or part of a course.

### Expected UI

Fields:

- Module title.
- Parent course selection.
- Audience.
- Required/optional.
- Training type.
- Estimated duration target.

Training types:

- HR
- Operational
- Safety
- Compliance
- Customer-specific
- Role-specific
- General informational

### Likely Files

```txt
src/features/foundry/pages/FoundryStartPage.tsx
src/features/foundry/components/ModuleBasicsForm.tsx
src/features/foundry/schemas/foundrySchemas.ts
src/features/foundry/types.ts
```

### Acceptance Criteria

- Form validates with Zod.
- Admin can proceed to source upload step.
- Data persists locally in Zustand or route state.
- Build Bible updated.

### Linear Ticket Title

```txt
Foundry: build module basics start flow
```

---

## SLICE 2.3 — Source Upload / Paste Step

### Goal

Build the Source Binder input screen.

### End State

Admin can paste markdown and see it represented as source material.

### Expected UI

Include:

- Paste markdown textarea.
- Upload file placeholder area.
- Source title.
- Source type.
- Preview/extracted text area.
- Continue button.

For MVP frontend prototype, file upload can be mocked.

### Likely Files

```txt
src/features/source-binder/pages/SourceBinderInputPage.tsx
src/features/source-binder/components/SourcePastePanel.tsx
src/features/source-binder/components/SourceUploadDropzone.tsx
src/features/source-binder/components/SourcePreviewPanel.tsx
src/features/source-binder/utils/markdownSections.ts
```

### Acceptance Criteria

- Admin can paste markdown.
- System parses headings into simple source sections.
- Source preview shows parsed sections.
- No AI generation yet.
- Build Bible updated.

### Linear Ticket Title

```txt
Source Binder: build markdown paste and preview step
```

---

## SLICE 2.4 — Source Library & Drive Ingestion

### Goal

Connect the Course Foundry to a Google Drive **Source Library** so admins can build modules from real, versioned Redex source material — not only pasted markdown.

### Background

Slice 2.3 delivers the paste-markdown path. Slice 2.4 adds the primary intake path: a Google Drive folder structure that non-technical staff (HR, SMEs) can dump source material into without learning the app.

Drive structure:

- `_library/` — canonical source files organized by topic. Each file is the single source of truth; never duplicated.
- `modules/<module>/` — one folder per training module, each with a `00-manifest.md`.
- Each source file declares an `authority` level — `authoritative`, `supporting`, or `context` — in YAML frontmatter (markdown files) or a sibling `<filename>.meta.md` (PDFs, images, video transcripts).
- Source files are referenced by **stable Google Drive file ID**, never by path.

### End State

Admin can connect the Drive Source Library, browse `_library/` files, and select source files for a module. Selected files are ingested into the app and parsed into source sections. `00-manifest.md` is an advisory human-readable mirror — the app owns the authoritative binding records.

### Expected UI

- "Connect / Sync from Drive" action on the Source Binder screen, alongside the Slice 2.3 paste path.
- Source Library browser — `_library/` files with topic, authority badge, last-modified.
- Per-module source selection — pick the files this module is built from.
- Ingestion/parsing status per file.

### Likely Files

```txt
src/features/source-binder/pages/SourceLibraryPage.tsx
src/features/source-binder/components/DriveSyncButton.tsx
src/features/source-binder/components/SourceLibraryBrowser.tsx
src/features/source-binder/components/SourceAuthorityBadge.tsx
src/features/source-binder/lib/manifest.ts
supabase/functions/drive-sync/index.ts
supabase/functions/parse-source-file/index.ts
```

### Data Requirements

New tables (see Slice 8.2): `source_files` (keyed by Drive file ID), `source_file_versions`, `source_sections`, `module_source_bindings`. Authority level is a column on `source_files`. v1 sync is a manual admin-triggered "Sync from Drive" action; scheduled polling is a fast-follow (see Slice 7.3).

### Conflict Rule

The generator resolves conflicting sources by authority: `authoritative` > `supporting` > `context`. Two sources of **equal** authority that conflict must be flagged for a human — never auto-resolved.

### Acceptance Criteria

- Admin can connect Drive and browse the `_library/` Source Library.
- Source files ingest with their Drive file ID, authority level, and parsed sections.
- A module records which source files (and versions) it was built from.
- Manifest is parsed advisory-only; the app's binding records are authoritative.
- Paste path from Slice 2.3 still works as a secondary input.
- Build Bible updated.

### Linear Ticket Title

```txt
Source Binder: build Google Drive Source Library and ingestion
```

---

## SLICE 2.5 — AI Setup Questions Wizard

### Goal

Build the questions the Course Foundry asks before generation.

### End State

Admin answers structured setup questions used to drive module generation.

### Required Question Groups

1. Course/module identity.
2. Audience.
3. Training type.
4. Criticality.
5. Assessment style.
6. Experience style.
7. Timing.
8. Source control.
9. Approval requirements.

### Criticality Options

- Informational
- Basic Knowledge
- Operational
- Compliance / Safety / High-Risk

### Assessment Options

- No assessment
- Light quiz
- Standard quiz
- Strict quiz
- Scenario-based assessment
- Acknowledgment only

### Likely Files

```txt
src/features/foundry/pages/FoundryQuestionsPage.tsx
src/features/foundry/components/QuestionWizard.tsx
src/features/foundry/components/CriticalitySelector.tsx
src/features/foundry/components/AssessmentConfigPanel.tsx
src/features/foundry/data/setupQuestions.ts
```

### Acceptance Criteria

- Wizard is easy to complete.
- Criticality selection changes helper text.
- Assessment settings are stored.
- Continue leads to outline generation preview.
- Build Bible updated.

### Linear Ticket Title

```txt
Foundry: build AI setup questions wizard
```

---

# 15. Phase 3 — Source Binder and AI Review Loop

This phase makes the Course Foundry feel intelligent and safe.

Actual AI calls may still be mocked initially, but the UI and data structures must match the intended production flow.

**Source model note (2026-05-22 revision):** "Source sections" throughout Phase 3 are sections of source files held in the Google Drive Source Library (Slice 2.4), identified by Drive file ID and revision. Every generated lesson, claim, and assessment item must bind to the specific source file + section it derived from — this binding is what powers side-by-side review (Slice 3.4) and version-impact detection (Slice 7.3).

---

## SLICE 3.1 — Generated Outline Review

### Goal

Show a proposed AI-generated module outline after setup questions.

### End State

Admin can review, edit, approve, or regenerate the outline.

### Expected UI

Include:

- Generated module title.
- Description.
- Learning objectives.
- Lesson list.
- Lesson types.
- Estimated time.
- Assessment recommendation.
- Source references.
- Missing info warnings.

Actions:

- Approve outline.
- Edit outline.
- Regenerate outline.
- Back to questions.

### Likely Files

```txt
src/features/foundry/pages/OutlineReviewPage.tsx
src/features/foundry/components/GeneratedOutlineCard.tsx
src/features/foundry/components/LessonOutlineList.tsx
src/features/foundry/components/MissingInfoWarnings.tsx
src/features/foundry/data/mockGeneratedOutline.ts
```

### Acceptance Criteria

- Outline renders from structured data.
- Admin can approve outline.
- Missing source warnings are visible.
- Regenerate action exists as mocked behavior.
- Build Bible updated.

### Linear Ticket Title

```txt
Foundry: build generated outline review step
```

---

## SLICE 3.2 — Full Module Generation Preview

### Goal

After outline approval, show generated lessons and assessments in preview mode.

### End State

Admin sees the generated module before publishing.

### Expected UI

Include:

- Lesson tabs or vertical lesson list.
- Generated lesson body.
- Generated quiz/assessment.
- Generated acknowledgment text if applicable.
- Status labels:
  - Draft
  - Needs review
  - Unsupported claim
  - Missing source
  - Ready for approval

### Required Magic Button

Add optional action:

```txt
Generate Full Module in One Click (Preview Mode)
```

This may generate all lessons and assessment at once, but it must not publish.

### Likely Files

```txt
src/features/foundry/pages/ModuleGenerationPreviewPage.tsx
src/features/foundry/components/GeneratedLessonPreview.tsx
src/features/foundry/components/GeneratedAssessmentPreview.tsx
src/features/foundry/components/GenerationStatusBadge.tsx
src/features/foundry/data/mockGeneratedModule.ts
```

### Acceptance Criteria

- Admin can view generated lessons.
- Admin can view generated quiz.
- Preview mode is clearly not published.
- One-click generation exists as a mocked action.
- Build Bible updated.

### Linear Ticket Title

```txt
Foundry: build full module generation preview
```

---

## SLICE 3.3 — AI Self-Critique Review Step

### Goal

Add the self-critique step after module generation.

### End State

System reviews its own generated module and surfaces issues to the admin.

### Expected UI

Self-critique panel should show:

- Unsupported claims.
- Weak questions.
- Missing source references.
- Confusing employee language.
- Overly corporate wording.
- Missing critical information.
- Areas needing admin approval.

Actions:

- Regenerate with fixes.
- Ignore item with note.
- Edit manually.
- Return to source binder.

### Likely Files

```txt
src/features/foundry/components/SelfCritiquePanel.tsx
src/features/foundry/components/CritiqueIssueCard.tsx
src/features/foundry/components/RegenerateWithFixesButton.tsx
src/features/foundry/data/mockSelfCritique.ts
```

### Acceptance Criteria

- Self-critique issues render clearly.
- Admin can trigger mocked regenerate-with-fixes.
- Issues have severity.
- High-severity issues block publish.
- Build Bible updated.

### Linear Ticket Title

```txt
Foundry: add AI self-critique and regenerate loop
```

---

## SLICE 3.4 — Side-by-Side Admin Review

### Goal

Allow admin to compare generated content against the source reference.

### End State

Admin can review generated lesson content side-by-side with the source section it came from.

### Expected UI

Two-column layout:

```txt
Generated Content | Source Reference
```

Include:

- Highlighted source section.
- Confidence indicator.
- Unsupported claim marker.
- Edit generated content.
- Approve lesson.
- Request regeneration.

### Likely Files

```txt
src/features/foundry/pages/SideBySideReviewPage.tsx
src/features/foundry/components/GeneratedSourceCompare.tsx
src/features/foundry/components/SourceReferencePanel.tsx
src/features/foundry/components/ReviewActionBar.tsx
```

### Acceptance Criteria

- Generated/source comparison is clear.
- Admin can approve individual lessons.
- Unsupported or missing source items are obvious.
- Publish remains blocked until required items are resolved.
- Build Bible updated.

### Linear Ticket Title

```txt
Foundry: build side-by-side generated/source review
```

---

## SLICE 3.5 — Placeholder and Missing Source Policy

### Goal

Enforce missing-source behavior.

### End State

If source content is missing, placeholder, or unsupported, the UI and data model flag it clearly.

### Required Policy

If source content contains:

- `[PLACEHOLDER]`
- `[TODO]`
- missing policy language
- unclear instructions
- unsupported claims

Then generated output must show:

```txt
⚠️ MISSING SOURCE — Admin must provide approved content before publishing.
```

### Likely Files

```txt
src/features/source-binder/utils/sourceValidation.ts
src/features/foundry/components/MissingSourceBanner.tsx
src/features/foundry/components/PublishBlockerList.tsx
src/features/foundry/data/mockMissingSource.ts
```

### Acceptance Criteria

- Placeholder text is detected in mock source.
- Missing-source warning appears.
- Publish is blocked while unresolved.
- Build Bible updated.

### Linear Ticket Title

```txt
Source Binder: enforce placeholder and missing-source policy
```

---

# 16. Phase 4 — Structured Data Model

This phase creates the typed data contracts that define the product.

Even before Supabase integration, the app should use strong TypeScript models.

---

## SLICE 4.1 — Training Domain Types

### Goal

Create TypeScript types for courses, modules, lessons, assessments, source binders, assignments, progress, and reviews.

### End State

All major mock data uses shared domain types.

### Likely Files

```txt
src/types/training.ts
src/types/foundry.ts
src/types/sourceBinder.ts
src/types/assignments.ts
src/types/users.ts
src/types/reviews.ts
```

### Required Types

- User
- Role
- Course
- Module
- Lesson
- LessonType
- Assessment
- AssessmentQuestion
- CriticalityLevel
- SourceBinder
- SourceDocument
- SourceSection
- SourceReference
- SourceFile
- SourceFileVersion
- SourceAuthorityLevel
- ModuleSourceBinding
- ModuleVersion
- SourceChangeEvent
- GeneratedContentReview
- Assignment
- ProgressRecord
- AssessmentAttempt
- Acknowledgment
- AuditLog

### Acceptance Criteria

- Shared types exist.
- Mock data uses shared types.
- No duplicate scattered type definitions.
- Build Bible updated.

### Linear Ticket Title

```txt
Data: define core training domain types
```

---

## SLICE 4.2 — Local Mock Data Store

### Goal

Centralize mock data and local app state.

### End State

Learner, admin, and foundry flows share realistic mock data.

### Likely Files

```txt
src/data/mockUsers.ts
src/data/mockCourses.ts
src/data/mockModules.ts
src/data/mockSourceBinders.ts
src/data/mockAssignments.ts
src/data/mockProgress.ts
src/store/trainingStore.ts
src/store/foundryStore.ts
```

### Acceptance Criteria

- Mock HR onboarding course exists.
- Mock employee Marcus exists.
- Mock admin exists.
- Mock manager exists.
- Foundry flow can read/write local draft state.
- Build Bible updated.

### Linear Ticket Title

```txt
Data: create shared mock training store
```

---

# 17. Phase 5 — HR Onboarding Vertical Slice

This phase connects the learner and admin experiences around the first real course concept: HR onboarding.

---

## SLICE 5.1 — HR Onboarding Source Markdown Fixture

### Goal

Create a sample HR onboarding source markdown file for development.

### End State

The app has a sample source file that simulates what Redex would provide.

### Important Rule

Do not invent real Redex HR policy.

Use clearly marked sample content and placeholders where actual policy is needed.

### File

```txt
docs/sample-source/HR_ONBOARDING_SOURCE_SAMPLE.md
```

### Required Sections

- Welcome to Redex.
- HR contact path.
- Payroll basics placeholder.
- Timekeeping expectations placeholder.
- PTO/time-off placeholder.
- Required forms placeholder.
- Communication expectations.
- First-week expectations.
- Manager escalation path placeholder.

Any unknown policy must be marked:

```txt
[PLACEHOLDER — Redex must provide approved policy language]
```

### Acceptance Criteria

- Sample source file exists.
- Placeholder sections are clearly marked.
- Source Binder parser detects placeholders.
- Build Bible updated.

### Linear Ticket Title

```txt
HR Prototype: create sample HR onboarding source markdown
```

---

## SLICE 5.2 — Generate HR Module Mock From Source

### Goal

Create a mocked generated HR module based on the sample source.

### End State

The admin can see the HR module as if it was generated by the Course Foundry.

### Expected Output

Generated module:

- Title: HR Basics at Redex
- Audience: New hires
- Criticality: Basic Knowledge
- Estimated time: 20 minutes
- Assessment: light quiz, 5 questions, 80% passing

Lessons:

1. Welcome to Redex
2. Who to Contact for HR Help
3. Payroll and Timekeeping Basics
4. First-Week Expectations
5. Required Acknowledgment
6. Final Quiz

### Acceptance Criteria

- HR module mock data exists.
- Lessons reference source sections.
- Placeholder-based sections show missing-source warnings.
- Learner player can render the HR module.
- Admin review can render the HR module.
- Build Bible updated.

### Linear Ticket Title

```txt
HR Prototype: create generated HR module mock
```

---

## SLICE 5.3 — End-to-End HR Learner Flow

### Goal

Allow employee to complete the mock HR onboarding module from welcome to completion.

### End State

Marcus can:

1. See assigned HR onboarding.
2. Start module.
3. Complete lessons.
4. Complete acknowledgment.
5. Take final quiz.
6. See completion screen.

### Acceptance Criteria

- Flow works without admin involvement.
- Progress state updates locally.
- Completion state is shown.
- Quiz score is calculated.
- Build Bible updated.

### Linear Ticket Title

```txt
HR Prototype: complete end-to-end learner HR flow
```

---

## SLICE 5.4 — End-to-End HR Admin Foundry Flow

### Goal

Allow admin to walk through the full Course Foundry flow for HR onboarding using mock generation.

### End State

Admin can:

1. Create HR module draft.
2. Paste HR source markdown.
3. Answer setup questions.
4. Review generated outline.
5. Generate full module preview.
6. See self-critique.
7. Review side-by-side source references.
8. Resolve or view publish blockers.
9. Publish when all required blockers are resolved.

### Acceptance Criteria

- Admin can complete the mocked Foundry flow.
- Missing-source blockers appear for placeholder sections.
- Publish is blocked until blockers are marked resolved or replaced.
- Published status appears after approval.
- Build Bible updated.

### Linear Ticket Title

```txt
HR Prototype: complete end-to-end admin Course Foundry flow
```

---

# 18. Phase 6 — Assignment, Progress, and Manager Visibility

---

## SLICE 6.1 — Assignment Model and Admin Assignment UI

### Goal

Allow admin to assign a published module to a user or role using mock data.

### End State

Admin can assign HR onboarding to Marcus or a new hire group.

### Expected UI

- Select module.
- Select user or audience group.
- Set due date.
- Assign button.
- Confirmation state.

### Likely Files

```txt
src/features/assignments/pages/AssignmentAdminPage.tsx
src/features/assignments/components/AssignmentForm.tsx
src/features/assignments/components/AssignedUsersTable.tsx
```

### Acceptance Criteria

- Assignment can be created in local state.
- Learner dashboard reflects assigned module.
- Build Bible updated.

### Linear Ticket Title

```txt
Assignments: build admin assignment flow
```

---

## SLICE 6.2 — Progress Tracking State

### Goal

Track local progress through modules and lessons.

### End State

Progress records update as the learner completes lessons and quizzes.

### Acceptance Criteria

- Lesson completion state is stored locally.
- Module progress percentage updates.
- Quiz attempt is stored.
- Completion timestamp is stored.
- Build Bible updated.

### Linear Ticket Title

```txt
Progress: implement local learner progress tracking
```

---

## SLICE 6.3 — Manager Team Training Dashboard

### Goal

Give managers visibility into team training status.

### End State

Manager can see who is complete, incomplete, overdue, or failed.

### Expected UI

- Team member list.
- Assigned module.
- Status.
- Progress percent.
- Score if applicable.
- Due date.
- Filter by incomplete/overdue.

### Likely Files

```txt
src/features/manager/pages/ManagerDashboardPage.tsx
src/features/manager/components/TeamTrainingTable.tsx
src/features/manager/components/ManagerSummaryCards.tsx
```

### Acceptance Criteria

- Manager dashboard renders mock team status.
- Marcus completion updates in the table.
- Build Bible updated.

### Linear Ticket Title

```txt
Manager: build team training dashboard
```

---

# 19. Phase 7 — Publishing, Versioning, and Audit Trail

---

## SLICE 7.1 — Publish Workflow and Approval States

### Goal

Formalize module publication states.

### States

- Draft
- Source Added
- Questions Complete
- Outline Approved
- Generated
- Self-Critiqued
- Needs Review
- Blocked
- Approved
- Published
- Archived

### End State

Admin can move module through states, and publish is only available when requirements are met.

### Acceptance Criteria

- State machine or state helper exists.
- Publish button is disabled when blockers exist.
- Published module becomes assignable.
- Build Bible updated.

### Linear Ticket Title

```txt
Publishing: implement module approval and publish states
```

---

## SLICE 7.2 — Course/Module Versioning

### Goal

Add versioning behavior for published content.

### End State

When published content changes, a new version is created.

### Requirements

Track:

- Version number.
- Published date.
- Approved by.
- Source binder version.
- Assessment version.
- Employees who completed each version.

### Acceptance Criteria

- Mock version history renders.
- Published module cannot be silently edited.
- Editing published content creates draft new version.
- Build Bible updated.

### Linear Ticket Title

```txt
Versioning: add module version history behavior
```

---

## SLICE 7.3 — Source Change Detection and Version Impact Review

### Goal

When a source file changes in the Google Drive Source Library, detect it, identify every module built from that source, and let an admin review and act on the impact.

### Detection Mechanism

- **v1:** a manual admin-triggered "Sync from Drive" action. On sync, the system compares each tracked source file's current Drive revision (`headRevisionId`, plus a content hash for binary files) against the `bound_revision_id` stored when each module was generated.
- **Fast-follow:** a scheduled poll (`pg_cron` → edge function, ~30 min) of `modifiedTime`, confirmed by `headRevisionId`. Drive push notifications (watch channels) are intentionally deferred — they add webhook and channel-renewal complexity not justified for an internal tool.

### Impact Computation

A module is **stale** when any source file it is bound to has a newer revision than the module's bound revision. Binding is at the source-section level (see `module_source_bindings`, Slice 8.2), so a change to one section only flags modules that actually used that section. The system writes `source_change_events` and sets an advisory `source_stale` flag on affected modules — a Published module stays Published, but flagged.

### End State

Admin can open a Source Impact Review screen showing changed source files, the changed sections, and every affected lesson / assessment / published module, with a per-module staleness state and a scoped "regenerate affected lessons" action.

### Expected UI

- Changed-source list (file, who/when, old vs. new revision).
- Section-level diff (before/after).
- Affected content grouped by module, each with a status: Up-to-date / Stale / Regenerating.
- Regenerate action — per lesson and bulk; only lessons bound to changed sections re-run.

### Likely Files

```txt
src/features/source-binder/pages/SourceImpactReviewPage.tsx
src/features/source-binder/components/SourceChangeList.tsx
src/features/source-binder/components/SectionDiffView.tsx
src/features/source-binder/components/AffectedModulesPanel.tsx
```

### Acceptance Criteria

- A changed Drive source file is detected on sync.
- Affected modules are identified via section-level bindings — unaffected modules are not flagged.
- Stale modules are flagged without losing their Published state.
- Scoped regeneration re-runs only affected lessons and, on approval, advances their bound revision.
- Build Bible updated.

### Linear Ticket Title

```txt
Source Binder: add source change detection and version impact review
```

---

## SLICE 7.4 — Audit Log UI

### Goal

Show key actions taken in the system.

### End State

Admin can see audit events.

### Events

- Module created.
- Source uploaded.
- Outline generated.
- Outline approved.
- Module generated.
- Self-critique completed.
- Lesson approved.
- Module published.
- Assignment created.
- Employee completed module.
- Quiz attempted.

### Acceptance Criteria

- Audit log page renders mock events.
- Events include actor, action, entity, timestamp.
- Build Bible updated.

### Linear Ticket Title

```txt
Audit: build admin audit log view
```

---

# 20. Phase 8 — Supabase Integration

Do not start this phase until the mock vertical slice is accepted.

The UI and data contracts should be stable first.

---

## SLICE 8.1 — Supabase Environment and Client Setup

### Goal

Connect app to Supabase safely.

### Requirements

- Use environment variables.
- Do not commit secrets.
- Create `.env.example`.
- Add Supabase client helper.

### Likely Files

```txt
.env.example
src/lib/supabase.ts
src/lib/env.ts
```

### Acceptance Criteria

- Supabase client initializes only with env values.
- Missing env values produce clear dev error.
- No secrets committed.
- Build Bible updated.

### Linear Ticket Title

```txt
Supabase: configure environment and client
```

---

## SLICE 8.2 — Database Schema Migration Draft

### Goal

Create initial database schema for MVP.

### Tables

**Already migrated (2026-05-22):** `supabase/migrations/20260522000100_create_training_schema_and_rls.sql` covers the learner-side tables (training courses, modules, lessons, enrollments, progress) with RLS.

**Still to add — learner/admin core:**

- profiles (roles — required before admin RLS works)
- assessments
- assessment_questions
- assessment_attempts
- assignments
- acknowledgments
- audit_logs

**Still to add — Course Foundry + Drive Source Library:**

- source_files (keyed by Google Drive file ID; carries authority level)
- source_file_versions (Drive revision tracking)
- source_sections (parsed sections of a source file)
- module_source_bindings (which source file + section + revision a module/lesson/question was generated from)
- module_versions (publish-state lifecycle and audit)
- source_change_events (detected source changes, for version-impact review)
- generated_content_reviews

### Acceptance Criteria

- Migration file exists.
- Schema matches TypeScript types.
- Build Bible updated with schema notes.

### Linear Ticket Title

```txt
Supabase: draft MVP training schema migration
```

---

## SLICE 8.3 — Replace Mock Reads With Supabase Reads

### Goal

Gradually replace mock data with Supabase reads.

### Priority

1. Users/profiles.
2. Courses/modules/lessons.
3. Assignments.
4. Progress.
5. Source binders.

### Acceptance Criteria

- Learner dashboard reads from Supabase.
- Admin course list reads from Supabase.
- Fallback/mock data removed only when stable.
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

- Create module draft.
- Add source binder content.
- Save setup answers.
- Save generated outline.
- Save generated lessons.
- Publish module.
- Assign training.
- Save learner progress.
- Save quiz attempt.

### Acceptance Criteria

- Key MVP flows persist.
- Errors are handled cleanly.
- No duplicate records on repeated clicks.
- Build Bible updated.

### Linear Ticket Title

```txt
Supabase: persist course foundry and learner progress flows
```

---

# 21. AI Integration Roadmap

Do not wire real AI until the mocked Course Foundry flow is approved.

The app must first prove the workflow.

---

## AI SLICE A — Prompt Registry

### Goal

Create a central prompt registry for AI generation steps.

### Prompts

- Source analysis prompt.
- Setup question inference prompt.
- Outline generation prompt.
- Lesson generation prompt.
- Assessment generation prompt.
- Self-critique prompt.
- Regenerate-with-fixes prompt.

### Likely Files

```txt
src/features/foundry/ai/prompts.ts
src/features/foundry/ai/promptTypes.ts
```

### Acceptance Criteria

- Prompts are centralized.
- Prompts include missing-source policy.
- Prompts prohibit invented Redex policy.
- Build Bible updated.

### Linear Ticket Title

```txt
AI: create Course Foundry prompt registry
```

---

## AI SLICE B — AI Service Interface

### Goal

Create an AI provider abstraction without locking into one vendor.

### Requirements

Define interface for:

- analyzeSource
- generateOutline
- generateLessons
- generateAssessment
- critiqueModule
- regenerateWithFixes

### Likely Files

```txt
src/features/foundry/ai/courseFoundryAiClient.ts
src/features/foundry/ai/mockAiClient.ts
src/features/foundry/ai/types.ts
```

### Acceptance Criteria

- Mock AI client implements the interface.
- UI calls interface, not hardcoded mock data.
- Real provider can be added later.
- Build Bible updated.

### Linear Ticket Title

```txt
AI: create Course Foundry AI service interface
```

---

## AI SLICE C — Real AI Endpoint Placeholder

### Goal

Prepare for real AI calls without exposing secrets in frontend.

### Requirement

AI calls must go through server/API route/edge function, not directly from browser with secret keys.

### Acceptance Criteria

- Placeholder server route or edge function plan exists.
- Frontend does not contain AI API keys.
- Build Bible updated.

### Linear Ticket Title

```txt
AI: prepare secure server-side AI endpoint pattern
```

---

# 22. Redex Coach Roadmap

Redex Coach is an optional employee AI mentor.

It should not be overbuilt in MVP.

---

## MVP Rule

During training, Redex Coach may help explain or navigate, but it must not allow shortcuts.

Before module completion, Redex Coach can answer:

- Where am I?
- What does this section mean?
- Can you explain this in simpler terms?
- Who do I contact for help?

Before completion, Redex Coach cannot:

- Reveal quiz answers.
- Summarize the whole module to bypass required learning.
- Replace required acknowledgments.
- Answer from unapproved content.

After completion, it may answer broader review questions from approved content.

### Future Linear Ticket

```txt
Redex Coach: add restricted learner help assistant
```

---

# 23. Module Template Library Roadmap

This should be Phase 2, not MVP-blocking.

Future templates:

- HR onboarding module.
- Safety acknowledgment module.
- Field process module.
- Customer-specific training module.
- Manager training module.
- Policy update module.
- Incident retraining module.
- Equipment training module.
- Quiz-only refresher.
- Video + acknowledgment module.

### Future Linear Ticket

```txt
Templates: build Course Foundry module template library
```

---

# 24. Phase 3 Moonshot Backlog

These are intentionally not MVP.

Capture them in Linear backlog with `backlog` and `phase-3` labels.

## Future Ideas

### Auto-Suggest New Modules

When employees ask Redex Coach questions that hit “I don’t have approved content,” the system proposes new module ideas.

### Live Policy Sync

**Google Drive sync was promoted to MVP (Slice 2.4) on 2026-05-22.** Remaining moonshot scope: additional connectors (SharePoint, internal wiki). Notion was evaluated and dropped — the registry lives in Supabase, not a separate tool (see `docs/decisions/010-drive-source-library-notion-dropped.md`).

### Role-Twin Engine

Create a lightweight skill profile per employee and recommend continuing education paths.

### Advanced Simulations

Branching role-play scenarios and field-process simulations.

### External Certification Layer

Certificates, exports, and audit packages.

### Analytics Engine

Track knowledge gaps, repeated misses, department trends, and training impact on operational errors.

---

# 25. Design Standards

## Overall Feel

The app should feel:

- Clean.
- Premium.
- Confident.
- Redex-branded.
- Simple.
- Practical.

Avoid:

- Corporate LMS clutter.
- Childish gamification.
- Overcrowded dashboards.
- Generic admin tables with no hierarchy.
- Excessive animations.

## Visual Language

- Dark charcoal top navigation.
- Red primary action color.
- Light gray page background.
- White or near-white rounded cards.
- Soft shadows.
- Strong typography.
- Clear visual states.

## Brand Tokens (Redex Brand Guide v1.0)

```css
--redex-red: #ED1B24;
--redex-red-dark: #b81419;
--bg-page: #f4f5f7;
--bg-card: #ffffff;
--bg-dark: #08090b;
--bg-dark-soft: #15161a;
--text-primary: #09090b;
--text-secondary: #6b7280;
--border-soft: #e5e7eb;
--success: #16a34a;
--warning: #f59e0b;
--danger: #dc2626;
```

Primary red is the Redex Brand Guide v1.0 value (#ED1B24). The full locked token set and typography spec live in `docs/SLICE_0.2_APP_SHELL_SPEC.md`.

---

# 26. Testing Expectations

Every slice should run:

```bash
npm run build
```

If lint/test scripts exist, run them too.

Recommended later:

```bash
npm run lint
npm run test
```

For each slice, Codex must report:

- What changed.
- Files touched.
- Whether build passed.
- Known gaps.
- Next recommended Linear ticket.

---

# 27. Commit Guidelines

Use clear commits by slice.

Examples:

```txt
chore: verify Redex Education foundation
feat: add global app shell and navigation
feat: build learner first-day welcome screen
feat: add learner module player shell
feat: build admin Course Foundry start flow
feat: add Source Binder markdown preview
feat: add generated outline review step
feat: add AI self-critique review panel
feat: add side-by-side source review
feat: define training domain types
feat: add HR onboarding vertical slice
feat: add assignment and progress tracking
feat: add module publish and versioning states
```

Do not combine unrelated slices in one commit.

---

# 28. Required Codex Behavior

Codex must:

1. Read this roadmap before starting.
2. Read the Build Bible before each slice.
3. Work only on the current Linear issue unless instructed otherwise.
4. Update the Build Bible after each slice.
5. Keep changes reviewable.
6. Use mock data until Supabase phase begins.
7. Avoid introducing real secrets.
8. Keep UI polished.
9. Protect AI guardrails.
10. Stop and report if a requirement conflicts with the current codebase.

---

# 29. First Recommended Linear Tickets to Create

Create these in order:

## Ticket 1

```txt
Foundation: verify Redex Education repo setup
```

## Ticket 2

```txt
Foundation: build global app shell and route frame
```

## Ticket 3

```txt
Learner: build first-day welcome screen
```

## Ticket 4

```txt
Learner: build assigned training dashboard
```

## Ticket 5

```txt
Learner: build module player shell with mock lessons
```

## Ticket 6

```txt
Learner: add quiz and completion flow
```

## Ticket 7

```txt
Admin: build admin dashboard shell
```

## Ticket 8

```txt
Foundry: build module basics start flow
```

## Ticket 9

```txt
Source Binder: build markdown paste and preview step
```

## Ticket 10

```txt
Foundry: build AI setup questions wizard
```

After Ticket 10 is accepted, continue into generated outline/review tickets.

---

# 30. What “Good” Looks Like at the End of MVP

At the end of MVP, the system should demonstrate this full loop:

## Admin

1. Admin logs in.
2. Admin creates an HR onboarding module.
3. Admin pastes HR source markdown.
4. System parses source sections.
5. System asks setup questions.
6. System generates an outline.
7. Admin approves outline.
8. System generates lessons and quiz.
9. System self-critiques.
10. Admin reviews generated content side-by-side with source.
11. Admin resolves missing-source warnings.
12. Admin publishes module.
13. Admin assigns module to Marcus.

## Employee

1. Marcus logs in.
2. Marcus sees HR onboarding assigned.
3. Marcus starts onboarding.
4. Marcus moves through lessons.
5. Marcus completes acknowledgment.
6. Marcus takes final quiz.
7. Marcus sees completion screen.
8. Progress is recorded.

## Manager/Admin

1. Manager sees Marcus completed training.
2. Admin sees module version.
3. Audit log shows key actions.
4. Completion is tied to module version.

That is the MVP win.

---

# 31. Final Instruction to Codex

Build the product in slices.

The mission is not to create a normal LMS.

The mission is to create a Redex-specific AI training operating system where:

```txt
Raw Redex knowledge becomes approved, interactive employee training.
```

Start with the foundation.

Then prove the learner experience.

Then prove the Course Foundry.

Then connect both through the HR onboarding vertical slice.

Do not skip the Build Bible.

Do not skip source grounding.

Do not skip approval gates.

Do not let the app drift away from the core loop.

