# ADR 005 — Hook/provider split pattern

**Status**: Accepted  
**Date**: 2026-05-22  
**Phase / Slice**: Phase 2 + Phase 3

## Context

Auth and education state originally mixed context declaration, provider components, and exported hooks in single files. That structure triggered `react-refresh/only-export-components` lint pressure and made dependency seams harder to test. It also encouraged broad imports that blurred boundaries between runtime composition and consumer APIs.

As Phase 2 and 3 hardened routing/auth/state behavior, the team needed a repeatable pattern that solved both hot-reload hygiene and test seam clarity without adding framework overhead.

## Decision

The codebase standardized a three-file split per context domain:

1. `<x>-context.ts` for `createContext` and typed contract.
2. `<X>Context.tsx` for provider implementation only.
3. `use<X>.ts` for public hooks and derived helpers.

This was first applied to auth (`src/hooks/auth-context.ts`, `src/hooks/use-auth.tsx`, `src/hooks/useAuth.ts`) and then mirrored for education (`src/contexts/education-context.ts`, `src/contexts/EducationContext.tsx`, `src/hooks/useEducation.ts`).

The rule is architectural, not stylistic: providers own lifecycle and side effects; hooks are consumer seams; context declarations stay neutral and import-light.

## Consequences

This split eliminated refresh-related lint conflicts and made module responsibilities much easier to reason about. More importantly, it created stable mock seams for tests: suites can mock `useAuth` or `useEducation` directly without standing up full provider internals for every route/component case.

That direct seam is a prerequisite for the test strategy finalized in Phase 8 (ADR 009), where route and gate tests rely on targeted hook mocks and env stubs. The cost is a small increase in file count, but the payoff is lower coupling, cleaner imports, and clearer ownership boundaries across runtime and tests.

## References

- Build Bible — Phase 2 and Phase 3 entries: [`../redex_education_build_bible.md`](../redex_education_build_bible.md)
- Related code: `../../src/hooks/useAuth.ts`, `../../src/hooks/useEducation.ts`, `../../src/contexts/EducationContext.tsx`
- Master roadmap context: [`../2025__redex-education__codex-linear-roadmap-handoff.md`](../2025__redex-education__codex-linear-roadmap-handoff.md)
- Architecture context: [`../architecture.md`](../architecture.md)
- Related ADRs: [ADR 004](./004-react-router-with-mock-auth-gate.md), [ADR 009](./009-vitest-rtl-jsdom-mock-seams.md)
