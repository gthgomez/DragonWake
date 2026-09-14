import { useEffect, useMemo, useRef, useState } from "react";

import "../../styles/remediation-castle.css";

import {
  ALPHA_HATCHLING_ART,
  ALPHA_ROOST_PRESENCE_PLATE,
  signatureStudySrc,
} from "../../lib/alphaDragons";
import { canAfford, costText, fmtEta, fmtNum, shortfallText, unitTrainCost } from "../../lib/format";
import {
  cityKindLabel,
  CROWNMARK_LABEL,
  currencyBlurb,
  dracolithLabel,
  DRACOLITH_LABEL,
  lifeStageLabel,
  physicalStateLabel,
  presenceStateLabel,
  researchName,
  temperamentLabel,
  unitName,
} from "../../lib/labels";
import { ArtImage } from "../../ui/ArtImage";
import { Icon, type IconName } from "../../ui/icons";
import type {
  City,
  DailyQuest,
  March,
  Player,
  QueueJob,
  ResearchDef,
  ResearchUnlock,
  Resources,
  ShopItem,
  UnitDef,
} from "../../lib/types";
import { CityGrid } from "./city/CityGrid";
import { ShopPanel } from "./shop/ShopPanel";

type CastleViewProps = {
  city: City;
  cities: City[];
  player: Player;
  shopCatalog: ShopItem[];
  inventory: Record<string, number>;
  buyShopItem: (itemId: string) => Promise<void>;
  useShopItem: (itemId: string) => Promise<void>;
  setCityId: (cityId: string) => void;
  units: UnitDef[];
  researchDefs: ResearchDef[];
  unlockDefs: ResearchUnlock[];
  dailyQuests: DailyQuest[];
  jobs: QueueJob[];
  marches: March[];
  now: number;
  dragonPresence: {
    state?: string;
    title?: string;
    summary?: string;
    nextMilestone?: string;
  } | null;
  expeditionStatus: {
    charterEarned?: boolean;
    currentStage?: number;
    progress?: { campsDefeated?: number; scoutsSent?: number };
  } | null;
  doBuild: (buildingType: string, slotIndex?: number) => Promise<void>;
  doResearch: (techId: string) => Promise<void>;
  doTrain: (unitId: string, count: number) => Promise<void>;
  upgradeKeep: () => Promise<void>;
  foundMarcherKeep: () => Promise<void>;
  claimQuest: (questId: string) => Promise<void>;
  recallReinforcement: (marchId: string) => Promise<void>;
  livingDragons?: any;
  nameHatchling?: (name: string) => Promise<void>;
  observeLivingDragon?: (dragonId: string) => Promise<void>;
  setDragonHarness?: (dragonId: string, role: "yard" | "home_guard") => Promise<void>;
  growLivingDragon?: (dragonId: string) => Promise<void>;
  stationFenWyrm?: (where: "ford" | "home") => Promise<void>;
  beginFenRivalry?: () => Promise<void>;
  surveyFenCrossing?: () => Promise<void>;
  yieldSpawningBank?: () => Promise<void>;
  craftGuardHarness?: () => Promise<void>;
  pactFenWyrm?: () => Promise<void>;
};

const RES_LABELS: Record<string, string> = {
  food: "Food",
  wood: "Wood",
  stone: "Stone",
  ore: "Ore",
  crownmark: "Crownmarks",
};

/** Mirror of content isUnitUnlocked for client-side display only. */
function unitUnlocked(
  unit: UnitDef,
  unlockDefs: ResearchUnlock[],
  research: Record<string, number>,
): boolean {
  if (!unit.unlock || unit.unlock === "start") return true;
  const gate = unlockDefs.find(
    (u) => u.kind === "unit" && u.unlocks.includes(unit.id),
  );
  if (!gate) return true;
  return (research[gate.research_id] ?? 0) >= gate.research_level;
}

/** Which company a settlement relies on — shown first in the muster. */
function troopName(id: string, cityKind: string): string {
  if (cityKind === "brinehold") {
    if (id === "shieldman") return "Reedwarden";
    if (id === "crossbowman") return "Ford Arbalest";
  }
  return unitName(id);
}

function musterPriority(u: UnitDef): number {
  const order = ["levy", "bowman", "scout", "porter", "pikeman", "man_at_arms"];
  const i = order.indexOf(u.id);
  return i === -1 ? 99 : i;
}

export function CastleView({
  city,
  cities,
  player,
  shopCatalog,
  inventory,
  buyShopItem,
  useShopItem,
  setCityId,
  units,
  researchDefs,
  unlockDefs,
  dailyQuests,
  jobs,
  marches,
  now,
  dragonPresence,
  expeditionStatus,
  doBuild,
  doResearch,
  doTrain,
  upgradeKeep,
  foundMarcherKeep,
  claimQuest,
  recallReinforcement,
  livingDragons,
  nameHatchling,
  observeLivingDragon,
  setDragonHarness,
  growLivingDragon,
  stationFenWyrm,
  beginFenRivalry,
  surveyFenCrossing,
  yieldSpawningBank,
  craftGuardHarness,
  pactFenWyrm,
}: CastleViewProps) {
  const rates = city.productionPerHour;
  const foodUpkeep = city.foodUpkeepPerHour ?? 0;
  const foodNet = (rates?.food ?? 0) - foodUpkeep;
  const [confirmFound, setConfirmFound] = useState(false);
  const [hatchName, setHatchName] = useState("");
  const signature = livingDragons?.dragons?.find((d: any) => d.kind === "signature");
  const fen = livingDragons?.dragons?.find((d: any) => d.archetypeId === "fen_wyrm");
  const crossing = livingDragons?.crossings?.[0] ?? null;
  const siltKnowledge = livingDragons?.knowledge?.find(
    (k: any) => k.questionId === "fen_silt",
  );
  const homeGuardReady =
    signature != null &&
    signature.lifeStage !== "hatchling" &&
    signature.harness === "guard_harness" &&
    signature.physicalState === "healthy";

  const charterEarned = Boolean(expeditionStatus?.charterEarned);
  const hasMarcherKeep = cities.some((c) => c.kind === "marcher_keep");
  const dragonWatchLevel =
    city.buildings.find((b) => b.buildingType === "skyreost")?.level ?? 0;
  const stationed = marches.filter(
    (m) => m.status === "stationed" && m.reinforcement,
  );

  const trainable = useMemo(
    () =>
      units
        .filter(
          (u) =>
            (city.stacks[u.id] ?? 0) > 0 ||
            unitUnlocked(u, unlockDefs, city.research),
        )
        .sort(
          (a, b) =>
            (a.tier ?? 1) - (b.tier ?? 1) ||
            musterPriority(a) - musterPriority(b),
        ),
    [units, unlockDefs, city.stacks, city.research],
  );

  const [trainCounts, setTrainCounts] = useState<Record<string, number>>({});
  const countFor = (id: string) => trainCounts[id] ?? 10;
  const setCountFor = (id: string, n: number) =>
    setTrainCounts((c) => ({ ...c, [id]: Math.max(1, Math.min(999, n)) }));

  // Reset the found confirmation when the keep exists or selection changes.
  useEffect(() => setConfirmFound(false), [city.id, hasMarcherKeep]);

  // F1: the shop points here so a new player can find the Dracolith faucet.
  const dailyDeedsRef = useRef<HTMLElement | null>(null);
  const goToDailyDeeds = () => {
    const el = dailyDeedsRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.focus({ preventScroll: true });
  };

  // F6: research feedback beyond the toast. Purely derived from state the
  // client already has — a running job is "researching to level N", and a
  // level that just rose is the last result. No server or balance change.
  const researchJobs = useMemo(() => {
    const m = new Map<string, QueueJob>();
    for (const j of jobs) {
      if (j.kind === "research") m.set(String(j.payload.techId), j);
    }
    return m;
  }, [jobs]);

  const [lastResearch, setLastResearch] = useState<{
    cityId: string;
    id: string;
    level: number;
  } | null>(null);
  const prevResearchRef = useRef<{
    cityId: string;
    levels: Record<string, number>;
  } | null>(null);
  useEffect(() => {
    const levels = city.research ?? {};
    const prev = prevResearchRef.current;
    if (!prev || prev.cityId !== city.id) {
      // A different settlement's study history is not this keep's history —
      // drop the previous keep's "last completed" line on the city switch.
      prevResearchRef.current = { cityId: city.id, levels: { ...levels } };
      setLastResearch(null);
      return;
    }
    let result: { id: string; level: number } | null = null;
    for (const [id, lvl] of Object.entries(levels)) {
      if ((prev.levels[id] ?? 0) < lvl) result = { id, level: lvl };
    }
    prevResearchRef.current = { cityId: city.id, levels: { ...levels } };
    if (result) setLastResearch({ cityId: city.id, ...result });
  }, [city.research, city.id]);

  return (
    <section className="card castle-view">
      <header className="castle-head">
        <div>
          <h2>
            {city.name}{" "}
            <span className="castle-kind">{cityKindLabel(city.kind)}</span>
          </h2>
          <p className="muted tiny">
            At {city.mapX}, {city.mapY} on the realm map
          </p>
        </div>
        {cities.length > 1 && (
          <label className="castle-city-picker">
            Settlements
            <select
              value={city.id}
              onChange={(e) => setCityId(e.target.value)}
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {cityKindLabel(c.kind)}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      <section className="dragon-presence dragon-presence-with-plate" data-testid="dragon-presence" aria-label="Dragon Presence">
        <div className={`dragon-presence-glyph dragon-state-${String(dragonPresence?.state ?? "dormant").toLowerCase()}`}>
          <img
            src="/art/dragons/vale_drake/vale_drake_icon.png"
            alt="Vale Drake Icon"
            className="dragon-presence-avatar"
            data-testid="dragon-presence-icon"
            width={48}
            height={48}
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = "none";
            }}
          />
          <Icon name="dragon" size={32} />
        </div>
        <div className="dragon-presence-copy">
          <div className="eyebrow">Realm awareness</div>
          <h3>{dragonPresence?.title ?? "Dormant"}</h3>
          <p>{dragonPresence?.summary ?? "A vast, sleeping presence lies beneath the kingdom's oldest foundations."}</p>
          <p className="muted tiny"><strong>Next:</strong> {dragonPresence?.nextMilestone ?? "Build the Dragon Watch and bring back your first sign from the realm."}</p>
          <div className="dragon-status-rail" data-testid="dragon-status-rail" aria-label="Dragon status">
            <span className="dragon-state-pill"><span className="dragon-state-dot" />{presenceStateLabel(dragonPresence?.state)}</span>
            {signature ? (
              <>
                <span><strong>{lifeStageLabel(signature.lifeStage)}</strong> · life stage</span>
                <span><strong>{signature.roostEmpty ? "On the approaches" : "In the roost"}</strong></span>
                <span><strong>{signature.chronicle?.length ?? 0}</strong> Chronicle entries</span>
              </>
            ) : (
              <span>Awaiting a living dragon sign</span>
            )}
          </div>
        </div>
        <ArtImage
          src={ALPHA_ROOST_PRESENCE_PLATE}
          className="dragon-presence-plate"
          alt=""
        />
      </section>

      {city.kind === "capital" && (
        <section className="roost-panel" data-testid="capital-roost" aria-label="Capital roost">
          <div className="eyebrow">The roost</div>
          {signature ? (
            <div className="roost-content-layout">
              <div className="roost-visual-card" data-testid="roost-visual-card">
                <div className="roost-art-wrapper">
                  <img
                    src={
                      signature.physicalState === "wounded"
                        ? "/art/dragons/vale_drake/vale_drake_injured.png"
                        : "/art/dragons/vale_drake/vale_drake_roost.png"
                    }
                    alt={
                      signature.physicalState === "wounded"
                        ? `${signature.givenName} (Injured Vale Drake)`
                        : `${signature.givenName} (Vale Drake in Roost)`
                    }
                    className="roost-dragon-art"
                    data-testid="roost-dragon-art"
                  />
                </div>
                <div className="roost-art-badge">
                  <img
                    src="/art/dragons/vale_drake/vale_drake_portrait.png"
                    alt="Vale Drake Portrait"
                    className="roost-portrait-thumbnail"
                    data-testid="roost-portrait-thumbnail"
                    title="Vale Drake Signature Archetype"
                  />
                  <span className="roost-archetype-label">Vale Drake</span>
                </div>
              </div>
              <div className="roost-details">
                <h3 data-testid="roost-name">{signature.roostEmpty ? `${signature.givenName} is away` : signature.givenName}</h3>
                {signature.roostEmpty ? (
                  <p className="muted tiny">The roost is empty. {signature.givenName} is on the approaches (Home Guard).</p>
                ) : (
                  <p className="muted tiny">
                    {lifeStageLabel(signature.lifeStage)} · {physicalStateLabel(signature.physicalState)}
                    {signature.woundId ? ` · ${String(signature.woundId).replace(/_/g, " ")}` : ""} · {temperamentLabel(signature.temperament)}
                    {signature.vaneTells ? ` · ${signature.vaneTells}` : ""}
                  </p>
                )}
                <p className="muted tiny">
                  Harness:{" "}
                  {signature.harness === "guard_harness"
                    ? `Guard Harness (${signature.harnessRole === "home_guard" ? "Home Guard" : "Yard"})`
                    : "none"}
                  {signature.lifeStage === "hatchling" ? " — a hatchling is too small for any harness" : ""}
                </p>
                <figure className="roost-study" data-testid="roost-study">
                  <ArtImage
                    src={signatureStudySrc(
                      signature.lifeStage,
                      signature.physicalState,
                    )}
                    className="roost-study-art"
                    alt=""
                  />
                  <figcaption className="muted tiny">
                    Field study ·{" "}
                    {signature.lifeStage === "hatchling"
                      ? "wake-clutch hatchling"
                      : "roost wyrm"}
                  </figcaption>
                </figure>
                <div className="roost-actions">
                  <button type="button" onClick={() => void observeLivingDragon?.(signature.id)}>Watch the roost</button>
                  <button type="button" onClick={() => void setDragonHarness?.(signature.id, "yard")}>Yard</button>
                  <button
                    type="button"
                    disabled={!homeGuardReady}
                    title={
                      signature.lifeStage === "hatchling"
                        ? "A hatchling guards nothing — it cannot leave the yard."
                        : signature.harness !== "guard_harness"
                          ? "Craft the guard harness first."
                          : signature.physicalState !== "healthy"
                            ? "A wounded dragon cannot take Home Guard."
                            : undefined
                    }
                    onClick={() => void setDragonHarness?.(signature.id, "home_guard")}
                  >
                    Home Guard
                  </button>
                  {signature.lifeStage !== "hatchling" && signature.harness === "none" && (
                    <button type="button" data-testid="craft-guard-harness" onClick={() => void craftGuardHarness?.()}>
                      Craft guard harness (120 wood · 80 ore · 30 crownmarks)
                    </button>
                  )}
                  {signature.lifeStage === "hatchling" && (
                    <button type="button" onClick={() => void growLivingDragon?.(signature.id)}>Mark first growth</button>
                  )}
                </div>
                {signature.chronicle?.length > 0 && (
                  <div className="chronicle" data-testid="dragon-chronicle">
                    <strong>Chronicle</strong>
                    <ul>
                      {signature.chronicle.slice(-8).reverse().map((ev: any) => (
                        <li key={ev.id}>{ev.summary}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : livingDragons?.clutchAvailable ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void nameHatchling?.(hatchName);
              }}
            >
              <ArtImage
                src={ALPHA_HATCHLING_ART}
                className="clutch-hatchling-art"
                alt=""
              />
              <h3>An abandoned clutch survived the Scar</h3>
              <p className="muted tiny">Name the hatchling. This begins the relationship — there is no Bond button.</p>
              <label>
                Name
                <input
                  value={hatchName}
                  onChange={(e) => setHatchName(e.target.value)}
                  maxLength={24}
                  required
                  minLength={2}
                />
              </label>
              <button type="submit">Name the hatchling</button>
            </form>
          ) : (
            <p className="muted tiny">No living dragon roosts here yet. Survive the Scar, then search the clutch.</p>
          )}
        </section>
      )}

      {city.kind === "brinehold" && fen && (
        <section className="roost-panel" data-testid="fen-pact" aria-label="Fen Wyrm pact">
          <div className="eyebrow">River pact</div>
          <h3>{fen.epithet}</h3>
          <p className="muted tiny">
            {fen.relationship === "pacted" ? "Pacted, not owned." : fen.relationship} · {fen.locationKind}
            {fen.locationKind === "ford" ? " — Brinehold's home waters are unguarded." : " — the wyrm coils at home waters."}
          </p>
          {fen.relationship === "pacted" && (
            <div className="roost-actions">
              <button type="button" onClick={() => void stationFenWyrm?.("ford")}>Station at the ford</button>
              <button type="button" onClick={() => void stationFenWyrm?.("home")}>Return to home waters</button>
            </div>
          )}
        </section>
      )}

      {city.kind === "capital" && livingDragons?.fenRivalryAvailable && (
        <section className="roost-panel" aria-label="River rivalry">
          <div className="eyebrow">The river</div>
          <h3>The ford is denied</h3>
          <p className="muted tiny">A mature Fen Wyrm holds the water. This is not another hatchling.</p>
          <button type="button" onClick={() => void beginFenRivalry?.()}>Seek the coils</button>
        </section>
      )}

      {fen && fen.relationship !== "pacted" && city.kind === "capital" && (
        <section className="roost-panel" data-testid="fen-negotiation">
          <div className="eyebrow">Negotiation</div>
          <p className="muted tiny">
            {fen.epithet} — this is not another hatchling. Treat with it in
            order: watch it, read its crossing, yield the bank, then offer
            terms.
          </p>
          <div className="roost-actions">
            <button type="button" onClick={() => void observeLivingDragon?.(fen.id)}>Observe the Fen Wyrm</button>
            {crossing && crossing.state === "contested" && (
              <button type="button" data-testid="survey-crossing" onClick={() => void surveyFenCrossing?.()}>
                Survey the Fen Crossing
              </button>
            )}
            {crossing && crossing.state === "contested" && (
              <button type="button" data-testid="yield-spawning-bank" onClick={() => void yieldSpawningBank?.()}>
                Yield the spawning bank
              </button>
            )}
            {crossing && crossing.state === "sanctuary" && (
              <button type="button" data-testid="offer-pact" onClick={() => void pactFenWyrm?.()}>
                Offer the pact
              </button>
            )}
          </div>
          <p className="muted tiny">
            {crossing == null
              ? "The crossing is not yet known to your keepers."
              : crossing.state === "contested"
                ? siltKnowledge == null || siltKnowledge.state === "rumored"
                  ? "The crossing is contested. Survey it, and codify why the wyrm holds the bank before yielding it."
                  : siltKnowledge.state === "supported"
                    ? "The silt is understood. Record ford signaling, then yield the spawning bank — permanently."
                    : "The bank can be yielded — a permanent surrender, marked on the map."
                : "The crossing is sanctuary ground. The wyrm may now accept terms."}
          </p>
        </section>
      )}

      {city.kind === "marcher_keep" && (
        <div className="marcher-banner" role="note">
          <strong>Forward march.</strong> This keep stands where the realm ends
          — a mustering point for expeditions and a watch post against whatever
          crosses the border fens.
        </div>
      )}

      <ul className="res-grid" aria-label="Resources">
        {(Object.keys(city.resources) as (keyof Resources)[]).map((k) => (
          <li key={k}>
            <strong className="res-head">
              <Icon name={k as IconName} size={16} />
              {RES_LABELS[k] ?? k}
            </strong>
            <span className="res-val">{fmtNum(city.resources[k])}</span>
            {rates && (
              <span className="res-rate">+{fmtNum(rates[k])}/h</span>
            )}
            {k === "food" && foodUpkeep > 0 && (
              <span
                className={`res-rate ${city.starving ? "res-rate-alert" : ""}`}
                data-testid="food-upkeep"
              >
                −{fmtNum(foodUpkeep)}/h upkeep · net{" "}
                {foodNet >= 0 ? "+" : "−"}
                {fmtNum(Math.abs(foodNet))}/h
              </span>
            )}
            {k === "crownmark" && (
              <span className="res-kind muted tiny">realm resource</span>
            )}
          </li>
        ))}
        {/* F7: Dracoliths are not a realm resource — they are earned, and the
            row says so here as well as in the Steward's Wares. */}
        <li className="res-premium" data-testid="res-dracolith">
          <strong className="res-head">
            <Icon name="crown" size={16} />
            {DRACOLITH_LABEL}
          </strong>
          <span className="res-val">{fmtNum(player.dracolith)}</span>
          <span className="res-kind muted tiny">earned premium · Daily Deeds</span>
        </li>
      </ul>
      <p className="muted tiny res-blurb">{currencyBlurb()}</p>

      <h3>The Settlement</h3>
      <section className="keep-progression" aria-label="Keep progression">
        <div>
          <strong>Forge-Heart · Keep level {city.keepLevel ?? 1}</strong>
          <p className="muted tiny">
            The Keep governs how far buildings, operations, and frontier holdings can grow.
            Upgrade it when your next scale requirement is the blocker.
          </p>
          {(city.keepLevel ?? 1) < 10 && (
            <p className="muted tiny" data-testid="keep-upgrade-costs">
              Next level costs:{" "}
              <span><Icon name="food" size={12} /> {fmtNum(500 * ((city.keepLevel ?? 1) + 1))}</span>{" "}
              <span><Icon name="wood" size={12} /> {fmtNum(500 * ((city.keepLevel ?? 1) + 1))}</span>{" "}
              <span><Icon name="stone" size={12} /> {fmtNum(300 * ((city.keepLevel ?? 1) + 1))}</span>{" "}
              <span><Icon name="crownmark" size={12} /> {fmtNum(100 * ((city.keepLevel ?? 1) + 1))}</span>
              {" "}· about {90 * ((city.keepLevel ?? 1) + 1)}s
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={(city.keepLevel ?? 1) >= 10}
          onClick={() => void upgradeKeep()}
        >
          {(city.keepLevel ?? 1) >= 10 ? "Keep mastered" : `Upgrade to L${(city.keepLevel ?? 1) + 1}`}
        </button>
      </section>
      <div className="dragon-watch-panel" data-testid="dragon-watch-panel">
        <div className="dragon-watch-mark" aria-hidden="true">
          <Icon name="dragon" size={28} />
        </div>
        <div>
          <strong>Dragon Watch</strong>
          <p className="muted tiny">
            {dragonWatchLevel > 0
              ? `Level ${dragonWatchLevel} · the watch records every sign brought home.`
              : "Raise this tower from an empty plot to turn rumors into evidence."}
          </p>
        </div>
      </div>
      <CityGrid key={city.id} city={city} jobs={jobs} now={now} unlockDefs={unlockDefs} doBuild={doBuild} />

      <div className="castle-columns">
        <div>
          <h3>Population &amp; Manpower</h3>
          <div className="pop-bar-container">
            <div className="pop-row">
              <span>
                Population: {fmtNum(city.population ?? 0)} /{" "}
                {fmtNum(city.maxPopulation ?? 0)}
              </span>
            </div>
            <div className="bar">
              <div
                className="bar-fill"
                style={{
                  width: city.maxPopulation
                    ? `${Math.min(
                        100,
                        ((city.population ?? 0) / city.maxPopulation) * 100,
                      )}%`
                    : "0%",
                }}
              />
            </div>
            <div className="pop-row">
              <span>
                Available manpower: {fmtNum(city.availableManpower ?? 0)}
              </span>
            </div>
          </div>

          <h3>Studies</h3>
          <p
            className="muted tiny study-status"
            data-testid="research-status"
            aria-live="polite"
          >
            {researchJobs.size > 0
              ? `Research under way: ${[...researchJobs.entries()]
                  .map(([id, j]) => {
                    const target = (city.research[id] ?? 0) + 1;
                    return `${researchName(id)} → level ${target} (${fmtEta(
                      Math.max(0, j.finishesAt - now),
                    )} left)`;
                  })
                  .join("; ")}.`
              : lastResearch && lastResearch.cityId === city.id
                ? `Last completed: ${researchName(lastResearch.id)} reached level ${lastResearch.level}.`
                : "No study under way — choose a study below to advance the realm."}
          </p>
          {Object.keys(city.research).length > 0 && (
            <ul className="study-list">
              {Object.entries(city.research).map(([k, v]) => (
                <li key={k} className="muted tiny">
                  {researchDefs.find((r) => r.id === k)?.name ?? k}: level {v}
                </li>
              ))}
            </ul>
          )}
          <div className="grid study-grid">
            {researchDefs.map((r) => {
              const lvl = city.research[r.id] ?? 0;
              const maxed = Boolean(r.max_level && lvl >= r.max_level);
              const running = researchJobs.get(r.id);
              const cost: Partial<Resources> = {};
              for (const [k, v] of Object.entries(r.cost ?? {})) {
                cost[k as keyof Resources] = Math.floor((v ?? 0) * (lvl + 1));
              }
              const affordable = canAfford(city.resources, cost);
              const short = shortfallText(city.resources, cost);
              const reason = maxed
                ? "Fully studied."
                : short
                  ? `Needs more — ${short}.`
                  : null;
              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={maxed || !affordable}
                  title={
                    maxed
                      ? "Fully studied"
                      : `Level ${lvl + 1} cost: ${costText(cost)}`
                  }
                  onClick={() => void doResearch(r.id)}
                >
                  <span className="study-name">{r.name}</span>
                  <span className="study-level muted tiny">
                    {maxed ? `mastered at level ${lvl}` : `now level ${lvl}`}
                  </span>
                  <span className="muted tiny">
                    {maxed
                      ? "mastered"
                      : running
                        ? `researching to level ${lvl + 1} — ${fmtEta(
                            Math.max(0, running.finishesAt - now),
                          )} left`
                        : `to level ${lvl + 1}`}
                  </span>
                  {!maxed && costText(cost) && (
                    <span className="study-cost">{costText(cost)}</span>
                  )}
                  {reason && <span className="action-hint">{reason}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3>Muster</h3>
          <p className="muted tiny">
            Available manpower: {fmtNum(city.availableManpower ?? 0)} - training
            reserves people as well as supplies.
          </p>
          <p className="muted tiny">
            Operations: {city.activeOperations ?? 0} / {city.operationCapacity ?? 4}
            . Troop capacity per march: {fmtNum(city.troopsPerMarchCapacity ?? 500)}.
            Muster Yard raises both limits; Commanders remain a separate leadership
            constraint.
          </p>
          {city.starving && (
            <p className="action-hint" data-testid="starving-banner">
              The stores run dry — feed the host first. Population growth is
              paused and no new company can be mustered until Food recovers.
            </p>
          )}
          <ul className="muster-list">
            {trainable.map((u) => {
              const count = countFor(u.id);
              const cost = unitTrainCost(u, count);
              const affordable = canAfford(city.resources, cost);
              const manpower = (u.pop ?? 1) * count;
              const enoughPeople = (city.availableManpower ?? 0) >= manpower;
              const gate = unlockDefs.find(
                (ud) => ud.kind === "unit" && ud.unlocks.includes(u.id),
              );
              const locked = !unitUnlocked(u, unlockDefs, city.research);
              const short = shortfallText(city.resources, cost);
              const reason = city.starving
                ? "The stores run dry — feed the host first."
                : locked
                ? gate
                  ? `Requires ${researchName(gate.research_id)} level ${gate.research_level}.`
                  : "Requires further study."
                : !enoughPeople
                  ? `Needs ${fmtNum(manpower)} manpower — ${fmtNum(city.availableManpower ?? 0)} available.`
                  : short
                    ? `Needs more — ${short}.`
                    : null;
              return (
                <li key={u.id} className="muster-row">
                  <div className="muster-info">
                    <strong>{troopName(u.id, city.kind)}</strong>
                    <span className="muted tiny">
                      owned {fmtNum(city.stacks[u.id] ?? 0)}
                      {locked && gate
                        ? ` · requires ${researchName(gate.research_id)} ${gate.research_level}`
                        : locked
                          ? " · requires further study"
                          : ""}
                    </span>
                    <span className="muster-cost">
                      {count}× · {costText(cost)}
                    </span>
                    {reason && <span className="action-hint">{reason}</span>}
                  </div>
                  <div className="muster-controls">
                    <label className="city-visually-hidden" htmlFor={`muster-${u.id}`}>
                      {troopName(u.id, city.kind)} count
                    </label>
                    <input
                      id={`muster-${u.id}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={999}
                      value={count}
                      onChange={(e) =>
                        setCountFor(u.id, Number(e.target.value))
                      }
                    />
                    <button
                      type="button"
                      disabled={
                        Boolean(city.starving) ||
                        locked ||
                        !affordable ||
                        !enoughPeople
                      }
                      title={
                        reason ??
                        `Train ${count} for ${costText(cost)}`
                      }
                      onClick={() => void doTrain(u.id, count)}
                    >
                      Train
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {stationed.length > 0 && (
        <section className="keep-progression" aria-label="Stationed reinforcements">
          <div>
            <strong>Stationed reinforcements</strong>
            <p className="muted tiny">
              These troops remain owned by their sending settlement until recalled.
            </p>
          </div>
          <ul className="muster-list">
            {stationed.map((m) => (
              <li key={m.id} className="muster-row">
                <span className="muted tiny">
                  {Object.entries(m.reinforcement?.composition ?? {})
                    .map(([id, count]) => `${fmtNum(count)}× ${troopName(id, city.kind)}`)
                    .join(", ")}
                </span>
                <button type="button" onClick={() => void recallReinforcement(m.id)}>
                  Recall
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h3>The Wider March</h3>
      {hasMarcherKeep ? (
        <p className="ok">
          Your Marcher Keep stands. Switch settlements above to tend it.
        </p>
      ) : charterEarned ? (
        confirmFound ? (
          <div className="charter-card charter-ready">
            <p>
              The charter is signed. The new keep will claim a lone hill in the
              realm — its lands will be yours to raise.
            </p>
            <div className="row">
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setConfirmFound(false);
                  void foundMarcherKeep();
                }}
              >
                Found the Marcher Keep
              </button>
              <button type="button" onClick={() => setConfirmFound(false)}>
                Not yet
              </button>
            </div>
          </div>
        ) : (
          <div className="charter-card charter-ready">
            <p>
              <strong>The expedition charter is earned.</strong> Your kingdom is
              ready to found a Marcher Keep — a second settlement on the edge of
              your reach.
            </p>
            <button type="button" onClick={() => setConfirmFound(true)}>
              Review the founding
            </button>
          </div>
        )
      ) : (
        <div className="charter-card">
          <p>
            <strong>Found a Marcher Keep.</strong> A settlement charter is
            required — earn it by completing the Dragon Expedition.
          </p>
          <p className="muted tiny">
            Expedition progress so far: {expeditionStatus?.progress?.scoutsSent ?? 0}{" "}
            scouting party landings,{" "}
            {expeditionStatus?.progress?.campsDefeated ?? 0} camps broken. Begin
            the expedition in the Knowledge tab once the dragon-readiness
            requirements are met.
          </p>
          <p className="muted">
            State of the charter:{" "}
            <strong>
              {expeditionStatus?.charterEarned
                ? "earned"
                : expeditionStatus && (expeditionStatus.currentStage ?? 0) > 0
                  ? `expedition under way (stage ${expeditionStatus.currentStage})`
                  : "not yet begun"}
            </strong>
          </p>
        </div>
      )}
      {typeof city.ownedWilderness === "number" && (
        <p className="muted tiny">
          Wilderness holdings: {city.ownedWilderness} / {city.wildernessCapacity ?? 2} —
          each adds a strategic production, logistics, or scouting benefit. Release
          a lower-value holding in the Realm before claiming another.
          (see Lands).
        </p>
      )}

      <ShopPanel
        player={player}
        catalog={shopCatalog}
        inventory={inventory}
        hasActiveQueue={jobs.length > 0}
        onBuy={buyShopItem}
        onUse={useShopItem}
        onGoToDailyDeeds={goToDailyDeeds}
      />

      <section
        className="daily-deeds"
        id="daily-deeds"
        data-testid="daily-deeds"
        aria-label="Daily Deeds"
        tabIndex={-1}
        ref={dailyDeedsRef}
      >
        <h3>Daily Deeds</h3>
        <p className="muted tiny">
          {DRACOLITH_LABEL} are earned here — each deed pays 1 or 2 on claim, and
          there is no purchase path. {CROWNMARK_LABEL} are a realm resource and
          do not buy Steward's Wares.
        </p>
        {dailyQuests.length === 0 ? (
          <p className="muted">No deeds posted today.</p>
        ) : (
          <ul className="quest-list">
            {dailyQuests.map((q) => (
              <li key={q.id} className="plot-row">
                <div>
                  {q.done ? "✓ " : "○ "}
                  {q.title}{" "}
                  <span className="muted">
                    +{dracolithLabel(q.rewardDracolith)}
                  </span>
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
    </section>
  );
}
