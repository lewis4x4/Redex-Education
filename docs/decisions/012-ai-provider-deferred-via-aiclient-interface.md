# ADR 012 — AI provider deferred via aiClient interface

**Status**: Accepted  
**Date**: 2026-05-23  
**Phase / Slice**: AI Slice B / Slice 9.2 documentation reconciliation

## Context

AI Slice B in the v2 roadmap specifies a provider-agnostic `aiClient` interface so the Foundry UI never imports a vendor SDK directly. The v2 Moonshot Strategy states the build-vs-buy boundary as: buy the model, build the orchestration.

A premature provider decision would couple Foundry screens and tests to one vendor's SDK shape before prompts, schemas, cost telemetry, and edge-function boundaries are implemented.

## Decision

Defer the specific AI provider choice (Anthropic, OpenAI, or another provider) until AI Slice B implementation begins. The UI commits only to the `aiClient` interface, not to a vendor package. `mockAiClient` preserves dev/test behavior, and the real client later implements the same interface behind a server-side boundary.

Zod-validated JSON schemas are the cross-provider contract for generated content.

## Consequences

Provider swap remains a one-file implementation decision later instead of a UI-wide migration. Foundry components cannot accidentally couple to vendor SDK request/response shapes. Prompt tests and eval harnesses can run against the same interface regardless of provider.

The tradeoff is that cost estimates and endpoint allowlists remain TBD until AI Slice B/C select the real provider and ADR 008 is updated with any required CSP/network additions.

## References

- v2 roadmap AI Slice B: [`../Redex_Education_Phase10-13_Roadmap_v2_20260523.md`](../Redex_Education_Phase10-13_Roadmap_v2_20260523.md)
- v2 Moonshot Strategy §8: [`../Redex_Education_Moonshot_Strategy_v2_20260523.md`](../Redex_Education_Moonshot_Strategy_v2_20260523.md)
- Related ADR: [ADR 008](./008-netlify-security-headers-and-vendor-chunks.md)
