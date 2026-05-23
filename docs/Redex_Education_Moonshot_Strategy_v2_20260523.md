# REDEX EDUCATION — MOONSHOT STRATEGY (v2)

**Version:** 2.0 — supersedes v1
**Date:** 2026-05-23
**Prepared for:** Brian Lewis (Speedy)
**Companion document:** `Redex_Education_Phase10-13_Roadmap_v2_20260523.md` (build-ready slices)
**Method:** Two rounds of multi-agent analysis. Round 1 — a five-lens audit (pedagogy, competitive benchmark, product/UX, technical/AI architecture, business/ROI) of the live repo, roadmap, Build Bible, and 2026 market. Round 2 — the same five-lens panel re-convened to stress-test your own 8-agent swarm document and six candidate enhancements, answering: how to implement, whether it's worth doing, and what both passes missed.

---

## BOTTOM LINE UP FRONT

The verdict from Round 1 stands, and Round 2 strengthened it: **you have a finishing problem, not a quality problem.** Finish the backend, wire real AI into the Foundry, ship one focused lesson-experience upgrade, pilot it on a real HR cohort with real content — then let pilot data decide the rest.

Round 2's job was to test whether your 8-agent swarm and the six enhancements I flagged should change that plan. They do not. They **improve** it — at a true cost of roughly **two new build slices plus a handful of near-free rules and schema additions** — *provided you hold the line on one item and refuse to let the rest balloon into a month of separate tickets.* The panel was unanimous on that risk. The six enhancements are mostly absorption, rules, and plumbing — not a new program of work.

Three things came out of Round 2 that are worth more than most of the original six:

1. **One competency-tagged item bank** feeding video checkpoints, quizzes, and spaced-repetition boosters — turning six disconnected features into one coherent retrieval system.
2. **Cost telemetry built before real AI turns on** — a meter on the one resource (AI budget) you said constrains you.
3. **Section-level partial regeneration as a first-class capability** — "one SOP paragraph changes → regenerate one lesson for pennies, not the whole module for dollars." This is your strongest cost-and-trust story and it's already half-modeled in the code.

---

## 1. WHERE REDEX EDUCATION ACTUALLY STANDS

The mock-first MVP (roadmap Phases 0–7) is functionally complete on mock data: the full learner flow, the entire Course Foundry pipeline, assignments, manager visibility, versioning, and an audit log. The Google Drive Source Library ingestion is real and is the strongest single piece of the codebase. Tests pass, lint is clean, the build is green.

What is not built: it does not run on a real backend across users; there is no AI layer at all (the Foundry calls `setTimeout` and dumps fixtures); there is no real Redex source content; and of nine declared lesson types only three truly render. The Build Bible's own "Current Phase" marker has drifted out of sync with reality — reconcile it before the next sprint or your Codex/Linear pipeline plans against a stale map.

---

## 2. THE HONEST VERDICT — WHAT YOU BUILT VS. WHAT YOU THINK YOU BUILT

The engine is moonshot-grade. The lesson layer is 2010-grade. You built a genuinely sophisticated content factory — source-grounded generation, mandatory human approval, version binding, audit, side-by-side review — and the thing it currently produces is a markdown document and a multiple-choice quiz. Extraordinary kitchen, plating toast.

This is structural, not cosmetic — but the schema already knows it. `src/types/training.ts` declares `scenario` lessons with full branching shapes, `checklist` lessons, `coach` lessons. The data model anticipated the moonshot; the renderers were never built. You are not missing an architecture. You are missing the renderers and assessment logic the schema already promised.

**The most dangerous gap is still the one you didn't ask about.** The platform will currently mark an entry-level hire "trained" on an 80%-pass multiple-choice quiz with unlimited retakes on static questions — and then that hire touches a customer's live wiring. For a security-infrastructure company that is a liability surface, not a polish item. Your original master brief had lead-tech-reviewed practicals and a 30/60/90 "Redex Operator Certified" ladder. The lean MVP dropped all of it. Recovering it (Phase 11) is the difference between a completion tracker and a system that can certify someone to do the job.

---

## 3. THE 2026 BAR — AND WHERE YOUR REAL MOAT IS

AI-from-source-document authoring, AI avatar video, and per-learner AI tutors are all mainstream in 2026 — Articulate, Synthesia, Colossyan, Sana, 360Learning, Docebo, Axonify, Arist all ship versions of them. The uncomfortable truth: **source-grounding + human approval + audit is excellent hygiene, but it is no longer a unique moat.** Arist already markets a "hallucination-proof" engine; RAG-with-citations is standard.

Your real moat is depth on *your* use case — internal onboarding for a security-services field workforce — in three places no SaaS LMS will match:

- **Security-trade procedural mastery** — branching scenarios and hotspot/diagram lessons generated from your own SOPs.
- **Training that never goes stale** — a source file changes in Drive, the system detects which *sections* changed, and regenerates only the affected lessons. Round 2 found this is already half-built in the data model and should be promoted to a first-class capability now.
- **Role-true paths** certified by competence, per role.

"Greatest education platform ever," correctly defined, is not the most features. It is: *every Redex hire becomes a confident, independent operator in 90 days — proven, consistent, every time — on training that never goes out of date.*

---

## 4. THE DECISION — FINISH BEFORE YOU MOONSHOT

Finish Phase 8 and 9 before building a single moonshot feature. A fancier mock nobody can use is worth zero dollars. Phases 0–7 are done; the remaining backend slices (8.3–8.6) are the unglamorous last mile — exactly the work that gets perpetually deferred for shinier things, and a project stuck at "95% built, never launched" is the most common way an internal tool dies.

Run two tracks in parallel — and one of them is not code. While the build closes Phase 8, you and HR must produce *one genuinely HR-approved onboarding source document.* The Course Foundry is useless without real source material, and getting policy language approved has the longest lead time of anything in this plan. Start it the same day the backend sprint starts.

Round 2 reinforced this with a specific warning: the six enhancements, individually, all look small. Collectively, if each gets its own slice and review cycle, they add a month and push the pilot — and **the pilot is where the actual ROI evidence comes from.** Discipline in *how* you fold them in is part of the strategy.

---

## 5. THE PRIORITIZATION FRAMEWORK

Every candidate feature — now and forever — gets scored on four questions. Build only what passes the first two.

1. **Does it move a dollar metric?** Ramp time to independent operator, first-time-fix rate, callback rate, completion rate, audit defensibility. If you cannot name the metric, it is a shiny object.
2. **Does it serve the core loop or the core users?** Raw knowledge in → approved training out → employee completes → competence proven. Anything orthogonal is backlog.
3. **Is it cheap to reverse?** Single-tenant internal tool — favor what you can rip out.
4. **Does it survive the non-negotiables?** No generic-LMS bloat, no childish gamification, AI never publishes unreviewed, source grounding stays sacred.

**Owner's tie-breaker:** *"Would I rather have this feature, or have 50 more techs trained correctly this year?"*

---

## 6. THE PATH AT A GLANCE

| Stage | What | Why it is here |
|---|---|---|
| **Close-out: Phase 8–9** | Supabase reads/writes, schema reconciliation, fix the wrong `types.ts`, roles + real RLS, real AI wired into the Foundry **with cost telemetry from day one**, real HR source content | Makes the product real. Launch blocker. |
| **Phase 10 — Lesson Experience Engine** | Build the renderers the schema promised: checklist, branching scenario, hotspot/diagram, drag-to-order, a real video player; upgrade text lessons; teach the Foundry to generate structured content; generation theater; **media-richness policy + cost controls** | Kills "Markdown reader with a quiz." |
| **Phase 11 — Competency & Certification** | Practical lesson + manager sign-off; **a unified competency-tagged item bank**; retrieval-practice assessment; competency model; the 30/60/90 certification ladder; manager coaching + recognition; pedagogical critique; knowledge-gap analytics | Closes the liability gap. Certifies real competence. |
| **PILOT** | Real HR onboarding cohort, real content, measured | The only milestone that truly counts. |
| **Phase 12 — Field-Ready** | Mobile-first player, offline caching + sync, audio narration | Field techs on phones, bad wifi. |
| **Phase 13 — Redex Coach & Adaptive (pilot-gated)** | Source-grounded AI tutor (citing text *and* video), spaced-repetition boosters, light adaptive pacing | Genuine differentiators — build only what the pilot proves. |

---

## 7. ROUND 2 — THE ENHANCEMENT PANEL VERDICTS

The five-lens panel was sent your 8-agent swarm document and the six enhancements I had flagged. Verdicts, with the reasoning that changed the implementation:

**E1 — Value-based badges + manager/peer shout-outs. → YES, but reframed; ships at/after pilot, never before.** Four lenses said yes-with-modification; the business lens said defer. They are reconciled by one move: **make recognition ride the manager attestation that already has to happen.** When a lead tech signs off that a hire correctly terminated a cable run on a real site (Phase 11's practical verification), that *same attestation* can carry a core-value tag and surface as a quiet recognition. No new human process, no badge walls, no counts, no leaderboards — a dignified line of text, manager co-signed. Built as a thin layer on Phase 11.1, not a gamification system. It must not delay the pilot.

**E2 — Video transcript into the grounded corpus. → YES, with a critical guardrail.** Capture the transcript when the video pipeline ships (Phase 10), index it for Redex Coach in Phase 13. But the technical lens caught a real trap: if a video script was AI-generated from source section X, and its transcript becomes a corpus entry, Coach could cite a *machine paraphrase of X* as if it were independent corroboration — quietly eroding the "every claim traces to an approved human source" guarantee. Fix: transcripts carry `authority: supporting` (never authoritative), a `derived_from_section_ids` provenance link, and a retrieval rule that never cites a transcript and its parent source as two sources. Timestamped chunks so a Coach citation deep-links to the exact 15 seconds of video.

**E3 — Media cost-tiering + per-module cost cap. → YES — elevated. The highest-ROI item on the list.** Two lenses independently said *pull it forward*. It is not a feature; it is the financial control panel for a generative platform, and right now there is no meter at all. Split into three: (a) **cost telemetry** — add cost columns to the generation pipeline schema now, and start logging cost-per-module even on mock generation; (b) **media policy** — reframed from a finance cap into an admin "Media richness" choice, with the default driven by *content type*, not perceived importance (procedural/spatial content → diagrams + voiceover, which often teach better than a talking head anyway; avatar video → culture, judgment, "why it matters" — your founder-voice use case); (c) **cost cap** — a pre-flight gate that downgrades to voiceover rather than failing.

**E4 — Inline knowledge checks that pause a video. → YES — absorbed into the video slice, not its own ticket.** The strongest pure learning-science upgrade in the set: passive video viewing produces a strong illusion of competence; interpolated retrieval is one of the best-evidenced fixes. Implement non-punitively — a wrong answer rewinds to the relevant segment, it does not lock the learner out; hard gating is reserved for genuinely safety-critical steps. The Foundry generates the segment boundaries and the checks together.

**E5 — Richer reading primitives. → YES, trimmed.** Adopt collapsibles (for *reference and optional depth only* — never for procedure steps or assessed content, since hiding content defeats first-time learning) and governed embedded images (essential for wiring diagrams — but they must be downloaded into your own storage at ingest, not hot-linked from Drive, which would break). **Drop developer-style syntax highlighting and tabs** — they leaked in from a software-team mental model; your techs wire panels, they don't read code. Keep a simple copyable monospace "config block" for the narrow real case (network configs, controller commands).

**E6 — The <90-second video segment rule. → YES — as a guideline, not a hard cap.** The evidence actually points to 60–150 seconds; a rigid <90s ceiling fractures genuinely sequential procedures into awkward cuts. Reframe: *one segment = one idea*, target 60–120s, segment on semantic boundaries. It is a generation-prompt rule and a self-critique check — zero slices.

**Three things the panel surfaced that BOTH passes had missed:**

- **One unified, competency-tagged item bank.** Today the video checkpoints (E4), the quiz question pools, and the 7/30/90 spaced boosters would each be separate question sets. They should all draw from *one* bank, every item tagged to a competency. A learner who misses a checkpoint on "mantrap sequencing" then sees that exact competency resurface in their 7-day booster. This single decision turns disconnected features into one coherent retention system — and makes checkpoint misses the connective tissue between the lesson experience and the adaptive engine. The strongest idea in Round 2.
- **Section-level partial regeneration, promoted to first-class now.** The code already models section-level source bindings. Combined with cost telemetry, "one SOP section changed → regenerate one lesson for pennies" becomes your strongest cost-and-trust story. It should be a first-class job type in the generation pipeline, not a Phase 13 stretch goal.
- **The video player is the hidden critical-path component.** E2, E4, and E6 all depend on one component that doesn't exist yet: a real video player with chapter markers, timestamp deep-linking, inline checkpoint cards, and transcript sync. Spec and build it *once* as the centerpiece of the video slice, or the team builds three half-players.

**Net effect on the plan:** sequencing unchanged; finish-first intact. Total real cost ≈ two new slices (media-richness policy + cost controls; the competency-tagged item bank) plus schema additions and generation rules. Everything else is absorption. The roadmap v2 integrates all of it.

---

## 8. WHAT TO KILL OR DEFER

Unchanged from v1, and Round 2 added one: out of scope until a pilot or a real stakeholder demands it — Role-Twin / skill-profile engine; advanced environmental simulations (the branching *scenario lesson* delivers ~80% of the value at ~10% of the cost); external certification / SCORM export / certificate PDFs; standalone analytics/BI; auto-suggest modules; extra source connectors; **leaderboards, streaks-as-mechanic, and badge walls** (Round 2 explicitly flagged your swarm's "bigger confetti / streaks / level-up" instinct as the line not to cross — recognition is fine, gamification is not).

**Build-vs-buy, settled:** AI avatar video — buy (HeyGen, in hand). The AI generation engine — buy the model, build the orchestration. The AI tutor — a thin RAG layer, build it small in Phase 13. Interactive lesson rendering and the video player — build. The LMS itself — build, because it is deliberately not a generic LMS.

---

## 9. THE SINGLE MOST IMPORTANT NEXT MOVE

Unchanged, and Round 2 reinforced it:

**Finish Slices 8.3–8.6 so the platform persists real data — and in parallel get one real, HR-approved onboarding source document into your own hands.** Round 2 adds one rider: **stand up cost telemetry before real AI is switched on.** The moment generation goes live, money starts leaving with no meter running.

You have built the hard part. The breakthrough — raw Redex knowledge in, approved interactive training out — is real and it is yours. Finish it, instrument it, put it in front of one real cohort, and let what you learn there decide what "greatest" means next.

---

*End of strategy v2. See `Redex_Education_Phase10-13_Roadmap_v2_20260523.md` for the build-ready slice breakdown with all Round 2 enhancements integrated.*
