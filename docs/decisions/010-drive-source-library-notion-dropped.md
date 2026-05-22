# ADR 010 — Drive-based Source Library; Notion dropped

**Status**: Accepted  
**Date**: 2026-05-22  
**Phase / Slice**: Phase 2 / Slice 2.4

## Context

The Course Foundry turns raw Redex knowledge into approved training. That requires a place where non-technical staff (HR, SMEs) can supply source material, and a registry that tracks modules, source files, and how they relate.

Two questions were open. First, the source-intake surface: the original Build Blueprint and roadmap Slice 2.3 assumed admins paste markdown into a textarea. Paste is acceptable for a quick source but is a poor primary intake — it does not handle PDFs, handbooks, screenshots, or transcripts, and it gives source material no stable identity or version history. Second, the registry: an earlier design proposed a Notion workspace (a Modules database related to a Source Files database) to track module status and power staleness flagging.

Constraints considered: the team already uses Google Drive daily; non-technical staff must not have to learn a new app; the platform must avoid tool sprawl ("more apps, more complexity"); and the codebase already has a Supabase backend with a training-schema migration applied.

## Decision

**Google Drive is the source-material intake surface.** A `_library/` zone holds canonical source files organized by topic (each file the single source of truth, never duplicated); a `modules/` zone holds one folder per training module, each with a `00-manifest.md`. Source files are referenced by stable Drive **file ID**, never by path. Each source file declares an `authority` level — `authoritative`, `supporting`, or `context` — in YAML frontmatter (markdown) or a sibling `<filename>.meta.md` (binary files). The generator resolves conflicting sources by authority (`authoritative` > `supporting` > `context`); two sources of equal authority that conflict are flagged for a human, never auto-resolved. The paste-markdown path (Slice 2.3) is kept as a secondary input.

**Notion is not used.** The registry of modules, source files, and their relationships lives in Supabase and the Course Foundry app. The app already needs these tables; a Notion workspace would duplicate them, require a sync job, and drift — exactly the failure mode the Build Bible exists to prevent. The app's own admin dashboard is the status surface; the `00-manifest.md` files are an advisory human-readable mirror until that dashboard exists.

## Consequences

This enables real, versioned source material with stable identity, which is the precondition for source-grounded generation, side-by-side source review (Slice 3.4), and source-change / version-impact detection (Slice 7.3). It keeps the stack to two tools — Drive (intake) and the Supabase-backed app (everything else) — each with one job and no overlap.

It costs a new ingestion layer: Google service-account auth, a `drive-sync` edge function, a `parse-source-file` edge function, and new tables (`source_files`, `source_file_versions`, `source_sections`, `module_source_bindings`). v1 sync is a manual admin-triggered "Sync from Drive" action; scheduled polling is a fast-follow; Drive push notifications are deferred. Roadmap Slice 2.4 was added for the Source Library, and the old Slice 2.4 (AI Setup Questions Wizard) became Slice 2.5. The previously created Notion "Redex Academy" workspace is abandoned, not migrated — it was near-empty and modeled a manual video-production pipeline, not the Course Foundry.
