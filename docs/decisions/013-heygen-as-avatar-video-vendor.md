# ADR 013 — HeyGen as avatar video vendor

**Status**: Accepted  
**Date**: 2026-05-23  
**Phase / Slice**: Phase 10 / Slice 10.6

## Context

The v2 Moonshot Strategy §8 records the build-vs-buy decision: AI avatar video is bought, with HeyGen already in hand. The planned v1 avatar set is Brian for founder/culture segments and Allie for trainer/operations segments.

Video generation is expensive, asynchronous, and credentialed. It cannot run from the browser bundle and must be visible in the same generation pipeline that records cost telemetry.

## Decision

HeyGen is the avatar video provider for v1. Submission is an async stage in the generation pipeline in Slice 10.6. Failed renders are retryable, and cost is recorded in `media_assets.cost_credits`.

HeyGen API access must be wrapped behind an edge function or server-side job boundary. No HeyGen key is allowed in the browser bundle. Rendered MP4 assets are stored in Supabase Storage and served through short-lived signed URLs. Avatar choice is recorded per module/segment.

## Consequences

The app buys the hard avatar-rendering capability while keeping orchestration, approval, retry, storage, and cost controls in Redex-owned code. Supabase Storage becomes the media source for playback; ADR 008 must widen CSP when Slice 10.6 ships.

The tradeoff is vendor dependency for avatar rendering. The boundary must remain narrow enough that another vendor can replace HeyGen if pricing, reliability, or output quality changes.

## References

- v2 roadmap Slice 10.6: [`../Redex_Education_Phase10-13_Roadmap_v2_20260523.md`](../Redex_Education_Phase10-13_Roadmap_v2_20260523.md)
- v2 Moonshot Strategy §8: [`../Redex_Education_Moonshot_Strategy_v2_20260523.md`](../Redex_Education_Moonshot_Strategy_v2_20260523.md)
- Related ADRs: [ADR 008](./008-netlify-security-headers-and-vendor-chunks.md), [ADR 015](./015-supabase-only-generation-pipeline.md), [ADR 016](./016-single-redex-video-player-component.md)
