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
  dragonObjectives?: Array<{ id: string; title: string; description: string; complete: boolean }>;
  formulas: unknown;
  startDragonExpedition: () => Promise<void>;
  completeDragonStage: (stageNumber: number) => Promise<void>;
  startDragonWarCouncil: () => Promise<void>;
  loadCodex: () => Promise<void>;
  livingDragons?: any;
  faceScarEncounter?: (composition: Record<string, number>) => Promise<void>;
  cityStacks?: Record<string, number>;
  codifyDragonKnowledge?: (questionId: string) => Promise<void>;
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
  dragonObjectives = [],
  formulas,
  startDragonExpedition,
  completeDragonStage,
  startDragonWarCouncil,
  loadCodex,
  livingDragons,
  faceScarEncounter,
  cityStacks = {},
  codifyDragonKnowledge,
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

      <section className="dragon-presence" aria-label="Dragon presence">
        <div className="dragon-presence-art" aria-hidden="true">
          <span className="dragon-presence-wing dragon-presence-wing-left" />
          <span className="dragon-presence-wing dragon-presence-wing-right" />
          <span className="dragon-presence-eye" />
        </div>
        <div>
          <span className="eyebrow">Field notice · northern marches</span>
          <h3>The sky is not empty</h3>
          <p className="muted tiny">
            The watch has found heat where there should be frost, and tracks too
            large for any known beast. Every expedition begins with evidence,
            not allegiance.
          </p>
        </div>
      </section>

      {dragonObjectives.length > 0 && (
        <section className="r2-objectives" data-testid="dragon-objectives" aria-label="Dragon campaign objectives">
          <div className="eyebrow">The Awakening · campaign path</div>
          <h3>What changes the kingdom next</h3>
          <div className="r2-objective-grid">
            {dragonObjectives.map((objective) => (
              <div key={objective.id} className={`r2-objective ${objective.complete ? "complete" : ""}`}>
                <span aria-hidden="true">{objective.complete ? "✓" : "○"}</span>
                <div><strong>{objective.title}</strong><p className="muted tiny">{objective.description}</p></div>
              </div>
            ))}
          </div>
        </section>
      )}

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
          {readinessStatus.presence?.state === "BATTLE_READY" && (
            <div className="readiness-ready">
              Dragon War Council: spend 1,000 food, 1,000 wood, and 600 stone
              to create a persistent war plan.
              <button type="button" className="button" onClick={() => void startDragonWarCouncil()}>
                Convene council
              </button>
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

      {clueData && (
        <section className="dragon-evidence" aria-label="Dragon evidence">
          <div className="dragon-evidence-head">
            <h3 className="codex-heading">Evidence in the keep</h3>
            <span className="muted tiny">
              {clueData.clues?.length ?? 0} clue types recorded
            </span>
          </div>
          {clueData.clues?.length ? (
            <div className="clue-plates">
              {clueData.clues.map((clue: any) => (
                <article className={`clue-plate clue-${clue.rarity}`} key={clue.id}>
                  <span className="clue-plate-mark" aria-hidden="true">✦</span>
                  <strong>{clue.name}</strong>
                  <span className="muted tiny">{clue.count} recovered</span>
                  <p className="muted tiny">{clue.description}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted tiny">
              No physical evidence yet. Scout a camp and bring the first sign
              back to the scribes.
            </p>
          )}
        </section>
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
              {expeditionStatus.stages.map((stage: any, idx: number) => {
                // Completing stage N is gated on the NEXT stage's
                // requirements (server rule: entering N+1 needs them).
                const next = expeditionStatus.stages[idx + 1];
                const requires = next?.requires ?? {};
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
                          · needs {requires.scouts ?? 0} scout landings (
                          {expeditionStatus.progress?.scoutsSent ?? 0} so far),{" "}
                          {requires.camps ?? 0} camps broken (
                          {expeditionStatus.progress?.campsDefeated ?? 0} so
                          far)
                        </span>
                      ) : null}
                    </span>
                    {current && stage.type === "encounter" && (
                      <button
                        type="button"
                        data-testid="face-the-scar"
                        onClick={() =>
                          void faceScarEncounter?.({
                            levy: Math.min(40, cityStacks.levy ?? 0),
                            scout: Math.min(5, cityStacks.scout ?? 0),
                          })
                        }
                      >
                        Face the Scar
                      </button>
                    )}
                    {current && stage.type !== "encounter" && (
                      <button
                        type="button"
                        disabled={!(scoutsDone && campsDone)}
                        onClick={() =>
                          void completeDragonStage(stage.stage)
                        }
                      >
                        {stage.name}
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

      {livingDragons?.knowledge?.length > 0 && (
        <section data-testid="dragon-knowledge">
          <h3 className="codex-heading">Dragon knowledge</h3>
          {livingDragons.knowledge.map((k: any) => (
            <div key={k.questionId} className="readiness-req">
              <span>
                {k.questionId === "vane_reading" ? "Vane Reading" : "Wet silt-pack"} — {k.state}
              </span>
              {k.state === "supported" && (
                <button type="button" onClick={() => void codifyDragonKnowledge?.(k.questionId)}>
                  Codify
                </button>
              )}
            </div>
          ))}
        </section>
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
