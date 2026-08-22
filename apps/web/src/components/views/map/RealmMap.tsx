import { useMemo } from "react";
import type { CSSProperties } from "react";

import "./map.css";

import { fmtEta } from "../../../lib/format";
import type { MapData, MapFocus, March, Player } from "../../../lib/types";
import { Icon } from "../../../ui/icons";

export type TileInfo =
  | { kind: "camp"; camp: MapData["camps"][number] }
  | { kind: "wild"; wild: MapData["wilderness"][number] }
  | { kind: "city"; city: MapData["cities"][number] }
  | { kind: "empty" };

export function tileAt(
  mapData: MapData | null,
  x: number,
  y: number,
): TileInfo | null {
  if (!mapData) return null;
  const camp = mapData.camps.find((c) => c.x === x && c.y === y);
  if (camp) return { kind: "camp", camp };
  const wild = mapData.wilderness.find((w) => w.x === x && w.y === y);
  if (wild) return { kind: "wild", wild };
  const cty = mapData.cities.find((c) => c.x === x && c.y === y);
  if (cty) return { kind: "city", city: cty };
  return { kind: "empty" };
}

export type RealmMapProps = {
  player: Player;
  mapData: MapData;
  mapFocus: MapFocus;
  selectedTile: { x: number; y: number } | null;
  onSelectTile: (tile: { x: number; y: number }) => void;
  marches?: March[];
};

const GROUND_VARIANTS = 4;

function terrainHash(x: number, y: number): number {
  let h =
    Math.imul(x + 0x9e3779b9, 0x85ebca6b) ^
    Math.imul(y + 0x68bc21eb, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 15), 0x27d4eb2f);
  h ^= h >>> 13;
  return h >>> 0;
}

function groundVariant(x: number, y: number): number {
  return terrainHash(x, y) % GROUND_VARIANTS;
}

function groundFlipped(x: number, y: number): boolean {
  return (terrainHash(x, y) & 64) !== 0;
}

type Tier = "t1" | "t2" | "t3";

function tierOf(level: number): Tier {
  if (level >= 5) return "t3";
  if (level >= 3) return "t2";
  return "t1";
}

const CAMP_GLYPH_SIZE: Record<Tier, number> = { t1: 11, t2: 14, t3: 17 };

function LeafGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="map-glyph-svg"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 19C5 10.5 10.5 5 19 5c0 8.5-5.5 14-14 14Z" />
      <path d="M6.5 17.5C9.5 14.5 13 11 17.5 6.5" />
    </svg>
  );
}

type MarchPath = {
  id: string;
  ox: number;
  oy: number;
  intent: string;
};

type MarchMark = {
  key: string;
  tx: number;
  ty: number;
  intent: string;
  paths: MarchPath[];
  chips: string[];
};

function marchIntentClass(intent: string): string {
  if (intent === "attack") return "map-march-attack";
  if (intent === "scout") return "map-march-scout";
  if (intent === "reinforce") return "map-march-reinforce";
  return "map-march-other";
}

function etaLabel(m: March, now: number): string {
  if (m.status === "returning") return "returning";
  if (m.status === "resolving") return "resolving";
  return fmtEta(m.arriveAt - now);
}

export function RealmMap({
  player,
  mapData,
  mapFocus,
  selectedTile,
  onSelectTile,
  marches = [],
}: RealmMapProps) {
  const cols = mapFocus.x1 - mapFocus.x0 + 1;
  const rows = mapFocus.y1 - mapFocus.y0 + 1;
  const worldW = mapData.mapW ?? null;
  const worldH = mapData.mapH ?? null;
  const now = Date.now();

  const marks = useMemo<MarchMark[]>(() => {
    const byTarget = new Map<string, MarchMark>();
    for (const m of marches) {
      const tx = m.targetX;
      const ty = m.targetY;
      if (!Number.isFinite(tx) || !Number.isFinite(ty)) continue;
      if (
        tx < mapFocus.x0 ||
        tx > mapFocus.x1 ||
        ty < mapFocus.y0 ||
        ty > mapFocus.y1
      ) {
        continue;
      }
      const key = `${tx},${ty}`;
      let mark = byTarget.get(key);
      if (!mark) {
        mark = { key, tx, ty, intent: m.intent, paths: [], chips: [] };
        byTarget.set(key, mark);
      }
      mark.chips.push(`${m.intent} · ${etaLabel(m, now)}`);
      const originCity = mapData.cities.find((c) => c.id === m.fromCityId);
      if (
        m.status === "en_route" &&
        originCity &&
        originCity.x >= mapFocus.x0 &&
        originCity.x <= mapFocus.x1 &&
        originCity.y >= mapFocus.y0 &&
        originCity.y <= mapFocus.y1 &&
        !(originCity.x === tx && originCity.y === ty)
      ) {
        mark.paths.push({
          id: m.id,
          ox: originCity.x,
          oy: originCity.y,
          intent: m.intent,
        });
      }
    }
    return [...byTarget.values()];
  }, [marches, mapData, mapFocus, now]);

  return (
    <>
      <div className="map-frame">
        <div
          className="map-grid"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          role="grid"
          aria-label="Realm map"
          aria-rowcount={rows}
          aria-colcount={cols}
        >
          {Array.from({ length: rows }, (_, row) => {
            const y = mapFocus.y0 + row;
            return Array.from({ length: cols }, (_, col) => {
              const x = mapFocus.x0 + col;
              const t = tileAt(mapData, x, y)!;
              const v = groundVariant(x, y);
              const cls = ["map-tile", `map-g${v}`];
              if (t.kind === "empty" && groundFlipped(x, y)) {
                cls.push("map-flip");
              }
              let label = `Open ground at ${x},${y}`;
              if (t.kind === "camp") {
                cls.push("map-camp");
                label = `Camp level ${t.camp.level} at ${x},${y}`;
              } else if (t.kind === "wild") {
                cls.push("map-wild");
                if (t.wild.ownerPlayerId) cls.push("map-wild-claimed");
                label = `${t.wild.resourceType} wilderness level ${t.wild.level}${
                  t.wild.ownerPlayerId ? ", claimed" : ", unclaimed"
                } at ${x},${y}`;
              } else if (t.kind === "city") {
                const mine = t.city.playerId === player.id;
                cls.push("map-city", mine ? "map-city-mine" : "map-city-foe");
                label = `${t.city.name} (${t.city.kind}) at ${x},${y}${
                  mine ? ", your city" : ""
                }`;
              }
              if (worldW !== null && x === 0) cls.push("map-edge-w");
              if (worldH !== null && y === 0) cls.push("map-edge-n");
              if (worldW !== null && x === worldW - 1) cls.push("map-edge-e");
              if (worldH !== null && y === worldH - 1) cls.push("map-edge-s");
              const selected = selectedTile?.x === x && selectedTile?.y === y;
              if (selected) cls.push("map-selected");
              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  className={cls.join(" ")}
                  aria-label={label}
                  title={label}
                  aria-pressed={selected}
                  onClick={() => onSelectTile({ x, y })}
                >
                  {t.kind === "camp" && (
                    <>
                      <span className="map-glyph">
                        <Icon
                          name="sword"
                          size={CAMP_GLYPH_SIZE[tierOf(t.camp.level)]}
                        />
                      </span>
                      <span className="map-badge">{t.camp.level}</span>
                    </>
                  )}
                  {t.kind === "wild" && (
                    <span className="map-glyph">
                      <LeafGlyph />
                    </span>
                  )}
                  {t.kind === "city" && (
                    <span className="map-glyph">
                      <Icon name="crown" size={13} />
                    </span>
                  )}
                </button>
              );
            });
          })}
        </div>

        {marks.length > 0 && (
          <>
            <svg
              className="map-paths"
              viewBox={`0 0 ${cols} ${rows}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              {marks.flatMap((mark) =>
                mark.paths.map((p) => {
                  const x1 = p.ox - mapFocus.x0 + 0.5;
                  const y1 = p.oy - mapFocus.y0 + 0.5;
                  const x2 = mark.tx - mapFocus.x0 + 0.5;
                  const y2 = mark.ty - mapFocus.y0 + 0.5;
                  return (
                    <g key={p.id} className={marchIntentClass(p.intent)}>
                      <line
                        className="map-path-base"
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                      />
                      <line
                        className="map-path-dots"
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                      />
                      <circle
                        className="map-path-origin"
                        cx={x1}
                        cy={y1}
                        r={0.3}
                      />
                    </g>
                  );
                }),
              )}
            </svg>
            <div
              className="map-overlay"
              aria-hidden="true"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
              }}
            >
              {marks.map((mark) => (
                <div
                  key={mark.key}
                  className={`map-beacon ${marchIntentClass(mark.intent)}`}
                  style={{
                    gridRow: mark.ty - mapFocus.y0 + 1,
                    gridColumn: mark.tx - mapFocus.x0 + 1,
                  }}
                >
                  <span className="map-beacon-ring" />
                  {mark.chips.map((chip, i) => (
                    <span
                      key={`${mark.key}-${i}`}
                      className="map-chip"
                      style={{ "--chip-i": i } as CSSProperties}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {marks.length > 0 && (
        <p className="map-sr-only">
          {`${marks.length} active march${marks.length === 1 ? "" : "es"}: ${marks
            .flatMap((m) => m.chips)
            .join("; ")}`}
        </p>
      )}
    </>
  );
}
