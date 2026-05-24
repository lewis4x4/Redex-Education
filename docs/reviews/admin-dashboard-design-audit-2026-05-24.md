# Admin Dashboard Design Audit — 2026-05-24

**Scope**: `src/features/admin/pages/AdminDashboardPage.tsx` and its direct children (`FoundryEntryCard`, `AssignmentsEntryCard`, `AdminMetricCard`, `CourseStatusList`).
**Production URL**: https://redex.education/admin
**Commit at audit**: `86dc8da` on `main`
**Auditor**: Read-only design audit (no source changes).
**References**: `docs/design-bar.md`, `docs/decisions/006-redex-brand-token-system.md`, `docs/Redex_Brand_Guide_v1.0.pdf` (pages 4–7 on color, typography, and the 60/30/10 ratio).

---

## Executive summary

The admin dashboard reads as **assembled from parts**, not as a cohesive product surface. Five things drag it down:

1. **The two CTA cards are not at visual parity.** `AssignmentsEntryCard` carries an "Assignments" red eyebrow that lifts its heading vertically; `FoundryEntryCard` has no eyebrow, so its heading sits ~26px higher and the row reads asymmetric. The bullets and buttons cascade out of alignment for the same reason. This is the user's "horrible" complaint and the horizontal-line note he drew between the two cards.
2. **The two CTA buttons render differently in real pixels.** Foundry's button bypasses the design-system `variant="brand"` and uses raw classes, which silently omits `shadow-sm` (so it sits visually flat against the pink-tinted card while Assignments has depth) and `active:bg-redex-red-active` (so pressing it does not darken to the active red the way Assignments does). This is also a violation in spirit of ADR 006's "no bypassing the brand token" rule.
3. **Empty-state copy is wrong for two of three status lists.** `CourseStatusList.emptyMessage` defaults to `"All caught up. No modules awaiting review."` and the page never overrides it. So an empty Drafts list and an empty Published list both display copy that only makes sense for "Needs review".
4. **A red "0" in the Needs review metric is an anti-pattern** explicitly called out in `docs/design-bar.md §11`: a brand-red zero on a white card reads like an error indicator, not a calm "nothing pending" state.
5. **The page has no eye-flow.** Six visually identical rows of white cards stack vertically with no surface-treatment hierarchy after the brand-red CTA row, two duplicate stat zones (top metric strip + bottom assignment summary) compete for the "glance" role, and "Source Impact Review →" / "Audit log →" hang as naked text links rather than chips. The page columns "click" between 2 / 4 / 2 / 1 with no shared grid rhythm.

Everything below is sized so a single design builder agent can do it as one slice — see **Scope for a single design builder agent** at the end.

---

## Issues, in priority order

### P0-1 — CTA row visual asymmetry (the user's "horrible" complaint)

**What's wrong**
- `src/features/admin/components/AssignmentsEntryCard.tsx:15-18` wraps the title in a `<div>` containing an eyebrow + h3:
  ```tsx
  <div>
    <p className="text-xs font-semibold uppercase tracking-[2px] text-redex-red">Assignments</p>
    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Assign training to your team</h3>
  </div>
  ```
- `src/features/admin/components/FoundryEntryCard.tsx:17` renders the title with **no eyebrow**:
  ```tsx
  <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Create a new module in Course Foundry</h3>
  ```
- Both cards share identical outer chrome (`rounded-2xl border border-redex-red/20 bg-redex-red/[0.04] p-6 shadow-sm md:p-8`), but because Assignments has the eyebrow + `mt-2` heading, its heading sits ~26px lower in its card than Foundry's. Drawing a horizontal line across the row, the two headings sit at different y-coordinates even though the cards are the same height container. The body copy, bullets, and button vertical positions all cascade out of alignment downstream.

**Recommended fix**
Add a matching eyebrow to `FoundryEntryCard` and mirror the wrapper structure. Recommended eyebrow: `"Course Foundry"` (mirrors the "Assignments" treatment; the page-level eyebrow already covers "REDEX AI COURSE FOUNDRY" so the card eyebrow should be tighter — just the product name, not the org tagline).

```tsx
// FoundryEntryCard.tsx — replace lines 16-23
<div className="flex flex-wrap items-center justify-between gap-3">
  <div>
    <p className="text-xs font-semibold uppercase tracking-[2px] text-redex-red">Course Foundry</p>
    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Create a new module</h3>
  </div>
  {isDisabled ? (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
      Coming soon
    </span>
  ) : null}
</div>
```

The heading shortens from "Create a new module in Course Foundry" to "Create a new module" because the new eyebrow now carries "Course Foundry" — avoid in-card duplication.

**Acceptance test**
At ≥`md` breakpoint, draw a horizontal line at the y-coordinate of the Foundry heading's top edge. The Assignments heading's top edge sits within ±2px of that line. The two cards' bullet-list first-row baselines align within ±2px, and the two CTA buttons' bottom edges align within ±2px.

---

### P0-2 — CTA buttons render with unequal depth and missing active state

**What's wrong**
- `src/features/admin/components/FoundryEntryCard.tsx:36-44` builds its primary button by overriding the default `Button` variant with a raw className:
  ```tsx
  <Button
    type="button"
    onClick={onStart}
    disabled={isDisabled}
    title={isDisabled ? FOUNDRY_DISABLED_TITLE : undefined}
    className="mt-6 bg-redex-red text-white hover:bg-redex-red-hover focus-visible:ring-redex-red disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
  >
    Start new module →
  </Button>
  ```
- `src/features/admin/components/AssignmentsEntryCard.tsx:36-44` uses the design-system variant:
  ```tsx
  <Button
    type="button"
    onClick={onStart}
    disabled={isDisabled}
    title={isDisabled ? ASSIGNMENTS_DISABLED_TITLE : undefined}
    variant="brand"
    className="mt-6 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
  >
    Open assignments →
  </Button>
  ```
- The canonical `brand` variant defined at `src/components/ui/button.tsx:23-25` resolves to:
  ```
  bg-redex-red text-white shadow-sm hover:bg-redex-red-hover active:bg-redex-red-active
  ```
- The Foundry raw-className button is missing **`shadow-sm`** (no resting drop shadow against the pink-tinted card; Assignments has one) and **`active:bg-redex-red-active`** (pressing it does NOT darken to the active red token; Assignments does). These are real, visible deltas — the user is correct that the buttons look different.
- This bypasses the design-system seam and contradicts ADR 006's intent ("no raw hex for Redex red in component styling paths" — the spirit being a single source of truth for brand red usage).

**Recommended fix**
Migrate `FoundryEntryCard` to `variant="brand"` and drop the redundant raw classes:

```tsx
<Button
  type="button"
  onClick={onStart}
  disabled={isDisabled}
  title={isDisabled ? FOUNDRY_DISABLED_TITLE : undefined}
  variant="brand"
  className="mt-6 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
>
  Start new module →
</Button>
```

Both cards then route through the single source of truth in `button.tsx`. If a one-off tweak is ever needed (e.g. larger size), extend the `brand` variant or use the `size` prop — never bypass `variant="brand"` with raw red classes again.

**Acceptance test**
1. Resting state: both CTA buttons show a `shadow-sm` drop shadow visible against the `bg-redex-red/[0.04]` card surface. (Currently Foundry has none.)
2. Hover: both transition to `redex-red-hover`.
3. Press-and-hold: both darken to `redex-red-active`. (Currently Foundry does not.)
4. DevTools "Computed" panel shows identical `background-color`, `box-shadow`, and `:active` rule sets for both buttons at rest.

---

### P0-3 — Empty-state copy is wrong for "Drafts" and "Published" lists

**What's wrong**
- `src/features/admin/components/CourseStatusList.tsx:39` defaults `emptyMessage` to `"All caught up. No modules awaiting review."`.
- `src/features/admin/pages/AdminDashboardPage.tsx:106-122` renders three lists — Drafts, Needs review, Published — and overrides `emptyMessage` for **none of them**.
- Result, when a list is empty (the common state in a fresh tenant or after a clean cycle):
  - **Drafts**: "All caught up. No modules awaiting review." → wrong. Drafts aren't reviewed yet; they're started or not started.
  - **Needs review**: "All caught up. No modules awaiting review." → correct.
  - **Published**: "All caught up. No modules awaiting review." → wrong. Published modules don't "await review"; they're already approved.
- The default empty icon (`CourseStatusList.tsx:90-93`) is a green `CheckCircle2`, which also reads "all done!" — wrong semantic for an empty Drafts column where you've simply never started.

**Recommended fix**
Pass per-list `emptyMessage` (and `emptyIcon` for Drafts) at the call sites in `AdminDashboardPage.tsx`:

```tsx
<CourseStatusList
  title="Drafts"
  items={summary.drafts}
  emptyMessage="No drafts in flight. Start a new module to see it here."
  emptyIcon={<FileText className="h-8 w-8 text-slate-400" />}
  getItemHref={getModuleVersionHistoryHref}
  renderItemActions={/* unchanged */}
/>
<CourseStatusList
  title="Needs review"
  items={summary.needs_review}
  // default emptyMessage is correct here
  getItemHref={getModuleVersionHistoryHref}
/>
<CourseStatusList
  title="Published"
  items={summary.published}
  emptyMessage="No published modules yet. Approved courses will appear here."
  emptyIcon={<CheckCircle2 className="h-8 w-8 text-slate-400" />}
  getItemHref={getModuleVersionHistoryHref}
/>
```

Use the existing `FileText` import for the Drafts icon (already imported in `AdminDashboardPage.tsx:1`) to signal "start here" rather than "all done". Tone both empty icons to `text-slate-400` so they don't shout green-success while showing zero.

Optional follow-up: make `emptyMessage` a **required** prop on `CourseStatusList` to prevent this regression class returning — the current default is wrong more often than right.

**Acceptance test**
With `summary.drafts === []`, the Drafts card body reads "No drafts in flight…" and shows a slate-400 `FileText` icon, not "All caught up…" with a green check. Same independently for Published. The Needs review default remains correct.

---

### P0-4 — Red "0" on the Needs review metric is an error-looking anti-pattern

**What's wrong**
- `src/features/admin/pages/AdminDashboardPage.tsx:87-93` always passes `variant="accent"` to the Needs review metric:
  ```tsx
  <AdminMetricCard
    label="Needs review"
    value={summary.metrics.needs_review}
    icon={<Eye className="h-4 w-4" />}
    variant="accent"
  />
  ```
- `src/features/admin/components/AdminMetricCard.tsx:38-44` renders the value in `text-redex-red` whenever variant is "accent" — including when the value is `0`.
- `docs/design-bar.md §11` explicitly calls this out: *"don't render a red '0%' label next to an empty progress bar (looks like an error state). Use muted gray text for 0%."* The same principle holds for any numeric metric — a red "0" on a white card looks like an alert badge, not a calm "nothing pending".

**Recommended fix**
Make the accent treatment value-aware **inside `AdminMetricCard`** (so every future caller benefits):

```tsx
// AdminMetricCard.tsx
export function AdminMetricCard({ label, value, delta, icon, variant = 'default' }: AdminMetricCardProps) {
  const numericValue = typeof value === 'number' ? value : Number(value)
  const showAccent = variant === 'accent' && Number.isFinite(numericValue) && numericValue !== 0

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</h3>
        {icon ? <div className="h-4 w-4 text-slate-400" aria-hidden="true">{icon}</div> : null}
      </div>

      <p
        className={`mt-3 text-3xl font-semibold tabular-nums tracking-tight ${
          showAccent ? 'text-redex-red' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
      {/* ...delta unchanged */}
    </Card>
  )
}
```

**Acceptance test**
With `summary.metrics.needs_review === 0`, the value renders in `text-slate-900` (slate). With `summary.metrics.needs_review === 1`, it renders in `text-redex-red`. Visual regression baseline updated.

---

### P1-1 — Title duplication between page eyebrow and Foundry card heading

**What's wrong**
- Page header at `AdminDashboardPage.tsx:78` says **"REDEX AI COURSE FOUNDRY"**.
- The Foundry card heading at `FoundryEntryCard.tsx:17` says **"Create a new module in Course Foundry"**.
- The phrase "Course Foundry" appears twice within a ~200px vertical band — once as an eyebrow, once trailing a heading. Reads redundant.

**Recommended fix**
Already covered as part of **P0-1**: shorten the Foundry card heading to "Create a new module" once the card has its own "Course Foundry" eyebrow.

**Acceptance test**
"Course Foundry" appears once in the eyebrow position of the Foundry card and once in the page header eyebrow; it does NOT appear inside the card heading text.

---

### P1-2 — Disabled-state badge copy drift between the two cards

**What's wrong**
- `FoundryEntryCard.tsx:20`: disabled badge reads `"Coming next slice"`.
- `AssignmentsEntryCard.tsx:21`: disabled badge reads `"Coming soon"`.
- Same visual chrome, different copy semantics. Even though both `isDisabled` are `false` in production today, this asymmetry will leak as soon as either card is disabled.
- `"Coming next slice"` is also engineer/roadmap language (a Linear-cycle term), not a customer-facing signal.

**Recommended fix**
Standardize on `"Coming soon"` for the user-facing badge on both cards. Update `FoundryEntryCard.tsx:20-22`.

**Acceptance test**
Both cards, when rendered with `isDisabled={true}`, display the same string in the disabled badge: `"Coming soon"`.

---

### P1-3 — `FOUNDRY_DISABLED_TITLE` tooltip leaks engineer language

**What's wrong**
- `FoundryEntryCard.tsx:11`: `const FOUNDRY_DISABLED_TITLE = 'Coming next slice — Course Foundry start flow'`.
- That string is bound to `title=` on the disabled button, so it becomes the native browser tooltip on hover — a customer-facing surface.

**Recommended fix**
Rename to user-facing copy, e.g. `'Course Foundry opens in the next release'` or `'Coming soon — Course Foundry start flow'`.

**Acceptance test**
Hovering the disabled Foundry button shows a tooltip that does NOT contain the word "slice".

---

### P1-4 — Metric icon styling is inconsistent with the assignment-summary icon chips on the same page

**What's wrong**
- `AdminMetricCard.tsx:33`: icon renders as a 16×16 `text-slate-400` glyph in the card's top-right corner, no chip background.
- `AdminDashboardPage.tsx:127-159`: the assignment summary tiles wrap each icon in a colored rounded-full chip — `bg-redex-red/[0.08] p-2 text-redex-red`, `bg-amber-50 p-2 text-amber-700`, `bg-emerald-50 p-2 text-emerald-700`.
- Two different icon design languages on a single page. Compounds the "assembled from parts" feel — and crucially, **the bottom (subordinate) section is more designed than the top (primary glance) section**. Inverted hierarchy.

**Recommended fix**
Pick one and apply it consistently. **Option A (recommended)**: keep metric cards minimal (current behavior), and downgrade the assignment summary icons to the same un-chipped slate-400 glyph treatment. This re-aligns the hierarchy so the top metric strip remains the canonical "glance" component.

In `AdminDashboardPage.tsx:127-159`, replace each `rounded-full bg-* p-2 text-*` icon wrapper with a plain glyph that matches the metric-strip treatment, e.g.:

```tsx
<div className="flex items-center gap-3">
  <Users className="h-4 w-4 text-slate-400" aria-hidden="true" />
  <div>
    <dt className="text-xs font-medium text-slate-500">Active</dt>
    <dd className="text-lg font-semibold tabular-nums text-slate-900">
      {summary.assignment_summary.active_assignments}
    </dd>
  </div>
</div>
```

(If you keep semantic color on the Overdue stat as a single nod to status — amber-700 glyph only, no chip — that's defensible; just make sure all three follow one rule.)

**Acceptance test**
The four icons in the metric strip and the three icons in the assignment summary share one chrome treatment (un-chipped, ~16px glyph) — no mix of bare glyphs and colored rounded-full chips on the same page.

---

### P1-5 — "Source Impact Review →" and "Audit log →" hang as naked text links

**What's wrong**
- `AdminDashboardPage.tsx:114-119` renders these two as bare `<Link className="inline-flex text-sm font-semibold text-redex-red hover:underline">`. They sit on a single row directly below the Published list with no surface, no separator, no chrome.
- These are operationally important entry points (Source Impact Review is "trust-critical" per `docs/design-bar.md §13`) but visually they read as footer crumbs.
- Both being brand-red also flattens the hierarchy — they should be differentiated since one is trust-critical and the other is operational.

**Recommended fix**
Promote both to small outlined chips, with differentiated trim:

```tsx
<div className="flex flex-wrap gap-2">
  <Link
    to="/admin/source-impact"
    className="inline-flex items-center gap-1.5 rounded-md border border-redex-red/30 px-3 py-1.5 text-xs font-semibold text-redex-red hover:bg-redex-red/5"
  >
    Source Impact Review →
  </Link>
  <Link
    to="/admin/audit"
    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
  >
    Audit log →
  </Link>
</div>
```

Source Impact Review keeps brand-red trim (trust-critical); Audit log goes neutral slate (operational ledger). Restores hierarchy without raising visual noise.

**Acceptance test**
The two links render as outlined chips with visible borders, sit on their own row with `gap-2` spacing, and Source Impact Review uses brand-red trim while Audit log uses neutral-slate trim.

---

### P1-6 — Stale design-bar.md delta about the admin eyebrow

**What's wrong**
- `docs/design-bar.md` per-page section says: *"`src/features/admin/pages/AdminDashboardPage.tsx`: **CRITICAL**: Update eyebrow to match brand red eyebrow style (`text-sm font-semibold uppercase tracking-[3px] text-redex-red`) instead of `text-slate-500`."*
- The page already implements that eyebrow at `AdminDashboardPage.tsx:78`. The delta is stale and falsely flags the page as out of compliance.
- Not a code bug, but it leaves a misleading TODO on the design canon that future audits will trip over.

**Recommended fix**
Strike or remove the AdminDashboardPage eyebrow TODO line in `docs/design-bar.md §13`. Leave the other TODOs in that section as-is (the assignment-summary card upgrade was already done; the "card depth tiers consistent" line is still loosely true).

**Acceptance test**
Re-reading `docs/design-bar.md §13` after the fix, the AdminDashboardPage entry no longer carries the stale "update eyebrow" TODO.

---

### P2-1 — Body subhead font size and line-height drift from design-bar

**What's wrong**
- `AdminDashboardPage.tsx:80`: `<p className="text-sm text-slate-600">Your training operations at a glance</p>`.
- `docs/design-bar.md §2` specifies body as `text-[15px] text-slate-600 leading-[1.45]`. The page uses 14px / default line-height (`text-sm`).
- Also: the heading at `AdminDashboardPage.tsx:79` is `text-3xl` (always 30px) with no `md:` step. Design-bar specifies operational page titles as `text-2xl md:text-3xl` — so the mobile rendering is one step oversized.

**Recommended fix**
Update lines 79-80 (and the matching block in the loading branch at lines 43-44):

```tsx
<h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Welcome back, {displayName}</h1>
<p className="text-[15px] leading-[1.45] text-slate-600">Your training operations at a glance</p>
```

**Acceptance test**
DevTools computed style on the subhead: `font-size: 15px; line-height: 21.75px` (1.45). Heading is 24px on `<md` viewports and 30px on `≥md`.

---

### P2-2 — Welcome line uses email local-part as the display name

**What's wrong**
- `AdminDashboardPage.tsx:16`: `const displayName = profile?.display_name ?? 'Admin'`.
- In production, `profile.display_name` for Brian is `"blewis"` (the email local part), so the page renders **"Welcome back, blewis"**. Reads like an unfinished dev string. The user mentioned this specifically.
- `docs/design-bar.md §7`: "First-name greeting: Use where a learner profile is available."

**Recommended fix**
Prefer a first-name field, fall back gracefully:

```tsx
const displayName =
  profile?.preferred_name ??
  (profile?.display_name?.includes(' ') ? profile.display_name.split(' ')[0] : profile?.display_name) ??
  'Admin'
```

This still renders "blewis" if the profile only carries the email local part — the deeper fix is a data cleanup pass (ensure `display_name` is "Brian Lewis" for the seeded admin user, ideally `preferred_name = "Brian"`). Flag that as a follow-up to the parallel functional-gap audit's lane, since profile seeding lives there.

**Acceptance test**
With `profile.display_name === 'Brian Lewis'`, the page renders "Welcome back, Brian". With `profile.preferred_name === 'Brian'`, same result. The "blewis" rendering is flagged as a data-side defect to fix outside this slice.

---

### P2-3 — No time-based greeting on an operational dashboard

**What's wrong**
- `AdminDashboardPage.tsx:79` always says "Welcome back, {name}".
- `docs/design-bar.md §7`: "Time-based greeting: 'Good morning / afternoon / evening' based on local hour for operational dashboards."
- The admin dashboard is the operational archetype explicitly mentioned in that rule; the greeting is generic.

**Recommended fix**
Inline a tiny helper at module scope:

```tsx
function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
```

Render: `<h1 ...>{greetingFor(new Date().getHours())}, {displayName}</h1>`.

**Acceptance test**
At 9am local: "Good morning, Brian." At 3pm: "Good afternoon, Brian." At 9pm: "Good evening, Brian."

---

### P2-4 — Top metric strip and bottom assignment summary duplicate the "stat zone" role

**What's wrong**
- Top strip (`AdminDashboardPage.tsx:82-99`): four metrics — Drafts / Needs review / Published / Learners in progress.
- Bottom assignment summary (`AdminDashboardPage.tsx:123-160`): three metrics — Active / Overdue / Completion rate.
- The page has **two** scattered stat zones, separated by ~250px of vertical space and three card surfaces. The bottom one has chips and feels more designed than the top one — inverted hierarchy (already covered visually in P1-4, but the underlying IA issue is duplication, not just chrome).

**Recommended fix** (do not bundle into the v1.1 slice — needs PM input)

This is an information-architecture call, not a visual fix:
- **Option A** — Merge bottom three stats into the top strip. Becomes seven tiles. Probably too dense for a glance bar. Reject.
- **Option B (recommended)** — Keep both zones, but relabel and re-weight: rename the bottom card heading from "Assignment summary" to **"Learner assignments — at a glance"** to make its role as the learner-side counterpart to the module-side top strip explicit. Combined with the P1-4 icon harmonization, this re-establishes hierarchy without dropping content.
- **Option C** — Move the assignment summary up into a small row beside the top strip on `≥xl` breakpoints, creating a single combined "glance band". Most ambitious; requires layout rework.

Defer to user before implementing. Capture as a separate ticket.

**Acceptance test (Option B, if chosen)**
The top metric strip remains the visually heaviest "glance" surface on the page. The assignment summary card explicitly labels itself as a learner-side counterpart and visually subordinates to the lists above it.

---

### P2-5 — No "Progress saves automatically" / data-state reassurance footer

**What's wrong**
- `docs/design-bar.md §9` admin entry: "Subtle data-state reassurance where relevant."
- Nothing on the page tells the admin that the data they're seeing is live or that draft work is persisted server-side. The Foundry draft-persistence feature (currently being built in a parallel agent's lane) will make this reassurance both relevant and truthful.

**Recommended fix** (defer until after the parallel Foundry draft-persistence work lands)

Add a small footer line at the bottom of the page, below the assignment summary:

```tsx
<p className="text-xs text-slate-500">
  Live data. Foundry drafts save automatically.
</p>
```

**Acceptance test**
A small footer line appears under the assignment summary confirming live data + draft persistence — only after the parallel Foundry-draft-persistence work has merged so the claim is true.

---

## Scope for a single design builder agent

Bundle the items below into one slice. It can be executed without touching the parallel functional-gap audit's lane or the Foundry draft-persistence lane.

**Files touched in this slice:**
- `src/features/admin/components/FoundryEntryCard.tsx`
- `src/features/admin/components/AssignmentsEntryCard.tsx`
- `src/features/admin/components/AdminMetricCard.tsx`
- `src/features/admin/pages/AdminDashboardPage.tsx`
- `docs/design-bar.md` (docs hygiene — strike one stale TODO)

### Buildable slice — "Admin Dashboard v1.1 visual parity pass"

1. **CTA card parity** — P0-1, P0-2, P1-1, P1-2, P1-3
   - Add a `"Course Foundry"` eyebrow + shortened `"Create a new module"` heading to `FoundryEntryCard`, mirroring `AssignmentsEntryCard`'s wrapper structure.
   - Convert Foundry's primary button to `variant="brand"` and drop the raw `bg-redex-red text-white hover:bg-redex-red-hover focus-visible:ring-redex-red` classes; keep only the disabled overrides.
   - Standardize disabled badge copy to `"Coming soon"` on both cards.
   - Rename `FOUNDRY_DISABLED_TITLE` to user-facing copy (e.g. `'Coming soon — Course Foundry start flow'`).

2. **Empty-state copy fix** — P0-3
   - Pass per-list `emptyMessage` (and slate-400 `emptyIcon`) for Drafts and Published in `AdminDashboardPage.tsx`. Leave Needs review using the default.
   - Defer the "make `emptyMessage` required" tightening to a follow-up; not in this slice.

3. **Zero-state metric fix** — P0-4
   - In `AdminMetricCard.tsx`, gate the accent (red) value treatment on `value !== 0` and `value !== '0'`. Use the `Number.isFinite(...)` guard shown above.

4. **Bottom links → chips** — P1-5
   - Re-render Source Impact Review and Audit log as outlined chips with brand-red and slate trims respectively, on a `flex flex-wrap gap-2` row.

5. **Icon-language harmonization** — P1-4
   - Strip the colored rounded-full chip backgrounds from the assignment-summary icons; render them as `text-slate-400` (or, for Overdue only, `text-amber-700`) glyphs matching the `AdminMetricCard` treatment.

6. **Header polish** — P2-1, P2-3
   - Subhead → `text-[15px] leading-[1.45] text-slate-600`.
   - Heading → `text-2xl md:text-3xl` (lose the always-30px treatment).
   - Add time-based greeting helper and render `"{greetingFor(...)}, {displayName}"`.

7. **First-name fallback** — P2-2 (cheap; bundle here)
   - Apply the prefer-first-name fallback shown above. Note in the slice PR description that the underlying `display_name === 'blewis'` data defect remains and is owned by the parallel agent's lane.

8. **Docs hygiene** — P1-6
   - Remove the stale `AdminDashboardPage.tsx` eyebrow TODO line from `docs/design-bar.md §13`.

### Out of scope for this slice (split into follow-ups)

- **P2-4** — Top/bottom stat duplication. Touches information architecture and needs PM input on whether to relabel, restructure, or leave as-is.
- **P2-5** — Data-state reassurance footer. Wait for the parallel Foundry-draft-persistence work to merge so the claim "Foundry drafts save automatically" is truthful.
- Tightening `CourseStatusList.emptyMessage` to a required prop. Independent refactor that affects other call sites; ticket separately.
- Profile-side cleanup so `display_name` resolves to "Brian Lewis" rather than "blewis". Lives in the parallel functional-gap audit's lane.

### Acceptance criteria for the whole slice

- The CTA card row, viewed at `≥md` breakpoint, has both card headings, both bullet rows' first-line baselines, and both button bottom edges aligned within ±2px.
- Both CTA buttons resolve to the same computed style at rest (`background-color: hsl(var(--redex-red))`, `color: white`, `box-shadow: var(--tw-shadow)` for `shadow-sm`), the same `:hover` (`hsl(var(--redex-red-hover))`), and the same `:active` (`hsl(var(--redex-red-active))`).
- With all three status lists empty, each empty state speaks accurate copy for its column.
- With `summary.metrics.needs_review === 0`, the Needs review value renders in `text-slate-900`, not red.
- "Source Impact Review →" and "Audit log →" render as visibly outlined chips with differentiated trim color.
- Assignment-summary icons share the un-chipped slate-400 glyph treatment with the metric-strip icons (Overdue may optionally stay amber-700 glyph, no chip).
- Greeting reads "Good morning/afternoon/evening, Brian." once the data-side first-name fix lands; until then, it reads correctly for any test profile with a multi-word `display_name`.
- `docs/design-bar.md` no longer carries the stale "update eyebrow" TODO for the admin page.

### Verification before merging

- Run `npm run test` clean (no new test failures; update snapshot or RTL assertions for any badge-copy/strings).
- Visual screenshot diff vs `86dc8da` showing: (a) the CTA row alignment, (b) the button shadow + active parity, (c) the empty Drafts/Published states with correct copy, (d) the Needs review metric showing slate "0".
- Spot-check at `<md` (mobile): the row drops to a single column, the new Foundry eyebrow + shortened heading stack correctly, the metric strip wraps to 2 cols (`md:grid-cols-2`).
- Manual click of both CTAs to confirm pressed state visibly darkens to `redex-red-active` on both, not just Assignments.

---

*End of audit.*
