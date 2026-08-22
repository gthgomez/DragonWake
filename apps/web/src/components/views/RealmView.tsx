import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

import { fmtTime } from "../../lib/format";
import type {
  City,
  Commander,
  MapData,
  MapFocus,
  March,
  Player,
} from "../../lib/types";
import { RealmMap, tileAt } from "./map/RealmMap";

type RealmViewProps = {
  city: City | null;
  player: Player;
  mapFocus: MapFocus;
  setMapFocus: (focus: MapFocus) => void;
  mapData: MapData | null;
  selectedTile: { x: number; y: number } | null;
  setSelectedTile: (tile: { x: number; y: number } | null) => void;
  comp: Record<string, number>;
  setComp: Dispatch<SetStateAction<Record<string, number>>>;
  pvpX: number;
  setPvpX: (value: number) => void;
  pvpY: number;
  setPvpY: (value: number) => void;
  pvpIntent: "attack" | "scout" | "reinforce";
  setPvpIntent: (intent: "attack" | "scout" | "reinforce") => void;
  commandersReady: boolean;
  commanders: Commander[];
  loadMap: (focus?: MapFocus) => Promise<void>;
  setError: Dispatch<SetStateAction<string | null>>;
  recruitCommander: () => Promise<void>;
  attackSelectedCamp: () => Promise<void>;
  occupySelectedWild: () => Promise<void>;
  attackPvp: () => Promise<void>;
  marches?: March[];
};

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
  pvpX,
  setPvpX,
  pvpY,
  setPvpY,
  pvpIntent,
  setPvpIntent,
  commandersReady,
  commanders,
  loadMap,
  setError,
  recruitCommander,
  attackSelectedCamp,
  occupySelectedWild,
  attackPvp,
  marches = [],
}: RealmViewProps) {
  const stackUnits = useMemo(() => {
    if (!city) return [] as string[];
    const ids = new Set([
      ...Object.keys(city.stacks).filter((k) => (city.stacks[k] ?? 0) > 0),
      ...Object.keys(comp),
      "levy",
      "bowman",
    ]);
    return [...ids];
  }, [city, comp]);

  const selectedInfo = selectedTile
    ? tileAt(mapData, selectedTile.x, selectedTile.y)
    : null;

  return (
    <section className="card">
      <h2>Realm</h2>
      <div className="row">
        <button
          type="button"
          onClick={() =>
            void loadMap().catch((e) => setError(String(e.message ?? e)))
          }
        >
          Refresh viewport
        </button>
        <button
          type="button"
          onClick={() => {
            const f = { x0: 0, y0: 0, x1: 19, y1: 19 };
            setMapFocus(f);
            void loadMap(f);
          }}
        >
          NW 20×20
        </button>
        <button
          type="button"
          onClick={() => {
            const f = { x0: 20, y0: 0, x1: 39, y1: 19 };
            setMapFocus(f);
            void loadMap(f);
          }}
        >
          NE 20×20
        </button>
        <button
          type="button"
          onClick={() => {
            const f = { x0: 0, y0: 20, x1: 19, y1: 39 };
            setMapFocus(f);
            void loadMap(f);
          }}
        >
          SW 20×20
        </button>
        <button
          type="button"
          onClick={() => {
            const f = { x0: 20, y0: 20, x1: 39, y1: 39 };
            setMapFocus(f);
            void loadMap(f);
          }}
        >
          SE 20×20
        </button>
        {city && (
          <button
            type="button"
            onClick={() => {
              const cx = city.mapX;
              const cy = city.mapY;
              const f = {
                x0: Math.max(0, cx - 10),
                y0: Math.max(0, cy - 10),
                x1: Math.min(39, cx + 9),
                y1: Math.min(39, cy + 9),
              };
              setMapFocus(f);
              void loadMap(f);
            }}
          >
            Center on city
          </button>
        )}
      </div>

      {commandersReady && (
        <>
          <h3>Commanders</h3>
          {commanders.length === 0 ? (
            <p className="muted">
              No commanders yet — build a Command Gallery
            </p>
          ) : (
            <ul className="plot-list">
              {commanders.map((c) => {
                const stateCls =
                  c.state === "available"
                    ? "ok"
                    : c.state === "wounded"
                      ? "err"
                      : "muted";
                return (
                  <li key={c.id} className="plot-row">
                    <div>
                      <strong>{c.name}</strong>{" "}
                      <span className="muted">
                        {"★".repeat(Math.max(0, c.stars))}
                      </span>{" "}
                      <span className={`${stateCls} tiny`}>
                        [{c.state}]
                      </span>
                      <br />
                      <span className="muted tiny">
                        lead {c.leadership} (+{c.leadership * 2}%) · atk{" "}
                        {c.attack} (+{c.attack * 2}%) · def {c.defense} ·
                        life {c.life} · xp {c.xp}
                        {c.state === "wounded" && c.woundedUntil
                          ? ` · wounded until ${fmtTime(Date.parse(c.woundedUntil))}`
                          : ""}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            onClick={() => void recruitCommander()}
          >
            Recruit commander
          </button>
          <p className="muted tiny">
            First recruit free with a Command Gallery; later recruits cost
            coin + food scaling with your roster.
          </p>
        </>
      )}

      <h3>March composition (from stacks — no free units)</h3>
      <div className="comp-grid">
        {stackUnits.map((uid) => (
          <label key={uid} className="comp-item">
            {uid}
            <span className="muted tiny">
              have {city?.stacks[uid] ?? 0}
            </span>
            <input
              type="number"
              min={0}
              max={city?.stacks[uid] ?? 0}
              value={comp[uid] ?? 0}
              onChange={(e) =>
                setComp((c) => ({
                  ...c,
                  [uid]: Math.max(0, Number(e.target.value) || 0),
                }))
              }
            />
          </label>
        ))}
      </div>

      {mapData ? (
        <RealmMap
          player={player}
          mapData={mapData}
          mapFocus={mapFocus}
          selectedTile={selectedTile}
          marches={marches}
          onSelectTile={(tile) => {
            setSelectedTile(tile);
            setPvpX(tile.x);
            setPvpY(tile.y);
          }}
        />
      ) : (
        <p className="muted">Refresh viewport to load tiles</p>
      )}

      <div className="map-legend">
        <span>
          <i className="map-swatch map-swatch-camp" /> Camp
        </span>
        <span>
          <i className="map-swatch map-swatch-wild" /> Wilderness
        </span>
        <span>
          <i className="map-swatch map-swatch-claimed" /> Claimed
        </span>
        <span>
          <i className="map-swatch map-swatch-mine" /> Your city
        </span>
        <span>
          <i className="map-swatch map-swatch-foe" /> Other city
        </span>
        {marches.length > 0 && (
          <span>
            <i className="map-swatch map-swatch-march" /> Active march
          </span>
        )}
      </div>

      {selectedTile && (
        <div className="tile-detail card-inset">
          <h3>
            Selected {selectedTile.x},{selectedTile.y}
          </h3>
          {!selectedInfo && (
            <p className="muted">Empty water / open tile</p>
          )}
          {selectedInfo?.kind === "camp" && (
            <p>
              <strong>Bandit camp L{selectedInfo.camp.level}</strong>
              <br />
              <span className="muted">
                Attack runs server combat and stores a War report.
              </span>
            </p>
          )}
          {selectedInfo?.kind === "wild" && (
            <p>
              <strong>
                {selectedInfo.wild.resourceType} wilderness L
                {selectedInfo.wild.level}
              </strong>
              <br />
              <span className="muted">
                {selectedInfo.wild.ownerPlayerId
                  ? "Already claimed — occupy will fight owner garrison"
                  : "Unclaimed — occupy to claim production bonus"}
              </span>
            </p>
          )}
          {selectedInfo?.kind === "city" && (
            <p>
              <strong>
                {selectedInfo.city.name} ({selectedInfo.city.kind})
              </strong>
              <br />
              <span className="muted">
                {selectedInfo.city.playerId === player.id
                  ? "Your city — use reinforce/haul from PvP form if needed"
                  : "Enemy/other city — use Attack or Scout below"}
              </span>
            </p>
          )}
          <div className="row">
            <button
              type="button"
              disabled={selectedInfo?.kind !== "camp"}
              onClick={() => void attackSelectedCamp()}
            >
              Attack camp
            </button>
            <button
              type="button"
              disabled={
                selectedInfo?.kind !== "wild" ||
                !!selectedInfo?.wild.ownerPlayerId
              }
              onClick={() => void occupySelectedWild()}
            >
              Occupy wild
            </button>
            <button
              type="button"
              disabled={
                selectedInfo?.kind !== "city" ||
                selectedInfo.city.playerId === player.id
              }
              onClick={() => {
                setPvpX(selectedTile.x);
                setPvpY(selectedTile.y);
                setPvpIntent("attack");
                void attackPvp();
              }}
            >
              Attack city
            </button>
            <button
              type="button"
              disabled={selectedInfo?.kind !== "city"}
              onClick={() => {
                setPvpX(selectedTile.x);
                setPvpY(selectedTile.y);
                setPvpIntent("scout");
                void attackPvp();
              }}
            >
              Scout tile
            </button>
          </div>
          <p className="muted tiny">
            Composition must use units you own — over-selecting is blocked
            client-side and server-side (NO_TROOPS).
          </p>
        </div>
      )}

      <h3>PvP / coords march</h3>
      <p className="muted">
        Target another city (or coords). Withdraw posture = free loot if
        they have no wall troops; Full fights stacks. New-player
        protection blocks until it expires or they attack first.
      </p>
      <div className="row form-inline">
        <label>
          X
          <input
            type="number"
            value={pvpX}
            onChange={(e) => setPvpX(Number(e.target.value))}
          />
        </label>
        <label>
          Y
          <input
            type="number"
            value={pvpY}
            onChange={(e) => setPvpY(Number(e.target.value))}
          />
        </label>
        <label>
          Intent
          <select
            value={pvpIntent}
            onChange={(e) =>
              setPvpIntent(
                e.target.value as "attack" | "scout" | "reinforce",
              )
            }
          >
            <option value="attack">Attack</option>
            <option value="scout">Scout</option>
            <option value="reinforce">Reinforce (ally city)</option>
          </select>
        </label>
        <button type="button" onClick={() => void attackPvp()}>
          Send march
        </button>
      </div>
    </section>
  );
}
