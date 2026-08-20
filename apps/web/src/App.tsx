import { useCallback, useEffect, useMemo, useState } from "react";

const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const BUILD_COST = { kelp: 100, driftwood: 100 } as const;
const PLOT_ASSIGN_COST = { kelp: 80, driftwood: 40 } as const;

const RESOURCE_DISPLAY: Record<string, string> = {
  kelp: "Food",
  driftwood: "Timber",
  basalt: "Stone",
  slagiron: "Iron",
  tidegilt: "Coin",
};

const FACTION_META: Record<
  string,
  { label: string; blurb: string; accent: string }
> = {
  brinecant: {
    label: "Brinecant",
    blurb: "Reef forges and tidal discipline — salt-hardened archers and barges.",
    accent: "brine",
  },
  ashcoil: {
    label: "Ashcoil",
    blurb: "Ember coasts and slag pits — iron will, brutal melee pressure.",
    accent: "ash",
  },
  skyshear: {
    label: "Skyshear",
    blurb: "High wind corridors — scouts, skyshrikes, and open-water range.",
    accent: "sky",
  },
  mossvault: {
    label: "Mossvault",
    blurb: "Sunken vaults and kelp farms — slow power, deep logistics.",
    accent: "moss",
  },
};

const TAB_LABELS: Record<Tab, string> = {
  castle: "Castle",
  lands: "Lands",
  realm: "Realm",
  war: "War",
  alliance: "Alliance",
  knowledge: "Knowledge",
  settings: "Settings",
};

type Tab =
  | "castle"
  | "lands"
  | "realm"
  | "war"
  | "alliance"
  | "knowledge"
  | "settings";

type Resources = {
  kelp: number;
  driftwood: number;
  basalt: number;
  slagiron: number;
  tidegilt: number;
};

type City = {
  id: string;
  name: string;
  kind: string;
  mapX: number;
  mapY: number;
  resources: Resources;
  defensePosture: string;
  buildings: { slotIndex: number; buildingType: string; level: number }[];
  plots: { slotIndex: number; plotType: string | null; level: number }[];
  stacks: Record<string, number>;
  research: Record<string, number>;
  productionPerHour?: Resources;
  ownedWilderness?: number;
  population?: number;
  maxPopulation?: number;
  usedManpower?: number;
  maxManpower?: number;
};

type Player = {
  id: string;
  displayName: string;
  faction: string;
  chronite: number;
  protectionUntil: string | null;
};

type QueueJob = {
  id: string;
  cityId: string;
  kind: "build" | "research" | "train";
  payload: Record<string, unknown>;
  startedAt: number;
  finishesAt: number;
  status: string;
};

type March = {
  id: string;
  fromCityId: string;
  intent: string;
  targetType: string;
  targetId: string | null;
  targetX: number;
  targetY: number;
  composition: Record<string, number>;
  departAt: number;
  arriveAt: number;
  returnAt: number | null;
  status: string;
  battleReportId: string | null;
};

type BattleReport = {
  id: string;
  attackerPlayerId: string | null;
  defenderPlayerId: string | null;
  createdAt: number;
  result: {
    type?: string;
    reason?: string;
    note?: string;
    intel?: string | Record<string, unknown>;
    harborLoot?: boolean;
    delivered?: boolean;
    loot?: Partial<Resources>;
    battle?: {
      winner?: string;
      rounds?: number;
      note?: string;
      losses?: {
        attacker?: Record<string, number>;
        defender?: Record<string, number>;
      };
      remaining?: {
        attacker?: Record<string, number>;
        defender?: Record<string, number>;
      };
    };
    target?: { type?: string; x?: number; y?: number; id?: string | null };
  };
};

type Toast = { id: number; message: string; kind: "info" | "ok" | "err" };

type WorldEventDto = {
  seq: number;
  type: string;
  message: string;
  at: number;
};

type UnitDef = {
  id: string;
  name: string;
  cost_kelp?: number;
  cost_driftwood?: number;
  cost_basalt?: number;
  cost_slagiron?: number;
  cost_tidegilt?: number;
  train_sec_L1?: number;
  unlock?: string;
  role?: string;
  tier?: number;
};

type MapData = {
  mapW?: number;
  mapH?: number;
  camps: { id: string; x: number; y: number; level: number }[];
  wilderness: {
    id: string;
    x: number;
    y: number;
    level: number;
    resourceType: string;
    ownerPlayerId: string | null;
  }[];
  cities: {
    id: string;
    x: number;
    y: number;
    name: string;
    kind: string;
    playerId?: string;
  }[];
};

function authHeaders(token: string | null): HeadersInit {
  const h: Record<string, string> = { "content-type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function api<T>(
  path: string,
  token: string | null,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { ...authHeaders(token), ...(init?.headers ?? {}) },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function fmtEta(ms: number): string {
  if (ms <= 0) return "ready";
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

function fmtTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

function canAfford(res: Resources, cost: Partial<Resources>): boolean {
  return (Object.keys(cost) as (keyof Resources)[]).every(
    (k) => (res[k] ?? 0) >= (cost[k] ?? 0),
  );
}

function unitTrainCost(u: UnitDef, count: number): Partial<Resources> {
  return {
    kelp: (u.cost_kelp ?? 0) * count,
    driftwood: (u.cost_driftwood ?? 0) * count,
    basalt: (u.cost_basalt ?? 0) * count,
    slagiron: (u.cost_slagiron ?? 0) * count,
    tidegilt: (u.cost_tidegilt ?? 0) * count,
  };
}

function jobLabel(job: QueueJob): string {
  if (job.kind === "build") return `Build ${String(job.payload.buildingType)}`;
  if (job.kind === "research") return `Research ${String(job.payload.techId)}`;
  if (job.kind === "train") {
    return `Train ${job.payload.count}× ${String(job.payload.unitId)}`;
  }
  return job.kind;
}

function lossList(map?: Record<string, number>): string {
  if (!map) return "—";
  const parts = Object.entries(map)
    .filter(([, n]) => n > 0)
    .map(([k, v]) => `${v} ${k}`);
  return parts.length ? parts.join(", ") : "none";
}

function lootList(loot?: Partial<Resources>): string {
  if (!loot) return "—";
  const parts = Object.entries(loot)
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([k, v]) => `+${v} ${k}`);
  return parts.length ? parts.join(", ") : "none";
}

function postureLabel(posture?: string, harborLoot?: boolean): string {
  if (harborLoot) return "Withdraw (free loot — no wall fight)";
  if (posture === "full") return "Full defense (stacks fought)";
  if (posture === "garrison") return "Garrison (only garrisoned troops fight)";
  if (posture === "withdraw") return "Withdraw";
  return harborLoot === false ? "Fought (not withdraw loot)" : "—";
}

function formatIntel(intel: BattleReport["result"]["intel"]): string {
  if (!intel) return "";
  if (typeof intel === "string") return intel;
  const kind = String(intel.kind ?? "intel");
  if (kind === "camp") {
    return `Camp L${intel.level} · threat ${intel.threatBand}${
      intel.exampleComp ? ` · ~${intel.exampleComp}` : ""
    }`;
  }
  if (kind === "city") {
    return `City ${intel.cityName ?? ""} · ${intel.ownerName ?? "?"} · posture ${
      intel.defensePosture ?? "?"
    } · troops ${intel.troopBand ?? "?"}${
      intel.protected ? " · protected" : ""
    }`;
  }
  if (kind === "wilderness") {
    return `Wild ${intel.resourceType} L${intel.level}${
      intel.ownerName ? ` · owner ${intel.ownerName}` : " · unclaimed"
    }`;
  }
  return JSON.stringify(intel);
}

function reportHeadline(r: BattleReport, youId: string): string {
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

function plotLabel(id: string | null): string {
  if (!id) return "empty";
  return id
    .split("_")
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

export function App() {
  const [tab, setTab] = useState<Tab>("castle");
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("tideforge_token"),
  );
  const [player, setPlayer] = useState<Player | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [marches, setMarches] = useState<March[]>([]);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [selectedTile, setSelectedTile] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [reports, setReports] = useState<BattleReport[]>([]);
  const [alliance, setAlliance] = useState<{
    id: string;
    name: string;
    tag: string;
  } | null>(null);
  const [chat, setChat] = useState<
    { body: string; fromPlayerId: string; createdAt?: number }[]
  >([]);
  const [formulas, setFormulas] = useState<unknown>(null);
  const [readinessStatus, setReadinessStatus] = useState<any>(null);
  const [bestiaryEntries, setBestiaryEntries] = useState<any[]>([]);
  const [expeditionStatus, setExpeditionStatus] = useState<any>(null);
  const [clueData, setClueData] = useState<any>(null);
  const [units, setUnits] = useState<UnitDef[]>([]);
  const [sovereigns, setSovereigns] = useState<
    { id: string; sovereignType: string; harnessComplete: boolean }[]
  >([]);
  const [displayName, setDisplayName] = useState("Guest");
  const [faction, setFaction] = useState("brinecant");
  const [chatBody, setChatBody] = useState("");
  const [allyName, setAllyName] = useState("Tideband");
  const [allyTag, setAllyTag] = useState("TIDE");
  const [comp, setComp] = useState<Record<string, number>>({
    levy: 20,
    reefbow: 10,
  });
  const [pvpX, setPvpX] = useState(0);
  const [pvpY, setPvpY] = useState(0);
  const [pvpIntent, setPvpIntent] = useState<"attack" | "scout" | "reinforce">(
    "attack",
  );
  const [plotPick, setPlotPick] = useState("kelp_farm");
  const [now, setNow] = useState(() => Date.now());
  const [mapFocus, setMapFocus] = useState({ x0: 0, y0: 0, x1: 19, y1: 19 });
  const [tutorial, setTutorial] = useState<{
    step: number;
    completed: boolean;
    totalSteps: number;
    currentLabel: string;
  } | null>(null);
  const [dailyQuests, setDailyQuests] = useState<
    {
      id: string;
      title: string;
      rewardChronite: number;
      done: boolean;
      claimed: boolean;
    }[]
  >([]);
  const [allianceList, setAllianceList] = useState<
    { id: string; name: string; tag: string; memberCount: number }[]
  >([]);
  const [joinTag, setJoinTag] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [eventSince, setEventSince] = useState(0);
  const [unreadReports, setUnreadReports] = useState(0);

  const city = useMemo(
    () => cities.find((c) => c.id === cityId) ?? cities[0] ?? null,
    [cities, cityId],
  );

  const factionMeta = FACTION_META[player?.faction ?? faction] ?? FACTION_META.brinecant!;

  const refreshMe = useCallback(async (tok: string) => {
    const me = await api<{
      player: Player;
      cities: City[];
      alliance: { id: string; name: string; tag: string } | null;
      sovereigns: {
        id: string;
        sovereignType: string;
        harnessComplete: boolean;
      }[];
      serverNow?: number;
      tutorial?: {
        step: number;
        completed: boolean;
        totalSteps: number;
        currentLabel: string;
      };
      dailyQuests?: {
        id: string;
        title: string;
        rewardChronite: number;
        done: boolean;
        claimed: boolean;
      }[];
    }>("/api/v1/me", tok);
    setPlayer(me.player);
    setCities(me.cities);
    setCityId((id) => id ?? me.cities[0]?.id ?? null);
    setAlliance(me.alliance);
    setSovereigns(me.sovereigns ?? []);
    if (me.tutorial) setTutorial(me.tutorial);
    if (me.dailyQuests) setDailyQuests(me.dailyQuests);
    if (me.serverNow) setNow(me.serverNow);
  }, []);

  const refreshQueues = useCallback(
    async (tok: string, cId: string | null) => {
      if (!cId) return;
      const data = await api<{ jobs: QueueJob[] }>(
        `/api/v1/cities/${cId}/queues`,
        tok,
      );
      setJobs(data.jobs.filter((j) => j.status === "running"));
    },
    [],
  );

  const refreshMarches = useCallback(async (tok: string) => {
    const data = await api<{ marches: March[] }>("/api/v1/marches", tok);
    setMarches(
      data.marches.filter(
        (m) =>
          m.status === "en_route" ||
          m.status === "returning" ||
          m.status === "resolving",
      ),
    );
  }, []);

  const loadUnits = useCallback(async () => {
    try {
      const data = await api<{ units: UnitDef[] }>(
        "/api/v1/content/units",
        null,
      );
      setUnits(data.units);
    } catch {
      /* optional at boot */
    }
  }, []);

  const pushToast = useCallback(
    (message: string, kind: Toast["kind"] = "info") => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((t) => [...t.slice(-4), { id, message, kind }]);
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 6000);
    },
    [],
  );

  useEffect(() => {
    void loadUnits();
  }, [loadUnits]);

  useEffect(() => {
    if (!token) return;
    const tick = () => {
      void refreshMe(token)
        .then(() =>
          Promise.all([
            refreshQueues(token, cityId),
            refreshMarches(token),
          ]),
        )
        .catch((e) => setError(String(e.message ?? e)));
      setNow(Date.now());
    };
    tick();
    const id = window.setInterval(tick, 2000);
    return () => window.clearInterval(id);
  }, [token, cityId, refreshMe, refreshQueues, refreshMarches]);

  // P0.2: poll sim events for toasts without relying on full-page refresh
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let since = eventSince;
    const poll = async () => {
      try {
        const data = await api<{
          events: WorldEventDto[];
          latestSeq?: number;
        }>(`/api/v1/events?since=${since}`, token);
        if (cancelled || !data.events?.length) return;
        let maxSeq = since;
        for (const e of data.events) {
          maxSeq = Math.max(maxSeq, e.seq);
          const kind =
            e.type === "report" || e.type === "march_land"
              ? "ok"
              : e.type === "queue_complete"
                ? "ok"
                : "info";
          pushToast(e.message, kind);
          if (e.type === "report" || e.type === "march_land") {
            setUnreadReports((n) => n + 1);
            void loadReports().catch(() => undefined);
            void refreshMarches(token).catch(() => undefined);
          }
          if (e.type === "queue_complete" || e.type === "march_return") {
            void refreshMe(token).catch(() => undefined);
            void refreshQueues(token, cityId).catch(() => undefined);
            void refreshMarches(token).catch(() => undefined);
          }
        }
        since = maxSeq;
        setEventSince(maxSeq);
      } catch {
        /* ignore poll blips */
      }
    };
    void poll();
    const id = window.setInterval(() => void poll(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
    // eventSince intentionally not in deps — we keep local since cursor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, cityId, refreshMe, refreshQueues, refreshMarches]);

  async function run(label: string, fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
      setStatus(label);
      pushToast(label, "ok");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      pushToast(msg, "err");
    }
  }

  async function loginGuest() {
    await run("Entered realm", async () => {
      const data = await api<{
        token: string;
        player: Player;
        city: City;
      }>("/api/v1/auth/guest", null, {
        method: "POST",
        body: JSON.stringify({ displayName, faction }),
      });
      localStorage.setItem("tideforge_token", data.token);
      setToken(data.token);
      setPlayer(data.player);
      setCities([data.city]);
      setCityId(data.city.id);
    });
  }

  async function doBuild(buildingType: string) {
    if (!token || !city) return;
    if (!canAfford(city.resources, BUILD_COST)) {
      setError(`Need ${BUILD_COST.kelp} kelp + ${BUILD_COST.driftwood} driftwood`);
      return;
    }
    await run(`Queued ${buildingType}`, async () => {
      const slot =
        Math.max(0, ...city.buildings.map((b) => b.slotIndex), -1) + 1;
      await api(`/api/v1/cities/${city.id}/buildings`, token, {
        method: "POST",
        body: JSON.stringify({ slotIndex: slot, buildingType }),
      });
      await refreshMe(token);
      await refreshQueues(token, city.id);
    });
  }

  async function doResearch(techId: string) {
    if (!token || !city) return;
    await run(`Queued research ${techId}`, async () => {
      await api(`/api/v1/cities/${city.id}/research`, token, {
        method: "POST",
        body: JSON.stringify({ techId }),
      });
      await refreshMe(token);
      await refreshQueues(token, city.id);
    });
  }

  async function doTrain(unitId: string, count: number) {
    if (!token || !city) return;
    const def = units.find((u) => u.id === unitId);
    if (def && !canAfford(city.resources, unitTrainCost(def, count))) {
      setError("Not enough resources to train");
      return;
    }
    await run(`Queued train ${count}× ${unitId}`, async () => {
      await api(`/api/v1/cities/${city.id}/train`, token, {
        method: "POST",
        body: JSON.stringify({ unitId, count }),
      });
      await refreshMe(token);
      await refreshQueues(token, city.id);
    });
  }

  async function loadMap(focus = mapFocus) {
    if (!token) return;
    const data = await api<MapData>(
      `/api/v1/map/viewport?x0=${focus.x0}&y0=${focus.y0}&x1=${focus.x1}&y1=${focus.y1}`,
      token,
    );
    setMapData(data);
  }

  function compositionFromUi(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(comp)) {
      const n = Math.floor(Number(v) || 0);
      if (n > 0) out[k] = n;
    }
    return out;
  }

  async function sendMarch(opts: {
    intent: "attack" | "occupy" | "scout" | "reinforce";
    target: {
      type: "camp" | "wilderness" | "city" | "coords";
      id?: string;
      x: number;
      y: number;
    };
  }) {
    if (!token || !city) return;
    const composition = compositionFromUi();
    if (Object.keys(composition).length === 0) {
      setError("Set march composition (units from your stacks)");
      pushToast("March blocked: no units selected", "err");
      return;
    }
    for (const [uid, n] of Object.entries(composition)) {
      const have = city.stacks[uid] ?? 0;
      if (have < n) {
        const msg = `Not enough ${uid} (need ${n}, have ${have})`;
        setError(msg);
        pushToast(msg, "err");
        return;
      }
    }
    await run(
      `${opts.intent} → ${opts.target.x},${opts.target.y}`,
      async () => {
        await api("/api/v1/marches", token, {
          method: "POST",
          body: JSON.stringify({
            fromCityId: city.id,
            intent: opts.intent,
            target: opts.target,
            composition,
          }),
        });
        await refreshMe(token);
        await refreshMarches(token);
        pushToast(
          `March sent: ${opts.intent} @ ${opts.target.x},${opts.target.y}`,
          "ok",
        );
      },
    );
  }

  async function attackSelectedCamp() {
    if (!mapData || !selectedTile) {
      setError("Select a camp tile on the map");
      return;
    }
    const camp = mapData.camps.find(
      (c) => c.x === selectedTile.x && c.y === selectedTile.y,
    );
    if (!camp) {
      setError("Selected tile is not a camp");
      return;
    }
    await sendMarch({
      intent: "attack",
      target: { type: "camp", id: camp.id, x: camp.x, y: camp.y },
    });
  }

  async function occupySelectedWild() {
    if (!mapData || !selectedTile) {
      setError("Select a wilderness tile on the map");
      return;
    }
    const wild = mapData.wilderness.find(
      (w) => w.x === selectedTile.x && w.y === selectedTile.y,
    );
    if (!wild) {
      setError("Selected tile is not wilderness");
      return;
    }
    if (wild.ownerPlayerId) {
      setError("Wilderness already claimed");
      return;
    }
    await sendMarch({
      intent: "occupy",
      target: { type: "wilderness", id: wild.id, x: wild.x, y: wild.y },
    });
  }

  async function attackPvp() {
    if (!mapData) {
      setError("Load the map first");
      return;
    }
    const targetCity = mapData.cities.find(
      (c) => c.x === pvpX && c.y === pvpY,
    );
    await sendMarch({
      intent: pvpIntent,
      target: {
        type: targetCity ? "city" : "coords",
        id: targetCity?.id,
        x: pvpX,
        y: pvpY,
      },
    });
  }

  async function loadReports() {
    if (!token) return;
    const rep = await api<{ reports: BattleReport[] }>(
      "/api/v1/reports",
      token,
    );
    setReports(rep.reports);
  }

  async function createAlly() {
    if (!token) return;
    await run("Tideband created", async () => {
      const data = await api<{
        alliance: { id: string; name: string; tag: string };
      }>("/api/v1/alliances", token, {
        method: "POST",
        body: JSON.stringify({ name: allyName, tag: allyTag }),
      });
      setAlliance(data.alliance);
    });
  }

  async function loadAlliances() {
    if (!token) return;
    const data = await api<{
      alliances: { id: string; name: string; tag: string; memberCount: number }[];
    }>("/api/v1/alliances", token);
    setAllianceList(data.alliances);
  }

  async function joinAlly(tagOrId: { tag?: string; allianceId?: string }) {
    if (!token) return;
    await run("Joined Tideband", async () => {
      await api("/api/v1/alliances/join", token, {
        method: "POST",
        body: JSON.stringify(tagOrId),
      });
      await refreshMe(token);
    });
  }

  async function advanceTutorial() {
    if (!token) return;
    await run("Tutorial advanced", async () => {
      const data = await api<{
        tutorial: {
          step: number;
          completed: boolean;
          totalSteps: number;
          currentLabel: string;
        };
      }>("/api/v1/tutorial/advance", token, { method: "POST" });
      setTutorial(data.tutorial);
    });
  }

  async function claimQuest(questId: string) {
    if (!token) return;
    await run(`Claimed ${questId}`, async () => {
      await api(`/api/v1/quests/daily/${questId}/claim`, token, {
        method: "POST",
      });
      await refreshMe(token);
    });
  }

  async function sendChat() {
    if (!token || !alliance) return;
    await run("Message sent", async () => {
      await api(`/api/v1/alliances/${alliance.id}/chat`, token, {
        method: "POST",
        body: JSON.stringify({ body: chatBody }),
      });
      const list = await api<{
        messages: { body: string; fromPlayerId: string; createdAt?: number }[];
      }>(`/api/v1/alliances/${alliance.id}/chat`, token);
      setChat(list.messages);
      setChatBody("");
    });
  }

  async function loadCodex() {
    const data = await api<{ formulas: unknown }>(
      "/api/v1/content/formulas",
      token,
    );
    setFormulas(data.formulas);
  }

  async function refreshKnowledge() {
    if (!token) return;
    try {
      const [readyResp, bestResp, expResp, clueResp] = await Promise.all([
        api<any>("/api/v1/dragon/readiness", token),
        api<any>("/api/v1/dragon/bestiary", token),
        api<any>("/api/v1/dragon/expedition", token),
        api<any>("/api/v1/dragon/clues", token),
      ]);
      setReadinessStatus(readyResp);
      setBestiaryEntries(bestResp.entries ?? []);
      setExpeditionStatus(expResp);
      setClueData(clueResp);
    } catch {
      // silently fail — knowledge is non-critical
    }
  }

  async function grantDev(body: Record<string, unknown>, label: string) {
    if (!token) return;
    await run(label, async () => {
      await api("/api/v1/admin/grant", token, {
        method: "POST",
        body: JSON.stringify(body),
      });
      await refreshMe(token);
    });
  }

  async function foundMarcherKeep() {
    if (!token) return;
    await run("Marcher Keep founded", async () => {
      await api("/api/v1/settlements/found-marcher-keep", token, {
        method: "POST",
        body: JSON.stringify({ name: "Marcher Keep" }),
      });
      await refreshMe(token);
    });
  }

  async function foundBrine() {
    if (!token) return;
    await run("Brinehold founded", async () => {
      await api("/api/v1/citadels/found-brinehold", token, {
        method: "POST",
        body: JSON.stringify({ name: "Brinehold" }),
      });
      await refreshMe(token);
    });
  }

  async function foundStone() {
    if (!token) return;
    await run("Stonekeel founded", async () => {
      await api("/api/v1/citadels/found", token, {
        method: "POST",
        body: JSON.stringify({ kind: "stonekeel", name: "Stonekeel", unlock: true }),
      });
      await refreshMe(token);
    });
  }

  async function setPosture(posture: string) {
    if (!token || !city) return;
    await run(`Posture → ${posture}`, async () => {
      await api(`/api/v1/cities/${city.id}/posture`, token, {
        method: "POST",
        body: JSON.stringify({ posture }),
      });
      await refreshMe(token);
    });
  }

  async function assignPlot(slotIndex: number) {
    if (!token || !city) return;
    if (!canAfford(city.resources, PLOT_ASSIGN_COST)) {
      setError(
        `Need ${PLOT_ASSIGN_COST.kelp} kelp + ${PLOT_ASSIGN_COST.driftwood} driftwood`,
      );
      return;
    }
    await run(`Assigned plot ${slotIndex}`, async () => {
      await api(`/api/v1/cities/${city.id}/plots`, token, {
        method: "POST",
        body: JSON.stringify({ slotIndex, plotType: plotPick }),
      });
      await refreshMe(token);
    });
  }

  async function upgradePlot(slotIndex: number, level: number) {
    if (!token || !city) return;
    const cost = { kelp: 50 * level, driftwood: 50 * level };
    if (!canAfford(city.resources, cost)) {
      setError(`Need ${cost.kelp} kelp + ${cost.driftwood} driftwood`);
      return;
    }
    await run(`Upgraded plot ${slotIndex}`, async () => {
      await api(`/api/v1/cities/${city.id}/plots/upgrade`, token, {
        method: "POST",
        body: JSON.stringify({ slotIndex }),
      });
      await refreshMe(token);
    });
  }

  function logout() {
    localStorage.removeItem("tideforge_token");
    setToken(null);
    setPlayer(null);
    setCities([]);
    setJobs([]);
    setMarches([]);
  }

  function tileAt(x: number, y: number) {
    if (!mapData) return null;
    const camp = mapData.camps.find((c) => c.x === x && c.y === y);
    if (camp) return { kind: "camp" as const, camp };
    const wild = mapData.wilderness.find((w) => w.x === x && w.y === y);
    if (wild) return { kind: "wild" as const, wild };
    const cty = mapData.cities.find((c) => c.x === x && c.y === y);
    if (cty) return { kind: "city" as const, city: cty };
    return { kind: "empty" as const };
  }

  const stackUnits = useMemo(() => {
    if (!city) return [] as string[];
    const ids = new Set([
      ...Object.keys(city.stacks).filter((k) => (city.stacks[k] ?? 0) > 0),
      ...Object.keys(comp),
      "levy",
      "reefbow",
    ]);
    return [...ids];
  }, [city, comp]);

  const startUnits = useMemo(
    () =>
      units.filter(
        (u) =>
          u.unlock === "start" ||
          u.id === "levy" ||
          u.id === "reefbow" ||
          u.id === "whisper" ||
          u.id === "bearer",
      ),
    [units],
  );

  if (!token || !player) {
    return (
      <div className={`shell faction-${factionMeta.accent}`}>
        <div className="toast-stack" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.kind}`}>
              {t.message}
            </div>
          ))}
        </div>
        <header className="hero">
          <p className="eyebrow">Tideforge Empires · MVP Beta</p>
          <h1>Claim a keep in a dangerous age</h1>
          <p className="tag">{factionMeta.blurb}</p>
        </header>
        <main>
          <section className="card">
            <h2>Create guest</h2>
            {error && <p className="err">{error}</p>}
            <label>
              Display name
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
            <label>
              Faction
              <select
                value={faction}
                onChange={(e) => setFaction(e.target.value)}
              >
                {Object.entries(FACTION_META).map(([id, meta]) => (
                  <option key={id} value={id}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="faction-blurb">{FACTION_META[faction]?.blurb}</p>
            <button type="button" className="primary" onClick={() => void loginGuest()}>
              Enter realm
            </button>
            <p className="muted">
              API: <code>{apiBase || "(same origin)"}</code>
            </p>
          </section>
        </main>
      </div>
    );
  }

  const rates = city?.productionPerHour;
  const mapW = mapFocus.x1 - mapFocus.x0 + 1;
  const mapH = mapFocus.y1 - mapFocus.y0 + 1;
  const selectedInfo = selectedTile
    ? tileAt(selectedTile.x, selectedTile.y)
    : null;

  return (
    <div className={`shell faction-${factionMeta.accent}`}>
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.message}
          </div>
        ))}
      </div>
      <header className="topbar">
        <div>
          <p className="eyebrow">{factionMeta.label}</p>
          <h1>Tideforge Empires</h1>
          <p className="tag">
            {player.displayName} · Chronite {player.chronite}
            {player.protectionUntil
              ? ` · protected until ${new Date(player.protectionUntil).toLocaleString()}`
              : ""}
          </p>
        </div>
        <nav className="tabs" aria-label="Main">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={tab === t ? "active" : ""}
              onClick={() => {
                setTab(t);
                if (t === "realm") void loadMap().catch((e) => setError(String(e)));
                if (t === "war") {
                  setUnreadReports(0);
                  void loadReports().catch((e) => setError(String(e)));
                }
                if (t === "knowledge") {
                  void loadCodex().catch((e) => setError(String(e)));
                  void refreshKnowledge();
                }
                if (t === "alliance")
                  void loadAlliances().catch((e) => setError(String(e)));
              }}
            >
              {TAB_LABELS[t]}
              {t === "war" && unreadReports > 0 ? (
                <span className="badge">{unreadReports}</span>
              ) : null}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {error && (
          <p className="err banner">
            {error}{" "}
            <button type="button" className="linkish" onClick={() => setError(null)}>
              dismiss
            </button>
          </p>
        )}
        {status && <p className="ok banner">{status}</p>}

        {tutorial && !tutorial.completed && (
          <section className="card tutorial-banner">
            <div className="ops-head">
              <h2>
                Tutorial {Math.min(tutorial.step + 1, tutorial.totalSteps)}/
                {tutorial.totalSteps}
              </h2>
              <button type="button" onClick={() => void advanceTutorial()}>
                Next step
              </button>
            </div>
            <p>{tutorial.currentLabel}</p>
          </section>
        )}

        {/* P0: queues + marches always visible when logged in */}
        <section className="card ops">
          <div className="ops-col">
            <h2>Queues</h2>
            {jobs.length === 0 ? (
              <p className="muted">No running jobs</p>
            ) : (
              <ul className="ops-list">
                {jobs.map((j) => {
                  const total = Math.max(1, j.finishesAt - j.startedAt);
                  const left = Math.max(0, j.finishesAt - now);
                  const pct = Math.min(
                    100,
                    Math.round(((total - left) / total) * 100),
                  );
                  return (
                    <li key={j.id}>
                      <div className="ops-head">
                        <span>{jobLabel(j)}</span>
                        <span className="muted">{fmtEta(left)}</span>
                      </div>
                      <div className="bar">
                        <div className="bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="ops-col">
            <h2>Marches</h2>
            {marches.length === 0 ? (
              <p className="muted">No active marches</p>
            ) : (
              <ul className="ops-list">
                {marches.map((m) => {
                  const eta =
                    m.status === "returning" && m.returnAt
                      ? m.returnAt - now
                      : m.arriveAt - now;
                  const label =
                    m.status === "returning"
                      ? "returning"
                      : m.status === "en_route"
                        ? "en route"
                        : m.status;
                  return (
                    <li key={m.id}>
                      <div className="ops-head">
                        <span>
                          {m.intent} → {m.targetX},{m.targetY}{" "}
                          <span className="muted">({label})</span>
                        </span>
                        <span className="muted">{fmtEta(eta)}</span>
                      </div>
                      <p className="muted tiny">
                        {Object.entries(m.composition)
                          .filter(([, n]) => n > 0)
                          .map(([k, v]) => `${v} ${k}`)
                          .join(", ") || "empty stack"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {tab === "castle" && city && (
          <section className="card">
            <h2>
              {city.name}{" "}
              <span className="muted">
                ({city.kind}) @ {city.mapX},{city.mapY}
              </span>
            </h2>
            {cities.length > 1 && (
              <label>
                City
                <select
                  value={city.id}
                  onChange={(e) => setCityId(e.target.value)}
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.kind})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <h3>Resources</h3>
            <ul className="res-grid">
              {(Object.keys(city.resources) as (keyof Resources)[]).map((k) => (
                <li key={k}>
                  <strong>{RESOURCE_DISPLAY[k] ?? k}</strong>
                  <span className="res-val">{city.resources[k]}</span>
                  {rates && (
                    <span className="res-rate">+{rates[k]}/h</span>
                  )}
                </li>
              ))}
            </ul>

            <h3>Population & Manpower</h3>
            <div className="pop-bar-container">
              <div className="pop-row">
                <span>Population: {city.population ?? 0} / {city.maxPopulation ?? "—"}</span>
              </div>
              <div className="bar">
                <div
                  className="bar-fill"
                  style={{
                    width: city.maxPopulation
                      ? `${Math.min(100, ((city.population ?? 0) / city.maxPopulation) * 100)}%`
                      : "0%",
                  }}
                />
              </div>
              <div className="pop-row">
                <span>
                  Available Manpower: {(city.maxManpower ?? 0) - (city.usedManpower ?? 0)}{" "}
                  (of {city.maxManpower ?? 0})
                </span>
              </div>
              <div className="bar">
                <div
                  className="bar-fill"
                  style={{
                    width: city.maxManpower
                      ? `${Math.min(100, ((city.usedManpower ?? 0) / city.maxManpower) * 100)}%`
                      : "0%",
                    background: "linear-gradient(90deg, var(--ok), var(--accent-hot))",
                  }}
                />
              </div>
            </div>
            {typeof city.ownedWilderness === "number" && (
              <p className="muted">
                Wilderness claims: {city.ownedWilderness} (boosts production)
              </p>
            )}

            <h3>Buildings</h3>
            <ul>
              {city.buildings.map((b) => (
                <li key={b.slotIndex}>
                  slot {b.slotIndex}: {b.buildingType} L{b.level}
                </li>
              ))}
            </ul>
            <p className="muted tiny">
              Build cost: {BUILD_COST.kelp} Food + {BUILD_COST.driftwood}{" "}
              Timber each
            </p>
            <div className="row">
              {(
                [
                  ["barracks", "Barracks"],
                  ["habitation", "Habitation"],
                  ["saltvault", "Saltvault"],
                  ["archive_spire", "Archive Spire"],
                ] as const
              ).map(([id, label]) => {
                const ok = canAfford(city.resources, BUILD_COST);
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={!ok}
                    title={ok ? undefined : "Insufficient resources"}
                    onClick={() => void doBuild(id)}
                  >
                    Build {label}
                  </button>
                );
              })}
            </div>

            <h3>Research</h3>
            <ul>
              {Object.entries(city.research).map(([k, v]) => (
                <li key={k}>
                  {k}: L{v}
                </li>
              ))}
              {Object.keys(city.research).length === 0 && (
                <li className="muted">None yet</li>
              )}
            </ul>
            <button type="button" onClick={() => void doResearch("longmark")}>
              Research Longmark
            </button>

            <h3>Stacks</h3>
            <ul className="grid">
              {Object.entries(city.stacks)
                .filter(([, n]) => n > 0)
                .map(([k, v]) => (
                  <li key={k}>
                    {k}: {v}
                  </li>
                ))}
            </ul>
            <div className="row">
              {(startUnits.length
                ? startUnits
                : [
                    { id: "levy", name: "Levy" },
                    { id: "reefbow", name: "Reefbow" },
                  ]
              ).map((u) => {
                const def = units.find((x) => x.id === u.id);
                const count = u.id === "levy" ? 20 : 10;
                const cost = def ? unitTrainCost(def, count) : {};
                const ok = !def || canAfford(city.resources, cost);
                return (
                  <button
                    key={u.id}
                    type="button"
                    disabled={!ok}
                    title={
                      def
                        ? `Cost: ${JSON.stringify(cost)}`
                        : undefined
                    }
                    onClick={() => void doTrain(u.id, count)}
                  >
                    Train {count} {u.name ?? u.id}
                  </button>
                );
              })}
            </div>

            <h3>Sovereigns</h3>
            <ul>
              {sovereigns.map((s) => (
                <li key={s.id}>
                  {s.sovereignType}{" "}
                  {s.harnessComplete
                    ? "(harness ready)"
                    : "(harness incomplete)"}
                </li>
              ))}
            </ul>
            <div className="row">
              <button type="button" onClick={() => void foundMarcherKeep()}>
                Found Marcher Keep
              </button>
              <button type="button" onClick={() => void foundBrine()}>
                Found Brinehold
              </button>
              <button type="button" onClick={() => void foundStone()}>
                Found Stonekeel (S1)
              </button>
            </div>
            <p className="muted tiny">
              Marcher Keep requires expedition charter earned from dragon expedition.
              S1 ladder: Brinehold → Stonekeel → Cinderreach → Galeari →
              Mnemolith. Stonekeel grants Rubbleback + Slabguard stacks.
            </p>

            <h3>Daily quests</h3>
            {dailyQuests.length === 0 ? (
              <p className="muted">No quests loaded yet</p>
            ) : (
              <ul className="quest-list">
                {dailyQuests.map((q) => (
                  <li key={q.id} className="plot-row">
                    <div>
                      {q.done ? "✓ " : "○ "}
                      {q.title}{" "}
                      <span className="muted">+{q.rewardChronite} Chronite</span>
                    </div>
                    {q.done && !q.claimed ? (
                      <button type="button" onClick={() => void claimQuest(q.id)}>
                        Claim
                      </button>
                    ) : q.claimed ? (
                      <span className="muted">Claimed</span>
                    ) : (
                      <span className="muted">In progress</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "lands" && city && (
          <section className="card">
            <h2>Lands</h2>
            <p className="muted">
              Assign empty plots ({PLOT_ASSIGN_COST.kelp} Food +{" "}
              {PLOT_ASSIGN_COST.driftwood} Timber). Upgrade scales 50×level
              of each resource. Max L5.
            </p>
            <label>
              New plot type
              <select
                value={plotPick}
                onChange={(e) => setPlotPick(e.target.value)}
              >
                <option value="kelp_farm">Kelp Farm</option>
                <option value="drift_dock">Drift Dock</option>
                <option value="basalt_cut">Basalt Cut</option>
                <option value="slag_pit">Slag Pit</option>
              </select>
            </label>
            <ul className="plot-list">
              {city.plots.map((p) => (
                <li key={p.slotIndex} className="plot-row">
                  <div>
                    <strong>Plot {p.slotIndex}</strong> — {plotLabel(p.plotType)}
                    {p.plotType ? ` L${p.level}` : ""}
                  </div>
                  {!p.plotType ? (
                    <button
                      type="button"
                      disabled={!canAfford(city.resources, PLOT_ASSIGN_COST)}
                      onClick={() => void assignPlot(p.slotIndex)}
                    >
                      Assign {plotLabel(plotPick)}
                    </button>
                  ) : p.level < 5 ? (
                    <button
                      type="button"
                      disabled={
                        !canAfford(city.resources, {
                          kelp: 50 * p.level,
                          driftwood: 50 * p.level,
                        })
                      }
                      onClick={() => void upgradePlot(p.slotIndex, p.level)}
                    >
                      Upgrade (L{p.level + 1})
                    </button>
                  ) : (
                    <span className="muted">Max</span>
                  )}
                </li>
              ))}
            </ul>
            {rates && (
              <p className="ok">
                Live rates: Food +{rates.kelp}/h · Timber +{rates.driftwood}
                /h · Stone +{rates.basalt}/h · Iron +{rates.slagiron}/h
              </p>
            )}
          </section>
        )}

        {tab === "realm" && (
          <section className="card">
            <h2>Realm</h2>
            <div className="row">
              <button
                type="button"
                onClick={() =>
                  void loadMap().catch((e) => setError(String(e.message ?? e)))
                }
              >
                Refresh viewport
              </button>
              <button
                type="button"
                onClick={() => {
                  const f = { x0: 0, y0: 0, x1: 19, y1: 19 };
                  setMapFocus(f);
                  void loadMap(f);
                }}
              >
                NW 20×20
              </button>
              <button
                type="button"
                onClick={() => {
                  const f = { x0: 20, y0: 0, x1: 39, y1: 19 };
                  setMapFocus(f);
                  void loadMap(f);
                }}
              >
                NE 20×20
              </button>
              <button
                type="button"
                onClick={() => {
                  const f = { x0: 0, y0: 20, x1: 19, y1: 39 };
                  setMapFocus(f);
                  void loadMap(f);
                }}
              >
                SW 20×20
              </button>
              <button
                type="button"
                onClick={() => {
                  const f = { x0: 20, y0: 20, x1: 39, y1: 39 };
                  setMapFocus(f);
                  void loadMap(f);
                }}
              >
                SE 20×20
              </button>
              {city && (
                <button
                  type="button"
                  onClick={() => {
                    const cx = city.mapX;
                    const cy = city.mapY;
                    const f = {
                      x0: Math.max(0, cx - 10),
                      y0: Math.max(0, cy - 10),
                      x1: Math.min(39, cx + 9),
                      y1: Math.min(39, cy + 9),
                    };
                    setMapFocus(f);
                    void loadMap(f);
                  }}
                >
                  Center on city
                </button>
              )}
            </div>

            <h3>March composition (from stacks — no free units)</h3>
            <div className="comp-grid">
              {stackUnits.map((uid) => (
                <label key={uid} className="comp-item">
                  {uid}
                  <span className="muted tiny">
                    have {city?.stacks[uid] ?? 0}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={city?.stacks[uid] ?? 0}
                    value={comp[uid] ?? 0}
                    onChange={(e) =>
                      setComp((c) => ({
                        ...c,
                        [uid]: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                  />
                </label>
              ))}
            </div>

            {mapData ? (
              <div
                className="map-grid"
                style={{
                  gridTemplateColumns: `repeat(${mapW}, 1fr)`,
                }}
                role="grid"
                aria-label="Realm map"
              >
                {Array.from({ length: mapH }, (_, row) => {
                  const y = mapFocus.y0 + row;
                  return Array.from({ length: mapW }, (_, col) => {
                    const x = mapFocus.x0 + col;
                    const t = tileAt(x, y);
                    let cls = "tile empty";
                    let title = `${x},${y}`;
                    if (t?.kind === "camp") {
                      cls = "tile camp";
                      title = `Camp L${t.camp.level} @ ${x},${y}`;
                    } else if (t?.kind === "wild") {
                      cls = t.wild.ownerPlayerId
                        ? "tile wild claimed"
                        : "tile wild";
                      title = `${t.wild.resourceType} L${t.wild.level}${
                        t.wild.ownerPlayerId ? " claimed" : ""
                      } @ ${x},${y}`;
                    } else if (t?.kind === "city") {
                      const mine = t.city.playerId === player.id;
                      cls = mine ? "tile city mine" : "tile city foe";
                      title = `${t.city.name} (${t.city.kind}) @ ${x},${y}`;
                    }
                    if (
                      selectedTile?.x === x &&
                      selectedTile?.y === y
                    ) {
                      cls += " selected";
                    }
                    return (
                      <button
                        key={`${x}-${y}`}
                        type="button"
                        className={cls}
                        title={title}
                        onClick={() => {
                          setSelectedTile({ x, y });
                          setPvpX(x);
                          setPvpY(y);
                        }}
                      />
                    );
                  });
                })}
              </div>
            ) : (
              <p className="muted">Refresh viewport to load tiles</p>
            )}

            <div className="map-legend">
              <span>
                <i className="swatch camp" /> Camp
              </span>
              <span>
                <i className="swatch wild" /> Wilderness
              </span>
              <span>
                <i className="swatch claimed" /> Claimed
              </span>
              <span>
                <i className="swatch mine" /> Your city
              </span>
              <span>
                <i className="swatch foe" /> Other city
              </span>
            </div>

            {selectedTile && (
              <div className="tile-detail card-inset">
                <h3>
                  Selected {selectedTile.x},{selectedTile.y}
                </h3>
                {!selectedInfo && (
                  <p className="muted">Empty water / open tile</p>
                )}
                {selectedInfo?.kind === "camp" && (
                  <p>
                    <strong>Riftborn camp L{selectedInfo.camp.level}</strong>
                    <br />
                    <span className="muted">
                      Attack runs server combat and stores a War report.
                    </span>
                  </p>
                )}
                {selectedInfo?.kind === "wild" && (
                  <p>
                    <strong>
                      {selectedInfo.wild.resourceType} wilderness L
                      {selectedInfo.wild.level}
                    </strong>
                    <br />
                    <span className="muted">
                      {selectedInfo.wild.ownerPlayerId
                        ? "Already claimed — occupy will fight owner garrison"
                        : "Unclaimed — occupy to claim production bonus"}
                    </span>
                  </p>
                )}
                {selectedInfo?.kind === "city" && (
                  <p>
                    <strong>
                      {selectedInfo.city.name} ({selectedInfo.city.kind})
                    </strong>
                    <br />
                    <span className="muted">
                      {selectedInfo.city.playerId === player.id
                        ? "Your city — use reinforce/haul from PvP form if needed"
                        : "Enemy/other city — use Attack or Scout below"}
                    </span>
                  </p>
                )}
                <div className="row">
                  <button
                    type="button"
                    disabled={selectedInfo?.kind !== "camp"}
                    onClick={() => void attackSelectedCamp()}
                  >
                    Attack camp
                  </button>
                  <button
                    type="button"
                    disabled={
                      selectedInfo?.kind !== "wild" ||
                      !!selectedInfo?.wild.ownerPlayerId
                    }
                    onClick={() => void occupySelectedWild()}
                  >
                    Occupy wild
                  </button>
                  <button
                    type="button"
                    disabled={
                      selectedInfo?.kind !== "city" ||
                      selectedInfo.city.playerId === player.id
                    }
                    onClick={() => {
                      setPvpX(selectedTile.x);
                      setPvpY(selectedTile.y);
                      setPvpIntent("attack");
                      void attackPvp();
                    }}
                  >
                    Attack city
                  </button>
                  <button
                    type="button"
                    disabled={selectedInfo?.kind !== "city"}
                    onClick={() => {
                      setPvpX(selectedTile.x);
                      setPvpY(selectedTile.y);
                      setPvpIntent("scout");
                      void attackPvp();
                    }}
                  >
                    Scout tile
                  </button>
                </div>
                <p className="muted tiny">
                  Composition must use units you own — over-selecting is blocked
                  client-side and server-side (NO_TROOPS).
                </p>
              </div>
            )}

            <h3>PvP / coords march</h3>
            <p className="muted">
              Target another city (or coords). Withdraw posture = free loot if
              they have no wall troops; Full fights stacks. New-player
              protection blocks until it expires or they attack first.
            </p>
            <div className="row form-inline">
              <label>
                X
                <input
                  type="number"
                  value={pvpX}
                  onChange={(e) => setPvpX(Number(e.target.value))}
                />
              </label>
              <label>
                Y
                <input
                  type="number"
                  value={pvpY}
                  onChange={(e) => setPvpY(Number(e.target.value))}
                />
              </label>
              <label>
                Intent
                <select
                  value={pvpIntent}
                  onChange={(e) =>
                    setPvpIntent(
                      e.target.value as "attack" | "scout" | "reinforce",
                    )
                  }
                >
                  <option value="attack">Attack</option>
                  <option value="scout">Scout</option>
                  <option value="reinforce">Reinforce (ally city)</option>
                </select>
              </label>
              <button type="button" onClick={() => void attackPvp()}>
                Send march
              </button>
            </div>
          </section>
        )}

        {tab === "war" && (
          <section className="card">
            <h2>War / Reports</h2>
            <p className="muted">
              Server-authored only. Withdraw = free loot (no stack fight). Full =
              stacks fight via resolveBattle.
            </p>
            <button
              type="button"
              onClick={() => {
                setUnreadReports(0);
                void loadReports().catch((e) =>
                  setError(String(e.message ?? e)),
                );
              }}
            >
              Refresh reports
            </button>
            {reports.length === 0 ? (
              <p className="muted">No reports yet — attack a camp or player</p>
            ) : (
              <ul className="report-cards">
                {reports.slice(0, 12).map((r) => {
                  const b = r.result?.battle;
                  const winner =
                    b?.winner ??
                    (r.result?.type === "pvp_blocked" ? "blocked" : "—");
                  const youAtk = r.attackerPlayerId === player.id;
                  const defenseMode = postureLabel(
                    undefined,
                    r.result?.harborLoot,
                  );
                  return (
                    <li key={r.id} className="report-card">
                      <div className="ops-head">
                        <strong>
                          {reportHeadline(r, player.id)} ·{" "}
                          {fmtTime(r.createdAt)}
                        </strong>
                        <span
                          className={
                            winner === "attacker" && youAtk
                              ? "ok"
                              : winner === "defender" && youAtk
                                ? "err"
                                : "muted"
                          }
                        >
                          {winner === "blocked"
                            ? "blocked"
                            : winner === "—"
                              ? r.result?.type ?? ""
                              : `winner: ${winner}`}
                        </span>
                      </div>
                      {r.result?.target && (
                        <p className="muted tiny">
                          Target {r.result.target.type} @ {r.result.target.x},
                          {r.result.target.y}
                          {r.result.type === "pvp"
                            ? ` · ${defenseMode}`
                            : r.result.harborLoot
                              ? " · harbor loot"
                              : ""}
                          {youAtk ? " · you attacked" : " · you defended"}
                        </p>
                      )}
                      {r.result?.reason && (
                        <p className="err">Reason: {r.result.reason}</p>
                      )}
                      {r.result?.intel && (
                        <p className="intel">
                          <strong>Intel:</strong> {formatIntel(r.result.intel)}
                        </p>
                      )}
                      {b && (
                        <>
                          <p>
                            Rounds: {b.rounds ?? "—"}
                            {b.note ? ` · ${b.note}` : ""}
                            {r.result?.harborLoot
                              ? " · no combat (harbor)"
                              : " · combat resolved"}
                          </p>
                          <p>
                            <strong>Your losses:</strong>{" "}
                            {lossList(
                              youAtk ? b.losses?.attacker : b.losses?.defender,
                            )}
                          </p>
                          <p>
                            <strong>Enemy losses:</strong>{" "}
                            {lossList(
                              youAtk ? b.losses?.defender : b.losses?.attacker,
                            )}
                          </p>
                        </>
                      )}
                      <p>
                        <strong>Loot:</strong> {lootList(r.result?.loot)}
                      </p>
                      <details>
                        <summary className="muted">Raw JSON</summary>
                        <pre className="report">
                          {JSON.stringify(r, null, 2)}
                        </pre>
                      </details>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {tab === "alliance" && (
          <section className="card">
            <h2>Tideband (Alliance)</h2>
            {alliance ? (
              <>
                <p>
                  {alliance.name} [{alliance.tag}]
                </p>
                <p className="muted tiny">
                  Share tag <code>{alliance.tag}</code> so others can join.
                </p>
                <div className="row form-inline">
                  <input
                    value={chatBody}
                    onChange={(e) => setChatBody(e.target.value)}
                    placeholder="Alliance chat"
                  />
                  <button type="button" onClick={() => void sendChat()}>
                    Send
                  </button>
                </div>
                <ul>
                  {chat.map((m, i) => (
                    <li key={i}>
                      <span className="muted tiny">
                        {m.fromPlayerId.slice(0, 8)}
                        {m.createdAt ? ` · ${fmtTime(m.createdAt)}` : ""}
                      </span>
                      : {m.body}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h3>Create</h3>
                <div className="row form-inline">
                  <input
                    value={allyName}
                    onChange={(e) => setAllyName(e.target.value)}
                    placeholder="Name"
                  />
                  <input
                    value={allyTag}
                    onChange={(e) => setAllyTag(e.target.value)}
                    placeholder="Tag"
                  />
                  <button type="button" onClick={() => void createAlly()}>
                    Create Tideband
                  </button>
                </div>
                <h3>Join by tag</h3>
                <div className="row form-inline">
                  <input
                    value={joinTag}
                    onChange={(e) => setJoinTag(e.target.value)}
                    placeholder="e.g. TIDE"
                  />
                  <button
                    type="button"
                    onClick={() => void joinAlly({ tag: joinTag })}
                  >
                    Join tag
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void loadAlliances().catch((e) =>
                        setError(String(e.message ?? e)),
                      )
                    }
                  >
                    Refresh list
                  </button>
                </div>
                {allianceList.length > 0 && (
                  <ul className="plot-list">
                    {allianceList.map((a) => (
                      <li key={a.id} className="plot-row">
                        <div>
                          {a.name} [{a.tag}] · {a.memberCount} members
                        </div>
                        <button
                          type="button"
                          onClick={() => void joinAlly({ allianceId: a.id })}
                        >
                          Join
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        )}

        {tab === "knowledge" && (
          <section className="card">
            <h2>Knowledge</h2>

            <h3>Dragon Readiness</h3>
            {readinessStatus ? (
              <div>
                <div className="readiness-bar">
                  <span>
                    {readinessStatus.requirements.filter((r: any) => r.met).length}/
                    {readinessStatus.requirements.length} requirements met
                  </span>
                </div>
                {readinessStatus.requirements.map((req: any) => (
                  <div
                    key={req.id}
                    className={`readiness-req ${req.met ? "met" : "unmet"}`}
                  >
                    <span>{req.met ? "✓" : "○"}</span>
                    <span>{req.description}</span>
                  </div>
                ))}
                {readinessStatus.ready && (
                  <div className="readiness-ready">
                    Expedition charter available!
                  </div>
                )}
              </div>
            ) : (
              <p className="muted">Loading readiness status...</p>
            )}

            <h3>Bestiary</h3>
            {bestiaryEntries.length > 0 ? (
              <div className="bestiary-grid">
                {bestiaryEntries.map((entry: any, i: number) => (
                  <div
                    key={entry.entryId ?? i}
                    className="bestiary-entry"
                  >
                    <div className="bestiary-subject">
                      {(entry.entryId ?? "unknown").replace(/_/g, " ")}
                    </div>
                    <div className="bestiary-level">
                      Observation Level: {entry.observationLevel}/5
                    </div>
                    <div className="bestiary-encounters">
                      Encounters: {entry.encounterCount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">
                No bestiary entries yet. Defeat camps and explore to discover
                creatures.
              </p>
            )}

            <h3>Dragon Expedition</h3>
            {expeditionStatus ? (
              <div>
                <div className="expedition-name">{expeditionStatus.name}</div>
                {expeditionStatus.charterEarned ? (
                  <div className="expedition-complete">
                    Charter earned! You may found a settlement.
                  </div>
                ) : expeditionStatus.currentStage > 0 ? (
                  <div>
                    <div className="expedition-stage">
                      Stage {expeditionStatus.currentStage}/
                      {expeditionStatus.stages.length}
                    </div>
                    {expeditionStatus.stages.map((stage: any) => (
                      <div
                        key={stage.stage}
                        className={`expedition-stage-item ${
                          stage.stage <= expeditionStatus.currentStage
                            ? "completed"
                            : stage.stage === expeditionStatus.currentStage + 1
                              ? "current"
                              : "locked"
                        }`}
                      >
                        <span>
                          {stage.stage <= expeditionStatus.currentStage
                            ? "✓"
                            : stage.stage ===
                                expeditionStatus.currentStage + 1
                              ? "→"
                              : "○"}
                        </span>
                        <span>{stage.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted">
                    Expedition not started. Meet all readiness requirements to
                    begin.
                  </p>
                )}
              </div>
            ) : (
              <p className="muted">Loading expedition status...</p>
            )}

            <h3>Dragon Evidence</h3>
            {clueData && clueData.clues.length > 0 ? (
              <div>
                {clueData.clues.map((clue: any) => (
                  <div
                    key={clue.id}
                    className={`clue-item clue-${clue.rarity}`}
                  >
                    <span className="clue-name">{clue.name}</span>
                    <span className="clue-count">×{clue.count}</span>
                    <span className="clue-desc">{clue.description}</span>
                  </div>
                ))}
                {clueData.dragonMaterials > 0 && (
                  <div className="dragon-materials">
                    Dragon Materials: {clueData.dragonMaterials}
                  </div>
                )}
              </div>
            ) : (
              <p className="muted">
                No dragon evidence collected yet. Explore and fight to discover
                clues.
              </p>
            )}

            <details style={{ marginTop: "1rem" }}>
              <summary className="muted">Raw formulas (debug)</summary>
              <button
                type="button"
                onClick={() => void loadCodex()}
                style={{ margin: "0.5rem 0" }}
              >
                Reload formulas
              </button>
              <pre className="report">
                {JSON.stringify(formulas, null, 2)}
              </pre>
            </details>
          </section>
        )}

        {tab === "settings" && city && (
          <section className="card">
            <h2>Settings</h2>
            <p className="faction-blurb">{factionMeta.blurb}</p>
            <p>
              Protection:{" "}
              {player.protectionUntil
                ? `until ${player.protectionUntil}`
                : "none"}
            </p>
            <p>Defense posture: {city.defensePosture}</p>
            <div className="row">
              <button type="button" onClick={() => void setPosture("withdraw")}>
                Withdraw
              </button>
              <button type="button" onClick={() => void setPosture("garrison")}>
                Garrison
              </button>
              <button type="button" onClick={() => void setPosture("full")}>
                Full
              </button>
            </div>

            <h3>Dev tools</h3>
            <p className="muted">
              Explicit grants only — Map attacks no longer inject free troops.
              DEV_FAST_TIME accelerates queues/marches when enabled on the
              server.
            </p>
            <div className="row">
              <button
                type="button"
                onClick={() =>
                  void grantDev(
                    { units: { levy: 100, reefbow: 50 } },
                    "Granted demo troops",
                  )
                }
              >
                Grant demo troops
              </button>
              <button
                type="button"
                onClick={() =>
                  void grantDev(
                    { harness: true, brineholdUnlock: true, chronite: 50 },
                    "Harness granted",
                  )
                }
              >
                Grant harness + chronite
              </button>
              <button
                type="button"
                onClick={() =>
                  void grantDev(
                    {
                      resources: {
                        kelp: 2000,
                        driftwood: 2000,
                        basalt: 1000,
                        slagiron: 500,
                        tidegilt: 500,
                      },
                    },
                    "Granted resources",
                  )
                }
              >
                Grant resources
              </button>
              <button
                type="button"
                onClick={() =>
                  void grantDev({ skipProtection: true }, "Protection cleared")
                }
              >
                Skip protection
              </button>
            </div>

            <button type="button" className="danger" onClick={logout}>
              Log out
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
