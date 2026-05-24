# UX Integrity Review — Admin / Foundry / Source Binder / Learner / Version History

**Date:** 2026-05-24
**Reviewer:** Specialist Reviewer #2 (Product flow + UX integrity)
**Scope:** Read-only review of admin dashboard, Foundry pages (start → questions → outline → preview → critique → sidebyside → blockers → published), Source Binder pages (input + library + impact), `LearnerDashboardPage`, `ModuleVersionHistoryPage`.
**Out of scope:** Architecture/routing topology (Reviewer #1), Supabase RLS/data model (Reviewer #3), edge function / AI pipeline reliability (Reviewer #4), CI/build governance (Reviewer #5).
**Method:** Static page-by-page read against the route map; compared against existing audits (`admin-dashboard-{design,functional}-audit-2026-05-24.md`, `foundry-workflow-{design,functional}-audit-2026-05-24.md`) to avoid re-reporting fixed items. No code, SQL, config, or dependency changes were made.
**Severity rubric:** `critical | high | medium | low`. **Confidence:** `high | medium | low` based on whether the finding was verified end-to-end vs. inferred from static reading.

---

## 1. Executive summary

The Admin dashboard has clearly absorbed the prior dashboard audit — empty-states, generation-job banner, completion-rate `—`, chip-style footer links, and time-of-day greeting are all in place. The Foundry chain is structurally complete, but **three demo-day blockers** remain that will be visible inside a 5-minute CEO walkthrough:

1. **`ModuleGenerationPreviewPage` has no cold-load guard** and falls back to `DEFAULT_AI_OUTLINE` (`course_title: 'HR Basics at Redex'`) plus `DEFAULT_AI_SOURCE_MATERIAL` if the admin lands there without a draft. Sister demo-day failure mode: the page also renders a primary CTA reading **`✨ Generate Full Module in One Click (Preview Mode)`** — design-bar §11 explicitly bans "Magic Button" gamification. ([`ModuleGenerationPreviewPage.tsx:121, 148`](../../src/features/foundry/pages/ModuleGenerationPreviewPage.tsx))
2. **`SelfCritiqueReviewPage` ships an engineer-leak toast** — `toast.info('Manual editing in Slice 3.4')` when the admin clicks "Edit" on a critique issue. Hard to talk past on a demo. ([`SelfCritiqueReviewPage.tsx:162`](../../src/features/foundry/pages/SelfCritiqueReviewPage.tsx))
3. **`SourceImpactReviewPage` is built on hardcoded mock fixtures** (`MOCK_MODULE_SOURCE_BINDINGS`, `MOCK_SOURCE_SECTION_DIFFS`, `simulateDriveSync()`). The "Sync from Drive" button is a stub — the dashboard link "Source Impact Review →" goes to a page that looks like it works but mutates only local state. Real Drive ingestion changes will not appear here. ([`SourceImpactReviewPage.tsx:10-19, 53, 55`](../../src/features/source-binder/pages/SourceImpactReviewPage.tsx))

The most consequential production-readiness gap is that the **`useDraftRedirect` hook exists but only `FoundryStartPage` uses it** — every other Foundry page still carries an inline `useEffect` with a `// Builder-I hook pending` comment. The inline guards are narrower than the hook's progressive check, leaving cold-load mock leaks in `OutlineReviewPage`, `ModuleGenerationPreviewPage`, `SelfCritiqueReviewPage`, `SideBySideReviewPage`, `PublishBlockersPage`, and `PublishConfirmationPage`. ([`useDraftRedirect.ts:85`](../../src/features/foundry/hooks/useDraftRedirect.ts) + each page).

The Learner dashboard still **renders a demo constant (`'HR Basics at Redex'` via `DEMO_HR_BASICS_COURSE`) as the module title** whenever no real assignment is found, and the progress bar is hardwired to `aria-label="Onboarding progress"` regardless of module. Static `"Good morning"` greeting ignores time of day even though the admin dashboard already has the helper.

`ModuleVersionHistoryPage` is in much better shape than the prior audit — real Supabase profile fetch via `useModuleVersionHistory` resolves names — but still falls back to `MOCK_ORG_PEOPLE` then `'Unknown user'`, so a freshly published version by an admin not in the mock list still risks displaying `'Unknown user'` until the profile fetch returns.

Severity bands below show **5 demo blockers**, **8 production blockers**, and **11 polish items**.

---

## 2. CEO-demo blockers vs production blockers

| Tag | Page / surface | Finding | Severity | Confidence |
|---|---|---|---|---|
| **DEMO** | `ModuleGenerationPreviewPage` | "✨ Generate Full Module in One Click (Preview Mode)" magic-button copy | critical | high |
| **DEMO** | `ModuleGenerationPreviewPage` | No cold-load redirect; defaults to `'HR Basics at Redex'` outline + empty source | critical | high |
| **DEMO** | `SelfCritiqueReviewPage` | `toast.info('Manual editing in Slice 3.4')` engineer leak | critical | high |
| **DEMO** | `SourceImpactReviewPage` | Whole page wired to mock fixtures; "Sync from Drive" is `simulateDriveSync()` | critical | high |
| **DEMO** | `FoundryStepper` | `/admin/foundry/blockers` maps to label `'Publish'` — wrong step highlighted before the admin has clicked publish | high | high |
| **PROD** | All non-Start Foundry pages | `// Builder-I hook pending` — inline redirects narrower than `useDraftRedirect` | high | high |
| **PROD** | `LearnerDashboardPage` | Falls back to `DEMO_HR_BASICS_COURSE.title` and `.estimated_minutes` for real learners with no assignment match | high | high |
| **PROD** | `LearnerDashboardPage` | `aria-label="Onboarding progress"` hardcoded, regardless of module | high | high |
| **PROD** | `LearnerDashboardPage` | Static `'Good morning'` greeting ignores time of day | medium | high |
| **PROD** | `FoundryQuestionsPage` | Duplicate primary CTA: wizard's `Continue` + a second `Continue → Outline review` card shown together once saved | high | high |
| **PROD** | `SourceBinderInputPage` | "Saved to your draft" claim rendered unconditionally — visible before any save | medium | high |
| **PROD** | `SourceBinderInputPage` | "Clear source" uses native `window.confirm()`; jarring, not branded; only requires `currentDraft === null && sourceMaterial === null` to redirect — an admin can paste source without basics and continue | medium | high |
| **PROD** | `PublishConfirmationPage` | "Edit & create new version" / "Start a new module" sit in a flat 3-button row with no visual hierarchy; "Edit & create new version" is disabled silently when `moduleId` is missing | medium | medium |
| **PROD** | `ModuleVersionHistoryPage` | When profile fetch returns no name for a real UUID, displays `'Unknown user'` — vague | medium | medium |
| **POLISH** | Multiple Foundry pages | Eyebrow text still hardcodes `STEP 5/6/7` despite `FoundryStepper` existing | medium | high |
| **POLISH** | `ModuleGenerationPreviewPage`, `SelfCritiqueReviewPage`, `SideBySideReviewPage` | No `FoundryStepper` rendered (others have it) — inconsistent navigation chrome mid-flow | medium | high |
| **POLISH** | `SelfCritiqueReviewPage`, `SideBySideReviewPage` | "Return to source binder" footer link is jarring this late in the flow | low | high |
| **POLISH** | `SourceLibraryPage` | "Back to source binder" rendered as `variant="brand"` CTA — overweights a return action | low | high |
| **POLISH** | `LearnerDashboardPage` | "Your Onboarding Progress" card heading is prescriptive — wrong copy if not onboarding | low | high |
| **POLISH** | `LearnerDashboardPage` | "Need Help?" / "Onboarding Buddy" card copy is generic and not driven by data | low | high |
| **POLISH** | `OutlineReviewPage` | "Edit outline" button disabled with title `"Manual outline editing coming soon."` — calmer than the critique-page leak but still a dead control on a primary review surface | low | high |
| **POLISH** | `AdminDashboardPage` | Now has **three** brand-tinted CTA cards in one row (Foundry / Assignments / Onboarding) — visual weight equalized but admin must scan three "Start ..." buttons to decide | low | high |
| **POLISH** | `SideBySideReviewPage` | `🚫 Publish blocked` mixes emoji with status text — feels closer to chat than a system banner | low | high |
| **POLISH** | `PublishConfirmationPage` | Renders a `FoundryStepper` on a terminal screen — implies the flow is still in motion | low | high |

---

## 3. Page-by-page findings (in scope only)

### 3.1 `AdminDashboardPage`

The page has already absorbed the prior audit. Confirmed in current code: per-bucket empty copy + slate-400 icons, `'Course Foundry'` eyebrow on Foundry card, `variant="brand"` on both CTA buttons (now three CTAs), per-list "Source library →" chip, completion-rate `—` when null, generation-jobs amber banner, "Manage assignments →" link, time-of-day greeting helper, first-name fallback chain including email local part. ([`AdminDashboardPage.tsx`](../../src/features/admin/pages/AdminDashboardPage.tsx))

**Remaining UX risks:**

#### F-AD-1 — Three identical-weight CTA cards in one row dilute the dashboard's primary action

| Field | Value |
|---|---|
| **Severity / Confidence** | low / high |
| **Tag** | POLISH |
| **Evidence** | `AdminDashboardPage.tsx:131-148` — `<div className="grid gap-4 lg:grid-cols-3">` containing `FoundryEntryCard`, `AssignmentsEntryCard`, and an inline Onboarding section. All three use the same `border-redex-red/20 bg-redex-red/[0.04] p-6 shadow-sm` chrome and an identical-weight brand button. |
| **Impact** | The original "primary CTA / secondary CTA" hierarchy (Foundry first; Assignments second) has flattened. An admin glancing at the page now sees three equal-priority brand cards. The "Welcome a new hire" CTA is the youngest surface and most likely to absorb a misclick from a CEO. |
| **Action** | Give Foundry the visual weight of the primary action (larger card, full-width on `≥md`) and demote Assignments + Onboarding to a secondary row, OR drop the brand background tint from two of three to preserve hierarchy. Not a demo blocker; flag for product. |
| **Verification** | Run the page at three CTA-row breakpoints (`<md`, `md`, `lg`) and confirm visual hierarchy reads "primary → secondaries". |

#### F-AD-2 — "Welcome a new hire" Onboarding card has no `isDisabled` prop and no `Coming soon` affordance, but the destination route may not be fully built

| Field | Value |
|---|---|
| **Severity / Confidence** | low / medium |
| **Tag** | POLISH |
| **Evidence** | `AdminDashboardPage.tsx:134-147` — the Onboarding card hard-codes `onClick={() => navigate('/admin/onboard')}` with no disabled state. Onboarding workflow is referenced as a parallel builder lane in the foundry design audit but its production-readiness is not verified within this review. |
| **Impact** | If the destination is incomplete in production, the admin lands on a half-built page from the dashboard. |
| **Action** | Confirm with Reviewer #1 (architecture) that `/admin/onboard` is wired to a production-ready page. If not, gate the card with `isDisabled={true}` until ready, matching the pattern on `FoundryEntryCard`/`AssignmentsEntryCard`. |
| **Verification** | Smoke-load `/admin/onboard` as `foundry_author` and as `admin`. |

---

### 3.2 `FoundryStartPage` (Basics)

#### F-FS-1 — `useDraftRedirect(null)` is a deliberate no-op; comment makes intent unclear

| Field | Value |
|---|---|
| **Severity / Confidence** | low / high |
| **Tag** | POLISH |
| **Evidence** | `FoundryStartPage.tsx:16` calls `useDraftRedirect(null)`; in [`useDraftRedirect.ts:28-30`](../../src/features/foundry/hooks/useDraftRedirect.ts) the hook short-circuits and returns `null` when `requiredStage === null`. |
| **Impact** | The hook is functioning as a no-op marker. Readers will assume the start page is protected when it is not. |
| **Action** | Drop the call or add a leading comment explaining the no-op convention. |
| **Verification** | Repeat the explicit "no-op marker" comment pattern across other entry pages if it stays. |

#### F-FS-2 — Save-state copy says "Your basics will be saved when you continue" but `setBasics` only fires on submit

The copy is now honest (per the foundry design audit's P1-4 recommendation). No change needed — flagged here as resolved. ([`FoundryStartPage.tsx:45`](../../src/features/foundry/pages/FoundryStartPage.tsx))

---

### 3.3 `SourceBinderInputPage`

#### F-SB-1 — Cold-load guard lets the admin paste source without basics

| Field | Value |
|---|---|
| **Severity / Confidence** | high / high |
| **Tag** | PROD |
| **Evidence** | `SourceBinderInputPage.tsx:22-27` — `if (currentDraft === null && sourceMaterial === null) navigate('/admin/foundry/start')`. The **AND** means once any source is pasted, the redirect is suppressed even if basics are still null. The `hasOrphanedSourceState` warning below uses the same combined condition, so once the admin pastes one character the warning disappears and `Continue → Setup questions` becomes available. |
| **Impact** | An admin can navigate to `/admin/foundry/source` directly, paste source material, and proceed to `/admin/foundry/questions` with no basics ever set. Downstream pages then run with `currentDraft === null` and inject `DEFAULT_AI_MODULE_BASICS` (`'HR Basics at Redex'`) into real AI calls. |
| **Action** | Replace inline guard with `useDraftRedirect('source')` from [`useDraftRedirect.ts:85`](../../src/features/foundry/hooks/useDraftRedirect.ts) — it correctly redirects to `/admin/foundry/start` when `currentDraft === null` regardless of source state. Comment at the top of this file already says `// Builder-I hook pending`. |
| **Verification** | Reproduce: clear localStorage, navigate to `/admin/foundry/source`, paste any markdown, expect to be redirected to `/admin/foundry/start`. |

#### F-SB-2 — "Saved to your draft" line shown unconditionally

| Field | Value |
|---|---|
| **Severity / Confidence** | medium / high |
| **Tag** | PROD |
| **Evidence** | `SourceBinderInputPage.tsx:122` — `<p>Saved to your draft</p>` rendered always, including the cold-load orphan state when nothing has been saved. |
| **Impact** | Lies about persistence on a primary product surface; erodes admin trust. |
| **Action** | Gate the line on `sourceMaterial !== null` (or move to the `SourcePastePanel` footer that fires on real save). |
| **Verification** | Cold-load the page; the line should not render. |

#### F-SB-3 — "Clear source" uses native `window.confirm()` and irreversibly wipes store + local state

| Field | Value |
|---|---|
| **Severity / Confidence** | medium / high |
| **Tag** | PROD |
| **Evidence** | `SourceBinderInputPage.tsx:65-74` — `if (!window.confirm('Clear all source material? This cannot be undone.')) return; clearSourceMaterial(); setTitle(''); …`. |
| **Impact** | Native confirm is jarring and not branded; the action is destructive but offers no undo / no audit-log line. Risk of an admin clearing source material accidentally during a demo. |
| **Action** | Replace with a branded confirmation popover or AlertDialog; consider preserving the previous source in `lastDeletedSourceMaterial` to support undo for 10 seconds via toast. |
| **Verification** | Verify the dialog matches design system; verify undo toast (if added) restores state. |

#### F-SB-4 — Source Library entry is a `variant="brand"` CTA but the page also has its own primary CTA

| Field | Value |
|---|---|
| **Severity / Confidence** | low / high |
| **Tag** | POLISH |
| **Evidence** | `SourceBinderInputPage.tsx:101-104` — "Browse Source Library →" is rendered as a brand button on the same page where `Continue → Setup questions` is the workflow-primary brand button. Two brand-red CTAs compete. |
| **Impact** | Visual hierarchy ambiguity; admin not sure which is the next step. |
| **Action** | Downgrade the Library entry to `variant="outline"` (it is an alternative path, not the workflow step forward). |
| **Verification** | DevTools — only one `bg-redex-red` button on the page at rest. |

---

### 3.4 `SourceLibraryPage`

#### F-SL-1 — "Back to source binder" footer button is `variant="brand"`

| Field | Value |
|---|---|
| **Severity / Confidence** | low / high |
| **Tag** | POLISH |
| **Evidence** | `SourceLibraryPage.tsx:134-136` — footer renders a brand button that performs a navigation back. |
| **Impact** | A return action shouldn't be the loudest button on the page; brand-red carries connotation of progress/commit. |
| **Action** | Use `variant="outline"` or render as a back-link with arrow. |

#### F-SL-2 — No visible count of selected files; selection state is invisible until the admin returns to the source binder

| Field | Value |
|---|---|
| **Severity / Confidence** | medium / high |
| **Tag** | PROD |
| **Evidence** | `SourceLibraryPage.tsx:107-113` — `SourceLibraryBrowser` toggles `selectedLibraryFileIds` in the store, but the page header offers no "N selected" pill and the footer offers no "Use selected files in source binder" CTA. |
| **Impact** | Admin can select files and not realize anything happened; clicking "Back to source binder" feels like an abort even though selections persist. |
| **Action** | Add a sticky/persistent counter (`{N} files selected — Use selections →`) at the top or bottom of the page with a CTA that navigates back to `/admin/foundry/source`. |
| **Verification** | Toggle 2 files; counter shows "2 files selected"; CTA navigates back; selections still in store. |

#### F-SL-3 — "Read ADR 010" link points at a relative path `../decisions/...` that will 404 in the running app

| Field | Value |
|---|---|
| **Severity / Confidence** | medium / high |
| **Tag** | PROD |
| **Evidence** | `SourceLibraryPage.tsx:122-128` — `href="../decisions/010-drive-source-library-notion-dropped.md"`. This is a docs path, not a routable URL in the SPA. |
| **Impact** | Click yields a 404 / blank page; visible to any admin reading the disclaimer block. |
| **Action** | Either remove the link, link to the GitHub blob URL, or render the rationale inline. |
| **Verification** | Click the link in the running app; expect navigation failure today. |

---

### 3.5 `SourceImpactReviewPage`

#### F-SI-1 — Page is wired entirely to mock fixtures, including the "Sync from Drive" button

| Field | Value |
|---|---|
| **Severity / Confidence** | critical / high |
| **Tag** | DEMO |
| **Evidence** | `SourceImpactReviewPage.tsx:10-13` imports `MOCK_MODULE_SOURCE_BINDINGS, MOCK_SOURCE_SECTION_DIFFS`. Line 14 imports `MOCK_DRIVE_SYNC_DELAY_MS, simulateDriveSync`. Line 55 calls `simulateDriveSync()` — no edge function. Line 71 calls `delay(MOCK_DRIVE_SYNC_DELAY_MS)` in the regeneration handler. `computeAffectedModules` runs against `MOCK_MODULE_SOURCE_BINDINGS` rather than `module_source_bindings` from Supabase. |
| **Impact** | The dashboard surfaces this page as "Source Impact Review →" (trust-critical link). Clicking it from a real production session shows mock events / mock diffs / mock affected modules. The "Sync from Drive" button does not actually sync. An admin acting on this page makes decisions on fictitious data. Cross-cutting handoff to Reviewer #4 (AI / edge pipeline): there is no `drive-sync` invocation here and no path to surface real `source_change_events`. |
| **Action** | Either (a) replace mock data sources with real Supabase reads + `drive-sync` invocation, or (b) gate the page with a "Source Impact Review is not yet wired to live data" banner + disable the Sync button until ready. Option (b) is cheaper for a CEO demo. |
| **Verification** | After fix: trigger a Drive change in `_library/`, expect a real `source_change_events` row to appear in the SourceChangeList. |

#### F-SI-2 — `useActorInfo() ?? { userId: 'system', displayName: 'Redex system' }` falls back to a phantom actor in audit log writes

| Field | Value |
|---|---|
| **Severity / Confidence** | high / high |
| **Tag** | PROD |
| **Evidence** | `SourceImpactReviewPage.tsx:39` — `const actor = useActorInfo() ?? { userId: 'system', displayName: 'Redex system' }`. Line 92-100: `recordEvent({ actor_user_id: actor.userId, actor_name: actor.displayName, ... })`. |
| **Impact** | In production, if `useActorInfo` returns `null` (unauthenticated or hook race), audit log shows `'Redex system'` as the actor — making real human action attribution impossible. Cross-cutting handoff to Reviewer #3 (Supabase / security): does `audit_log` RLS allow a synthetic `'system'` actor write? |
| **Action** | If `actor` is null, surface an error rather than silently writing a synthetic identity. Or block the regenerate action until `actor` resolves. |
| **Verification** | Log out, force `useActorInfo` to return null, attempt regenerate; expect to see a blocking message rather than `'Redex system'` in the log. |

---

### 3.6 `FoundryQuestionsPage`

#### F-FQ-1 — Duplicate "Continue" affordances rendered together once answers are saved

| Field | Value |
|---|---|
| **Severity / Confidence** | high / high |
| **Tag** | PROD |
| **Evidence** | `FoundryQuestionsPage.tsx:42-55` — the `<QuestionWizard>` always renders (with its own `Submit`/`Next` buttons). Below it, when `setupAnswers !== null`, an additional Card renders `<Button variant="brand">Continue → Outline review</Button>`. The first submit auto-navigates to `/outline`; this card is only reachable on return. But when reachable, the admin sees **the entire wizard plus a second Continue card stacked vertically**. |
| **Impact** | Confusing: two equally-prominent next-step affordances. Pre-existing finding from the foundry design audit (P1-8). |
| **Action** | When `setupAnswers !== null` on re-entry, render a read-only summary panel + single primary Continue CTA, NOT the wizard plus a saved-state card. |
| **Verification** | Submit wizard once, return to page; expect summary-mode view, not duplicate widgets. |

#### F-FQ-2 — Inline cold-load guard fires on `currentDraft === null || sourceMaterial === null`, but doesn't re-fire if state becomes null mid-flow

| Field | Value |
|---|---|
| **Severity / Confidence** | medium / medium |
| **Tag** | PROD |
| **Evidence** | `FoundryQuestionsPage.tsx:18-23` — `useEffect(() => { if (currentDraft === null || sourceMaterial === null) navigate(...) }, [...])`. Comment confirms migration to `useDraftRedirect('source')` is pending. |
| **Impact** | Migration to the shared hook is incomplete. Inline guards diverge over time. |
| **Action** | Migrate to `useDraftRedirect('source')`. |

---

### 3.7 `OutlineReviewPage`

#### F-OR-1 — "Edit outline" disabled with a generic tooltip — dead control on the primary review surface

| Field | Value |
|---|---|
| **Severity / Confidence** | low / high |
| **Tag** | POLISH |
| **Evidence** | `OutlineReviewPage.tsx:154-156` — `<Button variant="outline" disabled title="Manual outline editing coming soon.">Edit outline</Button>`. |
| **Impact** | An admin reviewing the outline naturally reaches for "Edit outline" — finds it disabled. Reduces trust that the workflow respects admin input. |
| **Action** | If editing is post-MVP, hide the button entirely; do not render dead controls on review surfaces. |

#### F-OR-2 — Cold-load redirect goes to `/questions` even when basics are missing

| Field | Value |
|---|---|
| **Severity / Confidence** | medium / high |
| **Tag** | PROD |
| **Evidence** | `OutlineReviewPage.tsx:42-47` — single redirect target is `/admin/foundry/questions`, regardless of which of `currentDraft / sourceMaterial / setupAnswers` is missing. |
| **Impact** | Direct-link to `/admin/foundry/outline` with empty store → redirected to `/questions` → that page's own guard then bounces to `/source` → that page's own guard then bounces to `/start`. Three-hop redirect is jarring. `useDraftRedirect('outline')` resolves the correct first-missing step directly. |
| **Action** | Migrate to `useDraftRedirect('outline')`. |

#### F-OR-3 — Generation error retry uses inline `void generateAndStoreOutline()` — error surface is good but lacks loading indicator during retry

| Field | Value |
|---|---|
| **Severity / Confidence** | low / medium |
| **Tag** | POLISH |
| **Evidence** | `OutlineReviewPage.tsx:111-118` — error Card with Retry button; no `isGenerating` state during the retry. |
| **Impact** | Clicking Retry leaves the user with no feedback until the next render. |
| **Action** | Disable Retry while in-flight, show spinner or pulsing copy. |

---

### 3.8 `ModuleGenerationPreviewPage` ⚠ DEMO BLOCKER PAGE

#### F-MGP-1 — No cold-load redirect guard exists at all

| Field | Value |
|---|---|
| **Severity / Confidence** | critical / high |
| **Tag** | DEMO |
| **Evidence** | `ModuleGenerationPreviewPage.tsx:24-37` — component renders immediately. No `useEffect` redirect, no `useDraftRedirect` call. `handleGenerateModule` at line 38 unconditionally invokes `generateLessons({ outline: outline ?? DEFAULT_AI_OUTLINE, sources: sourceMaterial ?? DEFAULT_AI_SOURCE_MATERIAL, ... })`. |
| **Impact** | An admin navigating directly to `/admin/foundry/preview` (e.g. browser back, accidental URL, or a stale link in the audit log) lands on the page and can click the magic button. In real-AI mode, the call fires with hardcoded mock title `'HR Basics at Redex'` and an empty source — generation cost is real, audit log shows the synthetic call, and the resulting lesson set is generic. Cross-cutting handoff to Reviewer #4 (AI pipeline): server-side mock-data-into-prompt leak. |
| **Action** | Add `useDraftRedirect('preview')` — the hook will bounce back to `/admin/foundry/outline` when outline is unapproved. |
| **Verification** | Clear localStorage; navigate to `/admin/foundry/preview`; expect redirect to `/start`. |

#### F-MGP-2 — Primary CTA reads "✨ Generate Full Module in One Click (Preview Mode)" — design-bar §11 ban on Magic Button

| Field | Value |
|---|---|
| **Severity / Confidence** | critical / high |
| **Tag** | DEMO |
| **Evidence** | `ModuleGenerationPreviewPage.tsx:121` — `{isGenerating ? 'Generating module…' : '✨ Generate Full Module in One Click (Preview Mode)'}`. Empty-state on line 148 also references "the Magic Button above". |
| **Impact** | Gamification + emoji on the most-photographed surface in the Foundry chain. Violates `docs/design-bar.md §11` and `017-single-redex-video-player-component.md`-era brand tone. Directly mentioned in the foundry design audit as P0/P1. |
| **Action** | Replace copy with `Generate all lessons` (or `Draft all lessons from the approved outline`); remove ✨; remove "Magic Button" reference in empty state ("Click Generate above to draft each lesson"). |
| **Verification** | Grep for `Magic Button` and `✨ Generate` — expect zero matches in `src/features/foundry/**`. |

#### F-MGP-3 — Page renders no `FoundryStepper`; eyebrow hardcodes "STEP 5"

| Field | Value |
|---|---|
| **Severity / Confidence** | medium / high |
| **Tag** | POLISH |
| **Evidence** | Lines 97-100 — `<p>REDEX AI COURSE FOUNDRY · STEP 5</p>`. No `<FoundryStepper />` rendered (compare with `OutlineReviewPage`, `FoundryQuestionsPage` which do render it). |
| **Impact** | Page-to-page navigation chrome inconsistency; admin loses spatial sense of progress between outline review and preview. |
| **Action** | Add `<FoundryStepper />` after the header; remove `· STEP 5` from the eyebrow. |

#### F-MGP-4 — Empty-state copy "Click the Magic Button above" doubles down on the engineer term

Already captured under F-MGP-2.

---

### 3.9 `SelfCritiqueReviewPage` ⚠ DEMO BLOCKER PAGE

#### F-SC-1 — `onEditIssue={() => toast.info('Manual editing in Slice 3.4')}` leaks Linear-cycle language to the admin

| Field | Value |
|---|---|
| **Severity / Confidence** | critical / high |
| **Tag** | DEMO |
| **Evidence** | `SelfCritiqueReviewPage.tsx:162` — `onEditIssue={() => toast.info('Manual editing in Slice 3.4')}`. The toast surfaces engineer-internal cycle vocabulary on a CEO demo surface. |
| **Impact** | Any admin who clicks "Edit" on a critique issue triggers a visible toast with "Slice 3.4" wording. |
| **Action** | Either remove the `Edit` affordance until manual editing is wired, or replace the toast with `Manual editing is coming soon.` |
| **Verification** | Click any critique issue's Edit button; toast text must not contain the word "slice". |

#### F-SC-2 — Page renders no `FoundryStepper`; eyebrow hardcodes "STEP 6"

| Field | Value |
|---|---|
| **Severity / Confidence** | medium / high |
| **Tag** | POLISH |
| **Evidence** | Lines 88-91 — eyebrow string; no stepper rendered. |
| **Impact** | Same as F-MGP-3. |
| **Action** | Render `<FoundryStepper />`; remove `· STEP 6` from the eyebrow. |

#### F-SC-3 — Footer "Return to source binder" link suggests going back to step 2 from step 6

| Field | Value |
|---|---|
| **Severity / Confidence** | low / high |
| **Tag** | POLISH |
| **Evidence** | `SelfCritiqueReviewPage.tsx:175-177`. |
| **Impact** | Jarring; loses workflow context. Most admins want to return to module preview (step 5), not source (step 2). |
| **Action** | Change destination to `/admin/foundry/preview` (Back to module preview), and let the header "← Back to module preview" link be the only one. |

#### F-SC-4 — Cold-load defaults to `DEFAULT_AI_MODULE_PREVIEW` + `DEFAULT_AI_SOURCE_MATERIAL` when calling `critiqueModule`

| Field | Value |
|---|---|
| **Severity / Confidence** | high / high |
| **Tag** | PROD |
| **Evidence** | `SelfCritiqueReviewPage.tsx:27-39` — `critiqueModule` builds payload with `module: generatedModule ?? DEFAULT_AI_MODULE_PREVIEW, sources: sourceMaterial ?? DEFAULT_AI_SOURCE_MATERIAL`. There is no cold-load redirect (no `useEffect` redirect, no `useDraftRedirect`). |
| **Impact** | Same class as F-MGP-1 — direct navigation to `/admin/foundry/critique` triggers an AI call with mock-default payload. Cross-cutting handoff to Reviewer #4. |
| **Action** | Add `useDraftRedirect('critique')`. |

---

### 3.10 `SideBySideReviewPage`

#### F-SBS-1 — Lesson-reviews derivation is now correct, but mock branch still gates on `getCourseFoundryAiMode() !== 'real'`

| Field | Value |
|---|---|
| **Severity / Confidence** | low / high |
| **Tag** | (resolved-since-prior-audit) |
| **Evidence** | `SideBySideReviewPage.tsx:71-78` — `useMockGenerationDelay({ shouldGenerate: getCourseFoundryAiMode() !== 'real' && lessonReviews.length === 0, ... })`. Lines 80-99 — `useEffect` derives reviews from `generatedModule.lessons` when not pre-populated. The previously-critical "perpetual Loading review data…" bug from the prior functional audit is no longer reproducible because the effect populates reviews from the generation output. |
| **Impact** | None — this is a confirmation the prior bug is fixed. Flagged here only because the dual-mode gating (`mockGenerationDelay` AND `useEffect`) makes the trigger order unclear. |
| **Action** | None required; consider collapsing to a single derivation path. |

#### F-SBS-2 — Header eyebrow hardcodes "STEP 7"; no `FoundryStepper`

Same class as F-MGP-3 / F-SC-2.

#### F-SBS-3 — `🚫 Publish blocked — Resolve unsupported claims before publishing` mixes ASCII emoji with system text

| Field | Value |
|---|---|
| **Severity / Confidence** | low / high |
| **Tag** | POLISH |
| **Evidence** | `SideBySideReviewPage.tsx:142-145`. |
| **Impact** | Reads more like chat than a system banner; consider an alert glyph from lucide-react. |
| **Action** | Use `<AlertOctagon className="…" />` (already imported) without the prefix emoji. |

#### F-SBS-4 — "Return to source binder" footer link

Same finding as F-SC-3 — leads from step 7 back to step 2. ([`SideBySideReviewPage.tsx:228-230`](../../src/features/foundry/pages/SideBySideReviewPage.tsx))

---

### 3.11 `PublishBlockersPage`

#### F-PB-1 — `FoundryStepper` highlights "Publish" as current while the admin is still on Blockers

| Field | Value |
|---|---|
| **Severity / Confidence** | high / high |
| **Tag** | DEMO |
| **Evidence** | `FoundryStepper.tsx:32-33` — `'/admin/foundry/blockers': 'published'`. So when the admin is on the **blockers** page, the stepper marks the Publish step as `current`. |
| **Impact** | The blockers page is the gate BEFORE publish. Telling the admin they are "on Publish" before they have clicked Publish misleads about the state machine. If a CEO sees the stepper say Publish is current and the page says blockers exist, the impression is that publish has failed — when it has actually not yet been attempted. |
| **Action** | Either add a separate stepper stage `'blockers'` between `'sidebyside'` and `'published'`, or map `/blockers` to stage `'sidebyside'` (treats blockers as the tail of review) — the former is cleaner. |
| **Verification** | Open `/admin/foundry/blockers` with publishable state; stepper should NOT highlight "Publish" until the admin clicks the Publish button. |

#### F-PB-2 — Cold-load `hasAnyFoundryData` empty branch renders a "No active draft to check yet." Card — good — but the back-CTA goes to `/outline` instead of `/start`

| Field | Value |
|---|---|
| **Severity / Confidence** | medium / high |
| **Tag** | PROD |
| **Evidence** | `PublishBlockersPage.tsx:84-89` — empty-state CTA `<Button onClick={() => navigate('/admin/foundry/outline')}>Back to outline</Button>` is offered as the only escape hatch. Outline page itself will then redirect onward to `/questions` → `/source` → `/start`. |
| **Impact** | Multi-hop redirect from a cold-load empty state. |
| **Action** | Send the empty-state CTA directly to `/admin/foundry/start` ("Start a new module"). |

#### F-PB-3 — Inline redirect logic depends on data being non-null AND missing lessons; safer pattern available

| Field | Value |
|---|---|
| **Severity / Confidence** | medium / high |
| **Tag** | PROD |
| **Evidence** | `PublishBlockersPage.tsx:30-43` — bespoke `hasAnyFoundryData && (generatedModule === null || lessonReviews.length === 0)` redirect-to-sidebyside. |
| **Impact** | Hard-to-reason redirect logic; brittle for resumed drafts where some fields are set and some not. |
| **Action** | Use `useDraftRedirect('blockers')`. |

---

### 3.12 `PublishConfirmationPage`

#### F-PC-1 — Page renders `FoundryStepper` on a terminal screen

| Field | Value |
|---|---|
| **Severity / Confidence** | low / high |
| **Tag** | POLISH |
| **Evidence** | `PublishConfirmationPage.tsx:111` — `<FoundryStepper />` rendered between the header and the published-module card. |
| **Impact** | Implies the workflow is still in motion; the terminal screen should communicate completion. |
| **Action** | Replace the stepper with a "Flow complete" affordance, or hide it entirely on the published screen. |

#### F-PC-2 — Three flat-rank action buttons in the success card with no visual hierarchy

| Field | Value |
|---|---|
| **Severity / Confidence** | medium / medium |
| **Tag** | PROD |
| **Evidence** | `PublishConfirmationPage.tsx:144-159` — `Return to admin dashboard` (brand) + `Edit & create new version` (outline, sometimes disabled) + `Start a new module` (outline). |
| **Impact** | Admin must read three CTAs to decide. "Edit & create new version" silently disables when `moduleId` is missing — disabled tooltip is helpful but the layout doesn't communicate priority. |
| **Action** | Promote one as primary (likely "Return to admin dashboard"), demote the others into a secondary row with smaller buttons or a dropdown ("More options"). |

#### F-PC-3 — `learning_outcomes` extraction handles both string and `{text}` object shapes — brittle type cast

| Field | Value |
|---|---|
| **Severity / Confidence** | low / medium |
| **Tag** | POLISH |
| **Evidence** | `PublishConfirmationPage.tsx:53-62` — `as unknown as { learning_outcomes?: Array<string \| { id?: string; text?: string }> }`. |
| **Impact** | Suggests the underlying type isn't pinned down; if the basics-v2 form ships with objects, the LearnerDashboard / ModuleVersionHistory pages (which expect `string[]`) will silently drop entries. |
| **Action** | Resolve the schema; pick one shape (recommend `string[]`) and update all readers. |

---

### 3.13 `LearnerDashboardPage`

#### F-LD-1 — Module title and remaining-minutes still fall back to `DEMO_HR_BASICS_COURSE` constants

| Field | Value |
|---|---|
| **Severity / Confidence** | high / high |
| **Tag** | PROD |
| **Evidence** | `LearnerDashboardPage.tsx:91-99` — `title: primaryVersion?.module_title ?? DEMO_HR_BASICS_COURSE.title` and `estimatedMinutesLeft: Math.max(0, Math.round(DEMO_HR_BASICS_COURSE.estimated_minutes * ((100 - percentage) / 100)))` — the remaining-minutes calc always uses `DEMO_HR_BASICS_COURSE.estimated_minutes`, regardless of which module the assignment is actually for. |
| **Impact** | A real learner assigned to a module that isn't HR Basics still sees "HR Basics at Redex" if no version exists, and ALWAYS sees the HR Basics duration (20 minutes) baked into the "~X minutes remaining" line. |
| **Action** | (a) Replace `DEMO_HR_BASICS_COURSE.title` fallback with `primaryAssignment ? primaryAssignment.module_title : 'No assigned module'`; (b) replace `DEMO_HR_BASICS_COURSE.estimated_minutes` with `primaryVersion?.estimated_minutes ?? 0`; (c) only render the "Continue Training" card if there is a real assignment. |
| **Verification** | Sign in as a learner with an assignment for a non-HR Basics module; expect that module's title and duration. |

#### F-LD-2 — `<Progress>` hardcodes `aria-label="Onboarding progress"`

| Field | Value |
|---|---|
| **Severity / Confidence** | high / high |
| **Tag** | PROD |
| **Evidence** | `LearnerDashboardPage.tsx:19` — `aria-label="Onboarding progress"` baked into the component. |
| **Impact** | Screen-reader users on a non-onboarding module hear "Onboarding progress" regardless of the module name. Accessibility regression. |
| **Action** | Accept `aria-label` as a prop, default to `Module progress` and pass `Progress for ${moduleTitle}` from the caller. |

#### F-LD-3 — Greeting is static "Good morning, …" — admin dashboard already has the time-of-day helper

| Field | Value |
|---|---|
| **Severity / Confidence** | medium / high |
| **Tag** | PROD |
| **Evidence** | `LearnerDashboardPage.tsx:115` — `Good morning, {displayName}. 👋`. Compare with `AdminDashboardPage.tsx:14-18` `greetingFor()` helper. |
| **Impact** | Learner visiting the dashboard at 3pm sees "Good morning" — feels stale / not personalized. |
| **Action** | Import or duplicate the same helper; render `{greetingFor(new Date().getHours())}, {displayName}. 👋`. |

#### F-LD-4 — "Your Onboarding Progress" card heading is prescriptive

| Field | Value |
|---|---|
| **Severity / Confidence** | low / high |
| **Tag** | POLISH |
| **Evidence** | `LearnerDashboardPage.tsx:184` — `<CardTitle>Your Onboarding Progress</CardTitle>`. The list below is just `learnerAssignments` (could be any kind of training). |
| **Impact** | Wrong context for non-onboarding learners (e.g. cross-training). |
| **Action** | Rename to `Your assigned training` or `Your modules`. |

#### F-LD-5 — "Onboarding Buddy" card content is static / not data-driven

| Field | Value |
|---|---|
| **Severity / Confidence** | low / high |
| **Tag** | POLISH |
| **Evidence** | `LearnerDashboardPage.tsx:202-220` — static copy "A buddy will be assigned during your first week" + disabled `Message buddy` button. |
| **Impact** | A learner past the first week sees stale messaging; a learner with no buddy assigned sees a dead button. The disabled label is honest, but the surface is taking up high-real-estate. |
| **Action** | Hide the card when no buddy is assigned, or gate behind a real `buddy_user_id` field. |

#### F-LD-6 — When `learnerAssignments.length === 0` the page still renders the "Continue where you left off" card with `DEMO_HR_BASICS_COURSE` data

| Field | Value |
|---|---|
| **Severity / Confidence** | high / high |
| **Tag** | PROD |
| **Evidence** | `LearnerDashboardPage.tsx:91-105` — `primaryAssignment` may be `undefined`; `currentAssignment` is computed unconditionally using `useMyProgress()` (which defaults to `DEMO_HR_BASICS_COURSE`). |
| **Impact** | A learner with no assignments still sees a "Continue where you left off" card titled "HR Basics at Redex" with a Continue button that navigates to `/learn/player/hr-basics-mod-001`. Confusing in production. |
| **Action** | Branch the render: if `learnerAssignments.length === 0`, replace the Continue card with an "No modules assigned yet" empty state and hide the Continue button. |
| **Verification** | Sign in as a learner with zero assignments; expect an empty-state card, not "HR Basics at Redex". |

---

### 3.14 `ModuleVersionHistoryPage`

#### F-MVH-1 — Profile fetch falls back to `MOCK_ORG_PEOPLE` then `'Unknown user'`

| Field | Value |
|---|---|
| **Severity / Confidence** | medium / medium |
| **Tag** | PROD |
| **Evidence** | `ModuleVersionHistoryPage.tsx:37-46` — `personName` resolves with `profileNameById.get(userId) ?? MOCK_ORG_PEOPLE.find(...).display_name ?? 'Unknown user'`. `useModuleVersionHistory.ts:35-58` correctly fetches profiles for real UUIDs via `fetchProfilesByIds`, but if a profile row is missing or RLS hides it, the page resolves the name to a mock fallback and then `'Unknown user'`. |
| **Impact** | Newly seeded admin users not in `MOCK_ORG_PEOPLE` will display `'Unknown user'` while the page loads or if RLS hides the row. Audit fidelity hurts. |
| **Action** | Show `userId.slice(0, 8)…` plus an info icon "user not in directory" rather than the misleading `'Unknown user'`. Verify with Reviewer #3 (security) whether RLS permits `profiles` reads for the version author. |
| **Verification** | Publish a version as a non-mock user; expect a real display name to appear after the fetch resolves. |

#### F-MVH-2 — Pending-archive confirmation inline panel is solid, but `Fork` action does not confirm

| Field | Value |
|---|---|
| **Severity / Confidence** | low / high |
| **Tag** | POLISH |
| **Evidence** | `ModuleVersionHistoryPage.tsx:216-226` — `<Button>Create new version</Button>` triggers `handleCreateNewVersion` which resets the Foundry draft store and navigates away — no confirmation. Compare with the archive button which gates on `pendingArchiveVersionId`. |
| **Impact** | An admin clicking "Create new version" with in-flight Foundry draft work loses it silently — `resetFoundryDraft()` is called before the navigate. |
| **Action** | Add a confirmation prompt when `useFoundryDraftStore.getState().currentDraft !== null`. |
| **Verification** | Start a new draft in Foundry; navigate to ModuleVersionHistoryPage; click "Create new version"; expect a confirm before the draft is wiped. |

#### F-MVH-3 — "Show learners" expand shows learner names but uses the same `personName` mock-fallback chain

| Field | Value |
|---|---|
| **Severity / Confidence** | medium / medium |
| **Tag** | PROD |
| **Evidence** | `ModuleVersionHistoryPage.tsx:281-289` — `personName(learnerId, profileNameById)`. Same fallback to `MOCK_ORG_PEOPLE` then `'Unknown user'`. Learners are NOT in the version-history `profileNameById` map (which is only populated from `approved_by / published_by`). |
| **Impact** | Production: real learner UUIDs land in `'Unknown user'` immediately because the fetch only requests profiles for approver/publisher IDs. |
| **Action** | Extend `resolveProfileNameById` in `useModuleVersionHistory.ts` to include all `assignments[].assignee_user_id` plus all `attempts[].user_id` that appear in `versionLearners`. Or fetch per-list lazily on expand. |
| **Verification** | Expand "Show learners" on a published version with real completions; expect real names. |

---

## 4. Cross-cutting handoffs to sibling reviewers

| Handoff | To | Detail |
|---|---|---|
| Cold-load mock-data leaks into real AI calls | **Reviewer #4 (AI/edge pipeline)** | `ModuleGenerationPreviewPage`, `SelfCritiqueReviewPage`, `OutlineReviewPage`, `SideBySideReviewPage` can all submit jobs with `DEFAULT_AI_*` payloads (incl. `'HR Basics at Redex'` title) when cold-loaded. Server-side prompt likely embeds these strings into the prompt body. |
| `SourceImpactReviewPage` is unwired to Drive | **Reviewer #4** | `simulateDriveSync()` instead of invoking the `drive-sync` edge function; `MOCK_MODULE_SOURCE_BINDINGS` instead of querying `module_source_bindings` table. |
| `useActorInfo` returning null falls back to `'Redex system'` in audit writes | **Reviewer #3 (Supabase/security)** | Verify `audit_log` RLS rejects/allows synthetic actors; confirm whether `useActorInfo` can return null for an authenticated learner/admin. |
| `MOCK_ORG_PEOPLE` fallback masks real profile failures in `ModuleVersionHistoryPage` | **Reviewer #3** | Confirm that authenticated admins can read profile rows for arbitrary user IDs (RLS scope on `profiles`). |
| `/admin/onboard` route readiness | **Reviewer #1 (frontend architecture)** | New CTA on the admin dashboard is unguarded; need to confirm destination is production-ready. |
| `useDraftRedirect` rollout is incomplete | **Reviewer #1** | Inline guards in 7 Foundry pages carry `// Builder-I hook pending` comments; recommend Reviewer #1 file a single follow-up to finish the migration. |
| `FoundryStepper` mislabels `/blockers` route as stage `'published'` | **Reviewer #1** | Stage constant in `FoundryStepper.tsx:32` is wrong, but the fix touches `FoundryDraftStage` types — may have type ripple-out beyond UX. |
| `SourceLibraryPage` `Read ADR 010` link uses a `..` relative href | **Reviewer #1** | SPA routing won't serve `../decisions/...` — link is broken in the running app. |

---

## 5. Verification gaps

Each finding's "Verification" line lists the manual / E2E check needed. The following gaps are NOT covered by this static review and warrant explicit follow-up:

1. **No live Supabase smoke-test** was attempted. The "real-mode" claims (e.g. cold-load triggers an AI call with mock title) are inferred from code paths, not reproduced.
2. **No keyboard/screen-reader audit** was run. `aria-label` issues (F-LD-2) and disabled-button tooltip semantics (F-OR-1, F-FQ-1) are visually inferred.
3. **No copy review against `docs/glossary.md`** — terms like "Foundry", "Source Binder", "Side-by-side review" may carry inconsistencies that a glossary-driven sweep would catch.
4. **No visual regression** vs prior screenshots — recent admin dashboard changes (3-CTA row) may have shifted layout below the fold.
5. **Mobile (`<md`) breakpoint** was not visited end-to-end — all assessments are at `md`+.

---

## 6. Acknowledgement of fixes since the prior audits

The following items from the prior audits are confirmed resolved in current code and **do not** need re-action:

- AdminDashboardPage per-bucket empty copy + slate-400 icons ([P0-3 design / P1.1 functional](admin-dashboard-design-audit-2026-05-24.md))
- AdminDashboardPage AssignmentsEntryCard mock copy (now correct in `AssignmentsEntryCard.tsx:27`)
- AdminDashboardPage `variant="brand"` parity on Foundry + Assignments CTAs
- AdminDashboardPage generation-job amber banner present
- AdminDashboardPage completion-rate `—` when null
- AdminDashboardPage time-of-day greeting + first-name fallback present
- AdminDashboardPage "Source library →", "Audit log →" chip styling
- `SideBySideReviewPage` no longer stuck on "Loading review data…" in real mode (derives from `generatedModule.lessons`)
- `PublishBlockersPage` no longer renders `MOCK_PUBLISH_BLOCKERS` on empty state
- `useModuleVersionHistory` now batch-fetches real Supabase profiles instead of mock lookup (P1.4 functional)

---

## 7. No-change attestation

No code, SQL, configuration, dependency, or deploy changes were made during this review. All findings are derived from static read of the in-scope files at the current `HEAD` commit, cross-referenced with the prior audit documents in `docs/reviews/`. Where the prior audits flagged issues that are now fixed, this report acknowledges them (Section 6) rather than re-listing them.

---

*End of UX integrity review.*
