import { useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";

import "./city.css";

import { BUILD_COST } from "../../../lib/gameConfig";
import { canAfford, fmtNum } from "../../../lib/format";
import type { City } from "../../../lib/types";
import type { IconName } from "../../../ui/icons";
import { Icon } from "../../../ui/icons";

type Building = City["buildings"][number];
type Tier = "stone" | "bronze" | "gold";

type CityGridProps = {
  city: City;
  doBuild: (buildingType: string) => Promise<void>;
};

const GRID_COLUMNS = 4;
const MIN_SLOTS = 12;

/** Display names for known building types; unknown types fall back to title-casing. */
const BUILDING_LABELS: Record<string, string> = {
  barracks: "Barracks",
  habitation: "Habitation",
  saltvault: "Saltvault",
  archive_spire: "Archive Spire",
};

const BUILDABLE_TYPES = Object.keys(BUILDING_LABELS);

function buildingLabel(type: string): string {
  return (
    BUILDING_LABELS[type] ??
    type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

/** Level bands visualized as roof/banner tiers: stone -> bronze -> gold. */
function tierOf(level: number): Tier {
  if (level >= 5) return "gold";
  if (level >= 3) return "bronze";
  return "stone";
}

/** Stacked plinth steps under each building grow with level. */
function plinthSteps(level: number): 1 | 2 | 3 {
  if (level >= 5) return 3;
  if (level >= 3) return 2;
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

/** Saltvault — strongbox with vault dial and coin accent. */
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

/** Archive Spire — banded tower with orb finial. */
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
};

function BuildingGlyph({ type, level }: { type: string; level: number }) {
  const Glyph = GLYPHS[type] ?? UnknownGlyph;
  return <Glyph level={level} />;
}

/** Small icon shown next to a build option / cost line. */
function CostIcon({ name }: { name: IconName }) {
  return <Icon name={name} size={14} />;
}

/* ------------------------------------------------------------------ */
/* City grid                                                           */
/* ------------------------------------------------------------------ */

export function CityGrid({ city, doBuild }: CityGridProps) {
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

  const slots = useMemo(() => {
    let max = -1;
    for (const b of city.buildings) max = Math.max(max, b.slotIndex);
    const raw = Math.max(MIN_SLOTS, max + 1);
    const count = Math.ceil(raw / GRID_COLUMNS) * GRID_COLUMNS;
    return Array.from({ length: count }, (_, i) => i);
  }, [city.buildings]);

  const selected: Building | null =
    selectedSlot === null ? null : (bySlot.get(selectedSlot) ?? null);
  const canPayAny = canAfford(city.resources, BUILD_COST);

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
              return (
                <button
                  key={slot}
                  type="button"
                  className={[
                    "city-tile",
                    b ? "city-tile-built" : "city-tile-empty",
                    isSel ? "city-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={
                    b
                      ? `${buildingLabel(b.buildingType)}, level ${b.level}`
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
                  {b && <span className="city-lvl">{`L${b.level}`}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <p className="city-scene-hint muted tiny">
          Select a plot to inspect or build
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
                <h4>{buildingLabel(selected.buildingType)}</h4>
                <p className="muted tiny">
                  Level {selected.level} · {tierOf(selected.level)} tier · plot{" "}
                  {selected.slotIndex}
                </p>
              </div>
            </header>
            <div className="city-cost-row">
              <span className="city-cost">
                <CostIcon name="food" /> {fmtNum(BUILD_COST.food)}
                <span className="city-visually-hidden"> food</span>
              </span>
              <span className="city-cost">
                <CostIcon name="timber" /> {fmtNum(BUILD_COST.timber)}
                <span className="city-visually-hidden"> timber</span>
              </span>
            </div>
            <p
              className={`city-afford ${canPayAny ? "city-afford-ok" : "city-afford-err"}`}
            >
              {canPayAny ? "Resources available" : "Insufficient resources"}
            </p>
            <button
              type="button"
              className="city-build-btn"
              disabled={!canPayAny}
              onClick={() => void doBuild(selected.buildingType)}
            >
              Build {buildingLabel(selected.buildingType)}
            </button>
            <p className="muted tiny">
              Raises another {buildingLabel(selected.buildingType)} in this city.
            </p>
          </div>
        ) : selectedSlot !== null ? (
          <div className="city-detail-body">
            <header className="city-detail-head">
              <span className="city-detail-glyph city-empty-glyph" aria-hidden="true">
                <Icon name="hammer" size={26} />
              </span>
              <div>
                <h4>Empty plot {selectedSlot}</h4>
                <p className="muted tiny">A cleared foundation awaits.</p>
              </div>
            </header>
            <p className="tiny">Choose a structure to raise here:</p>
            <div className="city-pick-grid">
              {BUILDABLE_TYPES.map((id) => (
                <button
                  key={id}
                  type="button"
                  disabled={!canAfford(city.resources, BUILD_COST)}
                  onClick={() => void doBuild(id)}
                >
                  {BUILDING_LABELS[id]}
                </button>
              ))}
            </div>
            <div className="city-cost-row">
              <span className="city-cost">
                <CostIcon name="food" /> {fmtNum(BUILD_COST.food)}
                <span className="city-visually-hidden"> food</span>
              </span>
              <span className="city-cost">
                <CostIcon name="timber" /> {fmtNum(BUILD_COST.timber)}
                <span className="city-visually-hidden"> timber</span>
              </span>
            </div>
            <p
              className={`city-afford ${canPayAny ? "city-afford-ok" : "city-afford-err"}`}
            >
              {canPayAny ? "Resources available" : "Insufficient resources"}
            </p>
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
