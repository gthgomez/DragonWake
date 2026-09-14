import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { api } from "../lib/api";
import { FACTION_META, type Toast } from "../lib/gameConfig";
import type {
  AllianceInfo,
  AllianceSummary,
  BattleReport,
  BestiaryEntryDef,
  BuildingDef,
  ChatMessage,
  City,
  Commander,
  DailyQuest,
  MapData,
  MapFocus,
  March,
  Player,
  QueueJob,
  ResearchDef,
  ResearchUnlock,
  ShopItem,
  TutorialState,
  UnitDef,
  WorldEventDto,
} from "../lib/types";
import { registerLabels, translateError } from "../lib/labels";
import { useGameActions } from "./useGameActions";

/**
 * Small external store for the selected city's food ledger.
 *
 * The persistent HUD (Shell) needs upkeep/net-food numbers on every tab, but
 * Shell is a presentational component and, in the shared chrome, has no access
 * to the `useGame()` instance App owns. Rather than duplicate polling, useGame
 * publishes the numbers here and Shell subscribes via useFoodStatus(). Only
 * changed values notify, so a Shell tab does not re-render on every 2s poll.
 */
export type FoodStatus = {
  cityName: string;
  /** Food produced per hour before upkeep. */
  foodPerHour: number;
  /** Troop food eaten per hour. */
  upkeepPerHour: number;
  /** foodPerHour - upkeepPerHour (may be negative). */
  netPerHour: number;
  /** Server-flagged famine: growth paused, mustering blocked. */
  starving: boolean;
};

let foodStatusSnapshot: FoodStatus | null = null;
const foodStatusListeners = new Set<() => void>();

function sameFoodStatus(a: FoodStatus | null, b: FoodStatus | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.cityName === b.cityName &&
    a.foodPerHour === b.foodPerHour &&
    a.upkeepPerHour === b.upkeepPerHour &&
    a.netPerHour === b.netPerHour &&
    a.starving === b.starving
  );
}

function publishFoodStatus(next: FoodStatus | null) {
  if (sameFoodStatus(foodStatusSnapshot, next)) return;
  foodStatusSnapshot = next;
  for (const listener of foodStatusListeners) listener();
}

function subscribeFoodStatus(listener: () => void) {
  foodStatusListeners.add(listener);
  return () => {
    foodStatusListeners.delete(listener);
  };
}

function getFoodStatusSnapshot() {
  return foodStatusSnapshot;
}

/** Subscribe to the selected city's food ledger (null before a city loads). */
export function useFoodStatus(): FoodStatus | null {
  return useSyncExternalStore(
    subscribeFoodStatus,
    getFoodStatusSnapshot,
    getFoodStatusSnapshot,
  );
}

/** Newest notices kept on screen at once (F3: was 5). */
const TOAST_MAX_VISIBLE = 3;
/** How long a notice stays before it clears (F3: was 6_000). */
const TOAST_TTL_MS = 4_000;
/** Repeat of the newest message inside this window refreshes, not stacks. */
const TOAST_DEDUPE_MS = 3_000;

export function useGame() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("dragonwake_token"),
  );
  const [player, setPlayer] = useState<Player | null>(null);
  /** Server-advertised dev mode — hides grant tooling in real deployments. */
  const [devMode, setDevMode] = useState(false);
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
  const [alliance, setAlliance] = useState<AllianceInfo | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [sharedIntel, setSharedIntel] = useState<WorldEventDto[]>([]);
  const [formulas, setFormulas] = useState<unknown>(null);
  const [researchDefs, setResearchDefs] = useState<ResearchDef[]>([]);
  const [readinessStatus, setReadinessStatus] = useState<any>(null);
  const [bestiaryEntries, setBestiaryEntries] = useState<any[]>([]);
  const [expeditionStatus, setExpeditionStatus] = useState<any>(null);
  const [clueData, setClueData] = useState<any>(null);
  const [dragonObjectives, setDragonObjectives] = useState<Array<{ id: string; title: string; description: string; complete: boolean }>>([]);
  const [livingDragons, setLivingDragons] = useState<any>(null);
  const [units, setUnits] = useState<UnitDef[]>([]);
  const [buildingDefs, setBuildingDefs] = useState<BuildingDef[]>([]);
  const [unlockDefs, setUnlockDefs] = useState<ResearchUnlock[]>([]);
  const [bestiaryDefs, setBestiaryDefs] = useState<BestiaryEntryDef[]>([]);
  const [displayName, setDisplayName] = useState("Guest");
  const [faction, setFaction] = useState("northern_kingdom");
  const [chatBody, setChatBody] = useState("");
  const [allyName, setAllyName] = useState("Alliance");
  const [allyTag, setAllyTag] = useState("TIDE");
  const [comp, setComp] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());
  const [mapFocus, setMapFocus] = useState<MapFocus>({
    x0: 0,
    y0: 0,
    x1: 19,
    y1: 19,
  });
  const [tutorial, setTutorial] = useState<TutorialState | null>(null);
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  const [shopCatalog, setShopCatalog] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [allianceList, setAllianceList] = useState<AllianceSummary[]>([]);
  const [joinTag, setJoinTag] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [eventSince, setEventSince] = useState(0);
  const [unreadReports, setUnreadReports] = useState(0);
  const [lastResult, setLastResult] = useState<{
    message: string;
    reportId: string | null;
    type: string | null;
    winner: string | null;
    at: number;
  } | null>(null);
  const [commanders, setCommanders] = useState<Commander[]>([]);
  const [commandersReady, setCommandersReady] = useState(false);
  const [marchLeaderId, setMarchLeaderId] = useState("");

  const city = useMemo(
    () => cities.find((c) => c.id === cityId) ?? cities[0] ?? null,
    [cities, cityId],
  );

  const factionMeta =
    FACTION_META[player?.faction ?? faction] ?? FACTION_META.northern_kingdom!;

  // Keep the cross-tab HUD ledger in sync with the selected city.
  useEffect(() => {
    if (!city) {
      publishFoodStatus(null);
      return;
    }
    const foodPerHour = city.productionPerHour?.food ?? 0;
    const upkeepPerHour = city.foodUpkeepPerHour ?? 0;
    publishFoodStatus({
      cityName: city.name,
      foodPerHour,
      upkeepPerHour,
      netPerHour: foodPerHour - upkeepPerHour,
      starving: Boolean(city.starving),
    });
  }, [city]);

  const refreshMe = useCallback(async (tok: string) => {
    const me = await api<{
      player: Player;
      cities: City[];
      alliance: AllianceInfo | null;
      serverNow?: number;
      tutorial?: TutorialState;
      dailyQuests?: DailyQuest[];
      devMode?: boolean;
    }>("/api/v1/me", tok);
    setPlayer(me.player);
    setDevMode(Boolean(me.devMode));
    setCities(me.cities);
    setCityId((id) => id ?? me.cities[0]?.id ?? null);
    setAlliance(me.alliance);
    if (me.tutorial) setTutorial(me.tutorial);
    if (me.dailyQuests) setDailyQuests(me.dailyQuests);
    if (me.serverNow) setNow(me.serverNow);
  }, []);

  const refreshShop = useCallback(async (tok: string) => {
    try {
      const data = await api<{ catalog: ShopItem[] }>(
        "/api/v1/shop/catalog",
        tok,
      );
      setShopCatalog(data.catalog ?? []);
    } catch {
      /* the shop is optional at boot */
    }
  }, []);

  const refreshInventory = useCallback(async (tok: string) => {
    try {
      const data = await api<{ items: Record<string, number> }>(
        "/api/v1/inventory",
        tok,
      );
      setInventory(data.items ?? {});
    } catch {
      /* inventory is optional at boot */
    }
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
          m.status === "resolving" ||
          m.status === "stationed",
      ),
    );
  }, []);

  const loadUnits = useCallback(async () => {
    try {
      const [unitsData, researchData, buildingsData, unlockData, bestiaryData] =
        await Promise.all([
          api<{ units: UnitDef[] }>("/api/v1/content/units", null),
          api<{ research: ResearchDef[] }>("/api/v1/content/research", null),
          api<{ buildings: BuildingDef[] }>("/api/v1/content/buildings", null),
          api<{ unlocks: ResearchUnlock[] }>(
            "/api/v1/content/research-unlocks",
            null,
          ),
          api<{ entries: BestiaryEntryDef[] }>(
            "/api/v1/content/bestiary",
            null,
          ),
        ]);
      setUnits(unitsData.units);
      setResearchDefs(researchData.research);
      setBuildingDefs(buildingsData.buildings);
      setUnlockDefs(unlockData.unlocks);
      setBestiaryDefs(bestiaryData.entries);
      registerLabels(unitsData.units, buildingsData.buildings, researchData.research);
    } catch {
      /* optional at boot */
    }
  }, []);

  const pushToast = useCallback(
    (message: string, kind: Toast["kind"] = "info") => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((t) => {
        const last = t[t.length - 1];
        if (last && last.message === message && id - last.id < TOAST_DEDUPE_MS) {
          // Refresh the existing slip's TTL instead of stacking a clone.
          return [...t.slice(0, -1), { ...last, id, kind }];
        }
        return [...t.slice(-(TOAST_MAX_VISIBLE - 1)), { id, message, kind }];
      });
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, TOAST_TTL_MS);
    },
    [],
  );

  const buyShopItem = useCallback(
    async (itemId: string) => {
      if (!token) return;
      const name =
        shopCatalog.find((i) => i.id === itemId)?.name ?? "Steward's wares";
      setError(null);
      try {
        await api<{ itemId: string; dracolith: number }>(
          "/api/v1/shop/buy",
          token,
          { method: "POST", body: JSON.stringify({ itemId }) },
        );
        await refreshMe(token);
        await refreshInventory(token);
        setStatus(`Bought ${name}`);
        pushToast(`Bought ${name}`, "ok");
      } catch (e) {
        const msg = translateError(e);
        setError(msg);
        pushToast(msg, "err");
      }
    },
    [token, shopCatalog, refreshMe, refreshInventory, pushToast],
  );

  const useShopItem = useCallback(
    async (itemId: string) => {
      if (!token) return;
      const name =
        shopCatalog.find((i) => i.id === itemId)?.name ?? "Steward's wares";
      setError(null);
      try {
        await api<{
          itemId: string;
          effect: { type: string; seconds: number };
          applied: { finishesAt?: number; protectionUntil?: number };
        }>("/api/v1/shop/use", token, {
          method: "POST",
          body: JSON.stringify({ itemId }),
        });
        await refreshMe(token);
        await refreshInventory(token);
        setStatus(`${name} applied`);
        pushToast(`${name} applied`, "ok");
      } catch (e) {
        const msg = translateError(e);
        setError(msg);
        pushToast(msg, "err");
      }
    },
    [token, shopCatalog, refreshMe, refreshInventory, pushToast],
  );

  async function loadMap(focus = mapFocus) {
    if (!token) return;
    const data = await api<MapData>(
      `/api/v1/map/viewport?x0=${focus.x0}&y0=${focus.y0}&x1=${focus.x1}&y1=${focus.y1}`,
      token,
    );
    setMapData(data);
  }

  async function loadReports() {
    if (!token) return;
    const rep = await api<{ reports: BattleReport[] }>(
      "/api/v1/reports",
      token,
    );
    setReports(rep.reports);
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
      const [readyResp, bestResp, expResp, clueResp, objectiveResp, livingResp] = await Promise.all([
        api<any>("/api/v1/dragon/readiness", token),
        api<any>("/api/v1/dragon/bestiary", token),
        api<any>("/api/v1/dragon/expedition", token),
        api<any>("/api/v1/dragon/clues", token),
        api<any>("/api/v1/dragon/objectives", token),
        api<any>("/api/v1/dragon/living", token),
      ]);
      setReadinessStatus(readyResp);
      setBestiaryEntries(bestResp.entries ?? []);
      setExpeditionStatus(expResp);
      setClueData(clueResp);
      setDragonObjectives(objectiveResp.objectives ?? []);
      setLivingDragons(livingResp);
    } catch {
      // silently fail — knowledge is non-critical
    }
  }

  async function loadAlliances() {
    if (!token) return;
    const data = await api<{ alliances: AllianceSummary[] }>(
      "/api/v1/alliances",
      token,
    );
    setAllianceList(data.alliances);
    if (alliance) {
      const detail = await api<{
        alliance: AllianceInfo;
        members: Array<{ playerId: string; rank: "leader" | "officer" | "member"; displayName?: string }>;
      }>(`/api/v1/alliances/${alliance.id}`, token);
      setAlliance({ ...detail.alliance, members: detail.members });
    }
  }

  useEffect(() => {
    void loadUnits();
  }, [loadUnits]);

  const loadCommanders = useCallback(async (tok: string) => {
    try {
      const data = await api<{ commanders: Commander[] }>(
        "/api/v1/commanders",
        tok,
      );
      setCommanders(data.commanders ?? []);
      setCommandersReady(true);
    } catch {
      // feature hidden entirely when the roster cannot be fetched
      setCommandersReady(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    void loadCommanders(token);
  }, [token, loadCommanders]);

  // Steward's Wares: catalog + owned items load once the player is signed in.
  useEffect(() => {
    if (!token) return;
    void refreshShop(token);
    void refreshInventory(token);
  }, [token, refreshShop, refreshInventory]);

  useEffect(() => {
    if (!token) return;
    let busy = false;
    let failures = 0;
    let timer = 0;
    let disposed = false;

    const step = () => {
      if (disposed) return;
      // Pause entirely on hidden tabs; never overlap an in-flight cycle.
      if (!document.hidden && !busy) {
        busy = true;
        setNow(Date.now());
        void refreshMe(token)
          .then(() =>
            Promise.all([
              refreshQueues(token, cityId),
              refreshMarches(token),
            ]),
          )
          .then(() => {
            failures = 0;
          })
          .catch((e) => {
            failures += 1;
            setError(String(e.message ?? e));
          })
          .finally(() => {
            busy = false;
          });
      }
      // Back off when the API is unhappy instead of hammering every 2s.
      const delay = document.hidden ? 4000 : failures >= 3 ? 10_000 : 2000;
      timer = window.setTimeout(step, delay);
    };
    step();
    const onVisibility = () => {
      if (!document.hidden) {
        window.clearTimeout(timer);
        step();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [token, cityId, refreshMe, refreshQueues, refreshMarches]);

  // P0.2: poll sim events for toasts without relying on full-page refresh
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let since = eventSince;
    let timer = 0;
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
          if (e.data?.kind === "shared_scout_intel") {
            setSharedIntel((items) => [...items.slice(-7), e]);
          }
          if (e.type === "report" || e.type === "march_land") {
            setUnreadReports((n) => n + 1);
            void loadReports().catch(() => undefined);
            void refreshMarches(token).catch(() => undefined);
          }
          if (e.type === "report") {
            setLastResult({
              message: e.message,
              reportId: (e.data?.reportId as string) ?? null,
              type: (e.data?.type as string) ?? null,
              winner: (e.data?.winner as string | null) ?? null,
              at: e.at ?? Date.now(),
            });
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
    const loop = () => {
      if (cancelled) return;
      // Hidden tabs don't need toast traffic either.
      if (!document.hidden) void poll();
      timer = window.setTimeout(loop, document.hidden ? 4000 : 2000);
    };
    loop();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eventSince intentionally not in deps — we keep local since cursor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, cityId, refreshMe, refreshQueues, refreshMarches]);

  const actions = useGameActions({
    token,
    city,
    loadMap,
    setError,
    setStatus,
    pushToast,
    refreshMe,
    refreshQueues,
    refreshMarches,
    refreshKnowledge,
    displayName,
    faction,
    setToken,
    setPlayer,
    setCities,
    setCityId,
    units,
    researchDefs,
    comp,
    marchLeaderId,
    allyName,
    allyTag,
    alliance,
    chatBody,
    setAlliance,
    setChat,
    setChatBody,
    setTutorial,
    setJobs,
    setMarches,
    setCommanders,
    setCommandersReady,
    setMarchLeaderId,
  });

  return {
    // session
    token,
    player,
    devMode,

    // world state slices
    cities,
    cityId,
    setCityId,
    jobs,
    marches,
    mapData,
    mapFocus,
    setMapFocus,
    selectedTile,
    setSelectedTile,
    reports,
    alliance,
    sharedIntel,
    chat,
    formulas,
    researchDefs,
    readinessStatus,
    bestiaryEntries,
    expeditionStatus,
    clueData,
    dragonObjectives,
    livingDragons,
    units,
    buildingDefs,
    unlockDefs,
    bestiaryDefs,
    tutorial,
    dailyQuests,
    shopCatalog,
    inventory,
    allianceList,
    commanders,
    commandersReady,

    // ui state
    error,
    setError,
    status,
    toasts,
    now,
    unreadReports,
    setUnreadReports,
    lastResult,

    // form state + setters
    displayName,
    setDisplayName,
    faction,
    setFaction,
    chatBody,
    setChatBody,
    allyName,
    setAllyName,
    allyTag,
    setAllyTag,
    joinTag,
    setJoinTag,
    comp,
    setComp,
    marchLeaderId,
    setMarchLeaderId,

    // derived
    city,
    factionMeta,

    // loaders
    loadMap,
    loadReports,
    loadCodex,
    refreshKnowledge,
    loadAlliances,
    buyShopItem,
    useShopItem,

    // actions
    ...actions,
  };
}

export type Game = ReturnType<typeof useGame>;
