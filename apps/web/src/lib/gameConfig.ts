// Client-side copies of server-owned constants — duplicates server truth,
// pending dedup via @tideforge/shared.

export const BUILD_COST = { food: 100, timber: 100 } as const;

export const PLOT_ASSIGN_COST = { food: 80, timber: 40 } as const;

export type FactionMeta = { label: string; blurb: string; accent: string };

export const FACTION_META: Record<string, FactionMeta> = {
  northern_kingdom: {
    label: "Northern Kingdom",
    blurb: "Hardy soldiers and fortified keeps — defenders of the realm.",
    accent: "brine",
  },
  mountain_realm: {
    label: "Mountain Realm",
    blurb: "Miners and smiths — iron and stone shape their destiny.",
    accent: "ash",
  },
  forest_people: {
    label: "Forest People",
    blurb: "Archers and scouts — the woods are their domain.",
    accent: "sky",
  },
  coastal_lords: {
    label: "Coastal Lords",
    blurb: "Ships and trade — they control the sea lanes.",
    accent: "moss",
  },
};

export type Tab =
  | "castle"
  | "lands"
  | "realm"
  | "war"
  | "alliance"
  | "knowledge"
  | "settings";

export const TAB_LABELS: Record<Tab, string> = {
  castle: "Castle",
  lands: "Lands",
  realm: "Realm",
  war: "War",
  alliance: "Alliance",
  knowledge: "Knowledge",
  settings: "Settings",
};

export type Toast = { id: number; message: string; kind: "info" | "ok" | "err" };
