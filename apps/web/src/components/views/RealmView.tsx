import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { fmtEta, fmtNum } from "../../lib/format";
import {
  campLabel,
  commanderStateLabel,
  cityKindLabel,
  unitName,
  wildInfo,
} from "../../lib/labels";
import type {
  City,
  Commander,
  MapData,
  MapFocus,
  March,
  Player,
  UnitDef,
} from "../../lib/types";
import { RealmMap, tileAt } from "./map/RealmMap";

type RealmViewProps = {
  city: City | null;
  player: Player;
  mapFocus: MapFocus;
  setMapFocus: Dispatch<SetStateAction<MapFocus>>;
  mapData: MapData | null;
  selectedTile: { x: number; y: number } | null;
  setSelectedTile: (tile: { x: number; y: number } | null) => void;
  comp: Record<string, number>;
  setComp: Dispatch<SetStateAction<Record<string, number>>>;
  commandersReady: boolean;
  commanders: Commander[];
  marches: March[];
  units: UnitDef[];
  marchLeaderId: string;
  setMarchLeaderId: Dispatch<SetStateAction<string>>;
  loadMap: (focus?: MapFocus) => Promise<void>;
  setError: Dispatch<SetStateAction<string | null>>;
  recruitCommander: () => Promise<void>;
  sendMarch: (opts: {
    intent: "attack" | "occupy" | "scout" | "reinforce";
    target: {
      type: "camp" | "wilderness" | "city" | "coords";
      id?: string;
      x: number;
      y: number;
    };
  }) => Promise<void>;
};

function chebyshev(x0: number, y0: number, x1: number, y1: number): number {
  return Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
}

export function RealmView({
  city,
  player,
  mapFocus,
  setMapFocus,
  mapData,
  selectedTile,
  setSelectedTile,
  comp,
  setComp,
  commandersReady,
  commanders,
  marches,
  units,
  marchLeaderId,
  setMarchLeaderId,
  loadMap,
  setError,
  recruitCommander,
  sendMarch,
}: RealmViewProps) {
  const [confirmIntent, setConfirmIntent] = useState<string | null>(null);

  useEffect(() => setConfirmIntent(null), [selectedTile?.x, selectedTile?.y]);

  // Keep the composition consistent with owned stacks — companies lost in
  // battle or away on march must not leave the composer stuck in an
  // over-selected state.
  useEffect(() => {
    if (!city) return;
    setComp((c) => {
      let changed = false;
      const next: Record<string, number> = {};
      for (const [k, v] of Object.entries(c)) {
        const have = city.stacks[k] ?? 0;
        if (v > have) {
          next[k] = have;
          changed = true;
        } else {
          next[k] = v;
        }
      }
      return changed ? next : c;
    });
  }, [city, setComp]);

  const roster = useMemo(() => {
    if (!city) return [] as UnitDef[];
    return units
      .filter((u) => (city.stacks[u.id] ?? 0) > 0)
      .sort((a, b) => (a.tier ?? 1) - (b.tier ?? 1));
  }, [units, city]);

  const selection = useMemo(
    () =>
      Object.entries(comp)
        .map(([k, v]) => ({ id: k, count: Math.max(0, Math.floor(Number(v) || 0)) }))
        .filter((e) => e.count > 0),
    [comp],
  );

  const selectedInfo = selectedTile
    ? tileAt(mapData, selectedTile.x, selectedTile.y)
    : null;

  const totalSelected = selection.reduce((s, e) => s + e.count, 0);
  const totalPower = selection.reduce((s, e) => {
    const def = units.find((u) => u.id === e.id);
    return s + (def?.power ?? 0) * e.count;
  }, 0);
  const totalCarry = selection.reduce((s, e) => {
    const def = units.find((u) => u.id === e.id);
    return s + (def?.carry ?? 0) * e.count;
  }, 0);

  const overSelected = selection.filter((e) => {
    const have = city?.stacks[e.id] ?? 0;
    return e.count > have;
  });

  /** Observed march-speed factor from this city's recent marches. */
  const speedFactor = useMemo(() => {
    for (const m of marches) {
      if (m.fromCityId !== city?.id) continue;
      const dur = m.arriveAt - m.departAt;
      const base = Math.max(5, chebyshev(city.mapX, city.mapY, m.targetX, m.targetY) * 8) * 1000;
      if (dur > 0 && base > 0) {
        return Math.max(1 / 60, Math.min(1, dur / base));
      }
    }
    return 1;
  }, [marches, city]);

  const travelEstimate =
    city && selectedTile
      ? Math.max(
          5,
          chebyshev(city.mapX, city.mapY, selectedTile.x, selectedTile.y) * 8,
        ) *
        1000 *
        speedFactor
      : null;

  const chosen = commanders.find((c) => c.id === marchLeaderId) ?? null;

  const panBy = (dx: number, dy: number) => {
    const w = mapData?.mapW ?? 40;
    const h = mapData?.mapH ?? 40;
    const cols = mapFocus.x1 - mapFocus.x0 + 1;
    const rows = mapFocus.y1 - mapFocus.y0 + 1;
    const clamp = (v: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(hi, v));
    const x0 = clamp(mapFocus.x0 - dx, 0, Math.max(0, w - cols));
    const y0 = clamp(mapFocus.y0 - dy, 0, Math.max(0, h - rows));
    const f: MapFocus = {
      x0,
      y0,
      x1: x0 + cols - 1,
      y1: y0 + rows - 1,
    };
    setMapFocus(f);
    void loadMap(f).catch((e) => setError(String(e.message ?? e)));
  };

  const centerOnCity = () => {
    if (!city) return;
    const cx = city.mapX;
    const cy = city.mapY;
    const f: MapFocus = {
      x0: Math.max(0, cx - 10),
      y0: Math.max(0, cy - 10),
      x1: Math.min(39, cx + 9),
      y1: Math.min(39, cy + 9),
    };
    setMapFocus(f);
    void loadMap(f).catch((e) => setError(String(e.message ?? e)));
  };

  const launch = (
    intent: "attack" | "occupy" | "scout" | "reinforce",
    target: {
      type: "camp" | "wilderness" | "city" | "coords";
      id?: string;
      x: number;
      y: number;
    },
  ) => {
    setConfirmIntent(null);
    void sendMarch({ intent, target });
  };

  const setMax = (id: string) => {
    const have = city?.stacks[id] ?? 0;
    setComp((c) => ({ ...c, [id]: have }));
  };
  const clearAll = () => setComp({});

  return (
    <section className="card">
      <header className="castle-head">
        <div>
          <h2>The Realm</h2>
          <p className="muted tiny">
            Drag the map to travel. Click a tile to inspect it and muster a
            march.
          </p>
        </div>
        <div className="row">
          {city && (
            <button type="button" onClick={centerOnCity}>
              Center on your keep
            </button>
          )}
        </div>
      </header>

      {mapData ? (
        <RealmMap
          player={player}
          mapData={mapData}
          mapFocus={mapFocus}
          selectedTile={selectedTile}
          marches={marches}
          onPan={panBy}
          onSelectTile={(tile) => {
            setSelectedTile(tile);
            setConfirmIntent(null);
          }}
        />
      ) : (
        <p className="muted">The realm is being surveyed…</p>
      )}

      <div className="map-legend">
        <span>
          <i className="map-swatch map-swatch-camp" /> Camp
        </span>
        <span>
          <i className="map-swatch map-swatch-wild" /> Wilds
        </span>
        <span>
          <i className="map-swatch map-swatch-claimed" /> Claimed
        </span>
        <span>
          <i className="map-swatch map-swatch-mine" /> Your keep
        </span>
        <span>
          <i className="map-swatch map-swatch-foe" /> Other settlement
        </span>
        {marches.length > 0 && (
          <span>
            <i className="map-swatch map-swatch-march" /> Active march
          </span>
        )}
      </div>

      <details className="map-jump">
        <summary>Travel to coordinates</summary>
        <form
          className="row form-inline"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const x = Math.max(
              0,
              Math.min(39, Number(data.get("jumpX") ?? 0)),
            );
            const y = Math.max(
              0,
              Math.min(39, Number(data.get("jumpY") ?? 0)),
            );
            const cols = mapFocus.x1 - mapFocus.x0 + 1;
            const rows = mapFocus.y1 - mapFocus.y0 + 1;
            const x0 = Math.max(0, Math.min(40 - cols, x - Math.floor(cols / 2)));
            const y0 = Math.max(0, Math.min(40 - rows, y - Math.floor(rows / 2)));
            const f: MapFocus = { x0, y0, x1: x0 + cols - 1, y1: y0 + rows - 1 };
            setMapFocus(f);
            void loadMap(f).catch((err) => setError(String(err.message ?? err)));
          }}
        >
          <label>
            X
            <input name="jumpX" type="number" min={0} max={39} defaultValue={city?.mapX ?? 0} />
          </label>
          <label>
            Y
            <input name="jumpY" type="number" min={0} max={39} defaultValue={city?.mapY ?? 0} />
          </label>
          <button type="submit">Travel</button>
        </form>
      </details>

      {selectedTile && selectedInfo && (
        <div className="tile-detail card-inset">
          {selectedInfo.kind === "camp" && (
            <>
              <h3>
                {campLabel(selectedInfo.camp.level)} — level{" "}
                {selectedInfo.camp.level}
              </h3>
              <p className="muted tiny">
                Threat:{" "}
                {selectedInfo.camp.level <= 3
                  ? "low — raiders and highwaymen"
                  : selectedInfo.camp.level <= 7
                    ? "serious — organized and dangerous"
                    : "grave — wyrm-scarred and deadly"}{" "}
                · rough position {selectedTile.x}, {selectedTile.y}
              </p>
            </>
          )}
          {selectedInfo.kind === "wild" && (
            <>
              <h3>
                {wildInfo(selectedInfo.wild.resourceType).label} — level{" "}
                {selectedInfo.wild.level}
              </h3>
              <p className="muted tiny">
                {wildInfo(selectedInfo.wild.resourceType).bonusLine} ·{" "}
                {selectedInfo.wild.ownerPlayerId
                  ? "held by another lord — claiming it will mean battle"
                  : "unclaimed — sending settlers will bring its bounty home"}{" "}
                · position {selectedTile.x}, {selectedTile.y}
              </p>
            </>
          )}
          {selectedInfo.kind === "city" && (
            <>
              <h3>{selectedInfo.city.name}</h3>
              <p className="muted tiny">
                {cityKindLabel(selectedInfo.city.kind)} ·{" "}
                {selectedInfo.city.playerId === player.id
                  ? "your own settlement"
                  : "sworn to another lord"}
                {selectedInfo.city.playerId === player.id
                  ? ""
                  : " — protection and walls may shield it"}{" "}
                · position {selectedTile.x}, {selectedTile.y}
              </p>
            </>
          )}
          {selectedInfo.kind === "empty" && (
            <h3>Open country</h3>
          )}
        </div>
      )}

      <div className="composer">
        <h3>Muster a March</h3>
        {!city ? (
          <p className="muted">No settlement.</p>
        ) : roster.length === 0 ? (
          <p className="muted">
            No companies mustered yet — train troops at your keep.
          </p>
        ) : (
          <>
            {overSelected.length > 0 && (
              <p className="err">
                You do not have that many companies — check the highlighted
                counts.
              </p>
            )}
            <div className="comp-grid">
              {roster.map((u) => {
                const have = city.stacks[u.id] ?? 0;
                const chosen = comp[u.id] ?? 0;
                const over = chosen > have;
                return (
                  <label
                    key={u.id}
                    className={`comp-item ${over ? "comp-item-over" : ""}`}
                  >
                    <span className="comp-name">{unitName(u.id)}</span>
                    <span className="muted tiny">
                      have {fmtNum(have)}
                      {u.power ? ` · power ${u.power}` : ""}
                    </span>
                    <span className="comp-controls">
                      <button
                        type="button"
                        aria-label={`One fewer ${unitName(u.id)}`}
                        onClick={() =>
                          setComp((c) => ({
                            ...c,
                            [u.id]: Math.max(0, (c[u.id] ?? 0) - 1),
                          }))
                        }
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={have}
                        value={chosen}
                        aria-label={`${unitName(u.id)} count to send`}
                        onChange={(e) =>
                          setComp((c) => ({
                            ...c,
                            [u.id]: Math.max(
                              0,
                              Math.min(have, Number(e.target.value) || 0),
                            ),
                          }))
                        }
                      />
                      <button
                        type="button"
                        aria-label={`One more ${unitName(u.id)}`}
                        onClick={() =>
                          setComp((c) => ({
                            ...c,
                            [u.id]: Math.min(have, (c[u.id] ?? 0) + 1),
                          }))
                        }
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="muster-max"
                        onClick={() => setMax(u.id)}
                        aria-label={`Send all available ${unitName(u.id)}`}
                      >
                        all
                      </button>
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="composer-summary">
              <span>
                Marchers: <strong>{fmtNum(totalSelected)}</strong>
              </span>
              <span>
                Strength (rough): <strong>{fmtNum(totalPower)}</strong>
              </span>
              <span>
                Carry: <strong>{fmtNum(totalCarry)}</strong>
              </span>
              {travelEstimate !== null && (
                <span>
                  One way: <strong>{fmtEta(travelEstimate)}</strong>
                </span>
              )}
              {totalSelected === 0 && (
                <span className="muted">No companies chosen yet.</span>
              )}
            </div>

            {commandersReady && (
              <div className="row form-inline commander-pick">
                <label>
                  Commander
                  <select
                    value={marchLeaderId}
                    onChange={(e) => setMarchLeaderId(e.target.value)}
                  >
                    <option value="">— no commander —</option>
                    {commanders.map((c) => (
                      <option key={c.id} value={c.id} disabled={c.state !== "available"}>
                        {c.name} {"★".repeat(Math.max(0, c.stars))} —{" "}
                        {commanderStateLabel(c.state, c.woundedUntil)}
                      </option>
                    ))}
                  </select>
                </label>
                {chosen && (
                  <span className="muted tiny">
                    Leads from the front: +{chosen.attack * 2}% attack, +
                    {chosen.leadership * 2}% life &amp; defense for the march.
                  </span>
                )}
                {commanders.length === 0 && (
                  <button type="button" onClick={() => void recruitCommander()}>
                    Recruit a commander (needs a Commanders' Hall)
                  </button>
                )}
              </div>
            )}

            <div className="row composer-actions">
              {selectedInfo?.kind === "camp" && (
                <>
                  <button
                    type="button"
                    className="primary"
                    disabled={totalSelected === 0 || overSelected.length > 0}
                    onClick={() =>
                      confirmIntent === "attack"
                        ? launch("attack", {
                            type: "camp",
                            id: selectedInfo.camp.id,
                            x: selectedInfo.camp.x,
                            y: selectedInfo.camp.y,
                          })
                        : setConfirmIntent("attack")
                    }
                  >
                    {confirmIntent === "attack"
                      ? "Confirm — send the attack"
                      : `Send attack (${fmtNum(totalSelected)} marching)`}
                  </button>
                  <button
                    type="button"
                    disabled={totalSelected === 0 || overSelected.length > 0}
                    onClick={() =>
                      confirmIntent === "scout"
                        ? launch("scout", {
                            type: "camp",
                            id: selectedInfo.camp.id,
                            x: selectedInfo.camp.x,
                            y: selectedInfo.camp.y,
                          })
                        : setConfirmIntent("scout")
                    }
                  >
                    {confirmIntent === "scout" ? "Confirm — send scouts" : "Send scouts"}
                  </button>
                </>
              )}
              {selectedInfo?.kind === "wild" && (
                <button
                  type="button"
                  className="primary"
                  disabled={
                    totalSelected === 0 ||
                    overSelected.length > 0 ||
                    Boolean(selectedInfo.wild.ownerPlayerId === player.id)
                  }
                  onClick={() =>
                    confirmIntent === "occupy"
                      ? launch("occupy", {
                          type: "wilderness",
                          id: selectedInfo.wild.id,
                          x: selectedInfo.wild.x,
                          y: selectedInfo.wild.y,
                        })
                      : setConfirmIntent("occupy")
                  }
                >
                  {confirmIntent === "occupy"
                    ? "Confirm — send the settlers-at-arms"
                    : selectedInfo.wild.ownerPlayerId
                      ? "Contest this claim (attack)"
                      : "Claim for the realm (occupy)"}
                </button>
              )}
              {selectedInfo?.kind === "city" && (
                <>
                  {selectedInfo.city.playerId !== player.id && (
                    <>
                      <button
                        type="button"
                        className="primary"
                        disabled={totalSelected === 0 || overSelected.length > 0}
                        onClick={() =>
                          confirmIntent === "attack"
                            ? launch("attack", {
                                type: "city",
                                id: selectedInfo.city.id,
                                x: selectedInfo.city.x,
                                y: selectedInfo.city.y,
                              })
                            : setConfirmIntent("attack")
                        }
                      >
                        {confirmIntent === "attack"
                          ? "Confirm — march on the settlement"
                          : "March on the settlement"}
                      </button>
                      <button
                        type="button"
                        disabled={totalSelected === 0 || overSelected.length > 0}
                        onClick={() =>
                          confirmIntent === "scout"
                            ? launch("scout", {
                                type: "city",
                                id: selectedInfo.city.id,
                                x: selectedInfo.city.x,
                                y: selectedInfo.city.y,
                              })
                            : setConfirmIntent("scout")
                        }
                      >
                        {confirmIntent === "scout" ? "Confirm — send scouts" : "Send scouts"}
                      </button>
                    </>
                  )}
                  {selectedInfo.city.playerId === player.id && (
                    <button
                      type="button"
                      disabled={totalSelected === 0 || overSelected.length > 0}
                      onClick={() =>
                        confirmIntent === "reinforce"
                          ? launch("reinforce", {
                              type: "city",
                              id: selectedInfo.city.id,
                              x: selectedInfo.city.x,
                              y: selectedInfo.city.y,
                            })
                          : setConfirmIntent("reinforce")
                      }
                    >
                      {confirmIntent === "reinforce"
                        ? "Confirm — send reinforcements"
                        : "Reinforce this settlement"}
                    </button>
                  )}
                </>
              )}
              {!selectedInfo && (
                <p className="muted">
                  Select a tile on the map to choose where this march goes.
                </p>
              )}
              {totalSelected > 0 && (
                <button type="button" onClick={clearAll}>
                  Clear
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {commandersReady && commanders.length > 0 && (
        <details className="commander-roster">
          <summary>Your commanders ({commanders.length})</summary>
          <ul className="plot-list">
            {commanders.map((c) => (
              <li key={c.id} className="plot-row">
                <div>
                  <strong>{c.name}</strong>{" "}
                  <span className="muted">{"★".repeat(Math.max(0, c.stars))}</span>{" "}
                  <span className={`tiny ${c.state === "available" ? "ok" : "muted"}`}>
                    {commanderStateLabel(c.state, c.woundedUntil)}
                  </span>
                  <br />
                  <span className="muted tiny">
                    leadership {c.leadership} · attack {c.attack} · defense{" "}
                    {c.defense} · experience {fmtNum(c.xp)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
