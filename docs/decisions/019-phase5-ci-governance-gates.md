# ADR 019 — Phase 5 CI governance gates (prod guard + edge coverage + RLS smoke harness)

**Status**: Accepted
**Date**: 2026-05-24
**Phase / Slice**: Phase 5

## Context

Pre-hardening CI could pass without proving key launch protections: production mock-auth guard behavior, full edge-function check/test coverage for Phase 3/4 touched paths, and a repeatable RLS smoke workflow.

## Decision

Phase 5 CI governance includes:

1. **Production guard negative path gate**: CI verifies `NETLIFY=true VITE_MOCK_AUTH=true npm run build` fails.
2. **Safe positive build path gate**: CI runs a production-like build with dummy public Supabase env (`example.invalid`, dummy anon key) and required real-mode flags (`VITE_DATA_SOURCE=supabase`, `VITE_AI_MODE=real`, `VITE_MOCK_AUTH=false`).
3. **Expanded Deno checks/tests**: CI covers `_shared/courseFoundryAiClientServer`, `_shared/sourceBindingsWriter`, `generation-worker`, `submit-generation-job`, and `drive-sync`.
4. **RLS/policy smoke harness**: add `npm run rls:smoke` plus `supabase/tests/rls_smoke.sql` so CI can enforce governance intent while live releases can run the same SQL with `supabase db query --linked --file supabase/tests/rls_smoke.sql`.

## Consequences

- CI failure now signals meaningful governance drift, not just lint/type drift.
- Production build guard behavior is continuously tested in both fail and pass modes.
- Edge-function reliability coverage is broader for the Phase 3/4 critical path.
- RLS live execution remains an operator step but is standardized with a single plain-SQL command path that does not require pgTAP.
- Production deploys retain two explicit manual release gates: live RLS smoke evidence and the `assignments.assigned_by is null` precheck/remediation before applying the hardening migration.
- Stale `running` generation jobs are failed with `manual_recovery_required` instead of reclaimed, preserving provider idempotency safety until stage-level provider request IDs are persisted.

## References

- Build Bible entry: `docs/redex_education_build_bible.md` (Phase 5 governance hardening context)
- Related code:
  - `.github/workflows/ci.yml`
  - `scripts/guard-prod-mock-auth.mjs`
  - `scripts/rls-smoke.mjs`
  - `supabase/tests/rls_smoke.sql`
  - `README.md`
- Superseded ADRs: none
