# Phase 6 — UI Primitives & A11y (Orchestrator Plan)

**Repo:** `/Users/brianlewis/Redex-Education`
**Branch:** `main` (6 commits ahead of origin after Phase 0–5)
**Prior phases:** See `docs/redex_education_build_bible.md`. Latest: Phase 5 Brand & Theme Unification — canonical `redex.*` Tailwind tokens, `#ED1B24` everywhere, no more global heading-white rule.

## Naming guardrails
- **Redex Education** = repo / product
- **Redex Academy** = learner-facing brand
- **Redex AI Course Foundry** = admin creation engine
- **Redex Training OS** = long-term platform vision

## Standing instructions
- Do NOT wire real AI, Supabase data, or production auth
- Do NOT introduce secrets
- Do NOT overbuild beyond scope
- Maintain TS strict + `noUncheckedIndexedAccess` cleanliness — no `!` or `as` suppressions
- Use `@/lib/education` facade for domain types
- Use semantic Tailwind classes from the Phase 5 `redex.*` namespace (no fresh hex literals)

## Phase 6 goal

Land the accessibility and primitive-typing fixes from the original review. After Phase 6:
- All forwardRef'd primitives carry the right ref element type
- The `Button` API differentiates neutral vs brand variants and is polymorphic-safe when `asChild` is used
- Navigation landmarks exist where the review flagged them missing (`Breadcrumb`)
- Disabled-state UX in `ModulePlayer` sidebar communicates to screen readers
- Quiz options expose proper radio-group semantics to assistive tech
- Text lessons render real markdown (sanitized), not escaped plain text

**Lint target after Phase 6:** still ≤ 5 errors (no Phase 6-tagged lint errors exist). This phase is about a11y + API correctness, not lint reduction.

---

## Item 1 — UI primitives + structural a11y

**Status:** `- [x]` ✅ COMPLETE (session AC9CF8E7-5F33-4D0F-9414-7D4350C72105)

### What landed
- `card.tsx`: `CardTitle` ref type → `HTMLHeadingElement`
- `button.tsx`: chose **option (b)** — pragmatic union of button + anchor attrs when `asChild`, no full polymorphic generics. `default` variant rebased to neutral slate; `brand` stays Redex red.
- `BreadcrumbBar.tsx`: `<nav aria-label="Breadcrumb"><ol>...` with `aria-current="page"` on last item
- `ModulePlayer.tsx`: locked sidebar buttons gained `aria-disabled`, `aria-label`, `aria-describedby`, and `sr-only` lock explanation
- `Quiz.tsx`: chose **option (b)** — ARIA layered on existing custom buttons (`role="radiogroup"`, `role="radio"`, `aria-checked`, `aria-disabled`) plus arrow/Home/End keyboard navigation. No visual change.
- Lint: 5+0 unchanged (the 5 includes `tailwind.config.ts` which Item 2 will clear)

### Visual regression
- Button `default` variant now neutral slate instead of Redex red. Intentional per Phase 6.
- Quiz visuals preserved; only ARIA + keyboard behavior changed.
- Breadcrumb close to prior chrome.

**Parallel sibling:** Item 2 is running concurrently in this same phase. Item 2 only touches `src/features/learner/components/LessonContentRenderer.tsx` and `package.json` (adding 1–2 markdown deps). **Do NOT modify those files.** If you find yourself needing to coordinate around Item 2, stop and report.

### Goal
Multi-file primitive + a11y pass. Five distinct fixes; the agent should plan internally before applying.

### Concrete tasks

1. **`src/components/ui/card.tsx` — `CardTitle` ref type**
   - Currently uses `HTMLParagraphElement` ref but renders `<h3>`. Fix the ref element type to `HTMLHeadingElement`.
   - Don't change the DOM tag — `<h3>` is the right semantic default.

2. **`src/components/ui/button.tsx` — variant API + polymorphic typing**
   - **Differentiate `default` vs `brand` variants** — they're visually identical now (both `bg-primary` which = Redex red after Phase 5). Make `default` a neutral system action (e.g., `bg-slate-900 text-white hover:bg-slate-800` or use shadcn's neutral tokens). Keep `brand` as the canonical Redex red action.
   - **Polymorphic-safe typing** — when `asChild` is true, the rendered element is `<Slot>` which proxies to whatever the child renders (could be `<a>`, `<Link>`, etc.). Today the props type is locked to `ButtonHTMLAttributes<HTMLButtonElement>`. Approaches (pick one and document why):
     - **(a)** `Polymorphic<"button">` style — full polymorphic typing with `as` / `asChild` generics. Cleanest but more code.
     - **(b)** When `asChild` is true, accept the union of common element attrs (`ButtonHTMLAttributes & AnchorHTMLAttributes`). Pragmatic.
     - **(c)** Keep the current single-type contract but add a JSDoc comment that `asChild` is "button-prop-only" by convention. Document the limitation rather than fix it.
   - **Recommendation: (b)** — gets the common cases right (anchors via `asChild`) without the polymorphic complexity. (a) is over-engineering for this codebase right now.
   - Whatever you pick, all existing callsites must still compile. Run `npm run typecheck` to verify.

3. **`src/components/layout/BreadcrumbBar.tsx` — landmark + structure**
   - Currently a plain `<div>` with concatenated text. Restructure to:
     ```tsx
     <nav aria-label="Breadcrumb">
       <ol>
         <li>...path segment...</li>
         <li aria-current="page">...current segment...</li>
       </ol>
     </nav>
     ```
   - The current `breadcrumb` prop is a single string like `"Learner flow › My Learning Dashboard"`. Parse it on `›` (chevron) and emit each segment as an `<li>`. The last segment gets `aria-current="page"`.
   - Visual styling should stay close to today's chrome — small chevron separator between items, muted text color, no heavy borders.
   - Accept if the consumer passes plain text without `›` — render as a single `<li aria-current="page">`.

4. **`src/features/learner/components/ModulePlayer.tsx` — sidebar `aria-disabled`**
   - Currently the locked sidebar buttons use `disabled={!canNavigate}` + `title="..."` tooltip. That works for mouse users but the `title` attribute doesn't reach screen readers reliably.
   - Add `aria-disabled={!canNavigate}` alongside `disabled`. Add an `aria-describedby` or `aria-label` that explains WHY (e.g., "Locked. Complete required lessons in order to unlock."). The visually-hidden explanation could be a sibling `<span className="sr-only">` if needed — there's already a Tailwind class `sr-only` available globally.
   - The visible `title` can stay as a secondary affordance for mouse users.

5. **`src/features/learner/components/Quiz.tsx` — radio group semantics**
   - Currently option buttons are `<button type="button">` with `disabled` + custom radio visual. Assistive tech sees them as a list of buttons, not a single-select.
   - Two valid approaches; pick one:
     - **(a) Native `<input type="radio">`** wrapped in `<label>` — most accessible by default, but requires non-trivial restyling because Tailwind doesn't style native radios well. Use `peer-checked:` utilities to swap styles on the surrounding label.
     - **(b) `role="radiogroup"` on the question container + `role="radio"` + `aria-checked` on each option button** — preserves the current button-based custom styling, just layers ARIA on top. Less risk of visual regression. Add keyboard arrow-key navigation between options in a group (this is what native radios provide for free).
   - **Recommendation: (b)** — Phase 6 is about a11y correctness, not a UI rewrite. Native radios would force a bigger styling diff. If you go (a) and the visuals shift noticeably, that's a regression to flag.
   - Either way:
     - The question container needs `role="radiogroup"` and an accessible label tying to the question text (`aria-labelledby` pointing at the question's `<div>` with `id="q-{question.id}"`).
     - The selected option needs `aria-checked="true"`; others `aria-checked="false"`.
     - Disabled (post-submit) state: `aria-disabled="true"` on all options.

### Done when
- `CardTitle` ref type is `HTMLHeadingElement`.
- `Button` `default` and `brand` variants render differently (neutral vs brand).
- `Button` accepts anchor-style props when `asChild` is true (per chosen approach).
- `BreadcrumbBar` is a `<nav aria-label="Breadcrumb">` with an `<ol>` and `aria-current="page"` on the last item.
- `ModulePlayer` sidebar buttons carry `aria-disabled` + accessible explanation.
- `Quiz` options expose radiogroup/radio/aria-checked semantics.
- `npm run typecheck` green; `npm run build` green; `npm run lint` ≤ 5 errors (unchanged).
- No new hardcoded hex; consume Phase 5's `redex.*` tokens.

### Key files
- `src/components/ui/card.tsx`
- `src/components/ui/button.tsx`
- `src/components/layout/BreadcrumbBar.tsx`
- `src/features/learner/components/ModulePlayer.tsx`
- `src/features/learner/components/Quiz.tsx`

### Out of scope (Item 2 owns)
- `src/features/learner/components/LessonContentRenderer.tsx`
- `package.json` markdown deps

### Out of scope (later phases)
- Test infra (Phase 8)
- `_archive/**` lint ignore + ESLint config (Phase 7)
- Build/security headers (Phase 7)

---

## Item 2 — Sanitized markdown rendering for text lessons

**Status:** `- [x]` ✅ COMPLETE (session D2C41BBB-509C-4420-8171-2004F03CC16F)

### What landed
- Installed `react-markdown@^10.1.0`, `rehype-sanitize@^6.0.0`, `@tailwindcss/typography@^0.5.19` (all as `dependencies`)
- `LessonContentRenderer` text branch now uses `<ReactMarkdown rehypePlugins={[rehypeSanitize]}>`; fallback string preserved; `prose` wrapper retained
- Tailwind Typography plugin enabled + wired in `tailwind.config.ts`
- **Bonus**: `tailwind.config.ts` migrated from `require('tailwindcss-animate')` to ESM `import animate from 'tailwindcss-animate'` to support the Typography plugin import — **cleared the Phase 7-tagged `no-require-imports` lint error early**
- Lint: 5 → **4 errors** (all `_archive/**`)
- Build: ~655 kB JS / ~192 kB gzipped (added ~25 kB gzipped from markdown deps; expected)

**Parallel sibling:** Item 1 is running concurrently in this same phase. Item 1 touches `card.tsx`, `button.tsx`, `BreadcrumbBar.tsx`, `ModulePlayer.tsx`, `Quiz.tsx`. **Do NOT modify those files.** If you find yourself needing to coordinate around Item 1, stop and report.

### Goal
Replace the escaped-plain-text rendering of `text`-content lessons in `LessonContentRenderer` with a sanitized markdown renderer. Today's behavior: markdown source like `**bold**` renders as literal asterisks; this is wrong UX-wise. Plain `whitespace-pre-wrap` is OK as a fallback but not a feature.

### Concrete tasks

1. **Pick + install the library**:
   - Recommended: `react-markdown` + `rehype-sanitize`. Pure React, well-maintained, treeshake-friendly. Total size: ~30 KB gzipped.
   - Alternative: `markdown-to-jsx`. Simpler API, no rehype/remark plumbing, ~6 KB. Limited to GitHub-flavored markdown without sanitization plugins.
   - **Recommendation: `react-markdown` + `rehype-sanitize`** — sanitization is the whole point of doing this safely; markdown-to-jsx doesn't sanitize.
   - Install as `dependencies` (not devDependencies) — used at runtime.
   - Run `npm install` and verify lockfile updates.

2. **`src/features/learner/components/LessonContentRenderer.tsx`** — text variant:
   - Currently:
     ```tsx
     if (content.type === 'text') {
       return (
         <div className="prose max-w-3xl mx-auto">
           <h2>{lesson.title}</h2>
           <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
             {content.body_markdown || 'Text lesson content would render here as rich markdown.'}
           </div>
         </div>
       );
     }
     ```
   - Replace the inner `<div>` with `<ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content.body_markdown || fallback}</ReactMarkdown>`.
   - Keep the `prose` wrapper and the `<h2>{lesson.title}</h2>` heading (it's outside the markdown so it can stay).
   - The fallback string for empty `body_markdown` should be plain text — keep "Text lesson content would render here as rich markdown."
   - Verify `prose` (Tailwind Typography plugin) is enabled. If not, the markdown will render but with no spacing/styling — check `tailwind.config.ts`. If `@tailwindcss/typography` isn't installed, either (a) install it and add it to plugins, OR (b) add minimal heading/list/code styles inline to the wrapper as a stopgap. Document your choice.

3. **Sanitization defaults**:
   - `rehype-sanitize` with default schema is fine — blocks `<script>`, dangerous URLs, etc.
   - Don't extend the schema to allow arbitrary HTML.
   - Inline code (` `` `) and code blocks (` ``` `) should render with monospaced font and a light background — `prose` should handle this if Typography is loaded.

4. **Verification**:
   - `npm run typecheck` green
   - `npm run build` green — bundle size may grow ~30 KB; that's expected. Don't optimize for size in this phase.
   - `npm run lint` ≤ 5 errors (unchanged)
   - Reasoning pass: walk the `lesson-values` demo lesson (which uses `content.type: 'text'` with body `"At Redex, we lead with people..."`). It'll render as a paragraph — verify the markdown parser doesn't barf on plain prose.

### Done when
- `react-markdown` + `rehype-sanitize` (or equivalent) installed and committed in package.json
- `LessonContentRenderer` text branch uses the markdown renderer with rehype-sanitize
- The fallback string for empty body still renders correctly
- Typography plugin status documented (installed + added to plugins, OR stopgap inline styling)
- `npm run typecheck`, `build`, `lint` green/unchanged

### Key files
- `src/features/learner/components/LessonContentRenderer.tsx`
- `package.json` (deps)
- Possibly `tailwind.config.ts` (only if installing the Typography plugin)

### Out of scope (Item 1 owns)
- `src/components/ui/card.tsx`
- `src/components/ui/button.tsx`
- `src/components/layout/BreadcrumbBar.tsx`
- `src/features/learner/components/ModulePlayer.tsx`
- `src/features/learner/components/Quiz.tsx`

---

## Final verification (orchestrator does this after both items)
- `git status --short` — clean (orchestrator commits)
- `npm run typecheck` — green
- `npm run build` — green
- `npm run lint` — 5 errors + 0 warnings (unchanged)
- Build Bible NOT updated by sub-agents (orchestrator handles)
- Single Phase 6 commit covering both items

## Commit cadence
One commit per phase. Items 1 and 2 land together.
