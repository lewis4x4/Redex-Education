# Redex Education: Visual Fidelity Design Bar

## 1. The bar

Every Redex Education page should feel like it belongs to the same premium product. `LearnerWelcomePage` is the visual reference. The rest of the app should match in confidence, depth, hierarchy, and warmth — adjusted for the page's purpose.

## 2. Typography scale

| Role | Class | Example |
|---|---|---|
| Hero headline | `text-[34px] leading-[1.1] font-semibold tracking-[-1.75px]` | "Great to have you here, Marcus." |
| Page title (operational) | `text-2xl md:text-3xl font-semibold tracking-tight` | "Good morning, Marcus." |
| Section heading | `text-lg md:text-xl font-semibold tracking-tight` | "Continue where you left off" |
| Eyebrow | `text-sm font-semibold uppercase tracking-[3px] text-redex-red` | "WELCOME TO REDEX ACADEMY" |
| Body | `text-[15px] text-slate-600 leading-[1.45]` | "We're excited to have you on the team..." |
| Caption | `text-xs text-slate-500` | "Due in 5 days" |

## 3. Spacing scale

- **Page container vertical rhythm**: `space-y-6 md:space-y-8` between major sections.
- **Card padding tiers**: `p-5` (compact), `p-6` (default), `p-10 md:p-12` (hero).
- **Grid gaps**: `gap-4 md:gap-6` typical; `gap-3` for dense lists; `gap-8` for hero layouts.

## 4. Card depth tiers

- **Tier 1 — Default operational card**: `rounded-2xl border border-slate-200 bg-white shadow-sm`. Use for standard data display (e.g., metric cards, standard progress lists).
- **Tier 2 — Featured card**: same + slightly more shadow (`shadow-md`) + `p-6 md:p-8`. Use for the next most important action (e.g., "Continue where you left off").
- **Tier 3 — Hero card**: `bg-white rounded-3xl shadow-2xl border border-slate-100` (or `bg-gradient-to-br from-white to-redex-red/[0.04]` with `shadow-lg` for dark/brand tint). Use for the most premium moments (e.g., Welcome card, FoundryEntryCard).

## 5. Color usage

- **60/30/10 Ratio**: 60% white/light gray surfaces, 30% gray/black text, 10% Redex red accent.
- **Redex Red (`--redex-red`)**: Used for the brand mark, primary CTAs, active states, eyebrow text, and status accents.
- **Status Colors**: Use `--success` (emerald), `--warning` (amber), `--danger` (red) via tokens.
- **Never use raw hex** outside JSDoc or configurations. Always use the semantic tokens defined in `src/index.css` and `tailwind.config.ts`.

## 6. Page anatomy archetypes

- **Hero archetype** (Welcome, post-completion celebration): Eyebrow + big headline + emoji + subhead + visual journey + media moment + CTA + footer reassurance.
- **Operational archetype** (Learner Dashboard, Admin Dashboard): Eyebrow + medium headline + first-name greeting + subhead + featured card (next action) + supporting cards (status, help, metrics).
- **Form archetype** (FoundryStartPage, future setup wizard): Eyebrow + medium headline + subhead + form card with structured fields.
- **Detail archetype** (SourceBinderInputPage, future module detail): Eyebrow + medium headline + content card + action footer.
- **Immersive archetype** (ModulePlayer): Minimal chrome; content takes the screen.

## 7. Personalization standards

- **First-name greeting**: Use where a learner profile is available (`LearnerProfile`).
- **Time-based greeting**: "Good morning / afternoon / evening" based on local hour for operational dashboards.
- **Emoji**: Used sparingly and purposefully (👋 wave for welcome, ✓ for completion, 🔒 for security). No random decorative emojis.

## 8. Journey / progress visualization patterns

- **Hero journey**: 4 horizontal numbered steps with red active state and progress track.
- **Compact journey**: Vertical or horizontal list with status icons (CheckCircle for complete, animated dot for in progress, circle outline for not started) + status text. Do not just use colored text labels.
- **Progress bar**: Thin (`h-2` or `h-3`), `bg-slate-200` track, `bg-redex-red` fill.
- **Metric tile**: `AdminMetricCard` pattern with optional `variant='accent'` for the most important number.

## 9. Footer reassurance pattern

Small text under primary CTAs or at page bottom to provide security, privacy, or support reassurance.
- **Hero**: "🔒 Secure. Private. Built for your success."
- **Dashboard**: "Progress saves automatically" (below next-action card).
- **Forms**: "Your draft is saved automatically" (near submit).
- **Admin**: Subtle data-state reassurance where relevant.

## 10. Empty + loading states

- **Empty**: Friendly icon + 1-sentence explanation + optional CTA (e.g., `CourseStatusList` "All caught up" pattern).
- **Loading**: Minimal skeleton card with `animate-pulse`.

## 11. Anti-patterns (the "don't"s)

- **CRITICAL**: Don't render a red "0%" label next to an empty progress bar (looks like an error state). Use muted gray text for 0%.
- Don't render multiple H1s on one page.
- Don't use red as a background fill on more than 10% of the surface.
- Don't ship a page without an eyebrow (every page should declare its place in the product).
- Don't use raw hex colors.
- Don't use more than 2 levels of card nesting.
- Don't use generic placeholder copy ("Lorem ipsum", "Placeholder", "TODO").
- Don't use generic emoji decoration; emoji must mean something.
- **Recognition gamification**: no badge walls, point counts, streaks-as-mechanic, progress-to-next-badge, or leaderboards. Rejected for life of product. Recognition is dignified, manager-originated, and manager co-signed for peer-originated. Treat it like a Stripe receipt: clean, factual, dignified.
- **Certification moments**: weight, not confetti. No animations beyond a calm transition.
- **Redex Coach panel**: calm, not chatty or childish.
- **Lesson renderers**: authored, not dumped. Every renderer holds this bar.

## 12. v2 Design Constraints (effective 2026-05-23)

These constraints come from `docs/Redex_Education_Phase10-13_Roadmap_v2_20260523.md` and `docs/Redex_Education_Moonshot_Strategy_v2_20260523.md`.

- Recognition ships at/after pilot and stays manager-originated, factual, and restrained. It is not a gamification system.
- The certification ladder should feel earned and serious. Avoid confetti, level-up language, XP counters, and progress-to-badge loops.
- Redex Coach is a source-grounded work aid. Its UI should feel calm, cited, and operational rather than chatty or childish.
- Lesson renderers for checklist, scenario, hotspot/diagram, drag-to-order, video, practical, and text lessons must feel authored. Do not dump raw generated content into generic cards.
- Video and assessment moments should support competence, not spectacle: inline checkpoints, clear feedback, timestamped return paths, and no punitive novelty mechanics.

## 13. Per-page delta list

### `src/features/learner/pages/LearnerDashboardPage.tsx`
- [ ] **CRITICAL**: Add eyebrow above headline: "YOUR LEARNING DASHBOARD" in `text-sm font-semibold uppercase tracking-[3px] text-redex-red`.
- [ ] **RECOMMENDED**: Headline class lift to `text-2xl md:text-3xl font-semibold tracking-tight`.
- [ ] **RECOMMENDED**: Add wave emoji "👋" to greeting (or pick a different appropriate emoji based on the time of day).
- [ ] **CRITICAL**: Upgrade "Continue where you left off" card from Tier 1 to Tier 2 depth (`shadow-md`, `p-6` or `p-8`, remove `border-redex-red/20`). Consider thicker `h-3` for the progress bar.
- [ ] **CRITICAL**: Anti-pattern fix: "0%" label should be muted gray (`text-slate-500`), not red, when progress is 0.
- [ ] **CRITICAL**: "Your Onboarding Progress" list: add icons (CheckCircle for complete, animated dot for in progress, circle outline for not started) instead of just colored text labels.
- [ ] **RECOMMENDED**: "Need Help?" card depth lift; "Message Sarah" button should match the brand button style.
- [ ] **OPTIONAL**: Add subtle "Progress saves automatically" text below the Continue Training button.

### `src/features/admin/pages/AdminDashboardPage.tsx`
- [ ] **CRITICAL**: Upgrade the assignment summary footer (currently a plain text line) to a Tier 1 card, as it contains important metrics.
- [ ] **RECOMMENDED**: Ensure card depth tiers are consistent (AdminMetricCard and CourseStatusList are Tier 1).

### `src/features/assignments/pages/AssignmentAdminPage.tsx`
- **Tier rating:** Tier 1 operational.
- [ ] **RECOMMENDED**: Solid form/table structure; keep density restrained and ensure due-date/status badges use semantic tokens rather than raw color emphasis.
- [ ] **OPTIONAL**: Add a small footer reassurance that assignment changes are audited.

### `src/features/audit/pages/AuditLogPage.tsx`
- **Tier rating:** Tier 1 operational ledger.
- [ ] **RECOMMENDED**: Correct surface for dense records; preserve scanability with muted metadata and avoid turning severity/status into a red-heavy table.
- [ ] **OPTIONAL**: Add an empty-state explanation for filtered views with no events.

### `src/features/manager/pages/ManagerDashboardPage.tsx`
- **Tier rating:** Tier 2 coaching dashboard.
- [ ] **RECOMMENDED**: Manager view should read as operational coaching, not surveillance. Keep team-risk cards factual and restrained.
- [ ] **OPTIONAL**: Add a footer reassurance that progress reflects current assigned training only.

### `src/features/publishing/pages/ModuleVersionHistoryPage.tsx`
- **Tier rating:** Tier 1 audit ledger.
- [ ] **RECOMMENDED**: Version history should feel like a clean audit ledger. Prioritize version number, status, approver, and source-stale state over decorative styling.
- [ ] **OPTIONAL**: Use a compact timeline rhythm if table density starts to obscure version relationships.

### `src/features/source-binder/pages/SourceImpactReviewPage.tsx`
- **Tier rating:** Tier 2 trust-critical review.
- [ ] **CRITICAL**: Source impact is trust-critical. Changed sections, affected modules, and regeneration scope must be visually distinct without alarmist red fills.
- [ ] **RECOMMENDED**: Keep partial-regeneration actions tied to affected sections so the design reinforces v2's section-level regeneration rule.

### `src/features/foundry/pages/FoundryStartPage.tsx`
- [ ] **CRITICAL**: Update eyebrow to match brand red eyebrow style (`text-sm font-semibold uppercase tracking-[3px] text-redex-red`).
- [ ] **OPTIONAL**: Add "Your draft is saved automatically" footer reassurance near the form actions.

### `src/features/source-binder/pages/SourceBinderInputPage.tsx`
- [ ] **CRITICAL**: Update eyebrow to match brand red eyebrow style (`text-sm font-semibold uppercase tracking-[3px] text-redex-red`).
- [ ] **RECOMMENDED**: Promote the "Working draft" card to a Tier 2 Featured card (add slightly more shadow, generous padding).

### `src/features/learner/components/ModulePlayer.tsx`
- No changes — already meets bar (immersive archetype, different rules).

### `src/features/admin/components/FoundryEntryCard.tsx`
- No changes — already meets bar (hero-tier quality).
