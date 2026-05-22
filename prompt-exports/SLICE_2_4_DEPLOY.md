# Slice 2.4 — Source Library Deploy Runbook

This runbook walks an operator through deploying Slice 2.4 (Source Library & Drive Ingestion) end-to-end.

## What you'll need

- Google Cloud Console access
- Google Drive access to the Redex Drive (`Redex Education` folder)
- Supabase project admin access (`supabase` CLI authenticated to the target project)
- ~15 minutes the first time

## Part 1 — Human setup checklist (one time)

These steps are clicks in browser/Drive consoles. Code already ships in the repo.

- [ ] **GCP project**: pick or create a project (suggest: `redex-education`). Enable the Google Drive API.
- [ ] **Service account**: create one named `redex-education-drive-sync`. No IAM roles needed.
- [ ] **Service-account key**: generate a JSON key. Move it OUT of `~/Downloads/` to `~/Documents/redex-secrets/`. **Never commit it.**
- [ ] **Drive folder**: ensure `_library/` exists inside the Redex Education Drive folder. Topic subfolders inside (e.g. `hr_basics/`, `safety/`) are optional but recommended for a useful first sync.
- [ ] **Share with SA**: share the parent Redex Education folder (or just `_library/`) with the service-account email as Viewer. Uncheck "Notify people".
- [ ] **Capture the folder ID**: open `_library/` in Drive; the URL is `https://drive.google.com/drive/folders/<FOLDER_ID>`. Copy `<FOLDER_ID>`.

## Part 2 — Supabase secrets

```bash
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat ~/Documents/redex-secrets/<key-filename>.json)"
supabase secrets set GOOGLE_DRIVE_LIBRARY_FOLDER_ID=<FOLDER_ID>
```

## Part 3 — Database migration

```bash
supabase db push
```

This applies `supabase/migrations/20260522220557_source_library_v1.sql` — creates 4 tables, 2 enum types, RLS policies.

## Part 4 — Deploy edge functions

```bash
supabase functions deploy drive-sync
supabase functions deploy parse-source-file
```

## Part 5 — Smoke test

1. Visit `https://<your-app>/admin/foundry/library`
2. Click "Sync from Drive"
3. Watch the toast for the file-counts summary
4. Refresh the page; the file list should populate

If the toast shows an error, check Supabase function logs: `supabase functions logs drive-sync`.

## Notes

- **Folder ownership**: the underlying Drive files can be owned by any Google account; only Viewer share with the SA matters for sync.
- **RLS**: the migration's RLS policies allow any authenticated user. They tighten to admin-role in a later slice once profiles + roles land.
- **Idempotency**: re-running `Sync from Drive` is safe — `source_files` upserts on `drive_file_id`; `source_file_versions` upserts on `(source_file_id, head_revision_id)`.
