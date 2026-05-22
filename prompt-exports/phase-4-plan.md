# Phase 4 — Quiz Correctness (Orchestrator Plan)

**Repo:** `/Users/brianlewis/Redex-Education`
**Branch:** `main` (4 commits ahead of origin after Phase 0/1/2/3)
**Prior phases:** Phase 0 hygiene, Phase 1 foundation, Phase 2 routing+AuthGate, Phase 3 state+progress correctness. See `docs/redex_education_build_bible.md` for the latest Phase 3 entry — especially the Phase 3 `recordLessonProgress` idempotency note (your work composes with it).

## Naming guardrails
- **Redex Education** = repo / product
- **Redex Academy** = learner-facing brand
- **Redex AI Course Foundry** = admin creation engine
- **Redex Training OS** = long-term platform vision

## Standing instructions (still apply)
- Do NOT wire real AI, real Supabase data, or real production auth
- Do NOT introduce secrets
- Do NOT overbuild beyond scope
- Maintain TS strict + `noUncheckedIndexedAccess` cleanliness — no `!` or `as` suppression
- Use the `@/lib/education` facade for domain types and demo data
- Quiz lock and content discrimination use `content.type === 'quiz'` (canonical Phase 1 discriminant); `lesson_type` is catalog-only

## Phase 4 goal

Fix every Quiz correctness bug surfaced by the original review, and clear the final `set-state-in-effect` lint error. After Phase 4, lint should be ≤ 5 errors (the 1 Quiz error clears). No learner-flow correctness defects should remain that aren't owned by Phase 7+ (build/security/test infra).

---

## Single Item — Quiz state machine + correctness

**Status:** `- [x]` ✅ COMPLETE (session D034DD49-D899-4331-AAE5-4B34BF1AB32B)

### What landed
- Pass math: raw fraction (`correctCount / total >= PASSING_THRESHOLD / 100`); round only for display
- 0-question handling: **approach (a) — authoring error**. Shows "Quiz unavailable" card + calls `onComplete(0, false)` once via `useRef` guard so progress isn't silently advanced
- Invalid `correct_index` questions filtered via `gradeableQuestions` `useMemo`; if all are invalid, falls into the 0-question path
- Stable composite keys: `${question.id}-${oIndex}-${option}`
- "Re-announce Score" button removed; footer when submitted is just "Retake Quiz"
- Lesson-switch reset effect deleted; `<Quiz key={lesson.id} ... />` in `LessonContentRenderer.tsx` triggers remount instead — structural fix, no suppression
- One strict-TS narrowing on `correct_index` handled via a local `correctIndex` variable
- Lint: 6 → **5 errors** (Quiz lint cleared). Remaining: `_archive/**` (4) + `tailwind.config.ts` (1), both Phase 7.

### Goal
Fix the rounding bug, edge cases, and unstable keys in `src/features/learner/components/Quiz.tsx`. Clear the `react-hooks/set-state-in-effect` lint error structurally (no suppression). Remove the "Re-announce Score" debug button.

### Concrete tasks (do all of these)

1. **Passing-math fix** (real bug — currently a 79.5% score that rounds to 80 passes incorrectly):
   - `handleSubmit` currently does `setScore(Math.round((correctCount / total) * 100))` then `passed = score >= PASSING_THRESHOLD`. The score state is stale — and even using the just-computed value, comparison happens after rounding.
   - Compare the raw fraction: `passed = correctCount / total >= PASSING_THRESHOLD / 100`.
   - Round ONLY for display.
   - Save both `correctCount` and the raw fraction internally if helpful; show the rounded percentage in the UI as today.

2. **0-question quiz handling**:
   - The current empty-questions branch renders a "being prepared" message but never calls `onComplete`. That leaves `ModulePlayer` waiting forever on `quizHasPassed`.
   - Pick one of these approaches and document the choice in the commit message:
     - **(a) Treat empty as authoring error** — render an error card "Quiz has no questions — contact your administrator", call `onComplete?.(0, false)` once (use a `useRef` or `useEffect`-with-dependency-control to avoid spamming), and let `ModulePlayer` show its quiz-lock banner with the unfortunate message.
     - **(b) Auto-pass empty quizzes** — render a neutral card "No knowledge check required for this lesson", call `onComplete?.(100, true)` once, mark the lesson complete via `ModulePlayer`'s callback.
   - **Recommendation: (a)** — empty quizzes are an authoring bug; auto-passing hides it. But the call is yours; pick the cleaner one.
   - The "once" guarantee must not introduce a `set-state-in-effect` lint regression. The cleanest pattern is `useRef<boolean>(false)` plus a single effect that fires once on mount when `questions.length === 0`.

3. **Invalid `correct_index` validation**:
   - For each question in `calculateResults`, treat `correct_index === undefined` or `correct_index < 0` or `correct_index >= options.length` as "ungraded" — that question doesn't count toward the total or toward `correctCount`.
   - If ALL questions are invalid this way, the effective total is 0 — fall through to the 0-question handling from task #2.
   - This protects against authoring bugs in real-world quiz data.

4. **Stable option keys**:
   - Replace `key={oIndex}` on option `<button>` with a composite key. Since `QuizQuestion.options` is `string[]` in the current type (no per-option ID), use `key={\`${question.id}-${oIndex}-${option}\`}` — index + label is enough to avoid the reorder bug without changing the type.
   - **Do NOT extend `QuizQuestion` to add per-option IDs in this phase** — that's a domain-type change that should happen alongside real authoring tooling.

5. **Remove "Re-announce Score" button**:
   - It was a demo/debug action and could re-fire `onComplete` (Phase 3's idempotency now no-ops the duplicate progress write, but the button is still a UX surface that does nothing useful).
   - Remove the JSX block entirely. The footer when `isSubmitted` should then have only `Retake Quiz` as a single action.
   - Adjust grid/spacing if needed so the layout still looks correct with one button.

6. **`set-state-in-effect` lint fix on lesson-switch reset**:
   - The current `useEffect(() => { setAnswers({}); setIsSubmitted(false); setScore(0); setHasPassed(false); }, [lesson.id]);` is the lint-triggering pattern.
   - Refactor approach: **key the entire Quiz component on `lesson.id` from the parent** by adding a wrapper — OR use the React pattern of resetting state via a `key` prop. Easiest: change the `Quiz` export's call site in `LessonContentRenderer.tsx` to `<Quiz key={lesson.id} lesson={lesson} onComplete={onQuizComplete} />`. Then remove the reset effect entirely.
   - The `key` prop forces React to unmount/remount Quiz when `lesson.id` changes — which gives you the same reset behavior with zero state-in-effect ceremony.
   - This is the cleanest fix. Verify `LessonContentRenderer.tsx` is the only call site (it should be) before changing it.

7. **Verification**:
   - `npm run typecheck` — green under existing strict + `noUncheckedIndexedAccess`
   - `npm run build` — green
   - `npm run lint` — **≤ 5 errors** (Quiz's 1 set-state-in-effect should clear; remaining are `_archive/**` ×4 + `tailwind.config.ts` ×1, both Phase 7)
   - Walk through the demo orientation quiz mentally: 4 questions, threshold 80%. Confirm that a score of exactly 3/4 = 75% does NOT pass; 4/4 = 100% passes. (Previous bug: 3 right and 1 wrong on a 4-Q quiz used to fail correctly, but the EDGE case at non-integer percentages was the real risk; with the raw-fraction comparison the edge is exact.)

### Done when
- All six tasks above land.
- `Quiz.tsx` no longer has any `useEffect` that calls `setState` synchronously.
- `LessonContentRenderer.tsx` mounts `<Quiz key={lesson.id} ... />`.
- "Re-announce Score" button is gone.
- Lint count ≤ 5 errors.
- Typecheck + build green.

### Key files
- `src/features/learner/components/Quiz.tsx` — main work
- `src/features/learner/components/LessonContentRenderer.tsx` — add `key={lesson.id}` to `<Quiz>`
- Maybe `src/features/learner/components/ModulePlayer.tsx` — only if the empty-quiz approach requires a callback-contract tweak. Don't restructure ModulePlayer.

### Out of scope
- Brand/theme drift in Quiz (hardcoded `#ED1B24`, `#c41a1e` etc.) → Phase 5
- A11y on Quiz radio buttons → Phase 6
- Test infra → Phase 8
- Per-option ID type extension → future authoring phase
- Anything outside Quiz.tsx / LessonContentRenderer.tsx (besides the optional ModulePlayer callback contract tweak)

---

## Final verification
- `git status --short` — clean (orchestrator will commit)
- `npm run typecheck` — green
- `npm run build` — green
- `npm run lint` — ≤ 5 errors + 0 warnings
- Build Bible NOT updated by sub-agent (orchestrator handles it)
- No commit by sub-agent (orchestrator handles it)
