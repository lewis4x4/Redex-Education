# Option B — Automated Drive Module-Packet Intake: Adversarial Critique

**Status**: Critique (no implementation)
**Date**: 2026-05-25
**Author**: Jarvis (adversarial reviewer)
**Scope**: Proposed "Option B" — automated ingest of `modules/<slug>/` packets from the Redex Education Google Drive, with `00-manifest.md` driving module record creation and source binding.

> TL;DR — As stated, Option B is **manual automation theater**: it claims to remove human effort while quietly demoting Supabase from system-of-record back to a cache, re-introducing exactly the Notion-drift failure mode ADR 010 was written to prevent. The plan is salvageable, but only if it ships as **automated proposal + manual promotion**, runs under a hardened sync job (not the current user-triggered edge function), and treats the manifest as untrusted human input — not as truth.

---

## 1. Scope and what Option B inherits

The repo already ships the rails Option B will sit on top of. Any critique that ignores them is hand-waving.

| Concern | Where it lives today | Notable detail |
|---|---|---|
| Drive auth | `supabase/functions/_shared/google-jwt.ts` | One service account, `drive.readonly` scope, single env-var key, no rotation policy, 50-minute token cache. |
| Source-library walk | `supabase/functions/drive-sync/index.ts` | Recursive walk of `_library/`, sequential per-file metadata fetch, fan-out `Promise.allSettled` parse, no resumability, no rate-limit handling, no deletion semantics. |
| Manifest parser | `src/features/source-binder/lib/manifest.ts` + `supabase/functions/_shared/parsers.ts` | Tolerant; requires only `module_slug`; deliberately advisory-only per ADR 010. |
| Module record | **Does not exist yet.** `redex.module_source_bindings.module_id` is `text` with a TODO FK to `modules(id)` "once that table lands in Slice 8.2". |
| Source-grounded generation | `supabase/functions/_shared/sourceBindingsWriter.ts` | Enforces `[source: …]` citations, ranks by authority, flags equal-authority conflicts, never auto-resolves. |
| Generation governance | ADR 018 + `20260524190000_phase3_4_backend_hardening.sql` | Service-role-only enqueue, lease/retry, profile-first RLS, transactional binding replacement via `replace_module_source_bindings`. |
| Trigger model | Manual button only (`DriveSyncButton`). Phase 10–13 roadmap explicitly notes scheduled polling is a fast-follow; no webhook surface exists. |

**Implicit contracts Option B must honor** (per ADR 010, ADR 015, ADR 018, ADR 019):

1. Supabase is the single system of record. Drive is intake, not registry.
2. The `00-manifest.md` is **advisory-only**. ADR 010 explicitly chose this to avoid Notion-style drift.
3. Source files have stable identity via Drive **file ID**, never path.
4. Generation jobs cannot be enqueued from browser paths; enqueue is service-role mediated.
5. Privileged RLS reads current profile role; stale JWT claims are not trusted.
6. Source bindings are replaced transactionally, scoped to `(module_version_id, source_file_id, source_section_id)`.

If Option B violates any of these, it doesn't get to ship; it needs a new ADR explicitly superseding the existing one.

---

## 2. The 15 unstated assumptions Option B is smuggling in

Every "automated Drive module packet intake" proposal I've seen the team gesture at quietly assumes the following, none of which are decided:

1. The `00-manifest.md` is now authoritative for module identity (`module_slug` → `modules.id`). **It isn't, per ADR 010.**
2. A new `modules/<slug>/` folder appearing in Drive should create a `modules` row. **No approval gate is specified.**
3. Deleting/renaming the folder should delete/rename the module. **Current sync has no deletion path even for source files.**
4. Manifest entries that resolve to file IDs not yet in `source_files` should auto-create them. **This bypasses authority tagging by elevating the manifest author to a source curator.**
5. Manifest entries can reference files anywhere the SA can see, not just `_library/`. **The current walk only ingests `_library/`. There is no server-side ancestor check on Drive file IDs.**
6. The trigger is "pg_cron" or "webhook" — interchangeably. **They are different security and ops surfaces.**
7. Every sync run is idempotent. **Today's `drive-sync` only no-ops at the upsert layer; it has no cursor, no resumability, no rate-limit handling, no per-folder advisory lock.**
8. Two operators triggering sync simultaneously is fine. **There is no claim/lease on Drive sync — concurrent runs will race on `replace_module_source_bindings`.**
9. A manifest edit auto-binds to whatever `module_version_id` exists. **The scoped uniqueness key is per `module_version_id`; un-scoped replacement deletes bindings of other versions.**
10. Auto-binding is the same as approving — i.e., the LLM may now treat any file listed in any manifest as part of the allowed corpus. **This is a trust-by-inclusion vector.**
11. Hundreds of modules × dozens of files will fit inside one Drive `files.list` budget. **Drive per-user per-100-seconds quota is ~12,000 read requests. Recursive walks blow this trivially.**
12. The service-account key never rotates. **There is no rotation policy. The key is `GOOGLE_SERVICE_ACCOUNT_JSON`, single secret.**
13. The Drive `_library/` and `modules/` zones are inside a Shared Drive with restricted membership. **Not enforced; not documented.**
14. Cost telemetry (AI Slice C) is unaffected. **Auto-promoted modules can auto-launch generation jobs at unbounded $/day.**
15. Operations can see what the automation did. **There is no structured intake log; today it's `console.error`.**

Until each of these is decided in writing, "Option B" is a name, not a design.

---

## 3. Top risks, ranked by severity

| # | Risk | Severity | Why it matters |
|---|---|---|---|
| **R1** | Manifest promoted from advisory → authoritative without an ADR supersede | 🔴 Critical | Directly contradicts ADR 010. Creates a second system of record. Re-introduces Notion-drift failure mode under a different name. |
| **R2** | Auto-create + auto-bind without human approval gate | 🔴 Critical | Any Drive Edit user becomes a de facto Foundry author. Bypasses governance that took Phase 3/4 to build. |
| **R3** | Drive service-account blast radius | 🔴 Critical | One scope (`drive.readonly`), one key, no rotation, no folder-ancestor enforcement. Compromise exposes whatever the SA has been shared on, not just `_library/`. PII risk is real — HR onboarding is the pilot corpus. |
| **R4** | Idempotency keyed off human-typed `module_slug` | 🔴 Critical | Typos, duplicates, slug renames, and copy-paste folders all silently create or merge module rows. There is no folder→module mapping table. |
| **R5** | Concurrent sync races on `replace_module_source_bindings` | 🟠 High | Two operators or one operator + cron can each acquire bindings concurrently. Replace semantics make the loser's bindings vanish without an error. |
| **R6** | No deletion / tombstoning semantics | 🟠 High | Files vanishing from Drive leave stale `source_files` rows; folders disappearing leave orphan modules. Trash transitions are silent. |
| **R7** | Drive API quota exhaustion at scale | 🟠 High | Today's full recursive walk is O(files). Hundreds of modules × dozens of files = 429 storms. `changes.list` API is not used. |
| **R8** | Auto-triggered generation jobs blow cost meter | 🟠 High | AI Slice C builds the meter; Option B is the obvious way to break it. A manifest commit can mean dozens of paid LLM runs. |
| **R9** | Schedule trigger doubles as auth surface change | 🟡 Medium | The current `drive-sync` requires `foundry_author` JWT + origin allowlist. A cron-invoked variant runs as service-role with no human actor — audit, attribution, and CORS all change. |
| **R10** | Manifest parser is permissive by design (advisory) but Option B treats it as a contract | 🟡 Medium | The parser accepts unknown fields, free-text body, and bare `drive_file_id` without verifying the file exists in `_library/`. Garbage in, modules out. |
| **R11** | No structured intake observability | 🟡 Medium | At hundreds of modules, `console.error` is operating blind. No SLO, no alerting on failure-rate, no `intake_events` table. |
| **R12** | Drive folder rename does not propagate; Drive file move out of `_library/` is invisible | 🟡 Medium | Stable IDs are the right abstraction, but the UI surfaces `drive_path` to humans. Bindings continue to point at files no longer in the corpus. |
| **R13** | Module versioning vs. manifest mutation is undefined | 🟡 Medium | A manifest edit on a published module — does it draft v2 automatically? Mutate v1 in place? Both are wrong unless decided. |
| **R14** | Conflict between manifest authority and `source_files.authority` | 🟢 Low (today) → 🟠 High (post-Option B) | Manifest doesn't currently carry `authority`. If Option B lets it, two sources of authority emerge. |
| **R15** | Mock-auth and prod-guard CI gates may not cover the new cron path | 🟢 Low | ADR 019's gates cover `drive-sync` today; the scheduled variant is a new code path that needs its own coverage row in the CI matrix. |

---

## 4. Concrete plan changes required to make Option B world-class

The structure below is **non-negotiable** before any code lands. Each change names an ADR or migration that must accompany it.

### 4.1 Source authority — close the manifest loophole

- **ADR-020 (new)**: Restate, in writing, that `00-manifest.md` remains **advisory and non-authoritative**. Option B does not change ADR 010; it does not promote the manifest to truth.
- A manifest entry's only effect is to **propose** a `(module_proposal, source_file_id)` pair. It does not create `modules` rows. It does not create `source_files` rows.
- **Refuse manifests whose `drive_file_id` entries are not already in `source_files`** (i.e., not yet ingested from `_library/`). Surface "unknown file" errors back to the operator as a parse warning; do not auto-ingest the file just because it was named.
- Add a new column `redex.source_files.intake_zone text not null check (intake_zone in ('library','module_only'))`. Files only allowed to back generation must have `intake_zone='library'`. This forces the `_library/` discipline at the schema level.

### 4.2 Module identity — kill the `module_slug` foot-gun

- New table `redex.module_drive_folders(module_id uuid references modules(id), drive_folder_id text not null unique, manifest_slug text, first_seen_at timestamptz, archived_at timestamptz)`. **The Drive folder ID is the idempotency key.** `module_slug` is a display alias that may change without merging records.
- Folder renames are tolerated — same Drive folder ID, slug updates in-place. Folder duplications surface as "duplicate folder ID? no, sibling proposal — operator decides".
- Migration must include a CHECK constraint that prevents the FK in `module_source_bindings.module_id` from being populated with a value that is not the UUID of a `modules.id` row that is reachable via `module_drive_folders`. The bindings table's TODO FK must land in the same change set as Option B, not before, not after.

### 4.3 Approval gate — automated proposal, manual promotion

- New table `redex.module_intake_proposals(id uuid pk, drive_folder_id text not null unique, manifest_snapshot jsonb, proposed_module_slug text, proposed_module_title text, proposed_entries jsonb, status text check (status in ('pending_review','accepted','rejected','superseded')), reviewer_id uuid references profiles(id), reviewed_at timestamptz, ...)`.
- The intake worker only writes here. **It never writes `modules` rows.** Promotion requires a Foundry-author click that produces an audit row.
- Surface in Admin Dashboard ("Drive intake — N folders pending review"). Re-uses the same human-gate pattern as `assignments.assigned_by` (ADR 019 release gate).
- Re-sync of an already-accepted proposal updates the `manifest_snapshot` and produces a diff view; the diff is reviewed before any `module_source_bindings` are touched.

### 4.4 Google Drive auth — reduce blast radius

- **Move the corpus into a Shared Drive** (not "My Drive") with explicit membership: the SA, named admins, no domain-wide sharing.
- **Server-side ancestor verification**: every `drive_file_id` ingested must be verified to have the configured root folder as an ancestor (`files.get?fields=parents` walked or — better — `corpora=drive&driveId=…` queries scoped to the Shared Drive). Do not trust `drivePath` strings.
- **Key rotation**: documented 90-day rotation. Two active keys overlap for ≥24h to allow rollover. Store both keys; sign with the newest; verify retired key not referenced after grace.
- **Scope tightening**: `drive.readonly` is OK for reads, but add a per-folder permission deny-list in code: explicitly refuse to touch file IDs outside the configured roots even if the SA can see them. Defense in depth against an SA accidentally being shared on something else.
- **PII egress logging**: every `fetchDriveBytes` call appends an `intake_events` row (file id, size, sha256 of bytes, requesting subsystem, time). The HR pilot corpus is the canary.

### 4.5 Sync engine — turn it into a real job, not a button-handler

- New table `redex.drive_sync_jobs` with the same lease/retry shape as `generation_jobs` (lease_token, lease_expires_at, attempt_count, next_run_at, max_attempts, last_failure_class, worker_id). Mirror ADR 018's contract.
- The scheduled trigger is `pg_cron` calling a service-role function `claim_next_drive_sync_job()` — **not** the user-facing `drive-sync` edge function. The user-facing button enqueues a job; the worker drains it.
- **Per-folder advisory lock** via `pg_try_advisory_xact_lock(hashtext(drive_folder_id))` before any binding write. Concurrent syncs on the same folder fail fast with a typed error.
- **Cursor + checkpoints**: store the in-progress `pageToken` per job so a 15-minute lease that expires mid-walk resumes instead of restarting.
- **Per-file revision skip**: compare `headRevisionId` to `source_files.current_version_id` → `source_file_versions.head_revision_id`. If unchanged, skip parse entirely. This is the only way hundreds of modules × dozens of files becomes affordable.
- **Drive `changes.list` for re-sync**: full recursive walk is the initial sync. Subsequent syncs use the `changes.list` API and the persisted `startPageToken`. Quota usage drops by 10–100×.
- **Exponential backoff + jitter** on Drive 403/429/5xx. Documented limit: ≤ 600 Drive API calls per minute per job.

### 4.6 Trigger model — pick one, write the ADR

- **Option 1 (recommended for v1)**: `pg_cron` polls every N minutes. No webhook, no public surface. Matches ADR 015's Supabase-only stance.
- **Option 2 (fast-follow only)**: Drive `changes.watch` push notifications. Requires (a) a public HTTPS endpoint, (b) channel re-subscription every 7 days, (c) HMAC validation of `X-Goog-Channel-Token`, (d) replay protection. Ship only after Option 1 is solid.
- **Do not ship "both" as an undifferentiated mesh.** Write `ADR-021 — Drive intake trigger model: pg_cron polling for v1, push notifications deferred`.

### 4.7 Idempotency — at every layer

- Upserts keyed by Drive file/folder ID, never name/slug/path.
- `(module_version_id, source_file_id, source_section_id)` remains the bindings unique key (already enforced).
- Cron run idempotency: each `drive_sync_jobs` row carries a `dedupe_key text unique` so the same logical sync can't be enqueued twice.
- Proposal idempotency: `module_intake_proposals` is `unique on (drive_folder_id)` with status — re-syncing a folder updates the proposal's `manifest_snapshot`; it does not create a second proposal row.

### 4.8 Deletion semantics — define and implement

- Add `redex.source_file_processing_status` value `archived`, or a `deleted_at timestamptz` column. Files seen in a sync that do not appear on the next N consecutive syncs (N ≥ 2 to tolerate API hiccups) are tombstoned, not deleted.
- A `module_intake_proposals` row whose folder disappears transitions to `superseded` with reason `drive_folder_missing`. The corresponding `modules` row is **never auto-deleted** — it's marked stale and surfaced for admin action.
- Trashed files trigger a `flagged_for_review` on every `module_source_bindings` row referencing them; bindings are not silently dropped.
- Drive `parents` change (file moved out of `_library/`) is a tombstone trigger, not an upsert.

### 4.9 Generation safety — keep the cost meter intact

- **No auto-launched generation from Option B.** Acceptance of a proposal creates a draft module; generation is enqueued only by an explicit Foundry-author click. This preserves AI Slice C's intent.
- If autonomous generation is ever wanted as a future option, it lives in a separate ADR with: per-tenant daily cap (cents and module count), per-folder generation cooldown, and a kill switch admin can flip in <60s.

### 4.10 Observability and CI

- New table `redex.intake_events(event_kind, drive_id, ok bool, error_class text, latency_ms int, sha256 text, actor text, created_at)`. Append-only.
- Admin Dashboard surface: "Drive intake health" — last sync timestamp, failure rate (7d), files-tombstoned, proposals-pending, proposals-rejected.
- Alerting (operator-side): >5% sync failure rate over 1h, or any `unauthorized_ancestor` event ever (= SA seeing something outside the corpus).
- CI matrix (ADR 019 amendment): add Deno test rows for the new scheduled worker; add an RLS smoke check that `authenticated` role cannot read `module_intake_proposals` except for their own pending proposals, and cannot write at all.

---

## 5. Acceptance gates — what "world-class" means in measurable terms

These are the must-pass criteria. If any fail, Option B isn't done.

- [ ] **G1.** ADR 010 still says the manifest is advisory-only; ADR 020 explicitly restates this for Option B and adds the proposal-not-promote rule.
- [ ] **G2.** No code path in Option B creates a `modules` row or `source_files` row without explicit Foundry-author action. Proven by RLS smoke + unit tests.
- [ ] **G3.** Two concurrent `drive-sync-job` claims on the same `drive_folder_id` cannot both produce binding writes. Proven by a deliberate concurrency test that asserts exactly-once semantics.
- [ ] **G4.** Sync run on an unchanged corpus issues **zero** parse jobs and **zero** binding writes (revision-skip works).
- [ ] **G5.** Every `fetchDriveBytes` call produces an `intake_events` row with `sha256` of bytes. Proven by integration test.
- [ ] **G6.** Service-account key rotation runbook exists, with a dual-key overlap window, in `docs/operations/`.
- [ ] **G7.** Every `drive_file_id` ingested has been verified to descend from the configured `_library/` or `modules/` root via `files.get?fields=parents`. Proven by a negative test where a file ID outside the root is rejected with `unauthorized_ancestor`.
- [ ] **G8.** Drive trash, rename, and move-out scenarios are exercised by integration tests; each results in a tombstone or a `flagged_for_review`, never silent corruption.
- [ ] **G9.** `pg_cron` schedule is documented in `supabase/migrations/` with the same governance as `generation-worker` (ADR 018 alignment). Cron job is unique by name; no duplicate scheduling.
- [ ] **G10.** Cost-meter test: an Option B sync of M new module proposals issues **zero** generation jobs. Generation only runs after explicit promote + generate click.
- [ ] **G11.** Drive API call budget per job is bounded and logged; jobs exceeding budget fail fast with `quota_budget_exceeded` and reschedule with backoff.
- [ ] **G12.** Admin dashboard shows intake health with a 7-day failure-rate widget. Failure-rate > 5% triggers an alert.

---

## 6. What to cut from Option B v1 (scope discipline)

These items are tempting and wrong-for-now:

1. **Auto-create `modules` rows.** Cut. Proposals only. Promote is a human click.
2. **Auto-launch generation on accepted proposals.** Cut. Separate ADR, separate ship.
3. **Drive push notifications (`changes.watch`).** Cut from v1. `pg_cron` first; webhooks fast-follow once v1 is healthy.
4. **Auto-create `source_files` rows for IDs named in a manifest but not in `_library/`.** Cut. Curation goes through `_library/` only; manifest is read-only against the source registry.
5. **In-line authority overrides in `00-manifest.md`.** Cut. Authority lives on `source_files` via frontmatter/`.meta.md`, not in module-scope manifests.
6. **Manifest schema migrations.** Cut. Use the existing permissive parser; reject invalid manifests at proposal-validation time. Don't co-evolve the manifest grammar with intake automation — solve one problem per release.
7. **Multi-tenant / per-org scoping.** Cut from v1. Pilot is single-tenant; introduce tenancy when there's a second customer, not before.
8. **Auto-mapping non-Drive sources** (Sharepoint, internal wiki, Notion). Cut. Already deferred per moonshot strategy.

---

## 7. Open questions for product and business

These are decisions the engineering team cannot make alone. Each must be answered in writing before scoping the v1 sprint.

1. **Authoring topology.** Will SMEs author manifests directly in Drive, or will Foundry produce/sync them? If both, who wins on conflict?
2. **Approval SLA.** How fast must a proposed module move from `pending_review` to `accepted`? Sub-hour, or daily batch? This decides whether the admin dashboard needs real-time push.
3. **Failure communication.** When a manifest fails to parse, who is told and how? In-app banner, email to manifest author, Slack? The current system has no off-app notification surface.
4. **Pilot blast radius.** Will the HR pilot's Drive be the same Drive long-term, or carved off? PII regulatory questions ride on this.
5. **Cost ceiling per day.** AI Slice C is building the meter; Option B is the obvious accelerator. What is the per-day generation-cost ceiling above which intake auto-promotes are paused?
6. **Drive admin ownership.** Who at Redex holds the GSuite admin rights to manage the Shared Drive, rotate SA keys, and respond to a key-leak incident in business hours?

---

## 8. Verdict and recommended next steps

Option B as a sentence — "automate Drive module packet intake" — is the right *direction*. As a design, it is half-built and rests on assumptions that ADR 010 and ADR 018 already rejected.

Recommended next steps, in order:

1. Write **ADR 020** (Option B principles: proposal-not-promote, manifest stays advisory, scoped Drive ancestry).
2. Write **ADR 021** (trigger model: `pg_cron` v1, webhooks deferred).
3. Land the **module record schema (Slice 8.2)** that `module_source_bindings.module_id` is already waiting for. Option B cannot land before this; the bindings table has a TODO FK that depends on it.
4. Build the **`drive_sync_jobs` queue + lease semantics**, mirroring ADR 018 patterns. Re-use the same lease/retry/RPC envelope.
5. Build the **`module_intake_proposals` table + admin review UI**. Ship this *before* automating the trigger — i.e., the manual-button path produces proposals first; cron lights up once the human surface is solid.
6. Convert the manual `drive-sync` button to enqueue a `drive_sync_jobs` row; remove the direct-write path from edge functions.
7. Add `pg_cron` schedule under a feature flag; ramp from one tenant to all.
8. Push notifications (`changes.watch`) only after 30 days of clean `pg_cron` operation.

Anything less is automation theater on top of a system whose governance was built precisely to refuse it.

---

## References

- ADR 010 — Drive-based Source Library; Notion dropped (`docs/decisions/010-drive-source-library-notion-dropped.md`)
- ADR 015 — Supabase-only generation pipeline (`docs/decisions/015-supabase-only-generation-pipeline.md`)
- ADR 018 — Phase 3/4 backend governance boundaries (`docs/decisions/018-phase3-4-backend-governance-boundaries.md`)
- ADR 019 — Phase 5 CI governance gates (`docs/decisions/019-phase5-ci-governance-gates.md`)
- Current `drive-sync` edge function (`supabase/functions/drive-sync/index.ts`)
- Current `parse-source-file` edge function (`supabase/functions/parse-source-file/index.ts`)
- Service-account auth (`supabase/functions/_shared/google-jwt.ts`)
- Source bindings writer (`supabase/functions/_shared/sourceBindingsWriter.ts`)
- Source library v1 schema (`supabase/migrations/20260522220557_source_library_v1.sql`)
- Phase 3/4 hardening migration (`supabase/migrations/20260524190000_phase3_4_backend_hardening.sql`)
- Roadmap handoff Slice 2.4 (`docs/2025__redex-education__codex-linear-roadmap-handoff.md`)
- Phase 10–13 v2 roadmap, AI Slice C (`docs/Redex_Education_Phase10-13_Roadmap_v2_20260523.md`)
