# Admin Dashboard Functional Audit — 2026-05-24

**Repo**: `Redex-Education` · **Branch**: `main` · **Commit**: `86dc8da`  
**Auditor**: Read-only explore agent  
**Scope**: `/admin` dashboard, all interactive elements, routes, states, copy

---

## Executive Summary

Every metric on the live dashboard reads 0 because `redex.module_versions` is empty — the Foundry draft-persistence build (in-flight) is the root fix. However, even after that fix lands, **five P1 gaps will surface immediately**: all three status lists share identical, wrong empty-state copy; the AssignmentsEntryCard body contains developer mock text ("Marcus Chen", "local mock assignment state") that is visible in production; the assignment summary section has no CTA to act on overdue assignments; the ModuleVersionHistoryPage resolves real Supabase user IDs against a hardcoded mock list, displaying raw UUIDs; and there is no indication when a generation job is running. Eight additional P2 improvements (missing shortcuts, wildcard catch-all, skeleton loading) are batched at the end.

---

## Gap List — Priority Order

---

### P0 — Broken in Production

#### P0.1 — All metrics and lists show 0 / empty in production

| Field | Value |
|---|---|
| **Root cause** | `redex.module_versions` table is empty — Foundry draft-persistence pipeline has not been built yet |
| **Code path** | `queries/admin.ts` → `fetchModuleVersionRowsForAdmin()` → `.from('module_versions').select('*')` returns `[]` |
| **Schema** | Client correctly sets `db: { schema: 'redex' }` (`client.ts` line 48) so queries target `redex.module_versions`, not `public`. Schema is not the bug. |
| **Fix** | Land the in-flight Foundry draft persistence work so module versions get written to `redex.module_versions` on Foundry submit. After that, RLS and queries are wired correctly. |
| **Acceptance** | Creating one module via the Foundry start → source → submit flow causes the Drafts count to increment from 0 to 1 on the dashboard. |

> **Note**: The `user_training_enrollments` and `assignments` tables are also empty, which is why learners-in-progress and all assignment summary stats are also 0. These will self-populate once the module pipeline produces live content.

---

### P1 — Missing Affordances the Admin Will Hit

#### P1.1 — All three `CourseStatusList` buckets share identical, wrong empty-state copy

| Field | Value |
|---|---|
| **File** | `AdminDashboardPage.tsx` lines 101, 107, 113 |
| **What's wrong** | No `emptyMessage` or `emptyIcon` prop is passed to any of the three `<CourseStatusList>` calls. All three fall through to the component default: `"All caught up. No modules awaiting review."` with a green `CheckCircle2` icon. In production today (all tables empty), the admin sees three identical green-check banners — including on the **Drafts** and **Published** lists — which is semantically nonsensical. A green "all caught up" on the Drafts list implies nothing needs doing; a green "all caught up" on Published implies 0 published modules is a success state. |
| **Component default** | `CourseStatusList.tsx` line 43: `emptyMessage = 'All caught up. No modules awaiting review.'` |
| **Fix** | Pass per-bucket `emptyMessage` and `emptyIcon` in `AdminDashboardPage.tsx`: |

```tsx
// Drafts list (line ~101)
<CourseStatusList
  title="Drafts"
  items={summary.drafts}
  getItemHref={getModuleVersionHistoryHref}
  emptyMessage="No drafts yet — start a new module to begin."
  emptyIcon={<FileText className="h-8 w-8 text-slate-400" />}
  renderItemActions={...}
/>

// Needs review list (line ~107)
<CourseStatusList
  title="Needs review"
  items={summary.needs_review}
  getItemHref={getModuleVersionHistoryHref}
  emptyMessage="Nothing awaiting review."
  // default CheckCircle2 is fine here
/>

// Published list (line ~113)
<CourseStatusList
  title="Published"
  items={summary.published}
  getItemHref={getModuleVersionHistoryHref}
  emptyMessage="No published modules yet."
  emptyIcon={<CheckCircle2 className="h-8 w-8 text-slate-300" />}
/>
```

| **Acceptance** | In production (all-empty state), each of the three buckets shows its own distinct message and icon. No bucket shows a green checkmark unless it's the "Needs review" bucket. |

---

#### P1.2 — AssignmentsEntryCard body contains developer mock copy in production

| Field | Value |
|---|---|
| **File** | `AssignmentsEntryCard.tsx` line 30 |
| **What's wrong** | The card description reads: *"Send published onboarding modules to Marcus Chen or a new-hire group using local mock assignment state."* Both `"Marcus Chen"` (a mock fixture persona) and `"local mock assignment state"` are implementation-internal phrases that leak directly onto the production UI. |
| **Fix** | Replace with production-appropriate copy in `AssignmentsEntryCard.tsx` line 30: |

```tsx
// Replace:
Send published onboarding modules to Marcus Chen or a new-hire group using local mock assignment state.

// With:
Send published modules to individual learners or groups. Set a due date and track completion from the Assignments page.
```

| **Acceptance** | The AssignmentsEntryCard body contains no references to specific mock personas or mock infrastructure. |

---

#### P1.3 — Assignment summary section has no CTA to act on overdue assignments

| Field | Value |
|---|---|
| **File** | `AdminDashboardPage.tsx` lines ~132–165 (`<section aria-labelledby="assignment-summary-heading">`) |
| **What's wrong** | The section shows Active, Overdue, and Completion rate as numbers but provides no navigation. An admin who sees `Overdue: 3` has no direct path to the assignments page from this card — they must scroll up and click the "Open assignments" entry card, or know the URL. |
| **Fix** | Add a footer link inside the section, after the `<dl>`, mirroring the pattern of the Source Impact / Audit links: |

```tsx
<div className="mt-4 border-t border-slate-100 pt-3">
  <Link
    className="inline-flex text-sm font-semibold text-redex-red hover:underline"
    to="/admin/assignments"
  >
    Manage assignments →
  </Link>
</div>
```

| **Acceptance** | Clicking "Manage assignments →" navigates to `/admin/assignments`. Link is visible even when all counts are 0. |

---

#### P1.4 — ModuleVersionHistoryPage resolves user IDs from `MOCK_ORG_PEOPLE` — real UUIDs display as raw strings

| Field | Value |
|---|---|
| **File** | `ModuleVersionHistoryPage.tsx` lines 37–41 |
| **What's wrong** | `personName(userId)` looks up a display name in `MOCK_ORG_PEOPLE` (a static mock fixture). In production, `version.approved_by` and `version.published_by` are real Supabase auth UUIDs that will not exist in the mock list. The fallback is `return userId` — so the "Approved by" field in the version history card will display a raw UUID like `a1b2c3d4-1234-...`. |

```tsx
// ModuleVersionHistoryPage.tsx lines 37–41
function personName(userId: string | undefined): string {
  if (!userId) {
    return 'Approval pending'
  }
  return MOCK_ORG_PEOPLE.find((person) => person.id === userId)?.display_name ?? userId
  //                                                                              ^^^^^^
  //                                                               Falls back to raw UUID in production
}
```

| **Fix** | Two acceptable approaches: |
| | **Option A** (preferred): Add a `fetchProfileByUserId` batch call in `useModuleVersionHistory` to pre-fetch display names for all unique user IDs in the versions array. Store as a `Map<string, string>` and pass to `personName`. |
| | **Option B** (simpler short-term): Extend the `ModuleVersion` domain type to include a `published_by_name: string \| null` denormalized field, populated server-side in `fetchModuleVersionHistory`. |
| **Target files** | Option A: `publishing/hooks/useModuleVersionHistory.ts`, `integrations/supabase/queries/profiles.ts` |
| **Acceptance** | ModuleVersionHistoryPage shows "Brian Lewis" (or real admin display name) in the Approved by / Published by fields, not a UUID. |

---

#### P1.5 — No generation job visibility on the dashboard

| Field | Value |
|---|---|
| **Files affected** | `queries/admin.ts` (new sub-query needed), `AdminDashboardPage.tsx` or `useAdminSummary.ts` (surface the count) |
| **What's wrong** | The `redex.generation_jobs` table exists (migration `20260523130000_generation_jobs.sql`). When the Foundry submits a generation job and it's queued or running, the admin has no indication on the dashboard. In the all-empty production state, the admin might trigger multiple generations unknowingly because there's no "1 job in progress" signal. |
| **Fix** | |

1. Add `fetchPendingGenerationJobCount()` to `queries/admin.ts`:

```typescript
async function fetchPendingGenerationJobCount(): Promise<number> {
  const { count, error } = await supabase
    .from('generation_jobs')
    .select('*', { count: 'exact', head: true })
    .in('status', ['queued', 'running'])

  if (error) throw error
  return count ?? 0
}
```

2. Include in `fetchAdminSummary()`'s `Promise.all`:

```typescript
const [moduleVersions, learnersInProgress, assignmentSummary, pendingJobs] = await Promise.all([
  fetchModuleVersionRowsForAdmin(),
  fetchLearnersInProgressCount(),
  fetchAssignmentSummary(),
  fetchPendingGenerationJobCount(),
])
```

3. Add `pending_generation_jobs: number` to `AdminDashboardSummary` type (`types/training.ts`) and surface a banner in `AdminDashboardPage.tsx` when `summary.pending_generation_jobs > 0`:

```tsx
{summary.pending_generation_jobs > 0 ? (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-800">
    {summary.pending_generation_jobs} module generation{summary.pending_generation_jobs > 1 ? 's' : ''} in progress…
  </div>
) : null}
```

| **Acceptance** | When a generation job has `status='queued'` or `status='running'` in `redex.generation_jobs`, the dashboard displays a banner. Banner disappears when job completes. |

---

#### P1.6 — No direct link to the source library from the admin dashboard

| Field | Value |
|---|---|
| **File** | `AdminDashboardPage.tsx` lines ~116–122 (footer links block) |
| **What's wrong** | The route `/admin/foundry/library` exists and the `SourceLibraryPage` renders. But the dashboard provides no shortcut. To reach the source library, an admin must click "Start new module" → navigate to the source step → find the library link there. Drive sync and source file management are buried 3 clicks deep. |
| **Fix** | Add a third footer link in the Published list's footer row: |

```tsx
<div className="flex flex-wrap gap-x-4 gap-y-2">
  <Link className="inline-flex text-sm font-semibold text-redex-red hover:underline" to="/admin/source-impact">
    Source Impact Review →
  </Link>
  <Link className="inline-flex text-sm font-semibold text-redex-red hover:underline" to="/admin/foundry/library">
    Source library →
  </Link>
  <Link className="inline-flex text-sm font-semibold text-redex-red hover:underline" to="/admin/audit">
    Audit log →
  </Link>
</div>
```

| **Acceptance** | Clicking "Source library →" navigates to `/admin/foundry/library` and renders the SourceLibraryPage. |

---

### P2 — Improvements

#### P2.1 — Dashboard header eyebrow label is misleading

| Field | Value |
|---|---|
| **File** | `AdminDashboardPage.tsx` lines 38, 74 |
| **What's wrong** | Both the loading state and the loaded state render `"REDEX AI COURSE FOUNDRY"` as the eyebrow above "Welcome back." The dashboard covers assignments, learner progress, and audit — not just the Foundry. This label sets a wrong mental model for the page. `FoundryStartPage.tsx` also uses this eyebrow, which is appropriate there. |
| **Fix** | Change to `"ADMIN DASHBOARD"` on the admin dashboard page only. Keep `"REDEX AI COURSE FOUNDRY"` on Foundry sub-pages. |
| **Acceptance** | Admin dashboard header reads "ADMIN DASHBOARD". FoundryStartPage continues to read "REDEX AI COURSE FOUNDRY". |

---

#### P2.2 — Loading state has no visual skeleton — just bare text

| Field | Value |
|---|---|
| **File** | `AdminDashboardPage.tsx` lines 44–54 |
| **What's wrong** | The loading branch renders a single card with `"Loading dashboard…"` text. No shimmer, no layout skeleton matching the full page structure. The page appears to collapse to a single block then expand — jarring layout shift. |
| **Fix** | Replace with a skeleton layout: 4 grey metric card placeholders + 2 list placeholders + 1 assignment summary placeholder, all with `animate-pulse` shimmer. Can use `bg-slate-100 rounded-2xl` blocks matching actual dimensions. |
| **Acceptance** | On initial load in Supabase mode, the page shows a shimmering skeleton that occupies roughly the same layout as the populated state. No layout shift on load completion. |

---

#### P2.3 — Archived modules have no visibility on the dashboard

| Field | Value |
|---|---|
| **File** | `queries/admin.ts` line 135 (`toAdminModuleListItem` returns `null` for archived status) |
| **What's wrong** | Archived versions are silently dropped during dashboard aggregation. There is no "Archived" metric card, no list, and no count. An admin has no way to know how many archived modules exist without navigating to a specific module's version history page. |
| **Fix** | Add an `archived: number` field to `AdminDashboardMetrics`. Count it in `fetchAdminSummary()`. Surface as a 5th metric card (or a subdued badge beneath the Published list count). |
| **Acceptance** | Dashboard shows archived module count. Clicking it navigates to a filtered view or at minimum displays the count correctly. |

---

#### P2.4 — `/admin/*` wildcard route silently renders AdminDashboardPage for broken URLs

| Field | Value |
|---|---|
| **File** | `App.tsx` line ~490: `<Route path="/admin/*" element={<AdminRoute />} />` |
| **What's wrong** | Any unmatched `/admin/anything` path renders `AdminDashboardPage` instead of a 404. This will mask broken links silently — e.g., a stale link to `/admin/foundry/settings` (which doesn't exist) renders the dashboard with no error. |
| **Fix** | Replace with `<Route path="/admin/*" element={<NotFoundRoute />} />` or remove the catch-all entirely (the specific routes cover all intended paths, the global `*` catch-all handles the rest). |
| **Acceptance** | Navigating to `/admin/does-not-exist` renders the NotFoundPage. Existing `/admin` and `/admin/...` routes are unaffected. |

---

#### P2.5 — Completion rate shows "0%" when there are zero assignments

| Field | Value |
|---|---|
| **File** | `queries/admin.ts` line ~131 |
| **What's wrong** | `completion_rate_percent: total === 0 ? 0 : Math.round(...)` — when no assignments exist, shows "0%" in the UI. Zero percent completion is a misleading metric when the denominator is zero; it's not that 0% of learners completed, it's that there's nothing to measure. |
| **Fix** | Return `null` when `total === 0`. Update `AdminDashboardSummary` type: `completion_rate_percent: number \| null`. In `AdminDashboardPage.tsx`, render `"—"` when value is null. |
| **Acceptance** | Assignment summary shows `—` for completion rate when no assignments exist. Shows a real percentage once assignments are created. |

---

#### P2.6 — "Welcome back, Admin" flash when profile load races summary load

| Field | Value |
|---|---|
| **File** | `AdminDashboardPage.tsx` line 14: `const displayName = profile?.display_name ?? 'Admin'` |
| **What's wrong** | In Supabase mode, both `useProfile` and `useAdminSummary` are async. If summary resolves before profile, the heading briefly reads "Welcome back, Admin" before updating to the real name. Minor cosmetic flicker. |
| **Fix** | Gate the heading render on `profile` being resolved, or derive `displayName` from the auth session email as a better intermediate fallback (already available in `useAuth().user?.email`). |
| **Acceptance** | No visible name change after initial render. |

---

#### P2.7 — No "all modules" view or filter/search affordance

| Field | Value |
|---|---|
| **What's missing** | The three status lists (Drafts, Needs review, Published) are capped to whatever `fetchModuleVersionRowsForAdmin` returns. There's no pagination, no filter, no search. As module volume grows, the admin has no way to find a specific module quickly. There is no single "All modules" page. |
| **Fix** | Add a `/admin/modules` route with a table view showing all versions across all statuses with filter/search. Add a "All modules →" link on the dashboard. |
| **Acceptance** | Admin can navigate to a page listing all module versions with status filter and title search. |

---

#### P2.8 — No "Manage learners" / "Manage roles" entry point from the admin dashboard

| Field | Value |
|---|---|
| **What's missing** | No admin user management page exists or is linked from the dashboard. The manager dashboard is at `/manager` but that's role-specific. An admin needing to assign roles or view all users has no entry point. |
| **Fix** | Deferred to a future slice. Flag as a known gap in the roadmap. |

---

## Route Table — Full Verification

| Dashboard link / button | Target route | Route registered | Page renders | Notes |
|---|---|---|---|---|
| "Start new module →" (FoundryEntryCard) | `/admin/foundry/start` | ✅ App.tsx line ~456 | ✅ FoundryStartPage | Form submits → navigates to `/admin/foundry/source` ✅ |
| "Open assignments →" (AssignmentsEntryCard) | `/admin/assignments` | ✅ App.tsx line ~449 | ✅ AssignmentAdminPage | Mock copy in card body — see P1.2 |
| Row titles in all three lists | `/admin/modules/:moduleId/versions` | ✅ App.tsx line ~453 | ✅ ModuleVersionHistoryPage | Archive + fork buttons present ✅; personName uses mock data — see P1.4 |
| "Resume draft" button | `resumeDraftFromAdminItem()` → inferred route | ✅ store method exists | Partially ✅ | Blocked by in-flight draft persistence build |
| "Source Impact Review →" | `/admin/source-impact` | ✅ App.tsx line ~451 | ✅ SourceImpactReviewPage | ✅ |
| "Audit log →" | `/admin/audit` | ✅ App.tsx line ~450 | ✅ AuditLogPage | ✅ |
| Source library (no link exists) | `/admin/foundry/library` | ✅ App.tsx line ~481 | ✅ SourceLibraryPage | No dashboard shortcut — see P1.6 |

---

## Metric Card Data Sources

| Metric | Query | Status | Notes |
|---|---|---|---|
| Drafts | `module_versions WHERE status='draft'` | ✅ correct | Returns 0 — table empty (P0.1) |
| Needs review | `module_versions WHERE status IN ('in_review', 'approved')` | ✅ correct | Intentional — `approved` included as "admin action still needed" |
| Published | `module_versions WHERE status='published'` | ✅ correct | Returns 0 — table empty (P0.1) |
| Learners in progress | `user_training_enrollments WHERE status='active'` | ✅ correct | Returns 0 — table empty (P0.1) |
| Assignment active | `assignments WHERE status != 'completed'` | ✅ correct | Returns 0 — table empty (P0.1) |
| Assignment overdue | `assignments WHERE status='overdue' OR due_at < now()` | ✅ correct | Returns 0 — table empty (P0.1) |
| Completion rate | `completed / total * 100` | ⚠️ shows 0% vs — | See P2.5 |

---

## States Audit

| State | Triggered by | Dashboard appearance | Assessment |
|---|---|---|---|
| **Loading** | Supabase mode, first render | Header + single "Loading dashboard…" card | ⚠️ No skeleton — layout collapses (P2.2) |
| **Error** | Supabase fetch throws | Header + red error card + "Try again" button | ✅ Functional |
| **Fully empty** | All tables empty (current production) | All 0 metrics + three identical "All caught up" banners | ❌ Wrong copy, misleading icons (P1.1) |
| **Partial** | Some drafts, no published | Drafts list populated, Published shows "All caught up" | ❌ Wrong empty copy for Published bucket (P1.1) |
| **Fully populated** | Modules + enrollments + assignments exist | Full dashboard as designed | ✅ Correct |

---

## Copy Audit

| Element | Current copy | Assessment |
|---|---|---|
| Header eyebrow | "REDEX AI COURSE FOUNDRY" | ❌ Wrong context for the admin dashboard (P2.1) |
| Welcome heading | "Welcome back, {name}" | ✅ Warm and appropriate |
| Page sub-heading | "Your training operations at a glance" | ✅ Accurate |
| AssignmentsEntryCard body | "…Marcus Chen or a new-hire group using local mock assignment state" | ❌ Mock text in production (P1.2) |
| Drafts empty state | "All caught up. No modules awaiting review." | ❌ Wrong bucket context (P1.1) |
| Published empty state | "All caught up. No modules awaiting review." | ❌ Wrong — 0 published isn't success (P1.1) |
| Needs review empty state | "All caught up. No modules awaiting review." | ✅ Acceptable here |
| "Source Impact Review →" | Source Impact Review → | ✅ Clear |
| "Audit log →" | Audit log → | ✅ Clear |

---

## Scope for a Single Engineer Builder Agent

The following fixes are independent of the in-flight Foundry draft persistence work and can be shipped in one slice:

| # | Fix | File | Effort |
|---|---|---|---|
| 1 | Per-bucket empty state copy + icon | `AdminDashboardPage.tsx` (3 prop additions) | XS |
| 2 | AssignmentsEntryCard mock copy | `AssignmentsEntryCard.tsx` line 30 | XS |
| 3 | "Manage assignments →" CTA in assignment summary | `AdminDashboardPage.tsx` (~3 lines) | XS |
| 4 | "Source library →" footer link | `AdminDashboardPage.tsx` (~3 lines) | XS |
| 5 | Fix admin/* wildcard catch-all | `App.tsx` line ~490 | XS |
| 6 | Completion rate null → "—" | `queries/admin.ts` + `types/training.ts` + `AdminDashboardPage.tsx` | S |
| 7 | Generation jobs pending count + banner | `queries/admin.ts` (new fn) + `types/training.ts` + `AdminDashboardPage.tsx` | S |
| 8 | Header eyebrow relabel | `AdminDashboardPage.tsx` lines 38, 74 | XS |
| 9 | ModuleVersionHistoryPage real profile lookup | `useModuleVersionHistory.ts` + new profiles batch query | M |

**Exclude from this slice**: draft-resume flow (blocked by Foundry persistence build), skeleton loading (cosmetic, not blocking), "all modules" view (new page, separate slice).

Items 1–8 are all surgical 1–5 line edits to existing files; a single builder agent can complete them atomically. Item 9 (real profile names in version history) involves a new hook/query and should be a separate subtask.

