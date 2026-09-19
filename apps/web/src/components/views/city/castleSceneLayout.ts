/**
 * Castle scene layout — the single source of truth for where a logical city
 * slot lives in the settlement world.
 *
 * Logical slots stay discrete and authoritative. The renderer maps them to
 * authored world anchors on one continuous ground plane (North Star V2 §5).
 * No JSX carries ad-hoc offsets; everything derives from this table.
 */

/** Logical scene canvas. All anchors are normalized to this box. */
export const SCENE_W = 1400;
export const SCENE_H = 880;

export type AnchorKind = "keep" | "rise" | "support" | "outer";

export type SceneAnchor = {
  slot: number;
  /** Ground-contact point, normalized to the scene box. */
  x: number;
  y: number;
  /** Composition scale multiplier applied on top of the asset footprint. */
  scale: number;
  kind: AnchorKind;
};

/**
 * Authored anchors for the canonical twelve slots. Slot 0 is the Keep bailey;
 * slot 7 is the rocky rise the Dragon Watch reads best on. Other slots form
 * the lower town along the two approach roads.
 */
const BASE_ANCHORS: SceneAnchor[] = [
  { slot: 0, x: 0.37, y: 0.42, scale: 1.02, kind: "keep" },
  { slot: 1, x: 0.16, y: 0.6, scale: 1.0, kind: "support" },
  { slot: 2, x: 0.29, y: 0.63, scale: 0.98, kind: "support" },
  { slot: 3, x: 0.43, y: 0.66, scale: 0.97, kind: "support" },
  { slot: 4, x: 0.57, y: 0.63, scale: 1.0, kind: "support" },
  { slot: 5, x: 0.71, y: 0.59, scale: 0.94, kind: "support" },
  { slot: 6, x: 0.11, y: 0.76, scale: 0.92, kind: "outer" },
  { slot: 7, x: 0.72, y: 0.4, scale: 0.98, kind: "rise" },
  { slot: 8, x: 0.26, y: 0.79, scale: 0.94, kind: "outer" },
  { slot: 9, x: 0.41, y: 0.81, scale: 0.96, kind: "outer" },
  { slot: 10, x: 0.56, y: 0.79, scale: 0.94, kind: "outer" },
  { slot: 11, x: 0.7, y: 0.75, scale: 0.92, kind: "outer" },
];

/** Deterministic outward arc for slots beyond the authored twelve. */
function outerAnchor(slot: number): SceneAnchor {
  const i = slot - BASE_ANCHORS.length;
  const perRow = 6;
  const row = Math.floor(i / perRow);
  const col = i % perRow;
  const y = Math.min(0.93, 0.84 + row * 0.045);
  const spread = 0.7 - row * 0.05;
  const x = 0.15 + (col / (perRow - 1)) * spread + (row % 2) * 0.04;
  return {
    slot,
    x: Math.min(0.93, x),
    y,
    scale: Math.max(0.72, 0.9 - row * 0.05),
    kind: "outer",
  };
}

export function sceneAnchorForSlot(slot: number): SceneAnchor {
  return (
    BASE_ANCHORS.find((a) => a.slot === slot) ?? outerAnchor(slot)
  );
}

/** Depth key: larger y draws later (in front). */
export function depthZ(anchor: SceneAnchor): number {
  return Math.round(anchor.y * 1000);
}
