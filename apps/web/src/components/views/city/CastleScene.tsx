import { useMemo } from "react";
import type { City, QueueJob } from "../../../lib/types";
import { buildingName } from "../../../lib/labels";
import { fmtEta } from "../../../lib/format";
import { castleBuildingArt, type SceneArt } from "../../../lib/castleSceneAssets";
import { depthZ, sceneAnchorForSlot, type SceneAnchor } from "./castleSceneLayout";
import { SceneTerrain } from "./SceneTerrain";

type Building = City["buildings"][number];

export type RoostDragon = {
  /** Slot of the Dragon Watch roost, or null if not built. */
  slot: number | null;
  imageSrc: string;
  alt: string;
  /** The dragon is on the approaches (roost empty). */
  away: boolean;
};

type CastleSceneProps = {
  city: City;
  jobs: QueueJob[];
  now: number;
  selectedSlot: number | null;
  onSelectSlot: (slot: number) => void;
  dragon?: RoostDragon | null;
};

function PlotArt({ art }: { art: SceneArt }) {
  return (
    <img
      className="scene-building"
      src={art.src}
      alt=""
      draggable={false}
      style={{ transform: `translateX(${(0.5 - art.anchor[0]) * 100 - 50}%)` }}
    />
  );
}

function Scaffold({ pct }: { pct: number }) {
  return (
    <span className="city-scaffold" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M5 20V9M19 20V9M5 12h14M5 16h14M9 9v11M15 9v11" />
      </svg>
      <span className="city-build-progress">
        <span className="city-build-progress-fill" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

export function CastleScene({
  city,
  jobs,
  now,
  selectedSlot,
  onSelectSlot,
  dragon,
}: CastleSceneProps) {
  const bySlot = useMemo(() => {
    const m = new Map<number, Building>();
    for (const b of city.buildings) m.set(b.slotIndex, b);
    return m;
  }, [city.buildings]);

  const jobsBySlot = useMemo(() => {
    const m = new Map<number, QueueJob>();
    for (const j of jobs) {
      if (j.kind !== "build") continue;
      m.set(Number(j.payload.slotIndex), j);
    }
    return m;
  }, [jobs]);

  const slots = useMemo(() => {
    let max = -1;
    for (const b of city.buildings) max = Math.max(max, b.slotIndex);
    for (const j of jobs) {
      if (j.kind !== "build") continue;
      const idx = Number(j.payload.slotIndex);
      if (Number.isFinite(idx)) max = Math.max(max, idx);
    }
    return Array.from({ length: Math.max(12, max + 1) }, (_, i) => i);
  }, [city.buildings, jobs]);

  const dragonAnchor: SceneAnchor | null =
    dragon?.slot != null ? sceneAnchorForSlot(dragon.slot) : null;

  return (
    <div
      className="castle-scene"
      style={{ aspectRatio: "1400 / 880" }}
      data-testid="castle-scene"
    >
      <SceneTerrain />

      {slots.map((slot) => {
        const b = bySlot.get(slot);
        const job = jobsBySlot.get(slot);
        const a = sceneAnchorForSlot(slot);
        const isSel = slot === selectedSlot;
        const total = job ? Math.max(1, job.finishesAt - job.startedAt) : 1;
        const pct = job
          ? Math.min(100, Math.round(((total - Math.max(0, job.finishesAt - now)) / total) * 100))
          : 0;
        const art = b ? castleBuildingArt(b.buildingType, b.level) : undefined;
        const name = job ? buildingName(String(job.payload.buildingType)) : b ? buildingName(b.buildingType) : null;
        const aria = job
          ? `${name} under construction, ${fmtEta(Math.max(0, job.finishesAt - now))} remaining`
          : b
            ? `${name}, level ${b.level}`
            : `Empty plot ${slot}`;

        return (
          <button
            key={slot}
            type="button"
            className={[
              "scene-plot",
              b ? "scene-plot-built" : "scene-plot-empty",
              isSel ? "scene-plot-selected" : "",
              job ? "scene-plot-building" : "",
              `scene-kind-${a.kind}`,
            ]
              .filter(Boolean)
              .join(" ")}
            style={
              art
                ? {
                    left: `${a.x * 100}%`,
                    top: `${a.y * 100}%`,
                    width: `calc(${art.widthPct}% * ${a.scale})`,
                    aspectRatio: String(art.aspect),
                    zIndex: depthZ(a) + (b || job ? 0 : 400),
                  }
                : {
                    left: `${a.x * 100}%`,
                    top: `${a.y * 100}%`,
                    width: `${12 * a.scale}%`,
                    aspectRatio: "1.3",
                    zIndex: depthZ(a) + 400,
                  }
            }
            aria-label={aria}
            aria-pressed={isSel}
            onClick={() => onSelectSlot(slot)}
          >
            {/* Interaction is a base hit region, not the sprite's full
                transparent bounding box — overlapping tall sprites must not
                steal each other's clicks. Empty plots sit above neighbours so
                a cleared foundation is always discoverable. */}
            <span className="scene-hit" aria-hidden="true" />
            {art ? <PlotArt art={art} /> : <span className="scene-foundation" aria-hidden="true" />}
            {isSel && <span className="scene-select-ring" aria-hidden="true" />}
            {job && <Scaffold pct={pct} />}
            {b && !job && <span className="scene-pip">{`L${b.level}`}</span>}
            {job && (
              <span className="scene-pip scene-pip-building">
                {fmtEta(Math.max(0, job.finishesAt - now))}
              </span>
            )}
          </button>
        );
      })}

      {dragon && dragonAnchor && (
        <>
          <span
            className="scene-dragon-shadow"
            aria-hidden="true"
            style={{
              left: `${(dragonAnchor.x + 0.085) * 100}%`,
              top: `${(dragonAnchor.y + 0.02) * 100}%`,
              width: `${15 * dragonAnchor.scale}%`,
              zIndex: depthZ(dragonAnchor),
            }}
          />
          <img
            className={`scene-dragon ${dragon.away ? "scene-dragon-away" : ""}`}
            src={dragon.imageSrc}
            alt={dragon.alt}
            draggable={false}
            data-testid="scene-dragon"
            style={{
              left: `${(dragonAnchor.x + 0.085) * 100}%`,
              top: `${(dragonAnchor.y + 0.02) * 100}%`,
              width: `${16 * dragonAnchor.scale}%`,
              zIndex: depthZ(dragonAnchor) + 1,
            }}
          />
        </>
      )}
    </div>
  );
}
