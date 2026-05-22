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
| Persisted state | `localStorage.setItem(key, JSON.stringify(value))` before `renderHook` | `EducationContext.test.tsx` hydration tests |
| StrictMode double-mount | Wrap provider with `<StrictMode>` in hook wrapper | `EducationContext.test.tsx` StrictMode safety tests |

## 9) What's tested today

| File | Count | Surface |
|---|---:|---|
| `src/test/smoke.test.ts` | 4 | Infrastructure smoke (arithmetic, DOM globals, jest-dom, storage reset) |
| `src/components/auth/AuthGate.test.tsx` | 5 | All three AuthGate branches + custom fallback + authenticated path |
| `src/contexts/EducationContext.test.tsx` | 12 | Hydration, idempotency, scoping, persistence, StrictMode safety |
| `src/App.routes.test.tsx` | 5 | Root redirect, unknown-module redirect, valid module route, 404, admin wiring |
| `src/features/learner/components/ModulePlayer.test.tsx` | 12 | Empty/fallback, quiz lock logic, sidebar lock/unlock, progress UI, callbacks, a11y |
| `src/features/learner/components/Quiz.test.tsx` | 12 | Threshold boundary, 0-question path, `correct_index` filtering, retake flow, remount reset, keyboard/a11y, callback invariants |

**Total: 50 tests across 6 files.**

## 10) Coverage baseline (Phase 8 — 2026-05-22)

- Statements: **81.02%**
- Branches: **89.96%**
- Functions: **67.92%**
- Lines: **81.02%**

Per-surface highlights:
- `AuthGate.tsx` — 100%
- `Quiz.tsx` — 98.86%
- `EducationContext.tsx` — 96.12%
- `ModulePlayer.tsx` — 92.03%
- `App.tsx` — 88.75%
- all `layout/*` components — 100%

No coverage thresholds are enforced today; this is the baseline from Phase 8 in the [Build Bible](./redex_education_build_bible.md).

## 11) What's NOT tested (and why)

- `LessonContentRenderer.tsx` (12.12%) — covered transitively by ModulePlayer/Quiz tests; no direct suite yet
- `LearnerWelcomePage.tsx` (4.44%) — primarily presentational; currently covered transitively by route tests
- `useAuth.ts` / `use-auth.tsx` / `auth-context.ts` (0%) — covered via AuthGate mock seam; direct provider lifecycle tests deferred
- `src/integrations/supabase/client.ts` (0%) — env-driven boundary; deferred until Supabase reads land
- `src/types/training.ts` (0%) — type declarations only (no runtime execution)

## 12) When to write a new test

1. **Bug fix → regression test always.** Write the test that fails before the fix and passes after.
2. **New component → at least one render test.** Prefer including at least one user interaction.
3. **New hook → at least one `renderHook` test.** Cover the primary use case.

If unsure, choose the boundary most likely to catch a real regression first. For route/provider context, align with patterns in [Architecture](./architecture.md).
