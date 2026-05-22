# ADR 009 — Vitest + RTL + jsdom + mock seam patterns

**Status**: Accepted  
**Date**: 2026-05-22  
**Phase / Slice**: Phase 8

## Context

Before Phase 8, the repository had no automated test harness. Remediation phases had fixed high-risk logic in routing, quiz grading, and progress state, but without tests those fixes could regress silently. The platform needed a React 19-compatible test stack, low-friction developer commands, and repeatable mocking boundaries for context-heavy components.

Compatibility constraints mattered: React Testing Library versions prior to 16 are not aligned with React 19, and the environment required jsdom-backed DOM APIs for component and hook tests.

## Decision

The project adopted a Vite-native testing stack:

- `vitest@^3.2.4`
- `@vitest/coverage-v8@^3.2.4`
- `@testing-library/react@^16.3.2`
- `@testing-library/user-event@^14.6.1`
- `@testing-library/jest-dom@^6.9.1`
- `@testing-library/dom@^10.4.1`
- `jsdom@^25.0.1`

Configuration was added to `vite.config.ts` (`jsdom` environment, setup file, coverage reporters/excludes). Shared setup in `src/test/setup.ts` enables jest-dom matchers, explicit RTL cleanup, and storage reset per test. Tests are co-located with sources and follow seam-first mocking:

- `vi.mock('@/hooks/useAuth')` for auth gating/routes
- `vi.mock('@/hooks/useEducation')` for route/provider consumers
- `vi.stubEnv` for `VITE_MOCK_AUTH`

This pattern depends directly on ADR 005’s hook/provider split.

## Consequences

Phase 8 landed 50 passing tests with an objective baseline (~81% statements, ~90% branches) and gave contributors stable workflows (`npm test`, watch mode, coverage). The seam strategy reduces brittle integration setup while still validating critical behavior branches.

The tradeoff is that provider internals and some integration edges remain indirectly covered until future slices justify deeper suites. Still, this decision established durable test scaffolding and made future regression prevention practical.

## References

- Build Bible — Phase 8 entry: [`../redex_education_build_bible.md`](../redex_education_build_bible.md)
- Related code: `../../vite.config.ts`, `../../src/test/setup.ts`, `../../src/components/auth/AuthGate.test.tsx`
- Master roadmap context: [`../2025__redex-education__codex-linear-roadmap-handoff.md`](../2025__redex-education__codex-linear-roadmap-handoff.md)
- Architecture context: [`../architecture.md`](../architecture.md)
- Related ADRs: [ADR 005](./005-hook-provider-split-pattern.md), [ADR 003](./003-typescript-strict-and-no-unchecked-indexed-access.md)
