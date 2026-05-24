# Comprehensive Review Workstream Findings — 2026-05-24

Review-only orchestration. Code/config/SQL were not modified. UX reviewer saved a report under `docs/reviews/ux-integrity-review-2026-05-24.md`.

## Workstream 1 — Frontend architecture/routing/auth/data seams

Scope: `src/main.tsx`, `src/AppProviders.tsx`, `src/App.tsx`, `src/hooks/use-auth.tsx`, `src/hooks/useAuth.ts`, `src/components/auth/AuthGate.tsx`, `src/contexts/EducationContext.tsx`, `src/contexts/education-context.ts`, `src/lib/education/dataSource.ts`, `src/lib/education/supabaseDataProvider.ts`.

Findings:
1. HIGH / high confidence — Learner module player routes bypass `AuthGate`. Evidence: `/learn/player` and `/learn/player/:moduleId` route to `LearnerModuleRoute` without `AuthGate`, unlike `/learn` and `/learn/welcome`. Impact: unauthenticated users can reach module-player UI for bundled demo modules. Action: wrap route in `AuthGate`, add route tests.
2. HIGH / high confidence — Real-mode education facade still depends on demo course/module/lesson constants. Evidence: `EducationContext` loads real enrollments/progress but `getCourse`, `getModule`, `getLessonsForModule` search demo constants. Impact: Supabase assignments/progress can mismatch real module catalog; demo progress may be written to real enrollments. Action: fully Supabase-back learner catalog in real mode or explicitly seed/validate demo IDs.
3. MEDIUM / high confidence — Progress writes are optimistic without rollback/refetch on Supabase failure. Impact: UI/server divergence and misleading completion status. Action: rollback/refetch or block completion UI until durable write confirmed.
4. MEDIUM / high confidence — Mock auth + Supabase data source creates broken hybrid mode: `AuthGate` allows mock role, but `EducationProvider` gets `userId=null` and clears Supabase state. Action: disallow combo, provide mock user id, or unify auth/data mode contract.
5. MEDIUM / high confidence — `getDataSource()` silently falls back to mock for unset/unknown values. Action: fail loudly in production-like builds.
6. MEDIUM / medium confidence — `foundry_author` has broad route access across admin/assignments/audit/source-impact/version history. Action: confirm role matrix vs RLS/product policy.
7. LOW / high confidence — `/admin/*` wildcard NotFound is public.

## Workstream 2 — Product flow and UX integrity

Report path: `docs/reviews/ux-integrity-review-2026-05-24.md`.

Summary: Read-only UX/flow review across admin dashboard, all 8 Foundry pages, 3 Source Binder pages, LearnerDashboardPage, and ModuleVersionHistoryPage. Found 5 CEO-demo blockers, 8 production blockers, 11 polish items.

Top demo blockers:
1. `ModuleGenerationPreviewPage` has no cold-load redirect and ships magic-button copy `✨ Generate Full Module in One Click (Preview Mode)`; direct navigation can trigger real AI with `DEFAULT_AI_OUTLINE.course_title = 'HR Basics at Redex'` baked into prompt.
2. `SelfCritiqueReviewPage` leaks internal wording: `toast.info('Manual editing in Slice 3.4')`.
3. `SourceImpactReviewPage` is wired to mocks: `simulateDriveSync()`, `MOCK_MODULE_SOURCE_BINDINGS`, `MOCK_SOURCE_SECTION_DIFFS`; dashboard chip links here.
4. `FoundryStepper` maps `/admin/foundry/blockers` to stage `published`, falsely lighting up Publish while blockers remain.

Top production blockers:
1. `useDraftRedirect` exists but only `FoundryStartPage` uses it; seven other Foundry pages still have narrower inline `// Builder-I hook pending` redirects.
2. `LearnerDashboardPage` resolves title/minutes from `DEMO_HR_BASICS_COURSE`, has hardcoded `aria-label="Onboarding progress"`, static `Good morning` greeting.
3. `SourceBinderInputPage` shows `Saved to your draft` unconditionally and lets admins paste source without basics; cold-load guard only checks `currentDraft === null && sourceMaterial === null`.
4. `SourceLibraryPage` has broken `../decisions/...` ADR link and no visible selection count.

Acknowledged fixes: AdminDashboardPage absorbed prior P0/P1 audit items; SideBySideReviewPage no longer hangs in real mode; PublishBlockersPage no longer renders `MOCK_PUBLISH_BLOCKERS`; `useModuleVersionHistory` batch-fetches real profiles.

Handoffs: cold-load mock leaks into real prompts to AI reviewer; SourceImpactReview Drive unwiring to AI reviewer; `useActorInfo` null -> synthetic `Redex system` audit writes to security reviewer; `MOCK_ORG_PEOPLE` may mask real profile RLS failures; `/admin/onboard` readiness and `useDraftRedirect` rollout to architecture.

## Workstream 3 — Supabase security and data model

Scope: browser Supabase client/query/mutation modules and migrations for RLS/role claims, generation jobs, hardening.

Executive posture: RLS is meaningfully role-aware, but launch-relevant gaps exist around trusted role claims, direct browser-write surfaces, generation job enqueue integrity, and delete/nullability assumptions.

Findings:
1. HIGH / high confidence — Foundry authors can directly fabricate or block `generation_jobs`. Evidence: grants `select, insert` to `authenticated`; insert policy checks only `is_foundry_author()` and `submitted_by = auth.uid()`; table accepts client-writable status/stage/output/cost/idempotency fields. Impact: anon-key console can insert queued/running/succeeded jobs, poison counts, collide keys, confuse polling. Action: remove browser insert; enqueue only through edge/service role, or add strict check constraints/policies.
2. HIGH / medium confidence — RLS trusts JWT `redex_role` before current profile role. Impact: downgraded users retain privileges until token refresh/expiry. Action: profile-first privileged RLS or short token/revocation semantics.
3. MEDIUM / high confidence — Global `foundry_author` role has broad write authority over authoring/source tables. Action: decide if Foundry is trusted admin-equivalent; otherwise add ownership/org/state constraints or server-side RPCs.
4. MEDIUM / high confidence — Assignment delete/nullability hardening conflicts with existing integrity/frontend mapping. Evidence: prior check requires exactly one assignee; hardening sets `assignee_user_id` and `assigned_by` nullable with `ON DELETE SET NULL`; frontend mapper requires non-null `assigned_by`. Action: tombstones, relax check, or update domain/frontend nullable handling.
5. MEDIUM / high confidence — Learner progress/completion data is browser-authoritative. Action: server-side grading/completion if compliance/audit value matters.
6. LOW/MEDIUM / high confidence — Broad authenticated table grants are future-footgun risk; add CI/policy checks for RLS on exposed tables.
7. LOW / high confidence — `upsertProfile` cannot insert under current RLS; rename/update-only or add narrow repair path.

RLS matrix headline: learners self-read/write learning records; managers report over managed users; foundry_author/admin broad authoring/source/module-version rights; generation_jobs direct insert for foundry/admin; service_role bypasses.

## Workstream 4 — Edge-function and AI-pipeline reliability

Scope: `src/features/foundry/ai/*`, `submit-generation-job`, `generation-worker`, `drive-sync`, `_shared/sourceBindingsWriter.ts`, `_shared/parsers.ts`.

Findings:
1. CRITICAL / high confidence — Running jobs can become permanently stuck with no reclaim path. Worker only claims queued jobs; crash/timeout after setting running leaves row forever. Action: lease/heartbeat/stale-running reclaim/max attempts.
2. CRITICAL / high confidence — Section regeneration pipeline shape is incompatible with source binding. Worker includes `source_binding` for `regenerateSection`, but source binding expects `GeneratedModulePreview`; server returns `RegenerateSectionOutput`. Impact: source-impact repair workflows likely fail at `missing_generated_module`. Action: skip source binding for section regeneration or normalize output shape.
3. HIGH / high confidence — Worker has no backoff/retry/max-attempt policy; transient failures terminal. Action: retry classification and exponential backoff.
4. HIGH / high confidence — Source bindings upsert only, never prune stale rows. Impact: source impact/publish confidence may be corrupted after regeneration. Action: transactional replacement or inactive provenance.
5. HIGH / high confidence — Drive sync reports success even when parser invocation fails. Action: return/persist parser dispatch failures.
6. MEDIUM / high confidence — Source-grounding entailment unbounded/sequential; likely runtime/cost risk. Action: caps, bounded concurrency, timeouts.
7. MEDIUM / high confidence — Polling every 2s for 30m with no abort/backoff. Action: abort/cancel/backoff/stage progress.
8. MEDIUM / high confidence — Worker stage errors return HTTP 200, hiding failures from cron/platform monitoring. Action: non-2xx or structured metrics.
9. MEDIUM / medium confidence — Prompt/version audit trail is lossy across multi-stage jobs. Action: per-stage prompt IDs/versions.
10. MEDIUM / medium confidence — Drive sync reprocesses all files and ignores revision metadata. Action: persist revisions and parse only changed files.

Launch blockers: stale running job recovery, real section regeneration fix, worker retry policy, source binding cleanup, Drive parser failure visibility.

## Final governance reviewer task

Assess `.github/workflows/ci.yml`, `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `netlify.toml`, `scripts/guard-prod-mock-auth.mjs`, `README.md`, and `docs/decisions/README.md` against the above findings. Produce final executive synthesis with top 5 risks, demo/pilot/production sequencing, confidence, and verification gaps.