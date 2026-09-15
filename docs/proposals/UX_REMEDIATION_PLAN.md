# UX Remediation Plan — F3 · F4 · F6 · F8

Status: **PLAN / SPEC ONLY — no implementation in this document.**
Author: PLAN-UX (Wave 1). Prepared: 2026-09-14 · branch `fix/audit-remediation`
(off `feat/imagine-alpha-city-pack` @ `67ab23a`).

Scope: concrete, file-level fix designs for four audit findings. Each section
is independently implementable by the Wave-2 owner named in the session
coordination plan (`/tmp/opencode/dw-fix/PLAN.md`, outside the repo).

Evidence base (read-only): [`../competitive/audits/dragonwake-current-product.md`](../competitive/audits/dragonwake-current-product.md)
findings 3 / 7 / 8 / 13, [`../competitive/audits/blind-playtest.md`](../competitive/audits/blind-playtest.md)
(FTUE rows 01:40, 03:40, 12:00; mobile row 19:30), and `/tmp/opencode/dw-fix/before/**`.

## Hard rules honoured

- `apps/web/src/styles.css` is **read-only**. Every new rule lives in a **new
  file under `apps/web/src/styles/`**, imported by the owning component
  *after* the existing imports, so later-loaded files win at equal
  specificity.
- No new content IDs, no balance changes, no reopening direction/canon.
- Class naming, `data-testid` hooks, TypeScript strict, React 19 function
  components, player-facing copy with no raw ids/enums/API URLs.
- `apps/web/src/styles/hud.css` is also treated as read-only for this work:
  the F3 fix overrides it from the new HUD file rather than editing it.

## Ownership map for the fixes below

| Finding | Wave-2 owner | Files it may write |
| --- | --- | --- |
| F3 toast overlay | IMPL-HUD | `components/Shell.tsx`, `hooks/useGame.ts`, `styles/remediation-hud.css` (new) |
| F4 realm action panel | IMPL-REALM | `components/views/RealmView.tsx`, `components/views/map/RealmMap.tsx`, `styles/remediation-realm.css` (new) |
| F6 build/research feedback | IMPL-CASTLE | `components/views/CastleView.tsx`, `components/views/city/CityGrid.tsx`, `components/views/KnowledgeView.tsx`, `lib/labels.ts`, `styles/remediation-castle.css` (new) |
| F8 first dragon moment | RESEARCH-COMPETITOR + PLAN-UX (spec) then a future slice owner | spec only now; future `components/views/moment/FirstDragonMoment.tsx` + `styles/remediation-dragon-moment.css` |

---

# F3 — Toast stack overlaps primary content

## Finding (evidence)

`F3` (audit: toast overlap; blind mobile row `19:30` "a toast overlaps the
title"; before captures `02-castle.png`, `06-realm-selected-empty.png`,
`07-camp-selected.png`). Current implementation:

- `styles.css:448-459` — `.toast-stack` is `position: fixed; right: 1rem;
  top: 4.6rem; max-width: min(360px, calc(100vw - 2rem))`.
- `styles/hud.css:428-430` — `.toast-stack.hud-toast-stack { z-index: 60 }`.
- `components/Shell.tsx:84-90` — stack rendered as a sibling *before*
  `<header>`; `pointer-events: none` on both stack and `.toast`.
- `hooks/useGame.ts:201-210` — `pushToast` keeps the last **5** toasts
  (`t.slice(-4)` + 1) with a **6000 ms** TTL.

At 1440×900 the centered `.shell` is 1040 px wide (content ≈ 1008 px), so a
`right:1rem` stack spanning up to 360 px sits *inside* the top-right of the
primary content column; at 1280×720 it covers the map's top-right tiles. At
390×844 the stack width is `min(360, 358)` and it covers the header/content.

## Chosen approach — in-flow "notice rail" at the top of `<main>`

Make toasts **part of the document flow** at the top of `<main>` instead of a
fixed overlay. An in-flow region can never overlap content that follows it:
overlap becomes structurally impossible rather than tuned away. Pointer
events stay disabled; the rail is bounded; the stack is capped and
deduplicated; TTL is shortened. This is the only approach that *guarantees*
the acceptance criterion at both required viewports without shrinking the
primary column or relying on gutter width (1440 gutters are only 200 px —
narrower than a readable toast).

Rejected alternatives (documented so they are not re-litigated):
- *Shrink/reposition the fixed stack into the 200 px gutter* — unreadable at
  <200 px; fails at 1024/390.
- *Reserve a fixed top-right column in the shell grid* — changes the whole
  app chrome, touches shared layout, larger blast radius than the finding.
- *Bottom-anchored fixed stack* — still overlaps at 390.

### JSX change — `apps/web/src/components/Shell.tsx`

Move the existing stack block (currently lines 84-90, before `<header>`) to
be the **first child of `<main>`** (currently `<main>` opens at line 132),
and add test hooks. Keep `aria-live`, keep `hud-toast` classes, keep the
per-toast `key`/`kind` classes.

```tsx
<main>
  <div
    className="toast-stack hud-toast-stack"
    aria-live="polite"
    aria-atomic="false"
    data-testid="toast-stack"
    data-count={toasts.length}
  >
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`toast toast-${t.kind} hud-toast`}
        data-testid="toast"
      >
        {t.message}
      </div>
    ))}
  </div>
  {/* existing error/status/tutorial banners, then {children} */}
```

No change to `LoginView.tsx` (its own stack, sparse screen, no primary
content column). The fix is scoped to the authenticated `Shell`.

### Hook change — `apps/web/src/hooks/useGame.ts`

Replace `pushToast` (lines 201-210) with a capped, deduplicated, shorter-TTL
version. Constants live next to the hook so they are greppable and testable:

```ts
const TOAST_MAX_VISIBLE = 3;      // was 5
const TOAST_TTL_MS = 4_000;       // was 6_000
const TOAST_DEDUPE_MS = 3_000;    // collapse repeats instead of stacking

const pushToast = useCallback(
  (message: string, kind: Toast["kind"] = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => {
      const last = t[t.length - 1];
      if (last && last.message === message && id - last.id < TOAST_DEDUPE_MS) {
        // refresh the existing slip's TTL instead of adding a clone
        return [...t.slice(0, -1), { ...last, id, kind }];
      }
      return [...t.slice(-(TOAST_MAX_VISIBLE - 1)), { id, message, kind }];
    });
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, TOAST_TTL_MS);
  },
  [],
);
```

Keep every existing `pushToast` call site unchanged. **Do not remove any
toast**: `alpha-r1.spec.ts:22` asserts a `.toast` reading `Building <name>`
after the first `.city-pick`, and `closed-mockup-v1.spec.ts` waits on
`"Construction complete: Homes"` / `"Research complete: …"`.

### CSS — NEW `apps/web/src/styles/remediation-hud.css`

Imported from `Shell.tsx` **after** `import "../styles/hud.css";`
(`Shell.tsx:3`) so it wins equal-specificity against both `styles.css` and
`hud.css`.

```css
/* F3: in-flow notice rail — structurally cannot overlap primary content. */
.toast-stack.hud-toast-stack {
  position: static;
  inset: auto;
  z-index: auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 360px));
  justify-content: start;
  align-items: start;
  gap: 0.4rem 0.6rem;
  max-width: 100%;
  max-height: 7.6rem;      /* ~2 rows; the 3-toast cap never exceeds this */
  overflow: hidden;
  margin: 0 0 0.6rem;
  pointer-events: none;    /* hard requirement */
}

.hud-toast-stack .hud-toast {
  max-width: 360px;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 0.86rem;
  line-height: 1.35;
  pointer-events: none;    /* hard requirement */
}

@media (max-width: 560px) {
  .toast-stack.hud-toast-stack {
    grid-template-columns: minmax(0, 1fr);
    max-height: 6.6rem;
  }
}
```

Readability is preserved via the existing parchment recipe in
`hud.css:432-456`; kind is communicated by the 4 px left border *and* text
(not colour alone). The cap guarantees the rail's height is bounded, so no
`overflow:hidden` information loss for the 3 newest slips.

### Responsive behaviour

- **1440×900:** rail is one row ≤ 3 slips (2 per row, ≤ 2 rows ≈ 88 px);
  `<header>`, tutorial banner and all page content begin *below* it. No
  overlap by construction; `.toast` never intersects the content column.
- **390×844:** rail is a single column, clamped to ≤ 6.6 rem (~106 px). Page
  scrolls vertically as before; no horizontal overflow (grid child
  `min-width:0`). Title/header are pushed down, never covered.

### Before / after screenshot plan (F3)

| File | Viewport | Steps |
| --- | --- | --- |
| `before/02-castle.png` (exists) | 1440×900 | entry + first build; compare the top-right |
| `before/07-camp-selected.png` (exists) | 1280×720 | stacked toasts over map tiles |
| `before/12-mobile-castle.png` (exists) | 390×844 | mobile toast over header |
| `after/f3-toasts-1440.png` | 1440×900 | enter → build → research → train quickly to hold 3 slips; full-page screenshot |
| `after/f3-toasts-390.png` | 390×844 | same, full-page screenshot |

Capture spec (owned by VERIFY-RENDER, `apps/web/e2e/audit-remediation.spec.ts`):
after triggering, assert `stack.getBoundingClientRect().bottom <= firstContent.getBoundingClientRect().top + 1`,
`document.documentElement.scrollWidth - clientWidth <= 1`, and `getComputedStyle(stack).pointerEvents === "none"`.

### Acceptance criteria (F3)

1. At 1440×900 and 390×844, an active toast stack **never intersects** any
   `main` content element (`bottom ≤ first content top + 1px`).
2. `pointer-events: none` computed on both `.toast-stack` and `.toast`.
3. Visible count is capped at 3; duplicate consecutive messages refresh
   rather than stack; TTL is 4 000 ms, dedupe window 3 000 ms.
4. Messages remain readable (≥ 0.86 rem, wraps, contrast unchanged) and
   `aria-live="polite"` still announces.
5. `alpha-r1.spec.ts` build-toast assertion and the `closed-mockup-v1`
   `Construction complete` / `Research complete` assertions still pass.
6. No console errors; no horizontal overflow at 390.

---

# F4 — Realm tile selection leaves detail + march composer below the map

## Finding (evidence)

`F4` (audit finding 4 region; blind session). In `RealmView.tsx` the DOM order
is: header → `lastResult` → `RealmMap` → `.map-legend` → `.map-jump` →
`.tile-detail` (line 374) → `.composer` (line 431) → commander roster. The
map grid is 20×20 square `aspect-ratio:1` tiles at ~1008 px content width, so
`.map-frame` is ~1000 px tall. Selecting a tile leaves `.tile-detail` and the
whole march composer **below the map**, off the 900 px fold. Evidence:
`before/06-realm-selected-empty.png` (map fills 1440×900; no visible panel)
and `before/07-camp-selected.png`.

## Chosen approach — two-column rail with a sticky action panel + mobile auto-scroll

1. **Desktop (≥ 960 px):** wrap the map column and the action column in a CSS
   grid. The action column (`tile-detail` + `composer` + roster) becomes a
   **sticky right rail**. Because the map column narrows to ~650 px its height
   drops to ~650 px, and the rail is visible beside it at the same time —
   the composer is on screen the moment a tile is selected.
2. **Mobile (< 960 px):** single column, order unchanged (map then rail), and
   on tile selection the rail is **auto-scrolled into view** (`block:"nearest"`)
   so the player never has to scroll past the map manually.

No roles, labels, headings, class names or button names change, so
`closed-mockup-v1.spec.ts`, `alpha-r1.spec.ts`, `r3-responsive-depth.spec.ts`
and `campaign-r1.spec.ts` selectors keep working unchanged.

Rejected alternatives:
- *Fixed bottom sheet on mobile* — overlaps the map and the toast rail,
  complicates `assertNoHorizontalOverflow`, higher risk for zero added value
  over auto-scroll.
- *Collapse the map to a fixed height* — breaks the square-tile visual and
  the drag-to-pan math in `RealmMap.tsx` (`tileW = clientWidth / cols`).

### JSX change — `apps/web/src/components/views/RealmView.tsx`

Add a ref and a guarded scroll effect near the top of the component:

```tsx
const railRef = useRef<HTMLElement | null>(null);
const firstSelect = useRef(true);

useEffect(() => {
  if (!selectedTile) return;
  if (firstSelect.current) { firstSelect.current = false; return; }
  if (!window.matchMedia("(max-width: 959px)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    railRef.current?.scrollIntoView({ block: "nearest" });
  } else {
    railRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}, [selectedTile?.x, selectedTile?.y]);
```

Restructure the returned markup (class names and children preserved):

```tsx
<div className="realm-layout">
  <div className="realm-map-col">
    {mapData ? <RealmMap … /> : <p className="muted">The realm is being surveyed…</p>}
    <div className="map-legend">…unchanged…</div>
    <details className="map-jump">…unchanged…</details>
  </div>

  <aside className="realm-action-rail" ref={railRef} data-testid="realm-action-rail">
    {selectedTile && selectedInfo && (
      <div className="tile-detail card-inset" data-testid="tile-detail">…unchanged…</div>
    )}
    <div className="composer">…unchanged…</div>
    {commandersReady && commanders.length > 0 && (
      <details className="commander-roster">…unchanged…</details>
    )}
  </aside>
</div>
```

`lastResult` stays full-width above the grid. Ordering inside the rail:
`tile-detail` → `composer` → `commander-roster`, so the march actions are the
first thing after the inspected tile.

### Optional test hook — `components/views/map/RealmMap.tsx`

Add `data-testid="realm-map"` to the `.map-frame` root (the fragment's first
`<div>`, line 265). One-attribute change; no behaviour, no CSS impact. Used by
the verification spec to measure the map column.

### CSS — NEW `apps/web/src/styles/remediation-realm.css`

Imported from `RealmView.tsx` after its existing imports.

```css
.realm-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.realm-map-col { min-width: 0; }

.realm-action-rail { min-width: 0; scroll-margin-top: 4rem; }

@media (min-width: 960px) {
  .realm-layout {
    grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
  }
  .realm-action-rail {
    position: sticky;
    top: 0.75rem;
    max-height: calc(100dvh - 1.5rem);
    overflow: auto;
    overscroll-behavior: contain;
  }
  .realm-action-rail .composer { margin-top: 0; }
}

/* The map never needs its own scrollbar inside the narrower desktop column. */
.realm-map-col .map-frame { overflow-x: clip; }
```

### Responsive behaviour

- **1440×900:** map column ≈ 648 px (tiles ≈ 30 px, still ≥ the 14 px
  minimum), map ≈ 648 px tall; sticky rail 360 px is fully visible beside it.
  Selecting a camp shows detail + composer + dispatch buttons without any
  scroll. Headroom inside the rail ≈ 650 px covers the 12-slot comp-grid
  (9 unit types → 3 rows) plus summary/commander/actions; if a roster is
  unusually deep the rail scrolls internally rather than pushing the composer
  off-screen.
- **390×844:** single column, map ≈ 358 px wide (tiles ≈ 15.6 px ≥ 14 px), no
  horizontal overflow. Selecting a tile smooth-scrolls the rail to the top of
  the viewport (respecting reduced motion); the player is *taken* to the
  composer, never asked to scroll past the map.

### Before / after screenshot plan (F4)

| File | Viewport | Steps |
| --- | --- | --- |
| `before/06-realm-selected-empty.png`, `before/07-camp-selected.png` (exist) | 1440×900 / 1280×720 | map-only fold |
| `after/f4-camp-selected-1440.png` | 1440×900 | Realm → travel to a camp → click camp tile; full viewport (no manual scroll) |
| `after/f4-camp-selected-390.png` | 390×844 | same; capture immediately after tile click (auto-scroll has landed) |
| `after/f4-report-open-1440.png` | 1440×900 | optional: dispatch a scout, confirm the rail still shows the armed confirm |

Assertion in `audit-remediation.spec.ts`: after `campTile.click()`, the
`Send attack` / `Send scouts` button's `boundingBox()` is fully inside the
viewport at both sizes **without** calling `scrollIntoView` in the test; and
`scrollWidth - clientWidth <= 1`.

### Acceptance criteria (F4)

1. At 1440×900, selecting a tile shows `.tile-detail` and the composer
   actions in the viewport with no page scroll.
2. At 390×844, selecting a tile brings the rail into view automatically
   (nearest/block), with no horizontal overflow and no layout shift on the
   map tile coordinates.
3. All existing Realm selectors/roles/labels are unchanged: heading
   "The Realm", `.map-jump summary`/`form` + labels X/Y + "Travel", camp tile
   `role=button` name `Bandit Camp, level N, at x, y`, `Bandit Camp . level`
   text, `getByLabel("Scout count to send")`, `Send scouts`,
   `Confirm — send scouts`, `Clear`, `Claim for the realm (occupy)`,
   `Confirm — send the settlers-at-arms`, `abandon-wild`.
4. `closed-mockup-v1.spec.ts`, `alpha-r1.spec.ts`,
   `r3-responsive-depth.spec.ts` and `campaign-r1.spec.ts` pass unchanged.
5. No new console errors.

---

# F6 — Research/build are mute (toast only); build has no confirm

## Finding (evidence)

`F6` (blind FTUE 01:40 "Construction began immediately … no confirm"; 03:40
"one-click and near-instant … no panel; weak read"; audit finding 13 wording
row). Current behaviour:

- `hooks/useGameActions.ts:109-120` — `run(label, fn)` sets the global status
  banner and fires an ok toast; on success there is **no inline result** at
  the place the action happened.
- `doBuild` (`:140-179`) and `doResearch` (`:181-195`) are one click, no
  confirm; the build result surfaces via the `queue_complete` sim event toast
  (`useGame.ts:449-453`) and the on-plot progress in `CityGrid.tsx`.
- **The certified journey commits on a single click**: `closed-mockup-v1.spec.ts`
  step 2 clicks `.city-pick` "Homes" and expects construction to start;
  step 3 clicks `Improve to level 2` (`{force:true}`) and expects level 2.
  `alpha-r1.spec.ts:21-22` clicks `.city-pick` and expects the
  `Building <name>` toast. `closed-mockup` also single-clicks
  `Stake as Farmland`, research tiles and `Infantry Doctrine` / `Dragon
  Studies`; `r3-responsive-depth.spec.ts:132` single-clicks `abandon-wild`.

## CRITICAL conflict with the certified E2E journey

> **A blocking confirm on `.city-pick` or `Improve to level N` would break
> `closed-mockup-v1.spec.ts` steps 2–3 (and `alpha-r1.spec.ts`), and a
> blocking confirm on `abandon-wild` would break
> `r3-responsive-depth.spec.ts`.**
>
> The journey clicks each of those once and then asserts the state change.
> A second "armed" click never happens, so construction/research/abandon
> would never start and the assertions would time out.

Therefore:

- **No blocking confirm is added to** `.city-pick`, `city-build-btn`
  ("Improve to level N"), research buttons, `Stake as Farmland`,
  `abandon-wild`, or training.
- Build satisfies the AC via **visible cost acknowledgment** (a stated
  committed cost + "begins immediately") plus a **persistent inline result
  strip**, not a confirm dialog.
- A **two-step armed confirm is added only to `upgradeKeep`** (Forge-Heart
  upgrade, "Upgrade to L…"). No e2e test clicks it, and it is the genuinely
  expensive, irreversible spend. This reuses the proven pattern from
  `RealmView.tsx` (`confirmIntent` + `.confirm-armed`, `styles.css:812-836`)
  and the `CastleView` "Review the founding" precedent
  (`CastleView.tsx:763-796`).

## Chosen approach — result feedback at the point of action

### A. Build result feedback — `components/views/city/CityGrid.tsx`

1. Track jobs/buildings with refs and diff them to produce an inline,
   `role="status"` result strip inside `.city-detail`:

```tsx
const prevJobs = useRef<Map<number, string>>(new Map());
const [cityResult, setCityResult] = useState<string | null>(null);
useEffect(() => {
  const now = new Map<number, string>();
  for (const j of jobs) if (j.kind === "build") now.set(Number(j.payload.slotIndex), j.id);
  for (const [slot, id] of now) {
    if (!prevJobs.current.has(slot)) {
      setCityResult(
        `${buildingName(String(jobs.find(j => j.id === id)!.payload.buildingType))} — construction started`,
      );
    }
  }
  for (const [slot, id] of prevJobs.current) {
    if (!now.has(slot)) {
      const b = city.buildings.find(x => x.slotIndex === slot);
      setCityResult(b ? `${buildingName(b.buildingType)} — construction complete (level ${b.level})` : null);
    }
  }
  prevJobs.current = now;
}, [jobs, city.buildings]);
```

   Render as the first child of `.city-detail`, with an 8 s clear timer:
   `<p className="city-result" role="status" data-testid="city-result">{cityResult}</p>`.
   The on-plot scaffold/progress already exists and is kept.

2. Cost acknowledgment (no click change): in the "Empty plot" header
   (`CityGrid.tsx:617-626`) add a persistent line
   `Choosing a structure begins construction immediately and commits its cost now.`
   (`.city-commit-note`). The per-option `.city-cost-row` is already visible
   and stays. This is the "visible cost acknowledgment consistent with
   existing patterns" for build.

### B. Research result feedback — `components/views/CastleView.tsx`

1. Derive the **active** research job from `jobs` (kind `"research"`) and
   render a progress row above the Studies grid:
   `data-testid="research-active"`, `role="status"`, e.g.
   "Studying Infantry Doctrine — about 1m left", reusing the existing `.bar`
   markup (same as `Shell.tsx:212-214`).
2. Detect **completion** by diffing `city.research` against a ref; when a
   level rises, render `data-testid="research-result"` `role="status"`:
   `Study complete: {researchName(id)} (level {n})`, cleared after 8 s. The
   `queue_complete` toast is unchanged (the journey depends on it).
3. No confirm on research (journey single-clicks it).

### C. Forge-Heart confirmation — `components/views/CastleView.tsx`

Add `confirmKeep` state mirroring `confirmFound`. First click on
"Upgrade to L…" sets `confirmKeep`; render a `<div className="keep-confirm">`
with an armed primary button `data-testid="keep-upgrade-confirm"`
("Confirm — Upgrade to L…") and a "Not yet" cancel. Costs remain visible via
`data-testid="keep-upgrade-costs"` (asserted by `r3-responsive-depth.spec.ts`).
This is the only new confirm; it is not on any tested path.

### CSS — NEW `apps/web/src/styles/remediation-castle.css`

Imported by `CastleView.tsx` and `CityGrid.tsx` (last import). Additions only:

```css
.city-result,
.castle-result {
  margin: 0 0 0.6rem;
  padding: 0.4rem 0.6rem;
  border-left: 3px solid var(--ok, #8ed59f);
  border-radius: 6px;
  background: color-mix(in srgb, var(--ok, #8ed59f) 10%, transparent);
  font-size: 0.88rem;
}
.city-commit-note { display: block; margin: 0.1rem 0 0.5rem; font-size: 0.78rem; }
.keep-confirm { margin: 0.5rem 0; display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
```

### Responsive behaviour

- **1440×900:** result strip and research progress are inline in the existing
  Castle columns; no new horizontal pressure.
- **390×844:** strips wrap; `.keep-confirm` is `flex-wrap`; no overflow.

### Before / after screenshot plan (F6)

| File | Viewport | Steps |
| --- | --- | --- |
| `before/03-homes-upgraded.png`, `before/09-bestiary-recording.png`, `before/03-muster-shortfall.png` (exist) | mixed | toast-only feedback |
| `after/f6-build-result-1440.png` | 1440×900 | click `.city-pick` "Homes"; capture with `city-result` visible |
| `after/f6-research-result-1440.png` | 1440×900 | click a study; capture during + after (`research-active` → `research-result`) |
| `after/f6-keep-confirm-1440.png` | 1440×900 | click "Upgrade to L…"; capture armed confirm |
| `after/f6-build-result-390.png` | 390×844 | mobile result strip, no overflow |

### Acceptance criteria (F6)

1. Build shows an inline, non-transient-at-the-point-of-action result
   (`city-result`) in addition to the toast; research shows `research-active`
   while running and `research-result` on completion.
2. Build exposes a visible cost acknowledgment before commit; no second click
   is required for `.city-pick` / "Improve to level N".
3. Forge-Heart upgrade has a visible two-step confirm; cancel restores state.
4. `closed-mockup-v1.spec.ts` step 2 (Homes immediate), step 3 (Improve
   immediate), step 5 (research), and step 4 (Stake as Farmland) pass
   unchanged; `alpha-r1.spec.ts` build toast still fires;
   `r3-responsive-depth.spec.ts` `abandon-wild` still single-click.
5. Existing success/error toasts are not removed.

---

# F8 — First Dragon Moment (bounded vertical-slice spec only)

No implementation in this campaign. Scope only, per the Lab vertical-slice
gate ([`../product/COMPETITIVE_PRODUCT_LAB.md`](../product/COMPETITIVE_PRODUCT_LAB.md) §11)
and PLAN.md F8 ("research + spec only, no spectacle implementation").

## The gap

Blind FTUE 12:00: the first dragon evidence arrives as a toast
("Dragon clue discovered: Shed Scale") and a card; the dragon itself never
appears, moves, or sounds — "dragon bookkeeping, not a dragon encounter"
(audit findings 7 and 8, root causes `5 LACKS_VISUALIZATION` /
`8 ASSET_OR_ART_DEFICIENCY`). The first clue is the natural moment: it is the
first dragon fact the player earns, and today it is the least memorable beat
in the session.

## Proposed slice — "The First Sign" (one moment, once per account)

A one-time, **non-blocking** reveal that plays when the account earns its
first dragon clue (clue count transitions `0 → 1`; derived from
`clueData.clues`, no new content IDs, no new mechanics). It plays once, is
skippable, never traps focus, and never blocks input — so the certified
journey (which earns its first clue at step 8) cannot stall.

Bounded pieces:

| Piece | File | Notes |
| --- | --- | --- |
| Trigger | `hooks/useGame.ts` — `refreshKnowledge`/event poll sets a `firstSignAt` flag when clue total goes 0→1, persisted per account (localStorage key or server counter) | No API/schema change in the slice; a server fact is the preferred follow-up |
| Component | NEW `components/views/moment/FirstDragonMoment.tsx` (`data-testid="first-dragon-moment"`) | `role="dialog"` `aria-modal="false"`, `pointer-events:none` on the scrim so play continues, Escape/click/auto-dismiss after ~7 s |
| Copy | `lib/labels.ts` (existing clue label helpers) | No raw ids; reuse the clue name already shown |
| Motion/art | reuse `speciesArtSrc(entryId)` / clue art + CSS keyframes in NEW `styles/remediation-dragon-moment.css` | Phase 2 may mount `AnimatedSprite` with the certified `vale_drake` runtime |
| Persistence | one-time flag | Never replays on reload for the same account |

Explicitly **out of scope** for the slice: audio, cinematics, new dragon
content/IDs, mechanics, balance, and the dev-only `AnimatedSprite` runtime
(`public/art/dragons/vale_drake/sprite/sprite.runtime.json` is
`runtime_status: PREVIEW_ONLY` and its `walk` animation is
`WARN_CONDITIONAL` — not shippable as-is).

## Asset classes (Lab §8 taxonomy)

- **UI/vector / procedural** — frame, ornament, ember particles (CSS/SVG).
- **Animation/VFX** — CSS keyframes on existing stills (slow push-in,
  wing-ember shimmer, clue-plate reveal). No new binaries required.
- **AI-generatable (optional, Phase 2)** — a single 16:9 "first sign" plate
  matching `ALPHA_ROOST_PRESENCE_PLATE`; only if the reuse look is judged
  insufficient.
- **Animation runtime (deferred)** — certify `dragon_vale_drake` sprite
  (`idle` only) before live use; that certification is a separate gate.
- **Audio (deferred, separate campaign)** — requires licensing/asset
  governance and is excluded here.

## Rough cost / risk (ordinal 1–5, Lab §11 — reasoning aid, not a verdict)

| Player impact | Retention | Fantasy | Competitive necessity | Eng cost | Asset cost | Tech risk |
| --- | --- | --- | --- | --- | --- | --- |
| 4 | 3 | 5 | 3 | 2 | 2 | 2 |

Opportunity score ≈ (4+3+5+3)/(2+2+2) ≈ **2.5**. Chief risk is the opposite
of the other findings: over-delivery (a modal that blocks play). The
non-blocking, auto-dismiss, once-per-account constraints are the guardrail;
the second risk is trigger ambiguity (which server fact counts as "first
sign"), resolved by deriving from the clue count for the slice and
server-sourcing it later.

## Before / after test

- **Before:** `before/09-bestiary-recording.png` and
  `before/07-camp-selected.png` — clue delivered only as toast/card.
- **After (future slice):** `after/f8-first-sign-1440.png` and
  `after/f8-first-sign-390.png` captured ~1 s after the first clue.
- **New rendered test** (verification owner):
  `apps/web/e2e/first-dragon-moment.spec.ts` — assert
  `getByTestId("first-dragon-moment")` becomes visible after the first clue,
  auto-dismisses within 9 s, does not intercept a subsequent click
  (`pointer-events` none / element hidden), does not replay after reload, and
  introduces no console error or horizontal overflow at 390×844.
- **Regression:** `closed-mockup-v1.spec.ts` must still pass end-to-end with
  the moment active (it fires during step 8 and must not interrupt step 9).

### Acceptance criteria (F8, spec gate)

1. Slice is bounded to one moment, one trigger, one component, one CSS file,
   one test; no new content IDs, no mechanics, no balance change.
2. Moment is non-blocking (`pointer-events:none` scrim), skippable, and
   auto-dismisses within ~7 s; exactly once per account.
3. Reuses existing clue/species art and label helpers; no un-certified sprite
   runtime shipped.
4. Before/after captures and a rendered regression test exist; the certified
   journey passes with the moment active.
5. Audio, cinematics, and new art commissions remain explicitly out of scope.

---

# Cross-cutting: E2E conflict matrix and evidence plan

## Actions that must stay single-click (do not add a confirm)

| Action | Test that would break | File |
| --- | --- | --- |
| `.city-pick` (new build) | `closed-mockup-v1.spec.ts` step 2; `alpha-r1.spec.ts:21` | `city/CityGrid.tsx` |
| "Improve to level N" | `closed-mockup-v1.spec.ts` step 3 | `city/CityGrid.tsx` |
| Research tile | `closed-mockup-v1.spec.ts` step 5 / step 11 | `CastleView.tsx` |
| `Stake as Farmland` | `closed-mockup-v1.spec.ts` step 4 | `LandsView.tsx` |
| `abandon-wild` | `r3-responsive-depth.spec.ts:132` | `RealmView.tsx` |
| `Clear` in the composer | `closed-mockup-v1.spec.ts` attack helper | `RealmView.tsx` |
| Realm dispatch (already two-step, keep) | `closed-mockup-v1`, `alpha-r1`, `r3` | `RealmView.tsx` |

The only new confirm is Forge-Heart upgrade (untested path). Realm's existing
two-step confirm is untouched.

## Deterministic evidence capture

`apps/web/e2e/audit-remediation.spec.ts` (owned by VERIFY-RENDER) drives one
fresh guest per viewport and writes to `/tmp/opencode/dw-fix/after/`:

1. `f3-toasts-{1440,390}.png` + F3 overlap/overflow/pointer assertions.
2. `f4-camp-selected-{1440,390}.png` + in-viewport dispatch-button assertion.
3. `f6-build-result-1440.png`, `f6-research-result-1440.png`,
   `f6-keep-confirm-1440.png` + `city-result` / `research-result` visibility.
4. `assertNoHorizontalOverflow` at 390 (pattern from
   `r3-responsive-depth.spec.ts:23-28`) after each surface.

## Verification commands (from PLAN.md)

```bash
cd /home/linuxuser/DragonWake
pnpm -r typecheck
pnpm --filter @dragonwake/web test
pnpm --filter @dragonwake/server test
cd apps/web && pnpm exec playwright test e2e/closed-mockup-v1.spec.ts --reporter=list
cd apps/web && pnpm exec playwright test e2e/audit-remediation.spec.ts --reporter=list
```

## Blockers / open questions

1. **F3 in-flow rail** trades "overlay" for a small layout shift when toasts
   appear/disappear. Capped to 3 slips / ≤ 2 rows to minimise it; accepted as
   the price of a structural no-overlap guarantee. If a zero-shift solution is
   required, it needs a permanent reserved rail in the shell grid (larger
   change, not in this campaign).
2. **F3 LoginView** keeps its own fixed stack (not owned by IMPL-HUD, no
   primary content column to obscure). Flagged, not fixed.
3. **F4 auto-scroll on mobile** must be guarded against firing on the first
   paint (handled by `firstSelect`) and against reduced-motion (handled).
4. **F6** cannot add a blocking confirm to build/research/abandon without
   breaking the certified journey — recorded above as the explicit conflict;
   cost acknowledgment + inline result is the substitute.
5. **F8** trigger source (client clue-count diff vs server "first sign" fact)
   is a slice-time decision; the spec recommends client derivation now,
   server fact later.

---

# Appendix — Reconciliation with the working tree (2026-09-14, corrected)

The code below is the shipped implementation, verified against the tree and
confirmed by VERIFY-RENDER plus the adversarial pass. **The shipped code is the
authority for selectors**; the body of this plan is the design record.

| Finding | Shipped approach (actual) | vs plan intent |
| --- | --- | --- |
| F3 | `Shell.tsx` renders the stack as the **first child of `<main>`** (`<div className="toast-stack hud-toast-stack" data-testid="toast-stack" data-count=…>`); `remediation-hud.css` keeps it `position: static` in normal flow at **all** viewports — there is **no fixed/pinned right-gutter variant**. `useGame.pushToast` caps at **3** (`TOAST_MAX_VISIBLE`), TTL **4000 ms** (`TOAST_TTL_MS`), dedupe window **3000 ms** (`TOAST_DEDUPE_MS`); `pointer-events: none` on stack and slips | Exactly the plan's chosen in-flow rail approach |
| F4 | `RealmView.tsx` uses `revealOrders()` on `onSelectTile` (rAF + scroll-into-view, reduced-motion aware, scrolls only when the panel is off-screen); classes `.realm-orders`, `.realm-composer` in `remediation-realm.css`. **Auto-scroll only — no sticky/two-column rail.** Works at 390×844 | AC allowed "sticky/rail **or** auto-scroll"; shipped code is the auto-scroll branch. The two-column rail remains an optional, unshipped upgrade |
| F6 | `CityGrid.tsx` renders `.city-build-result` (`data-testid="city-build-result"`), `.city-build-result-inline` (`data-testid="city-build-result-detail"`), `data-testid="city-build-inprogress"`; `CastleView.tsx` renders `.study-status` (`data-testid="research-status"`) plus per-tech running ETA and "Last completed". **No blocking confirm on any journey path** | Matches the plan's central conclusion exactly (inline result + cost acknowledgment; no blocking confirm on journey paths) |

**Verification status:** VERIFY-RENDER and the adversarial pass confirmed the
rendered behavior. Evidence: raw run artifacts in
`apps/web/e2e/artifacts/`, spec `apps/web/e2e/audit-remediation.spec.ts`, and
the adversarial findings/certification note in
`/tmp/opencode/dw-fix/notes/verify.md`.

Test hooks for the verification owner:

- F3: `data-testid="toast-stack"` and `data-testid="toast"` now exist in
  `Shell.tsx`, so the overlap assertion can target them directly.
- F6: `city-build-result`, `city-build-result-detail`,
  `city-build-inprogress`, `research-status`.
- F4: no dedicated rail test hook — target `.realm-orders` / `.realm-composer`.
- The F2 `upkeep-indicator` / `upkeep-warning` hooks are outside this plan's
  scope and unaffected by the F3 changes.
- Nothing in the shipped work edited `apps/web/src/styles.css`, satisfying the
  shared-hotspot rule.
