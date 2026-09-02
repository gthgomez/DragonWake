import type { Dispatch, SetStateAction } from "react";

import { api } from "../lib/api";
import { canAfford, unitTrainCost } from "../lib/format";
import { PLOT_ASSIGN_COST, type Toast } from "../lib/gameConfig";
import {
  buildingDef,
  buildingName,
  intentLabel,
  translateError,
  unitName,
} from "../lib/labels";
import type {
  AllianceInfo,
  ChatMessage,
  City,
  Commander,
  March,
  Player,
  QueueJob,
  TutorialState,
  UnitDef,
} from "../lib/types";

export type UseGameActionsDeps = {
  token: string | null;
  city: City | null;
  setError: Dispatch<SetStateAction<string | null>>;
  setStatus: Dispatch<SetStateAction<string>>;
  pushToast: (message: string, kind?: Toast["kind"]) => void;
  refreshMe: (tok: string) => Promise<void>;
  refreshQueues: (tok: string, cId: string | null) => Promise<void>;
  refreshMarches: (tok: string) => Promise<void>;
  refreshKnowledge: () => Promise<void>;

  // login form
  displayName: string;
  faction: string;
  setToken: Dispatch<SetStateAction<string | null>>;
  setPlayer: Dispatch<SetStateAction<Player | null>>;
  setCities: Dispatch<SetStateAction<City[]>>;
  setCityId: Dispatch<SetStateAction<string | null>>;

  // build / train
  units: UnitDef[];
  researchDefs: { id: string; name: string }[];

  // marches
  comp: Record<string, number>;
  marchLeaderId: string;

  // plots / alliance / chat / tutorial
  allyName: string;
  allyTag: string;
  alliance: AllianceInfo | null;
  chatBody: string;
  setAlliance: Dispatch<SetStateAction<AllianceInfo | null>>;
  setChat: Dispatch<SetStateAction<ChatMessage[]>>;
  setChatBody: Dispatch<SetStateAction<string>>;
  setTutorial: Dispatch<SetStateAction<TutorialState | null>>;

  // logout
  setJobs: Dispatch<SetStateAction<QueueJob[]>>;
  setMarches: Dispatch<SetStateAction<March[]>>;
  setCommanders: Dispatch<SetStateAction<Commander[]>>;
  setCommandersReady: Dispatch<SetStateAction<boolean>>;
  setMarchLeaderId: Dispatch<SetStateAction<string>>;
};

export function useGameActions(deps: UseGameActionsDeps) {
  const {
    token,
    city,
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
  } = deps;

  async function run(label: string, fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
      setStatus(label);
      pushToast(label, "ok");
    } catch (e) {
      const msg = translateError(e);
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
      localStorage.setItem("dragonwake_token", data.token);
      setToken(data.token);
      setPlayer(data.player);
      setCities([data.city]);
      setCityId(data.city.id);
    });
  }

  async function doBuild(buildingType: string, slotIndex?: number) {
    if (!token || !city) return;
    const def = buildingDef(buildingType);
    const baseCost = def?.build_cost ?? { food: 100, timber: 100 };
    const slot =
      slotIndex ?? Math.max(0, ...city.buildings.map((b) => b.slotIndex), -1) + 1;
    const existing = city.buildings.find((b) => b.slotIndex === slot);
    const nextLevel = existing
      ? existing.buildingType === buildingType
        ? existing.level + 1
        : 0
      : 1;
    if (existing && nextLevel === 0) {
      setError("That plot is held by another structure.");
      return;
    }
    const cost: Record<string, number> = {};
    for (const [k, v] of Object.entries(baseCost)) {
      cost[k as keyof typeof cost] = (v ?? 0) * nextLevel;
    }
    if (!canAfford(city.resources, cost)) {
      const need = Object.entries(cost)
        .filter(([k, v]) => (city.resources[k as keyof typeof city.resources] ?? 0) < (v ?? 0))
        .map(([k, v]) => `${(v ?? 0) - (city.resources[k as keyof typeof city.resources] ?? 0)} more ${k}`);
      setError(`Not enough resources — you need ${need.join(", ")}.`);
      return;
    }
    const name = buildingName(buildingType);
    await run(
      existing ? `Raising ${name} to level ${nextLevel}` : `Building ${name}`,
      async () => {
        await api(`/api/v1/cities/${city.id}/buildings`, token, {
          method: "POST",
          body: JSON.stringify({ slotIndex: slot, buildingType }),
        });
        await refreshMe(token);
        await refreshQueues(token, city.id);
      },
    );
  }

  async function doResearch(techId: string) {
    if (!token || !city) return;
    const def = researchDefs.find((t) => t.id === techId);
    await run(
      `Studying ${def?.name ?? techId.replace(/_/g, " ")}`,
      async () => {
        await api(`/api/v1/cities/${city.id}/research`, token, {
          method: "POST",
          body: JSON.stringify({ techId }),
        });
        await refreshMe(token);
        await refreshQueues(token, city.id);
      },
    );
  }

  async function doTrain(unitId: string, count: number) {
    if (!token || !city) return;
    const def = units.find((u) => u.id === unitId);
    if (def && !canAfford(city.resources, unitTrainCost(def, count))) {
      setError("Not enough resources to train");
      return;
    }
    await run(`Training ${count}× ${unitName(unitId)}`, async () => {
      await api(`/api/v1/cities/${city.id}/train`, token, {
        method: "POST",
        body: JSON.stringify({ unitId, count }),
      });
      await refreshMe(token);
      await refreshQueues(token, city.id);
    });
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
      setError("No troops selected — choose the companies for this march.");
      pushToast("March blocked: no troops selected", "err");
      return;
    }
    for (const [uid, n] of Object.entries(composition)) {
      const have = city.stacks[uid] ?? 0;
      if (have < n) {
        const msg = `You only have ${have} ${unitName(uid)} — you tried to send ${n}.`;
        setError(msg);
        pushToast(msg, "err");
        return;
      }
    }
    await run(
      `${intentLabel(opts.intent)} march dispatched`,
      async () => {
        const body: Record<string, unknown> = {
          fromCityId: city.id,
          intent: opts.intent,
          target: opts.target,
          composition,
        };
        if (marchLeaderId) body.commanderId = marchLeaderId;
        await api("/api/v1/marches", token, {
          method: "POST",
          body: JSON.stringify(body),
        });
        await refreshMe(token);
        await refreshMarches(token);
        pushToast(
          `March sent toward ${opts.target.x}, ${opts.target.y}`,
          "ok",
        );
      },
    );
  }

  async function recruitCommander() {
    if (!token) return;
    await run("Commander recruited", async () => {
      const data = await api<{ commander: Commander }>(
        "/api/v1/commanders/recruit",
        token,
        { method: "POST", body: JSON.stringify({}) },
      );
      setCommanders((list) => [...list, data.commander]);
      pushToast(
        `Recruited ${data.commander.name} (${"★".repeat(data.commander.stars)})`,
        "ok",
      );
      await refreshMe(token);
    });
  }

  async function createAlly() {
    if (!token) return;
    await run("Alliance created", async () => {
      const data = await api<{ alliance: AllianceInfo }>("/api/v1/alliances", token, {
        method: "POST",
        body: JSON.stringify({ name: allyName, tag: allyTag }),
      });
      setAlliance(data.alliance);
    });
  }

  async function joinAlly(tagOrId: { tag?: string; allianceId?: string }) {
    if (!token) return;
    await run("Joined alliance", async () => {
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
      const data = await api<{ tutorial: TutorialState }>(
        "/api/v1/tutorial/advance",
        token,
        { method: "POST" },
      );
      setTutorial(data.tutorial);
    });
  }

  async function startDragonExpedition() {
    if (!token) return;
    await run("The dragon expedition sets out", async () => {
      await api("/api/v1/dragon/expedition/start", token, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await refreshMe(token);
      await refreshKnowledge();
    });
  }

  async function completeDragonStage(stageNumber: number) {
    if (!token) return;
    await run("Stage of the expedition accomplished", async () => {
      await api("/api/v1/dragon/expedition/complete-stage", token, {
        method: "POST",
        body: JSON.stringify({ stageNumber }),
      });
      await refreshMe(token);
      await refreshKnowledge();
    });
  }

  async function claimQuest(questId: string) {
    if (!token) return;
    await run("Daily deed claimed", async () => {
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
        messages: ChatMessage[];
      }>(`/api/v1/alliances/${alliance.id}/chat`, token);
      setChat(list.messages);
      setChatBody("");
    });
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

  async function foundHolding(kind: string) {
    if (!token) return;
    await run(`${kind.replace(/_/g, " ")} founded`, async () => {
      await api("/api/v1/citadels/found", token, {
        method: "POST",
        body: JSON.stringify({ kind, unlock: false }),
      });
      await refreshMe(token);
    });
  }

  async function setPosture(posture: string) {
    if (!token || !city) return;
    await run("Defense posture updated", async () => {
      await api(`/api/v1/cities/${city.id}/posture`, token, {
        method: "POST",
        body: JSON.stringify({ posture }),
      });
      await refreshMe(token);
    });
  }

  async function assignPlot(slotIndex: number, plotType: string) {
    if (!token || !city) return;
    if (!canAfford(city.resources, PLOT_ASSIGN_COST)) {
      setError(
        `Not enough resources — staking ground costs ${PLOT_ASSIGN_COST.food} food and ${PLOT_ASSIGN_COST.timber} timber.`,
      );
      return;
    }
    await run("New plot staked", async () => {
      await api(`/api/v1/cities/${city.id}/plots`, token, {
        method: "POST",
        body: JSON.stringify({ slotIndex, plotType }),
      });
      await refreshMe(token);
    });
  }

  async function upgradePlot(slotIndex: number, level: number) {
    if (!token || !city) return;
    const cost = { food: 50 * level, timber: 50 * level };
    if (!canAfford(city.resources, cost)) {
      setError(`Need ${cost.food} food + ${cost.timber} timber`);
      return;
    }
    await run(`Plot improved to level ${level + 1}`, async () => {
      await api(`/api/v1/cities/${city.id}/plots/upgrade`, token, {
        method: "POST",
        body: JSON.stringify({ slotIndex }),
      });
      await refreshMe(token);
    });
  }

  function logout() {
    localStorage.removeItem("dragonwake_token");
    setToken(null);
    setPlayer(null);
    setCities([]);
    setJobs([]);
    setMarches([]);
    setCommanders([]);
    setCommandersReady(false);
    setMarchLeaderId("");
  }

  return {
    loginGuest,
    doBuild,
    doResearch,
    doTrain,
    sendMarch,
    recruitCommander,
    createAlly,
    joinAlly,
    advanceTutorial,
    startDragonExpedition,
    completeDragonStage,
    claimQuest,
    sendChat,
    grantDev,
    foundMarcherKeep,
    foundBrine,
    foundStone,
    foundHolding,
    setPosture,
    assignPlot,
    upgradePlot,
    logout,
  };
}
export type GameActions = ReturnType<typeof useGameActions>;
