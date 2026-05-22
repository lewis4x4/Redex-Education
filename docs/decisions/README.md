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
| [000](./000-template.md) | ADR template | Template | N/A |

## How to add a new ADR

1. Copy [`000-template.md`](./000-template.md).
2. Name it with the next sequential number (`010-...`, `011-...`, etc.).
3. Fill all template sections.
4. Link the new ADR from this index.
5. Land it through PR sign-off.
