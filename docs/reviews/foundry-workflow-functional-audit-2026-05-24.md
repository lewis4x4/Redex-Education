# Foundry Author Workflow — Functional Audit
**Date:** 2026-05-24  
**Auditor:** JARVIS (read-only explore agent)  
**Commit:** 8094d67  
**Supabase project:** `toghxeuhgkcrbrdxewdw` (Redex_App)  
**Scope:** Full Foundry author chain, AI layer, edge functions, schema, store, tests

---

## Executive Summary

The Foundry chain is structurally complete and mock-mode works end-to-end (confirmed by `App.routes.foundryFlow.test.tsx`). Before the live AI smoke test against `_library/` HR content there are **5 critical blockers** that will cause real-mode to silently fail or show incorrect data, **9 high-severity gaps** that will produce confusing authoring behaviour, and **11 medium/low gaps** affecting prompt quality, UX polish, and production hygiene.

The two most dangerous issues for the smoke test:
1. **`SideBySideReviewPage` shows "Loading review data…" forever** in real mode because `getCourseFoundryInitialLessonReviews()` returns `[]` in real mode with no DB fetch fallback.
2. **Drive Library file selections are never passed to outline/lesson generation** — the `selectedLibraryFileIds` in the store are display-only; the real AI call receives `DEFAULT_AI_SOURCE_MATERIAL` (empty) when `sourceMaterial === null`.

---

## A · Mock-Data Leak Inventory

Every hardcoded fixture, persona name, and fallback string visible to authors in production (or that flows into real AI calls).

| # | Severity | File:Line | Leaked String | Condition | Recommended Fix |
|---|----------|-----------|---------------|-----------|-----------------|
| M1 | **CRITICAL** | `src/features/foundry/ai/pageInputDefaults.ts:15` | `title: 'HR Basics at Redex'` in `DEFAULT_AI_MODULE_BASICS` | Passed to real AI `generateOutline` when `currentDraft === null` (cold load of `/admin/foundry/outline`) | Add cold-load redirect guard before any outline generation trigger |
| M2 | **CRITICAL** | `src/features/foundry/ai/pageInputDefaults.ts:27` | `title: 'Mock source material'`, `id: 'mock-source-material'` in `DEFAULT_AI_SOURCE_MATERIAL` | Passed to real AI when `sourceMaterial === null` — ends up in audit logs and AI input | Same cold-load guard; never pass default source to real AI |
| M3 | **CRITICAL** | `src/features/foundry/ai/pageInputDefaults.ts:36` | `course_title: 'HR Basics at Redex'` in `DEFAULT_AI_OUTLINE` | Passed to real AI `generateLessons` when `outline === null` (cold load of `/admin/foundry/preview`) | Cold-load redirect guard |
| M4 | **HIGH** | `src/features/foundry/pages/PublishBlockersPage.tsx:6,42` | `MOCK_PUBLISH_BLOCKERS` rendered to author | When `!hasAnyFoundryData` (cold load, post-reset, or new session) — visible in production | Show empty state card instead of mock blockers; remove import |
| M5 | **HIGH** | `src/features/foundry/store/foundryDraftStore.ts:207-213` | `audience: 'New hires'`, `training_type: 'general_informational'`, `estimated_minutes: 20` | `hydrateFromDraftMetadata()` uses hardcoded defaults — a resumed draft loses its actual audience, training type, and duration permanently | Store these fields in `draft_metadata` and restore from there, or fetch the full `module_versions` row |
| M6 | **HIGH** | `src/features/foundry/store/foundryDraftStore.ts:388-397` | Same hardcoded fields | `resumeDraftFromAdminItem()` set when the draft doesn't match current | Same fix |
| M7 | **HIGH** | `src/features/foundry/store/foundryDraftStore.ts:271-278` | Same hardcoded fields | `seedDraftFromModuleVersion()` | Same fix |
| M8 | **HIGH** | `src/features/foundry/store/foundryDraftStore.ts:32` | `DEFAULT_MODULE_VERSION_ID = 'module-version-hr-basics-v1'` | Used in `resolvePublishedModuleVersionId()` when title is empty or literally `'HR Basics at Redex'` | Fine in mock mode; in real mode the persisted Supabase ID should always win — add an assertion that Supabase mode never reaches this fallback |
| M9 | **MEDIUM** | `src/features/foundry/pages/PublishConfirmationPage.tsx:43` | `\|\| 'HR Basics at Redex'` as title fallback | Shown in confirmation heading if `currentDraft?.title` is undefined | Render a generic "Your module" placeholder or guard publish path |
| M10 | **MEDIUM** | `src/features/foundry/data/mockGeneratedModule.ts:22` | `'Your onboarding buddy is Sarah Chen'` persona name | Visible when author is in mock mode but has real source loaded | Acceptable in mock mode only; ensure `VITE_AI_MODE=real` is enforced in production `.env` |
| M11 | **MEDIUM** | `src/features/foundry/data/mockGeneratedModule.ts:22` | `peopleops@redex.example` placeholder email | Same mock-mode condition | Same — production `.env` enforcement |
| M12 | **LOW** | `src/features/foundry/data/mockMissingSource.ts:4-7` | `MOCK_MISSING_SOURCE_TEXTS` array with `[PLACEHOLDER]`, `[TODO]`, `[FIXME]` strings | Only used indirectly for testing; not author-visible directly | No action required — test fixture only |

**Acceptance test for mock leak fixes:**  
```bash
# Smoke grep — no demo/mock strings should reach author-visible render paths in production build
grep -rn "HR Basics at Redex\|Mock source\|Sarah Chen\|peopleops@redex.example\|MOCK_PUBLISH_BLOCKERS" \
  src/features/foundry/pages/ src/features/source-binder/pages/
```
Expected: zero hits in production page render paths (hits in `pageInputDefaults.ts` and `data/` directories are acceptable only if they cannot reach real-mode code paths).

---

## B · Per-Prompt Analysis

### Prompt Architecture: Two registries, one used

There are **two separate prompt registries** that are NOT in sync:

| Registry | Location | Used by | Prompt interpolation |
|----------|----------|---------|---------------------|
| Client registry | `src/features/foundry/ai/prompts.ts` | `realAiClient.ts` (submits `promptKey` to edge function) | Rich template variables: `{{moduleBasics}}`, `{{courseOutline}}`, `{{lessonOutline}}`, `{{sourceBlocks}}`, `{{setupAnswers}}` — **NEVER actually interpolated** |
| Server registry | `supabase/functions/_shared/courseFoundryAiClientServer.ts` | `generation-worker/index.ts` | Flat: `{{input}}` → entire input JSON dumped inline |

The `realAiClient.ts` sends `promptKey` and `promptVersion` metadata to `submit-generation-job`, but the worker **ignores these** and uses its own `PROMPTS` map with simplified flat-input templates. The elaborate templates in `prompts.ts` with separate variable injection are currently dead code for the real-AI path.

**Acceptance test:** Verify `generation-worker` logs show which `PROMPTS` key was used, and confirm it matches the rich client-side prompt intention.

---

### Per-Prompt Field Analysis

#### `source_analysis` (v1)
| Field | Client sends | Server receives | Missing |
|-------|-------------|-----------------|---------|
| `sources` | `SourceMaterial \| SourceFile[]` | `input.sources ?? input` | ✅ Present |
| `sourceBinder` (template var) | — | Entire `input` JSON | Template var unused |
| Learning outcomes context | — | — | ❌ Not applicable yet |

**Gap:** Server prompt says "Identify topic, authority, section count, placeholder status" — fine. But if the user used Drive library files only (`selectedLibraryFileIds` set, `sourceMaterial === null`), the `sources` payload is `DEFAULT_AI_SOURCE_MATERIAL` (empty). The Drive files are never fetched and assembled server-side.

---

#### `outline_generation` (v1)
| Field | Client sends | Server receives | Missing |
|-------|-------------|-----------------|---------|
| `moduleBasics` | `basics: currentDraft ?? DEFAULT_AI_MODULE_BASICS` | `input.basics ?? {}` | ✅ Present (with fallback risk) |
| `setupAnswers` | `setupAnswers: setupAnswers ?? DEFAULT_AI_SETUP_ANSWERS` | `input.setupAnswers ?? {}` | ✅ Present (with fallback risk) |
| `sourceBlocks` | `sources: sourceMaterial ?? DEFAULT_AI_SOURCE_MATERIAL` | `input.sources ?? {}` | ⚠️ Only manual-paste source; Drive library files NOT included |
| `learning_outcomes` | — | — | ❌ **COMPLETELY ABSENT** — not in `ModuleBasicsDraft`, not in form, not in any prompt |
| `criticality` (dual scale) | `basics.criticality` = `'required'\|'optional'` | Same | ⚠️ Also `setupAnswers.criticality` = `'informational'\|'basic_knowledge'\|'operational'\|'compliance_high_risk'` — two different scales, AI receives both |

**Gap severity:** HIGH. The AI gets two conflicting criticality signals. The outline prompt would produce much better output if it received the wizard criticality (4-point scale) as the primary signal, not the binary required/optional.

---

#### `lesson_generation.text` (v1) — used for ALL lesson types
| Field | Client sends | Server receives | Missing |
|-------|-------------|-----------------|---------|
| `outline` | `outline ?? DEFAULT_AI_OUTLINE` | `input.outline ?? outputs.outline ?? {}` | ✅ Present (fallback risk) |
| `sources` | `sourceMaterial ?? DEFAULT_AI_SOURCE_MATERIAL` | `input.sources ?? {}` | ⚠️ Same Drive gap |
| `lessonOutline` (template var) | — | **NEVER extracted** — entire outline passed, not per-lesson | ❌ Per-lesson generation impossible — AI must generate all lessons at once |
| `moduleBasics` (template var) | — | Not forwarded from `generateLessons` input | ❌ Missing |
| `setupAnswers` (template var) | — | Not forwarded | ❌ Missing |
| `targetSectionId` | `job.target_section_id` | Passed correctly | ✅ |

**CRITICAL gap:** `realAiClient.ts:344` hardcodes `promptKey: 'lesson_generation.text'` for ALL lesson types. Quiz lessons, checklist lessons, scenario lessons, acknowledgments — ALL use the text generation prompt. The specialized prompts (`lesson_generation.quiz`, `lesson_generation.checklist`, etc.) in `prompts.ts` are unreachable.

**The server-side `courseFoundryAiClientServer.ts`** only has `lesson_generation.text` in its `PROMPTS` map — so lesson-type routing doesn't exist server-side either.

---

#### `self_critique` (v1)
| Field | Prompt template requires | Server actually receives |
|-------|--------------------------|--------------------------|
| `promptIds` | ✅ Required | ❌ Never sent |
| `sourceBlocks` | ✅ Required | ✅ `input.sources` |
| `courseOutline` | ✅ Required | ❌ Never sent |
| `generatedLessons` | ✅ Required | ✅ `input.module` (full preview) |
| `generatedAssessments` | ✅ Required | ⚠️ `input.assessments ?? outputs.generate_assessments ?? null` |

The server prompt template is `"Critique generated artifacts and return CritiqueModuleOutput.\n\nInput JSON:\n{{input}}"` — so the AI never sees `promptIds` or `courseOutline` even if they were sent, because the server just dumps the whole input. The client-side prompt template variables are phantom.

---

#### `regenerate_with_fixes` (v1)
| Field | Prompt template requires | Actually sent |
|-------|--------------------------|---------------|
| `existingLesson` | ✅ Required | ❌ Full `module` preview sent (not per-lesson) |
| `critiqueIssues` | ✅ Required | ✅ `critique` object |
| `fixesToApply` | ✅ Required | ✅ `selectedFixes` (issue IDs) |
| `sourceBlocks` | ✅ Required | ✅ `sources` |

Functionally recoverable because the server prompt ignores template variables and dumps input, but the AI cannot do per-lesson granular fixes.

---

#### `entailment_check` (v1)
| Field | Required | Present | Notes |
|-------|----------|---------|-------|
| `claim` | ✅ | ✅ | Correctly extracted from `CitedClaim` |
| `sourceSection` | ✅ | ✅ | Correctly passed with `id`, `heading`, `body` |

**✅ This prompt is correctly wired end-to-end.** Temperature=0, small token limit — good.

---

### Learning Outcomes Integration — Full Gap Map

`learning_outcomes` does not exist anywhere:
- `ModuleBasicsDraft` (types.ts) — **not present**
- `ModuleBasicsFormValues` — **not present**
- `moduleBasicsSchema` (foundrySchemas.ts) — **not present**
- `ModuleBasicsForm.tsx` — **no field**
- `DEFAULT_AI_MODULE_BASICS` — **not present**
- Any prompt template — **not mentioned**
- Any DB migration — **no column**
- `draft_metadata` type — **not included**

For the basics form v2 builder to add learning_outcomes, see section "Scope for the basics form v2 builder" below.

---

## C · State Transition Gaps

### Guard matrix — what each page requires vs. what exists

| Page / Route | Required store state | Redirect if missing? | Fallback behavior |
|--------------|---------------------|---------------------|-------------------|
| `FoundryStartPage` `/start` | None | N/A — entry point | ✅ Clean |
| `SourceBinderInputPage` `/source` | `currentDraft` (shows orphan warning) | ❌ No redirect | Shows "No working draft" warning card — **author can still paste source and continue** |
| `FoundryQuestionsPage` `/questions` | `currentDraft` | ❌ No redirect | Fully functional without draft — stores answers to null module |
| `OutlineReviewPage` `/outline` | `currentDraft`, `sourceMaterial\|selectedLibraryFileIds`, `setupAnswers` | ❌ No redirect | **Silently uses `DEFAULT_AI_MODULE_BASICS` + `DEFAULT_AI_SOURCE_MATERIAL` + `DEFAULT_AI_SETUP_ANSWERS`** — generates "HR Basics at Redex" outline from empty source |
| `ModuleGenerationPreviewPage` `/preview` | `outline` (approved) | ❌ No redirect | **Silently uses `DEFAULT_AI_OUTLINE`** — generates lessons for mock outline |
| `SelfCritiqueReviewPage` `/critique` | `generatedModule` | ❌ No redirect | **Silently uses `DEFAULT_AI_MODULE_PREVIEW`** (empty lessons) |
| `SideBySideReviewPage` `/sidebyside` | `lessonReviews.length > 0` | ❌ No redirect | In mock mode: auto-populates `MOCK_LESSON_REVIEWS`. **In real mode: permanently shows "Loading review data…"** |
| `PublishBlockersPage` `/blockers` | `generatedModule`, `critique`, `lessonReviews` | ❌ No redirect | **Shows `MOCK_PUBLISH_BLOCKERS` when `!hasAnyFoundryData`** |
| `PublishConfirmationPage` `/published` | `publishStatus === 'published'` | ❌ No redirect | Shows confirmation with title fallback `'HR Basics at Redex'` |

**Recommended fix pattern for all pages:**
```tsx
// Add to each page that requires currentDraft
const currentDraft = useFoundryDraftStore(s => s.currentDraft)
useEffect(() => {
  if (currentDraft === null) navigate('/admin/foundry/start', { replace: true })
}, [currentDraft, navigate])
```

---

### Back-navigation state invalidation

`setBasics()` (called on form submit from `FoundryStartPage`) resets only `publishStatus` — it does NOT clear:
- `sourceMaterial` ✅ (intentional — source persists through back-nav)
- `setupAnswers` ❌ (stale if audience changed)
- `outline` ❌ (stale — was generated for old basics)
- `generatedModule` ❌ (stale)
- `critique` ❌ (stale)
- `lessonReviews` ❌ (stale)

**Scenario:** Author completes flow for "Module A", goes back to `/start`, renames to "Module B", clicks Continue. Arrives at `/outline` with the old "Module A" outline already approved. No visual indication of staleness. The "Regenerate" button exists but is not mandatory.

**Recommended fix:** `setBasics` should call `clearOutline()`, `clearGeneratedModule()`, `clearCritique()`, `clearLessonReviews()` when basics fields that affect generation change (title, audience, training_type).

---

### `draft_metadata.current_stage` persistence

`persistDraftStage()` is called (fire-and-forget via `void`) at every transition:
- `setBasics` → `'basics'`
- `setSourceMaterial` → `'source'`
- `setSetupAnswers` → `'questions'`
- `setOutline` → `'outline'`
- `setGeneratedModule` → `'preview'`
- `setCritique` → `'critique'`
- `setLessonReviews` → `'sidebyside'`
- `setPublished` → `'published'`

✅ Stage tracking is logically complete. Errors are captured in `lastWriteError` but not surfaced to the author. A banner showing "⚠️ Auto-save failed" when `lastWriteError !== null` is missing.

**Missing:** `approveOutline()` does NOT call `persistDraftStage('outline')` to record the approved state. The `outline_status: 'approved'` is in localStorage but not in `draft_metadata`. Resuming from dashboard after outline approval routes correctly via `inferResumeRoute` (which checks `outline_status` from localStorage) but NOT from the DB `draft_metadata.current_stage` (which will still show `'outline'` not `'outline_approved'`). Minor but could confuse multi-device resume.

---

### Multi-tab concurrency

Zustand persists to `localStorage` key `'redex-foundry-draft-v1'`. Two tabs open to the same module:
- Both read from the same key on mount.
- Any write from Tab A overwrites Tab B's pending state.
- No tab-ID tracking, no optimistic lock.
- No `storage` event listener to detect cross-tab writes.

**Impact for smoke test:** If Brian has two browser windows open (e.g., `/source` and `/outline`) and submits one, the other will silently receive the overwrite on next render cycle. Recommend: close all but one tab during the smoke test.

---

### Generation job failure / pg_cron down

**If pg_cron is not configured or is down:**
- `submit-generation-job` inserts a row with `status='queued'`.
- `realAiClient.ts:pollJobUntilTerminal` polls every 2s for up to `MAX_POLL_ATTEMPTS = 900` iterations = **30 minutes**.
- No worker ever picks up the job.
- After 30 minutes: throws `"Course Foundry AI generation job {id} did not complete before polling timed out"`.
- This error propagates through the `void getCourseFoundryAiClient().generateOutline(...)` promise in `OutlineReviewPage`.
- The `useMockGenerationDelay` populate callback is `void`-ed — the error is **silently swallowed** (no `.catch()` wrapper).
- The UI stays on "Generating outline…" indefinitely with no error banner.

**If a job enters `status='failed'`:**
- `pollJobUntilTerminal` throws `last_error_message`.
- Same swallow issue — no error surface.

**Recommended fix for all three pages using `useMockGenerationDelay`:**
```tsx
const [generationError, setGenerationError] = useState<string | null>(null)
// In populate:
populate: () => {
  void generateOutline()
    .then((result) => setOutline(result, actor))
    .catch((error: unknown) => setGenerationError(error instanceof Error ? error.message : String(error)))
}
// Render:
{generationError ? <ErrorBanner message={generationError} onRetry={...} /> : null}
```

---

## D · Critical Edge Case: `SideBySideReviewPage` in Real Mode

**Severity: CRITICAL — blocks smoke test**

```typescript
// src/features/foundry/ai/index.ts:20-25
export async function getCourseFoundryInitialLessonReviews() {
  if (getCourseFoundryAiMode() === 'real') {
    return [];           // ← returns empty array in real mode
  }
  return mockInitialLessonReviews;
}

// SideBySideReviewPage.tsx:71-75
useMockGenerationDelay({
  shouldGenerate: lessonReviews.length === 0,
  delayMs: 500,
  populate: () => {
    void getCourseFoundryInitialLessonReviews().then(setLessonReviews)
  },
})
```

In real mode:
1. `lessonReviews.length === 0` → delay fires → returns `[]` → `setLessonReviews([])` → still 0
2. `selectedReview === null` (because `lessonReviews` is empty)
3. Author sees: **"Loading review data…"** permanently

**Root cause:** In the real pipeline, `LessonReviewItem[]` should be derived from the generation job's `source_binding` output (`unsupportedClaims`, `entailment_results`). But no code in the real-AI path ever calls `setLessonReviews`. After `setGeneratedModule` there is no follow-up to populate reviews.

**Recommended fix:** After `generateLessons` resolves, derive review items from the annotated `GeneratedModulePreview.lessons` (each lesson's `status` and `status_note` already encode the review state):
```typescript
// In ModuleGenerationPreviewPage after setGeneratedModule:
const derivedReviews: LessonReviewItem[] = generatedPreview.lessons.map(lesson => ({
  lesson_index: lesson.lesson_index,
  module_index: lesson.module_index,
  lesson_title: lesson.title,
  confidence: lesson.status === 'ready_for_approval' ? 'high'
             : lesson.status === 'unsupported_claim' ? 'unsupported' : 'medium',
  has_unsupported_claim: lesson.status === 'unsupported_claim',
  unsupported_note: lesson.status_note ?? '',
  status: 'pending',
  source_excerpts: [],  // populated from source_refs in a follow-up slice
}))
useFoundryDraftStore.getState().setLessonReviews(derivedReviews)
```

---

## E · Drive Library → Outline Gap

**Severity: CRITICAL — blocks Drive-only smoke test**

When an author selects files from the Source Library (Drive-backed), `selectedLibraryFileIds` is populated in the store. But:

- `OutlineReviewPage.tsx:40-45` passes `sources: sourceMaterial ?? DEFAULT_AI_SOURCE_MATERIAL` to `generateOutline` — `selectedLibraryFileIds` is **never read here**.
- `ModuleGenerationPreviewPage.tsx:37-41` passes `sources: sourceMaterial ?? DEFAULT_AI_SOURCE_MATERIAL` to `generateLessons` — same gap.
- The `selectedLibraryFileIds` are stored in Zustand/localStorage but never assembled into source content for AI calls.

**Effect during smoke test:** If Brian uses the Source Library to select `_library/` HR files and does NOT also paste the source in the text panel, the AI will generate from an empty source material (`DEFAULT_AI_SOURCE_MATERIAL.sections = []`). The outline will be generic/hallucinated.

**Recommended fix:** In real mode, before calling `generateOutline`, fetch the raw text of selected Drive source files via their parsed `source_sections` from Supabase and assemble them into a `SourceMaterial`. This is a non-trivial server round-trip; for the smoke test, recommend using the paste panel as the primary source input.

**Smoke test workaround:** Brian should paste the raw markdown from the `_library/` HR content into the `SourcePastePanel` (or upload the `.md` file) in addition to using Library selection. The paste-panel `sourceMaterial` will then be correctly passed to the AI.

---

## F · Real Supabase vs Mock Asymmetry Summary

| Feature | Mock mode | Real mode | Gap |
|---------|-----------|-----------|-----|
| Outline generation | Returns `MOCK_GENERATED_OUTLINE` | Calls real AI via edge function | ✅ Symmetric |
| Lesson source bindings in outline view | `MOCK_LESSON_SOURCE_BINDINGS` | `{}` (empty) | ⚠️ Outline review shows no source links in real mode |
| Lesson generation | Returns `MOCK_GENERATED_MODULE` | Calls real AI; ALL types use `lesson_generation.text` prompt | ❌ No lesson-type routing |
| Self-critique auto-trigger | Uses `MOCK_SELF_CRITIQUE` | Real AI call; missing `promptIds`, `courseOutline` in payload | ⚠️ AI lacks full context |
| Initial lesson reviews | `MOCK_LESSON_REVIEWS` | `[]` → page stuck | ❌ CRITICAL |
| Publish blockers | Computed from store OR `MOCK_PUBLISH_BLOCKERS` | Computed from store only (correct) | ⚠️ Cold-load shows mock data |
| Setup questions | Static wizard (same in both modes) | Static wizard (no AI inference) | ℹ️ `setup_question_inference` prompt exists but is never called |
| `persistDraftStage` | No-op (mock) | Writes to `redex.module_versions` | ✅ Correct |
| `saveSourceMaterial` | No-op | Writes to Supabase mutations | ✅ Correct |

---

## G · Edge Function Deployment Checklist

### Functions in codebase
| Function | File | Status |
|----------|------|--------|
| `drive-sync` | `supabase/functions/drive-sync/index.ts` | ✅ Complete — requires `GOOGLE_DRIVE_LIBRARY_FOLDER_ID`, `REDEX_ALLOWED_ORIGINS`, Google service account creds |
| `parse-source-file` | `supabase/functions/parse-source-file/index.ts` | ✅ Complete — requires same env vars |
| `submit-generation-job` | `supabase/functions/submit-generation-job/index.ts` | ✅ Complete — requires `REDEX_ALLOWED_ORIGINS` |
| `generation-worker` | `supabase/functions/generation-worker/index.ts` | ✅ Complete — requires `AI_PROVIDER_API_KEY`, `AI_PROVIDER`, `AI_MODEL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `custom-access-token-hook` | `supabase/functions/custom-access-token-hook/index.ts` | ✅ Present (auth layer, not Foundry) |

### Required environment variables (must be set in Supabase function secrets)
```
REDEX_ALLOWED_ORIGINS=https://redex.education,http://localhost:5173
GOOGLE_DRIVE_LIBRARY_FOLDER_ID=<folder_id>
AI_PROVIDER=anthropic
AI_PROVIDER_API_KEY=<anthropic_key>
AI_MODEL=claude-sonnet-4-5    # or claude-sonnet-4-6
AI_MAX_TOKENS=4096
AI_INPUT_COST_CENTS_PER_MILLION_TOKENS=300
AI_OUTPUT_COST_CENTS_PER_MILLION_TOKENS=1500
```

### pg_cron configuration (MUST BE DONE MANUALLY)
The `generation_jobs` migration comment states cron setup requires manual steps (Build Bible Slice C). The `generation-worker` will never be invoked until pg_cron calls it. Verify:
```sql
-- Run in Supabase SQL Editor:
SELECT * FROM cron.job WHERE jobname LIKE '%generation%';
```
If no rows returned, pg_cron is NOT configured. The worker endpoint URL pattern should be:
```
POST {SUPABASE_URL}/functions/v1/generation-worker
Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
```

### New edge functions needed for learning-outcomes
**None required** for the MVP. `learning_outcomes` should be passed as part of the existing `generateOutline` input payload. The current `outline_generation` server prompt already accepts the full `basics` object; adding `learning_outcomes` to `ModuleBasicsDraft` and including it in `basics` is sufficient.

---

## H · Migration Deployment Checklist

| Migration | Description | Applied locally | Applied remotely |
|-----------|-------------|-----------------|------------------|
| `20260521000000` | Schema reconcile + drop legacy | ✅ | Verify with `supabase db diff` |
| `20260522000100` | Training schema + RLS | ✅ | Verify |
| `20260522220557` | Source library v1 | ✅ | Verify |
| `20260523000100` | MVP complete schema + RLS | ✅ | Verify |
| `20260523120000` | Real RLS + role claims | ✅ | Verify |
| `20260523130000` | `generation_jobs` table | ✅ | **Critical — required for real AI** |
| `20260523133000` | `generation_jobs` hardening (idempotency, service-role lock) | ✅ | **Critical** |
| `20260524000000` | Owner email allowlist | ✅ | Verify |
| `20260524130000` | Security hardening | ✅ | Verify |
| `20260524160000` | `draft_metadata` column on `module_versions` | ✅ local | **Unconfirmed remote** |

**Verify remote state:**
```bash
supabase db diff --schema redex
# Should produce no diff if all migrations are applied
```

**`draft_metadata` impact if NOT applied remotely:**
- `upsertModuleDraft` calls succeed but `draft_metadata` writes are silently ignored by Postgres (column doesn't exist → error).
- Resume flow falls back to heuristic routing (localStorage) — not catastrophic.
- Run migration before smoke test.

### learning_outcomes — schema recommendation

**Recommended: Store in `draft_metadata` jsonb (no migration needed for MVP)**

```typescript
// In DraftMetadataSnapshot (foundryDraftStore.ts):
learning_outcomes?: string[]  // add to type

// In persistDraftStage payload:
learning_outcomes: state.currentDraft?.learning_outcomes
```

**Future (if querying by learning outcomes is needed):**
```sql
alter table redex.module_versions
  add column if not exists learning_outcomes jsonb;
```
No migration file exists yet — the column is absent. Do not add it until the form field is built.

---

## I · Test Coverage Inventory

### Tests that exist
| File | Covers |
|------|--------|
| `FoundryStartPage.test.tsx` | Form render, validation, submit |
| `FoundryQuestionsPage.test.tsx` | Wizard render, answers saved |
| `OutlineReviewPage.test.tsx` | Outline card, approve, regenerate |
| `ModuleGenerationPreviewPage.test.tsx` | Lesson list, generate click |
| `SelfCritiqueReviewPage.test.tsx` | Issue cards, ignore/unignore |
| `SideBySideReviewPage.test.tsx` | Review panel, approve/reject |
| `PublishBlockersPage.test.tsx` | Blocker list, publish button state |
| `PublishConfirmationPage.test.tsx` | Title display, edit new version |
| `foundryDraftStore.test.ts` | Store actions and state transitions |
| `App.routes.foundryFlow.test.tsx` | **Full E2E happy-path in mock mode** |
| `mockAiClient.test.ts` | Mock client output shape validation |
| `realAiClient.test.ts` | Real client submit/poll logic |
| `generation-worker/index.test.ts` | Worker stage execution |
| `courseFoundryAiClientServer.test.ts` | Server-side AI client |
| `sourceBindingsWriter.test.ts` | Source binding write + entailment |
| `parsers.test.ts` | Markdown section parsing |

### Test gaps (no coverage today)
| Gap | Priority | Description |
|-----|----------|-------------|
| Cold-load redirect | **HIGH** | Test that `/admin/foundry/outline` with empty store redirects to `/start` |
| Real-mode side-by-side | **HIGH** | Test that `lessonReviews = []` + `real` mode shows error state, not perpetual spinner |
| Back-nav state invalidation | **HIGH** | Test that changing basics clears outline/module/critique |
| `hydrateFromDraftMetadata` defaults | **HIGH** | Test that resumed draft retains actual audience/training_type |
| `selectedLibraryFileIds` → outline | **HIGH** | Test that Drive-only source selection reaches `generateOutline` input |
| pg_cron timeout recovery | **MEDIUM** | Test UI error banner after poll timeout |
| Generation job `failed` status | **MEDIUM** | Test error banner when job enters failed state |
| `persistDraftStage` write error | **MEDIUM** | Test `lastWriteError` banner renders |
| Multi-tab storage conflict | **LOW** | Test that cross-tab writes show staleness warning |
| `seedDraftFromModuleVersion` basics | **LOW** | Test that forked version retains real audience/training_type |

---

## J · "Scope for the basics form v2 builder"

The basics form (`ModuleBasicsForm.tsx`) needs one new field for the upcoming `learning_outcomes` integration:

**File:** `src/features/foundry/components/ModuleBasicsForm.tsx`  
**Target:** Add after `estimated_minutes`, before submit button

### Changes required:

1. **`src/features/foundry/types.ts`** — Add to `ModuleBasicsDraft` and `ModuleBasicsFormValues`:
   ```typescript
   learning_outcomes?: string[]  // 1-5 bullet strings, optional
   ```

2. **`src/features/foundry/schemas/foundrySchemas.ts`** — Add to `moduleBasicsSchema`:
   ```typescript
   learning_outcomes: z.array(
     z.string().min(5).max(200)
   ).max(5).optional()
   ```

3. **`src/features/foundry/components/ModuleBasicsForm.tsx`** — Add a dynamic list field (add/remove rows) for learning outcomes. Max 5 items. Optional — not required for form submit.

4. **`src/features/foundry/ai/pageInputDefaults.ts`** — Add `learning_outcomes: []` to `DEFAULT_AI_MODULE_BASICS`.

5. **`src/features/foundry/store/foundryDraftStore.ts`** — Fix the three `hydrateFromDraftMetadata`, `resumeDraftFromAdminItem`, `seedDraftFromModuleVersion` functions to restore `learning_outcomes` from persisted metadata and to NOT hardcode `audience`, `training_type`, `estimated_minutes`.

6. **`src/features/foundry/ai/prompts.ts` → `outline_generation` prompt** — Add `{{learningOutcomes}}` variable to `requiredVariables` and template. Update `generateOutline` server call to include the field.

7. **`supabase/functions/_shared/courseFoundryAiClientServer.ts`** — No change needed (flat JSON dump picks up `learning_outcomes` automatically from `basics`).

**No DB migration needed** for MVP (stored in `draft_metadata` or just passed through `basics` object in the AI call).

---

## K · "Scope for the AI prompt integration builder"

These are the prompt-layer changes needed to make real AI calls production-quality:

### P1 · Fix server-side prompts to match client-side intent (HIGH)
`supabase/functions/_shared/courseFoundryAiClientServer.ts` currently has bare flat-input prompts. The server-side prompts need to be expanded to match the intent in `prompts.ts` — particularly:

- **`outline_generation`**: Extract `basics`, `setupAnswers`, `sourceBlocks` from the input JSON and inject them separately into the prompt template (not just `{{input}}`).
- **`lesson_generation`**: Route to the correct lesson-type prompt based on `lessonOutline.lesson_type`. Add the 9 specialized lesson type prompts to the server registry.
- **`self_critique`**: Include `courseOutline` and `promptIds` in the input payload and prompt template.

### P2 · Fix `realAiClient.ts:344` — lesson type routing (CRITICAL)
```typescript
// Current (wrong):
generateLessons(input): Promise<GenerateLessonsOutput> {
  return submitGenerationJob({ promptKey: 'lesson_generation.text', ... })
}

// Needed: Per-lesson-type job submission or a dispatch prompt key
// Option A: Submit one job per lesson with lesson_type in inputPayload
// Option B: Add a `lesson_generation.dispatch` prompt that handles type routing
```

### P3 · Dual criticality cleanup (MEDIUM)
The `basics.criticality` ('required'/'optional') should be renamed `compliance_level` or similar in the AI input to avoid collision with `setupAnswers.criticality` ('informational'/'basic_knowledge'/'operational'/'compliance_high_risk'). The outline prompt should use the wizard criticality (4-point scale) as the primary signal for content depth.

### P4 · Drive source assembly for real AI (CRITICAL for Drive smoke test)
Before `generateOutline` and `generateLessons`, if `selectedLibraryFileIds.length > 0` and `sourceMaterial === null`:
```typescript
// Fetch sections from Supabase for selected files
const sections = await fetchSectionsForDriveFiles(selectedLibraryFileIds, supabase)
const assembledSource: SourceMaterial = {
  id: `library-${selectedLibraryFileIds.join('-')}`,
  title: 'Drive Library Selection',
  type: 'markdown',
  raw_text: sections.map(s => `## ${s.heading}\n\n${s.body}`).join('\n\n'),
  sections,
  ...
}
// Pass assembledSource instead of DEFAULT_AI_SOURCE_MATERIAL
```

---

## L · "Scope for follow-up slices"

| Slice | Description | Priority |
|-------|-------------|----------|
| Cold-load guards | Add `useEffect` redirect to `/start` on all 7 downstream pages | P0 |
| Side-by-side real mode | Derive `LessonReviewItem[]` from `GeneratedModulePreview.lessons` after `setGeneratedModule` | P0 |
| Drive source assembly | Fetch `source_sections` for `selectedLibraryFileIds` before AI calls | P0 |
| Lesson-type routing | Route `generateLessons` to per-type prompts | P1 |
| Server prompt richness | Match server prompts to client-side template intent | P1 |
| Back-nav state invalidation | `setBasics` to clear downstream state | P1 |
| `lastWriteError` banner | Show save-failure notification when `lastWriteError !== null` | P1 |
| Generation error surface | `.catch()` in all `useMockGenerationDelay` populate callbacks | P1 |
| `hydrateFromDraftMetadata` fix | Restore real `audience`, `training_type`, `estimated_minutes` on resume | P1 |
| `approveOutline` → persist | Call `persistDraftStage` on outline approval | P2 |
| Setup question AI inference | Wire `setup_question_inference` prompt to `FoundryQuestionsPage` | P2 |
| Real lesson source bindings | Show Drive source links in `LessonOutlineList` in real mode | P2 |
| Multi-tab lock | Tab-ID in localStorage or cross-tab conflict warning | P3 |
| `learning_outcomes` form field | Per scope in section J | P1 |

---

## M · Smoke Test Pre-Flight Checklist

Run these before clicking "Start new module" on production.

### 1. Verify remote migrations
```bash
# From repo root, with supabase CLI linked to toghxeuhgkcrbrdxewdw:
supabase db diff --schema redex
# Expected output: empty (no diff)

# If draft_metadata migration not applied:
supabase db push
```

### 2. Verify pg_cron is wired
```sql
-- Run in Supabase SQL Editor:
SELECT jobid, jobname, schedule, command, active
FROM cron.job
WHERE command ILIKE '%generation-worker%';
```
Expected: at least one row with `active = true`. If empty, set it up:
```sql
SELECT cron.schedule(
  'invoke-generation-worker',
  '* * * * *',  -- every minute
  $$
  SELECT net.http_post(
    url := '{SUPABASE_URL}/functions/v1/generation-worker',
    headers := '{"Authorization": "Bearer {SERVICE_ROLE_KEY}", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
```

### 3. Verify function secrets
```bash
supabase secrets list
# Must include: REDEX_ALLOWED_ORIGINS, AI_PROVIDER_API_KEY, AI_PROVIDER, AI_MODEL,
#               GOOGLE_DRIVE_LIBRARY_FOLDER_ID
```

### 4. Verify functions are deployed
```bash
supabase functions list
# Should show: drive-sync, parse-source-file, submit-generation-job, generation-worker
# Check "Updated At" timestamps to confirm recent deploys
```

### 5. Verify `VITE_AI_MODE=real` in production
```bash
# Check .env.production or Netlify env vars:
# VITE_AI_MODE should be 'real'
# VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY should be set
```

### 6. Verify Brian's profile has `foundry_author` or `admin` role
```sql
SELECT id, email, role FROM redex.profiles WHERE email = 'blewis@lewisinsurance.com';
-- Expected: role = 'admin' or 'foundry_author'
```

### 7. Seed test: confirm `_library/` is accessible
```bash
# Trigger drive-sync manually via curl or Supabase dashboard:
# POST {SUPABASE_URL}/functions/v1/drive-sync
# Authorization: Bearer {ANON_KEY or JWT}
# Body: {}
# Expected: {"status":"ok","summary":{"files_seen":N,"files_inserted":M,...}}
```

### 8. Smoke test workaround for Drive→outline gap
**Until P0 Drive source assembly is fixed:** Paste the HR content from `_library/` into the Source Binder paste panel BEFORE continuing to outline. Do not rely on Library selection alone for the AI call.

### 9. Watch for this in the browser console during smoke test
```
# This is a sign pg_cron is down:
"Course Foundry AI generation job {id} did not complete before polling timed out"

# This is a sign AI_PROVIDER_API_KEY is missing:
"AI_PROVIDER_API_KEY is required before anthropic generation can run"

# This is a sign REDEX_ALLOWED_ORIGINS is missing:
{"status":"error","code":"server_misconfigured","message":"Server configuration error"}
```

### 10. Post-smoke-test verification query
```sql
-- Confirm job completed successfully:
SELECT id, status, current_stage, actual_cost_cents, last_error_message
FROM redex.generation_jobs
ORDER BY created_at DESC
LIMIT 5;

-- Confirm draft stage was persisted:
SELECT id, module_title, draft_metadata->>'current_stage' as stage
FROM redex.module_versions
ORDER BY created_at DESC
LIMIT 3;

-- Confirm source sections were parsed:
SELECT sf.title, count(ss.id) as section_count
FROM redex.source_files sf
LEFT JOIN redex.source_file_versions sfv ON sfv.source_file_id = sf.id
LEFT JOIN redex.source_sections ss ON ss.source_file_version_id = sfv.id
GROUP BY sf.title
ORDER BY section_count DESC;
```

---

## Severity Reference

| Label | Meaning |
|-------|---------|
| **CRITICAL** | Will silently fail or produce wrong output during the smoke test |
| **HIGH** | Causes incorrect authoring behaviour; data corruption risk |
| **MEDIUM** | Affects prompt quality or UX; workaround exists |
| **LOW** | Polish / cleanup; no functional impact |

