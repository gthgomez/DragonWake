# Imagine explorations — locked to AlphaDesign.png

Status: **ALPHA TEST CANDIDATES**. Vision not locked. Vale Drake production
files untouched. Wired into Castle `CityGrid` with SVG glyph fallback
(`src/lib/alphaBuildings.ts`).

Style lock: `docs/design/reference-art/DragonWake-AlphaDesign.png` (PR #12).

HUD from the mockup is **not** recreated.

Buildings grow in three visual tiers (CLOSED_MOCKUP_V1):

| Levels | Tier | Files |
|---|---|---|
| 1–3 | stone | `bld-*.png` |
| 4–6 | bronze / reinforced | `bld-*-bronze.png` |
| 7–10 | gold / lordly | `bld-*-gold.png` |

CityGrid swaps the raster by building level and scales the sprite up a little at bronze/gold.

| File | Building id |
|---|---|
| `buildings/bld-keep.png` | `forge_heart` |
| `buildings/bld-homes.png` | `habitation` |
| `buildings/bld-barracks.png` | `barracks` |
| `buildings/bld-scriptorium.png` | `archive_spire` |
| `buildings/bld-muster-yard.png` | `rally_quay` |
| `buildings/bld-commanders-hall.png` | `command_gallery` |
| `buildings/bld-watchtower.png` | `lookout` |
| `buildings/bld-dragon-watch.png` | `skyreost` |
| `buildings/bld-storehouse.png` | `saltvault` |
| `buildings/bld-training-camp.png` | `training_camp` |
| `buildings/bld-walls.png` | `seawall` |
| `buildings/bld-forge.png` | `gearfoundry` |
| `dragons/wyrm-roost-perch.png` | roost adult (style lock) |
| `dragons/wyrm-roost-wounded.png` | roost wounded |
| `dragons/wakeclutch-hatchling.png` | Wake-clutch hatchling |
| `dragons/rimehide-wyrm.png` | highland frost ecology |
| `dragons/sootmaw-drake.png` | night hunter |
| `dragons/ash-drake.png` | cinder-scarred (wild list) |
| `dragons/ironback-wyrm.png` | armored highland (wild list) |
| `dragons/ridgeback-wyvern.png` | storm-slate ridge (wild list) |
| `dragons/mirecrown-wyrm.png` | fen domain study |
| `plates/roost-presence.png` | 16:9 Castle presence plate |

Species names and canon mapping: `dragons/SPECIES.md`. Not a fire/ice/earth/wind roster.
