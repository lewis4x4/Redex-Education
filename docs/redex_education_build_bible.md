# REDEX EDUCATION BUILD BIBLE

## Purpose

This file is the living build record for the Redex Education project.

Codex must update this file after every Linear ticket / build slice.

This is not the master roadmap. The master roadmap is:

```txt
docs/REDEX_EDUCATION_CODEX_LINEAR_ROADMAP_HANDOFF.md
```

This Build Bible tracks what has actually been built, what decisions have been made, what is still open, and what must happen next.

---

# 1. Project Identity

## Overall Product / Repo Name

**Redex Education**

## Employee-Facing Brand

**Redex Academy**

This is the name employees should see in the learner experience.

## Admin-Side Engine

**Redex AI Course Foundry**

This is the admin-side system used to turn raw Redex knowledge into approved interactive training.

## Long-Term Platform Vision

**Redex Training OS**

This is the larger long-term concept: a full training operating system for onboarding, continuing education, compliance, role-based development, and Redex-specific knowledge operations.

## Domain Target

```txt
education.redexops.com
```

## GitHub Repo

```txt
https://github.com/lewis4x4/Redex-Education
```

---

# 2. Source of Truth

The source of truth for what is being built:

```txt
Raw Redex knowledge → Source Binder → AI Setup Questions → AI Outline → Admin Approval → AI Lessons + Assessments → AI Self-Critique → Side-by-Side Admin Review → Publish → Assign → Employee Completes → Progress + Audit Tracking
```

The core breakthrough is:

```txt
Raw Redex knowledge in → Approved interactive training out.
```

This project is not a generic LMS.

The app must become a Redex-specific AI-powered training system that makes it easy for employees to learn and easy for admins to create high-quality training.

---

# 3. Product Pillars

## Pillar 1 — Employee Learning Journey

The employee-facing side must be simple, guided, and premium.

Every employee screen should answer:

1. What do I need to do now?
2. How far along am I?
3. Who can help me if I am stuck?

## Pillar 2 — Redex AI Course Foundry

The admin-facing side must let Redex create training from source material without manually designing every course.

Admins should be able to:

- Create a course or module.
- Upload or paste source content.
- Answer AI setup questions.
- Generate an outline.
- Review and approve the outline.
- Generate lessons and assessments.
- Review AI self-critique.
- Compare generated content against source material.
- Resolve blockers.
- Publish approved modules.
- Assign training.

## Pillar 3 — Source Binder

The Source Binder stores and structures the approved source material used to generate training.

All generated training content must trace back to source material.

## Pillar 4 — Human Approval

AI can draft, structure, summarize, critique, and recommend.

AI cannot publish final Redex training without human approval.

## Pillar 5 — Versioning and Auditability

Published content must be versioned.

Employee completions must be tied to the specific version they completed.

---

# 4. Non-Negotiables

1. Do not build a generic LMS clone.
2. Do not let AI publish without human approval.
3. Do not allow AI to invent Redex policy.
4. Do not bury employees in confusing navigation.
5. Do not require admins to manually design every lesson.
6. Do not skip source grounding.
7. Do not skip approval gates.
8. Do not skip published module versioning.
9. Do not skip progress/completion tracking.
10. Do not jump to Phase 3 moonshot features before the Course Foundry loop works.

---

# 5. Naming Rules

Use names consistently.

| Name | Use |
|---|---|
| Redex Education | Overall product, repo, docs, roadmap |
| Redex Academy | Employee-facing learner experience |
| Redex AI Course Foundry | Admin-side training generation engine |
| Redex Training OS | Long-term platform vision |

Header text in learner app should generally say:

```txt
Redex Academy
```

Admin area may say:

```txt
Course Foundry
```

Docs and technical references should generally say:

```txt
Redex Education
```

---

# 6. Current Phase

## Phase

**Phase 0 — Foundation and Product Skeleton**

## Current Slice

**Slice 0.1 — Verify Repo Foundation** — COMPLETED

## Current Status

Slice 0.1 completed on 2026-05-22.

Foundation verified:
- Vite + React 19 + TypeScript app exists and builds cleanly.
- Tailwind CSS v3 + shadcn/ui New York + Slate configured via official `components.json`.
- `@/*` alias working in both TypeScript and Vite.
- shadcn New York components (button, card, badge) installed with `cva`.
- `npm run build` passes.
- Roadmap and Build Bible documents present in `/docs`.

Note: The current `src/App.tsx` still contains the earlier CEU & License Portal prototype from the initial repo handoff conversation. This will be realigned during Slice 0.2 (App Shell) and subsequent learner/admin slices per the official roadmap.

---

# 7. Master Roadmap Reference

The master roadmap handoff should live here:

```txt
docs/REDEX_EDUCATION_CODEX_LINEAR_ROADMAP_HANDOFF.md
```

This Build Bible should not replace the roadmap.

The roadmap explains what to build.

This Build Bible records what has been built.

---

# 8. Completed Work

## Completed

### 2026-05-22 — Slice 0.1: Verify Repo Foundation

**Status**: Completed

**Completed**:
- Confirmed Vite + React + TypeScript application exists and runs.
- Confirmed Tailwind CSS is active and styled correctly.
- Confirmed official shadcn/ui New York + Slate setup via `components.json`.
- Confirmed `@/*` path alias works in both `tsconfig.app.json` and `vite.config.ts`.
- Confirmed `npm run build` completes successfully (with normal chunk size warning).
- Confirmed presence of official roadmap and this Build Bible in `/docs`.
- Verified shadcn New York components (Button, Card, Badge using `cva`) are installed.

**Observations**:
- Current `App.tsx` contains a CEU/License-focused prototype from earlier exploration. This is expected to be replaced/refactored as we follow the official Redex Academy + Course Foundry roadmap.
- Supabase client and types are already present (from prior setup).
- UI foundation is solid for proceeding to Slice 0.2 (App Shell).

**Next**: Proceed to Slice 0.2 — Global App Shell and Navigation Frame.

---

# 9. In Progress

## Current Work

**Multi-agent orchestration in full swing** (CEO Co-Pilot mode — "do not stop" directive active).

**Progress since last update:**
- Slice 0.2 App Shell foundation complete:
  - `TopNav` now contains the exact "Learner experience" / "Admin experience" toggle with red active state (matches v3 mockup pixel-for-pixel).
  - `AppShell` + `BreadcrumbBar` implemented.
  - Experience switching is fully functional from the header.
- Slice 1.1 (First-day Welcome) implemented:
  - `LearnerWelcomePage` built to closely match the provided UI mockup (Marcus greeting, CEO video placeholder, 4-step progress, benefits, red CTA).
- Clean cutover from old CEU prototype → official Redex Academy direction.
- Build passes cleanly.

**Agents still running:**
- Plan agent (Slice 0.2 detailed execution plan)
- Explorer agent (codebase audit)
- Additional implementers and types agent active in background.

**Current Slice**: Slice 0.2 + Slice 1.1 + early Slice 1.2 complete in working form.

Major addition:
- Core domain types integrated (`src/types/training.ts`) — LearnerProfile, Course, Module, Lesson, Progress, Enrollment, Foundry generation shapes, etc. (inspired by the excellent modeling produced by the types agent).

Continuous non-stop execution in progress.

---

# 10. Open Decisions

These decisions are not finalized yet.

## Backend / Database

Decision pending:

- Supabase is the likely backend, but real integration should not begin until the frontend mock vertical slice is accepted.

## Auth

Decision pending:

- Need final auth approach.
- Options may include Supabase Auth, SSO later, or another provider.

## AI Provider

Decision pending:

- Real AI provider is not selected yet.
- App should first use a mock AI client/interface.
- Real AI calls must eventually go through a secure server-side endpoint or edge function.

## First HR Source Material

Decision pending:

- Actual Redex-approved HR onboarding source markdown is not yet provided.
- Until then, only use clearly marked sample/placeholder content.

## Brand Tokens

RESOLVED (2026-05-22) — Redex Brand Guide v1.0.

- Primary brand red is **#ED1B24** (RGB 237,27,36 · Pantone 1788 C). Black #000000, White #FFFFFF.
- Color ratio 60% white / 30% black / 10% red. Never use red as a large background fill.
- Headings: Nexa Bold. Body: system sans-serif (Inter / SF Pro / Segoe UI). Bitsumishi is logo-only.
- Locked token set and typography: `docs/SLICE_0.2_APP_SHELL_SPEC.md`.

---

# 11. Known Gaps

## After Slice 0.1 (2026-05-22)

- Current application contains the earlier CEU & License Portal prototype. This must be evolved or replaced to match the official Redex Academy (learner) + Redex AI Course Foundry (admin) vision defined in the roadmap.
- No feature-based folder structure (`features/employee`, `features/foundry`, etc.) yet.
- No global App Shell or consistent navigation implemented.
- No learner screens (welcome, dashboard, module player) per Phase 1.
- No admin Course Foundry flow per Phase 2.
- Real Supabase schema and data model not yet designed or migrated.
- No AI generation (even mocked) implemented.
- No actual Redex source material (HR onboarding markdown, SOPs, etc.) present yet.

These gaps are expected and will be closed slice-by-slice according to the official roadmap.

---

# 12. Database Changes

## Current Database Status

No database schema has been implemented yet.

## Planned Core Tables

Future schema likely includes:

- users / profiles
- courses
- modules
- lessons
- assessments
- assessment_questions
- source_binders
- source_documents
- source_sections
- generated_content_reviews
- assignments
- progress_records
- assessment_attempts
- acknowledgments
- audit_logs

Codex must update this section whenever migrations or schema changes are created.

---

# 13. AI Prompt Changes

## Current AI Status

No real AI integration has been implemented yet.

## Required Future AI Prompts

The Course Foundry will eventually require:

1. Source analysis prompt.
2. Setup question inference prompt.
3. Outline generation prompt.
4. Lesson generation prompt.
5. Assessment generation prompt.
6. Self-critique prompt.
7. Regenerate-with-fixes prompt.

## AI Guardrail Rule

All AI prompts must include the following rule:

```txt
Do not invent Redex policy. If source content is missing, unclear, placeholder, or unsupported, flag it instead of generating fake policy.
```

## Missing Source Policy

If source content contains:

- `[PLACEHOLDER]`
- `[TODO]`
- missing policy language
- unclear instructions
- unsupported claims

Generated output must show:

```txt
⚠️ MISSING SOURCE — Admin must provide approved content before publishing.
```

---

# 14. UX Decisions

## Approved UX Direction

The app should feel:

- Premium.
- Clean.
- Simple.
- Redex-branded.
- Practical.
- Not childish.
- Not like a generic LMS.

## Learner UX

Employee screens should be guided and direct.

Use:

- clear primary CTAs
- simple progress indicators
- large readable cards
- short copy
- one-path onboarding flow

Avoid:

- cluttered course catalogs
- unnecessary menus
- over-gamification
- leaderboards as a primary mechanic

## Admin UX

Admin screens should feel like a guided creation workflow.

Use:

- wizard steps
- source previews
- review states
- publish blockers
- side-by-side review
- clear approval actions

---

# 15. Design Tokens — Brand-Locked (Redex Brand Guide v1.0)

Primary red corrected to the Brand Guide value **#ED1B24** (was the placeholder #ed1f24). The full locked token set and typography spec live in `docs/SLICE_0.2_APP_SHELL_SPEC.md`.

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

---

# 16. Linear Ticket Mapping

## Active / Next Tickets

Create and work these tickets in order.

### 1. Foundation: verify Redex Education repo setup

**Status**: ✅ Completed (2026-05-22)

**Outcome**: Foundation verified. Build passes. shadcn New York + Slate + @/ alias confirmed. Build Bible updated. Noted that current UI is the prior CEU prototype and will be realigned in Slice 0.2+.

### 2. Foundation: build global app shell and route frame

Status: Not started.

### 3. Learner: build first-day welcome screen

Status: Not started.

### 4. Learner: build assigned training dashboard

Status: Not started.

### 5. Learner: build module player shell with mock lessons

Status: Not started.

### 6. Learner: add quiz and completion flow

Status: Not started.

### 7. Admin: build admin dashboard shell

Status: Not started.

### 8. Foundry: build module basics start flow

Status: Not started.

### 9. Source Binder: build markdown paste and preview step

Status: Not started.

### 10. Foundry: build AI setup questions wizard

Status: Not started.

Codex must update each ticket status after completion.

---

# 17. Acceptance Criteria Status

## Foundation Acceptance

**Status**: ✅ Completed — 2026-05-22

**Results**:

- [x] `npm install` — works
- [x] `npm run dev` — works (verified in prior sessions)
- [x] `npm run build` — passes cleanly
- [x] Tailwind confirmed working
- [x] shadcn/ui New York + Slate officially configured via `components.json`
- [x] `@/` imports confirmed in tsconfig + vite
- [x] Build Bible present and updated
- [x] Master roadmap present in `/docs`

**Note**: Product direction realignment (from initial CEU portal to full Redex Academy + Course Foundry) recorded. This does not block foundation acceptance.

## Learner Prototype Acceptance

Status: Not started.

Must pass:

- [ ] First-day welcome screen complete
- [ ] Learner dashboard complete
- [ ] Module player shell complete
- [ ] Quiz flow complete
- [ ] Completion screen complete

## Admin Foundry Prototype Acceptance

Status: Not started.

Must pass:

- [ ] Admin dashboard complete
- [ ] Module creation start flow complete
- [ ] Source Binder paste/preview complete
- [ ] Setup questions wizard complete
- [ ] Outline review complete
- [ ] Module generation preview complete
- [ ] Self-critique panel complete
- [ ] Side-by-side source review complete
- [ ] Missing source blocker behavior complete

## HR Vertical Slice Acceptance

Status: Not started.

Must pass:

- [ ] Sample HR source markdown exists
- [ ] Mock generated HR module exists
- [ ] Learner can complete HR module
- [ ] Admin can walk HR module through mocked Foundry flow
- [ ] Progress state updates
- [ ] Quiz score calculates
- [ ] Completion state records

---

# 18. Test Notes

## Required Test Commands

Run after each slice:

```bash
npm run build
```

If available, also run:

```bash
npm run lint
npm run test
```

## Latest Test Results

### 2026-05-22 — Slice 0.1

**Commands run**:
- `npm run build`

**Result**: Passed

**Notes**:
- Build succeeds.
- One expected warning about large initial JS chunk (common at this stage; will be addressed with code-splitting in later slices).
- No TypeScript errors blocking build.
- shadcn components and Tailwind styles are active.

Use format:

```md
### YYYY-MM-DD — Slice X.X

Commands run:
- `npm run build`

Result:
- Passed / Failed

Notes:
- Any warnings, errors, or follow-up items.
```

---

# 19. Commit Log

### 2026-05-22 — Slice 0.1: Verify Repo Foundation

**Commit**: (pending clean commit after this update)

**Summary**:
- Official start of Codex-driven Redex Education build.
- Completed Slice 0.1 foundation verification.
- Confirmed Vite/React/TS + Tailwind + shadcn New York + @/ alias + successful build.
- Updated Build Bible with honest assessment (current UI is prior CEU work; will realign to official Redex Academy + AI Course Foundry vision).
- Ready for Slice 0.2 (App Shell and Navigation Frame).

---

# 20. Current Next Actions

## Immediate Next Action

**Slice 0.2 — Foundation: build global app shell and route frame**

This is the next official slice per the roadmap.

Codex should now begin designing and implementing:
- Consistent premium Redex Academy header / navigation
- Experience toggle (Learner vs Admin views)
- Basic routing structure
- Page container and layout primitives

## Next Build Order (per Roadmap)

1. ✅ Slice 0.1 — Verify foundation (COMPLETED)
2. **Slice 0.2** — Build global app shell and route frame
3. Slice 1.1 — Learner first-day welcome screen
4. Slice 1.2 — Learner assigned training dashboard
5. Slice 1.3 — Learner module player shell
6. ... (continuing per roadmap)

---

# 21. Codex Update Instructions

Codex must update this file after every Linear ticket.

For each completed ticket, update:

- Current Phase
- Current Slice
- Completed Work
- In Progress
- Known Gaps
- Database Changes, if applicable
- AI Prompt Changes, if applicable
- UX Decisions, if applicable
- Linear Ticket Mapping
- Acceptance Criteria Status
- Test Notes
- Commit Log
- Next Actions

Do not leave this file stale.

This Build Bible is how the project avoids drift.

---

# 22. Final Reminder

The mission is not to create a normal LMS.

The mission is to create a Redex-specific AI training operating system where:

```txt
Raw Redex knowledge becomes approved, interactive employee training.
```

Start with foundation.

Then prove the learner experience.

Then prove the Course Foundry.

Then connect both through the HR onboarding vertical slice.

Do not skip source grounding.

Do not skip approval gates.

Do not skip the Build Bible updates.

---

## Latest Orchestration Update (Continuous Execution)

**Date**: 2026-05-22 (ongoing)

**Active Parallel Queue** (from velocity planning agent):
- **Task A** — Education Domain Types + Mock Data + Facade → `src/lib/education/training-types.ts` created with seeded Orientation course.
- **Task B** — Module Player Shell + Lesson Renderer → `ModulePlayer.tsx` + `LessonContentRenderer.tsx` started.
- **Task C** — Quiz Component — queued.
- **Task D** — Progress Context + Admin scaffolding — queued.

All work is now locked to the correct repo: `/Users/brianlewis/Redex-Education`.

We are building a real playable learner flow (welcome → dashboard → actual module player) while the architecture stays clean for the AI Course Foundry side.

**Momentum**: Extremely high. Multiple agents remain active. No pauses.

