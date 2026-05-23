# ADR 011 — Zustand store pattern

**Status**: Accepted  
**Date**: 2026-05-23  
**Phase / Slice**: Phase 5–8 / Slice 9.2 documentation reconciliation

## Context

Phases 5–8 added feature state beyond `EducationProvider`: Foundry drafts, assignments, audit events, assessment attempts, module versions, published-module registration, and source-change events. The repo had no decision record explaining why those surfaces use Zustand instead of React Context, or where TanStack Query should fit when real Supabase reads arrive.

The pattern is now stable enough to document: feature-local state survives reloads via localStorage today, exposes reset actions for deterministic tests, and sometimes performs intentional cross-store side effects such as assignment actions writing audit events.

## Decision

Use Zustand with `persist` middleware for client-side state that is feature-local, ephemeral, but expected to survive reloads during the mock/local-first phase. React Context remains for cross-cutting provider state (`EducationProvider`, `AuthProvider`). TanStack Query is reserved for Slice 8.3+ when real Supabase reads arrive and server state needs cache/invalidation semantics.

Store persistence keys follow `redex-{feature}-v1`. Every store exposes a reset action for tests. Cross-store side effects are allowed when they represent product behavior, but tests must assert both the source state and the target store effect.

## Consequences

The app has a consistent local-first pattern while Phase 8 replaces mock reads/writes with Supabase. Tests can reset stores without relying on global module state, and persisted round-trip behavior is explicit.

The cost is that localStorage is not the long-term source of truth. Slice 8.4 moves authoritative writes server-side; Slice 12.4 demotes localStorage to offline cache only. Store APIs should therefore remain adapter-friendly rather than hard-coding localStorage assumptions into components.

## References

- Build Bible Slice 9.2: [`../redex_education_build_bible.md`](../redex_education_build_bible.md)
- Store paths: `../../src/features/foundry/store/foundryDraftStore.ts`, `../../src/features/assignments/store/assignmentStore.ts`, `../../src/features/audit/store/auditLogStore.ts`, `../../src/features/progress/store/assessmentAttemptStore.ts`, `../../src/features/publishing/store/moduleVersionsStore.ts`, `../../src/features/publishing/store/publishedModulesStore.ts`, `../../src/features/source-binder/store/sourceChangeEventsStore.ts`
- Architecture context: [`../architecture.md`](../architecture.md)
- Testing patterns: [`../testing.md`](../testing.md)
