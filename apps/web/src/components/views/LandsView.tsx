import { useEffect, useState } from "react";

import { canAfford, fmtNum } from "../../lib/format";
import { PLOT_ASSIGN_COST } from "../../lib/gameConfig";
import { Icon, type IconName } from "../../ui/icons";
import type { City, Resources } from "../../lib/types";

type Plot = City["plots"][number];

type LandsViewProps = {
  city: City;
  assignPlot: (slotIndex: number, plotType: string) => Promise<void>;
  upgradePlot: (slotIndex: number, level: number) => Promise<void>;
};

type PlotTypeId = "farm" | "lumber_yard" | "quarry" | "mine";

const PLOT_TYPES: {
  id: PlotTypeId;
  name: string;
  glyph: IconName;
  resource: keyof Resources;
  blurb: string;
}[] = [
  {
    id: "farm",
    name: "Farmland",
    glyph: "food",
    resource: "food",
    blurb: "Ploughed fields and grain — the bread of the realm.",
  },
  {
    id: "lumber_yard",
    name: "Timber Camp",
    glyph: "timber",
    resource: "timber",
    blurb: "Fellers and saw-pits feeding the builder's yards.",
  },
  {
    id: "quarry",
    name: "Quarry",
    glyph: "stone",
    resource: "stone",
    blurb: "Cut stone for walls, keeps, and roads.",
  },
  {
    id: "mine",
    name: "Iron Mine",
    glyph: "iron",
    resource: "iron",
    blurb: "Shafts and adits yielding ore for the smiths.",
  },
];

function plotDef(id: string) {
  return PLOT_TYPES.find((p) => p.id === id);
}

/** Production rate for a plot: base + level*30 (server: productionPerHour). */
function plotRate(type: keyof Resources, level: number): number {
  void type;
  return level > 0 ? level * 30 : 0;
}

/** Wilderness bonus wording so claims and lands read as one economy. */
const WILD_RELATION: Record<string, string> = {
  farm: "Held Rich Farmland adds +40 food/h to the whole realm.",
  lumber_yard: "Held Deepwood adds +30 timber/h to the whole realm.",
  quarry: "Held Stone Quarries add +25 stone/h to the whole realm.",
  mine: "Held Iron Hills add +15 iron/h to the whole realm.",
};

export function LandsView({ city, assignPlot, upgradePlot }: LandsViewProps) {
  const rates = city.productionPerHour;
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [pendingType, setPendingType] = useState<PlotTypeId>("farm");

  useEffect(() => setSelectedSlot(null), [city.id]);

  const selected: Plot | null =
    selectedSlot === null
      ? null
      : (city.plots.find((p) => p.slotIndex === selectedSlot) ?? null);
  const selectedInfo = selected?.plotType ? plotDef(selected.plotType) : null;

  return (
    <section className="card">
      <header className="castle-head">
        <div>
          <h2>The Lands of {city.name}</h2>
          <p className="muted tiny">
            The estates that feed and supply your keep. Stake new ground or
            work it more intensively.
          </p>
        </div>
      </header>

      {rates && (
        <ul className="res-grid" aria-label="Realm production">
          {(Object.keys(rates) as (keyof Resources)[]).map((k) => (
            <li key={k}>
              <strong className="res-head">
                <Icon name={k as IconName} size={16} />
                {k === "coin" ? "Coin" : k.charAt(0).toUpperCase() + k.slice(1)}
              </strong>
              <span className="res-val">+{fmtNum(rates[k])}/h</span>
            </li>
          ))}
        </ul>
      )}

      <div className="lands-layout">
        <div
          className="lands-grid"
          role="group"
          aria-label="Resource plots"
        >
          {city.plots.map((p) => {
            const info = p.plotType ? plotDef(p.plotType) : null;
            const isSel = p.slotIndex === selectedSlot;
            return (
              <button
                key={p.slotIndex}
                type="button"
                className={[
                  "lands-tile",
                  info ? "lands-tile-worked" : "lands-tile-empty",
                  `lands-${p.plotType ?? "none"}`,
                  isSel ? "lands-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={
                  info
                    ? `${info.name}, level ${p.level}`
                    : `Unclaimed plot ${p.slotIndex}`
                }
                aria-pressed={isSel}
                onClick={() =>
                  setSelectedSlot(isSel ? null : p.slotIndex)
                }
              >
                <span className="lands-glyph" aria-hidden="true">
                  {info ? <Icon name={info.glyph} size={22} /> : <Icon name="hammer" size={18} />}
                </span>
                <span className="lands-tile-name">
                  {info ? info.name : "Unclaimed"}
                </span>
                {p.level > 0 && (
                  <span className="lands-pips" aria-hidden="true">
                    {Array.from({ length: p.level }, (_, i) => (
                      <i key={i} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <aside className="lands-detail" aria-live="polite">
          {selected && !selected.plotType ? (
            <div>
              <h4>Unclaimed ground</h4>
              <p className="tiny">
                Stake this plot to work it for the realm. Staking costs{" "}
                {PLOT_ASSIGN_COST.food} food and {PLOT_ASSIGN_COST.timber}{" "}
                timber.
              </p>
              <div className="city-pick-grid">
                {PLOT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="city-pick"
                    onClick={() => setPendingType(t.id)}
                    aria-pressed={pendingType === t.id}
                  >
                    <span className="city-pick-name">
                      <Icon name={t.glyph} size={14} /> {t.name}
                    </span>
                    <span className="muted tiny">{t.blurb}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="city-build-btn"
                disabled={!canAfford(city.resources, PLOT_ASSIGN_COST)}
                onClick={() => void assignPlot(selected.slotIndex, pendingType)}
              >
                Stake as {plotDef(pendingType)?.name}
              </button>
            </div>
          ) : selected && selectedInfo ? (
            <div>
              <header className="city-detail-head">
                <span className="city-detail-glyph" aria-hidden="true">
                  <Icon name={selectedInfo.glyph} size={26} />
                </span>
                <div>
                  <h4>{selectedInfo.name}</h4>
                  <p className="muted tiny">
                    Level {selected.level} of 5
                  </p>
                </div>
              </header>
              <p className="tiny">{selectedInfo.blurb}</p>
              <p className="city-effect">
                <strong>Now:</strong> +{plotRate(selectedInfo.resource, selected.level)}{" "}
                {selectedInfo.resource}/h to the realm
              </p>
              {selected.level < 5 ? (
                <>
                  <p className="city-effect">
                    <strong>Next:</strong> +
                    {plotRate(selectedInfo.resource, selected.level + 1)}{" "}
                    {selectedInfo.resource}/h
                  </p>
                  <div className="city-cost-row">
                    <span
                      className={`city-cost ${
                        (city.resources.food ?? 0) < 50 * selected.level
                          ? "city-cost-short"
                          : ""
                      }`}
                    >
                      <Icon name="food" size={14} /> {50 * selected.level}
                    </span>
                    <span
                      className={`city-cost ${
                        (city.resources.timber ?? 0) < 50 * selected.level
                          ? "city-cost-short"
                          : ""
                      }`}
                    >
                      <Icon name="timber" size={14} /> {50 * selected.level}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="city-build-btn"
                    disabled={
                      !canAfford(city.resources, {
                        food: 50 * selected.level,
                        timber: 50 * selected.level,
                      })
                    }
                    onClick={() =>
                      void upgradePlot(selected.slotIndex, selected.level)
                    }
                  >
                    Work it harder — level {selected.level + 1}
                  </button>
                </>
              ) : (
                <p className="city-effect city-afford-ok">
                  This land is worked to its fullest.
                </p>
              )}
            </div>
          ) : (
            <div className="city-detail-body city-detail-idle">
              <Icon name="food" size={22} />
              <p>
                Select a plot of land to stake it or improve the way it is
                worked.
              </p>
            </div>
          )}
        </aside>
      </div>

      <p className="muted tiny">{WILD_RELATION.farm}</p>
      <p className="muted tiny">{WILD_RELATION.lumber_yard}</p>
      <p className="muted tiny">{WILD_RELATION.quarry}</p>
      <p className="muted tiny">{WILD_RELATION.mine}</p>
    </section>
  );
}
