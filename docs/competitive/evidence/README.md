# Evidence Directory Policy

Status: **CURRENT AUTHORITY** for where evidence lives and what may be
committed. This resolves storage semantics across the Product Lab; every
other doc defers to this file. Run provenance itself is recorded per
[`../../product/templates/PLAYTEST_RUN_MANIFEST.md`](../../product/templates/PLAYTEST_RUN_MANIFEST.md).

## The three locations and exactly what belongs there

### 1. `delivery/evidence/<RUN_ID>/` — RAW runtime artifacts (per run)

- Screenshots, video, traces, logs, machine-readable results, temporary
  captures — everything produced *during* a run, filed under its
  `RUN_ID` (format defined in the run-manifest template).
- **Tracking:** the run manifest (`.md`) is always Git-tracked. Heavy
  binaries (video, traces, full-screenshot sets) should stay
  **local/untracked by default**; commit them only if small and needed as
  long-term proof. Nothing in `.gitignore` enforces this yet — discipline
  is manual (a targeted ignore rule may be added later).
- Naming: `<RUN_ID>/screenshots/`, `<RUN_ID>/traces/`, `<RUN_ID>/logs/`,
  plus `MANIFEST.md` (the run manifest).

### 2. `docs/competitive/evidence/dragonwake/` — CURATED durable reference evidence

- Only **selected** DragonWake captures that a verdict or comparison
  depends on: baseline references, approved before/after pairs.
- Promotion rule: evidence moves here **after** an evaluation verdict
  uses it (e.g., a before/after pair recorded in the slice's audit), and
  each file references its source `RUN_ID`.
- Naming: `YYYY-MM-DD_<surface>_<viewport>[_before|_after].png` (per
  [`../../product/VISUAL_QA_STRATEGY.md`](../../product/VISUAL_QA_STRATEGY.md)).
- Always Git-tracked. These are our own captures (safe to commit).

### 3. `docs/competitive/sources/` — competitor provenance and URLs

- Claim files with source, URL, access date, game/version, confidence.
  This is where competitor knowledge lives; not an image store.

## Competitor copyrighted material

Remains **external by default**: record URL + provenance + claim in
`sources/` and the matrices. A small lawful internal copy (e.g., a single
low-resolution UI crop required for a matched benchmark that cannot be
described in words) needs a `PROVENANCE.md` entry beside it: source URL,
access date, game/version, and justification. **Never** bulk collections,
videos, sprites, or art dumps.

## Audit trail in one sentence

Raw run → `delivery/evidence/<RUN_ID>/` (manifest tracked, binaries
usually local) → verdict in `docs/competitive/audits/` → selected
captures promoted to `docs/competitive/evidence/dragonwake/` → competitor
claims always in `docs/competitive/sources/` with provenance.

DragonWake is proprietary (see the LICENSE); treat competitor material
with the same discipline we want applied to ours.
