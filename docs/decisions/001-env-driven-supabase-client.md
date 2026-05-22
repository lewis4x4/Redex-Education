# ADR 001 — Env-driven Supabase client

**Status**: Accepted  
**Date**: 2026-05-22  
**Phase / Slice**: Phase 1

## Context

Phase 1 found Supabase credentials embedded in runtime code (`src/integrations/supabase/client.ts`). That made environment promotion brittle, increased accidental secret exposure risk, and blocked clean contributor onboarding because each machine needed source edits instead of environment configuration. It also conflicted with the roadmap’s Supabase setup expectations and with deploy targets where environment values are injected externally. At the same time, the platform had to preserve a demo path where auth scaffolding could be exercised before real credentials were provisioned.

The immediate constraints were: keep local developer startup practical, avoid committing secrets, and maintain compatibility with mock auth behavior. The Build Bible also recorded that this foundation had to be reliable for later phases (routing/auth scaffolds, progress tracking, and tests) without claiming production auth was complete.

## Decision

Supabase client configuration was moved to env-driven reads from `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY` in `src/integrations/supabase/client.ts`. Type support was added in `src/env.d.ts`, and a contributor template was committed at `./.env.example`. Git ignore policy keeps `.env*` out of VCS while explicitly allowing `.env.example`.

Behavioral policy: fail loudly in development when required env vars are missing and `VITE_MOCK_AUTH !== 'true'`; in production, emit a single warning for misconfiguration visibility while preserving deploy diagnostics. This aligned setup with Netlify-style env injection and local `cp .env.example .env` workflows.

## Consequences

This decision established a stable configuration seam: contributors configure secrets once per environment, and CI/CD provides values out-of-band. It directly supports deferred production auth and deferred real Supabase data access while keeping the runtime honest about missing configuration.

It also prevents hidden coupling between source code and environment identity, which reduces release risk as the repo advances from demo scaffolds toward production-backed flows. Mock mode remains available for UI/dev loops, but the boundary is explicit rather than ad hoc.

## References

- Build Bible — Phase 1 entry: [`../redex_education_build_bible.md`](../redex_education_build_bible.md)
- Related code: `../../src/integrations/supabase/client.ts`, `../../src/env.d.ts`, `../../.env.example`
- Master roadmap context: [`../2025__redex-education__codex-linear-roadmap-handoff.md`](../2025__redex-education__codex-linear-roadmap-handoff.md)
- Architecture context: [`../architecture.md`](../architecture.md)
- Related ADRs: [ADR 004](./004-react-router-with-mock-auth-gate.md), [ADR 008](./008-netlify-security-headers-and-vendor-chunks.md)
