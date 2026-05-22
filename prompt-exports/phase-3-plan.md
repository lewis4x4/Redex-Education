# Phase 3 — State & Progress Correctness (Orchestrator Plan)

**Repo:** `/Users/brianlewis/Redex-Education`
**Branch:** `main` (3 commits ahead of origin after Phase 0/1/2)
**Prior phases:** Phase 0 hygiene, Phase 1 foundation (env + types + TS strict), Phase 2 routing + AuthGate. See `docs/redex_education_build_bible.md` for full record.

## Naming guardrails (do not violate)
- **Redex Education** = repo / product
- **Redex Academy** = learner-facing brand (`/learn/*`)
- **Redex AI Course Foundry** = admin creation engine (`/admin/*`)
- **Redex Training OS** = long-term platform vision

## Standing instructions (still apply)
- Do NOT wire real AI, real Supabase data flows, or real production auth
- Do NOT introduce secrets
- Do NOT overbuild beyond this phase's scope
- Maintain TS strict cleanliness — no `as any`, no suppression
- Use the existing `@/lib/education` facade for all domain types and demo data
- All ProgressStatus / LessonContent narrowing must use `content.type` (the canonical discriminant) — `lesson_type` is the catalog tag, not the runtime gate

## Phase 3 goal

Fix the EducationContext state-machine bugs (hydration race, missing memoization, broken `getProgressSummary(courseId)` scoping, hooks-export lint split) and the ModulePlayer correctness gaps (empty lessons crash, progress overflow, wrong quiz-lock discriminant, sidebar bypass). Then enable `noUncheckedIndexedAccess` and clean up the indexing bugs it surfaces.

Lint target after Phase 3: ≤ **6 errors + 1 warning** (was 13+1 after Phase 2). The 7 errors that should clear are in EducationContext (6) and ModulePlayer (1).

---

## Item 1 — EducationContext correctness + hooks split

**Status:** `- [x]` ✅ COMPLETE (session 51F3E416-E0B1-4C3F-AABB-00DF1184A5B8)

### What landed (Item 2 will need these import paths)
- `useEducation` / `useMyProgress` / `useCurrentEnrollment` moved to `src/hooks/useEducation.ts` (mirrors Phase 2's `useAuth.ts` pattern)
- `EducationContext` + types moved to `src/contexts/education-context.ts`
- `src/contexts/EducationContext.tsx` is now provider-only
- All consumers updated: `App.tsx` (import-only), `LearnerDashboardPage.tsx`
- Hydration uses `useState(() => restoreLessonProgress())` initializer — kills StrictMode wipe
- `recordLessonProgress` idempotent for `completed → completed`
- `getProgressSummary(courseId)` actually scopes by course → modules → lessons
- Provider value memoized
- Lint: 13+1 → **7+0** (target was ≤7)

### Item 2 callouts
- Hook import path: `@/hooks/useEducation`
- `getDemoModule()` returns `DEMO_MODULES[0]` — under `noUncheckedIndexedAccess` this widens to `Module | undefined`. Item 2 must handle that, ideally by removing demo-helper reliance in `LearnerModuleRoute` (which is in scope anyway via the unknown-module fix).

### Goal
Make `EducationContext` robust against StrictMode double-mount, kill the re-render storm from a non-memoized provider value, fix the `getProgressSummary(courseId)` arg silently being ignored, make `recordLessonProgress` idempotent, and split the consumer hooks (`useEducation`, `useMyProgress`, `useCurrentEnrollment`) into a separate file so React Fast Refresh stops complaining.

### Concrete tasks
1. **Hooks split**:
   - Move `useEducation`, `useMyProgress`, `useCurrentEnrollment` out of `src/contexts/EducationContext.tsx` into a new file. Naming convention should match Phase 2's auth split (`src/hooks/useAuth.ts`). Choose either `src/contexts/useEducation.ts` OR `src/hooks/useEducation.ts` — pick the location that matches the rest of the codebase and **document the choice in the commit message**.
   - The context object + Provider stay in `src/contexts/EducationContext.tsx`.
   - Update all consumers (`src/App.tsx`, learner pages, components) to import hooks from the new path. Be exhaustive — `file_search` for `from '@/contexts/EducationContext'` first.
2. **Hydrate in `useState` initializer** (kills StrictMode wipe):
   - Move the localStorage read out of the `useEffect` and into `useState<Record<string, LessonProgress>>(() => { ...read localStorage and return restored state... })`.
   - The subsequent persistence `useEffect` stays, but guard it with a `hydrated` ref or just rely on the initializer for first render — verify no empty-state write fires before restored state.
   - Wrap the JSON.parse in try/catch; on failure return `{}` and `console.warn` once.
3. **`getProgressSummary(courseId)`** — actually use the arg:
   - Resolve `courseId` → list of module IDs for that course → list of lesson IDs for those modules → count completion against that real lesson set.
   - For the demo, courseId === `DEMO_ORIENTATION_COURSE.id` is the only known path, but the resolution must work generically (so when a second course lands, it Just Works).
   - Rename the unused `_courseId` parameter back to `courseId`; this also clears one lint error.
4. **Idempotent `recordLessonProgress`**:
   - If the lesson is already `completed` AND incoming `status === 'completed'`, no-op (do not refresh `completed_at`, do not bump `time_spent_seconds` again, do not trigger a setState).
   - Other transitions still apply normally (e.g. `in_progress` → `completed` is allowed).
   - This protects against Quiz.tsx's "Re-announce Score" button refiring `onComplete` (Phase 4 will remove that button, but idempotency is the right defense in depth).
5. **Memoize the provider value**:
   - Wrap the `value: EducationContextValue` object in `useMemo` with the right dependency list.
   - Each callback should already be `useCallback`-wrapped — verify and fix any that aren't.
6. **Clean up lint errors in EducationContext.tsx**:
   - Unused `e` in catch (likely the persistence `useEffect`'s catch block) — either reference it (`console.warn('persist failed', e)`) or rename to `_` with the eslint-disable removed.
   - Stale `eslint-disable-next-line no-console` (warning) — remove the comment.
7. **Verification**:
   - `npm run typecheck` green.
   - `npm run build` green.
   - `npm run lint` — target ≤ 7 errors (down from 13 after Phase 2; the 6 EducationContext.tsx errors should all clear).

### Done when
- `src/contexts/EducationContext.tsx` contains only the Provider + context definition (no `useEducation`/`useMyProgress`/`useCurrentEnrollment` exports).
- The new hook file exists and is imported by all consumers.
- StrictMode double-mount in dev does not blow away persisted progress (verified by reasoning through the code, not by running the app — running is a Phase 8 testing concern).
- `getProgressSummary` accepts a real `courseId` and uses it.
- `recordLessonProgress` is idempotent for already-completed lessons.
- Provider value is memoized.
- Lint count is ≤ 7 errors.
- Typecheck + build green.

### Out of scope (Item 2 owns these)
- `ModulePlayer.tsx` state machine
- `noUncheckedIndexedAccess` rollout
- `LearnerModuleRoute` unknown-module handling in `App.tsx`
- Quiz state (Phase 4)

---

## Item 2 — ModulePlayer state machine + strict indexing + unknown-module handling

**Status:** `- [x]` ✅ COMPLETE (session 1624BDB5-DAFA-472B-BF14-6FEF2D94D9E4)

### What landed
- `ModulePlayer`: empty-lessons fallback, `Lesson | undefined` guard on `currentLesson`, derived `completedLessons` via `useMemo` (kills the local-state mirror + the lint error structurally), sidebar lock via `firstIncompleteRequiredIndex` + `isLessonNavigable`, quiz lock now uses `content.type === 'quiz'`
- `App.tsx LearnerModuleRoute`: real `education.getModule(moduleId)` + `getLessonsForModule(moduleId)`; unknown module → `<Navigate to="/learn" replace />` (chose redirect for friendliness over 404)
- `tsconfig.app.json`: `noUncheckedIndexedAccess: true` enabled
- Strict-indexing fixes: 1 compiler error (`DEMO_MODULES[0]`) + 2 guarded sites (`lessons[currentIndex]`, `lessons[index]`). Zero `!` or `as` suppressions.
- `src/lib/education/index.ts` scope-nibble: added `requireDemoModules()` helper that returns `[Module, ...Module[]]` (non-empty tuple). Cleaner than null-assertions; documented in commit.
- Lint: 7 → **6 errors** (ModulePlayer cleared). Remaining: `_archive/**` (4) → Phase 7, `Quiz.tsx` (1) → Phase 4, `tailwind.config.ts` (1) → Phase 7.

### Goal
Fix the empty-lessons crash, progress-overflow bug, and quiz-lock discriminant mismatch in ModulePlayer. Block sidebar navigation past the first incomplete required lesson. Replace `LearnerModuleRoute`'s "spread demo module with passthrough id" hack (Phase 2 known gap) with real module lookup + fallback to 404. Enable `noUncheckedIndexedAccess` and fix the indexing errors it surfaces.

### Concrete tasks
1. **`ModulePlayer.tsx` — empty lessons early-return**:
   - If `lessons.length === 0`, render a neutral "No lessons in this module yet" state and short-circuit. Do NOT call `lessons[currentIndex]` afterward.
2. **`ModulePlayer.tsx` — progress overflow**:
   - The `completedLessons` Set should only count IDs that exist in `lessons`. Either filter at intake (in the initializer / sync `useEffect`) or filter at compute time. Intake filter is cleaner.
   - `progress = Math.round((completedLessons.size / lessons.length) * 100)` is unchanged after the intake fix.
3. **`ModulePlayer.tsx` — quiz-lock discriminant**:
   - Replace the `isQuizLesson = currentLesson.lesson_type === 'quiz'` check with `currentLesson.content.type === 'quiz'`. This is the canonical discriminant (Phase 1 type model). `lesson_type` is for catalog/filter UI only.
4. **`ModulePlayer.tsx` — sidebar lock**:
   - The "jump to any lesson" sidebar should refuse to navigate past the first incomplete required lesson. Required = `lesson.criticality === 'required'`. Optional/bonus lessons can be jumped over.
   - Implementation: compute `firstIncompleteRequiredIndex`; in `goToLesson(index)`, refuse and (optionally) show a tooltip/disabled style if `index > firstIncompleteRequiredIndex`.
   - Lessons before the gate are always navigable. The current active lesson and any already-completed lessons stay navigable.
5. **`src/App.tsx` LearnerModuleRoute — unknown module handling**:
   - Currently: `const routeModule = demoModule.id === moduleId ? demoModule : { ...demoModule, id: moduleId }` (spreads mod-001 with bogus id).
   - Replace with real lookup via `education.getModule(moduleId)`. If `undefined`, render NotFoundPage (or `<Navigate to="/learn" replace />` — pick redirect; it's friendlier for the demo).
   - Update lessons lookup similarly: `education.getLessonsForModule(moduleId)` instead of `getDemoLessons()`.
6. **`noUncheckedIndexedAccess` rollout**:
   - Enable in `tsconfig.app.json`. Leave `tsconfig.node.json` alone (it's just vite.config.ts).
   - Run `npm run typecheck`. Expect errors mostly in `ModulePlayer.tsx`, possibly in `Quiz.tsx`, possibly in `EducationContext.tsx`'s `getDemoModule()` returning `DEMO_MODULES[0]` (now `Module | undefined`).
   - Fix each error properly — no `!` non-null assertion suppression, no `as Module` casts. Approaches:
     - `DEMO_MODULES[0]` → `DEMO_MODULES[0] ?? throw new Error('demo data invariant: at least one module')` or change return type to `Module | undefined` and propagate
     - `lessons[currentIndex]` → guard early via the empty-lessons fix from task #1; then either narrow with `if (!currentLesson) return ...` or accept the `| undefined` propagation
   - Document any place you had to widen a return type because of this — these are real signal bugs we wanted to surface.
7. **Lint cleanup in ModulePlayer.tsx**:
   - `react-hooks/set-state-in-effect` on line ~43 — the sync effect that mirrors `completedLessonIds` prop into local state. Refactor: derive `completedLessons` from props instead of mirroring into local state, OR use `useSyncExternalStore` style, OR use `useLayoutEffect` only when truly needed. The simplest fix: derive `completedLessons` as `useMemo(() => new Set(completedLessonIds.filter(id => lessons.some(l => l.id === id))), [completedLessonIds, lessons])`. Drop the local Set state entirely. This also handles task #2 (intake filter).
8. **Verification**:
   - `npm run typecheck` green under `noUncheckedIndexedAccess`.
   - `npm run build` green.
   - `npm run lint` — target ≤ 6 errors. The 1 ModulePlayer error should clear; Quiz's 1 error stays (Phase 4 owns it); the 4 `_archive` and 1 tailwind config errors stay (Phase 7); the resolved Item 1 errors stay resolved.

### Done when
- Empty `lessons` does not crash `ModulePlayer`.
- Progress cannot exceed 100% (foreign IDs filtered out).
- Quiz lock uses `content.type`, not `lesson_type`.
- Sidebar cannot bypass an incomplete required lesson.
- `/learn/player/garbage` redirects to `/learn` (or 404s — your choice; document).
- `tsconfig.app.json` has `noUncheckedIndexedAccess: true`.
- All indexing errors fixed without `!` or `as` suppressions.
- Lint count ≤ 6 errors.
- Typecheck + build green.

### Key files
- `src/contexts/EducationContext.tsx` (light touch — `getDemoModule` may need return-type adjustment for `noUncheckedIndexedAccess`)
- `src/features/learner/components/ModulePlayer.tsx` (main work)
- `src/App.tsx` (LearnerModuleRoute fix only)
- `tsconfig.app.json` (one flag)
- New: possibly nothing — depends on hook split decisions from Item 1

### Out of scope
- `Quiz.tsx` correctness — Phase 4 owns: passing math, 0 questions, stable option keys, Re-announce button removal
- Brand/theme drift (Phase 5)
- A11y polish beyond what's already in TopNav (Phase 6)
- Test infra (Phase 8)

---

## Final verification (after both items)
- `git status --short` — clean
- `git log --oneline -5` — Phase 3 commit on top
- `npm run typecheck` — green (with `noUncheckedIndexedAccess` enabled)
- `npm run build` — green
- `npm run lint` — ≤ 6 errors + 1 warning (down from 13+1 after Phase 2)
- Build Bible updated with a Phase 3 entry

## Commit cadence
- One commit per phase per user instruction. Items 1 and 2 land in the same Phase 3 commit unless they get unwieldy — your judgment.
