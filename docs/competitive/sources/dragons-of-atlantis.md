# Source: Dragons of Atlantis (DoA)

Status: **INDEX** — the established DoA evidence baseline lives in the
design docs; this file indexes it and holds only *new* claims the baseline
does not cover.

## Canonical baseline (read first)

- [`../../design/DOA_REFERENCE_MODEL.md`](../../design/DOA_REFERENCE_MODEL.md)
  — evidence-backed reconstruction of historical DoA (claims carry
  evidence class, era, confidence, contamination risk). Authoritative for
  **what historical DoA did**.
- [`../../design/DOA_PARITY_MATRIX.md`](../../design/DOA_PARITY_MATRIX.md)
  — translation workspace to DragonWake dispositions.
- External historical research folder (reference only, non-authoritative
  until normalized into the repo evidence model):
  `C:\Workspace\research\dragons-of-atlantis\pre-implementation\`

## New claims

Add claims below using the format from
[`../../product/prompts/competitor-archaeologist.md`](../../product/prompts/competitor-archaeologist.md).
Upkeep-topic claims recorded 2026-09-14 (Gate 1 partial); see the companion
cross-game survey [`upkeep-genre-survey.md`](upkeep-genre-survey.md).

| Claim ID | Topic | Evidence class | Source | Recorded |
| --- | --- | --- | --- | --- |
| DOA-ECON-002 | Per-troop hourly food upkeep | COMMUNITY-DOCUMENTED | DoA Wiki (Resources / Troops) | 2026-09-14 |
| DOA-ECON-003 | Starvation → desertion | PARTIAL_EVIDENCE | TVTropes + KoC support (sibling) | 2026-09-14 |
| DOA-ECON-004 | "Rationing" research reduces upkeep 5%/level | COMMUNITY-DOCUMENTED | DoA Wiki (Rationing) | 2026-09-14 |
| DOA-ECON-005 | Mature meta: minimal farms, food from camps | COMMUNITY-DOCUMENTED | doawiki.wordpress.com (Lord Punisher) | 2026-09-14 |

**Claim DOA-ECON-002**
- Evidence class: COMMUNITY-DOCUMENTED (STRONG for the mechanism; LOW for exact per-unit values)
- Source: *Dragons Of Atlantis Wiki* (Fandom), "Category:Troops" ("Upkeep: Amount of food eaten per hour per troop") and "Resources" ("If your troops are eating more food than you produce…") — https://dragonsofatlantis.fandom.com/wiki/Category:Troops , https://dragonsofatlantis.fandom.com/wiki/Resources , accessed 2026-09-14, original browser era
- Evidence type (DoA model): COMMUNITY-DOCUMENTED · era MIXED_UNKNOWN · confidence MEDIUM · contamination MEDIUM
- Claim: DoA troops each consumed **Food continuously as "upkeep," expressed as food per hour per troop**; the Fortress production view reported production net of "army consumption," so a growing army reduced net food.
- Player value / failure mode: couples economy and army so army size is a budgeting decision; failure mode is an unbounded food line for players who ignore it.
- Screenshots: none (text-only claim). *Access limitation:* Fandom returns HTTP 403 to automated fetch; mechanism text supported by the search-index excerpt of the cited page.

**Claim DOA-ECON-003**
- Evidence class: PARTIAL_EVIDENCE
- Source: TVTropes, "Wizard Needs Food Badly" ("Kabam games like Dragons of Atlantis and Kingdoms of Camelot require you to keep enough food to feed your troops or they'll desert") — https://tvtropes.org/pmwiki/pmwiki.php/Main/WizardNeedsFoodBadly , accessed 2026-09-14; corroborating sibling: *Kingdoms of Camelot* Support, "Sudden Increase In Troop Upkeep", 2022-04-01 — https://kingdomsofcamelot.zendesk.com (army deserts ~10% at a time when Food runs out)
- Evidence type (DoA model): COMMUNITY-DOCUMENTED · era MATURE_BROWSER · confidence LOW–MEDIUM · contamination HIGH (claim is bundled across Kabam titles and mobile eras)
- Claim: When Food ran out, troops began to **desert**; the explicit ~10%-per-tick rate is documented for *Kingdoms of Camelot*, not independently for browser DoA.
- Player value / failure mode: hard consequence that prevents a free infinite army; failure mode is a punishing spiral for casual/returning players.
- Screenshots: none. *Would verify:* a DoA-era screenshot/report of desertion at zero food.

**Claim DOA-ECON-004**
- Evidence class: COMMUNITY-DOCUMENTED
- Source: *Dragons Of Atlantis Wiki* (Fandom), "Rationing" ("Each upgrade reduces troop's upkeep with 5%") — https://dragonsofatlantis.fandom.com/wiki/Rationing , accessed 2026-09-14
- Evidence type (DoA model): COMMUNITY-DOCUMENTED · era MATURE_BROWSER · confidence MEDIUM–HIGH · contamination MEDIUM
- Claim: DoA had a **"Rationing" research line; each level reduced troop upkeep by 5%** — a progression-based pressure-release valve on the food line.
- Player value / failure mode: gives players a durable answer to upkeep pressure and ties economy to science; the pattern recurs as premium items in sibling titles.
- Screenshots: none. *Access limitation:* Fandom 403 to automated fetch; text via search-index excerpt.

**Claim DOA-ECON-005**
- Evidence class: COMMUNITY-DOCUMENTED
- Source: DoA wiki (Lord Punisher), "Begginer's guide" — https://doawiki.wordpress.com/begginers-guide/ , accessed 2026-09-14 (page retrieved in full)
- Evidence type (DoA model): COMMUNITY-DOCUMENTED · era MATURE_BROWSER · confidence MEDIUM · contamination MEDIUM
- Claim: Mature DoA guidance advised building **almost no city farms** because "food goes negative due to troops," farming Food from Anthropus camps instead; fields also consumed idle population needed for training.
- Player value / failure mode: upkeep shifted the mature economy from internal production toward external raiding; a design must decide whether that is desirable or a degenerate outcome.
- Screenshots: none.
