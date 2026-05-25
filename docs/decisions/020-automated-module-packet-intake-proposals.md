# ADR 020 — Automated module packet intake uses proposals, not auto-promotion

**Status**: Accepted  
**Date**: 2026-05-25  
**Phase / Slice**: Option B / Module Packet Intake

## Context

The Google Drive Source Library removed manual file-ID bookkeeping for normal source ingestion, but the admin workflow still requires too much human folder/file choreography when creating a new module from scratch. The desired "Option B" workflow is: an admin names a topic, the Foundry drafts a module packet, the system creates the correct Drive structure, captures Drive IDs, registers Supabase records, syncs/parses the source, and lands the admin on outline review.

That automation creates a trust risk. A generated packet can look authoritative even when it is only an AI-drafted starting point. ADR 010 deliberately made Drive the intake surface and Supabase the registry to avoid a second drifting database. Option B must not reintroduce that drift by making `00-manifest.md` or AI-generated files authoritative by default.

## Decision

Automated module packet intake creates **proposals**. It does not silently create authoritative source, publishable modules, or paid generation jobs.

AI-created packet files must default to:

```yaml
authority: context
authority_provenance: brainstormed
status: draft_for_review
```

Promotion from brainstormed/context to authoritative requires an explicit Foundry-author or SME review action that is audited. `00-manifest.md` remains advisory: it may describe the intended module packet and source bindings, but Supabase remains the system of record for module identity, source files, versions, bindings, and review status.

## Consequences

Admins can move quickly from idea to a reviewable packet without copying Drive IDs by hand. The system still refuses to treat AI-drafted technical content as truth until a human promotes it.

This requires new implementation surfaces: packet proposal state, authority provenance, a Drive write path, proposal review UI, and intake audit events. Phase 1 may ship a mock/UI-only shell; Drive writes and Supabase proposal registration must remain disabled until the backend governance is in place.

## Rejected

- Auto-create authoritative sources from AI packet drafts | would blur source truth and create hallucination risk.
- Treat `00-manifest.md` as the module registry | would recreate the Notion-drift failure mode ADR 010 rejected.
- Auto-launch generation after intake | would bypass explicit cost and review gates.

## References

- ADR 010 — Drive-based Source Library; Notion dropped
- ADR 015 — Supabase-only generation pipeline for v1
- ADR 018 — Phase 3/4 backend governance boundaries
- `docs/designs/foundry-topic-to-packet-option-b-2026-05-25.md`
- `docs/reviews/option-b-drive-module-packet-intake-critique-2026-05-25.md`
