import { useState } from "react";

import { fmtNum } from "../../../lib/format";
import { shopEffectLabel } from "../../../lib/labels";
import type { Player, ShopItem } from "../../../lib/types";

type ShopPanelProps = {
  player: Player;
  catalog: ShopItem[];
  inventory: Record<string, number>;
  /** An active construction/research/training queue — a speedup needs one. */
  hasActiveQueue: boolean;
  onBuy: (itemId: string) => Promise<void>;
  onUse: (itemId: string) => Promise<void>;
};

/** Inline reason a purchase is blocked, or null when it can proceed. */
function buyBlockedReason(item: ShopItem, balance: number): string | null {
  if (balance < item.dracolith) {
    return `You need ${fmtNum(item.dracolith - balance)} more Dracoliths.`;
  }
  return null;
}

/** Inline reason an owned item cannot be used right now, or null when usable. */
function useBlockedReason(
  item: ShopItem,
  hasActiveQueue: boolean,
): string | null {
  if (item.effect.type === "speedup_sec" && !hasActiveQueue) {
    return "No construction, research, or training is under way here to speed up.";
  }
  return null;
}

/**
 * Steward's Wares — the Dracolith shop on the Castle view.
 * Collapsed by default so the keep stays the focus; every blocked action
 * states its reason inline rather than relying on a tooltip.
 */
export function ShopPanel({
  player,
  catalog,
  inventory,
  hasActiveQueue,
  onBuy,
  onUse,
}: ShopPanelProps) {
  const [pending, setPending] = useState<string | null>(null);

  const runAction = async (
    key: string,
    action: (itemId: string) => Promise<void>,
    itemId: string,
  ) => {
    setPending(key);
    try {
      await action(itemId);
    } finally {
      setPending(null);
    }
  };

  const ownedItems = catalog.filter((item) => (inventory[item.id] ?? 0) > 0);

  return (
    <details className="shop-panel" data-testid="shop-panel">
      <summary>
        Steward's Wares{" "}
        <span className="muted tiny">
          · {fmtNum(player.dracolith)} Dracoliths
        </span>
      </summary>

      <p className="muted tiny">
        Spend Dracoliths on dispatches and protections for your realm.
      </p>

      {catalog.length === 0 ? (
        <p className="muted">The steward has no wares to offer yet.</p>
      ) : (
        <div className="shop-grid">
          {catalog.map((item) => {
            const owned = inventory[item.id] ?? 0;
            const blocked = buyBlockedReason(item, player.dracolith);
            const busy = pending === `buy:${item.id}`;
            return (
              <div
                key={item.id}
                className="shop-item"
                data-testid={`shop-item-${item.id}`}
              >
                <div className="shop-item-head">
                  <span className="shop-item-name">{item.name}</span>
                  <span className="shop-item-cost">
                    {fmtNum(item.dracolith)} Dracoliths
                  </span>
                </div>
                <p className="shop-item-effect">
                  {shopEffectLabel(item.effect.type, item.effect.seconds)}
                </p>
                <p className="muted tiny">Owned: {owned}</p>
                <button
                  type="button"
                  disabled={blocked != null || busy}
                  onClick={() =>
                    void runAction(`buy:${item.id}`, onBuy, item.id)
                  }
                >
                  {busy ? "Buying…" : "Buy"}
                </button>
                {blocked ? (
                  <span className="action-hint">{blocked}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <h4 className="shop-inventory-head">Your wares</h4>
      {ownedItems.length === 0 ? (
        <p className="muted">You hold no wares yet.</p>
      ) : (
        <ul className="shop-inventory">
          {ownedItems.map((item) => {
            const blocked = useBlockedReason(item, hasActiveQueue);
            const busy = pending === `use:${item.id}`;
            return (
              <li key={item.id} className="plot-row">
                <div>
                  {item.name}{" "}
                  <span className="muted tiny">
                    ×{inventory[item.id] ?? 0} ·{" "}
                    {shopEffectLabel(item.effect.type, item.effect.seconds)}
                  </span>
                </div>
                <div className="shop-use">
                  <button
                    type="button"
                    disabled={blocked != null || busy}
                    onClick={() =>
                      void runAction(`use:${item.id}`, onUse, item.id)
                    }
                  >
                    {busy ? "Using…" : "Use"}
                  </button>
                  {blocked ? (
                    <span className="action-hint">{blocked}</span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </details>
  );
}
