## Final Prompt
<taskname="JWT role claim debug"/>
<task>Plan a focused debug workflow for the production JWT role-claim blocker in Redex Education. Goal: determine why Supabase Auth custom access token hook is not yielding top-level `redex_role='admin'` for `blewis@goredex.com` in production (`https://redex.education`, project ref `toghxeuhgkcrbrdxewdw`), where observed JWTs show `redex_role='learner'` or missing. Do not implement fixes; produce a stepwise diagnostic plan that cleanly separates local/CLI-verifiable checks from Supabase Dashboard/runtime evidence checks.</task>

<architecture>
- Auth claim injection runtime: `supabase/functions/custom-access-token-hook/index.ts` verifies Standard Webhooks signature, queries `redex.profiles.role` with service-role client (`db.schema='redex'`), and returns `claims.redex_role` with fallback `learner` on lookup error/invalid role.
- Auth consumption in frontend: `src/hooks/use-auth.tsx` decodes JWT `access_token` payload and reads top-level `redex_role`; `AuthGate` enforces role-based route access from `useAuth()`.
- Route protection surface: `src/App.tsx` wraps admin/foundry/manager routes in `AuthGate requiredRole=...`; sign-in and callback pages govern session establishment.
- DB role provenance: migrations define `redex.handle_new_user`, owner allowlist promotion, and RLS helper `redex.current_role()` that prefers JWT `redex_role` then profile role fallback.
- Operational setup surface: README documents required hook deploy mode (`--no-verify-jwt`), hook endpoint, and `CUSTOM_ACCESS_TOKEN_HOOK_SECRET` format; prod env guard ensures mock auth is off at build time.
</architecture>

<selected_context>
supabase/functions/custom-access-token-hook/index.ts: webhook verification, secret handling (`HOOK_SECRET.replace('v1,whsec_', '')`), `getRoleForUser()` profile lookup, `redex_role` claim injection, fallback/error logging behavior.
supabase/migrations/20260523120000_real_rls_and_role_claims.sql: `redex.current_role()` JWT-vs-profile fallback, initial `redex.handle_new_user` trigger, RLS role helper semantics.
supabase/migrations/20260524000000_owner_email_allowlist.sql: allowlist table seed (includes `blewis@goredex.com`), replacement `handle_new_user()` admin auto-elevation logic, backfill/update behavior.
supabase/migrations/20260524130000_security_hardening.sql: enables RLS on `redex.allowed_owner_emails` (relevant to privilege/escalation model and troubleshooting assumptions).
src/hooks/use-auth.tsx: token decoding and role extraction path (`getRoleFromSession`), `refreshSession()` behavior for stale-token recovery.
src/hooks/useAuth.test.tsx: expected behavior proving app trusts JWT `redex_role` over `user.app_metadata`, plus session refresh role update path.
src/components/auth/AuthGate.tsx: authorization gate decisions (`loading`, missing session redirect, role mismatch denial).
src/components/auth/AuthGate.test.tsx: branch coverage for mock/real role gating.
src/features/auth/pages/SignInPage.tsx: magic-link initiation and redirect param handling.
src/features/auth/pages/AuthCallbackPage.tsx: PKCE/hash callback exchange and auth state settle logic.
src/App.tsx: all route-level required roles; confirms where bad claim manifests as access denial.
src/AppProviders.tsx: provider wiring (`AuthProvider` wraps app).
src/hooks/auth-context.ts + src/hooks/useAuth.ts: context contract and consumer seam.
src/integrations/supabase/client.ts: browser client config (`schema: 'redex'`, session persistence/auto-refresh).
src/env.d.ts + .env.example: typed/auth env toggles including `VITE_MOCK_AUTH` and mock role.
scripts/guard-prod-mock-auth.mjs: production guard that rejects `VITE_MOCK_AUTH=true` and non-supabase/non-real config.
README.md: operator runbook for hook deploy, secret setup, hook endpoint path, dashboard manual steps.
docs/decisions/017-redex-schema-isolation.md: confirms all app tables/functions are in `redex` schema.
src/types/training.ts: canonical `Role` union used by auth gate checks.
</selected_context>

<relationships>
- Supabase Auth event -> HTTP call to `custom-access-token-hook` -> webhook signature verification -> `redex.profiles.role` lookup -> returns JWT claims with `redex_role`.
- Browser session in `use-auth.tsx` reads JWT payload -> derives `role` -> `AuthGate` compares against `requiredRole` in `App.tsx` routes.
- `redex.handle_new_user()` + `redex.allowed_owner_emails` determine persisted profile role at user creation/backfill.
- `redex.current_role()` in SQL policies uses JWT `redex_role` first, then profile fallback, then learner default; mismatch can affect both UI gating and DB RLS behavior.
- `refreshSession()` is the app’s explicit path to replace stale access tokens after role changes.
</relationships>

<ambiguities>
- Two distinct possible causes can produce the same symptom (`learner`/missing claim): (a) hook not invoked or signature mismatch; (b) hook invoked but profile lookup resolves to learner/fallback.
- Owner allowlist includes both `brian.lewis@goredex.com` and `blewis@goredex.com`; observed identity email in production must be confirmed against `auth.users` and `redex.profiles` rows.
- Secret format handling strips `v1,whsec_` prefix in code; dashboard/secret storage mismatch may break signature validation.
- Runtime endpoint misconfiguration risk: dashboard hook URL path must exactly match `/functions/v1/custom-access-token-hook`.
- Existing sessions may carry stale claims until refresh/sign-out-sign-in; symptom timing vs login timestamp is not yet established.
</ambiguities>

## Selection
- Files: 22 total (21 full, 1 codemap)
- Total tokens: 34856 (Auto view)
- Token breakdown: full 34364, codemap 492

### Files
### Selected Files
/Users/brianlewis/Redex-Education/
├── docs/
│   └── decisions/
│       └── 017-redex-schema-isolation.md — 1,330 tokens (full)
├── scripts/
│   └── guard-prod-mock-auth.mjs — 281 tokens (full)
├── src/
│   ├── components/
│   │   └── auth/
│   │       ├── AuthGate.test.tsx — 1,320 tokens (full)
│   │       └── AuthGate.tsx — 923 tokens (full)
│   ├── features/
│   │   └── auth/
│   │       └── pages/
│   │           ├── AuthCallbackPage.tsx — 1,185 tokens (full)
│   │           └── SignInPage.tsx — 947 tokens (full)
│   ├── hooks/
│   │   ├── auth-context.ts — 109 tokens (full)
│   │   ├── use-auth.tsx — 1,084 tokens (full)
│   │   ├── useAuth.test.tsx — 1,277 tokens (full)
│   │   └── useAuth.ts — 71 tokens (full)
│   ├── integrations/
│   │   └── supabase/
│   │       └── client.ts — 470 tokens (full)
│   ├── types/
│   │   └── training.ts — 7,127 tokens (full)
│   ├── App.tsx — 4,317 tokens (full)
│   ├── AppProviders.tsx — 152 tokens (full)
│   └── env.d.ts — 185 tokens (full)
├── supabase/
│   ├── functions/
│   │   └── custom-access-token-hook/
│   │       └── index.ts — 996 tokens (full)
│   └── migrations/
│       ├── 20260523120000_real_rls_and_role_claims.sql — 6,985 tokens (full)
│       ├── 20260524000000_owner_email_allowlist.sql — 971 tokens (full)
│       └── 20260524130000_security_hardening.sql — 706 tokens (full)
├── .env.example — 366 tokens (full)
└── README.md — 3,562 tokens (full)

### Codemaps
/Users/brianlewis/Redex-Education/
└── supabase/
    └── functions/
        └── _shared/
            └── parsers.ts — 492 tokens (auto)


---

## Generated Plan

## Chat Send ✅
- **Chat**: `jwt-role-claim-debug-E7897C` | **Mode**: plan

### Response
## Summary

This plan diagnoses why production Supabase Auth tokens for `blewis@goredex.com` are not receiving top-level `redex_role='admin'`. It does **not** implement fixes. The workflow separates: **local/CLI-verifiable evidence** about code, env, migrations, database state, and token contents from **Supabase Dashboard/runtime evidence** about hook configuration, deployed function behavior, logs, and fresh sign-in token issuance. The goal is to distinguish four likely classes of failure: hook not invoked, hook signature/config failure, hook invoked but profile lookup returns/falls back to learner, or browser is using stale/wrong-project tokens.

---

## Current-state analysis

### Relevant auth data/control flow

1. **User signs in**
   - `src/features/auth/pages/SignInPage.tsx`
   - Calls `supabase.auth.signInWithOtp({ email, options.emailRedirectTo })`.
   - Callback path is `/auth/callback`.

2. **Supabase Auth issues or refreshes session**
   - Supabase Auth should invoke the configured **Custom Access Token HTTP Hook** before minting the JWT.

3. **Custom access token hook runs**
   - `supabase/functions/custom-access-token-hook/index.ts`
   - Verifies Standard Webhooks signature using:

     ```ts
     HOOK_SECRET.replace("v1,whsec_", "")
     ```

   - Uses service-role Supabase client with:

     ```ts
     db: { schema: "redex" }
     ```

   - Queries:

     ```ts
     redex.profiles.role where id = userId
     ```

   - Returns:

     ```json
     {
       "claims": {
         "...existing claims": "...",
         "redex_role": "<role>"
       }
     }
     ```

   - If profile lookup errors or role is invalid/missing, it safely returns `learner`.

4. **Frontend consumes JWT**
   - `src/hooks/use-auth.tsx`
   - Decodes `session.access_token`.
   - Reads **top-level** `redex_role`.
   - Does **not** trust `user.app_metadata.redex_role`.

5. **Route authorization**
   - `src/components/auth/AuthGate.tsx`
   - Uses `role` from `useAuth()`.
   - Admin/foundry routes in `src/App.tsx` require `['admin', 'foundry_author']`.
   - If JWT says `learner` or has no claim, production admin access is denied.

### Relevant persistence/role provenance

- `supabase/migrations/20260524000000_owner_email_allowlist.sql`
  - Seeds `redex.allowed_owner_emails`, including `blewis@goredex.com`.
  - Replaces `redex.handle_new_user()` to create/update allowlisted profiles as `admin`.
  - Backfills existing `auth.users` into `redex.profiles`.
  - Promotes matching `redex.profiles.email` rows to `admin`.

- `supabase/migrations/20260524130000_security_hardening.sql`
  - Enables RLS on `redex.allowed_owner_emails`.
  - This should not block security-definer provisioning, but it matters when interpreting dashboard SQL results under different roles.

### Key ambiguity to resolve

The same symptom can come from different causes:

| Symptom | Possible cause |
|---|---|
| JWT missing `redex_role` | Hook disabled, wrong URL, wrong project, existing stale token, hook not configured for production project |
| JWT has `redex_role='learner'` | Profile row is learner/missing, hook lookup failed and fell back, deployed function differs, service-role/env/schema issue |
| Admin profile exists but token still learner | Stale token, hook not invoked on refresh, function deployed from stale code, duplicate auth user/profile mismatch |
| Login fails or hook logs 401/500 | Webhook secret mismatch, missing Edge Function secrets, verify-JWT/function config issue |

---

## Design

### Diagnostic principle

Do not start by changing code or database rows. First collect enough evidence to classify the blocker into one failure branch:

1. **Token evidence** — what claim is actually minted, for which `sub`, email, `iat`, and project.
2. **Database evidence** — what `auth.users` and `redex.profiles` say for that same `sub`.
3. **Hook configuration evidence** — whether Supabase Auth is invoking the expected function URL with the expected secret.
4. **Runtime evidence** — whether the Edge Function logs show success, signature failure, profile lookup fallback, or no invocation.
5. **Fresh-session evidence** — whether a newly minted token after sign-out/refresh differs from the observed stale token.

---

### Phase 1 — Local/CLI-verifiable checks

These checks can be done from the repo, local terminal, Supabase CLI, SQL editor, or psql. They should not require code edits.

#### 1. Confirm production app is pointed at the expected Supabase project

Validate Netlify/prod frontend is using:

```dotenv
VITE_SUPABASE_URL=https://toghxeuhgkcrbrdxewdw.supabase.co
VITE_MOCK_AUTH=false
VITE_DATA_SOURCE=supabase
VITE_AI_MODE=real
```

Purpose:

- Prevent debugging the correct Supabase project while the browser is authenticated against a different project.
- `src/integrations/supabase/client.ts` relies entirely on `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

Expected evidence:

- Production app localStorage key should resemble `sb-toghxeuhgkcrbrdxewdw-auth-token`.
- JWT issuer/project should align with `toghxeuhgkcrbrdxewdw`.

---

#### 2. Decode the observed production JWT

For the failing session, decode the access token payload and record:

```json
{
  "sub": "...",
  "email": "...",
  "role": "...",
  "redex_role": "...",
  "iat": 123,
  "exp": 123,
  "app_metadata": {}
}
```

Classify:

- `redex_role` missing → likely hook not invoked, stale token, or wrong project.
- `redex_role='learner'` → hook likely invoked or stale token contains old fallback; compare `iat`.
- `sub` not matching expected `auth.users.id` for `blewis@goredex.com` → identity/profile mismatch.

Important: compare token `iat` to:

- latest deployment time of `custom-access-token-hook`
- time custom hook was enabled in Dashboard
- time profile was promoted to `admin`

If `iat` predates any of those, the token may simply be stale.

---

#### 3. Verify migrations are applied in the linked project

Read-only SQL:

```sql
select version, name, inserted_at
from supabase_migrations.schema_migrations
where version in (
  '20260523120000',
  '20260524000000',
  '20260524130000'
)
order by version;
```

Expected:

- `20260523120000_real_rls_and_role_claims.sql`
- `20260524000000_owner_email_allowlist.sql`
- `20260524130000_security_hardening.sql`

If owner allowlist migration is absent, `blewis@goredex.com` may never have been auto-promoted/backfilled.

---

#### 4. Verify the actual Auth user row

Read-only SQL:

```sql
select
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data
from auth.users
where lower(email) = lower('blewis@goredex.com');
```

Record:

- exact `id`
- exact `email`
- whether there are duplicate/near-duplicate identities
- latest sign-in time

If no row exists for `blewis@goredex.com`, check whether production sign-in used `brian.lewis@goredex.com`, `blewis@lewisinsurance.com`, or another address.

---

#### 5. Verify matching Redex profile row by `auth.users.id`

Use the `id` from the previous step:

```sql
select
  id,
  email,
  role,
  org_id,
  manager_id,
  created_at,
  updated_at
from redex.profiles
where id = '<auth-user-id>';
```

Also check by email:

```sql
select
  id,
  email,
  role,
  org_id,
  created_at,
  updated_at
from redex.profiles
where lower(email) = lower('blewis@goredex.com');
```

Interpretation:

| Result | Meaning |
|---|---|
| Profile `id` exists and `role='admin'` | Hook should return admin unless stale token/config/runtime issue |
| Profile `id` exists and `role='learner'` | Hook is correctly returning learner; provisioning/backfill failed or did not apply to this identity |
| Profile missing by `id` | Hook falls back to learner because `.maybeSingle()` returns no role |
| Email row exists but different `id` | Allowlist/profile email exists for another identity; hook queries by user id, not email |

---

#### 6. Verify allowlist row

Read-only SQL:

```sql
select email, created_at
from redex.allowed_owner_emails
where lower(email) = lower('blewis@goredex.com');
```

Expected:

```text
blewis@goredex.com
```

If missing, owner migration did not seed or was not applied to this project.

---

#### 7. Verify active trigger/function definitions

Read-only SQL:

```sql
select pg_get_functiondef('redex.handle_new_user()'::regprocedure);
```

Confirm the body contains:

- read from `redex.allowed_owner_emails`
- `profile_role := 'admin'` for allowlisted email
- `on conflict (id) do update set role = case when allowlisted then 'admin' else redex.profiles.role end`

Check trigger binding:

```sql
select
  tgname,
  tgenabled,
  pg_get_triggerdef(oid)
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and tgname = 'on_auth_user_created';
```

Expected:

- trigger enabled
- executes `redex.handle_new_user()`

---

#### 8. Verify role helper definition

Read-only SQL:

```sql
select pg_get_functiondef('redex.current_role()'::regprocedure);
```

Expected order:

```sql
auth.jwt() ->> 'redex_role'
then redex.profiles.role
then 'learner'
```

This confirms RLS behavior but does not prove the JWT hook is working.

---

### Phase 2 — Supabase Dashboard/runtime evidence checks

These checks must be performed in Supabase Dashboard for project `toghxeuhgkcrbrdxewdw`.

#### 1. Auth Hook configuration

Dashboard path:

```text
Authentication → Hooks → Custom Access Token
```

Verify:

- Hook is enabled.
- Hook type is HTTP.
- Endpoint is exactly:

```text
https://toghxeuhgkcrbrdxewdw.supabase.co/functions/v1/custom-access-token-hook
```

- Secret shown/generated in Dashboard corresponds to the Edge Function secret `CUSTOM_ACCESS_TOKEN_HOOK_SECRET`.

Important distinction:

- Dashboard hook secret and Edge Function env secret must match.
- Code expects the stored value in `CUSTOM_ACCESS_TOKEN_HOOK_SECRET` to be compatible with:

  ```ts
  HOOK_SECRET.replace("v1,whsec_", "")
  ```

Evidence to capture:

- Screenshot or notes of enabled state, URL, and last modified time.
- Do not paste the secret value into notes.

---

#### 2. Edge Function deployment/config

Dashboard path:

```text
Edge Functions → custom-access-token-hook
```

Verify:

- Function exists in project `toghxeuhgkcrbrdxewdw`.
- It is deployed recently enough to include the current code.
- JWT verification is disabled / function was deployed with:

```bash
supabase functions deploy custom-access-token-hook --no-verify-jwt
```

Rationale:

- Supabase Auth invokes the hook before a user JWT exists.
- If function-level JWT verification blocks the request, hook execution may fail.

---

#### 3. Edge Function secrets

Dashboard path:

```text
Project Settings → Edge Functions / Secrets
```

Verify these exist:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CUSTOM_ACCESS_TOKEN_HOOK_SECRET
```

Expected behavior if missing:

| Missing secret | Runtime effect |
|---|---|
| `CUSTOM_ACCESS_TOKEN_HOOK_SECRET` | function returns 500 server configuration error |
| `SUPABASE_SERVICE_ROLE_KEY` | function returns 500 server configuration error |
| `SUPABASE_URL` | function returns 500 server configuration error |

Note: if logins are succeeding but claim is missing, the hook may not be invoked at all rather than merely missing env.

---

#### 4. Edge Function logs during controlled sign-in

Perform a controlled fresh sign-in for `blewis@goredex.com`.

Immediately inspect logs for `custom-access-token-hook`.

Evidence to record:

- timestamp
- HTTP status
- whether request reached the function
- any console output:

Expected log branches:

| Log evidence | Diagnosis |
|---|---|
| No request at sign-in time | Auth hook disabled, wrong URL, wrong project, or token not freshly minted |
| 401 + `Invalid hook signature` | Dashboard hook secret and Edge Function secret mismatch / format issue |
| 500 + missing env message | required Edge Function secret missing |
| warning `Unable to read redex profile role; defaulting to learner` | service-role query failed; inspect error details |
| 200 with no warning, token learner | profile row likely learner/missing, stale code, or mismatched user id |
| 200 with token admin | production issue was stale browser session |

---

### Phase 3 — Fresh-session browser/runtime check

Use an incognito/private window to avoid stale Supabase localStorage.

Steps:

1. Open `https://redex.education`.
2. Ensure no existing `sb-toghxeuhgkcrbrdxewdw-auth-token` localStorage value.
3. Request magic link for `blewis@goredex.com`.
4. Complete `/auth/callback`.
5. Decode the newly issued access token.
6. Record:
   - `sub`
   - `email`
   - `iat`
   - `exp`
   - top-level `redex_role`

Interpretation:

| Fresh token result | Next branch |
|---|---|
| `redex_role='admin'` | Existing observed issue was stale token/session; app refresh/sign-out path is the recovery area |
| `redex_role='learner'` and DB profile is learner | DB provisioning/backfill is root cause |
| `redex_role='learner'` and DB profile is admin | hook runtime/deploy/schema/user-id mismatch |
| missing `redex_role` and no hook logs | Auth hook configuration root cause |
| missing `redex_role` but hook logs success | inspect hook response/deployed code mismatch |

---

## File-by-file impact

No production files should be modified for this diagnostic task.

### Files to inspect/reference only

- `supabase/functions/custom-access-token-hook/index.ts`
  - Confirms hook behavior, fallback-to-learner semantics, schema selection, secret normalization, and log messages.

- `supabase/migrations/20260523120000_real_rls_and_role_claims.sql`
  - Confirms `redex.current_role()` precedence and original profile trigger.

- `supabase/migrations/20260524000000_owner_email_allowlist.sql`
  - Confirms `blewis@goredex.com` seed, admin promotion logic, and backfill behavior.

- `supabase/migrations/20260524130000_security_hardening.sql`
  - Confirms RLS on allowlist and related hardening assumptions.

- `src/hooks/use-auth.tsx`
  - Confirms frontend reads top-level JWT `redex_role`.

- `src/components/auth/AuthGate.tsx`
  - Confirms access-denied behavior for missing/learner role.

- `src/App.tsx`
  - Confirms affected admin/foundry route protection.

- `README.md`
  - Confirms documented production setup requirements for hook URL, deployment mode, secrets, and Netlify env.

- `src/integrations/supabase/client.ts`
  - Confirms browser client schema/project/env assumptions.

---

## Risks and migration

No schema or code migration is part of this plan.

Operational risks during diagnostics:

- Do not paste service-role keys, anon keys, hook secrets, or full JWTs into shared notes.
- JWT payload may be decoded, but redact signature and sensitive metadata.
- Avoid updating `redex.profiles` or `redex.allowed_owner_emails` until the failure branch is proven.
- Existing sessions can obscure results; prefer incognito or explicit sign-out/sign-in for fresh-token evidence.

---

## Implementation order

1. **Capture observed token evidence**
   - Decode current failing JWT.
   - Record `sub`, email, `iat`, and top-level `redex_role`.

2. **Confirm project alignment**
   - Verify production app uses project ref `toghxeuhgkcrbrdxewdw`.
   - Confirm browser localStorage/auth token belongs to that project.

3. **Run read-only DB checks**
   - Confirm migrations applied.
   - Confirm `auth.users` row for `blewis@goredex.com`.
   - Confirm matching `redex.profiles` row by user id.
   - Confirm allowlist row.
   - Confirm active trigger/function definitions.

4. **Check Supabase Dashboard hook configuration**
   - Verify custom access token hook enabled.
   - Verify exact endpoint URL.
   - Verify Edge Function exists and JWT verification is disabled.
   - Verify required secrets exist.

5. **Perform controlled fresh sign-in**
   - Use incognito/private browser.
   - Sign in as `blewis@goredex.com`.
   - Decode newly minted token.
   - Correlate token `iat` with Edge Function logs.

6. **Classify root cause**
   - Use the decision matrix:
     - no logs → hook config/URL/project issue
     - 401 → secret mismatch
     - 500 → missing env/runtime config
     - learner + profile learner/missing → DB/profile provisioning issue
     - learner + profile admin → deployed hook/runtime/user-id mismatch
     - admin fresh token → stale session was the blocker

7. **Stop before fixing**
   - Produce a short evidence report naming the proven branch and the minimal next fix candidate.
   - Do not apply database updates, redeploy functions, or change code as part of this diagnostic plan.


## Orchestrator status — 2026-05-24

- [x] Generated diagnostic plan export.
- [x] Code-path probe complete: hook can return `redex_role: "learner"` with HTTP 200 if the `redex.profiles` service-role query errors or if no row matches `payload.user_id`; frontend does not invent learner.
- [x] Read-only CLI/runtime probe complete: local project ref is `toghxeuhgkcrbrdxewdw`; remote `custom-access-token-hook` is ACTIVE version 5 updated 2026-05-23 18:38:49 UTC; required secret names exist; required migrations are reported applied.
- [ ] Still needed: Supabase Dashboard hook URL/enabled-state proof, Edge Function logs during a fresh sign-in, fresh JWT decode (`sub`, `iat`, `redex_role`), and read-only DB row check tying `auth.users.id` to `redex.profiles.id`.

> 💡 Continue this plan conversation with ask_oracle(chat_id: "jwt-role-claim-debug-E7897C", new_chat: false)