import { PLOT_ASSIGN_COST } from "../../lib/gameConfig";
import { canAfford, plotLabel } from "../../lib/format";
import type { City } from "../../lib/types";

type LandsViewProps = {
  city: City;
  plotPick: string;
  setPlotPick: (value: string) => void;
  assignPlot: (slotIndex: number) => Promise<void>;
  upgradePlot: (slotIndex: number, level: number) => Promise<void>;
};

export function LandsView({
  city,
  plotPick,
  setPlotPick,
  assignPlot,
  upgradePlot,
}: LandsViewProps) {
  const rates = city.productionPerHour;

  return (
    <section className="card">
      <h2>Lands</h2>
      <p className="muted">
        Assign empty plots ({PLOT_ASSIGN_COST.food} Food +{" "}
        {PLOT_ASSIGN_COST.timber} Timber). Upgrade scales 50×level
        of each resource. Max L5.
      </p>
      <label>
        New plot type
        <select
          value={plotPick}
          onChange={(e) => setPlotPick(e.target.value)}
        >
          <option value="farm">food Farm</option>
          <option value="lumber_yard">Drift Dock</option>
          <option value="quarry">stone Cut</option>
          <option value="mine">Slag Pit</option>
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
                    food: 50 * p.level,
                    timber: 50 * p.level,
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
          Live rates: Food +{rates.food}/h · Timber +{rates.timber}
          /h · Stone +{rates.stone}/h · Iron +{rates.iron}/h
        </p>
      )}
    </section>
  );
}
