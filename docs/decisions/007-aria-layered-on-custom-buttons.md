# ADR 007 — ARIA layered on custom buttons

**Status**: Accepted  
**Date**: 2026-05-22  
**Phase / Slice**: Phase 6

## Context

Quiz answer controls used custom-styled `<button>` elements for visual consistency with the Redex UI system. Phase 6 required stronger accessibility semantics and keyboard behavior. Two approaches were considered: move to native radio inputs, or preserve custom visuals and layer complete ARIA behavior on top.

The key constraint was avoiding visual regression during remediation while still making screen-reader and keyboard interaction materially better. The Build Bible documented this as a deliberate choice point.

## Decision

The project kept custom button rendering and implemented ARIA-complete radio semantics:

- `role="radiogroup"` for each question container.
- `role="radio"` and `aria-checked` for each option control.
- `aria-disabled` behavior after submit.
- Keyboard navigation via Arrow keys plus Home/End movement between options.
- Additional SR-only explanation text where sidebar lesson controls are intentionally locked.

Implementation lived primarily in `src/features/learner/components/Quiz.tsx`, with related lock semantics in `src/features/learner/components/ModulePlayer.tsx`.

## Consequences

This preserved visual design while significantly improving assistive semantics and keyboard usability. It also kept scope aligned with remediation goals by avoiding a larger markup migration in the same phase.

Tradeoff: native input behavior still offers some built-in semantics and browser handling that custom controls must keep emulating. If future accessibility audits require native radios, that migration remains possible as a focused follow-up rather than a broad redesign.

This decision also pairs with ADR 006 (token consistency) and ADR 009 (tests that assert accessibility behavior through stable seams).

## References

- Build Bible — Phase 6 entry: [`../redex_education_build_bible.md`](../redex_education_build_bible.md)
- Related code: `../../src/features/learner/components/Quiz.tsx`, `../../src/features/learner/components/ModulePlayer.tsx`, `../../src/components/layout/BreadcrumbBar.tsx`
- Master roadmap context: [`../2025__redex-education__codex-linear-roadmap-handoff.md`](../2025__redex-education__codex-linear-roadmap-handoff.md)
- Architecture context: [`../architecture.md`](../architecture.md)
- Related ADRs: [ADR 006](./006-redex-brand-token-system.md), [ADR 009](./009-vitest-rtl-jsdom-mock-seams.md)
