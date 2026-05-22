# Redex Education (Redex Academy / Course Foundry)

Redex Education is the Redex Academy learning app shell with:
- Learner demo routes (`/learn`, `/learn/welcome`, `/learn/player/:moduleId`)
- Admin placeholder route (`/admin`) behind auth gating
- Local demo education data + progress context

## Tech Stack

- Vite + React 19 + TypeScript
- React Router 7 (`react-router-dom@^7`)
- Tailwind CSS + shadcn/ui
- Supabase JS client (auth scaffolding)

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run lint
npm run preview
```

## Environment

Copy `.env.example` to `.env` (or `.env.local`).

### Required for real Supabase auth

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Mock-auth mode (default scaffold)

```env
VITE_MOCK_AUTH=true
```

When `VITE_MOCK_AUTH=true`, learner/admin shell development can run without a real authenticated Supabase session.

## Routing overview

- `/` → redirects to `/learn`
- `/learn` → learner dashboard
- `/learn/welcome` → learner welcome flow
- `/learn/player` and `/learn/player/:moduleId` → module player
- `/admin` and `/admin/*` → admin placeholder (auth-gated)

## Notes

- Auth UI is intentionally deferred; `AuthGate` enforces session checks when mock auth is off.
- Supabase credentials are read from Vite env variables (`VITE_*`).
