# ADR 021 — Drive intake trigger model: queued polling first, push notifications deferred

**Status**: Accepted  
**Date**: 2026-05-25  
**Phase / Slice**: Option B / Module Packet Intake

## Context

The current `drive-sync` edge function is a user-triggered read-only crawler. It walks a configured Drive folder, captures stable Drive file IDs, upserts `source_files`, and invokes parsing. Option B needs a more reliable intake pipeline because admins may create hundreds of modules and the system must avoid manual IDs, duplicate folders, race conditions, and partial sync corruption.

Google Drive supports change notifications, but a push-notification surface adds channel lifecycle, public endpoint, validation, replay, and operational complexity. ADR 015 keeps v1 on Supabase primitives where possible.

## Decision

For v1, Drive intake uses a queued polling model:

1. User actions enqueue a `drive_sync_jobs` row.
2. A Supabase/`pg_cron` worker claims jobs with lease/retry semantics modeled after `generation_jobs`.
3. Sync jobs use stable Drive folder/file IDs, revision checks, backoff, and per-folder locking.
4. Push notifications via Drive `changes.watch` are deferred until the polling path has proven stable.

The existing manual button path should eventually enqueue a job rather than performing direct writes in the request/response handler.

## Consequences

This preserves the Supabase-only v1 architecture, gives operators retry/observability, and avoids exposing a new public webhook surface too early. It also forces intake automation to be idempotent and resumable before scale.

The tradeoff is latency: new Drive files may not appear instantly unless an admin enqueues a sync. That is acceptable for v1 training authoring.

## Rejected

- Drive push notifications in v1 | too much operational surface before the queue is reliable.
- Browser-triggered sync as the primary engine | not resumable enough for hundreds of modules.
- Full recursive walk on every run forever | too expensive; use revision-skip and later Drive changes cursors.

## References

- ADR 015 — Supabase-only generation pipeline for v1
- ADR 018 — Generation job lease/retry pattern
- `supabase/functions/drive-sync/index.ts`
- `supabase/migrations/20260524190000_phase3_4_backend_hardening.sql`
