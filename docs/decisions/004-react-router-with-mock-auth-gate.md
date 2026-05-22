# ADR 004 — React Router with mock-auth gate

**Status**: Accepted  
**Date**: 2026-05-22  
**Phase / Slice**: Phase 2

## Context

Early app structure relied on a single-route experience toggle, which prevented deep-linking, route-level ownership boundaries, and realistic admin/learner separation. The roadmap requires distinct learner and foundry surfaces, and the Build Bible flagged admin protection as a scaffold requirement even before production auth is implemented.

At the same time, onboarding and demos needed low-friction local behavior. Blocking all admin shell work on full authentication would have delayed slice delivery and reduced parallel throughput.

## Decision

The app adopted `react-router-dom` route-table architecture in `src/App.tsx`, with `BrowserRouter` lifted to root composition in `src/main.tsx`. Route intent is explicit:

- `/learn/*` remains open for Redex Academy learner flow demos.
- `/admin` and `/admin/*` are wrapped in `AuthGate`.
- Root redirect and catchall behavior are modeled as first-class routes.

`AuthGate` enforces a three-branch scaffold: mock bypass when `VITE_MOCK_AUTH === 'true'`, loading fallback while session state resolves, and a sign-in-required placeholder when no session exists. This keeps admin shell gating semantics in place now, without claiming production auth UX is complete.

## Consequences

Route-based composition unlocked deep-linking and predictable page ownership, which directly supported later correctness work (unknown module redirects in Phase 3) and route tests in Phase 8. It also clarified naming boundaries: learner-facing Redex Academy paths under `/learn`, foundry/admin shell under `/admin`.

The mock-auth bypass enables local velocity and demonstrations, but it is intentionally a development scaffold. Production sign-in, redirect-back flows, and role-specific authorization remain deferred and must plug into this gate rather than bypass it.

## References

- Build Bible — Phase 2 entry: [`../redex_education_build_bible.md`](../redex_education_build_bible.md)
- Related code: `../../src/main.tsx`, `../../src/App.tsx`, `../../src/components/auth/AuthGate.tsx`
- Master roadmap context: [`../2025__redex-education__codex-linear-roadmap-handoff.md`](../2025__redex-education__codex-linear-roadmap-handoff.md)
- Architecture context: [`../architecture.md`](../architecture.md)
- Related ADRs: [ADR 001](./001-env-driven-supabase-client.md), [ADR 005](./005-hook-provider-split-pattern.md)
