# Legacy Atelier / Prompt Workshop Archive

**Date archived**: 2026-05-22  
**Reason**: Targeted hygiene cleanup pass per explorer audit and Build Bible directive for repo professionalism and reduced noise.

## What was moved and why

These items were **clearly not imported or referenced by any active Redex Academy / Course Foundry source files** (verified via exhaustive import graph scan across all `src/**/*.ts*` files):

- **`legacy-atelier-components/`** (formerly root `@/`)
  - Old duplicate shadcn/ui components (`button.tsx`, `card.tsx`, `badge.tsx`) placed at physical `@/` root.
  - These were non-functional for the project because:
    - `vite.config.ts` and `tsconfig.app.json` alias `@/*` → `src/*`
    - The active, Redex-branded versions (with custom `brand` variants) live in `src/components/ui/`
    - No code ever imported from the root `@/` path.
  - Remnant of early shadcn setup / prior exploration phase (possibly tied to pre-Redex-Academy "Atelier" prompt workshop tooling).

- **`src-App.css.legacy`** (formerly `src/App.css`)
  - Default Vite + React prototype CSS (`#root`, `.logo` styles).
  - Never imported after the switch to Tailwind + custom `index.css`.
  - Remnant of the initial CEU/License Portal prototype.

- **`src-assets-legacy/`** (formerly `src/assets/`)
  - `hero.png`, `react.svg`, `vite.svg`
  - Zero references in current TSX/TS/CSS/HTML (grep confirmed).
  - Leftovers from Vite scaffolding and early CEU prototype.

- **`src-hooks-unused/use-toast.ts`**
  - Sonner-backed `useToast()` + `toast()` helpers.
  - Not imported anywhere. The app uses `<Toaster />` from `sonner` directly in `main.tsx`.
  - Classic shadcn leftover when switching toast libs.

- **`src-components-ui-unused/badge.tsx`**
  - `Badge` component (with variants).
  - No imports of `Badge` from `@/components/ui/badge` in any Redex file.
  - Only `Button` and `Card` (plus custom layout) are actively used. Badge will be re-added from shadcn when needed.

## What was NOT touched (safe boundaries)

- All actively imported modules (`use-auth`, `EducationContext`, learner components, types in `src/types/training.ts` + `lib/education/training-types.ts`, Supabase client/types, layout, etc.).
- Empty scaffolding dirs (`src/pages/`, `src/features/*/pages/`) — these align with the official feature-based roadmap and may receive code in future slices. No dead *code* to move.
- Duplicate type definitions (noted in Build Bible for future consolidation).
- Any file with inbound imports or runtime references.
- `dist/`, `node_modules/`, docs/, config files.

## Impact

- Removes visual/mental noise from the root and src/.
- Eliminates potential future import confusion or accidental use of stale copies.
- Project still builds cleanly (`npm run build` verified post-move).
- Makes the codebase feel more world-class and focused on Redex Academy + AI Course Foundry.

This was a low-risk, high-signal cleanup. Future slices can continue without legacy drag.

If any file is needed later, restore from git history or this archive.
