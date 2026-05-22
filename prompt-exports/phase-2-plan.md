# Phase 2 — Routing & Auth Skeleton (Orchestrator Plan)

**Repo:** `/Users/brianlewis/Redex-Education`
**Branch:** `main` (2 commits ahead of origin)
**Prior phase:** Phase 1 — Foundation (env-driven Supabase, type consolidation, TS strict, deps). See `docs/redex_education_build_bible.md` for the full record of decisions made.

## Naming guardrails (do not violate)
- **Redex Education** = repo / product
- **Redex Academy** = learner-facing brand (`/learn/*`)
- **Redex AI Course Foundry** = admin creation engine (`/admin/*`)
- **Redex Training OS** = long-term platform vision

## Standing instructions (still apply)
- Do NOT wire real AI, real Supabase data flows, or real production auth
- Do NOT introduce secrets
- Do NOT overbuild beyond this phase's scope
- Update the Build Bible after completion (`docs/redex_education_build_bible.md`)
- Maintain TS strict cleanliness — no `as any`, no suppression
- Use bun/npm as configured (project uses npm + package-lock.json)

## Phase 2 goal

Replace the current single-`/` route + in-memory `experience` toggle with a real React Router structure, plus a scaffold auth gate that respects a mock-mode bypass. Deep linking, refresh, and back/forward navigation must all work.

---

## Item 1 — Auth hardening + AuthGate scaffold

**Status:** `- [x]` ✅ COMPLETE (session D9521073-9326-4C36-AD04-4F643E14051F)

### What landed (for Item 2's reference)
- `useAuth` hook moved to `src/hooks/useAuth.ts` — import via `@/hooks/useAuth`
- Auth context + types moved to `src/hooks/auth-context.ts`
- `src/hooks/use-auth.tsx` is now provider-only (kills `react-refresh/only-export-components`)
- Provider hardened: `createContext<… | undefined>(undefined)`, cancellation guard, `getSession` error warning, memoized value
- `AuthGate` is default-exported from `src/components/auth/AuthGate.tsx` — import via `@/components/auth/AuthGate`
- Mock bypass via `import.meta.env.VITE_MOCK_AUTH === 'true'` (typed in `src/env.d.ts`, documented in `.env.example`)
- Lint baseline: 14 errors + 1 warning (was 15+1 in Phase 1)

### Item 2 callouts from Item 1's agent
- `AuthProvider` still imports `supabase/client`, which fails loud in dev when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing — Phase 1 behavior, intentional. Mock mode bypasses gate checks, NOT the env requirement.

### Goal
Fix the four issues in `src/hooks/use-auth.tsx` flagged by review + lint, and introduce a scaffold `AuthGate` component that can be wrapped around protected routes. NO real production auth wiring. The gate should pass through in mock mode so the demo flow keeps working.

### Concrete tasks
1. **Split the hook from the provider** to fix the `react-refresh/only-export-components` lint error.
   - Move `useAuth` hook out of `src/hooks/use-auth.tsx` into its own file (e.g. `src/hooks/useAuth.ts`).
   - `use-auth.tsx` (or rename to `AuthProvider.tsx`) keeps only the provider + context.
   - Decide naming based on existing conventions in `src/hooks/`. Pick one — be consistent.
   - All importers should be updated.
2. **Harden the provider**:
   - `createContext<AuthContextType | undefined>(undefined)` — kill the always-truthy default.
   - Add a cancellation flag (`isMounted` ref or local `let cancelled = false`) so the initial `supabase.auth.getSession()` promise can't `setState` after unmount.
   - Wrap the provider `value` in `useMemo([user, session, loading])` so consumers don't re-render on every provider render.
   - Handle the `error` return from `getSession` (currently silently ignored). Log via `console.warn` is fine for now.
3. **`AuthGate` component** at `src/components/auth/AuthGate.tsx`:
   - Props: `children: ReactNode`, optional `fallback?: ReactNode` (default: tiny "Authenticating…" placeholder).
   - Reads `useAuth()`.
   - **Mock-mode bypass**: if `import.meta.env.VITE_MOCK_AUTH === 'true'`, render children unconditionally (skip auth check). This is the explicit boundary so we can develop without a real Supabase user.
   - If `loading`, render `fallback`.
   - If no session and not mock, render a placeholder "Sign-in required" view (just a centered message + brand-styled card — no real login flow yet). Item 2's router will wrap admin routes with this.
   - **Do NOT redirect** — the gate is a wrapper, not a router. Composition over coupling.
4. **Env var registration**:
   - Append `VITE_MOCK_AUTH` to `.env.example` with a comment explaining what it does (default `true` for now so contributors aren't blocked).
   - Augment `src/env.d.ts` so `import.meta.env.VITE_MOCK_AUTH` is typed (`readonly VITE_MOCK_AUTH?: 'true' | 'false'`).
5. **Decide if the AuthProvider needs `useMemo` carved out into a separate variable** to keep lint happy — `react-hooks/exhaustive-deps` may flag the value object.

### Done when
- `src/hooks/use-auth.tsx` lint error (`react-refresh/only-export-components`) is gone — verified by `npm run lint` showing 14 errors total (was 15) with the line about `useAuth` no longer appearing.
- `npm run typecheck` is green.
- `npm run build` is green.
- `AuthGate` exists at `src/components/auth/AuthGate.tsx`, exports a default React component, and works in mock mode (verifiable by import path resolving cleanly via typecheck).
- All existing `import { ..., useAuth } from '@/hooks/use-auth'` continue to work (you may either keep a re-export from the old file, or update all importers — both are fine; document choice in the commit message).
- `.env.example` documents `VITE_MOCK_AUTH`.
- `src/env.d.ts` augments the new var.

### Key files
- `src/hooks/use-auth.tsx` (modify / split)
- New: `src/hooks/useAuth.ts` (or chosen name)
- New: `src/components/auth/AuthGate.tsx`
- `.env.example` (append)
- `src/env.d.ts` (augment)
- `src/integrations/supabase/client.ts` (read for context, do not modify)

### Out of scope (Item 2 will do these)
- Anything in `src/App.tsx`, `src/main.tsx`, routes, `TopNav`, or `AppShell`
- Wrapping any route with `AuthGate` — Item 2 wires it where needed

---

## Item 2 — Router foundation + routes + nav

**Status:** `- [x]` ✅ COMPLETE (session 83C894B4-09FC-4244-A63E-961E077E4F03)

### What landed
- `BrowserRouter` now in `src/main.tsx`, wraps providers
- `src/App.tsx` is router-driven; in-memory experience toggle gone
- Routes: `/` → redirect `/learn`; `/learn`, `/learn/welcome`, `/learn/player[/:moduleId]`, `/admin`, `/admin/*` (AuthGate wrapped), `*` → NotFoundPage
- `TopNav` uses `useNavigate` + `useLocation`; accessibility attrs landed (`aria-label`, `aria-pressed`, `type="button"`)
- New: `src/components/layout/NotFoundPage.tsx`, `src/features/admin/pages/AdminPlaceholderPage.tsx`
- Bonus: agent removed unused `buttonVariants` export from `src/components/ui/button.tsx` (no consumers — `_archive/` has its own copy) — early Phase 6 free fix
- Lint: 13 errors + 1 warning (was 14+1 after Item 1; 15+1 in Phase 1)

### Goal
Replace `src/App.tsx`'s in-memory `experience` toggle and local-state learner flow with real React Router routes. Deep linking to `/learn`, `/admin`, and learner sub-paths must work; refresh must preserve location; `TopNav` must navigate via router rather than mutating local state.

### Concrete tasks
1. **Move `<BrowserRouter>` from `App.tsx` to `src/main.tsx`** — wrap providers OR wrap `<App />`. Put it outside providers if any provider might use router hooks; otherwise inside is fine. Pick the safe choice (outside providers).
2. **Route structure in `App.tsx`**:
   - `/` → redirect to `/learn`
   - `/learn` → `LearnerWelcomePage` (first-run) OR `LearnerDashboardPage` (returning) — pick the simpler version: just `LearnerDashboardPage` and keep welcome as a separate `/learn/welcome` route OR keep the existing demo behavior of welcome-first via a flag. Use the simpler structure; do not preserve the in-memory "has visited" toggle.
   - `/learn/welcome` → `LearnerWelcomePage`
   - `/learn/player/:moduleId` → `ModulePlayer` (read `moduleId` via `useParams`; for the demo, default to `mod-001` if not present)
   - `/admin` → placeholder admin shell (just a card saying "Redex AI Course Foundry — coming soon"); wrap with `<AuthGate>`
   - `*` → 404 component (centered card, "Page not found", link back to `/learn`)
3. **`TopNav` overhaul**:
   - Replace the `experience` / `setExperience` props with `useNavigate()` + `useLocation()`.
   - "Learner" button navigates to `/learn`; active state derived from `location.pathname.startsWith('/learn')`.
   - "Admin" button navigates to `/admin`; active when `location.pathname.startsWith('/admin')`.
   - Remove the prop-drilling through `AppShell`.
   - **Accessibility hits to land here** (cheap to do while editing): `aria-pressed`, `aria-label` on the `<nav>`, `type="button"` on all buttons.
4. **`AppShell` simplification**:
   - Remove the experience prop signature.
   - Keep `playerMode` if it's still needed for chrome adjustment; otherwise simplify.
5. **`App.tsx` becomes a router host**:
   - No more local state for the learner flow.
   - Just routes inside `<Routes>`.
   - Progress callback (`onProgressUpdate`) wiring from ModulePlayer → EducationContext should continue to work — verify by walking the demo flow.
6. **Education Progress Context should still hydrate** correctly across route changes (it's at the app root via providers in `main.tsx` — should be unaffected, just verify).
7. **Smoke checks (manual, optional)**:
   - Hit `/`, `/learn`, `/learn/welcome`, `/learn/player/mod-001`, `/admin`, `/garbage`
   - Hard refresh on any of them should land on the right view
   - Browser back/forward should work

### Done when
- `npm run typecheck` is green
- `npm run build` is green
- `npm run lint` shows fewer errors than the 14-after-Item-1 baseline (the in-memory toggle code is gone, so any related warnings clear too)
- `App.tsx` contains no `useState<'learner' | 'admin'>` (or similar) — only routes
- `src/main.tsx` hosts `<BrowserRouter>`
- A new admin route exists, gated by `AuthGate`, and shows a placeholder card
- `/garbage` (any unknown path) shows the 404
- `TopNav` no longer accepts an `experience` prop

### Key files
- `src/main.tsx` (modify — add `BrowserRouter`)
- `src/App.tsx` (major restructure)
- `src/components/layout/TopNav.tsx` (major)
- `src/components/layout/AppShell.tsx` (modify — drop experience prop)
- `src/components/layout/BreadcrumbBar.tsx` (light touch if needed)
- New: `src/features/admin/pages/AdminPlaceholderPage.tsx` (or similar — small)
- New: `src/components/layout/NotFoundPage.tsx` (small)
- Learner pages (light touch — they may need to accept route params or read them via `useParams`)

### Out of scope
- Real admin functionality
- Wiring real Supabase user reads to `AuthGate`
- Any work on Quiz / ModulePlayer state machines (Phase 3 & 4 own those)
- Theme / brand drift (Phase 5)
- Markdown rendering (Phase 6)

---

## Final verification (after both items land)
- `git status --short` — clean working tree
- `git log --oneline -5` — Phase 2 commit on top
- `npm run typecheck` — green
- `npm run build` — green
- `npm run lint` — error count strictly lower than the 15-from-Phase-1 baseline
- Build Bible updated with a Phase 2 entry capturing: what shipped, files touched, verification results, known gaps, naming guardrails honored, next-phase readiness

## Commit cadence
- One commit per phase (per user instruction) — Items 1 and 2 land in the same Phase 2 commit, **OR** split into two commits if they ended up large/risky, **but the phase summary in the Build Bible remains one entry**. Use your judgment; prefer single commit unless review-burden demands split.
