# ADR 002 — Domain types as single source of truth

**Status**: Accepted  
**Date**: 2026-05-22  
**Phase / Slice**: Phase 1

## Context

Before Phase 1 remediation, domain modeling was split across multiple files with overlapping intent, including a duplicate type surface in `src/lib/education/training-types.ts` and separate consumer imports from different locations. That fragmentation made changes expensive and error-prone: the same concept could drift across files, and UI consumers could bypass intended boundaries. The roadmap’s structured data model direction (required training types, source binder references, progress records, audit primitives) required one canonical home to prevent schema drift during future slices.

A second constraint was future Supabase integration. Row-level shapes and domain-level shapes are not equivalent, so the codebase needed an explicit boundary where mapping could live without leaking storage concerns into UI components.

## Decision

`src/types/training.ts` was set as the canonical domain source for training entities and lesson typing. The duplicate `src/lib/education/training-types.ts` was removed. A façade boundary was established in `src/lib/education/index.ts` (with data in `src/lib/education/demo-data.ts`) as the single import surface for most app consumers.

In parallel, `src/integrations/supabase/db-rows.ts` was introduced as a row-boundary file that names database row aliases and documents the mapping seam. UI code should not import row types directly. UI consumers should also avoid direct `@/types/training` imports when façade exports are available, keeping the boundary simple and migration-friendly.

## Consequences

This gave the repository one update point when domain shapes evolve, which is essential as roadmap slices add assignments, versioning, source-binder impact, and audit trails. It also keeps row-vs-domain translation explicit, making eventual Supabase reads additive rather than disruptive.

Operationally, it reduced import-path ambiguity and reinforced predictable architecture in code review: domain evolution happens in one canonical file, while integration details remain isolated. This decision is foundational for strict typing (ADR 003), for context/provider contracts (ADR 005), and for test seam stability (ADR 009).

## References

- Build Bible — Phase 1 entry: [`../redex_education_build_bible.md`](../redex_education_build_bible.md)
- Related code: `../../src/types/training.ts`, `../../src/lib/education/index.ts`, `../../src/integrations/supabase/db-rows.ts`
- Master roadmap context: [`../2025__redex-education__codex-linear-roadmap-handoff.md`](../2025__redex-education__codex-linear-roadmap-handoff.md)
- Architecture context: [`../architecture.md`](../architecture.md)
- Related ADRs: [ADR 003](./003-typescript-strict-and-no-unchecked-indexed-access.md), [ADR 005](./005-hook-provider-split-pattern.md)
