import type { ReactNode } from "react";

import "../styles/hud.css";
import { jobLabel, fmtEta, fmtNum } from "../lib/format";
import {
  intentLabel,
  targetPhrase,
  unitName,
} from "../lib/labels";
import {
  TAB_LABELS,
  type FactionMeta,
  type Tab,
  type Toast,
} from "../lib/gameConfig";
import type {
  March,
  Player,
  QueueJob,
  TutorialState,
} from "../lib/types";
import { Icon, type IconName } from "../ui/icons";

const JOB_ICONS: Record<string, IconName> = {
  build: "hammer",
  research: "flask",
  train: "sword",
};

const jobIcon = (kind: string): IconName => JOB_ICONS[kind] ?? "scroll";

const marchIcon = (intent: string): IconName =>
  intent === "reinforce" || intent === "occupy" ? "shield" : "sword";

type ShellProps = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  player: Player;
  factionMeta: FactionMeta;
  error: string | null;
  status: string;
  onDismissError: () => void;
  toasts: Toast[];
  jobs: QueueJob[];
  marches: March[];
  now: number;
  tutorial: TutorialState | null;
  unreadReports: number;
  setUnreadReports: (value: number) => void;
  loadMap: () => Promise<void>;
  loadReports: () => Promise<void>;
  loadCodex: () => Promise<void>;
  refreshKnowledge: () => Promise<void>;
  loadAlliances: () => Promise<void>;
  setError: (message: string | null) => void;
  children: ReactNode;
};

export function Shell({
  activeTab,
  onTabChange,
  player,
  factionMeta,
  error,
  status,
  onDismissError,
  toasts,
  jobs,
  marches,
  now,
  tutorial,
  unreadReports,
  setUnreadReports,
  loadMap,
  loadReports,
  loadCodex,
  refreshKnowledge,
  loadAlliances,
  setError,
  children,
}: ShellProps) {
  return (
    <div className={`shell faction-${factionMeta.accent}`}>
      <div className="toast-stack hud-toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind} hud-toast`}>
            {t.message}
          </div>
        ))}
      </div>
      <header className="topbar hud-topbar">
        <div>
          <p className="eyebrow">{factionMeta.label}</p>
          <h1>Tideforge Empires</h1>
          <p className="tag">
            {player.displayName} · Chronite {player.chronite}
            {player.protectionUntil
              ? ` · protected until ${new Date(player.protectionUntil).toLocaleString()}`
              : ""}
          </p>
        </div>
        <nav className="tabs hud-tabs" aria-label="Main">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={activeTab === t ? "active" : ""}
              onClick={() => {
                onTabChange(t);
                if (t === "realm") void loadMap().catch((e) => setError(String(e)));
                if (t === "war") {
                  setUnreadReports(0);
                  void loadReports().catch((e) => setError(String(e)));
                }
                if (t === "knowledge") {
                  void loadCodex().catch((e) => setError(String(e)));
                  void refreshKnowledge();
                }
                if (t === "alliance")
                  void loadAlliances().catch((e) => setError(String(e)));
              }}
            >
              {TAB_LABELS[t]}
              {t === "war" && unreadReports > 0 ? (
                <span className="badge">{unreadReports}</span>
              ) : null}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {error && (
          <p className="err banner hud-banner">
            {error}{" "}
            <button type="button" className="linkish" onClick={onDismissError}>
              dismiss
            </button>
          </p>
        )}
        {status && <p className="ok banner hud-banner">{status}</p>}

        {tutorial && tutorial.completed && (
          <section className="card tutorial-banner hud-tutorial" aria-live="polite">
            <div className="ops-head">
              <h2>The march is yours</h2>
            </div>
            <p>{tutorial.currentLabel}</p>
          </section>
        )}
        {tutorial && !tutorial.completed && (
          <section className="card tutorial-banner hud-tutorial" aria-live="polite">
            <div className="ops-head">
              <h2>
                Objective {Math.min(tutorial.step + 1, tutorial.totalSteps)}/
                {tutorial.totalSteps}
              </h2>
              {tutorial.progress ? (
                <span className="muted tiny">
                  {tutorial.progress.current}/{tutorial.progress.target}
                </span>
              ) : null}
            </div>
            <p>{tutorial.currentLabel}</p>
            {tutorial.progress && tutorial.progress.target > 1 ? (
              <div className="bar">
                <div
                  className="bar-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (tutorial.progress.current / tutorial.progress.target) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </div>
            ) : null}
          </section>
        )}

        {children}

        {/* Stewards' ledger sits below the world — the keep comes first. */}
        <section className="card ops hud-ops" aria-label="Queues and marches">
          <div className="ops-col">
            <h2>Queues</h2>
            {jobs.length === 0 ? (
              <p className="muted">Nothing under construction</p>
            ) : (
              <ul className="ops-list">
                {jobs.map((j) => {
                  const total = Math.max(1, j.finishesAt - j.startedAt);
                  const left = Math.max(0, j.finishesAt - now);
                  const pct = Math.min(
                    100,
                    Math.round(((total - left) / total) * 100),
                  );
                  return (
                    <li key={j.id}>
                      <div className="ops-head">
                        <span className="hud-job">
                          <span className="hud-job-icon">
                            <Icon name={jobIcon(j.kind)} size={14} />
                          </span>
                          {jobLabel(j)}
                        </span>
                        <span className="muted hud-eta">{fmtEta(left)}</span>
                      </div>
                      <div className="bar">
                        <div className="bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="ops-col">
            <h2>Marches</h2>
            {marches.length === 0 ? (
              <p className="muted">No active marches</p>
            ) : (
              <ul className="ops-list">
                {marches.map((m) => {
                  const eta =
                    m.status === "returning" && m.returnAt
                      ? m.returnAt - now
                      : m.arriveAt - now;
                  const label =
                    m.status === "returning"
                      ? "returning"
                      : m.status === "en_route"
                        ? "en route"
                        : m.status;
                  return (
                    <li key={m.id}>
                      <div className="ops-head">
                        <span className="hud-job">
                          <span className="hud-job-icon">
                            <Icon name={marchIcon(m.intent)} size={14} />
                          </span>
                          {intentLabel(m.intent)} — {targetPhrase(m.targetType)}{" "}
                          <span className="muted">({label})</span>
                        </span>
                        <span className="muted hud-eta">{fmtEta(eta)}</span>
                      </div>
                      <p className="muted tiny">
                        {Object.entries(m.composition)
                          .filter(([, n]) => n > 0)
                          .map(([k, v]) => `${fmtNum(v)} ${unitName(k)}`)
                          .join(", ") || "No troops listed"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
