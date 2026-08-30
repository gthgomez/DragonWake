import type { BattleReport, QueueJob, Resources, UnitDef } from "./types";
import { unitName, buildingName, wildInfo, postureLabel } from "./labels";

export function fmtEta(ms: number): string {
  if (ms <= 0) return "ready";
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

export function fmtTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

/** Whole-number display with light thousands separators. */
export function fmtNum(n: number | undefined | null): string {
  const v = Math.floor(Number(n ?? 0));
  return v.toLocaleString("en-US");
}

export function canAfford(res: Resources, cost: Partial<Resources>): boolean {
  return (Object.keys(cost) as (keyof Resources)[]).every(
    (k) => (res[k] ?? 0) >= (cost[k] ?? 0),
  );
}

export function unitTrainCost(u: UnitDef, count: number): Partial<Resources> {
  return {
    food: (u.cost_food ?? 0) * count,
    timber: (u.cost_timber ?? 0) * count,
    stone: (u.cost_stone ?? 0) * count,
    iron: (u.cost_iron ?? 0) * count,
    coin: (u.cost_coin ?? 0) * count,
  };
}

export function jobLabel(job: QueueJob): string {
  if (job.kind === "build") {
    const to = Number(job.payload.upgradeTo ?? 0);
    const name = buildingName(String(job.payload.buildingType));
    return to > 1 ? `Raising ${name} to level ${to}` : `Building ${name}`;
  }
  if (job.kind === "research") return `Research ${String(job.payload.techId)}`;
  if (job.kind === "train") {
    return `Training ${job.payload.count}× ${unitName(String(job.payload.unitId))}`;
  }
  return job.kind;
}

export function lossList(map?: Record<string, number>): string {
  if (!map) return "—";
  const parts = Object.entries(map)
    .filter(([, n]) => n > 0)
    .map(([k, v]) => `${fmtNum(v)} ${unitName(k)}`);
  return parts.length ? parts.join(", ") : "none";
}

export function lootList(loot?: Partial<Resources>): string {
  if (!loot) return "—";
  const parts = Object.entries(loot)
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([k, v]) => `+${fmtNum(v)} ${k}`);
  return parts.length ? parts.join(", ") : "none";
}

export { postureLabel } from "./labels";

export function formatIntel(intel: BattleReport["result"]["intel"]): string {
  if (!intel) return "";
  if (typeof intel === "string") return intel;
  const kind = String(intel.kind ?? "intel");
  if (kind === "camp") {
    return `Level ${intel.level} camp · threat ${intel.threatBand}${
      intel.exampleComp ? ` · mustering roughly ${intel.exampleComp}` : ""
    }`;
  }
  if (kind === "city") {
    return `${intel.cityName ?? "A settlement"} · held by ${intel.ownerName ?? "an unknown lord"} · ${postureLabel(
      String(intel.defensePosture ?? ""),
    )} · troops ${intel.troopCount ?? intel.troopBand ?? "unknown"}${
      intel.protected ? " · under protection" : ""
    }`;
  }
  if (kind === "wilderness") {
    const info = wildInfo(String(intel.resourceType ?? ""));
    return `${info.label} (level ${intel.level})${
      intel.ownerName ? ` · held by ${intel.ownerName}` : " · unclaimed"
    }`;
  }
  return JSON.stringify(intel);
}

export function reportHeadline(r: BattleReport, youId: string): string {
  const t = r.result?.type ?? "battle";
  if (t === "pvp_blocked") return "PvP blocked (protection)";
  if (t === "scout") return "Scout report";
  if (t === "haul")
    return r.result?.delivered ? "Haul delivered" : "Haul bounced";
  if (t === "pvp") {
    return r.result?.harborLoot ? "Withdraw raid" : "Full defense PvP";
  }
  if (t === "attack") return "Camp attack";
  if (t === "occupy") return "Occupy wilderness";
  const youAtk = r.attackerPlayerId === youId;
  return youAtk ? `${t} (you attacked)` : `${t} (incoming)`;
}

export function plotLabel(id: string | null): string {
  if (!id) return "empty";
  return id
    .split("_")
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}
