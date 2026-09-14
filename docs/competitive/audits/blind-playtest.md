# Audit — Blind Playtest Record

Status: **Gate 2 RUN — one synthetic session recorded 2026-09-14.** A
**HUMAN_PLAYER** session is still required to validate fun, motivation, and
retention claims (see evaluator-class boundaries in
[`FTUE_PLAYTEST_PROTOCOL.md`](../../product/FTUE_PLAYTEST_PROTOCOL.md)).

Run per [`../../product/FTUE_PLAYTEST_PROTOCOL.md`](../../product/FTUE_PLAYTEST_PROTOCOL.md)
and [`../../product/prompts/blind-player-playtest.md`](../../product/prompts/blind-player-playtest.md).
One dated section per session; never overwrite a previous record. Raw
captures: `delivery/evidence/20260914-0405-synthA-gate2-ftue/` (run manifest
tracked; screenshot binaries local per
[`../evidence/README.md`](../evidence/README.md)).

---

## Blind playtest — 2026-09-14 (`2d4e422`, 1440x900 + 390x844 spot check)

- Tester: `ses_f61e78956ffe6XKE01mLTgW1Sl` (fresh repository-isolated `general` subagent) — repository-isolated: **YES** (prompt + logistics only; no project files opened by the evaluator)
- `EVALUATOR_CLASS: SYNTHETIC_AGENT`
- Session length: ~23 min wall-clock · Fast-time: YES (`DEV_FAST_TIME=1`)
- Build/API: `2d4e422`; server `0.3.0-s1-stonekeel`, `db=memory`
- Run manifest: [`delivery/evidence/20260914-0405-synthA-gate2-ftue/MANIFEST.md`](../../../delivery/evidence/20260914-0405-synthA-gate2-ftue/MANIFEST.md)
- Known contamination: harness auto-injected repository `AGENTS.md` guardrails mid-run (evaluator reports it did not act on them); developer baseline guests present in the shared world. Synthetic findings are hypotheses.

### Seven answers (verbatim)

**1. In one sentence: what is this game?**
> A browser-based medieval kingdom-builder — claim a keep, build and upgrade the settlement and its lands, train troops, scout and raid camps on a tile world map, and gradually assemble "evidence" of a sleeping dragon that the game frames as the larger campaign.

**2. What did you do first, and why?**
> I created a Forest People guest (`BlindSythA`) and entered the realm, then immediately built a "Homes" from the build palette on the Castle screen — because the objective card told me exactly what to do next ("Raise Homes beyond the first cottage") and the palette was on the same screen, so there was no search cost. That single click produced my first progression (2/10 → 3/10).

**3. What are you trying to accomplish next?**
> I'm stuck on objective **7/10, "Claim a wilderness to strengthen your economy."** My occupy march (48 Levy Spearman) was driven off by a level-3 Rich Farmland, and training is currently resource-blocked (food ≈800, Train button disabled). So next I would wait for food to accrue, train a much larger army, upgrade the Muster Yard/troop capacity, and retry a low-level wild — after that, push Dragon Readiness (currently 1/5) toward the Dragon Scar Expedition.

**4. What did the dragon content feel like — was there a dragon moment?**
> The dragon is a strong *frame* around everything (Realm Awareness Dormant→Stirring, The Roost, Dragon Watch, Dragon Studies, Bestiary, Evidence in the Keep, Dragon Expedition, Scribe's Table) and there is one illustration of a dragon on ruins in the Realm Awareness card. The closest thing to a dragon moment was winning the bandit camp and getting a toast: **"Dragon clue discovered: Shed Scale,"** which filled a clue card and a Bestiary entry. But the dragon never appears, moves, or sounds — the content is delivered as labelled evidence cards and bullet lists. It felt like dragon *bookkeeping* (a progress tracker with a dragon skin) rather than a dragon encounter. So: yes, a small dragon moment existed, but it was a notification, not a spectacle.

**5. Where were you confused or blocked?**
> - **Disabled buttons with no reason:** "Send scouts" and "Claim for the realm" are greyed out until you add a company to the march, but nothing says so or explains why. Late-game, "Train" was disabled with no cost and no reason shown — a hard block (food low) that the UI never names.
> - **Two-step confirms that look like nothing happened:** the first click just relabels the button to "Confirm — …"; I clicked once, saw no change, and assumed it failed.
> - **Reports live elsewhere:** completing "send scouts" gave no report on the Realm screen; I only found the scout intel by opening the War tab (which had a badge). The objective toast never pointed there.
> - **Incomplete gate message:** building the Dragon Watch said "requires further research first" without naming Dragon Studies.
> - **Muster layout overlap:** the "all" button on the Levy Spearman row was physically overlapped by a sibling element and swallowed clicks; I had to use the number input instead.
> - **Duplicate content:** the Bestiary showed the same "Unidentified Creature" card twice.
> - **Split concept:** "Knowledge" is the dragon campaign hub while actual research ("Studies") is back on the Castle screen — I looked in the wrong place first.

**6. What felt like a real game? What felt like a prototype?**
> *Real game:* the core castle loop (build → spend → gain production; stake land; upgrade the Keep to raise caps; train troops; march to a camp and get a proper battle report with rounds, losses and spoils; daily deeds; a coherent 1–10 objective ladder; a readable world map with level-gated camps, wilds and rival settlements). The War dispatches report and the Realm map are the strongest, most "product-like" surfaces.
> *Prototype-like:* the Alliance tab (create/join only, no list, no members, no empty-state copy); several disabled controls with no explanation; the overlapped muster buttons; the duplicated Bestiary entry; and the extremely text-heavy Knowledge tab, where a large amount of dragon "content" is bullet-point text rather than imagery or interaction.

**7. Would you come back tomorrow? Why / why not?**
> Hypothesis (synthetic evaluator, not a claim about humans): probably yes, once. The objective ladder gives me a clear next step and I want to see whether the dragon actually shows up (expedition → The Roost), which is the game's promise. But my return would hinge on the early loop widening: the back half of this session was gated by waiting on food and by trial-and-error clicking on disabled controls, and the social layer currently has nothing in it. If the dragon stays a series of text cards and the resource gate stays unexplained, I'd likely stop after one more sitting.

### EXPERIENCE TRACE

| TIME | ACTION | EXPECTATION | WHAT HAPPENED | INTERPRETATION | FRICTION | POSITIVE | REF | SEVERITY |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 00:20 | Loaded game | See a game | Landing page: "DRAGON WAKE · MVP BETA", "Claim a keep in a dangerous age", Create Guest (name + faction) | A medieval kingdom builder; beta | none | Clean, legible hero screen | 01 | cosmetic |
| 00:50 | Typed name, chose Forest People, Enter | Join a realm | Instant entry, toast "Entered realm", free "Chronite 50", protection to 9/17 | Live game, protected start | none | Onboarding explains itself | 02,03 | none |
| 01:15 | Read Castle screen | Know what to do | Objective **2/10** "Raise Homes"; build palette with costs; Studies; Muster; Daily Deeds; Realm Awareness "Dormant" + The Roost | Clear next step; dragon theme present immediately | none | Objective card + "Next:" hints | 03,04 | none |
| 01:40 | Clicked "Homes" build card | Cost/confirm dialog | Construction began immediately; toast "Building Homes"; no confirm | Clicking a card commits; wanted a confirm for spend | minor (build) | Fast, satisfying first build | 05 | minor |
| 02:00 | Reloaded | See progress | "Construction complete: Homes"; Objective **3/10** "Stake a farmstead in the Lands" | Loop works; resources spent correctly | none | Objective advanced + auto-next | 06 | none |
| 02:20 | Opened Lands | Farm land | 12 "Unclaimed" plots; picking one offers Farmland/Woodland/Quarry/Ore Mine; "Stake as Farmland" (80 food/40 wood) | Clear land system | none | Distinct land-type choice | 07,08 | none |
| 02:50 | Staked farmland | Reward/next | "New plot staked", Food +120→+150/h, Objective **4/10** | Economy responds to decisions | none | Resource rate visibly rose | 09 | none |
| 03:10 | Opened Knowledge | Find research | Knowledge is a **dragon campaign hub** (Awakening path, Dragon Readiness 0/5, Bestiary, Evidence, Expedition, Scribe's Table) — research lives back on Castle | Two different "knowledge" concepts split across tabs | minor (IA) | Campaign path is a strong roadmap | 10 | minor |
| 03:40 | Clicked "Infantry Doctrine" | Open research | Short toast "Studying…" then "Research complete"; study now "level 1 → to level 2" | Research is one-click and near-instant here | minor (no panel; weak read) | Feels snappy | 11 | minor |
| 04:00 | Trained 40 Levy Spearman | Add troops | Toast "Training 40× Levy Spearman"; Realm Awareness flipped **Dormant → Stirring** | Training works; kingdom state reacts | none | Dynamic "Realm Awareness" state | 12 | none |
| 04:30 | Claimed daily deeds | Currency | "Daily deed claimed", Chronite 50→54 | Small reward loop | none | Clear "Claim" affordances | 12,13 | none |
| 05:00 | Opened Realm | World map | Tile grid with Camps (L1–L10), unclaimed Wilds, two other settlements, my keep; legend present | Real world map with content | none | Map reads well; camps have levels | 14 | none |
| 05:30 | Selected Wyrm-Scarred Ruin L10 | Inspect camp | "Threat: grave — wyrm-scarred and deadly", intel after scouting | Camp difficulty is explicit | none | Great camp framing | 15 | none |
| 08:00 | Tried "Send scouts" empty | Dispatch | Button **disabled** with no reason and no hint that a company must be added | Had to guess the rule | major (muster) | — | 16 | major |
| 08:30 | Added 5 Scouts, clicked Send scouts | Send | Button changed to "Confirm — send scouts"; a single click did nothing visible | Two-step confirm is easy to miss | minor (confirm) | Confirm prevents accidents | 17 | minor |
| 09:00 | Confirmed | March out | "Scout march dispatched", map shows "Scout · returning" | Marches are real-time and visible | none | Satisfying movement on map | 17,18 | none |
| 09:30 | Waited/reloaded | See report | Objective **5→6/10**, but **no report appeared on Realm**; only a War badge | Where is my scout intel? | major (discoverability) | — | 18 | major |
| 09:50 | Opened War | Find result | War — Dispatches holds the scout report: L10 camp ~3000 Man-at-Arms + 2000 Halberdier + 1500 Crossbowman | Reports live in War, not with the march | minor (IA) | Genuinely useful intel; nice report card | 19 | minor |
| 11:00 | Attacked Bandit Camp L1 with 90 spears | Battle | Two-step confirm; "all" button overlapped and swallowed clicks; had to type the number input | Muster control layout is fiddly | major (muster/layout) | — | 21,22 | major |
| 12:00 | Confirmed attack | Combat result | Toast stream: "Attack march dispatched / **Dragon clue discovered: Shed Scale** / Victory — your force held the field" | **Dragon moment** — but delivered as a toast, not a scene | minor (delivery) | First dragon clue + victory | 23 | minor |
| 12:20 | Opened War | Battle detail | Report: Rounds 6; Your losses 42 Levy Spearman; Enemy 30 Levy Spearman + 10 Pikeman; Spoils +50 food/+30 wood/+10 stone | Combat is legible and consequential | none | Clear, credible battle report | 24 | none |
| 12:40 | Opened Knowledge | See clue | Bestiary gained entries; **"Unidentified Creature" appears twice**; Evidence 4 clue types, Shed Scale ×1; "Evidence recovered today: 1/3" | Dragon content is mostly textual "evidence" bookkeeping | minor (duplicate) | Clue card + Bestiary populate | 25 | minor |
| 13:20 | Selected Rich Farmland L3 | Claim it | "+40 food/h while held … +120 food/hour … unclaimed"; "Claim for the realm (occupy)" disabled until troops added | Claiming wilds is a military action | minor | Wilds give strategic bonuses | 26,27 | minor |
| 14:00 | Claimed with 48 spears | Gain holding | Two-step "Confirm — send the settlers-at-arms"; then **"Defeat — your force was driven off (occupy)"**, all 48 lost | A "low threat" wild still beat my army | major (balance/feedback) | — | 28,29 | major |
| 15:00 | Tried to train more | Rebuild army | Fill + Train silently did nothing over several attempts; no toast, no error | Why didn't that work? | major (feedback) | — | — | major |
| 16:00 | Built Commanders' Hall | Get a commander | Built instantly ("Construction complete") | Buildings are near-instant | none | — | 32 | none |
| 16:30 | Tried Dragon Watch | Dragon building | Toast: "That structure requires further research first." — but doesn't say which study | Guided failure, incomplete | minor (guidance) | Honest gate message | 31 | minor |
| 17:00 | Researched Dragon Studies | Unlock | Level 1; then Dragon Watch built successfully | Research gates buildings | none | Progress restored | 33,35 | none |
| 17:30 | Upgraded Keep | Grow | "Forge-Heart upgrade queued (L2)" → Keep L2; next L3 1500/1500/900/300 ~270s | Keep gates scale, as advertised | none | Meaningful power step | 34 | none |
| 18:00 | Opened Alliance | Social | Only Create (name/tag), Join by tag, Refresh list — **no list, no members, no empty-state copy** | Social system looks skeletal | major (content) | — | 37 | major |
| 18:30 | Created alliance | Try social | "Alliance created" → "Blind Warband [BLND]", Members, Send, "Allied scouts have not shared a report yet" | Created instantly, but nothing to do with it | minor | — | 38 | minor |
| 19:00 | Opened Settings | Defenses | Withdraw / Garrison / Full defense, protection timer, Log out, Developer tools | Clear defensive posture choice | none | — | 38 | none |
| 19:30 | Switched to 390×844 | Mobile check | Header + tabs wrap to two rows, single-column reflow; a toast overlaps the title slightly | Responsive works; minor overlap | minor (cosmetic) | Usable on mobile | 39,40 | cosmetic |
| 20:30 | Upgraded Dragon Watch to L2 | Dragon progress | "Raising Dragon Watch to level 2" → complete; readiness **1/5** | A concrete dragon-progress checkbox finally lit | none | Readiness moved 0→1/5 | 43,44 | none |
| 21:00 | Inspected Train state | Rebuild | Train button **disabled**; food ≈797; **no cost shown and no reason given** | Hard-blocked on resources with no explanation | blocker (muster) | — | 41 | product-blocking |

### Severity roll-up

| Severity | Count | Findings |
| --- | --- | --- |
| product-blocking | 1 | Train disabled with no cost/reason; no route to understand or recover (2 observations: 15:00, 21:00) |
| major | 5 | Send scouts / Claim disabled with no reason · scout report not surfaced where the march began · muster control overlap swallowed clicks · level-3 wild defeated an apparently-adequate army with no warning · Alliance tab skeletal |
| minor | 8 | build commits with no confirm · research has no panel/result view · two-step confirm reads as failure · reports located in War (IA) · dragon clue delivered as toast · duplicate "Unidentified Creature" · Dragon Watch gate message unnamed · new alliance has nothing to do |
| cosmetic | 2 | mobile toast overlaps the title |
| (none) | 8 | entry, first build, land stake, train feedback, map readability, camp framing, battle report legibility, daily deeds, Keep upgrade |

### Screenshot Test notes (per surface visited)

- **Entry / login** — understood fantasy/importance/interactability/maturity: **Y** (clean, legible; but does not show the dragon or the loop).
- **Castle** — fantasy: **partial** (medieval city reads; the isometric grid is mid-page and small at 1440×900; the dragon is a card, not a presence); importance: Y; interactability: Y; maturity: partial (long stack of text panels).
- **Lands** — fantasy: partial (abstract plot list); importance: Y (objective points here); interactability: Y; maturity: partial.
- **Realm map** — fantasy: partial (readable, content-gated, but a flat tile matrix with hash noise terrain); importance: Y; interactability: Y; maturity: **Y** (strongest surface).
- **War / combat report** — fantasy: partial (authored report card, but text list; victory is a toast); importance: Y; interactability: Y; maturity: partial.
- **Knowledge** — fantasy: partial (strong campaign-path header; body is dense bullet text); importance: partial (readiness gate buried); interactability: Y; maturity: partial.
- **Alliance** — fantasy: **N** (form only, no social presence); importance: partial; interactability: partial; maturity: **N** (skeletal).
- **Dragon surfaces (Presence / Bestiary / Evidence / Expedition)** — fantasy: partial ("bookkeeping" — evidence cards, raw states, duplicate entries; one nice presence illustration); importance: Y; interactability: partial; maturity: partial.
- **Mobile (390×844)** — all surfaces reflow single-column without horizontal overflow; a toast overlaps the title.

### What the blind pass establishes (evidence class)

- `RENDERED UX CLAIM`s above are supported by browser captures under the run evidence dir.
- `SYNTHETIC EXPERIENCE CLAIM`s (the seven answers) are hypotheses for Gate 5 prioritization; they are **not** human-retention conclusions.

---

## Blank template (retained)

```markdown
## Blind playtest — <date> (<build/commit>, <viewport>)

- Tester: <fresh subagent/session id> — repository-isolated: YES/NO
- Session length: <mm> min · Fast-time: YES/NO

### Seven answers (verbatim)
1..7

### EXPERIENCE TRACE
| TIME | ACTION | EXPECTATION | WHAT HAPPENED | INTERPRETATION | FRICTION | POSITIVE | REF | SEVERITY |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

### Screenshot Test notes (per surface visited)
<surface>: understood fantasy/importance/interactability/maturity? Y/N/partial
```
