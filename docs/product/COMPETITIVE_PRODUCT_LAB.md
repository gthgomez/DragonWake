# Competitive Product Lab

Status: **CURRENT AUTHORITY** — operating manual for player-facing product
work. Establishes how DragonWake is evaluated and improved as a *product*.
Version: 1.1 · Last reviewed: 2026-09-05 (v1.1 hardening: evaluator
classes, claim evidence rules, anchored scoring rubric, isolation method,
run manifests, evidence-storage semantics; CANON_AUTHORITY.md deliberately
left untouched — this lab anchors itself through `AGENTS.md`, `README.md`,
and `../CURRENT_STATE.md`, not through edits to frozen canon).

Authority boundary: this document governs **process** (how we evaluate,
prioritize, and verify player-facing work). It does not authorize changes to
product direction, fiction, or content canon. The design authority stack in
[`../design/CANON_AUTHORITY.md`](../design/CANON_AUTHORITY.md) still decides
*what DragonWake must be*; this lab decides *how we know whether players can
perceive and enjoy it*. Where a proposed fix would change direction or canon,
route through the authority stack — never through this lab.

---

## 1. Why this lab exists

DragonWake was historically evaluated through source inspection, feature
inventories, automated tests, and static competitor research. For a
player-facing game that is insufficient: DragonWake can technically contain
construction, research, alliances, combat, Realm navigation, and dragon
systems while still presenting all of them to a player as an unfinished
prototype.

Therefore:

> **Rendered player experience is an independent source of truth.**
> Implementation alone cannot certify product completeness.

Two claims this lab keeps separate and keeps alive:

- **SYSTEM COMPLETE** — the code exists, the API works, tests pass, the
  route renders. This is the old bar.
- **PRODUCT COMPLETE** — a normal player can *discover, understand, use,
  and enjoy* the system: it is visually communicative, appropriately
  rewarding, integrated into progression, and verified in the running game.

Passing unit tests alone cannot certify player-facing quality.

### Productization gap

> **PRODUCTIZATION GAP = what the implementation provides − what the player
> can perceive and enjoy.**

A repository audit may say Castle/Realm/Research/Alliance `IMPLEMENTED`
while a blind playtest says: Realm reads as an abstract tile matrix,
research reads as a button grid, alliance feels socially sparse. That
discrepancy *is* the finding. Every major audit must measure it explicitly
(per-system, in the audit templates under
[`../competitive/audits/`](../competitive/audits/)).

### Game vs systems prototype

Standing question: **why do established competitors feel like games while
DragonWake can still feel like a collection of implemented systems?**
Evaluate answers across mechanics, content, visuals, art, feedback,
animation, sound, progression, social presence, player identity, collection,
world presentation, reward presentation, pacing, fantasy, retention.

Do not default to solving this by adding more mechanics. Often the
highest-value intervention is *exposing, visualizing, or pacing systems that
already exist*.

---

## 2. The operating loop

Every player-facing campaign runs this loop:

```text
RESEARCH
  ↓
COMPETITOR EVIDENCE
  ↓
BLIND PLAYER PLAYTEST
  ↓
WHITE-BOX REPOSITORY AUDIT
  ↓
VISUAL + FUNCTIONAL COMPARISON
  ↓
ROOT-CAUSE CLASSIFICATION
  ↓
PRIORITIZATION
  ↓
IMPLEMENT ONE VERTICAL SLICE
  ↓
REPLAY / RECAPTURE
  ↓
BEFORE/AFTER EVALUATION
```

Do not collapse this back into `inspect code → implement feature → tests
pass → feature complete`.

---

## 3. Black-box product test (runs first)

The evaluator behaves like a normal player and evaluates **only what the
game presents**. Rules:

1. **No repository knowledge.** The playtest must not inspect source code,
   design docs, or this workflow before and during play. Use a fresh
   context/subagent, a fresh browser session, or both. See
   [`prompts/blind-player-playtest.md`](prompts/blind-player-playtest.md)
   for the role prompt and the isolation rules, and
   [`FTUE_PLAYTEST_PROTOCOL.md`](FTUE_PLAYTEST_PROTOCOL.md) for the timed
   first-session protocol.
2. Play the running game through the rendered interface (see §9).
3. Capture evidence (screenshots, session trace) while playing.
4. Only after the experience is documented may implementation be inspected.

Questions the black-box pass must answer:

- What do I think this game is? What am I supposed to do?
- What can I discover without developer knowledge?
- What feels rewarding? What feels unfinished? Where am I confused?
- What feels like a real game? What feels like an internal tool?
- What motivates me to continue? What makes me want to return tomorrow?
- How prominently does DragonWake deliver its kingdom/dragon fantasy?

Results land in [`../competitive/audits/blind-playtest.md`](../competitive/audits/blind-playtest.md)
(one file per campaign run, or dated sections).

### Evaluator classes

Every evaluation records its class — `SYNTHETIC_AGENT`, `HUMAN_PLAYER`, or
`DEVELOPER_REVIEWER` — with the authority boundaries defined in
[`FTUE_PLAYTEST_PROTOCOL.md`](FTUE_PLAYTEST_PROTOCOL.md). Synthetic runs
generate hypotheses; only human playtests validate claims about fun,
motivation, retention, or emotional payoff. Isolation method and its
proof requirements are specified there too.

### Experience claim evidence rules

A claim is only as strong as the evidence class behind it:

| Claim type | Requires |
| --- | --- |
| `SYSTEM CLAIM` ("X is implemented") | repository/tests evidence |
| `RENDERED UX CLAIM` ("X renders/reachable in the UI") | browser/rendered evidence |
| `SYNTHETIC EXPERIENCE CLAIM` ("players would see…") | synthetic black-box run, labeled `EVALUATOR_CLASS: SYNTHETIC_AGENT` |
| `HUMAN EXPERIENCE CLAIM` ("players enjoy/understand…") | human playtest evidence |
| `COMPETITOR CLAIM` ("DoA did X") | provenance-backed external evidence |
| `RETENTION CLAIM` ("players will return") | human/behavioral evidence — otherwise stays a hypothesis |
| `COMMERCIAL/MARKET CLAIM` | actual market validation; never inferable from game UI alone |

Never let a model's opinion become false certainty: synthetic experience
observations feed hypotheses into the loop; they do not close gates.

## 4. White-box product test (runs second)

For each black-box deficiency, inspect the implementation and classify the
actual root cause. This taxonomy is a standard DragonWake product tool:

| # | Root cause | Meaning |
| --- | --- | --- |
| 1 | `SYSTEM_MISSING` | No implementation at all |
| 2 | `SYSTEM_INCOMPLETE` | Partially implemented |
| 3 | `SYSTEM_EXISTS_BUT_UNDISCOVERABLE` | Implemented; players cannot find or reach it |
| 4 | `SYSTEM_EXISTS_BUT_LACKS_CONTENT` | Shell with too little to do |
| 5 | `SYSTEM_EXISTS_BUT_LACKS_VISUALIZATION` | Works; shows nothing |
| 6 | `SYSTEM_EXISTS_BUT_LACKS_FEEDBACK` | Works; player cannot feel it |
| 7 | `SYSTEM_EXISTS_BUT_BADLY_PACED` | Works; rhythm buries it |
| 8 | `ASSET_OR_ART_DEFICIENCY` | Code fine; art/asset gap |
| 9 | `INFORMATION_ARCHITECTURE_PROBLEM` | Exists; wrong place/hierarchy/wording |
| 10 | `BUG` | Broken behavior |
| 11 | `UNKNOWN` | Needs more evidence |

Classifications with counts per audit go in the audit file. Note how often
the honest answer is 3/5/6/8/9 — *not* "missing": that is the
productization gap in data form.

## 5. Four-dimension feature model

Stop evaluating systems as implemented / not implemented. For every
important system, score 0–5:

| System | Mechanical Depth | Player Visibility | Presentation | Motivation |
| --- | --- | --- | --- | --- |

- **Mechanical depth** — how much actual gameplay functionality exists.
- **Player visibility** — can a normal player discover and understand it?
- **Presentation** — does it visually/interactively communicate importance
  and fantasy?
- **Motivation** — does it give a reason to engage and progress?

Optional dimensions where useful: Content Depth, Feedback, Progression
Integration, Social Value, Retention Value.

Preserve the principle: **a mechanically sophisticated feature can
contribute almost nothing to perceived game quality if presentation,
visibility, or motivation are poor.** Scores use the anchored 0–5 rubric
defined in
[`../competitive/matrices/feature-matrix.md`](../competitive/matrices/feature-matrix.md)
— agents must not improvise private scales. Score matrices live in
[`../competitive/matrices/`](../competitive/matrices/).

## 6. The Screenshot Test

For every major system ask:

> "If I showed a player only a screenshot of this system, would they
> correctly understand its fantasy, importance, interactability, and
> production maturity?"

Apply to: Castle, Lands, Realm, War, Alliance, Knowledge, dragon surfaces,
construction, research, troop management, combat reports, player profile,
quests/objectives, events, progression rewards.

The Screenshot Test is a fast product-quality diagnostic. It supplements,
never replaces, interaction testing.

## 7. Matched visual benchmarks

Competitor evidence is not a pile of miscellaneous screenshots. Visual
comparisons use matched categories (city/kingdom, world map, first dragon,
dragon management, research, troops, combat, combat report, quests,
rewards, alliance, events, player identity, progression, inventory, PvE
target, PvP target) and compare **equivalent player states**. The category
matrix lives in
[`../competitive/matrices/visual-benchmark-matrix.md`](../competitive/matrices/visual-benchmark-matrix.md).

Compare qualities — never "make DragonWake look like DoA":

information hierarchy · fantasy delivery · visual reward · perceived depth ·
interactability · production maturity · content density · clarity ·
identity · emotional payoff.

## 8. Root-cause → work class

After classification, every deficiency gets a work class that decides who
does it:

- **Code** — engineering (systems, feedback, pacing, IA fixes)
- **Asset** — visual work, classified as: procedural · UI/vector ·
  AI-generatable · manually illustrated · animation/VFX · audio ·
  eventually commission-worthy
- **Content** — data/JSON, within canon
- **Direction** — would change product direction: route to the authority
  stack, do not implement in this lab

Classifying asset gaps instead of coding around them is deliberate: it lets
the project use its AI asset-generation capability where it actually helps.

## 9. Browser-based playtesting (how to run the game)

Evaluate through the actual running application. Verify current commands
against the README before relying on them; as of 2026-09-05:

```powershell
pnpm install          # once
pnpm dev              # server (http://localhost:3001/health) + web (http://localhost:5173)
```

Then drive the rendered UI like a player: click, type, scroll; capture
important states; observe errors; inspect browser console/network where
useful. Tooling support is documented in
[`ZCODE_CAPABILITY_MATRIX.md`](ZCODE_CAPABILITY_MATRIX.md). Timed session
structure and the EXPERIENCE TRACE record format:
[`FTUE_PLAYTEST_PROTOCOL.md`](FTUE_PLAYTEST_PROTOCOL.md).

## 10. Before/after product evidence

Meaningful player-facing work follows:

```text
BASELINE → IMPLEMENTATION → REPLAY → UPDATED CAPTURE → BEFORE/AFTER EVALUATION
```

Future UI/product changes should be able to show *"here is what the player
experienced before, and here is what they experience now"* — not merely
"tests passed". **Evidence storage is unambiguous:**

- `delivery/evidence/<RUN_ID>/` — **raw runtime artifacts** for a run:
  screenshots, video, traces, logs, machine-readable results. Large
  binaries may stay local/untracked; the run manifest is always tracked.
- `docs/competitive/evidence/dragonwake/` — **curated, durable reference
  evidence** only: selected baseline captures and approved before/after
  pairs promoted after a verdict, named per
  [`VISUAL_QA_STRATEGY.md`](VISUAL_QA_STRATEGY.md), each referencing its
  `RUN_ID` manifest.
- `docs/competitive/sources/` — competitor provenance and URLs.

Policy, promotion rules, and naming:
[`../competitive/evidence/README.md`](../competitive/evidence/README.md).

For significant vertical slices, record diagnostics such as: clicks to
first meaningful action, time to first combat, time to first dragon
interaction, scrolling required, dead time, confused interactions,
visually weak screens, rewarding moments, progression clarity, fantasy
delivery. These are **diagnostic evidence, not absolute goals** — do not
optimize blindly around them.

## 11. Vertical-slice gate and prioritization

After a competitive/product audit, do **not** launch into dozens of
features. Select **one** high-impact vertical slice. Candidates (evidence
decides the winner): Castle presentation overhaul, Realm Map 2.0, first
dragon acquisition experience, dragon management/equipment, combat +
battle-report experience, alliance productization.

A vertical slice must be **small enough to finish, large enough to
matter**. Test:

> "If we showed someone before/after screenshots and a short playthrough,
> would they immediately recognize a meaningful improvement in DragonWake
> as a product?"

If not, reconsider the slice.

Score candidate improvements ~1–5 on: Player Impact, Retention Impact,
Fantasy Impact, Competitive Necessity, Engineering Cost, Asset Cost,
Technical Risk. These are **ordinal, qualitative judgments** (general
anchors: 1 minimal · 3 moderate · 5 maximal) whose purpose is to force
explicit tradeoff reasoning — they are not reproducible measurements, and
the Opportunity Score below is a reasoning aid, not a verdict.

Optional heuristic (forces explicit tradeoff reasoning — not a formula to
mechanically obey):

```text
Opportunity Score = (PlayerImpact + RetentionImpact + FantasyImpact + CompetitiveNecessity)
                    / (EngineeringCost + AssetCost + TechnicalRisk)
```

Record the scoring table in the campaign's audit file before implementing.

## 12. Specialist roles

Work runs through separated roles, each with a reusable prompt in
[`prompts/`](prompts/):

| Role | Prompt | Job |
| --- | --- | --- |
| Competitor Archaeologist | [`prompts/competitor-archaeologist.md`](prompts/competitor-archaeologist.md) | DoA/Reign research, evidence with provenance, no invention |
| DragonWake Archaeologist | [`prompts/dragonwake-repo-archaeologist.md`](prompts/dragonwake-repo-archaeologist.md) | Read-only repo investigation, implementation state |
| Blind Player / UX Critic | [`prompts/blind-player-playtest.md`](prompts/blind-player-playtest.md) | Plays the rendered game with no source knowledge |
| Product Synthesizer | [`prompts/product-synthesizer.md`](prompts/product-synthesizer.md) | Reconciles competitor + black-box + white-box into the real gap |
| Implementation Agent | (normal engineering flow) | Implements the selected slice only, after prioritization |
| Verification / Playtest Agent | [`prompts/post-implementation-verifier.md`](prompts/post-implementation-verifier.md) | Replays the player workflow; tries to disprove the improvement |

Role separation is what keeps the black-box test honest. See
[`ZCODE_CAPABILITY_MATRIX.md`](ZCODE_CAPABILITY_MATRIX.md) for how to run
these roles with ZCode (subagents, isolation, and tooling limits).

## 13. Competitive evidence corpus

Competitor findings persist in the repository, not in chat history:
[`../competitive/README.md`](../competitive/README.md). Every claim carries
source, URL, date, game/version, claim supported, and an evidence
confidence (`VERIFIED`, `STRONG_EVIDENCE`, `PARTIAL_EVIDENCE`,
`ANECDOTAL`, `UNKNOWN`). Never invent historical mechanics. Historical DoA
claims additionally follow the stricter evidence-label system already
defined in [`../design/DOA_REFERENCE_MODEL.md`](../design/DOA_REFERENCE_MODEL.md)
(CONTEMPORARY / DEVELOPER / COMMUNITY-DOCUMENTED / CURRENT-MOBILE /
INFERRED / HYPOTHESIS, with era + confidence + contamination risk).

## 14. Visual/browser QA

Product reference captures, visual regression tests, and structural
browser tests are three different instruments; the strategy for when to
use each, canonical surfaces and viewports, and the current Playwright
inventory: [`VISUAL_QA_STRATEGY.md`](VISUAL_QA_STRATEGY.md).

## 15. What this lab does NOT authorize

- Reopening Direction Freeze, canon, or any design authority.
- Shipping player-facing work without rendered verification.
- Declaring product completeness from unit tests alone.
- Speculative feature batches instead of one prioritized vertical slice.
- Committing large copyrighted competitor asset collections (see
  [`../competitive/evidence/README.md`](../competitive/evidence/README.md)).

## 16. Active campaign

The current competitive campaign (DoA → Reign → DragonWake → vertical
slice) and its gate sequence:
[`../competitive/roadmap/player-product-roadmap.md`](../competitive/roadmap/player-product-roadmap.md).
