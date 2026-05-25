# ADR 018 — Phase 3/4 backend governance boundaries (lease/retry, enqueue, profile-first role authority, source binding replacement)

**Status**: Accepted
**Date**: 2026-05-24
**Phase / Slice**: Phase 3 + Phase 4

## Context

Phase 3/4 hardening exposed launch-risk gaps: generation jobs could be inserted from browser paths, running jobs had weak recovery semantics, source bindings accumulated stale rows, and privileged RLS decisions could trust stale JWT role claims over current profile state.

## Decision

We enforce a backend governance boundary with the following decisions:

1. **AI job lease/retry model**: `redex.generation_jobs` uses explicit lease + retry fields (`lease_token`, `locked_at`, `lease_expires_at`, `next_run_at`, `max_attempts`, `last_failure_class`, `worker_id`) and claim semantics that only take queued, ready jobs.
2. **Generation enqueue boundary**: browser `authenticated` role cannot insert/update/delete `redex.generation_jobs`; enqueue is edge/service-role mediated via `submit-generation-job`.
3. **Profile-first RLS role authority**: `redex.current_role()` resolves privileged role checks from `redex.profiles` first and defaults to learner if missing.
4. **Source-binding replacement**: module bindings are replaced transactionally through `redex.replace_module_source_bindings(...)` to prevent stale binding accumulation after regeneration.
5. **Section regeneration safety**: worker flow avoids invalid `source_binding` stage assumptions for section regeneration until output normalization is guaranteed.

## Consequences

- Prevents direct browser fabrication of generation-job state.
- Reduces duplicate/unsafe worker execution with lease-aware claims and bounded retries.
- Aligns authorization with current profile role instead of stale JWT privilege.
- Keeps source-impact fidelity by replacing stale bindings per module scope.
- Requires ongoing RLS smoke checks and edge-function test coverage to avoid regressions.

## References

- Build Bible entry: `docs/redex_education_build_bible.md` (Phase 3/4 hardening entries)
- Related code:
  - `supabase/migrations/20260524190000_phase3_4_backend_hardening.sql`
  - `supabase/functions/generation-worker/index.ts`
  - `supabase/functions/submit-generation-job/index.ts`
  - `supabase/functions/_shared/sourceBindingsWriter.ts`
- Superseded ADRs: none
