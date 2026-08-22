import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "../lib/api";
import { FACTION_META, type Toast } from "../lib/gameConfig";
import type {
  AllianceInfo,
  AllianceSummary,
  BattleReport,
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
  Sovereign,
  TutorialState,
  UnitDef,
  WorldEventDto,
} from "../lib/types";
import { useGameActions } from "./useGameActions";

export function useGame() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("tideforge_token"),
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
  const [formulas, setFormulas] = useState<unknown>(null);
  const [researchDefs, setResearchDefs] = useState<ResearchDef[]>([]);
  const [readinessStatus, setReadinessStatus] = useState<any>(null);
  const [bestiaryEntries, setBestiaryEntries] = useState<any[]>([]);
  const [expeditionStatus, setExpeditionStatus] = useState<any>(null);
  const [clueData, setClueData] = useState<any>(null);
  const [units, setUnits] = useState<UnitDef[]>([]);
  const [sovereigns, setSovereigns] = useState<Sovereign[]>([]);
  const [displayName, setDisplayName] = useState("Guest");
  const [faction, setFaction] = useState("northern_kingdom");
  const [chatBody, setChatBody] = useState("");
  const [allyName, setAllyName] = useState("Alliance");
  const [allyTag, setAllyTag] = useState("TIDE");
  const [comp, setComp] = useState<Record<string, number>>({
    levy: 20,
    bowman: 10,
  });
  const [pvpX, setPvpX] = useState(0);
  const [pvpY, setPvpY] = useState(0);
  const [pvpIntent, setPvpIntent] = useState<"attack" | "scout" | "reinforce">(
    "attack",
  );
  const [plotPick, setPlotPick] = useState("farm");
  const [now, setNow] = useState(() => Date.now());
  const [mapFocus, setMapFocus] = useState<MapFocus>({
    x0: 0,
    y0: 0,
    x1: 19,
    y1: 19,
  });
  const [tutorial, setTutorial] = useState<TutorialState | null>(null);
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  const [allianceList, setAllianceList] = useState<AllianceSummary[]>([]);
  const [joinTag, setJoinTag] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [eventSince, setEventSince] = useState(0);
  const [unreadReports, setUnreadReports] = useState(0);
  const [commanders, setCommanders] = useState<Commander[]>([]);
  const [commandersReady, setCommandersReady] = useState(false);
  const [marchLeaderId, setMarchLeaderId] = useState("");

  const city = useMemo(
    () => cities.find((c) => c.id === cityId) ?? cities[0] ?? null,
    [cities, cityId],
  );

  const factionMeta =
    FACTION_META[player?.faction ?? faction] ?? FACTION_META.northern_kingdom!;

  const refreshMe = useCallback(async (tok: string) => {
    const me = await api<{
      player: Player;
      cities: City[];
      alliance: AllianceInfo | null;
      sovereigns: Sovereign[];
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
      const [unitsData, researchData] = await Promise.all([
        api<{ units: UnitDef[] }>("/api/v1/content/units", null),
        api<{ research: ResearchDef[] }>("/api/v1/content/research", null),
      ]);
      setUnits(unitsData.units);
      setResearchDefs(researchData.research);
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

  async function loadAlliances() {
    if (!token) return;
    const data = await api<{ alliances: AllianceSummary[] }>(
      "/api/v1/alliances",
      token,
    );
    setAllianceList(data.alliances);
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
    setError,
    setStatus,
    pushToast,
    refreshMe,
    refreshQueues,
    refreshMarches,
    displayName,
    faction,
    setToken,
    setPlayer,
    setCities,
    setCityId,
    units,
    comp,
    marchLeaderId,
    mapData,
    selectedTile,
    pvpX,
    pvpY,
    pvpIntent,
    plotPick,
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
    chat,
    formulas,
    researchDefs,
    readinessStatus,
    bestiaryEntries,
    expeditionStatus,
    clueData,
    units,
    sovereigns,
    tutorial,
    dailyQuests,
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
    pvpX,
    setPvpX,
    pvpY,
    setPvpY,
    pvpIntent,
    setPvpIntent,
    plotPick,
    setPlotPick,
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

    // actions
    ...actions,
  };
}

export type Game = ReturnType<typeof useGame>;
