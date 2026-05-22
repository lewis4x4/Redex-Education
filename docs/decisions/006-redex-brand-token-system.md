# ADR 006 — Redex brand token system

**Status**: Accepted  
**Date**: 2026-05-22  
**Phase / Slice**: Phase 5

## Context

By Phase 5, multiple red hues were being used interchangeably for what should have been one Redex brand color. The Build Bible captured six variants in active UI surfaces, legacy aliases, and inconsistent hover/active states. Additional issues included undefined semantic tokens (`--success`, `--warning`) referenced by Tailwind config and a broad heading-color rule that risked white-on-white rendering in light cards.

Without token unification, each UI edit risked further drift and made brand QA expensive.

## Decision

The design system was normalized around canonical Redex tokens in `src/index.css` using HSL values for utility compatibility and opacity modifiers:

- `--redex-red: 357 85% 52%` (`#ED1B24`)
- `--redex-red-hover: 357 81% 43%` (`#C8141B`)
- `--redex-red-active: 357 83% 35%` (`#A30F15`)
- `--redex-black`, `--redex-offwhite`

Tailwind aliases were namespaced under `redex.*` in `tailwind.config.ts`. Legacy alias support (`--brand`) remained compatible during migration, while component usage moved to explicit `redex` tokens/classes. The global heading white override was removed, missing semantic status tokens were defined, and the favicon was updated to brand-correct red.

## Consequences

Brand consistency became enforceable and reviewable: changes now reference stable tokens instead of ad hoc hex values. This improves visual cohesion across Redex Academy learner views and admin shell surfaces without conflating naming boundaries.

The decision also reduced maintenance cost: one token adjustment can propagate safely site-wide. The hard rule is now clear—no raw hex for Redex red in component styling paths. Where semantic colors are not brand colors (for example pass/fail states), separate status token policy applies.

## References

- Build Bible — Phase 5 entry: [`../redex_education_build_bible.md`](../redex_education_build_bible.md)
- Related code: `../../src/index.css`, `../../tailwind.config.ts`, `../../src/components/auth/AuthGate.tsx`
- Master roadmap context: [`../2025__redex-education__codex-linear-roadmap-handoff.md`](../2025__redex-education__codex-linear-roadmap-handoff.md)
- Architecture context: [`../architecture.md`](../architecture.md)
- Related ADRs: [ADR 007](./007-aria-layered-on-custom-buttons.md), [ADR 008](./008-netlify-security-headers-and-vendor-chunks.md)
