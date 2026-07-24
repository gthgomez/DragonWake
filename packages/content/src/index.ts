/**
 * Game content loaders. JSON lives in ../data (copied from pre-implementation).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");

function loadJson<T>(name: string): T {
  const raw = readFileSync(join(dataDir, name), "utf8");
  return JSON.parse(raw) as T;
}

export type UnitDef = {
  id: string;
  name: string;
  tier: number;
  role: string;
  life: number;
  melee_atk: number;
  ranged_atk: number;
  range: number;
  speed: number;
  defense: number;
  pop: number;
  power: number;
  carry: number;
  [key: string]: unknown;
};

export type ContentMeta = {
  version: string;
  source: string;
  generated: string;
};

let cache: {
  units?: UnitDef[];
  rps?: Record<string, Record<string, number>>;
  stackEfficiency?: unknown[];
  meta?: ContentMeta;
} = {};

export function getMeta(): ContentMeta {
  return (cache.meta ??= loadJson<ContentMeta>("meta.json"));
}

export function getUnits(): UnitDef[] {
  return (cache.units ??= loadJson<UnitDef[]>("units.json"));
}

export function getUnitById(id: string): UnitDef | undefined {
  return getUnits().find((u) => u.id === id);
}

export function getRps(): Record<string, Record<string, number>> {
  return (cache.rps ??= loadJson("rps.json"));
}

export function getStackEfficiency(): unknown[] {
  return (cache.stackEfficiency ??= loadJson("stack_efficiency.json"));
}

export function getDataPath(): string {
  return dataDir;
}
