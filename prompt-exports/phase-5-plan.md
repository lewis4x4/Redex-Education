# Phase 5 — Brand & Theme Unification (Orchestrator Plan)

**Repo:** `/Users/brianlewis/Redex-Education`
**Branch:** `main` (5 commits ahead of origin after Phase 0–4)
**Prior phases:** See `docs/redex_education_build_bible.md` for the full record. Latest entry: Phase 4 Quiz Correctness.

## Naming guardrails
- **Redex Education** = repo / product
- **Redex Academy** = learner-facing brand
- **Redex AI Course Foundry** = admin creation engine
- **Redex Training OS** = long-term platform vision

## Standing instructions (still apply)
- Do NOT wire real AI, Supabase data, or production auth
- Do NOT introduce secrets
- Do NOT overbuild beyond scope
- Maintain TS strict + `noUncheckedIndexedAccess` cleanliness
- Use `@/lib/education` facade for domain types
- Use semantic Tailwind classes (`text-primary`, `bg-redex-red`) over hardcoded hex once tokens are in place

## Phase 5 goal

Eliminate brand drift. The codebase has at least 6 different hex values that all mean "Redex red" (`#ED1B24`, `#ed1f24`, `#e11d48`, `#c41a1e`, `#a31518`, `#b81419`). Consolidate to canonical tokens, kill the global `h1-h6 { color: white }` rule that risks white-on-white inside cards, define missing `--success`/`--warning` CSS vars, and rename stale "ANTIGRAVITY / Ops Hub" comments in `index.css`.

**Lint count won't change** (no Phase 5-tagged lint errors exist). This phase is pure visual fidelity + token hygiene.

---

## Canonical brand colors (reference — use these everywhere)

| Token | Value | Use case |
|------|------|------|
| **Redex Red** (canonical) | `#ED1B24` ≈ `hsl(357 85% 52%)` | All accent reds, brand mark, primary CTA |
| Redex Red — hover | `#C8141B` ≈ `hsl(357 81% 43%)` | Button hover state |
| Redex Red — active | `#A30F15` ≈ `hsl(357 83% 35%)` | Button active/pressed state |
| Redex Red — soft tint | `hsla(357 85% 52% / 0.10)` | Subtle bg highlight (e.g. active sidebar item) |
| Redex Black | `#08090b` ≈ `hsl(220 14% 4%)` | TopNav, headers, dark surfaces |
| Redex White | `#FFFFFF` | Card backgrounds, primary text on dark |
| Redex Off-White | `#F8F7F4` ≈ `hsl(45 18% 97%)` | Player content area background |

Use these AS-IS. No artistic license. Darker shades for hover/active should come from this table, NOT from arbitrary new hex picks like `#ed1f24` or `#b81419`.

## Hardcoded hex values to replace (do a `file_search` to find every site)
- `#ED1B24` → `text-redex-red` / `bg-redex-red` / `text-primary` / `bg-primary`
- `#ed1f24` → same as above (was a typo variant)
- `#e11d48` → same (was tailwind rose-600 substituted for brand red)
- `#c41a1e` → `bg-redex-red-hover` or `hover:bg-redex-red-hover`
- `#a31518`, `#a30f15` → `bg-redex-red-active` or `active:bg-redex-red-active`
- `#b81419` → consolidate to one of the above
- `#08090b` → `bg-redex-black`
- `#f8f7f4` → `bg-redex-offwhite`

---

## Item 1 — Theme tokens + global CSS cleanup

**Status:** `- [x]` ✅ COMPLETE (session D9C769DA-DD69-42C9-A1DC-307E5D14C091)

### What landed
- `src/index.css`: canonical Redex tokens defined (`--redex-red`, `--redex-red-hover`, `--redex-red-active`, `--redex-black`, `--redex-offwhite`); `--primary` set to Redex red HSL `357 85% 52%`; `--ring` likewise; missing `--success`, `--success-bg`, `--warning`, `--warning-bg` defined; global `h1-h6 { color: white }` removed; stale ANTIGRAVITY/Ops Hub/Sci-Fi comments renamed to "Redex Education design system"
- `tailwind.config.ts`: added `theme.extend.colors.redex.*` namespace consuming the new CSS vars
- `--brand` retained and aliased to `var(--redex-red)` (legacy compat — AuthGate's `text-brand`, `border-brand/20` still resolve cleanly)
- typecheck + build green; lint unchanged at 5+0

### Item 2 callouts
- Available semantic classes for the sweep: `bg-redex-red`, `text-redex-red`, `bg-redex-red-hover`, `bg-redex-red-active`, `bg-redex-black`, `bg-redex-offwhite`. Opacity modifiers (`bg-redex-red/10`) work.
- AuthGate uses `text-brand` / `border-brand/20` — these resolve via the legacy `--brand` alias to canonical red. **Decision needed**: migrate AuthGate to `text-redex-red` / `border-redex-red/20` for clearer semantics, OR leave `text-brand` as-is (it works). Either is fine — recommend migrate for consistency.
- **Legacy `neon-*` components in `src/index.css`** (`btn-neon-primary`, `gravity-card`, `badge-success/warning/critical/info`) still use `rgba(239, 68, 68, ...)` (tailwind red-500). These are pre-Redex-Education design-language utilities. CHECK whether any UI code consumes them via `file_search` — if zero consumers, leave them alone (Phase 7 cleanup can prune); if consumers exist, migrate them to the new tokens.

### Goal
Define the canonical token system in `src/index.css` and `tailwind.config.ts`. Don't touch any UI consumers — Item 2 owns the sweep. This phase establishes the rules.

### Concrete tasks

1. **`src/index.css` — token redefinition + cleanup**:
   - Set `--primary: 357 85% 52%` (Redex red `#ED1B24` in HSL space, since shadcn convention stores HSL channels).
   - Keep `--primary-foreground` white.
   - Add new top-level CSS vars under `:root`:
     ```css
     --redex-red: 357 85% 52%;        /* #ED1B24 */
     --redex-red-hover: 357 81% 43%;  /* #C8141B */
     --redex-red-active: 357 83% 35%; /* #A30F15 */
     --redex-black: 220 14% 4%;       /* #08090b */
     --redex-offwhite: 45 18% 97%;    /* #F8F7F4 */
     ```
   - Define the missing CSS vars referenced by `tailwind.config.ts` (the review flagged these):
     ```css
     --success: 142 71% 45%;       /* emerald-600-ish */
     --success-bg: 138 76% 97%;    /* emerald-50 */
     --warning: 38 92% 50%;        /* amber-500-ish */
     --warning-bg: 48 100% 96%;    /* amber-50-ish */
     ```
   - **Remove the global `h1, h2, h3, h4, h5, h6 { color: white }` rule.** It causes white-on-white inside light cards (Quiz, Dashboard). If headings on the dark TopNav need white text, that's already covered by the dark surface's foreground utility classes. Audit: search for any element that DOES need a globally-white heading and confirm it's been styled explicitly — if not, accept the visual regression and let the consumer fix per-component.
   - **Rename stale comments** — anything mentioning "ANTIGRAVITY", "Ops Hub", "Sci-Fi Industrial", or other pre-Redex-Education naming. Replace with current product naming (Redex Education / Redex Academy / etc.).

2. **`tailwind.config.ts` — Redex tokens**:
   - Under `theme.extend.colors`, add a `redex` namespace:
     ```ts
     redex: {
       red: 'hsl(var(--redex-red))',
       'red-hover': 'hsl(var(--redex-red-hover))',
       'red-active': 'hsl(var(--redex-red-active))',
       black: 'hsl(var(--redex-black))',
       offwhite: 'hsl(var(--redex-offwhite))',
     },
     ```
   - Keep the existing shadcn token namespace (`primary`, `secondary`, etc.) — those are still needed by the UI primitives and `--primary` now points to Redex red.
   - Do NOT remove `success`/`warning` from `theme.extend.colors` — they'll work now that Item 1 defines the CSS vars.

3. **Verification**:
   - `npm run typecheck` green
   - `npm run build` green — verify the CSS in `dist/assets/index-*.css` contains the new variables (a quick grep on the built file is fine)
   - `npm run lint` — should still be 5 errors (no Phase 5 lint errors expected; if you accidentally added one, fix it)

### Done when
- `src/index.css` has the new tokens, missing `--success`/`--warning` vars defined, no stale "ANTIGRAVITY" comments, no global `h1-h6 { color: white }` rule
- `tailwind.config.ts` has a `redex.*` namespace
- Typecheck + build green; lint still at 5

### Out of scope (Item 2 owns these)
- Any UI consumer files (TopNav, Quiz, ModulePlayer, learner pages, etc.)
- The favicon
- Hardcoded hex replacement
- Adding new component variants

---

## Item 2 — Hardcoded color replacement sweep + favicon

**Status:** `- [x]` ✅ COMPLETE (session 6E1DEDC0-E455-4D70-82FF-F623F54367F1)

### What landed
- **28 in-scope brand-hex replacements** across `src/`. Post-sweep grep for the hex set returns only 1 hit: the allowed JSDoc comment in `Quiz.tsx`.
- Files touched: `TopNav.tsx`, `NotFoundPage.tsx`, `AdminPlaceholderPage.tsx`, `ModulePlayer.tsx`, `Quiz.tsx`, `LearnerDashboardPage.tsx`, `LearnerWelcomePage.tsx`, `AuthGate.tsx`, `button.tsx`, `favicon.svg`
- **AuthGate migrated** from `text-brand` / `border-brand/20` to `text-redex-red` / `border-redex-red/20` (consistency with `redex.*` namespace)
- **Legacy `neon-*` components untouched** — `file_search` confirmed zero consumers in `src/`; Phase 7 cleanup can prune
- **Favicon replaced** with a brand-correct 4-line SVG: 32×32 viewBox, `rx="7"` rounded square at `#ED1B24`, white "R" path
- typecheck + build green; lint unchanged at 5+0
- Built CSS verified: `--redex-red`, `--redex-red-hover`, `--redex-red-active`, `.bg-redex-red`, `.hover\:bg-redex-red-hover` all shipped

### Goal
Replace every hardcoded brand hex value across the UI with the new semantic Tailwind classes from Item 1. Optimize the favicon. After Item 2, the only places `#ED1B24` (or any of its variants) should appear are: (a) the Item 1 token definitions in CSS, (b) `docs/`, (c) comments in `Quiz.tsx`'s JSDoc that explicitly call out the brand value.

### Concrete tasks

1. **Sweep all hardcoded hex** with `file_search`:
   - `#ED1B24`, `#ed1f24`, `#e11d48`, `#c41a1e`, `#a31518`, `#a30f15`, `#b81419`, `#08090b`, `#f8f7f4`, `#f8f7f3` (any variants)
   - Replace inline `style={{ ... }}` props with Tailwind classes where possible. If a value can't easily be class-ified (e.g., `linearGradient` definitions), use `hsl(var(--redex-red))` inline so it still tokenizes.
   - `bg-[#ED1B24]` → `bg-redex-red`
   - `text-[#ED1B24]` → `text-redex-red`
   - `hover:bg-[#b81419]` → `hover:bg-redex-red-hover`
   - `active:bg-[#a31518]` → `active:bg-redex-red-active`
   - `bg-[#08090b]` → `bg-redex-black`
   - `bg-[#f8f7f4]` → `bg-redex-offwhite`
   - Soft tints like `bg-[#ED1B24]/10` → `bg-redex-red/10` (the `/N` syntax still works on `redex.red` because Tailwind composes opacity on `hsl()` values when the var is in the right format).

2. **Files most likely to need work** (verify with `file_search` first):
   - `src/components/layout/TopNav.tsx` — `#08090b` bg, `#e11d48` accent (was wrong red!), brand badge swatch
   - `src/features/learner/components/Quiz.tsx` — heavy red usage (multiple variants)
   - `src/features/learner/components/ModulePlayer.tsx` — sidebar accent, progress bar, CTA buttons
   - `src/features/learner/pages/LearnerWelcomePage.tsx`
   - `src/features/learner/pages/LearnerDashboardPage.tsx`
   - `src/components/auth/AuthGate.tsx` — uses `border-brand/20`, `text-brand` (may need re-evaluation if `--brand` isn't defined yet — verify and align)
   - `src/components/layout/AppShell.tsx`
   - `src/components/layout/BreadcrumbBar.tsx`
   - `src/components/layout/NotFoundPage.tsx`
   - `src/features/admin/pages/AdminPlaceholderPage.tsx`

3. **`src/components/ui/button.tsx`** — variants:
   - The review flagged `default` and `brand` variants as duplicates. Keep them. The `brand` variant should explicitly map to `bg-redex-red text-white hover:bg-redex-red-hover active:bg-redex-red-active`.
   - `default` should remain `bg-primary text-primary-foreground` (which now ALSO equals Redex red via the `--primary` redefinition from Item 1) — so they appear visually identical for now. That's fine; Phase 6 will properly differentiate them when polymorphic typing lands.

4. **Inline `style={{ color: '#XXXXXX' }}` and `style={{ backgroundColor: ... }}`**:
   - Most are in `Quiz.tsx` for the score banner (`#15803d` / `#b91c1c` emerald/red). Those are STATUS colors, not brand red. Leave them alone — Phase 6 may revisit.
   - Brand red inline style → replace with className.

5. **Favicon** (`public/favicon.svg`):
   - The review noted it has filters/masks and a purple/blue palette inconsistent with Redex red.
   - **Decision needed**: Replace with a simple geometric "R" mark on Redex red, OR keep the existing visual and just verify palette doesn't clash.
   - **Recommendation**: Generate a minimal SVG favicon — 32×32 viewBox, white "R" on `#ED1B24` rounded square. Around 200-400 bytes. Way smaller and brand-correct.
   - If you can't safely generate SVG by hand, leave the favicon alone and add a TODO in the Build Bible's Phase 5 entry. Don't break it.

6. **Verification**:
   - `npm run typecheck` green
   - `npm run build` green; verify dist CSS contains `--redex-red` and the brand classes resolve
   - `npm run lint` — still 5 errors (no Phase 5 lint errors expected)
   - Reasoning pass: walk through `LearnerWelcomePage` → `LearnerDashboardPage` → `ModulePlayer` → `Quiz`. Mention any place where the new tokens might cause an unintended visual change (e.g., if `--primary` was previously a softer pink-red and now it's a more saturated true-red, the visual will shift).

### Done when
- `file_search` for `#ED1B24`, `#ed1f24`, `#e11d48`, `#c41a1e`, `#a31518`, `#b81419`, `#08090b`, `#f8f7f4` returns hits ONLY in: `src/index.css` (tokens), `docs/`, `_archive/`, and possibly JSDoc comments in `Quiz.tsx`
- Typecheck + build green; lint still 5
- Favicon decision documented (replaced OR deferred with TODO)

### Out of scope
- A11y polish on buttons / nav (Phase 6)
- Component refactors beyond color (Phase 6)
- Test infra (Phase 8)
- Build/security headers (Phase 7)

---

## Final verification
- `git status --short` — clean (orchestrator commits)
- `npm run typecheck` — green
- `npm run build` — green
- `npm run lint` — 5 errors + 0 warnings (unchanged from Phase 4)
- Build Bible NOT updated by sub-agents (orchestrator handles it)

## Commit cadence
- One commit per phase. Items 1 and 2 land together as the Phase 5 commit.
