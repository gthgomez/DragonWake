# Shop & Reward Remediation — UX/Copy Plan (F1, F7, F8-adjacent)

Status: **PROPOSAL — implementation-ready, Wave 2 (IMPL-CASTLE)**.
Author: PLAN-SHOP · Branch: `fix/audit-remediation` · Date: 2026-09-14.
Scope: **UX and copy only.** No balance changes, no new content IDs, no canon changes.
Balance questions (Dracolith faucet, item prices, starting grant) are owned by
[`AUDIT_REMEDIATION_DECISIONS.md`](AUDIT_REMEDIATION_DECISIONS.md) (PLAN-AUTHORITY).

Companion: [`SHOP_AND_UPKEEP_PROPOSAL.md`](SHOP_AND_UPKEEP_PROPOSAL.md) (Part A
shipped the shop; this document fixes its first-run UX and naming).

---

## 0. Verified current behavior (white-box, HEAD of `fix/audit-remediation`)

| # | Fact | Evidence |
| --- | --- | --- |
| 1 | New player starts with **0 Dracoliths** | `apps/server/src/world.ts:1251-1252` |
| 2 | Faucet = Daily Deeds only, **1 + 1 + 2 = 4/day** | `world.ts:386-402` (`DAILY_QUEST_DEFS`); claim at `world.ts:4064-4089` |
| 3 | Wares cost 20 / 100 / 60 / 360 Dracoliths | `packages/content/data/shop.json`; loaded by `packages/content/src/index.ts:323` |
| 4 | Shop intro never says how to earn Dracoliths | `ShopPanel.tsx:75-77` ("Spend Dracoliths on dispatches and protections…") |
| 5 | Daily Deeds block sits **below** the shop, unlinked | `CastleView.tsx:831-864` (shop), `CastleView.tsx:840` (deeds) |
| 6 | Header shows `Dracoliths {n}` with no distinction from resources | `Shell.tsx:96` |
| 7 | Castle resource row shows **Crownmarks but not Dracoliths** | `CastleView.tsx:487-510` + `RES_LABELS` at `CastleView.tsx:82-88` |
| 8 | Deed reward copy is mis-pluralized: **"1 Dracoliths"** | `CastleView.tsx:850` |
| 9 | `shopEffectLabel` output is wordy/does not name what protection is against | `labels.ts:82-90`; asserted in `labels.test.ts:29-40` |
| 10 | Flavour names ("Relay Riders") carry no function badge | `ShopPanel.tsx:93-101` |

Before evidence already captured: `/tmp/opencode/dw-fix/before/04-shop-open.png`
(0 Dracoliths; every Buy disabled; no earn path on screen).

**Design constraint honored:** item names and prices are content/canon. We keep
both and add clarity around them.

---

## F1 — Shop is dead-on-arrival for a new player

**Problem.** A new lord opens Steward's Wares with 0 Dracoliths, sees four
disabled items (cheapest 20), and is never told that the only faucet is the
Daily Deeds block *further down the same view*. The dead end is informational,
not economic — so the fix is copy + wayfinding in place, no numbers touched.

**Design principles**
1. Teach the earn path **inside the shop**, in both the collapsed summary and
   the open body (the panel is collapsed by default — the summary must carry
   the pointer).
2. **Link** the shop to the Deeds block instead of making the player hunt.
3. Turn the "0 affordable" state into a **visible goal** (progress toward the
   first ware) rather than four dead buttons.
4. Never imply money: state plainly that Dracoliths are earned, not bought.

### 1.1 Exact draft copy

| Surface | Copy |
| --- | --- |
| Collapsed `<summary>` | **Steward's Wares · 0 Dracoliths · earned from Daily Deeds ↓** |
| Open-body lead | **Dracoliths are earned, never bought.** Complete the Daily Deeds at the foot of this Keep — build, train, break a camp — then claim them. |
| Jump control | **Go to Daily Deeds ↓** |
| Earn meter (live) | Today: **1 Dracolith** claimed · **2 Dracoliths** ready to claim · up to **4 a day** |
| First-ware meter | **First ware · Relay Riders** — 0 / 20 Dracoliths · "About 5 days of Daily Deeds at this pace." |
| Blocked Buy (replaces `ShopPanel.tsx:18-22`) | You need **20 more** — earn them from Daily Deeds below. |
| Empty inventory (replaces `ShopPanel.tsx:123`) | You hold no wares yet. Buy your first ware above, then **Use** it from here. |

The first-ware estimate is computed, not hardcoded:
`days = ceil((cheapest.dracolith − player.dracolith) / dailyTotal)`, so it stays
honest if the catalog or faucet ever changes. When already affordable it renders
"Within reach today."

### 1.2 New CSS file (exact path)

Create **`apps/web/src/styles/remediation-castle.css`** (new file; do **not**
edit the shared `apps/web/src/styles.css`). Import it once from
`CastleView.tsx` so it loads after `main.tsx` → `styles.css`. Recommended import
line (near the top of `CastleView.tsx`):

```tsx
import "../../styles/remediation-castle.css";
```

Draft contents:

```css
/* Audit remediation — Castle: Steward's Wares earn-path + currency clarity.
   Loaded from CastleView.tsx, after styles.css. Scoped selectors only; the
   shared styles.css is not edited. */

.shop-panel .shop-earn {
  margin: 0.35rem 0 0.6rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid color-mix(in srgb, var(--gold-text, #e8c777) 35%, var(--border));
  border-radius: 8px;
  background: color-mix(in srgb, var(--gold-text, #e8c777) 8%, transparent);
}
.shop-panel .shop-earn-lead { margin: 0 0 0.25rem; }
.shop-panel .shop-earn .linkish { padding: 0; }

.shop-panel .shop-first-ware { margin: 0 0 0.75rem; }
.shop-panel .shop-first-ware-head {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.shop-panel .shop-item-kind {
  align-self: flex-start;
  padding: 0.05rem 0.4rem;
  border: 1px solid color-mix(in srgb, var(--gold-text, #e8c777) 40%, var(--border));
  border-radius: 999px;
  color: var(--gold-text, #e8c777);
  font-size: 0.75rem;
  letter-spacing: 0.02em;
}

.res-grid .res-premium {
  border-color: color-mix(in srgb, var(--gold-text, #e8c777) 45%, var(--border));
}
.res-rate-earned { color: var(--gold-text, #e8c777); }

.dracolith-chip {
  display: inline-block;
  margin-left: 0.25rem;
  padding: 0.05rem 0.45rem;
  border: 1px solid color-mix(in srgb, var(--gold-text, #e8c777) 45%, var(--border));
  border-radius: 999px;
  color: var(--gold-text, #e8c777);
  font-size: 0.8rem;
  white-space: nowrap;
}
.dracolith-chip.is-claimed { animation: dracolith-pop 0.5s ease-out; }

@keyframes dracolith-pop {
  0%   { transform: scale(0.8); box-shadow: 0 0 0 0 color-mix(in srgb, var(--gold-text, #e8c777) 70%, transparent); }
  100% { transform: scale(1);   box-shadow: 0 0 0 10px transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .dracolith-chip.is-claimed { animation: none; }
}
```

### 1.3 Exact JSX — `ShopPanel.tsx`

New imports / props / derived values:

```tsx
import { fmtNum } from "../../../lib/format";
import { dracolithLabel, shopEffectBadge, shopEffectLabel } from "../../../lib/labels";
import type { DailyQuest, Player, ShopItem } from "../../../lib/types";

type ShopPanelProps = {
  player: Player;
  catalog: ShopItem[];
  inventory: Record<string, number>;
  /** An active construction/research/training queue — a speedup needs one. */
  hasActiveQueue: boolean;
  /** Today's deeds — powers the earn meter and the pointer to Daily Deeds. */
  dailyQuests: DailyQuest[];
  /** Scrolls the Daily Deeds block into view (CastleView owns the anchor). */
  onJumpToDeeds: () => void;
  onBuy: (itemId: string) => Promise<void>;
  onUse: (itemId: string) => Promise<void>;
};
```

```tsx
const dailyTotal   = dailyQuests.reduce((s, q) => s + q.rewardDracolith, 0);
const dailyClaimed = dailyQuests.filter((q) => q.claimed)
  .reduce((s, q) => s + q.rewardDracolith, 0);
const dailyReady   = dailyQuests.filter((q) => q.done && !q.claimed)
  .reduce((s, q) => s + q.rewardDracolith, 0);
const firstWare = catalog.reduce<ShopItem | null>(
  (min, item) => (min == null || item.dracolith < min.dracolith ? item : min),
  null,
);
const toFirst     = firstWare ? Math.max(0, firstWare.dracolith - player.dracolith) : 0;
const daysToFirst = firstWare ? Math.ceil(toFirst / Math.max(1, dailyTotal)) : 0;
```

`<summary>` (replaces `ShopPanel.tsx:68-73`):

```tsx
<summary>
  Steward&apos;s Wares{" "}
  <span className="muted tiny">
    · {dracolithLabel(player.dracolith)} · earned from Daily Deeds ↓
  </span>
</summary>
```

Earn block (insert after the existing intro `<p>` at `ShopPanel.tsx:75-77`):

```tsx
<div className="shop-earn" data-testid="shop-earn-path">
  <p className="shop-earn-lead">
    <strong>Dracoliths are earned, never bought.</strong> Complete the Daily
    Deeds at the foot of this Keep — build, train, break a camp — then claim
    them.
  </p>
  <button type="button" className="linkish" onClick={onJumpToDeeds}>
    Go to Daily Deeds ↓
  </button>
  {dailyTotal > 0 ? (
    <p className="muted tiny" data-testid="shop-earn-meter">
      {dailyClaimed > 0
        ? `Today: ${dracolithLabel(dailyClaimed)} claimed`
        : "Today: none claimed yet"}
      {dailyReady > 0 ? ` · ${dracolithLabel(dailyReady)} ready to claim` : ""}
      {` · up to ${dracolithLabel(dailyTotal)} a day`}
    </p>
  ) : null}
</div>

{firstWare && player.dracolith < firstWare.dracolith ? (
  <div className="shop-first-ware" data-testid="shop-first-ware">
    <div className="shop-first-ware-head">
      <span>First ware · {firstWare.name}</span>
      <span className="muted tiny">
        {fmtNum(player.dracolith)} / {fmtNum(firstWare.dracolith)} Dracoliths
      </span>
    </div>
    <div className="bar">
      <div
        className="bar-fill"
        style={{
          width: `${Math.min(100, (player.dracolith / firstWare.dracolith) * 100)}%`,
        }}
      />
    </div>
    <p className="muted tiny">
      {daysToFirst > 0
        ? `About ${daysToFirst} day${daysToFirst === 1 ? "" : "s"} of Daily Deeds at this pace.`
        : "Within reach today."}
    </p>
  </div>
) : null}
```

Blocked-buy copy (replaces `ShopPanel.tsx:18-22`):

```tsx
function buyBlockedReason(item: ShopItem, balance: number): string | null {
  if (balance < item.dracolith) {
    return `You need ${fmtNum(item.dracolith - balance)} more — earn them from Daily Deeds below.`;
  }
  return null;
}
```

Item card function badge (inside the card, after `ShopPanel.tsx:98`):

```tsx
<span className="shop-item-kind">
  {shopEffectBadge(item.effect.type, item.effect.seconds)}
</span>
```

Empty inventory copy (replaces `ShopPanel.tsx:123`):

```tsx
<p className="muted">
  You hold no wares yet. Buy your first ware above, then <strong>Use</strong> it
  from here.
</p>
```

### 1.4 Exact JSX — `CastleView.tsx`

1. Import the new stylesheet (top of file).
2. Pass the new props to `ShopPanel` (replaces `CastleView.tsx:831-838`):

```tsx
<ShopPanel
  player={player}
  catalog={shopCatalog}
  inventory={inventory}
  hasActiveQueue={jobs.length > 0}
  dailyQuests={dailyQuests}
  onJumpToDeeds={() =>
    document
      .getElementById("daily-deeds")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  onBuy={buyShopItem}
  onUse={useShopItem}
/>
```

3. Give the Deeds block an anchor (replaces `CastleView.tsx:840`):

```tsx
<h3 id="daily-deeds" className="deeds-head">Daily Deeds</h3>
```

`scrollIntoView` is used instead of a bare `#hash` link so it works regardless of
whether the document or `<main>` is the scroll container.

---

## F7 — Currency and naming clarity

**Problem.** Two currencies surface in different places and read alike:
*Crownmarks* is a produceable resource with a `/h` rate; *Dracoliths* is a
premium earned currency with no rate. The header shows Dracoliths; the Castle
resource row shows Crownmarks but **not** Dracoliths, so a player never sees
them side by side. Item flavour names ("Relay Riders") hide the function
(a 1-hour speedup).

**Rule:** keep canon names; make the *kind* of currency and the *function* of a
ware explicit everywhere.

### 2.1 Currency copy

| Surface | Copy |
| --- | --- |
| Header (`Shell.tsx:96`) | `{player.displayName} · Dracoliths {player.dracolith} · earned` (add `title`/aria: "Earned from Daily Deeds — never bought.") |
| Castle resource row (new tile) | Label **Dracoliths**; value; sub-line **earned · Daily Deeds ↓** — deliberately **no `/h` rate**, unlike Crownmarks |
| Currency tooltips | Dracoliths: "Earned from Daily Deeds — never bought." · Crownmarks: "A standard resource from your settlements and wilds." |
| Lands resource row (`LandsView.tsx:105`) | Use the shared `resourceLabel` helper instead of the hardcoded `"Crownmarks"` ternary (consistency; owner IMPL-SOCIAL) |

New Castle resource tile (insert after the `city.resources` map at
`CastleView.tsx:487-510`):

```tsx
<li className="res-premium" data-testid="res-dracolith">
  <strong className="res-head">
    <Icon name="dragon" size={16} />
    Dracoliths
  </strong>
  <span className="res-val">{fmtNum(player.dracolith)}</span>
  <span className="res-rate res-rate-earned">earned · Daily Deeds ↓</span>
</li>
```

Uses the existing `dragon` icon — **no new asset or content ID**.

### 2.2 Shop naming/effect copy

Add a short function badge beside every flavour name so the name cannot hide the
effect, then keep a plain sentence as the detail:

| Ware | Badge (`shopEffectBadge`) | Detail (`shopEffectLabel`) |
| --- | --- | --- |
| Relay Riders | Speed-up · 1h | Shortens the soonest construction, research, or training by 1h. |
| Writ of the Long March | Speed-up · 8h | Shortens the soonest construction, research, or training by 8h. |
| Garrison Alert | Protection · 12h | Extends protection from attacks by 12h (up to 30 days). |
| Grand Truce | Protection · 72h | Extends protection from attacks by 72h (up to 30 days). |

### 2.3 `labels.ts` — proposed helper/copy (DO NOT EDIT HERE; owner IMPL-CASTLE)

`apps/web/src/lib/labels.ts` is another agent's file. It should expose exactly
these additions (reusing the module-private `effectDuration`):

```ts
/** Singular/plural for the premium earned currency (fixes "1 Dracoliths"). */
export function dracolithLabel(n: number): string {
  return `${n} Dracolith${n === 1 ? "" : "s"}`;
}

/** Short function noun for a ware, so the flavour name can't hide what it does. */
export function shopEffectBadge(type: string, seconds?: number): string {
  if (type === "speedup_sec") return `Speed-up · ${effectDuration(seconds)}`;
  if (type === "shield_sec")  return `Protection · ${effectDuration(seconds)}`;
  return prettify(type || "Ware");
}

/** One-line currency explainers for titles/aria (F7). */
export function currencyExplainer(key: "dracolith" | "crownmark"): string {
  return key === "dracolith"
    ? "Earned from Daily Deeds — never bought."
    : "A standard resource from your settlements and wilds.";
}
```

Revised `shopEffectLabel` body (same signature):

```ts
export function shopEffectLabel(type: string, seconds?: number): string {
  if (type === "speedup_sec") {
    return `Shortens the soonest construction, research, or training by ${effectDuration(seconds)}.`;
  }
  if (type === "shield_sec") {
    return `Extends protection from attacks by ${effectDuration(seconds)} (up to 30 days).`;
  }
  return prettify(type || "unknown effect");
}
```

**Test impact:** `apps/web/src/lib/labels.test.ts:29-40` asserts the old
`shopEffectLabel` strings; IMPL-CASTLE must update those expectations and add
cases for `dracolithLabel` (0/1/2) and `shopEffectBadge`. This is an intentional,
reviewed change — not a silenced test.

---

## F8-adjacent — reward cadence UX (presentation only, no amount change)

**Problem.** The faucet is 4 Dracoliths/day in 1/1/2 increments; at 20+ per ware
each reward can feel negligible. The amount stays as-is; the **presentation**
must make each Deed feel like progress.

**Design**
1. **Claim as a moment, in place.** Each Deed row shows a currency chip that
   animates on claim (`+1 Dracolith`, `+2 Dracoliths`) using `.dracolith-chip`
   and the `dracolith-pop` keyframe. This is independent of the toast stack (F3,
   IMPL-HUD) — the reward is visible even if a toast is missed.
2. **Running tally.** The Deeds block gains a summary line: "Today: {X}
   claimed · {Y} ready"; the shop's earn meter (F1) shows the same numbers, so
   the two surfaces feel like one purse.
3. **Progress toward a goal.** The "First ware" meter converts a 0-balance dead
   end into a filling bar; every claimed Deed visibly advances it.
4. **One identity for the currency.** Same gold chip styling in the header, the
   Castle resource tile, the Deeds rows, and the shop, so Dracoliths read as a
   single, recognizable currency distinct from Crownmarks.
5. **Accessibility.** `prefers-reduced-motion: reduce` disables the pop; the chip
   text alone conveys the gain.

### 3.1 Deeds block changes (`CastleView.tsx:840-863`)

Derived values near the other `CastleView` consts:

```tsx
const deedsTotal   = dailyQuests.reduce((s, q) => s + q.rewardDracolith, 0);
const deedsClaimed = dailyQuests.filter((q) => q.claimed)
  .reduce((s, q) => s + q.rewardDracolith, 0);
const deedsReady   = dailyQuests.filter((q) => q.done && !q.claimed)
  .reduce((s, q) => s + q.rewardDracolith, 0);
```

Header + summary (replaces `CastleView.tsx:840`):

```tsx
<h3 id="daily-deeds" className="deeds-head">Daily Deeds</h3>
{dailyQuests.length > 0 ? (
  <p className="muted tiny" data-testid="deeds-summary">
    Today: {dracolithLabel(deedsClaimed)} claimed
    {deedsReady > 0 ? ` · ${dracolithLabel(deedsReady)} ready` : ""}
    {" · "}
    +{dracolithLabel(deedsTotal)} available
  </p>
) : null}
```

Reward chip (replaces the inline `+{q.rewardDracolith} Dracoliths` at
`CastleView.tsx:850`):

```tsx
<span className={q.claimed ? "dracolith-chip is-claimed" : "dracolith-chip"}>
  +{dracolithLabel(q.rewardDracolith)}
</span>
```

This fixes the "1 Dracoliths" pluralization bug (finding #8) and gives the claim
a visible reward moment. CSS is in `remediation-castle.css` (§1.2).

---

## 4. Files touched (ownership)

| File | Change | Owner |
| --- | --- | --- |
| `apps/web/src/components/views/shop/ShopPanel.tsx` | earn path, first-ware meter, function badge, blocked copy | IMPL-CASTLE |
| `apps/web/src/components/views/CastleView.tsx` | pass `dailyQuests`/`onJumpToDeeds`; `#daily-deeds` anchor; Deeds summary + chips; Dracolith tile; stylesheet import | IMPL-CASTLE |
| `apps/web/src/styles/remediation-castle.css` | **new file** (§1.2) | IMPL-CASTLE |
| `apps/web/src/lib/labels.ts` | proposed helpers `dracolithLabel`, `shopEffectBadge`, `currencyExplainer`; revised `shopEffectLabel` | labels owner (do not edit here) |
| `apps/web/src/lib/labels.test.ts` | update effect expectations + new helper cases | labels owner |
| `apps/web/src/components/Shell.tsx` | header "· earned" + currency title | IMPL-HUD |
| `apps/web/src/components/views/LandsView.tsx` | use `resourceLabel` (optional consistency) | IMPL-SOCIAL |
| `apps/web/e2e/audit-remediation.spec.ts` | assertions + screenshots | VERIFY-RENDER |

No changes to `packages/content/data/shop.json`, `apps/server/src/world.ts`
(`DAILY_QUEST_DEFS`), or `apps/web/src/styles.css`.

---

## 5. Acceptance criteria

**F1 — earn path in place**
- [ ] The Steward's Wares summary states the balance **and** "earned from Daily Deeds ↓" while collapsed.
- [ ] With 0 Dracoliths, the open panel shows the earn lead, a working "Go to Daily Deeds ↓" control that scrolls the Deeds block to the top of the viewport, and the "First ware" progress meter.
- [ ] Disabled Buy buttons explain the shortfall **and** name Daily Deeds as the source.
- [ ] No price, faucet, starting balance, or content ID changed (grep proof in §6).

**F7 — naming**
- [ ] Castle resource row shows Dracoliths as a premium tile with **no `/h` rate** and the "earned · Daily Deeds ↓" sub-line; Crownmarks keeps its rate and stays visually distinct.
- [ ] Header labels the currency as earned with an accessible currency explainer.
- [ ] Every ware shows a `Speed-up`/`Protection` badge plus a plain effect sentence; "protection" names what it protects against.
- [ ] Singular/plural correct: "1 Dracolith", "2 Dracoliths".
- [ ] `labels.test.ts` updated and green.

**Reward UX**
- [ ] Claiming a Deed renders an in-place `+N Dracolith(s)` chip that animates, and updates the "Today: …" summary and the shop meter without a reload artifact.
- [ ] The reward is shown without depending on the toast stack.
- [ ] `prefers-reduced-motion: reduce` removes the animation; the chip text still conveys the gain.
- [ ] 390×844: no horizontal overflow; chips and meters wrap cleanly.

**Global**
- [ ] No raw ids/enums/API URLs in player-facing copy.
- [ ] `pnpm -r typecheck`, `pnpm --filter @dragonwake/web test`, and the closed-mockup Playwright spec pass.

---

## 6. Before/after screenshot plan

Harness: `apps/web/e2e/audit-remediation.spec.ts` (VERIFY-RENDER). Reuses the
running dev servers; 1440×900 and 390×844.

**Before (already captured):** `/tmp/opencode/dw-fix/before/04-shop-open.png`.

**After (`/tmp/opencode/dw-fix/after/`):**

| File | State | Must show |
| --- | --- | --- |
| `04-shop-open.png` | new player, 0 Dracoliths, panel open | earn lead + "Go to Daily Deeds ↓" + first-ware meter; collapsed summary text asserted |
| `04-shop-open-mobile.png` | same at 390×844 | no overflow, controls usable |
| `04b-deed-claimed.png` | one Deed claimed | `+1 Dracolith` chip (animated class), "Today: 1 Dracolith claimed", shop meter advanced |
| `04c-shop-affordable.png` | state with ≥20 Dracoliths | first-ware meter hidden; Buy enabled; no stale "need more" copy |
| `04d-res-row.png` | Castle resource row | Dracoliths tile (earned, no rate) beside Crownmarks (with rate) |

Suggested stable test hooks (already in the JSX above): `shop-earn-path`,
`shop-earn-meter`, `shop-first-ware`, `res-dracolith`, `deeds-summary`,
`shop-item-<id>`, `shop-panel`.

Assertions: summary text matches; `#daily-deeds` scroll lands; earn meter equals
deeds claimed; first-ware percentage equals `balance / cheapest`; no element
overflows its container at 390.

---

## 7. Out of scope (balance) — see `AUDIT_REMEDIATION_DECISIONS.md`

The following are **deliberately not addressed here** and belong to
PLAN-AUTHORITY's decision doc:

- Changing the Dracolith **faucet** (Daily Deed rewards 1/1/2) or its cadence.
- Changing **item prices** (20/100/60/360) or the price ladder.
- Any **starting Dracolith grant** for new players.
- Adding new wares/content IDs, changing shield caps or speedup mechanics.
- Any IAP / real-money source (design law: none — `docs/CURRENT_STATE.md`).

This plan only changes how the existing economy is **explained, linked, and
presented**. If the decision doc changes any of the above, the copy in §1.1 is
written to compute from the catalog/quests and stays valid; only the "days"
estimate and the "up to N a day" line re-derive automatically.

---

## 8. Blockers / coordination

1. **`AUDIT_REMEDIATION_DECISIONS.md` does not exist yet** (PLAN-AUTHORITY, Wave 1). Referenced by path; out-of-scope items must be confirmed there before any faucet/price follow-up.
2. **`labels.ts` ownership** — helpers in §2.3 must be added by that file's owner; ShopPanel/CastleView imports fail until then. Coordinate before IMPL-CASTLE merges.
3. **`Shell.tsx` header copy** is IMPL-HUD's file (F7 AC spans header + resource rows) — needs a one-line handoff.
4. **`LandsView.tsx` label consistency** is IMPL-SOCIAL's file (optional).
5. **Toast interaction** — the reward chip is intentionally independent of the F3 toast fix (IMPL-HUD). If IMPL-HUD adds a Dracolith/quest toast, keep the chip as the in-place proof so the two do not double-announce.
