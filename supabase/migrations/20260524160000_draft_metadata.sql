alter table redex.module_versions
  add column if not exists draft_metadata jsonb;

comment on column redex.module_versions.draft_metadata is
  'Foundry draft resume metadata (stage, actor, and serialized draft context).';
