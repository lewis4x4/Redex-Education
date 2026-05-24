## Final Prompt
<taskname="CEO review plan"/>
<task>Plan a comprehensive, review-only CEO/co-pilot/orchestrator assessment of Redex-Education. Decompose work into up to 5 specialist review items with concrete done criteria, verification expectations, and synthesis requirements. Do not implement code changes.</task>

<architecture>
- Frontend shell: `src/main.tsx` + `src/AppProviders.tsx` + `src/App.tsx` define provider stack, route topology, and feature entry points.
- Core state/data seams: auth (`src/hooks/use-auth.tsx`, `src/components/auth/AuthGate.tsx`), education provider (`src/contexts/EducationContext.tsx`), and facade/data-source split (`src/lib/education/*`, `src/integrations/supabase/*`).
- Product surfaces prioritized for review: Admin dashboard + Foundry workflow + Source Binder + learner dashboard/module history pages.
- Backend execution plane: Supabase edge functions (`supabase/functions/...`) with generation pipeline centered on `generation-worker/index.ts`, plus SQL policy/runtime hardening migrations.
- Delivery/ops controls: CI (`.github/workflows/ci.yml`), build/deploy/security guardrails (`package.json`, `vite.config.ts`, `netlify.toml`, `scripts/guard-prod-mock-auth.mjs`).
</architecture>

<selected_context>
README.md: Product and workflow orientation.
.github/workflows/ci.yml: CI gates (typecheck/lint/test/build + deno checks/tests + eval harness).
package.json: Build/test scripts and dependency surface.
vite.config.ts: Build chunking and Vitest/coverage config.
netlify.toml: Deployment + CSP/security headers.
src/App.tsx: End-to-end route map and role-gated paths.
src/contexts/EducationContext.tsx: Education state orchestration and data-source branching.
src/integrations/supabase/queries/admin.ts: Admin summary aggregation logic.
src/integrations/supabase/mutations/foundry.ts: Foundry draft/job writes and persistence seam.
src/features/admin/pages/AdminDashboardPage.tsx: Primary operator dashboard UX/metrics/actions.
src/features/foundry/pages/*.tsx: Full Foundry authoring chain (start→questions→outline→preview→critique→side-by-side→blockers→publish).
src/features/foundry/ai/realAiClient.ts: Real AI job submission/polling behavior.
src/features/source-binder/pages/*.tsx: Source ingestion/library/impact review surfaces.
src/features/learner/pages/LearnerDashboardPage.tsx: Learner-facing consumption entrypoint.
src/features/publishing/pages/ModuleVersionHistoryPage.tsx: Version/release governance UI.
supabase/functions/generation-worker/index.ts: Multi-stage generation orchestrator and job state machine.
supabase/functions/submit-generation-job/index.ts: Job enqueue boundary.
supabase/functions/drive-sync/index.ts: Source library ingestion sync.
supabase/functions/_shared/sourceBindingsWriter.ts: Source-grounding/binding persistence logic.
supabase/migrations/20260523120000_real_rls_and_role_claims.sql: RLS/role-claim security baseline.
supabase/migrations/20260523130000_generation_jobs.sql + 20260523133000_generation_jobs_hardening.sql: Job table + hardening.
supabase/migrations/20260524130000_security_hardening.sql: Additional security constraints.
</selected_context>

<relationships>
- `src/App.tsx` routes -> feature pages (`admin`, `foundry`, `source-binder`, `learner`, `publishing`).
- `use-auth.tsx` + `AuthGate.tsx` -> route access behavior for admin/foundry surfaces.
- `EducationContext.tsx` -> `getDataSource()` -> mock vs Supabase provider (`src/lib/education/supabaseDataProvider.ts`).
- Frontend query/mutation modules -> Supabase tables/functions defined and constrained by migrations + RLS.
- `realAiClient.ts` -> `submit-generation-job` edge function -> `generation-worker` -> shared binding/parser logic.
- Existing ADR index (`docs/decisions/README.md`) provides rationale constraints for architecture/security/testing patterns.
</relationships>

<ambiguities>
- Existing detailed audit docs were intentionally not selected due to token budget; only code + ADR index are selected. If prior findings are needed, consult `docs/reviews/*` outside this selection.
- Some large schema/type/helper files are included as codemaps (not full implementation), especially `src/types/training.ts`, `src/integrations/supabase/db-rows.ts`, and `supabase/functions/_shared/courseFoundryAiClientServer.ts`.
</ambiguities>

<delegation_plan>
1) Frontend architecture and routing review
Done criteria: route/provider/auth boundaries mapped; cross-feature coupling risks and regressions listed with file evidence.
2) Product flow and UX integrity review (admin/foundry/source-binder/learner)
Done criteria: end-to-end workflow breakpoints, state-loss risks, copy/interaction inconsistencies, and role-flow gaps documented with severity.
3) Supabase security/data model review (RLS, migrations, claims, job tables)
Done criteria: RLS assumptions, privilege boundaries, migration integrity, and data consistency risks enumerated with concrete SQL/module references.
4) Edge-function and AI-pipeline reliability review
Done criteria: enqueue/worker lifecycle, failure handling, idempotency, timeout/retry behavior, and source-grounding chain assessed with actionable risk statements.
5) Build/test/deploy governance review + synthesis
Done criteria: CI/build/deploy controls assessed against discovered risks; final synthesized executive brief includes top risks, confidence, and recommended sequencing.
</delegation_plan>

## Selection
- Files: 79 total (73 full, 6 codemap)
- Total tokens: 112131 (Auto view)
- Token breakdown: full 100858, codemap 11273

### Files
### Selected Files
/Users/brianlewis/Redex-Education/
├── .github/
│   └── workflows/
│       └── ci.yml — 324 tokens (full)
├── docs/
│   └── decisions/
│       └── README.md — 678 tokens (full)
├── scripts/
│   └── guard-prod-mock-auth.mjs — 281 tokens (full)
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── AuthGate.tsx — 923 tokens (full)
│   │   └── layout/
│   │       ├── AppShell.tsx — 197 tokens (full)
│   │       └── BreadcrumbBar.tsx — 334 tokens (full)
│   ├── contexts/
│   │   ├── EducationContext.tsx — 3,275 tokens (full)
│   │   └── education-context.ts — 310 tokens (full)
│   ├── features/
│   │   ├── admin/
│   │   │   ├── components/
│   │   │   │   ├── AdminMetricCard.tsx — 504 tokens (full)
│   │   │   │   ├── AssignmentsEntryCard.tsx — 510 tokens (full)
│   │   │   │   ├── CourseStatusList.tsx — 1,042 tokens (full)
│   │   │   │   └── FoundryEntryCard.tsx — 547 tokens (full)
│   │   │   └── pages/
│   │   │       └── AdminDashboardPage.tsx — 3,010 tokens (full)
│   │   ├── assignments/
│   │   │   └── pages/
│   │   │       └── AssignmentAdminPage.tsx — 358 tokens (full)
│   │   ├── foundry/
│   │   │   ├── ai/
│   │   │   │   ├── aiSchemas.ts — 2,400 tokens (full)
│   │   │   │   ├── courseFoundryAiClient.ts — 870 tokens (full)
│   │   │   │   ├── index.ts — 254 tokens (full)
│   │   │   │   └── realAiClient.ts — 3,827 tokens (full)
│   │   │   ├── pages/
│   │   │   │   ├── FoundryQuestionsPage.tsx — 696 tokens (full)
│   │   │   │   ├── FoundryStartPage.tsx — 532 tokens (full)
│   │   │   │   ├── ModuleGenerationPreviewPage.tsx — 2,459 tokens (full)
│   │   │   │   ├── OutlineReviewPage.tsx — 1,819 tokens (full)
│   │   │   │   ├── PublishBlockersPage.tsx — 1,634 tokens (full)
│   │   │   │   ├── PublishConfirmationPage.tsx — 1,812 tokens (full)
│   │   │   │   ├── SelfCritiqueReviewPage.tsx — 2,020 tokens (full)
│   │   │   │   └── SideBySideReviewPage.tsx — 2,794 tokens (full)
│   │   │   ├── schemas/
│   │   │   │   └── foundrySchemas.ts — 731 tokens (full)
│   │   │   └── types.ts — 607 tokens (full)
│   │   ├── learner/
│   │   │   └── pages/
│   │   │       └── LearnerDashboardPage.tsx — 2,513 tokens (full)
│   │   ├── publishing/
│   │   │   ├── hooks/
│   │   │   │   └── useModuleVersionHistory.ts — 1,603 tokens (full)
│   │   │   └── pages/
│   │   │       └── ModuleVersionHistoryPage.tsx — 3,515 tokens (full)
│   │   └── source-binder/
│   │       ├── lib/
│   │       │   └── useSourceLibrary.ts — 592 tokens (full)
│   │       ├── pages/
│   │       │   ├── SourceBinderInputPage.tsx — 1,734 tokens (full)
│   │       │   ├── SourceImpactReviewPage.tsx — 1,759 tokens (full)
│   │       │   └── SourceLibraryPage.tsx — 1,480 tokens (full)
│   │       └── store/
│   │           └── sourceChangeEventsStore.ts — 1,066 tokens (full)
│   ├── hooks/
│   │   ├── use-auth.tsx — 1,084 tokens (full)
│   │   ├── useAdminSummary.ts — 824 tokens (full)
│   │   ├── useAuth.ts — 71 tokens (full)
│   │   ├── useEducation.ts — 224 tokens (full)
│   │   └── useProfile.ts — 588 tokens (full)
│   ├── integrations/
│   │   └── supabase/
│   │       ├── mutations/
│   │       │   ├── assignments.ts — 509 tokens (full)
│   │       │   ├── foundry.ts — 2,904 tokens (full)
│   │       │   └── profiles.ts — 281 tokens (full)
│   │       ├── queries/
│   │       │   ├── admin.ts — 1,529 tokens (full)
│   │       │   ├── assignments.ts — 724 tokens (full)
│   │       │   ├── courses.ts — 391 tokens (full)
│   │       │   ├── moduleVersions.ts — 240 tokens (full)
│   │       │   ├── profiles.ts — 472 tokens (full)
│   │       │   └── source_library.ts — 440 tokens (full)
│   │       └── client.ts — 470 tokens (full)
│   ├── lib/
│   │   └── education/
│   │       ├── dataSource.ts — 53 tokens (full)
│   │       ├── index.ts — 1,281 tokens (full)
│   │       └── supabaseDataProvider.ts — 1,366 tokens (full)
│   ├── App.tsx — 4,581 tokens (full)
│   ├── AppProviders.tsx — 152 tokens (full)
│   └── main.tsx — 91 tokens (full)
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── parsers.ts — 1,393 tokens (full)
│   │   │   └── sourceBindingsWriter.ts — 4,133 tokens (full)
│   │   ├── drive-sync/
│   │   │   └── index.ts — 3,246 tokens (full)
│   │   ├── generation-worker/
│   │   │   └── index.ts — 7,321 tokens (full)
│   │   └── submit-generation-job/
│   │       └── index.ts — 2,721 tokens (full)
│   └── migrations/
│       ├── 20260523120000_real_rls_and_role_claims.sql — 6,985 tokens (full)
│       ├── 20260523130000_generation_jobs.sql — 1,050 tokens (full)
│       ├── 20260523133000_generation_jobs_hardening.sql — 502 tokens (full)
│       └── 20260524130000_security_hardening.sql — 706 tokens (full)
├── README.md — 3,728 tokens (full)
├── eslint.config.js — 271 tokens (full)
├── netlify.toml — 227 tokens (full)
├── package.json — 521 tokens (full)
├── tsconfig.app.json — 227 tokens (full)
├── tsconfig.json — 31 tokens (full)
└── vite.config.ts — 511 tokens (full)

### Codemaps
/Users/brianlewis/Redex-Education/
├── src/
│   ├── features/
│   │   └── source-binder/
│   │       └── lib/
│   │           └── manifest.ts — 405 tokens (auto)
│   ├── integrations/
│   │   └── supabase/
│   │       └── db-rows.ts — 1,407 tokens (auto)
│   ├── lib/
│   │   └── education/
│   │       └── writeErrors.ts — 66 tokens (auto)
│   └── types/
│       └── training.ts — 5,335 tokens (auto)
└── supabase/
    └── functions/
        ├── _shared/
        │   └── courseFoundryAiClientServer.ts — 3,340 tokens (auto)
        └── parse-source-file/
            └── index.ts — 720 tokens (auto)


---

## Generated Plan

## Chat Send ✅
- **Chat**: `ceo-review-plan-4BEBE8` | **Mode**: plan

### Response
## 1. Summary

Run a **review-only CEO/co-pilot/orchestrator assessment** of Redex-Education across product readiness, frontend architecture, Supabase security/data integrity, AI pipeline reliability, and delivery governance. This should be handled as a **broad structured review**, not a targeted code change, because the selected context spans route topology, role gates, core data seams, product workflows, edge functions, RLS migrations, CI, and deployment controls. The output should be a synthesized executive brief with evidence-backed risks, severity, confidence, and recommended sequencing. **No code changes, migrations, deploys, or configuration edits are in scope.**

---

## 2. Current-state analysis

Redex-Education is a React/Vite/Supabase learning platform with two major operating modes:

- **Mock/demo mode** for local/test flows.
- **Supabase/real mode** for production-like auth, data, and AI generation.

Key architecture from the selected code:

- **Frontend shell**
  - `src/main.tsx` mounts `BrowserRouter` and `AppProviders`.
  - `src/AppProviders.tsx` nests `AuthProvider` → `EducationProviderWithAuth` → `EducationProvider` → `App`.
  - `src/App.tsx` defines all routes and wraps protected surfaces with `AuthGate`.

- **Auth and role access**
  - `src/hooks/use-auth.tsx` owns Supabase session loading, JWT role extraction from `redex_role`, mock role fallback, refresh, and sign-out.
  - `src/components/auth/AuthGate.tsx` enforces route access and redirects unauthenticated users to `/sign-in?redirect_to=...`.

- **Education data seam**
  - `src/contexts/EducationContext.tsx` owns learner progress state, localStorage persistence in mock mode, Supabase progress/enrollment loading in real mode, and optimistic progress writes.
  - `src/lib/education/dataSource.ts` selects `mock` vs `supabase`.
  - `src/lib/education/supabaseDataProvider.ts` lazy-loads query/mutation modules.

- **Product surfaces**
  - Admin dashboard: `src/features/admin/pages/AdminDashboardPage.tsx`, backed by `src/hooks/useAdminSummary.ts` and `src/integrations/supabase/queries/admin.ts`.
  - Foundry workflow: `/admin/foundry/start → source → questions → outline → preview → critique → sidebyside → blockers → published`.
  - Source Binder: Drive/library/impact review surfaces under `src/features/source-binder/pages/*`.
  - Learner dashboard: `src/features/learner/pages/LearnerDashboardPage.tsx`.
  - Module version governance: `src/features/publishing/pages/ModuleVersionHistoryPage.tsx`.

- **AI/backend execution plane**
  - `src/features/foundry/ai/realAiClient.ts` submits jobs to `submit-generation-job`, polls `generation_jobs`, validates outputs with Zod schemas, and maps operation outputs.
  - `supabase/functions/submit-generation-job/index.ts` authenticates caller, verifies Foundry role, computes idempotency key, and inserts/reuses active jobs.
  - `supabase/functions/generation-worker/index.ts` claims queued jobs, runs staged generation, writes source bindings, performs entailment checks, and assembles final output.
  - `supabase/functions/_shared/sourceBindingsWriter.ts` extracts citations, resolves source sections, writes `module_source_bindings`, and reports unsupported/conflicting claims.

- **Security/data controls**
  - RLS and role helpers are centered in `20260523120000_real_rls_and_role_claims.sql`.
  - Generation job durability and hardening are defined in `20260523130000_generation_jobs.sql` and `20260523133000_generation_jobs_hardening.sql`.
  - Additional constraints/indexes/nullable FK hardening are in `20260524130000_security_hardening.sql`.

- **Ops controls**
  - `.github/workflows/ci.yml` runs typecheck, lint, Vitest, build, Deno checks/tests, and eval harness.
  - `scripts/guard-prod-mock-auth.mjs` blocks production builds unless Supabase/real AI config is active.
  - `netlify.toml` defines SPA redirect and security headers/CSP.

Reusable review evidence exists in the selected files, but prior audit docs in `docs/reviews/*` were not selected. If this review is executed with repository access, those documents should be consulted as historical findings, not treated as current truth without re-validation.

---

## 3. Design

### Review format

Produce one final review package with:

1. **Executive brief**
   - Top 5 risks.
   - Business/product impact.
   - User/operator impact.
   - Engineering/system impact.
   - Recommended sequencing: immediate, next, later.

2. **Specialist findings**
   - One section per workstream below.
   - Each finding must include:
     - Severity: `critical | high | medium | low`.
     - Confidence: `high | medium | low`.
     - Evidence: file/function/route/table/policy reference.
     - Impact.
     - Recommended action.
     - Verification needed.

3. **Cross-cutting synthesis**
   - Contradictions between product behavior, frontend assumptions, Supabase policies, and AI pipeline behavior.
   - Risks that only appear when multiple subsystems interact.
   - “CEO decision points” requiring prioritization or scope tradeoffs.

4. **No-change attestation**
   - Explicitly state that no code, SQL, config, deploy, or dependency changes were made.

---

### Specialist review item 1: Frontend architecture and routing review

**Reviewer lens:** Orchestrator / frontend architect.

**Scope**

Primary files:

- `src/main.tsx`
- `src/AppProviders.tsx`
- `src/App.tsx`
- `src/hooks/use-auth.tsx`
- `src/hooks/useAuth.ts`
- `src/components/auth/AuthGate.tsx`
- `src/contexts/EducationContext.tsx`
- `src/contexts/education-context.ts`
- `src/lib/education/dataSource.ts`
- `src/lib/education/supabaseDataProvider.ts`

**Review questions**

- Is the provider stack ordered correctly for auth-dependent data?
- Are route guards consistently applied to learner, admin, manager, Foundry, source, and publishing routes?
- Are role requirements aligned with product intent and RLS expectations?
- Are lazy-loaded routes, suspense boundaries, and error boundaries sufficient?
- Are mock-vs-real branches isolated cleanly, or can mock assumptions leak into production?
- Does `EducationContext` mix demo module lookup with Supabase progress in a way that creates real-mode inconsistencies?

**Specific data/control flow to inspect**

```text
main.tsx
  → BrowserRouter
  → AppProviders
  → AuthProvider
  → EducationProviderWithAuth
  → EducationProvider(userId)
  → App routes
  → AppShell
  → AuthGate
  → feature page
```

Auth flow:

```text
Supabase session
  → use-auth.tsx
  → decode redex_role from access token
  → AuthContext
  → AuthGate requiredRole checks
  → route render / redirect / access denied
```

Education flow:

```text
EducationProvider userId
  → getDataSource()
  → mock localStorage OR Supabase provider
  → lesson progress/enrollment state
  → useEducation/useMyProgress
  → learner/player pages
```

**Done criteria**

- Route/provider/auth map is complete for all selected route groups.
- Every protected route in `src/App.tsx` is categorized by required role.
- Any route missing expected auth coverage is listed.
- Any real-mode dependency on demo constants is identified.
- Any state lifecycle risks in `EducationContext.tsx` are documented with impact.
- Findings distinguish architecture risk from UX/product risk.

**Verification expectations**

Reviewers should verify by inspection and, where repository execution is available, by:

- `npm run typecheck`
- `npm test -- src/App.routes.test.tsx src/App.routes.foundryFlow.test.tsx src/components/auth/AuthGate.test.tsx`
- Manual route matrix against:
  - unauthenticated user
  - learner
  - manager
  - foundry_author
  - admin
  - mock auth enabled/disabled

**Synthesis requirements**

Feed the synthesis with:

- Route guard matrix.
- Provider/data ownership diagram.
- Top coupling risks.
- Any “production mode behaves differently than tests/mock mode” risks.

---

### Specialist review item 2: Product flow and UX integrity review

**Reviewer lens:** CEO co-pilot / product operator.

**Scope**

Primary files:

- `src/features/admin/pages/AdminDashboardPage.tsx`
- `src/features/admin/components/AdminMetricCard.tsx`
- `src/features/admin/components/FoundryEntryCard.tsx`
- `src/features/admin/components/AssignmentsEntryCard.tsx`
- `src/features/admin/components/CourseStatusList.tsx`
- `src/features/foundry/pages/FoundryStartPage.tsx`
- `src/features/foundry/pages/FoundryQuestionsPage.tsx`
- `src/features/foundry/pages/OutlineReviewPage.tsx`
- `src/features/foundry/pages/ModuleGenerationPreviewPage.tsx`
- `src/features/foundry/pages/SelfCritiqueReviewPage.tsx`
- `src/features/foundry/pages/SideBySideReviewPage.tsx`
- `src/features/foundry/pages/PublishBlockersPage.tsx`
- `src/features/foundry/pages/PublishConfirmationPage.tsx`
- `src/features/source-binder/pages/SourceBinderInputPage.tsx`
- `src/features/source-binder/pages/SourceLibraryPage.tsx`
- `src/features/source-binder/pages/SourceImpactReviewPage.tsx`
- `src/features/learner/pages/LearnerDashboardPage.tsx`
- `src/features/publishing/pages/ModuleVersionHistoryPage.tsx`

**Review questions**

- Can an admin successfully understand and complete the Foundry workflow?
- Are prerequisite redirects consistent and non-destructive?
- Are loading, empty, error, and retry states clear?
- Are “publish”, “approved”, “draft”, “review”, and “blocked” terms used consistently?
- Does the learner dashboard reflect assigned modules and progress reliably?
- Does module version history support governance decisions clearly?
- Are source library selections and impact review understandable to a non-engineer operator?
- Are disabled/coming-soon interactions honest and non-blocking?

**Key workflow to inspect**

```text
/admin
  → Start new module
  → /admin/foundry/start
  → /admin/foundry/source
  → /admin/foundry/questions
  → /admin/foundry/outline
  → /admin/foundry/preview
  → /admin/foundry/critique
  → /admin/foundry/sidebyside
  → /admin/foundry/blockers
  → /admin/foundry/published
  → /admin or version history
```

**Done criteria**

- End-to-end Foundry workflow breakpoint list is complete.
- Each page has documented:
  - entry prerequisites
  - primary action
  - back/exit behavior
  - empty/loading/error states
  - state-loss risks
- Admin dashboard metrics/actions are mapped to downstream destinations.
- Learner dashboard assignment/progress assumptions are documented.
- Copy/interaction inconsistencies are grouped by severity.
- Findings are written in operator language, not only engineering language.

**Verification expectations**

Reviewers should verify by inspection and, if executable:

- Existing Foundry route tests.
- Existing component/page tests where available.
- Manual walkthrough in:
  - mock mode
  - Supabase mode, if configured
- Browser accessibility spot checks:
  - keyboard tab flow
  - button/link semantics
  - role/status/alert usage
  - disabled control explanations

**Synthesis requirements**

Feed the synthesis with:

- “Can a real Redex admin operate this?” answer.
- Top product blockers before CEO demo.
- Top product blockers before real production use.
- Screens/page states that need executive attention.

---

### Specialist review item 3: Supabase security and data model review

**Reviewer lens:** Security/data governance reviewer.

**Scope**

Primary files:

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/queries/admin.ts`
- `src/integrations/supabase/queries/courses.ts`
- `src/integrations/supabase/queries/assignments.ts`
- `src/integrations/supabase/queries/moduleVersions.ts`
- `src/integrations/supabase/queries/profiles.ts`
- `src/integrations/supabase/queries/source_library.ts`
- `src/integrations/supabase/mutations/foundry.ts`
- `src/integrations/supabase/mutations/profiles.ts`
- `src/integrations/supabase/mutations/assignments.ts`
- `supabase/migrations/20260523120000_real_rls_and_role_claims.sql`
- `supabase/migrations/20260523130000_generation_jobs.sql`
- `supabase/migrations/20260523133000_generation_jobs_hardening.sql`
- `supabase/migrations/20260524130000_security_hardening.sql`

**Review questions**

- Are browser Supabase queries aligned with RLS policies?
- Can any authenticated non-admin mutate privileged data?
- Do role claims, profile roles, and `AuthGate` assumptions match?
- Are service-role-only operations actually confined to edge functions?
- Are nullable FK changes reflected in frontend/domain assumptions?
- Are admin summary queries safe under RLS and performant enough?
- Are generation job policies sufficient for job visibility, insertion, and worker update isolation?
- Are profile and assignment privilege escalation protections complete?

**Specific boundary to inspect**

```text
Browser Supabase client
  → db schema redex
  → authenticated JWT with redex_role claim
  → RLS helper functions
  → table policies
  → query/mutation modules
```

Generation-job boundary:

```text
authenticated Foundry author
  → submit-generation-job
  → service-role client inserts generation_jobs
  → claim_next_generation_job() service_role only
  → generation-worker updates job rows
```

**Done criteria**

- RLS policy matrix is produced for:
  - learner
  - manager
  - foundry_author
  - admin
  - service_role
- Each frontend Supabase query/mutation is mapped to required table permissions.
- Privilege escalation risks are identified or explicitly ruled out.
- Migration ordering assumptions are documented.
- Any data model mismatch between TypeScript assumptions and SQL constraints is listed.
- Any sensitive table without adequate policy is called out.

**Verification expectations**

Where execution is available:

- `supabase db push --dry-run` or equivalent migration validation, if safe.
- SQL policy smoke tests using representative JWT roles.
- Deno edge checks from CI:
  - `deno check ...`
  - `deno test ...`
- TypeScript checks for nullable fields after FK hardening.

**Synthesis requirements**

Feed the synthesis with:

- Security posture summary.
- Top data integrity risks.
- Any CEO-level “do not launch until fixed” blockers.
- Confidence level based on whether policies were only inspected or actually tested against Supabase.

---

### Specialist review item 4: Edge-function and AI-pipeline reliability review

**Reviewer lens:** Reliability/orchestration architect.

**Scope**

Primary files:

- `src/features/foundry/ai/index.ts`
- `src/features/foundry/ai/realAiClient.ts`
- `src/features/foundry/ai/courseFoundryAiClient.ts`
- `src/features/foundry/ai/aiSchemas.ts`
- `supabase/functions/submit-generation-job/index.ts`
- `supabase/functions/generation-worker/index.ts`
- `supabase/functions/drive-sync/index.ts`
- `supabase/functions/_shared/sourceBindingsWriter.ts`
- `supabase/functions/_shared/parsers.ts`

**Review questions**

- Is job submission idempotent enough for repeated clicks/retries?
- Does polling behavior handle long-running jobs, failed jobs, cancelled jobs, and missing rows?
- Can the worker safely process one stage at a time without double-running provider calls?
- Are stage transitions durable and observable?
- Are output payload keys aligned between worker and frontend client?
- Are source citation extraction, binding writes, entailment checks, and publish blockers consistent?
- Does Drive sync handle partial failures and parser invocation failures transparently?
- Are timeout and max-poll behaviors acceptable for real operators?

**Key lifecycle to inspect**

```text
realAiClient.submitGenerationJob()
  → POST /functions/v1/submit-generation-job
  → insert/reuse generation_jobs row
  → realAiClient.pollJobUntilTerminal()
  → cron/service invokes generation-worker
  → claim_next_generation_job()
  → stage execution
  → output_payload updates
  → final output validation
  → UI state update
```

**Done criteria**

- Full job state machine is documented:
  - queued
  - running
  - succeeded
  - failed
  - cancelled
- Stage map lifecycle is documented.
- Idempotency key inputs and duplicate behavior are assessed.
- Polling timeout and retry expectations are assessed.
- Failure modes are enumerated:
  - missing env
  - provider not configured
  - invalid AI output
  - worker stage failure
  - Supabase read/write failure
  - source binding failure
  - CORS misconfiguration
  - Drive API failure
- Source-grounding chain is reviewed end-to-end.
- Any mismatch between client schema validation and worker output shape is highlighted.

**Verification expectations**

Where executable:

- Deno checks/tests from CI.
- Unit tests for source binding writer.
- Edge-function local invocation tests with:
  - valid Foundry author JWT
  - learner JWT
  - missing/invalid auth
  - duplicate job submission
  - failed provider configuration
- Simulated worker progression over multiple invocations.
- Zod validation tests for representative worker outputs.

**Synthesis requirements**

Feed the synthesis with:

- Reliability readiness grade.
- AI pipeline launch blockers.
- Observability gaps.
- Recovery story for failed/stuck jobs.
- Source-grounding confidence statement.

---

### Specialist review item 5: Build, test, deploy governance review and final synthesis

**Reviewer lens:** CEO/orchestrator governance reviewer.

**Scope**

Primary files:

- `.github/workflows/ci.yml`
- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.app.json`
- `eslint.config.js`
- `netlify.toml`
- `scripts/guard-prod-mock-auth.mjs`
- `README.md`
- `docs/decisions/README.md`

**Review questions**

- Do CI gates cover the actual frontend, Supabase edge, and AI eval risk surface?
- Are production guards sufficient to prevent mock auth/data/AI deployments?
- Are CSP and security headers compatible with required Supabase/Edge/asset calls?
- Are test and coverage settings aligned with critical production behavior?
- Are Deno edge functions checked broadly enough?
- Are ADRs current enough to explain architecture/security/testing decisions?
- Does README deployment guidance match actual build scripts and edge-function requirements?

**Done criteria**

- CI gate inventory is complete.
- Missing or weak gates are listed with risk.
- Production guard behavior is assessed against Netlify environment requirements.
- CSP/security header compatibility is assessed.
- Dependency/runtime risks are noted.
- ADR/documentation drift is identified.
- Final executive synthesis is produced from all five streams.

**Verification expectations**

Where executable:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run eval`
- CI-equivalent Deno checks/tests
- Production build guard negative test:
  - `NETLIFY=true VITE_MOCK_AUTH=true npm run build` should fail.
- Production build guard positive test with required real env values, using safe dummy values only if build does not contact live services.

**Synthesis requirements**

Final synthesis must include:

- Top 5 risks ranked by severity and business impact.
- Recommended sequencing:
  1. Must fix before CEO demo.
  2. Must fix before internal pilot.
  3. Must fix before production launch.
  4. Can defer.
- Confidence score for each workstream.
- Verification gaps.
- Explicit “no code changes made” note.

---

## 4. File-by-file impact

No files should be modified. The following files are **review targets only**.

### Frontend shell/auth/data seams

- `src/main.tsx`
  - Review mount/provider entry.
- `src/AppProviders.tsx`
  - Review provider ordering and auth-dependent education state.
- `src/App.tsx`
  - Review route topology, Suspense/ErrorBoundary coverage, role-gated surfaces.
- `src/hooks/use-auth.tsx`
  - Review session lifecycle, JWT role extraction, mock auth branching.
- `src/components/auth/AuthGate.tsx`
  - Review redirect/access-denied behavior and role checks.
- `src/contexts/EducationContext.tsx`
  - Review mock/Supabase progress behavior, optimistic writes, lifecycle cancellation.
- `src/lib/education/dataSource.ts`
  - Review environment-driven data source selection.
- `src/lib/education/supabaseDataProvider.ts`
  - Review facade boundary and lazy imports.

### Product surfaces

- `src/features/admin/pages/AdminDashboardPage.tsx`
- `src/features/admin/components/*`
- `src/features/foundry/pages/*.tsx`
- `src/features/source-binder/pages/*.tsx`
- `src/features/learner/pages/LearnerDashboardPage.tsx`
- `src/features/publishing/pages/ModuleVersionHistoryPage.tsx`

Review UX continuity, state dependencies, operator workflow, learner assignment/progress assumptions, and release/version governance.

### Supabase frontend integration

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/queries/*.ts`
- `src/integrations/supabase/mutations/*.ts`

Review browser query/mutation assumptions against RLS and schema constraints.

### Edge functions and SQL

- `supabase/functions/submit-generation-job/index.ts`
- `supabase/functions/generation-worker/index.ts`
- `supabase/functions/drive-sync/index.ts`
- `supabase/functions/_shared/sourceBindingsWriter.ts`
- `supabase/functions/_shared/parsers.ts`
- `supabase/migrations/20260523120000_real_rls_and_role_claims.sql`
- `supabase/migrations/20260523130000_generation_jobs.sql`
- `supabase/migrations/20260523133000_generation_jobs_hardening.sql`
- `supabase/migrations/20260524130000_security_hardening.sql`

Review auth, service-role boundaries, RLS assumptions, job lifecycle, source grounding, and migration integrity.

### Delivery/governance

- `.github/workflows/ci.yml`
- `package.json`
- `vite.config.ts`
- `tsconfig*.json`
- `eslint.config.js`
- `netlify.toml`
- `scripts/guard-prod-mock-auth.mjs`
- `README.md`
- `docs/decisions/README.md`

Review CI completeness, production guardrails, CSP, docs, and decision-record alignment.

---

## 5. Risks and migration

This review introduces no migration or breaking change. The main risk is **review incompleteness** if reviewers rely only on selected context and do not validate with tests, prior audit docs, or live Supabase behavior.

Unknowns to validate during execution:

- Whether `docs/reviews/*` findings are already resolved or still current.
- Whether real Supabase project configuration matches README requirements.
- Whether `redex` is exposed in Supabase Data API settings.
- Whether custom access-token hook consistently injects `redex_role`.
- Whether Netlify production env matches `scripts/guard-prod-mock-auth.mjs`.
- Whether cron is actually invoking `generation-worker`.

---

## 6. Implementation order

1. **Set review rules**
   - Confirm read-only scope.
   - Establish severity/confidence taxonomy.
   - Create shared finding format.

2. **Run specialist review 1: frontend architecture/routing**
   - Produce route/provider/auth matrix first because later product/security reviews depend on it.

3. **Run specialist review 2: product flow/UX**
   - Walk admin, Foundry, Source Binder, learner, and version history flows using the route map.

4. **Run specialist review 3: Supabase security/data model**
   - Map frontend access patterns to RLS policies and SQL constraints.

5. **Run specialist review 4: edge-function/AI reliability**
   - Trace job lifecycle from browser submission through worker completion and source grounding.

6. **Run specialist review 5: build/test/deploy governance**
   - Compare risks found in prior streams against CI/deploy protections.

7. **Synthesize**
   - Merge duplicate findings.
   - Resolve severity disagreements.
   - Produce top 5 executive risks.
   - Separate demo blockers from production blockers.
   - List verification gaps and confidence.

8. **Final review package**
   - Deliver executive brief.
   - Include specialist appendices.
   - Include no-change attestation.


> 💡 Continue this plan conversation with ask_oracle(chat_id: "ceo-review-plan-4BEBE8", new_chat: false)