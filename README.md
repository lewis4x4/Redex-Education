# Redex Education

Redex Academy (learner) + Redex AI Course Foundry (admin) — an AI-augmented training operating system for Redex employees.

**Status:** Phase 8 remediation complete · 50/50 tests passing · 81% statement coverage · Lint 0/0 · Build green

Redex Education is building a premium internal learning platform for Redex teams. Learners get a guided Redex Academy experience with clear onboarding, structured module flow, and progress visibility. Admins get the foundation for an AI-augmented course foundry that turns raw operational knowledge into approved, interactive training. Real production auth and full Supabase-backed data flows are planned but intentionally deferred.

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

## 3) Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Guard env + type-check + production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | TypeScript check only (no emit) |
| `npm run lint` | ESLint check (currently 0 errors / 0 warnings) |
| `npm test` | Run Vitest once (50/50 passing) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | V8 coverage report |

## 4) Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | When using real Supabase | Project URL (e.g. `https://your-ref.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | When using real Supabase | Public anon JWT (RLS gates access) |
| `VITE_MOCK_AUTH` | Defaults to `false` | When `true`, AuthGate bypasses session checks for demo/dev; production builds are blocked |

See [`.env.example`](./.env.example) for the template. `npm run build` rejects production builds when `VITE_MOCK_AUTH=true`.

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

## 5) Project structure

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
│   ├── features/         # Feature areas (learner, admin)
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

## 6) Routing overview

| Path | Renders | Notes |
|---|---|---|
| `/` | Redirect → `/learn` | |
| `/learn` | Learner dashboard | Default landing |
| `/learn/welcome` | First-day welcome | |
| `/learn/player[/:moduleId]` | Module player | Unknown id → redirect `/learn` |
| `/admin`, `/admin/*` | Admin placeholder | Behind `AuthGate` (Course Foundry shell) |
| `*` | NotFoundPage | |

See [Architecture](./docs/architecture.md) for the full route + provider stack.

## 7) Where to go next

- New to the codebase? → [Architecture brief](./docs/architecture.md)
- Want to contribute? → [Contributing guide](./CONTRIBUTING.md)
- Writing tests? → [Testing guide](./docs/testing.md)
- Confused about names? → [Glossary](./docs/glossary.md)
- Why was X done this way? → [Decisions (ADRs)](./docs/decisions/README.md)
- What’s the current build state? → [Build Bible](./docs/redex_education_build_bible.md)
- What’s coming next? → [Master roadmap](./docs/2025__redex-education__codex-linear-roadmap-handoff.md)
- Brand reference? → [Redex Brand Guide v1.0 (PDF)](./docs/Redex_Brand_Guide_v1.0.pdf)
