# Contributing to Redex Education

## 1. Welcome
Redex Education is built slice-by-slice from the master roadmap, and every completed slice is logged in the Build Bible. Treat both documents as required operating context before you begin work.

## 2. Read these first (mandatory)
- [Build Bible](./docs/redex_education_build_bible.md) — current state of every phase and slice
- [Master roadmap](./docs/2025__redex-education__codex-linear-roadmap-handoff.md) — what gets built next, and in what order
- [Architecture brief](./docs/architecture.md) — current code layout and runtime boundaries
- [Glossary](./docs/glossary.md) — Redex naming and domain vocabulary

The Build Bible is updated every slice to keep a single source of truth across multi-agent and multi-session execution. Without that discipline, planning, implementation, and verification drift quickly. If your change is real, it must be reflected there.

## 3. Development setup
Use the Quick start steps in [README](./README.md). If `npm install` fails, verify Node is `20.19+` or `22+` (`^20.19.0 || >=22.12.0`).

## 4. Slice discipline
From the master roadmap: **"Create Linear issues as slices, not random tasks."** and **"Each issue should include: Objective, Files likely touched, Expected UI/end state, Data requirements, Acceptance criteria, Test steps, Build Bible update requirement."**

Also follow the build philosophy rules: every slice must have a clear outcome, include acceptance notes, and update the Build Bible; do not build randomly across the app. Stay inside the active slice. Do not bundle unrelated changes.

## 5. Commit conventions
Use Conventional Commits:

`<type>(<scope>): <summary>`

Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `perf`, `style`.

Examples:
- `feat(quiz): add keyboard navigation for option groups`
- `fix(education): repair localStorage hydration race in StrictMode`
- `test(education): add idempotency coverage for recordLessonProgress`
- `docs(architecture): document provider stack and facade boundary`
- `chore(build): tune vendor chunk splitting for markdown and supabase`

Scope is optional, but preferred when the touched area is obvious.

## 6. Branch conventions
- One branch per slice: `slice/<phase>-<slice>-<short-name>` (example: `slice/2-1-admin-dashboard-shell`)
- Hotfixes: `fix/<short-name>`
- Docs-only work: `docs/<short-name>`

## 7. Pull request expectations
- PR title mirrors the lead commit (Conventional Commits format)
- PR description includes:
  - **What** (1–2 sentences)
  - **Why** (link to the slice in the roadmap or Build Bible)
  - **How verified** (typecheck, lint, test, build)
  - **Build Bible update** confirmation in the diff
- Required checks must pass:
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
  - `npm run build`

## 8. Test expectations
- New components: at least one render test (preferably with at least one user interaction)
- New hooks: at least one `renderHook` test covering the primary use case
- Bug fixes: include a regression test that fails before and passes after the fix
- See the [Testing guide](./docs/testing.md) for fixture helpers and mock seam patterns

## 9. Code style
- TypeScript `strict: true` and `noUncheckedIndexedAccess: true` are enforced
- No `any`, no non-null assertions (`!`), and no `as` casts that bypass real type narrowing
- ESLint is required; keep lint at 0 errors / 0 warnings (see `eslint.config.js`)
- Prettier is not configured; match existing local style

## 10. Naming guardrails
| Name | Use |
|------|-----|
| Redex Education | Repo, platform, internal docs |
| Redex Academy | Learner-facing brand, `/learn/*` |
| Redex AI Course Foundry | Admin engine, `/admin/*` |
| Redex Training OS | Long-term platform vision |

Do not surface "Course Foundry" or "Training OS" in learner UI. Do not surface "Academy" in admin-only surfaces.

## 11. Sub-agent / multi-agent coordination
This project supports CEO Co-Pilot orchestration when parallel work is warranted:
- Plans export to `prompt-exports/<phase>-plan.md`
- Sub-agents (`engineer`, `pair`, `design`, `explore`) execute against that shared plan
- The orchestrator owns verification and Build Bible updates
- Plan exports are removed after the Build Bible records the completed work

If you are a sub-agent: read the plan first, stay inside your assigned file boundary, and report deviations instead of silently fixing out-of-scope files.

## 12. Getting help / open questions
Use the Build Bible’s Open Decisions section when work is blocked by an unresolved call. Add the blocker and a proposed answer so the next slice can proceed with clear context.
