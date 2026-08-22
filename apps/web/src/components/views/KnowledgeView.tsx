import { Fragment } from "react";
import "../../styles/reports.css";
import { Icon } from "../../ui/icons";

type KnowledgeViewProps = {
  readinessStatus: any;
  bestiaryEntries: any[];
  expeditionStatus: any;
  clueData: any;
  formulas: unknown;
  loadCodex: () => Promise<void>;
};

const FORMULA_TERMS: Record<string, string> = {
  rulesVersion: "Rules version",
  openDistanceFlat: "Open-field engagement distance",
  rngMin: "Fortune (lowest roll)",
  rngMax: "Fortune (highest roll)",
  notes: "Scribe's note",
};

function formulaEntries(formulas: unknown): [string, string][] | null {
  if (
    !formulas ||
    typeof formulas !== "object" ||
    Array.isArray(formulas)
  ) {
    return null;
  }
  return Object.entries(formulas as Record<string, unknown>).map(
    ([key, value]) => [
      key,
      typeof value === "string" || typeof value === "number"
        ? String(value)
        : JSON.stringify(value ?? null),
    ],
  );
}

export function KnowledgeView({
  readinessStatus,
  bestiaryEntries,
  expeditionStatus,
  clueData,
  formulas,
  loadCodex,
}: KnowledgeViewProps) {
  const formulaRows = formulaEntries(formulas);
  return (
    <section className="card">
      <h2>Knowledge</h2>

      <h3 className="codex-heading">Dragon Readiness</h3>
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

      <h3 className="codex-heading">Bestiary</h3>
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

      <h3 className="codex-heading">Dragon Expedition</h3>
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

      <h3 className="codex-heading">Dragon Evidence</h3>
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

      <details className="codex-formulas">
        <summary className="codex-formulas-summary">
          <Icon name="flask" size={14} />
          Scribe's Formulas
        </summary>
        <div className="codex-reload-row">
          <button type="button" onClick={() => void loadCodex()}>
            Reload formulas
          </button>
        </div>
        {formulaRows ? (
          <dl className="codex-formula-list">
            {formulaRows.map(([key, value]) => (
              <Fragment key={key}>
                <dt className="codex-formula-term">
                  {FORMULA_TERMS[key] ??
                    key.replace(/([a-z])([A-Z])/g, "$1 $2")}
                </dt>
                <dd className="codex-formula-desc">{value}</dd>
              </Fragment>
            ))}
          </dl>
        ) : (
          <p className="muted">No formulas recorded in the codex yet.</p>
        )}
      </details>
    </section>
  );
}
