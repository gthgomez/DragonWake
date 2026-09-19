import { describe, expect, it } from "vitest";

import {
  SCENE_H,
  SCENE_W,
  depthZ,
  sceneAnchorForSlot,
} from "./castleSceneLayout";

describe("castleSceneLayout", () => {
  it("gives the canonical twelve slots an on-world anchor", () => {
    for (let slot = 0; slot < 12; slot++) {
      const a = sceneAnchorForSlot(slot);
      expect(a.slot).toBe(slot);
      expect(a.x).toBeGreaterThan(0.05);
      expect(a.x).toBeLessThan(0.95);
      expect(a.y).toBeGreaterThan(0.05);
      expect(a.y).toBeLessThan(0.95);
      expect(a.scale).toBeGreaterThan(0.5);
      expect(a.scale).toBeLessThanOrEqual(1.5);
    }
  });

  it("does not stack two authored plots on the same point", () => {
    const seen = new Set<string>();
    for (let slot = 0; slot < 12; slot++) {
      const a = sceneAnchorForSlot(slot);
      const key = `${a.x.toFixed(3)}:${a.y.toFixed(3)}`;
      expect(seen.has(key), `duplicate anchor for slot ${slot}`).toBe(false);
      seen.add(key);
    }
  });

  it("places the Keep as the primary landmark above the lower town", () => {
    const keep = sceneAnchorForSlot(0);
    const town = sceneAnchorForSlot(9);
    expect(keep.kind).toBe("keep");
    expect(keep.y).toBeLessThan(town.y);
    expect(keep.scale).toBeGreaterThanOrEqual(town.scale);
  });

  it("derives depth order from the anchor's north-south position", () => {
    expect(depthZ(sceneAnchorForSlot(0))).toBeLessThan(depthZ(sceneAnchorForSlot(9)));
  });

  it("extends deterministically and in-bounds for every server-permitted slot", () => {
    // The server caps slotIndex at 32 (validate.ts); cover the whole range.
    const seen = new Set<string>();
    for (let slot = 12; slot <= 32; slot++) {
      const a = sceneAnchorForSlot(slot);
      expect(a.slot).toBe(slot);
      expect(a.x).toBeGreaterThan(0);
      expect(a.x).toBeLessThan(1);
      expect(a.y).toBeGreaterThan(0);
      expect(a.y).toBeLessThanOrEqual(1);
      expect(sceneAnchorForSlot(slot)).toEqual(a);
      const key = `${a.x.toFixed(3)}:${a.y.toFixed(3)}`;
      expect(seen.has(key), `stacked outlying anchor at slot ${slot}`).toBe(false);
      seen.add(key);
    }
  });

  it("keeps the scene canvas aspect stable for the compositor", () => {
    expect(SCENE_W / SCENE_H).toBeGreaterThan(1.4);
    expect(SCENE_W / SCENE_H).toBeLessThan(1.8);
  });
});
