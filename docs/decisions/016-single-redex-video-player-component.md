# ADR 016 — Single RedexVideoPlayer component

**Status**: Accepted  
**Date**: 2026-05-23  
**Phase / Slice**: Phase 10 / Slice 10.6

## Context

The v2 roadmap found that three enhancements depend on the same missing primitive: transcript capture, inline video checkpoints, and the 60–120 second segment rule. Without a single component, the repo risks building multiple partial video players with incompatible checkpoint, transcript, resume, and citation behavior.

Redex Coach also depends on video citations that deep-link to exact timestamps, so the video-player contract affects both Phase 10 lesson experience and Phase 13 grounded tutoring.

## Decision

Build one reusable `RedexVideoPlayer` component in Slice 10.6 and use it for all video lessons. Required capabilities are chapter markers, timestamp deep-linking via `?t=`, inline knowledge-checkpoint cards that replace the video frame in place (no modal), synced scrollable transcript, resume-from-position, and a "Download for offline" affordance.

Video lessons cannot fragment into page-specific players. Coach video citations must use the same timestamp/deep-link behavior.

## Consequences

Slice 10.6 is on the critical path for Phase 10 and Phase 13. Video lessons should not be expanded before the player exists because checkpoints, transcripts, storage playback, and citations need one stable behavior surface.

The tradeoff is that Slice 10.6 carries more responsibility than a simple media wrapper. It must be designed as platform infrastructure, tested directly, and kept free of one-off lesson assumptions.

## References

- v2 roadmap Slice 10.6 and Slice 13.3: [`../Redex_Education_Phase10-13_Roadmap_v2_20260523.md`](../Redex_Education_Phase10-13_Roadmap_v2_20260523.md)
- v2 Moonshot Strategy Round 2 findings: [`../Redex_Education_Moonshot_Strategy_v2_20260523.md`](../Redex_Education_Moonshot_Strategy_v2_20260523.md)
- Related ADRs: [ADR 013](./013-heygen-as-avatar-video-vendor.md), [ADR 015](./015-supabase-only-generation-pipeline.md)
