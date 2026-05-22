# ADR 008 — Netlify security headers and vendor chunks

**Status**: Accepted  
**Date**: 2026-05-22  
**Phase / Slice**: Phase 7

## Context

Phase 7 focused on production posture. Two risks were active: missing explicit security headers in deploy config, and a monolithic JavaScript output that previously triggered Vite’s large-chunk warning. The platform needed a safer baseline without changing app behavior, while still respecting current integration realities (Supabase network calls and websocket channels).

The team also needed an approach that improved cache efficiency for stable third-party dependencies and reduced entry-chunk volatility across deploys.

## Decision

A security header block was added to `netlify.toml` for all routes, including:

- Content Security Policy with `'self'` defaults and explicit `https://*.supabase.co` + `wss://*.supabase.co` in `connect-src`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- restrictive `Permissions-Policy`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

In `vite.config.ts`, build target was set to `es2023` and `manualChunks` was introduced to split dependencies into `react-vendor`, `markdown-vendor`, `supabase-vendor`, and a fallback `vendor` chunk.

## Consequences

Security posture moved from implicit defaults to explicit policy, making deployment behavior auditable and easier to harden over time. Chunk splitting reduced entry payload volatility and improved long-cache efficiency for rarely changing vendor code.

This decision does not claim full production-hardening completeness: CSP widening for future third-party integrations (analytics, external fonts, payments) remains deferred until those tools are actually introduced.

It complements ADR 001 by aligning env-driven Supabase boundaries with deployment-layer network and header policy.

## References

- Build Bible — Phase 7 entry: [`../redex_education_build_bible.md`](../redex_education_build_bible.md)
- Related code: `../../netlify.toml`, `../../vite.config.ts`, `../../index.html`
- Master roadmap context: [`../2025__redex-education__codex-linear-roadmap-handoff.md`](../2025__redex-education__codex-linear-roadmap-handoff.md)
- Architecture context: [`../architecture.md`](../architecture.md)
- Related ADRs: [ADR 001](./001-env-driven-supabase-client.md), [ADR 009](./009-vitest-rtl-jsdom-mock-seams.md)
