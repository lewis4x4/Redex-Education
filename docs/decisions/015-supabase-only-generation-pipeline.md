# ADR 015 — Supabase-only generation pipeline for v1

**Status**: Accepted  
**Date**: 2026-05-23  
**Phase / Slice**: AI Slice C

## Context

The Build Blueprint v1 (`docs/Redex_Education_Platform_Build_Blueprint_v1.md` §3.3 and §3.4) specified Cloudflare Workers, Queues, R2, and KV as the required async generation backbone. The v2 roadmap reverses that requirement in AI Slice C: stay Supabase-only for v1.

The v2 plan also replaces the Blueprint's single `cost_cents` integer with explicit `generation_jobs` cost telemetry columns: `estimated_cost_cents`, `actual_cost_cents`, and `cost_breakdown` JSONB.

## Decision

The v1 generation pipeline uses Supabase Edge Functions, a `pg_cron`-driven worker, and Supabase Storage. No Cloudflare Workers, Queues, R2, or KV are part of v1.

Long-running work is represented as durable staged jobs. Edge function timeouts are handled by stage boundaries, persisted job status, retryable steps, and the database worker rather than offloading orchestration to Cloudflare.

## Consequences

The architecture stays inside one backend platform for the internal v1: Supabase Postgres for job state, Supabase Edge Functions for secure boundaries, `pg_cron` for durable polling/work dispatch, and Supabase Storage for generated assets. This lowers operational complexity while the product is still an internal tool.

The reversal is intentional. Cloudflare can be re-evaluated if real scale, latency, or cost data justifies the extra platform surface. Until then, code and docs authored against Blueprint §3.3/§3.4 should be treated as superseded.

## References

- v2 roadmap AI Slice C: [`../Redex_Education_Phase10-13_Roadmap_v2_20260523.md`](../Redex_Education_Phase10-13_Roadmap_v2_20260523.md)
- Partially superseded Blueprint: [`../Redex_Education_Platform_Build_Blueprint_v1.md`](../Redex_Education_Platform_Build_Blueprint_v1.md)
- Build Bible Slice 9.2: [`../redex_education_build_bible.md`](../redex_education_build_bible.md)
- Related ADRs: [ADR 012](./012-ai-provider-deferred-via-aiclient-interface.md), [ADR 013](./013-heygen-as-avatar-video-vendor.md)
