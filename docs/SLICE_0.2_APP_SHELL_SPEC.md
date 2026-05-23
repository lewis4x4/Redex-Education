> **Status: Historical — Slice 0.2 was built and accepted.**
> Acceptance criteria in this spec are now moot. Section 9 "Correction required" items may or may not have been addressed in subsequent slices — verify by `grep` if needed. `ExperienceToggle` specified here is not present in the current codebase. This file is preserved for archeological reference.

# SLICE 0.2 — APP SHELL SPEC (Brand-Aligned)

**Status:** ready for Codex · **Date:** 2026-05-22 · **Phase:** 0 — Foundation
**Relates to:** roadmap "SLICE 0.2 — App Shell and Navigation Frame"

This document is the brand-locked spec for Slice 0.2. It supersedes the roadmap's
starter design tokens. Build the global app shell against the values below so the
brand is correct from the first commit — before any learner/admin screens exist.

---

## 1. Why this spec exists

The roadmap and Build Bible originally carried a placeholder brand red of
`#ed1f24`. The official **Redex Brand Guide v1.0** specifies `#ED1B24`. Slice 0.2
sets up the design tokens the entire app inherits — fix the value here, once, so
no component is ever built against the wrong red.

---

## 2. Locked design tokens

Define these as CSS custom properties on `:root` in `src/index.css`. These are
brand-approved — not "starting points."

```css
:root {
  /* Brand core — Redex Brand Guide v1.0 */
  --redex-red:        #ED1B24;  /* CTAs, active states, accents, logo arc. NEVER a large fill. */
  --redex-red-dark:   #C2161E;  /* hover / pressed state for red */
  --redex-black:      #000000;  /* logo letterforms, maximum-contrast text */
  --redex-white:      #FFFFFF;  /* default surface */

  /* Surfaces / neutrals */
  --bg-page:          #F4F5F7;  /* app background */
  --bg-card:          #FFFFFF;  /* cards, panels */
  --bg-dark:          #08090B;  /* top navigation bar (dark charcoal) */
  --bg-dark-soft:     #15161A;  /* dark secondary surfaces */
  --border-soft:      #E5E7EB;

  /* Text */
  --text-primary:     #09090B;  /* headings + body */
  --text-secondary:   #6B7280;  /* captions, labels (~60% black) */
  --text-on-dark:     #FFFFFF;

  /* Status */
  --success:          #16A34A;
  --warning:          #F59E0B;
  --danger:           #DC2626;
}
```

### Wiring into shadcn/ui (New York + Slate)

The repo already uses shadcn with HSL theme variables. Point shadcn's `--primary`
at the brand red so every default `<Button>` and active state is on-brand. Keep
Slate as the neutral ramp.

In `src/index.css`, inside the shadcn `:root` block:

```css
--primary: 357 85% 52%;            /* #ED1B24 in HSL */
--primary-foreground: 0 0% 100%;   /* white text on red */
--ring: 357 85% 52%;               /* focus ring = brand red */
```

In `tailwind.config.ts`, extend the theme so the raw tokens are usable directly:

```ts
extend: {
  colors: {
    redex: {
      red:      "#ED1B24",
      "red-dark": "#C2161E",
      black:    "#000000",
    },
  },
}
```

---

## 3. Typography

| Element | Font | Size | Color |
|---|---|---|---|
| H1 — page titles | Nexa Bold | 32–40px | `--text-primary` |
| H2 — section headers | Nexa Bold | 24–28px | `--text-primary` |
| H3 — subsections | Nexa Bold | 18–20px | `--text-primary` or `--redex-red` |
| Body | Inter (system sans) | 14–16px | `--text-primary` |
| Captions / labels | Inter (system sans) | 10–12px | `--text-secondary` |

**Heading font — Nexa Bold.** Brand-required for all headings, UI headers, and
CTA text. Nexa Bold is a licensed font: add `Nexa-Bold.woff2` to `public/fonts/`
and declare an `@font-face`. **DEPENDENCY:** the Nexa Bold font file is not yet in
the repo — until it is, the fallback below renders cleanly; flag this in the Build
Bible "Open Decisions" / "Known Gaps" so it is not forgotten.

```css
@font-face {
  font-family: "Nexa Bold";
  src: url("/fonts/Nexa-Bold.woff2") format("woff2");
  font-weight: 700;
  font-display: swap;
}
```

Font stacks (set in `tailwind.config.ts` `fontFamily`):

```ts
fontFamily: {
  heading: ['"Nexa Bold"', '"Helvetica Neue"', "Arial", "sans-serif"],
  sans:    ["Inter", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "sans-serif"],
}
```

Install Inter via `@fontsource/inter` (offline-reliable; no Google Fonts runtime
dependency). Apply `font-heading` to all `h1`–`h3`; `font-sans` is the body default.

**Never** use the Bitsumishi typeface anywhere in the UI — it is logo-wordmark-only.

---

## 4. Brand application rules

- **60 / 30 / 10 ratio.** ~60% white/light surfaces, ~30% black/dark (the top nav,
  text), ~10% red. Red is an accent, never a large background fill.
- **One red primary action per screen.** Every screen has exactly one dominant
  red CTA; all secondary actions are quiet (ghost/outline). This is both the brand
  ratio and the learner-experience friction rule.
- **Top navigation is dark charcoal** (`--bg-dark`), with the Redex Academy logo
  and white text.
- **Page background** is `--bg-page`; content sits on white `--bg-card` surfaces
  with soft shadows and generous radius (premium, Apple/Stripe-clean — not a
  generic LMS, not childish).
- **Logo.** Use the reversed (on-dark) Redex logo or the circle mark in the top
  nav. **DEPENDENCY:** real logo asset files are not yet in the repo — until they
  are, use a temporary mark (red rounded square, white "R") and flag it in the
  Build Bible. Favicon = the circle mark only.

---

## 5. App shell structure

Build a single shell used by every future learner, admin, and (later) manager
screen.

```
AppShell
├── TopNav            dark charcoal bar — fixed top
│   ├── Logo mark + "Redex Academy" wordmark (font-heading, white)
│   ├── (spacer)
│   └── ExperienceToggle   segmented control: [ Learner ] [ Admin ]
├── BreadcrumbBar     thin bar under the header — e.g. "Learner  ›  First-day welcome"
└── PageContainer     centered, max-width ~1180px, --bg-page, padded
        └── <Outlet/>  routed page content
```

### Files to create

```txt
src/App.tsx                              # mounts the router
src/app/router.tsx                       # route tree + lazy route groups
src/components/layout/AppShell.tsx       # TopNav + BreadcrumbBar + PageContainer + <Outlet/>
src/components/layout/TopNav.tsx
src/components/layout/ExperienceToggle.tsx
src/components/layout/BreadcrumbBar.tsx
src/components/layout/PageContainer.tsx
src/lib/navigation.ts                    # route constants + breadcrumb helpers
```

### Routing

- React Router. `/` redirects to `/learn`.
- Two route groups, lazy-loaded so the learner bundle never ships admin code:
  - `/learn/*` → learner placeholder page ("Redex Academy — learner experience").
  - `/admin/*` → admin placeholder page ("Course Foundry — admin experience").
- The **ExperienceToggle** switches between the `/learn` and `/admin` trees and
  reflects the active one (red active pill).
- Manager experience is **not** in Slice 0.2 — leave room for a third toggle
  option later, do not build it now.

### Replace the leftover prototype

`src/App.tsx` still contains the earlier CEU & License Portal prototype. Slice 0.2
replaces it with the shell + router. Remove the CEU prototype from the render path
(delete or quarantine the files); do not let it ship in the shell.

---

## 6. Acceptance criteria

- [ ] Brand tokens from §2 defined in `src/index.css`; `--primary` wired to
      `#ED1B24` (HSL `357 85% 52%`). No occurrence of `#ed1f24` anywhere.
- [ ] `font-heading` (Nexa Bold + fallback) and `font-sans` (Inter) configured;
      headings render in the heading stack.
- [ ] AppShell renders a consistent dark TopNav + BreadcrumbBar + PageContainer
      across all routes.
- [ ] Routes exist for `/learn` and `/admin` placeholder pages; `/` redirects.
- [ ] ExperienceToggle switches route groups and shows the active one.
- [ ] Leftover CEU/License prototype removed from the render path.
- [ ] Layout is clean on desktop and tablet widths.
- [ ] `npm run build` passes.
- [ ] Build Bible updated: Slice 0.2 marked complete; Nexa Bold font files and
      logo asset files recorded as open dependencies.

## 7. Do / Don't

**Do** — red only for the one primary action + active states · dark charcoal nav ·
white page and cards · Nexa Bold headings · premium spacing and soft shadows.

**Don't** — red as a large background fill · Bitsumishi anywhere in the UI ·
`#ed1f24` (the old placeholder) anywhere · build learner/admin screens in this
slice (shell only) · build the Manager experience yet.

---

## 8. Outcome

A premium, brand-correct Redex Academy shell that can immediately host the
first-day welcome screen in Slice 1.1 — with the brand red, typography, and
navigation locked so nothing downstream inherits a wrong value.

---

## 9. Correction required — wrong red already in code (found 2026-05-22)

Codex built Slice 0.2 (App Shell) and Slice 1.1 (Welcome) before this spec landed,
using placeholder reds. **Three different wrong reds are now in the source** — fix
all of them to the brand value `#ED1B24`:

| File : line | Current (wrong) | Correct |
|---|---|---|
| `src/index.css` : ~59 | `--primary: 350 89% 60%;` /* Neon Red */ | `--primary: 357 85% 52%;` /* Redex Red #ED1B24 */ |
| `src/features/learner/pages/LearnerWelcomePage.tsx` : 23 | `text-[#ed1f24]` | `text-[#ED1B24]` |
| `src/features/learner/pages/LearnerDashboardPage.tsx` : 10 | `bg-[#ed1f24]` | `bg-[#ED1B24]` |
| `src/features/learner/pages/LearnerDashboardPage.tsx` : 52 | `border-[#ed1f24]/20` | `border-[#ED1B24]/20` |
| `src/features/learner/pages/LearnerDashboardPage.tsx` : 71 | `text-[#ed1f24]` | `text-[#ED1B24]` |
| `src/features/learner/pages/LearnerDashboardPage.tsx` : 79 | `bg-[#ed1f24] hover:bg-[#c41a1e]` | `bg-[#ED1B24] hover:bg-[#C2161E]` |

**Root cause and the real fix:** components are hard-coding arbitrary hex values
(`bg-[#ed1f24]`). That is why one wrong value multiplied into five places. Do the
§2 token wiring *first* — `--primary` = `357 85% 52%`, plus a `redex.red` Tailwind
color — then replace every hard-coded red with the token (`bg-primary`,
`text-primary`, `text-redex-red`). After the pass,
`grep -ri "ed1f24\|350 89%\|c41a1e" src` must return nothing.
