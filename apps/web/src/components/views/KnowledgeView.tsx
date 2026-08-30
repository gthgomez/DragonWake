import { Fragment } from "react";
import "../../styles/reports.css";
import { Icon } from "../../ui/icons";
import type { BestiaryEntryDef } from "../../lib/types";

type KnowledgeViewProps = {
  readinessStatus: any;
  bestiaryEntries: any[];
  bestiaryDefs: BestiaryEntryDef[];
  expeditionStatus: any;
  clueData: any;
  formulas: unknown;
  startDragonExpedition: () => Promise<void>;
  completeDragonStage: (stageNumber: number) => Promise<void>;
  loadCodex: () => Promise<void>;
};

/** Encounter thresholds at which observation deepens (server rule). */
const OBS_THRESHOLDS = [3, 7, 15, 30];

const READINESS_HINTS: Record<string, string> = {
  bestiary_threshold:
    "Break camps and record what your company finds — every creature observed is a page in the Bestiary.",
  research_level:
    "Any study advanced at your keep deepens the scholarship of the realm.",
  item_count:
    "Distinct dragon materials — clues and relics gathered from camps and expeditions.",
  camps_defeated:
    "Camps of different levels each count once. Wider hunts, broader knowledge.",
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

function nextThreshold(encounters: number): number | null {
  for (const t of OBS_THRESHOLDS) if (encounters < t) return t;
  return null;
}

export function KnowledgeView({
  readinessStatus,
  bestiaryEntries,
  bestiaryDefs,
  expeditionStatus,
  clueData,
  formulas,
  startDragonExpedition,
  completeDragonStage,
  loadCodex,
}: KnowledgeViewProps) {
  const formulaRows = formulaEntries(formulas);
  const studiedCount = bestiaryEntries.filter(
    (e) => (e.observationLevel ?? 0) >= 1,
  ).length;

  return (
    <section className="card">
      <header className="knowledge-head">
        <span className="knowledge-silhouette" aria-hidden="true">
          <Icon name="dragon" size={44} />
        </span>
        <div>
          <h2>Knowledge</h2>
          <p className="muted tiny">
            Wings have been seen over the border fens. What the realm knows of
            dragons lives here — and what it does not yet know.
          </p>
        </div>
      </header>

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
              <span aria-hidden="true">{req.met ? "✓" : "○"}</span>
              <span>
                {req.description}
                {!req.met && READINESS_HINTS[req.id] && (
                  <span className="muted tiny readiness-hint">
                    {" "}
                    — {READINESS_HINTS[req.id]}
                  </span>
                )}
              </span>
            </div>
          ))}
          {readinessStatus.ready && (
            <div className="readiness-ready">
              The realm stands ready — the Dragon Expedition may set out.
            </div>
          )}
        </div>
      ) : (
        <p className="muted">The scribes are consulting their records…</p>
      )}

      <h3 className="codex-heading">Bestiary</h3>
      {bestiaryEntries.length > 0 ? (
        <div className="bestiary-grid">
          {bestiaryEntries.map((entry: any, i: number) => {
            const def = bestiaryDefs.find((d) => d.id === entry.entryId);
            const obs = entry.observationLevel ?? 0;
            const enc = entry.encounterCount ?? 0;
            const next = nextThreshold(enc);
            const known = obs >= 1;
            const weakness = def?.confirmed_weakness ?? def?.suspected_weakness;
            return (
              <div
                key={entry.entryId ?? i}
                className={`bestiary-entry ${known ? "bestiary-known" : "bestiary-rumor"}`}
              >
                <div className="bestiary-subject">
                  <Icon name="dragon" size={16} />
                  {known
                    ? (def?.subject ?? entry.entryId)
                    : "Unidentified creature"}
                </div>
                <div className="bestiary-level">
                  Study {obs}/4 · {enc} encounter{enc === 1 ? "" : "s"}
                  {next ? ` · ${next - enc} more to deeper study` : " · fully studied"}
                </div>
                {known && def?.habitat && (
                  <div className="bestiary-facts">
                    Haunts: {def.habitat}
                  </div>
                )}
                {known && def?.known_attacks?.length ? (
                  <div className="bestiary-facts">
                    Known attacks: {def.known_attacks.join(", ")}
                  </div>
                ) : null}
                {known && weakness && (
                  <div className="bestiary-facts">
                    Weakness (as known): {weakness}
                  </div>
                )}
                {!known && (
                  <div className="bestiary-facts muted tiny">
                    Rumors only — more encounters will give this creature a
                    name.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="muted">
          No creatures recorded yet. Camps, wilds, and expeditions will fill
          these pages — the scribes wait with quill ready.
        </p>
      )}
      {studiedCount > 0 && (
        <p className="muted tiny">
          {studiedCount} creature{studiedCount === 1 ? "" : "s"} under study.
        </p>
      )}

      <h3 className="codex-heading">Dragon Expedition</h3>
      {expeditionStatus ? (
        <div>
          <div className="expedition-name">{expeditionStatus.name}</div>
          {expeditionStatus.charterEarned ? (
            <div className="expedition-complete">
              The charter is earned — found your Marcher Keep from the Castle.
            </div>
          ) : (expeditionStatus.currentStage ?? 0) > 0 ? (
            <div>
              <div className="expedition-stage">
                Stage {expeditionStatus.currentStage} of{" "}
                {expeditionStatus.stages.length}
              </div>
              {expeditionStatus.stages.map((stage: any) => {
                const requires = stage.requires ?? {};
                const scoutsDone =
                  (expeditionStatus.progress?.scoutsSent ?? 0) >=
                  (requires.scouts ?? 0);
                const campsDone =
                  (expeditionStatus.progress?.campsDefeated ?? 0) >=
                  (requires.camps ?? 0);
                const current = stage.stage === expeditionStatus.currentStage;
                return (
                  <div
                    key={stage.stage}
                    className={`expedition-stage-item ${
                      stage.stage < expeditionStatus.currentStage
                        ? "completed"
                        : current
                          ? "current"
                          : "locked"
                    }`}
                  >
                    <span aria-hidden="true">
                      {stage.stage < expeditionStatus.currentStage
                        ? "✓"
                        : current
                          ? "→"
                          : "○"}
                    </span>
                    <span>
                      {stage.name}
                      {requires.scouts || requires.camps ? (
                        <span className="muted tiny">
                          {" "}
                          · requires {requires.scouts ?? 0} scout landings (
                          {scoutsDone ? "done" : "pending"}),{" "}
                          {requires.camps ?? 0} camps broken (
                          {campsDone ? "done" : "pending"})
                        </span>
                      ) : null}
                    </span>
                    {current && (
                      <button
                        type="button"
                        disabled={!(scoutsDone && campsDone)}
                        onClick={() =>
                          void completeDragonStage(stage.stage)
                        }
                      >
                        Accomplish this stage
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <p className="muted">
                The expedition waits on the readiness of the realm — every
                requirement above must be met before it sets out.
              </p>
              {readinessStatus?.ready && (
                <button
                  type="button"
                  className="primary"
                  onClick={() => void startDragonExpedition()}
                >
                  Set out on the Dragon Expedition
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="muted">The expedition's banners are being counted…</p>
      )}

      <h3 className="codex-heading">Dragon Evidence</h3>
      {clueData && clueData.clues?.length > 0 ? (
        <div>
          {clueData.clues.map((clue: any) => (
            <div
              key={clue.id}
              className={`clue-item clue-${clue.rarity}`}
            >
              <span className="clue-name">
                <Icon name="dragon" size={13} /> {clue.name}
              </span>
              <span className="clue-count">×{clue.count}</span>
              <span className="clue-desc">{clue.description}</span>
            </div>
          ))}
          {clueData.dragonMaterials > 0 && (
            <div className="dragon-materials">
              Dragon materials gathered: {clueData.dragonMaterials}
            </div>
          )}
          {clueData.dailyClueCap && (
            <p className="muted tiny">
              Evidence recovered today: {clueData.dailyClueCap.used}/
              {clueData.dailyClueCap.cap} — the huntsmen can only carry so
              much.
            </p>
          )}
        </div>
      ) : (
        <p className="muted">
          No dragon evidence yet. Victories over larger camps sometimes yield
          scales, claws, and stranger things.
        </p>
      )}

      <details className="codex-formulas">
        <summary className="codex-formulas-summary">
          <Icon name="flask" size={14} />
          Scribe's Table (advanced)
        </summary>
        <div className="codex-reload-row">
          <button type="button" onClick={() => void loadCodex()}>
            Reload the tables
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
