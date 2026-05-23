# Testing guide

This project uses Vitest + React Testing Library for component and hook tests in Redex Education. For broader contributor workflow, see [Contributing](../CONTRIBUTING.md). For current phase-by-phase evidence, see the [Build Bible](./redex_education_build_bible.md).

## 1) What's installed

| Package | Version | Reason |
|---|---|---|
| `vitest` | `^3.2.4` | Vite-native test runner |
| `@vitest/coverage-v8` | `^3.2.4` | V8 coverage provider |
| `@testing-library/react` | `^16.3.2` | React 19 requires RTL 16+; 15 won't work |
| `@testing-library/user-event` | `^14.6.1` | Realistic user interactions; preferred over `fireEvent` |
| `@testing-library/jest-dom` | `^6.9.1` | Custom matchers (`toBeDisabled`, `toHaveAccessibleName`, etc.) |
| `@testing-library/dom` | `^10.4.1` | Required peer for RTL 16 |
| `jsdom` | `^25.0.1` | DOM environment for Vitest |

## 2) Running tests

| Script | What it does |
|---|---|
| `npm test` | Single CI-friendly run |
| `npm run test:watch` | Watch mode (re-run on save) |
| `npm run test:coverage` | Run + emit V8 coverage report (text + html + json-summary) |

Coverage HTML output is at `coverage/index.html`.

## 3) File conventions

- Tests are co-located with source files: `Foo.tsx` → `Foo.test.tsx`
- Shared test infrastructure lives in `src/test/`:
  - `setup.ts` (runs before every test file)
  - `smoke.test.ts` (infrastructure sanity checks)

## 4) The setup file (`src/test/setup.ts`)

`src/test/setup.ts` does three core things:

1. `import '@testing-library/jest-dom/vitest'` to extend Vitest assertions with jest-dom matchers.
2. `afterEach(() => cleanup())` so RTL cleanup runs after every test.
3. `beforeEach(() => { localStorage.clear(); sessionStorage.clear(); })` so hydration-oriented tests start clean.

It also includes a defensive `ensureStorageApi('localStorage' | 'sessionStorage')` shim. If jsdom provides malformed Storage stubs (missing methods like `clear` or invalid `length`), setup installs an in-memory replacement before each test.

## 5) Coverage config

From `vite.config.ts` (`test.coverage.exclude`):

- `node_modules/**` — never test dependencies
- `dist/**` — built output
- `_archive/**` — quarantined legacy code
- `src/main.tsx` — app entry wiring only
- `src/**/*.d.ts` — type-only declarations
- `src/integrations/supabase/types.ts` — generated types
- `src/integrations/supabase/db-rows.ts` — row alias boundary (covered when mappers land)
- `src/lib/education/demo-data.ts` — static seed data
- `**/*.test.{ts,tsx}` — test files themselves
- `**/test/**` — shared test helpers/infrastructure
- `src/env.d.ts` — Vite env augmentation
- `vite.config.ts` — tool config file

## 6) Component test pattern

Reference file: `src/features/learner/components/Quiz.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Quiz } from './Quiz'

it('keeps submit disabled until all questions are answered', async () => {
  const user = userEvent.setup()
  render(<Quiz lesson={lesson} />)

  const submit = screen.getByRole('button', { name: 'Submit Quiz' })
  expect(submit).toBeDisabled()

  await user.click(screen.getByRole('radio', { name: 'Q1-A' }))
  await user.click(screen.getByRole('radio', { name: 'Q2-B' }))
  expect(submit).toBeDisabled()

  await user.click(screen.getByRole('radio', { name: 'Q3-C' }))
  expect(submit).toBeEnabled()
})
```

Patterns used in that suite:
- `userEvent.setup()` at test start
- semantic queries (`getByRole`, accessible names)
- `await user.click(...)` interactions
- jest-dom assertions (`toBeDisabled`, `toBeInTheDocument`, `toHaveAccessibleName` used throughout file)

## 7) Hook test pattern

Reference file: `src/contexts/EducationContext.test.tsx`

```tsx
import { renderHook, act } from '@testing-library/react'
import { EducationProvider } from '@/contexts/EducationContext'
import { useEducation } from '@/hooks/useEducation'

function wrapper({ children }: { children: React.ReactNode }) {
  return <EducationProvider>{children}</EducationProvider>
}

it('updates state when moving from in_progress to completed', () => {
  const { result } = renderHook(() => useEducation(), { wrapper })

  act(() => {
    result.current.recordLessonProgress('L1', 'in_progress', 30)
  })

  act(() => {
    result.current.recordLessonProgress('L1', 'completed', 60)
  })

  expect(result.current.getLessonStatus('L1')).toBe('completed')
})
```

## 8) Mock seams catalog

| Seam | How to mock | Used in |
|---|---|---|
| `useAuth()` hook | `vi.mock('@/hooks/useAuth')` + `vi.mocked(useAuth).mockReturnValue(...)` | `AuthGate.test.tsx`, `App.routes.test.tsx` |
| `useEducation()` hook | `vi.mock('@/hooks/useEducation', () => ({ useEducation: () => ({ ... }) }))` (or `vi.fn()` return mocks) | `App.routes.test.tsx` |
| `VITE_MOCK_AUTH` env | `vi.stubEnv('VITE_MOCK_AUTH', 'true' \| 'false')` + `vi.unstubAllEnvs()` | `AuthGate.test.tsx`, `App.routes.test.tsx` |
| Module-top-level env reads | `vi.stubEnv(...)` + `vi.resetModules()` before dynamic import | `src/integrations/supabase/client.test.ts` |
| Persisted provider state | `localStorage.setItem(key, JSON.stringify(value))` before `renderHook` | `EducationContext.test.tsx` hydration tests |
| Zustand store reset | `beforeEach(() => useFoundryDraftStore.getState().reset())` or the store-specific reset action (`resetAssignments`, `resetEvents`, etc.) | Every Zustand store with a reset action |
| Zustand persist round trip | Write to store, reload the module with `vi.resetModules()`, then verify restored state from the `redex-*-v1` key | Store persistence tests under `src/features/**/store/*.test.ts` |
| Cross-store side effects | Trigger the source store action and assert both the source state and target store state | `assignmentStore.createAssignment` writes to `auditLogStore` |
| Fake generation timers | `vi.useFakeTimers()` + `vi.advanceTimersByTime(...)` | `src/features/foundry/lib/useMockGenerationDelay.test.ts` |
| StrictMode double-mount | Wrap provider with `<StrictMode>` in hook wrapper | `EducationContext.test.tsx` StrictMode safety tests |

## 9) What's tested today

Current AI Slice C baseline: **615 passing, 0 skipped Vitest tests, 2 skipped Deno-only test files under Vitest, 108 test files**. Server AI provider tests also run under Deno (`deno test --allow-env --allow-net=esm.sh supabase/functions/_shared/courseFoundryAiClientServer.test.ts`) with mocked `fetch`; no real AI provider is invoked. Test files are co-located under `src/**/*.test.ts`, `src/**/*.test.tsx`, and `supabase/functions/**/*.test.ts`; the authoritative per-slice count lives in the latest completed-work entry in the [Build Bible](./redex_education_build_bible.md).

This guide intentionally avoids a per-file inventory table because that table drifted as Phases 5–8 expanded the suite. For area discovery, use the repo tree: learner, foundry, assignments, manager, publishing, source-binder, audit, auth/layout, Supabase client, and Supabase function parser tests all have active coverage.

## 10) Coverage baseline (stale — re-measure required)

<!-- TODO: re-run coverage and update; see Slice 9.2 close-out -->

The old Phase 8 remediation baseline (81.02% statements / 89.96% branches / 67.92% functions / 81.02% lines) is stale because the suite has grown from 50 tests across 6 files to 426 passing tests across 86 files. No coverage threshold is enforced today. Re-measure coverage against the current suite at the next phase close-out and record the result in the [Build Bible](./redex_education_build_bible.md).

## 11) v2 testing additions (forthcoming)

These categories are introduced by the v2 roadmap and are not yet in the current scope:

- **Eval harness in CI** — AI Slice D adds prompt/grounding evals that block regressions in source grounding and refusal correctness.
- **Coach guardrail tests** — Slice 13.2 covers source-grounded Redex Coach behavior, citation requirements, and off-source refusal behavior.
- **Item-bank attempt tests** — Slice 11.2 adds the unified competency-tagged item bank and item-attempt records.
- **Assessment-attempt cross-surface tests** — item bank → video checkpoint / quiz / spaced booster flows must prove attempts share the same retrieval and competency semantics.

## 12) What's NOT tested (and why)

- Current direct coverage gaps should be re-audited after the next coverage run; the old file-by-file percentages are stale.
- `src/integrations/supabase/types.ts` remains generated from the wrong project and is excluded from coverage; Slice 8.5 regenerates it before typed Supabase queries are trusted.
- Real Supabase read/write integration tests are deferred until Slices 8.3–8.6 wire production-shaped data and role policies.

## 13) When to write a new test

1. **Bug fix → regression test always.** Write the test that fails before the fix and passes after.
2. **New component → at least one render test.** Prefer including at least one user interaction.
3. **New hook/store → at least one `renderHook` or store action test.** Cover the primary use case plus reset/persistence if state survives reload.

If unsure, choose the boundary most likely to catch a real regression first. For route/provider context, align with patterns in [Architecture](./architecture.md).
