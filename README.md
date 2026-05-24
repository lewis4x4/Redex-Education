# Redex Education

Redex Academy (learner) + Redex AI Course Foundry (admin) — an AI-augmented training operating system for Redex employees.

**Status:** Phases 0–7 complete (mock vertical) · Phase 8 backend in progress (Slices 8.1–8.6 done) · **verification current as of latest Build Bible entry** · build green

Redex Education is building a premium internal learning platform for Redex teams. Learners get a guided Redex Academy experience with clear onboarding, structured module flow, and progress visibility. Admins get the foundation for an AI-augmented course foundry that turns raw operational knowledge into approved, interactive training. Real production auth and full Supabase-backed data flows are planned but intentionally deferred. Coverage baseline is re-measured against the current suite as part of each phase close-out; see [`docs/testing.md`](./docs/testing.md) for the latest run.

## 1) Project naming primer

| Name | Use for |
|---|---|
| **Redex Education** | Repo / product / docs / platform |
| **Redex Academy** | Learner-facing brand / `/learn/*` routes / public-facing copy |
| **Redex AI Course Foundry** | Admin engine / `/admin/*` routes / admin-only term |
| **Redex Training OS** | Long-term platform vision (use sparingly, mainly in glossary + ADR context) |

See [Glossary](./docs/glossary.md) for the full naming + domain vocabulary.

## 2) Quick start

```bash
git clone https://github.com/lewis4x4/Redex-Education.git
cd Redex-Education
npm install
cp .env.example .env  # then edit if you need real Supabase
npm run dev
```

**Node requirement:** `^20.19.0 || >=22.12.0`

## 3) First-time operator setup

Use this checklist when preparing the real Redex Supabase project from a fresh clone.

### Supabase project link

```bash
supabase link --project-ref toghxeuhgkcrbrdxewdw
```

### Database migrations

```bash
supabase db push --linked
```

### Edge functions deploy

Deploy all five Edge Functions. `generation-worker` is invoked by cron/service role, and `custom-access-token-hook` is called by Supabase Auth, so both are deployed without JWT verification.

```bash
supabase functions deploy drive-sync
supabase functions deploy parse-source-file
supabase functions deploy submit-generation-job
supabase functions deploy generation-worker --no-verify-jwt
supabase functions deploy custom-access-token-hook --no-verify-jwt
```

### Required secrets

Set Edge Function secrets with `supabase secrets set ...`. These values live in Supabase, not in browser `.env` files.

| Name | Purpose | Example value |
|---|---|---|
| `GOOGLE_DRIVE_LIBRARY_FOLDER_ID` | Google Drive `_library/` folder to sync | `1AbCdEfGhIjKlMn...` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full service-account key JSON; grant the service account Viewer on the Drive folder | `"$(cat ~/keys/redex-drive-service-account.json)"` |
| `AI_PROVIDER_API_KEY` | Anthropic or OpenAI provider key used only by Edge Functions | `sk-ant-...` or `sk-proj-...` |
| `AI_PROVIDER` | AI provider selector; defaults to Anthropic when unset | `anthropic` or `openai` |
| `AI_MODEL` | Provider model override | `claude-sonnet-4-5` default, or `gpt-5` for OpenAI |
| `CUSTOM_ACCESS_TOKEN_HOOK_SECRET` | Supabase Dashboard-generated HTTP hook secret | `v1,whsec_...` |
| `ALLOWED_ORIGINS` | CSV of allowed browser origins for Edge Function CORS; defaults to `*` when unset | `http://localhost:5173,https://education.goredex.com` |

Optional/server-provided Edge Function env vars used by the codebase:

| Name | Purpose | Example value |
|---|---|---|
| `AI_INPUT_COST_CENTS_PER_MILLION_TOKENS` | Override input-token cost accounting; defaults are 300 for Anthropic Sonnet 4.5 and 125 for OpenAI `gpt-5`, in cents per million | `300` |
| `AI_OUTPUT_COST_CENTS_PER_MILLION_TOKENS` | Override output-token cost accounting; defaults are 1500 for Anthropic Sonnet 4.5 and 1000 for OpenAI `gpt-5`, in cents per million | `1500` |
| `AI_MAX_TOKENS` | Override non-entailment generation max tokens | `4096` |
| `SUPABASE_URL` | Supabase-provided project URL inside Edge Functions | `https://toghxeuhgkcrbrdxewdw.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase-provided service-role key inside Edge Functions; never expose in browser code | `<service-role-jwt>` |

Example secret command:

```bash
supabase secrets set \
  GOOGLE_DRIVE_LIBRARY_FOLDER_ID="<drive-folder-id>" \
  GOOGLE_SERVICE_ACCOUNT_JSON="$(cat ~/path/to/service-account.json)" \
  AI_PROVIDER="anthropic" \
  AI_MODEL="claude-sonnet-4-5" \
  AI_PROVIDER_API_KEY="<sk-ant-or-sk-proj-key>" \
  CUSTOM_ACCESS_TOKEN_HOOK_SECRET="v1,whsec_<dashboard-generated-secret>" \
  ALLOWED_ORIGINS="http://localhost:5173,https://<your-production-domain>"
```

### Supabase Dashboard manual steps

1. **Authentication → URL Configuration → Redirect URLs**: add `http://localhost:5173/**` and the production URL, for example `https://<your-production-domain>/**`.
2. **Authentication → Hooks → Custom Access Token**: enable the HTTP hook pointing at `https://toghxeuhgkcrbrdxewdw.supabase.co/functions/v1/custom-access-token-hook`; use the Dashboard-generated secret that starts with `v1,whsec_`.
3. **Authentication → Emails → SMTP Settings**: configure Resend or the chosen SMTP provider so magic-link email delivery is reliable.

### pg_cron schedule

Run once in the Supabase SQL editor after deploying `generation-worker`. Replace placeholders with the real project ref and service-role key. Do not commit service-role secrets.

```sql
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'redex-generation-worker',
  '* * * * *',
  $$
    select net.http_post(
      url := 'https://<project-ref>.supabase.co/functions/v1/generation-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);
```

### Owner-email allowlist

Migration `20260524000000_owner_email_allowlist.sql` creates `redex.allowed_owner_emails`, seeds Brian's owner emails, auto-elevates matching new sign-ins to `admin`, and backfills missing profiles for existing `auth.users`.

To add more owners later:

```sql
insert into redex.allowed_owner_emails (email)
values (lower('new.owner@goredex.com'))
on conflict do nothing;

update redex.profiles
set role = 'admin'
where lower(email) = lower('new.owner@goredex.com');
```

### Netlify production environment

Production deploys auto-build from `main`, but the operator must set the browser-safe Vite env vars in Netlify before cutting over real auth/data/AI. The agent cannot set these values.

Netlify Dashboard → Site configuration → Environment variables (must set **all**):

```dotenv
VITE_SUPABASE_URL=https://toghxeuhgkcrbrdxewdw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh... # public anon key only; never service_role
VITE_MOCK_AUTH=false
VITE_DATA_SOURCE=supabase
VITE_AI_MODE=real
```

Then trigger a redeploy: Deploys tab → Trigger deploy → **Clear cache and deploy site**.

The production build guard fails Netlify builds with a clear error when mock/demo settings are missing or active (`VITE_MOCK_AUTH=true`, `VITE_DATA_SOURCE` unset/non-`supabase`, or `VITE_AI_MODE` unset/non-`real`). Local dev builds are not blocked unless `NODE_ENV=production` or `NETLIFY=true` is set.

### `.env` setup

Frontend `.env` values are public Vite configuration only. Copy the template, fill in the Supabase public URL and anon key, and switch to real backends for production-like usage.

```bash
cp .env.example .env
```

```dotenv
VITE_SUPABASE_URL=https://toghxeuhgkcrbrdxewdw.supabase.co
VITE_SUPABASE_ANON_KEY=<public-anon-key>
VITE_MOCK_AUTH=false
VITE_DATA_SOURCE=supabase
VITE_AI_MODE=real
```

## 4) Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Guard env + type-check + production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | TypeScript check only (no emit) |
| `npm run lint` | ESLint check (currently 0 errors / 0 warnings) |
| `npm test` | Run Vitest once (619+ passing mock-mode baseline) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | V8 coverage report |

## 5) Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | When using real Supabase | Project URL (e.g. `https://your-ref.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | When using real Supabase | Public anon JWT (RLS gates access) |
| `VITE_DATA_SOURCE` | Defaults to `mock` | Set to `supabase` to route facade helpers through the redex-schema Supabase read/write layer. |
| `VITE_AI_MODE` | Defaults to `mock` | Set to `real` only after the Course Foundry generation edge functions are deployed. Mock mode preserves the existing demo generation behavior. |
| `VITE_MOCK_AUTH` | Defaults to `false` | When `true`, AuthGate bypasses session checks for demo/dev; production builds are blocked |
| `VITE_MOCK_AUTH_ROLE` | Defaults to `admin` | Mock-mode role used by AuthGate required-role checks (`admin`, `foundry_author`, `manager`, or `learner`) |

See [`.env.example`](./.env.example) for the template. `npm run build` runs the production guard; when `NODE_ENV=production` or `NETLIFY=true`, it rejects mock auth, mock/unset data source, and mock/unset AI mode.

## Source Library setup (Slice 2.4)

The Course Foundry's primary source-material intake is a Google Drive folder named `_library/`, ingested by two Supabase Edge Functions: `drive-sync` and `parse-source-file`.

**Required secrets (Supabase Edge Function env — NOT frontend .env):**

- `GOOGLE_SERVICE_ACCOUNT_JSON` — full JSON contents of a Google Cloud service-account key file
- `GOOGLE_DRIVE_LIBRARY_FOLDER_ID` — the Drive folder ID of `_library/`

**Set via Supabase CLI:**

```bash
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat ~/path/to/key.json)"
supabase secrets set GOOGLE_DRIVE_LIBRARY_FOLDER_ID=<your-folder-id>
```

These secrets are read by edge functions only — they NEVER reach the browser. The frontend `.env` does NOT need them. See [SLICE_2_4_DEPLOY.md](./prompt-exports/SLICE_2_4_DEPLOY.md) for the full deploy runbook.

## 6) Project structure

```text
Redex-Education/
├── .omx/                 # Local OMX runtime state, logs, metrics
├── _archive/             # Archived legacy pre-Redex materials
├── coverage/             # Generated test coverage reports (HTML/JSON)
├── docs/                 # Roadmap, build bible, blueprint, brand guide, specs
├── prompt-exports/       # Orchestrator plan exports (transient)
├── public/               # Static assets served directly
├── src/                  # Application source
│   ├── components/       # Shared UI/layout/auth components
│   ├── contexts/         # Context providers and context types
│   ├── features/         # Feature areas (admin, assignments, audit, foundry, learner, manager, progress, publishing, source-binder)
│   ├── hooks/            # Public hook seams (auth, education)
│   ├── integrations/     # External boundaries (Supabase)
│   ├── lib/              # Domain facade + utilities
│   ├── test/             # Test setup and smoke tests
│   └── types/            # Canonical domain types
├── .env.example          # Environment template
├── package.json          # Scripts, engines, dependencies
├── netlify.toml          # Netlify headers/config
└── vite.config.ts        # Vite + Vitest config
```

## 7) Routing overview

| Path | Renders | Notes |
|---|---|---|
| `/` | Redirect → `/learn` | |
| `/learn` | Learner dashboard | Default landing |
| `/learn/welcome` | First-day welcome | |
| `/learn/player[/:moduleId]` | Module player | Unknown id → redirect `/learn` |
| `/sign-in` | Minimal Supabase magic-link sign-in | Used when real auth is enabled and a protected route has no session |
| `/admin`, `/admin/*` | Admin surfaces | Behind `AuthGate` (`admin` / `foundry_author`) |
| `/manager` | Manager dashboard | Behind `AuthGate` (`manager` / `admin`) |
| `*` | NotFoundPage | |

This table is partial. See [Architecture §3](./docs/architecture.md#3-route-table) for the full route table (20+ routes across learner / admin / foundry / publishing / manager / audit / source-impact surfaces).

## 8) Where to go next

- New to the codebase? → [Architecture brief](./docs/architecture.md)
- Want to contribute? → [Contributing guide](./CONTRIBUTING.md)
- Writing tests? → [Testing guide](./docs/testing.md)
- Confused about names? → [Glossary](./docs/glossary.md)
- Why was X done this way? → [Decisions (ADRs)](./docs/decisions/README.md)
- What’s the current build state? → [Build Bible](./docs/redex_education_build_bible.md)
- What’s coming next? → [Master roadmap v1](./docs/2025__redex-education__codex-linear-roadmap-handoff.md) for Phases 0–9.x; [Phase 10–13 Roadmap v2](./docs/Redex_Education_Phase10-13_Roadmap_v2_20260523.md) + [Moonshot Strategy v2](./docs/Redex_Education_Moonshot_Strategy_v2_20260523.md) for Phase 10+ (v2 supersedes v1 for Phase 10+)
- Brand reference? → [Redex Brand Guide v1.0 (PDF)](./docs/Redex_Brand_Guide_v1.0.pdf)
