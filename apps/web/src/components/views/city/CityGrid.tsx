import { useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";

import "./city.css";

import { canAfford, fmtEta, fmtNum } from "../../../lib/format";
import { buildingDef, buildingName, type BuildingLite } from "../../../lib/labels";
import type { City, QueueJob } from "../../../lib/types";
import type { IconName } from "../../../ui/icons";
import { Icon } from "../../../ui/icons";

type Building = City["buildings"][number];
type Tier = "stone" | "bronze" | "gold";

type CityGridProps = {
  city: City;
  jobs: QueueJob[];
  now: number;
  doBuild: (buildingType: string, slotIndex?: number) => Promise<void>;
};

const GRID_COLUMNS = 4;
const MIN_SLOTS = 12;

function costOf(def: BuildingLite, level: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(def.build_cost ?? { food: 100, timber: 100 })) {
    out[k] = Math.floor((v ?? 0) * level);
  }
  return out;
}
/** Honest, mechanic-backed effect line per building (mirrors server rules). */
function effectLine(id: string, level: number): string {
  switch (id) {
    case "habitation":
      return `Houses ${100 * level} additional townsfolk`;
    case "barracks":
      return `Training speed +${5 * level}%`;
    case "archive_spire":
      return `Research speed +${5 * level}%`;
    case "rally_quay":
      return `March speed +${4 * level}%`;
    case "command_gallery":
      return `Roster of ${level} · ${Math.min(3, level)} command slot${Math.min(3, level) === 1 ? "" : "s"}`;
    case "lookout":
      return level >= 3
        ? "Scouts report exact garrison counts"
        : "Scouts report camp defenders";
    case "saltvault":
      return `Shields about ${Math.min(90, 50 + 5 * level)}% of stores from raiders`;
    case "training_camp":
      return `Allows ${5 + Math.min(3, level)} training queues`;
    default:
      return "";
  }
}

/** Level bands visualized as roof/banner tiers: stone -> bronze -> gold. */
function tierOf(level: number): Tier {
  if (level >= 7) return "gold";
  if (level >= 4) return "bronze";
  return "stone";
}

/** Stacked plinth steps under each building grow with level. */
function plinthSteps(level: number): 1 | 2 | 3 {
  if (level >= 7) return 3;
  if (level >= 4) return 2;
  return 1;
}

/* ------------------------------------------------------------------ */
/* Building glyphs — inline SVG keyed by building type. Stroke style   */
/* matches ui/icons.tsx (currentColor, round caps, 1.5 stroke).        */
/* ------------------------------------------------------------------ */

function GlyphFrame({
  level,
  children,
}: {
  level: number;
  children: ReactNode;
}) {
  const steps = plinthSteps(level);
  const lift = (steps - 1) * 1.75;
  return (
    <svg
      className="city-glyph"
      viewBox="0 0 24 30"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="12" cy="27.7" rx="10.6" ry="2.5" fill="rgba(0,0,0,.35)" />
      <g
        stroke="var(--plinth-line)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      >
        <path d="M3 25.4v1.7a9 3.3 0 0 0 18 0v-1.7" fill="none" />
        <ellipse cx="12" cy="25.4" rx="9" ry="3.3" fill="var(--plinth-fill)" />
        {steps >= 2 && (
          <>
            <path d="M4.6 23.7v1.4a7.4 2.9 0 0 0 14.8 0v-1.4" fill="none" />
            <ellipse cx="12" cy="23.7" rx="7.4" ry="2.9" fill="var(--plinth-fill)" />
          </>
        )}
        {steps >= 3 && (
          <>
            <path d="M6.1 22v1.3a5.9 2.5 0 0 0 11.8 0v-1.3" fill="none" />
            <ellipse cx="12" cy="22" rx="5.9" ry="2.5" fill="var(--plinth-fill)" />
          </>
        )}
      </g>
      <g
        transform={`translate(0 ${-lift})`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </g>
    </svg>
  );
}

/** Barracks — sword-on-shield motif with tier rank band. */
function BarracksGlyph({ level }: { level: number }) {
  return (
    <GlyphFrame level={level}>
      <path d="M12 5.1l6.3 2.2v4.9c0 4.3-2.6 7.7-6.3 9.2-3.7-1.5-6.3-4.9-6.3-9.2V7.3z" />
      <path d="M7.9 9.9h8.2" stroke="var(--tier-b)" />
      <path d="M12 7l1.3 1.5v6L12 16l-1.3-1.5v-6z" />
      <path d="M12 8.7v4.9" />
      <path d="M9.8 16.8h4.4" />
      <path d="M12 16.8v2.1" />
      <circle cx="12" cy="19.9" r="1.05" />
    </GlyphFrame>
  );
}

/** Habitation — cottage with tiered fascia band. */
function HabitationGlyph({ level }: { level: number }) {
  return (
    <GlyphFrame level={level}>
      <path d="M15.2 8.8V6.2h1.9v4.5" />
      <path d="M5.3 13.5L12 5.8l6.7 7.7z" />
      <path d="M7.4 13.5h9.2" stroke="var(--tier-b)" />
      <path d="M7.2 21.3v-7.8h9.6v7.8" />
      <path d="M10.7 21.3V18a1.3 1.3 0 0 1 2.6 0v3.3" />
      <path d="M8.9 15.7h1.9v1.9H8.9z" />
    </GlyphFrame>
  );
}

/** Saltvault (Storehouse) — strongbox with vault dial and coin accent. */
function SaltvaultGlyph({ level }: { level: number }) {
  return (
    <GlyphFrame level={level}>
      <circle cx="17.2" cy="9" r="1.35" stroke="var(--tier-a)" />
      <path d="M5.6 12.7a6.4 4.7 0 0 1 12.8 0" />
      <path d="M5.6 12.7h12.8" stroke="var(--tier-b)" />
      <path d="M5.6 12.7v7.2a1.7 1.7 0 0 0 1.7 1.7h9.4a1.7 1.7 0 0 0 1.7-1.7v-7.2" />
      <circle cx="12" cy="16.7" r="2.55" />
      <path d="M12 14.15v5.1M9.45 16.7h5.1" />
      <path d="M7.7 21.6l-.85 1.4M16.3 21.6l.85 1.4" />
    </GlyphFrame>
  );
}

/** Archive Spire (Scriptorium) — banded tower with orb finial. */
function ArchiveSpireGlyph({ level }: { level: number }) {
  return (
    <GlyphFrame level={level}>
      <path d="M10.5 10.8L12 5.7l1.5 5.1z" />
      <circle cx="12" cy="4.6" r=".85" fill="var(--tier-b)" stroke="none" />
      <path d="M9.4 22l1.05-11.2h3.1L14.6 22z" />
      <path d="M9.85 14.4h4.3" stroke="var(--tier-b)" />
      <path d="M10.15 17.3h3.7" stroke="var(--tier-a)" />
      <path d="M11.05 22v-1.8a.95.95 0 0 1 1.9 0V22" />
    </GlyphFrame>
  );
}

/** Command Gallery (Commanders' Hall) — banner over a hall front. */
function CommandGalleryGlyph({ level }: { level: number }) {
  return (
    <GlyphFrame level={level}>
      <path d="M6.5 21.5v-9h11v9" />
      <path d="M5 12.5 12 5l7 7.5" />
      <path d="M12 5V2.6" />
      <path d="M12 2.6h4.4l-1.2 1.7 1.2 1.7H12" stroke="var(--tier-b)" />
      <path d="M9.7 21.5v-3.4h4.6v3.4" />
    </GlyphFrame>
  );
}

/** Lookout (Watchtower) — tall tower with balcony. */
function LookoutGlyph({ level }: { level: number }) {
  return (
    <GlyphFrame level={level}>
      <path d="M9.6 21.5 10.4 9h3.2l.8 12.5" />
      <path d="M9.2 9V5h5.6v4" />
      <path d="M8.2 5h7.6" stroke="var(--tier-b)" />
      <path d="M12 5V2.8" />
      <circle cx="12" cy="3.4" r=".9" stroke="var(--tier-a)" />
    </GlyphFrame>
  );
}

/** Rally Quay (Muster Yard) — yard with war banner. */
function RallyQuayGlyph({ level }: { level: number }) {
  return (
    <GlyphFrame level={level}>
      <path d="M4.5 21.5h15" />
      <path d="M7 21.5V12" />
      <path d="M7 12c1.8-1.5 3.4-1.5 5 0 1.6-1.5 3.2-1.5 5 0" />
      <path d="M17 21.5V6" />
      <path d="M17 6h4l-1.2 1.8L21 9.6h-4" stroke="var(--tier-b)" />
    </GlyphFrame>
  );
}

/** Training Camp — drill tent with pennant. */
function TrainingCampGlyph({ level }: { level: number }) {
  return (
    <GlyphFrame level={level}>
      <path d="m4.5 21 7.5-12 7.5 12z" />
      <path d="M9 21l3-4.8L15 21" />
      <path d="M12 9V3.6" />
      <path d="M12 3.6h3.4l-1 1.4 1 1.4H12" stroke="var(--tier-b)" />
    </GlyphFrame>
  );
}

/** Unknown building types — hammer motif, same frame. */
function UnknownGlyph({ level }: { level: number }) {
  return (
    <GlyphFrame level={level}>
      <path d="M13.3 6.6l5.4 5.4-2.4 2.4-5.4-5.4z" />
      <path d="M11.6 9.9L6 15.5a1.75 1.75 0 0 0 2.47 2.47l5.62-5.61" />
      <path d="m14.7 8.5 1.9 1.9" />
    </GlyphFrame>
  );
}

const GLYPHS: Record<string, (props: { level: number }) => ReactElement> = {
  barracks: BarracksGlyph,
  habitation: HabitationGlyph,
  saltvault: SaltvaultGlyph,
  archive_spire: ArchiveSpireGlyph,
  command_gallery: CommandGalleryGlyph,
  lookout: LookoutGlyph,
  rally_quay: RallyQuayGlyph,
  training_camp: TrainingCampGlyph,
};

function BuildingGlyph({ type, level }: { type: string; level: number }) {
  const Glyph = GLYPHS[type] ?? UnknownGlyph;
  return <Glyph level={level} />;
}

/** Small icon shown next to a build option / cost line. */
function CostIcon({ name }: { name: IconName }) {
  return <Icon name={name} size={14} />;
}

function CostRow({
  cost,
  have,
}: {
  cost: Record<string, number>;
  have: Record<string, number>;
}) {
  return (
    <div className="city-cost-row">
      {Object.entries(cost)
        .filter(([, v]) => (v ?? 0) > 0)
        .map(([k, v]) => {
          const short = (have[k] ?? 0) < (v ?? 0);
          return (
            <span
              key={k}
              className={`city-cost ${short ? "city-cost-short" : ""}`}
            >
              <CostIcon name={k as IconName} /> {fmtNum(v)}
              <span className="city-visually-hidden"> {k}</span>
            </span>
          );
        })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* City grid                                                           */
/* ------------------------------------------------------------------ */

export function CityGrid({ city, jobs, now, doBuild }: CityGridProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // Switching cities resets the selection so the card never describes
  // a plot from the previous city.
  useEffect(() => {
    setSelectedSlot(null);
  }, [city.id]);

  const bySlot = useMemo(() => {
    const m = new Map<number, Building>();
    for (const b of city.buildings) m.set(b.slotIndex, b);
    return m;
  }, [city.buildings]);

  /** Running build jobs keyed by their target slot. */
  const jobsBySlot = useMemo(() => {
    const m = new Map<number, QueueJob>();
    for (const j of jobs) {
      if (j.kind !== "build") continue;
      m.set(Number(j.payload.slotIndex), j);
    }
    return m;
  }, [jobs]);

  const buildableDefs = useMemo(
    () =>
      [
        "habitation",
        "barracks",
        "archive_spire",
        "rally_quay",
        "command_gallery",
        "lookout",
        "training_camp",
        "saltvault",
      ]
        .map((id) => buildingDef(id))
        .filter((d): d is BuildingLite => Boolean(d?.buildable)),
    [],
  );

  const slots = useMemo(() => {
    let max = -1;
    for (const b of city.buildings) max = Math.max(max, b.slotIndex);
    const raw = Math.max(MIN_SLOTS, max + 1);
    const count = Math.ceil(raw / GRID_COLUMNS) * GRID_COLUMNS;
    return Array.from({ length: count }, (_, i) => i);
  }, [city.buildings]);

  const selected: Building | null =
    selectedSlot === null ? null : (bySlot.get(selectedSlot) ?? null);
  const selectedJob =
    selectedSlot !== null ? (jobsBySlot.get(selectedSlot) ?? null) : null;
  const selectedDef = selected ? buildingDef(selected.buildingType) : null;

  return (
    <div className="city-layout">
      <div className="city-scene">
        <div className="city-board">
          <div
            className="city-plane"
            role="group"
            aria-label={`${city.name} building plots`}
          >
            {slots.map((slot) => {
              const b = bySlot.get(slot);
              const isSel = slot === selectedSlot;
              const job = jobsBySlot.get(slot);
              const total = job ? Math.max(1, job.finishesAt - job.startedAt) : 1;
              const pct = job
                ? Math.min(
                    100,
                    Math.round(((total - Math.max(0, job.finishesAt - now)) / total) * 100),
                  )
                : 0;
              return (
                <button
                  key={slot}
                  type="button"
                  className={[
                    "city-tile",
                    b ? "city-tile-built" : "city-tile-empty",
                    isSel ? "city-selected" : "",
                    job ? "city-tile-building" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={
                    job
                      ? `${buildingName(String(job.payload.buildingType))} under construction, ${fmtEta(Math.max(0, job.finishesAt - now))} remaining`
                      : b
                        ? `${buildingName(b.buildingType)}, level ${b.level}`
                        : `Empty plot ${slot}`
                  }
                  aria-pressed={isSel}
                  onClick={() => setSelectedSlot(isSel ? null : slot)}
                >
                  <span className="city-ground" aria-hidden="true" />
                  {b && (
                    <span
                      className={`city-sprite city-tier-${tierOf(b.level)}`}
                      aria-hidden="true"
                    >
                      <span className="city-sprite-inner">
                        <BuildingGlyph
                          type={b.buildingType}
                          level={b.level}
                        />
                      </span>
                    </span>
                  )}
                  {job && (
                    <span
                      className="city-scaffold"
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                        <path d="M5 20V9M19 20V9M5 12h14M5 16h14M9 9v11M15 9v11" />
                      </svg>
                    </span>
                  )}
                  {job && (
                    <span className="city-build-progress">
                      <span
                        className="city-build-progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                  )}
                  {b && !job && <span className="city-lvl">{`L${b.level}`}</span>}
                  {job && (
                    <span className="city-lvl city-lvl-building">
                      {fmtEta(Math.max(0, job.finishesAt - now))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <p className="city-scene-hint muted tiny">
          Select a plot to inspect it, raise a structure, or improve it
        </p>
      </div>

      <aside className="city-detail" aria-live="polite">
        {selected ? (
          <div className="city-detail-body">
            <header className="city-detail-head">
              <span
                className={`city-detail-glyph city-tier-${tierOf(selected.level)}`}
                aria-hidden="true"
              >
                <BuildingGlyph type={selected.buildingType} level={selected.level} />
              </span>
              <div>
                <h4>{buildingName(selected.buildingType)}</h4>
                <p className="muted tiny">
                  Level {selected.level} · {tierOf(selected.level)} tier
                </p>
              </div>
            </header>
            {selectedDef?.purpose ? (
              <p className="tiny">{selectedDef.purpose}</p>
            ) : null}
            <p className="city-effect">
              <strong>Now:</strong> {effectLine(selected.buildingType, selected.level) || "—"}
            </p>
            {selectedJob ? (
              <>
                <p className="city-effect">
                  <strong>
                    {Number(selectedJob.payload.upgradeTo ?? 0) > 1
                      ? `Improving to level ${String(selectedJob.payload.upgradeTo)}`
                      : "Under construction"}
                  </strong>{" "}
                  — {fmtEta(Math.max(0, selectedJob.finishesAt - now))} remaining
                </p>
                <div className="bar">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((Math.max(1, selectedJob.finishesAt - selectedJob.startedAt) -
                            Math.max(0, selectedJob.finishesAt - now)) /
                            Math.max(1, selectedJob.finishesAt - selectedJob.startedAt)) *
                            100,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </>
            ) : Number(selectedDef?.max_level ?? 10) > selected.level ? (
              <>
                <p className="city-effect">
                  <strong>Next:</strong> level {selected.level + 1} —{" "}
                  {effectLine(selected.buildingType, selected.level + 1) || "—"}
                </p>
                <CostRow
                  cost={costOf(selectedDef!, selected.level + 1)}
                  have={city.resources as unknown as Record<string, number>}
                />
                <button
                  type="button"
                  className="city-build-btn"
                  disabled={
                    !canAfford(
                      city.resources,
                      costOf(selectedDef!, selected.level + 1),
                    )
                  }
                  onClick={() =>
                    void doBuild(selected.buildingType, selected.slotIndex)
                  }
                >
                  Improve to level {selected.level + 1}
                  {selectedDef?.build_sec_L1
                    ? ` · about ${fmtEta(selectedDef.build_sec_L1 * 1000)}`
                    : ""}
                </button>
              </>
            ) : (
              <p className="city-effect city-afford-ok">
                This structure stands at its highest level.
              </p>
            )}
          </div>
        ) : selectedSlot !== null && selectedJob ? (
          // Under construction on a still-empty plot — show progress, not
          // the picker (the slot cannot take a second project).
          <div className="city-detail-body">
            <header className="city-detail-head">
              <span className="city-detail-glyph city-empty-glyph" aria-hidden="true">
                <Icon name="hammer" size={26} />
              </span>
              <div>
                <h4>{buildingName(String(selectedJob.payload.buildingType))}</h4>
                <p className="muted tiny">
                  {Number(selectedJob.payload.upgradeTo ?? 0) > 1
                    ? `Improving to level ${String(selectedJob.payload.upgradeTo)}`
                    : "Under construction"}
                </p>
              </div>
            </header>
            <p className="city-effect">
              <strong>Time remaining:</strong>{" "}
              {fmtEta(Math.max(0, selectedJob.finishesAt - now))}
            </p>
            <div className="bar">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      ((Math.max(1, selectedJob.finishesAt - selectedJob.startedAt) -
                        Math.max(0, selectedJob.finishesAt - now)) /
                        Math.max(1, selectedJob.finishesAt - selectedJob.startedAt)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>
          </div>
        ) : selectedSlot !== null ? (
          <div className="city-detail-body">
            <header className="city-detail-head">
              <span className="city-detail-glyph city-empty-glyph" aria-hidden="true">
                <Icon name="hammer" size={26} />
              </span>
              <div>
                <h4>Empty plot</h4>
                <p className="muted tiny">A cleared foundation awaits.</p>
              </div>
            </header>
            <p className="tiny">Choose a structure to raise here:</p>
            <div className="city-pick-grid">
              {buildableDefs.map((def) => {
                const cost = costOf(def, 1);
                const affordable = canAfford(
                  city.resources,
                  cost,
                );
                return (
                  <button
                    key={def.id}
                    type="button"
                    className="city-pick"
                    disabled={!affordable}
                    onClick={() => void doBuild(def.id, selectedSlot)}
                    title={def.purpose}
                  >
                    <span className="city-pick-name">{def.name}</span>
                    <CostRow cost={cost} have={city.resources as unknown as Record<string, number>} />
                    <span className="muted tiny">
                      {def.build_sec_L1
                        ? `about ${fmtEta(def.build_sec_L1 * 1000)}`
                        : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="city-detail-body city-detail-idle">
            <Icon name="crown" size={22} />
            <p>Select a plot on the city grid to inspect it or raise a new structure.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
