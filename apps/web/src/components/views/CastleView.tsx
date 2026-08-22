import { useMemo } from "react";

import { canAfford, fmtNum, unitTrainCost } from "../../lib/format";
import { Icon, type IconName } from "../../ui/icons";
import type {
  City,
  DailyQuest,
  ResearchDef,
  Resources,
  Sovereign,
  UnitDef,
} from "../../lib/types";
import { CityGrid } from "./city/CityGrid";

type CastleViewProps = {
  city: City;
  cities: City[];
  setCityId: (cityId: string) => void;
  units: UnitDef[];
  researchDefs: ResearchDef[];
  sovereigns: Sovereign[];
  dailyQuests: DailyQuest[];
  doBuild: (buildingType: string, slotIndex?: number) => Promise<void>;
  doResearch: (techId: string) => Promise<void>;
  doTrain: (unitId: string, count: number) => Promise<void>;
  foundMarcherKeep: () => Promise<void>;
  foundBrine: () => Promise<void>;
  foundStone: () => Promise<void>;
  claimQuest: (questId: string) => Promise<void>;
};

export function CastleView({
  city,
  cities,
  setCityId,
  units,
  researchDefs,
  sovereigns,
  dailyQuests,
  doBuild,
  doResearch,
  doTrain,
  foundMarcherKeep,
  foundBrine,
  foundStone,
  claimQuest,
}: CastleViewProps) {
  const rates = city.productionPerHour;

  const startUnits = useMemo(
    () =>
      units.filter(
        (u) =>
          u.unlock === "start" ||
          u.id === "levy" ||
          u.id === "bowman" ||
          u.id === "scout" ||
          u.id === "porter",
      ),
    [units],
  );

  return (
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
            <strong className="res-head">
              <Icon name={k as IconName} size={16} />
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </strong>
            <span className="res-val">{fmtNum(city.resources[k])}</span>
            {rates && (
              <span className="res-rate">+{fmtNum(rates[k])}/h</span>
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
      <CityGrid city={city} doBuild={doBuild} />

      <h3>Research</h3>
      <ul>
        {Object.entries(city.research).map(([k, v]) => (
          <li key={k}>
            {researchDefs.find((r) => r.id === k)?.name ?? k}: L{v}
          </li>
        ))}
        {Object.keys(city.research).length === 0 && (
          <li className="muted">None yet</li>
        )}
      </ul>
      <div className="grid">
        {researchDefs.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => void doResearch(r.id)}
          >
            Research {r.name}
          </button>
        ))}
      </div>

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
              { id: "bowman", name: "Bowman" },
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
                  ? `Cost: ${
                      Object.entries(cost)
                        .map(([k, v]) => `${v} ${k}`)
                        .join(", ") || "free"
                    }`
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
  );
}
