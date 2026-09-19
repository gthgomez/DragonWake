import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

import atlas from "./castleSceneAtlas.json";
import {
  CASTLE_BUILDING_STEM,
  artTierOf,
  castleBuildingArt,
  castleArtAvailable,
} from "./castleSceneAssets";

const CANONICAL_IDS = Object.keys(CASTLE_BUILDING_STEM);

describe("artTierOf", () => {
  it("keeps the three-band progression: stone L1-3, bronze L4-6, gold L7+", () => {
    expect(artTierOf(1)).toBe("stone");
    expect(artTierOf(3)).toBe("stone");
    expect(artTierOf(4)).toBe("bronze");
    expect(artTierOf(6)).toBe("bronze");
    expect(artTierOf(7)).toBe("gold");
    expect(artTierOf(10)).toBe("gold");
  });
});

describe("castleBuildingArt", () => {
  it("resolves every canonical mapped building to valid scene metadata", () => {
    for (const id of CANONICAL_IDS) {
      const art = castleBuildingArt(id, 1);
      expect(art, id).toBeDefined();
      expect(art!.src.startsWith("/art/alpha/castle/buildings/")).toBe(true);
      expect(art!.src.endsWith(".webp")).toBe(true);
      const [ax, ay] = art!.anchor;
      expect(ax).toBeGreaterThanOrEqual(0);
      expect(ax).toBeLessThanOrEqual(1);
      expect(ay).toBeGreaterThan(0.5);
      expect(ay).toBeLessThanOrEqual(1);
      expect(art!.widthPct).toBeGreaterThan(0);
      expect(art!.aspect).toBeGreaterThan(0);
    }
  });

  it("swaps normalized tier derivatives by level band", () => {
    expect(castleBuildingArt("forge_heart", 1)!.src).toMatch(/bld-keep\.webp$/);
    expect(castleBuildingArt("forge_heart", 4)!.tier).toBe("bronze");
    expect(castleBuildingArt("forge_heart", 7)!.src).toMatch(/bld-keep-gold\.webp$/);
    expect(castleBuildingArt("habitation", 4)!.tier).toBe("bronze");
    expect(castleBuildingArt("habitation", 7)!.tier).toBe("gold");
  });

  it("degrades to a lower tier when the requested tier is unavailable", () => {
    // bld-barracks-gold is a rejected master (baked opaque background), so the
    // lordly barracks must fall back to the reinforced derivative, not 404.
    const gold = castleBuildingArt("barracks", 8)!;
    expect(gold.tier).toBe("bronze");
    expect(gold.src).toMatch(/bld-barracks-bronze\.webp$/);
  });

  it("returns undefined for an unknown building so callers can fall back safely", () => {
    expect(castleBuildingArt("unknown_building", 3)).toBeUndefined();
    expect(castleArtAvailable("unknown_building", 3)).toBe(false);
  });
});

describe("castle scene atlas", () => {
  it("records master provenance for every derivative", () => {
    const assets = (atlas as { assets: Record<string, { master: string; masterSha256: string }> }).assets;
    const names = Object.keys(assets);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(assets[name]!.master.startsWith("/art/alpha/imagine-explorations/buildings/")).toBe(true);
      expect(assets[name]!.masterSha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("ships a runtime derivative for every tier the scene can request", () => {
    // A stale atlas that points at a missing file would 404 in the world, so
    // every mapped building/level must resolve to a real file on disk.
    for (const id of CANONICAL_IDS) {
      for (const level of [1, 4, 7, 10]) {
        const art = castleBuildingArt(id, level)!;
        const file = path.join(process.cwd(), "public", art.src.replace(/^\//, ""));
        expect(fs.existsSync(file), `${id} L${level} -> ${art.src}`).toBe(true);
      }
    }
  });
});
