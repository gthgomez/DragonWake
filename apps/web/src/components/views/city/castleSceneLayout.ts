/**
 * Castle scene layout — the single source of truth for where a logical city
 * slot lives in the settlement world.
 *
 * Logical slots stay discrete and authoritative. The renderer maps them to
 * authored world anchors on one continuous ground plane (North Star V2 §5).
 * No JSX carries ad-hoc offsets; everything derives from this table.
 */

/** Logical scene canvas (AlphaDesign specification 1672×941). */
export const SCENE_W = 1672;
export const SCENE_H = 941;

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
 * Authored anchors for the canonical twelve slots aligned to AlphaDesign.
 * Slot 0 is the Citadel keep gate; slot 7 is the Dragon Watch fortress rise.
 * Slots 1..6, 8..11 inhabit the dense medieval quarter along the stone streets.
 */
const BASE_ANCHORS: SceneAnchor[] = [
  { slot: 0, x: 0.341, y: 0.404, scale: 1.05, kind: "keep" },
  { slot: 1, x: 0.150, y: 0.500, scale: 0.95, kind: "support" },
  { slot: 2, x: 0.102, y: 0.563, scale: 0.95, kind: "support" },
  { slot: 3, x: 0.221, y: 0.542, scale: 0.95, kind: "support" },
  { slot: 4, x: 0.173, y: 0.638, scale: 0.98, kind: "support" },
  { slot: 5, x: 0.287, y: 0.616, scale: 0.96, kind: "support" },
  { slot: 6, x: 0.377, y: 0.520, scale: 0.94, kind: "support" },
  { slot: 7, x: 0.646, y: 0.436, scale: 1.00, kind: "rise" },
  { slot: 8, x: 0.251, y: 0.733, scale: 0.96, kind: "outer" },
  { slot: 9, x: 0.341, y: 0.733, scale: 0.98, kind: "outer" },
  { slot: 10, x: 0.467, y: 0.659, scale: 0.98, kind: "outer" },
  { slot: 11, x: 0.526, y: 0.786, scale: 0.95, kind: "outer" },
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
