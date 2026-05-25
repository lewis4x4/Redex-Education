# Architecture Decision Records (ADRs)

Architecture Decision Records capture the **why** behind significant choices. Each ADR is short, dated, and immutable once accepted. If a decision is superseded, the new ADR references the old one rather than editing it.

## Index

| ID | Title | Status | Phase |
|---|---|---|---|
| [001](./001-env-driven-supabase-client.md) | Env-driven Supabase client | Accepted | Phase 1 |
| [002](./002-domain-types-single-source-of-truth.md) | Domain types as single source of truth | Accepted | Phase 1 |
| [003](./003-typescript-strict-and-no-unchecked-indexed-access.md) | TypeScript strict + `noUncheckedIndexedAccess` | Accepted | Phase 1+3 |
| [004](./004-react-router-with-mock-auth-gate.md) | React Router with mock-auth gate | Accepted | Phase 2 |
| [005](./005-hook-provider-split-pattern.md) | Hook/provider split pattern | Accepted | Phase 2+3 |
| [006](./006-redex-brand-token-system.md) | Redex brand token system | Accepted | Phase 5 |
| [007](./007-aria-layered-on-custom-buttons.md) | ARIA layered on custom buttons | Accepted | Phase 6 |
| [008](./008-netlify-security-headers-and-vendor-chunks.md) | Netlify security headers and vendor chunks | Accepted | Phase 7 |
| [009](./009-vitest-rtl-jsdom-mock-seams.md) | Vitest + RTL + jsdom + mock seam patterns | Accepted | Phase 8 |
| [010](./010-drive-source-library-notion-dropped.md) | Drive-based Source Library; Notion dropped | Accepted | Phase 2 |
| [011](./011-zustand-store-pattern.md) | Zustand store pattern | Accepted | Phase 5–8 |
| [012](./012-ai-provider-deferred-via-aiclient-interface.md) | AI provider deferred via aiClient interface | Accepted | AI Slice B |
| [013](./013-heygen-as-avatar-video-vendor.md) | HeyGen as avatar video vendor | Accepted | Phase 10 / Slice 10.6 |
| [014](./014-pgvector-for-source-embeddings.md) | pgvector for source embeddings | Accepted | Phase 13 / Slice 13.1 |
| [015](./015-supabase-only-generation-pipeline.md) | Supabase-only generation pipeline for v1 | Accepted | AI Slice C |
| [016](./016-single-redex-video-player-component.md) | Single RedexVideoPlayer component | Accepted | Phase 10 / Slice 10.6 |
| [017](./017-redex-schema-isolation.md) | Redex schema isolation (`redex` Postgres schema) | Accepted | Slice 8.5 |
| [018](./018-phase3-4-backend-governance-boundaries.md) | Phase 3/4 backend governance boundaries (lease/retry, enqueue, profile-first role authority, source binding replacement) | Accepted | Phase 3+4 |
| [019](./019-phase5-ci-governance-gates.md) | Phase 5 CI governance gates (prod guard + edge coverage + RLS smoke harness) | Accepted | Phase 5 |
| [020](./020-automated-module-packet-intake-proposals.md) | Automated module packet intake uses proposals, not auto-promotion | Accepted | Option B |
| [021](./021-drive-intake-trigger-model.md) | Drive intake trigger model: queued polling first, push notifications deferred | Accepted | Option B |
| [000](./000-template.md) | ADR template | Template | N/A |

## How to add a new ADR

1. Copy [`000-template.md`](./000-template.md).
2. Name it with the next sequential number (`010-...`, `011-...`, etc.).
3. Fill all template sections.
4. Link the new ADR from this index.
5. Land it through PR sign-off.
