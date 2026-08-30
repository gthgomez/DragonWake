import { useEffect, useMemo, useState } from "react";

import { canAfford, fmtNum, unitTrainCost } from "../../lib/format";
import { cityKindLabel, unitName } from "../../lib/labels";
import { Icon, type IconName } from "../../ui/icons";
import type {
  City,
  DailyQuest,
  QueueJob,
  ResearchDef,
  ResearchUnlock,
  Resources,
  UnitDef,
} from "../../lib/types";
import { CityGrid } from "./city/CityGrid";

type CastleViewProps = {
  city: City;
  cities: City[];
  setCityId: (cityId: string) => void;
  units: UnitDef[];
  researchDefs: ResearchDef[];
  unlockDefs: ResearchUnlock[];
  dailyQuests: DailyQuest[];
  jobs: QueueJob[];
  now: number;
  expeditionStatus: {
    charterEarned?: boolean;
    currentStage?: number;
    progress?: { campsDefeated?: number; scoutsSent?: number };
  } | null;
  doBuild: (buildingType: string, slotIndex?: number) => Promise<void>;
  doResearch: (techId: string) => Promise<void>;
  doTrain: (unitId: string, count: number) => Promise<void>;
  foundMarcherKeep: () => Promise<void>;
  claimQuest: (questId: string) => Promise<void>;
};

const RES_LABELS: Record<string, string> = {
  food: "Food",
  timber: "Timber",
  stone: "Stone",
  iron: "Iron",
  coin: "Coin",
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
function musterPriority(u: UnitDef): number {
  const order = ["levy", "bowman", "scout", "porter", "pikeman", "man_at_arms"];
  const i = order.indexOf(u.id);
  return i === -1 ? 99 : i;
}

export function CastleView({
  city,
  cities,
  setCityId,
  units,
  researchDefs,
  unlockDefs,
  dailyQuests,
  jobs,
  now,
  expeditionStatus,
  doBuild,
  doResearch,
  doTrain,
  foundMarcherKeep,
  claimQuest,
}: CastleViewProps) {
  const rates = city.productionPerHour;
  const [confirmFound, setConfirmFound] = useState(false);

  const charterEarned = Boolean(expeditionStatus?.charterEarned);
  const hasMarcherKeep = cities.some((c) => c.kind === "marcher_keep");

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
          </li>
        ))}
      </ul>

      <h3>The Settlement</h3>
      <CityGrid city={city} jobs={jobs} now={now} doBuild={doBuild} />

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
              const cost: Partial<Resources> = {};
              for (const [k, v] of Object.entries(r.cost ?? {})) {
                cost[k as keyof Resources] = Math.floor((v ?? 0) * (lvl + 1));
              }
              const affordable = canAfford(city.resources, cost);
              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={maxed || !affordable}
                  title={
                    maxed
                      ? "Fully studied"
                      : `Level ${lvl + 1} cost: ${Object.entries(cost)
                          .filter(([, v]) => (v ?? 0) > 0)
                          .map(([k, v]) => `${v} ${k}`)
                          .join(", ")}`
                  }
                  onClick={() => void doResearch(r.id)}
                >
                  {r.name}
                  <span className="muted tiny">
                    {maxed ? " · mastered" : lvl > 0 ? ` · to level ${lvl + 1}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3>Muster</h3>
          <p className="muted tiny">
            Available manpower: {fmtNum(city.availableManpower ?? 0)} — training
            reserves people as well as supplies.
          </p>
          <ul className="muster-list">
            {trainable.map((u) => {
              const count = countFor(u.id);
              const cost = unitTrainCost(u, count);
              const affordable = canAfford(city.resources, cost);
              const manpower = (u.pop ?? 1) * count;
              const enoughPeople =
                (city.availableManpower ?? 0) >= manpower;
              const locked = !unitUnlocked(u, unlockDefs, city.research);
              return (
                <li key={u.id} className="muster-row">
                  <div className="muster-info">
                    <strong>{unitName(u.id)}</strong>
                    <span className="muted tiny">
                      owned {fmtNum(city.stacks[u.id] ?? 0)}
                      {locked ? " · requires further study" : ""}
                    </span>
                  </div>
                  <div className="muster-controls">
                    <label className="city-visually-hidden" htmlFor={`muster-${u.id}`}>
                      {unitName(u.id)} count
                    </label>
                    <input
                      id={`muster-${u.id}`}
                      type="number"
                      min={1}
                      max={999}
                      value={count}
                      onChange={(e) =>
                        setCountFor(u.id, Number(e.target.value))
                      }
                    />
                    <button
                      type="button"
                      className="muster-max"
                      onClick={() => setCountFor(u.id, count)}
                      aria-label={`Keep ${count} of ${unitName(u.id)}`}
                    >
                      {count}
                    </button>
                    <button
                      type="button"
                      disabled={
                        locked || !affordable || !enoughPeople
                      }
                      title={
                        locked
                          ? "Requires further study"
                          : !enoughPeople
                            ? "Not enough available manpower"
                            : `Cost: ${Object.entries(cost)
                                .filter(([, v]) => (v ?? 0) > 0)
                                .map(([k, v]) => `${v} ${k}`)
                                .join(", ")}`
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
          Held wildlands: {city.ownedWilderness} — each adds to your production
          (see Lands).
        </p>
      )}

      <h3>Daily Deeds</h3>
      {dailyQuests.length === 0 ? (
        <p className="muted">No deeds posted today.</p>
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
  );
}
