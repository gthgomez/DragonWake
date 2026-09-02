# R3 deterministic pacing simulation

This report is generated from `apps/server/src/pacing-simulation.ts`. It uses
the shipped fresh-keep production rates and fixed horizon inputs; it does not
use `DEV_FAST_TIME`, wall-clock state, random combat, or Crownmark bailouts.

## Horizon resource snapshots

| Horizon | Food | Wood | Stone | Ore | Crownmarks | Active axes | Softlock risk |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 15 minutes | 4,030 | 4,025 | 4,020 | 4,010 | 4,005 | construction, research, training | low |
| 1 hour | 4,120 | 4,100 | 4,080 | 4,040 | 4,020 | plots, research, mixed force | low |
| Day 1 | 6,880 | 6,400 | 5,920 | 4,960 | 4,480 | PvE, wilderness scouting, research | low |
| Day 3 | 12,640 | 11,200 | 9,760 | 6,880 | 5,440 | mastery, holdings, alliance timing | low |
| Day 7 | 24,160 | 20,800 | 17,440 | 10,720 | 7,360 | advanced PvE, holdings, dragon preparation | low |
| Day 14 | 44,320 | 37,600 | 30,880 | 17,440 | 10,720 | parallel empire and alliance axes | low |
| Day 30 | 90,400 | 76,000 | 61,600 | 32,800 | 18,400 | mature empire, territory, dragon preparation | low |

## Invariants

- Every horizon retains at least three active actions and two productive
  alternatives.
- Ore and stone remain meaningful bottleneck candidates; progression is not a
  Crownmark-only wait loop.
- PvE bands recommend different counter profiles and reward higher bands more;
  scouting is required above Bandit Camps.
- Each listed novice mistake has a non-free recovery action: rebalance,
  reposition, scout a lower band, or abandon/reclaim a wilderness.
- Required progression is milestone/world-gated; no unbounded rare drop is
  required for a charter.

## Evidence

`pacing-simulation.test.ts` verifies the seven horizons, parallel-action
invariants, differentiated PvE bands, reward monotonicity, and all six listed
recovery scenarios.
