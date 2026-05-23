# ADR 014 — pgvector for source embeddings

**Status**: Accepted  
**Date**: 2026-05-23  
**Phase / Slice**: Phase 13 / Slice 13.1

## Context

Slice 13.1 requires retrieval over the grounded corpus: approved source sections plus video transcript chunks. The retrieval layer must preserve source authority ordering and provenance so Redex Coach can cite approved material and avoid treating AI-derived transcripts as independent authority.

The main options are in-database pgvector or an external vector database such as Pinecone or Weaviate.

## Decision

Use pgvector. Embeddings live alongside the source-of-truth tables in Supabase Postgres. Retrieval can respect authority ordering (`authoritative` > `supporting` > `context`) and row-level security through SQL instead of duplicating access control in another vendor.

Enable the pgvector extension in Slice 13.1. Generate embeddings on source-section parse and on transcript capture. Dimension choice and index strategy are deferred to the Slice 13.1 implementation.

## Consequences

The corpus stays colocated with the relational source model, reducing vendor count and access-control drift. SQL can combine semantic relevance with authority, provenance, org, role, and published-state constraints.

The tradeoff is that vector index tuning becomes part of the Supabase/Postgres operating surface. If corpus size or latency outgrows pgvector, an external vector DB can be reconsidered with measured evidence.

## References

- v2 roadmap Slice 13.1 and 13.2: [`../Redex_Education_Phase10-13_Roadmap_v2_20260523.md`](../Redex_Education_Phase10-13_Roadmap_v2_20260523.md)
- Grounded corpus definition: [`../glossary.md`](../glossary.md)
- Related ADR: [ADR 016](./016-single-redex-video-player-component.md)
