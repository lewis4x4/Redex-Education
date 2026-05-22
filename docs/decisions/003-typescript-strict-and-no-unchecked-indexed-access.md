# ADR 003 — TypeScript strict + noUncheckedIndexedAccess

**Status**: Accepted  
**Date**: 2026-05-22  
**Phase / Slice**: Phase 1 + Phase 3

## Context

The remediation baseline included unsafe typing patterns (`any`, unchecked indexed access, and implicit undefined paths) that allowed runtime defects to slip through. Phase 1 could safely enable `strict: true` immediately, but turning on `noUncheckedIndexedAccess` at the same time would have mixed foundational work with behavior fixes in learner flows. Build Bible evidence showed known indexing hazards in `ModulePlayer` and quiz-related logic that were already planned for Phase 3 state-correctness work.

The key constraint was reviewability: keep phase diffs atomic and understandable while still converging on stronger guarantees quickly.

## Decision

The project enabled `strict: true` in Phase 1 across app and node TS configs, then enabled `noUncheckedIndexedAccess: true` in Phase 3 after state machine and route correctness fixes were in place. This sequence preserved momentum while avoiding noisy transitional casts.

Code policy under this decision: indexed access is treated as `T | undefined` and must be narrowed explicitly via guards (`if (!item) return`, fallback rendering, or verified invariants). Non-null assertion shortcuts (`!`) and cargo-cult casts are disallowed as primary escape hatches. Where a true invariant exists, it should be expressed at a boundary (for example, tuple-style non-empty guarantees) rather than repeated ad hoc at every call site.

## Consequences

The outcome is stronger compile-time detection for edge cases like empty arrays, unknown module IDs, and optional branch paths. This directly reduced crash risk in learner runtime surfaces and made intent clearer in reviews.

It also improved testability: stricter types produce more deterministic branch behavior, which made Phase 8 test coverage easier to align with real risk areas. The downside is additional guard code and occasional verbosity, but the tradeoff is favorable for a training platform where silent undefined behavior is costly.

## References

- Build Bible — Phase 1 and Phase 3 entries: [`../redex_education_build_bible.md`](../redex_education_build_bible.md)
- Related code: `../../tsconfig.app.json`, `../../src/features/learner/components/ModulePlayer.tsx`, `../../src/lib/education/index.ts`
- Master roadmap context: [`../2025__redex-education__codex-linear-roadmap-handoff.md`](../2025__redex-education__codex-linear-roadmap-handoff.md)
- Architecture context: [`../architecture.md`](../architecture.md)
- Related ADRs: [ADR 002](./002-domain-types-single-source-of-truth.md), [ADR 009](./009-vitest-rtl-jsdom-mock-seams.md)
