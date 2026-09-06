# FTUE Playtest Protocol

Status: **CURRENT AUTHORITY** — reusable first-time-user-experience test
protocol. Companion to
[`COMPETITIVE_PRODUCT_LAB.md`](COMPETITIVE_PRODUCT_LAB.md); consumed by the
Blind Player role ([`prompts/blind-player-playtest.md`](prompts/blind-player-playtest.md)).
Version: 1.1 (hardened 2026-09-05: isolation method, evaluator classes,
severity anchors).

## Evaluator class (mandatory on every run)

Every playtest records `EVALUATOR_CLASS`:

| Class | Definition | Authoritative for | Never authoritative for |
| --- | --- | --- | --- |
| `SYNTHETIC_AGENT` | An AI model using browser automation + vision to play as a player | discoverability, broken flows, navigation friction, visual hierarchy, inconsistency, missing feedback, prototype-like presentation, repeatable regression checks | fun, emotional attachment, actual retention, willingness to pay/recommend, comprehension across real player populations, social motivation |
| `HUMAN_PLAYER` | A real person playing without developer assistance | enjoyment, motivation, retention intent, confusion across normal users, emotional fantasy, willingness to return, perceived value | implementation state (that is the white-box audit's job) |
| `DEVELOPER_REVIEWER` | Implementation-aware review (white-box pass) | mechanism inventory, root-cause classification | any black-box claim — awareness contaminates the player view |

**A synthetic observation ("I would not come back tomorrow") is a
hypothesis, never a validated human-retention conclusion.** Synthetic runs
generate hypotheses; human testing validates product claims. Claims are
governed by the evidence rules in
[`COMPETITIVE_PRODUCT_LAB.md`](COMPETITIVE_PRODUCT_LAB.md) (§ Experience
claim evidence rules).

Each run also records a run manifest
([`templates/PLAYTEST_RUN_MANIFEST.md`](templates/PLAYTEST_RUN_MANIFEST.md))
with the fields listed there.

## Isolation method (verified 2026-09-05)

The black-box evaluator must not receive source code, Product Lab
findings, architecture/current-state docs, roadmap, competitor analysis,
or product hypotheses before completing the session.

**Primary method — context-isolated subagent driving Playwright
(verified in this environment):**

1. Launch a fresh `general-purpose` subagent whose prompt is ONLY
   [`prompts/blind-player-playtest.md`](prompts/blind-player-playtest.md)
   plus logistics (game URL, screenshot directory, session length).
2. Verified isolation facts (2026-09-05, direct probe): subagents spawned
   in this environment receive the *parent workspace* instruction file
   (`Project_Games/AGENTS.md` — generic agent guardrails) and **not**
   DragonWake's `AGENTS.md` or any DragonWake doc content. No Product Lab,
   direction, or hypothesis material reaches the subagent.
3. Browser-use tooling is main-agent-only, so the subagent drives the game
   through **Playwright from the terminal** and inspects its own
   screenshots via vision. This chain was smoke-tested end-to-end on
   2026-09-05 (navigate → render → screenshot → vision read, zero console
   errors) — see
   [`ZCODE_CAPABILITY_MATRIX.md`](ZCODE_CAPABILITY_MATRIX.md).
4. **Isolation proof:** the run manifest records the evaluator context
   (subagent id, prompt files supplied). The prompt file is the only
   repository material the evaluator may hold; the manifest's
   `CONTAMINATION` field must state `none beyond blind-player prompt` or
   describe the leak. The post-session seven answers double as proof: an
   evaluator exposed to repo docs answers in design language, not player
   language.

**Fallback — neutral fresh session:** open a new ZCode session in a
neutral workspace (no DragonWake files), give it only the blind-player
prompt + URL, drive browser automation from there. Use when subagent
browser automation is unavailable.

**Not supported:** a custom agent with repository-instruction injection
disabled — ZCode exposes no such control in its installed/documented
configuration (`~/.zcode/AGENTS.md` and `<repo>/AGENTS.md` are the only
instruction layers, and neither can be suppressed per-launch). If a future
ZCode version adds such a control, re-verify and update this section.

## Rules of engagement

1. Fresh guest account. Player-honest path only: no `/admin/grant`, no dev
   unlocks, no fixtures. `DEV_FAST_TIME=1` is permitted so the session fits
   (same allowance as [`../design/ALPHA_GAME_FEEL_GATE.md`](../design/ALPHA_GAME_FEEL_GATE.md)).
2. **No repository/design/implementation knowledge before or during play**
   (isolation method above).
3. Play through the rendered UI at the normal player entry point
   (verify the dev command/URL against the README; typically `pnpm dev` →
   `http://localhost:5173`).
4. Capture a screenshot (and note the console/network state when something
   breaks) at every evidence trigger below.
5. Record `EVALUATOR_CLASS`, a run manifest, everything in an EXPERIENCE
   TRACE (format below), and store them per the evidence-storage rules in
   [`../competitive/evidence/README.md`](../competitive/evidence/README.md).

## Session structure

### 0–5 minutes — first contact

- Determine what the game is, from the game alone.
- Understand the immediate objective.
- Inspect the kingdom.
- Perform the first meaningful action.

### 5–15 minutes — core verbs

- Construct or upgrade something.
- Encounter troop management.
- Encounter research.
- Explore the Realm.

### 15–30 minutes — conflict and fantasy

- Scout or attack something; inspect the result.
- Seek out the dragon experience deliberately.
- Investigate social/alliance functionality.
- Determine the next meaningful goal.

### 30–60 minutes — retention honesty

- Continue progression without developer assistance.
- Identify progression friction.
- Identify repetitive tasks.
- Determine whether there is a reason to return later.

## Evidence triggers — capture whenever

- something feels impressive
- something is confusing
- an expected response is absent
- progression is blocked
- a major system is discovered
- combat resolves
- a reward occurs
- a dragon moment occurs
- something appears prototype-like
- excessive text replaces visual communication
- a major interaction has weak feedback

## Post-session questions (answer verbatim, unprompted)

1. In one sentence: what is this game?
2. What did you do first, and why?
3. What are you trying to accomplish next?
4. What did the dragon content feel like — was there a dragon moment?
5. Where were you confused or blocked?
6. What felt like a real game? What felt like a prototype?
7. Would you come back tomorrow? Why / why not?

## EXPERIENCE TRACE format

One row per observed moment:

| Field | Content |
| --- | --- |
| TIME | mm:ss into session |
| ACTION | what the player did |
| PLAYER EXPECTATION | what the player assumed would happen |
| WHAT HAPPENED | what actually happened |
| PLAYER INTERPRETATION | the meaning the player took from it |
| FRICTION | none / minor / major / blocker (+ which system) |
| POSITIVE MOMENT | yes/no + what landed |
| SCREENSHOT/VIDEO REFERENCE | file name or link |
| SEVERITY | for issues: `cosmetic` / `minor` / `major` / `product-blocking` (anchors below) |

Severity anchors: `cosmetic` — polish issue, no comprehension impact ·
`minor` — slows or mildly confuses but the player recovers unaided ·
`major` — misleads, blocks a core verb, or breaks comprehension of a
system · `product-blocking` — prevents progression or destroys the
fantasy/trust needed to keep playing.

Pair every trace with the Screenshot Test
([`COMPETITIVE_PRODUCT_LAB.md` §6](COMPETITIVE_PRODUCT_LAB.md)) for each
major surface visited.

## What this protocol does not do

It does not balance-tune, certify the Alpha fantasy (that remains
[`../design/ALPHA_GAME_FEEL_GATE.md`](../design/ALPHA_GAME_FEEL_GATE.md)),
or authorize implementation. Its output is evidence for the white-box audit
and root-cause classification.
