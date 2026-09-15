# Source: Upkeep mechanisms across strategy games (topic survey)

Status: **EVIDENCE COLLECTED — Gate 1 partial (upkeep topic).** Companion to
[`dragons-of-atlantis.md`](dragons-of-atlantis.md) (DoA upkeep claims) and the
historical baseline
[`../../design/DOA_REFERENCE_MODEL.md`](../../design/DOA_REFERENCE_MODEL.md).

Scope: how persistent builder/MMORTS games charge **troop/resource upkeep** and
what happens when a player cannot pay it. Collected 2026-09-14 for the
DragonWake upkeep decision (Part B of
[`../../proposals/SHOP_AND_UPKEEP_PROPOSAL.md`](../../proposals/SHOP_AND_UPKEEP_PROPOSAL.md)).

Method note (honesty about access): Fandom wiki pages return HTTP 403 to
automated fetch, and Travian's help-center pages are JavaScript-rendered, so
several claims below are supported by **search-index excerpts** of the cited
page rather than a full page extraction. Where that is the case the confidence
is capped at `PARTIAL_EVIDENCE` or `STRONG_EVIDENCE` and the limitation is
noted. Nothing here is a DragonWake recommendation; dispositions belong to the
synthesis layer.

---

## Pattern taxonomy (what the genre actually does)

| Pattern | Upkeep basis | Under-payment consequence | Examples |
| --- | --- | --- | --- |
| **Hard upkeep, attrition** | Food/crop per troop per hour (population/buildings too) | Troops desert/die gradually | Dragons of Atlantis, Kingdoms of Camelot, Travian |
| **Soft upkeep, no attrition** | Food per troop per hour | Stores drain; no permanent loss | Lords Mobile, Evony (mobile era) |
| **No troop upkeep** | — | — | Game of War (reinforcements explicitly upkeep-free) |
| **Reduction levers** | — | — | DoA "Rationing" research (−5%/level); KoC "Horn" items (−50%) |

Genre rules of thumb that recur:

1. **Upkeep makes army size an economic decision**, not a free good — the
   economy and the military are coupled through the food line.
2. **Buildings and population can consume too** (Travian), not only troops.
3. **The stock/upkeep ratio caps the sustainable army** (Travian: crop stock
   limits max army size).
4. **Attrition is the hard version; draining is the soft version** — newer
   mobile titles moved toward soft (no permanent loss).
5. **Reduction levers** (research, items, buffs) are the pressure-release
   valve that keeps the mechanic from becoming a newbie trap.

---

## Kingdoms of Camelot (Kabam — DoA's sibling; closest control)

**Claim KOC-ECON-001**
- Evidence class: STRONG_EVIDENCE
- Source: *Kingdoms of Camelot* Support (Zendesk), "Sudden Increase In Troop Upkeep", 2022-04-01 — https://kingdomsofcamelot.zendesk.com (search-index excerpt; official help domain)
- Claim: Once a player's Food runs out, the army begins to desert at roughly **10% at a time** until upkeep can be met.
- Player value / failure mode: gives upkeep teeth and a recovery gradient (not total wipe); failure mode is punishing returning/inexperienced players who do not understand the food line.
- Screenshots: none (text-only claim).

**Claim KOC-ECON-002**
- Evidence class: PARTIAL_EVIDENCE
- Source: *Raging Lunatics* KoC guide, "TROOPS / BUILDING AN ARMY" and "UPKEEP" — https://kingdomsofcamelotguide.weebly.com (search-index excerpt; page nav retrieved, body not)
- Claim: Players are taught to maintain a **positive hourly food margin** (`production − upkeep`), and the game sells **Horn items that reduce troop upkeep by 50%** for 8h/24h/3d.
- Player value / failure mode: same reduction-lever pattern as DoA Rationing, but sold as a consumable/premium convenience.
- Screenshots: none.

## Travian (classic hard-upkeep reference)

**Claim TRAV-ECON-001**
- Evidence class: STRONG_EVIDENCE
- Source: *Travian: Legends* Help Center, "Starvation Mechanics" and "Guide: Resources Explained" — https://support.travian.com/en/articles/83-starvation-mechanics, https://support.travian.com/en/articles/214-guide-resources-explained (official; JS-rendered, search-index excerpts)
- Claim: Every unit stationed in a village — and the village population itself — consumes **Crop per hour**; buildings also consume crop. Net crop = production − consumption.
- Player value / failure mode: makes economy and army a single budgeting problem.
- Screenshots: none.

**Claim TRAV-ECON-002**
- Evidence class: STRONG_EVIDENCE
- Source: *Travian: Legends* Help Center (Starvation Mechanics); *Kingdoms* (Travian successor) Help Center, "Crop Management" — https://support.kingdoms.com/en/articles/20-crop-management (official; search-index excerpts)
- Claim: If crop production is too low or the granary empties, **troops begin to starve and die gradually** until consumption is balanced. Crop stock therefore limits the maximum sustainable army size.
- Player value / failure mode: hard attrition; prevents infinite armies; failure mode is a death spiral for careless players.
- Screenshots: none.

**Claim TRAV-ECON-003**
- Evidence class: PARTIAL_EVIDENCE
- Source: Travian community, "Attack Per Upk" — https://travian.fandom.com/wiki/Troops (search-index excerpt)
- Claim: The community evaluates units partly as **attack per upkeep**, i.e. upkeep is a first-class balancing statistic, not a nuisance.
- Player value / failure mode: upkeep becomes a unit-design axis.
- Screenshots: none.

## Lords Mobile (soft-upkeep reference)

**Claim LMS-ECON-001**
- Evidence class: PARTIAL_EVIDENCE
- Source: *Lords Mobile* Wiki, "Farm" — https://lordsmobile.fandom.com/wiki/Farm (Fandom 403; search-index excerpt)
- Claim: All troops have an **hourly Food upkeep**, consumed from total Food storage continuously ("deleted every second").
- Player value / failure mode: keeps the food line visible and limits unlimited growth.
- Screenshots: none.

**Claim LMS-ECON-002**
- Evidence class: ANECDOTAL
- Source: r/lordsmobile and community guides (e.g. https://www.reddit.com/r/lordsmobile/comments/e1kd03/ ; topgamestrategies.com Lords Mobile troops guide 2026) (search-index excerpts)
- Claim: Community consensus is that in practice players **do not need to maintain positive food upkeep** — troops are not permanently lost when food runs out — so upkeep functions as soft pressure rather than attrition.
- Player value / failure mode: removes the newbie-trap failure mode at the cost of making upkeep a weak constraint.
- Screenshots: none.

## Evony (mixed / era-dependent)

**Claim EVO-ECON-001**
- Evidence class: PARTIAL_EVIDENCE
- Source: *Evony* Wiki, "Food" — https://evony.fandom.com/wiki/Food ; evonybuilds.com, "Basics of Resources" (Fandom 403; search-index excerpts)
- Claim: "Troop Upkeep" is the food **subtracted from gross production to form net production**; the Rally Spot detail screen shows the consumption rate.
- Player value / failure mode: upkeep is presented as a production modifier, making the economy legible.
- Screenshots: none.

**Claim EVO-ECON-002**
- Evidence class: PARTIAL_EVIDENCE
- Source: evony.nerfplz.com, "How to Hold and Store More Food" — https://evony.nerfplz.com/2021/08/how-to-hold-and-store-more-food.html (search-index excerpt)
- Claim: A mobile-era source states **"Troops will never starve, even if you have no food in your castle,"** which conflicts with earlier/other accounts — evidence is era- and version-dependent.
- Player value / failure mode: shows the genre drifting from hard attrition to soft/no consequence; do not generalize across versions.
- Screenshots: none.

## Game of War (no-upkeep data point)

**Claim GOW-ECON-001**
- Evidence class: PARTIAL_EVIDENCE
- Source: *Game of War* Wiki, "Defending" — https://gow-fireage.fandom.com (Fandom 403; search-index excerpt); *Empire Z* App Store changelog ("Troop upkeep will no longer deplete your existing food stores")
- Claim: Reinforcing troops "do not require any upkeep from you, as that falls on the person who owns" them, and later titles in the space **removed/softened** upkeep depletion.
- Player value / failure mode: evidence of the genre trend away from punishing upkeep.
- Screenshots: none.

---

## Cross-game synthesis (evidence framing, not a DragonWake verdict)

- The **hard-attrition pattern** (DoA, KoC, Travian) is the direct lineage
  DragonWake inherits from DoA; the **soft-upkeep pattern** (Lords Mobile,
  Evony mobile, Game of War) is where the genre moved.
- **DoA itself used the hard pattern with a pressure-release valve** —
  per-troop hourly food upkeep plus a Rationing research that reduced it 5%
  per level (see [`dragons-of-atlantis.md`](dragons-of-atlantis.md)).
- DragonWake's own design authority separately warns against a punitive
  "hunger minigame" and asks for "flavor, not punishment"
  (`DRAGON_DOMAIN_HOLDINGS_MATRIX.md:61,196`). That is compatible with
  genre-style upkeep **only if** attrition is softened and a reduction lever
  exists.
- The open decision for Part B is therefore not "does upkeep exist" (DoA says
  yes) but **which pattern**: soft pressure, attrition, and what lever(s)
  relieve it.

## Verification gaps / what would raise confidence

- Full page extraction of the Fandom DoA pages (Resources, Troops, Rationing)
  and the Travian/KoC support articles (blocked/JS) — capture manually and
  store provenance per the evidence policy.
- DoA-specific starvation behavior (desertion rate) — currently a bundled
  Kabam claim corroborated only by KoC; needs a DoA-era source.
- Exact DoA per-troop upkeep values and whether buildings/population consumed
  food (Travian-style) or troops only.
