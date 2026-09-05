import "../../styles/reports.css";
import {
  fmtTime,
  formatIntel,
  lossList,
  lootList,
  postureLabel,
  reportHeadline,
} from "../../lib/format";
import { targetPhrase } from "../../lib/labels";
import type { BattleReport, Player } from "../../lib/types";
import { Icon } from "../../ui/icons";
import type { IconName } from "../../ui/icons";

type WarViewProps = {
  player: Player;
  reports: BattleReport[];
  setUnreadReports: (value: number) => void;
  loadReports: () => Promise<void>;
  setError: (message: string | null) => void;
  onLocateReport: (x: number, y: number) => void;
};

const RESOURCE_ICONS: Partial<Record<string, IconName>> = {
  food: "food",
  wood: "wood",
  stone: "stone",
  ore: "ore",
  crownmark: "crownmark",
};

function headlineIcon(type?: string): IconName {
  if (type === "scout") return "scroll";
  if (type === "haul") return "crownmark";
  if (type === "pvp" || type === "pvp_blocked") return "crown";
  if (type === "occupy") return "shield";
  return "sword";
}

export function WarView({
  player,
  reports,
  setUnreadReports,
  loadReports,
  setError,
  onLocateReport,
}: WarViewProps) {
  return (
    <section className="card">
      <h2>War — Dispatches</h2>
      <p className="muted">
        Dispatches from the front — raids, sieges, and scouting missions
        across the realm.
      </p>
      <button
        type="button"
        onClick={() => {
          setUnreadReports(0);
          void loadReports().catch((e) =>
            setError(String(e.message ?? e)),
          );
        }}
      >
        Refresh dispatches
      </button>
      {reports.length === 0 ? (
        <div className="rpt-empty">
          <Icon name="scroll" size={20} title="No reports" />
          <p className="muted">
            No dispatches yet — pick a target in the Realm and muster a march.
          </p>
        </div>
      ) : (
        <ul className="report-cards">
          {reports.slice(0, 12).map((r) => {
            const b = r.result?.battle;
            const winner =
              b?.winner ??
              (r.result?.type === "pvp_blocked" ? "blocked" : "—");
            const youAtk = r.attackerPlayerId === player.id;
            const defenseMode = postureLabel(
              undefined,
              r.result?.harborLoot,
            );
            const won = winner === "attacker" && youAtk;
            const lost = winner === "defender" && youAtk;
            const bannerClass = won
              ? "rpt-win"
              : lost
                ? "rpt-loss"
                : "rpt-neutral";
            const bannerIcon: IconName = won
              ? "crown"
              : lost
                ? "shield"
                : "scroll";
            const bannerText =
              winner === "blocked"
                ? "Turned away — protection holds"
                : won
                  ? "Victory"
                  : lost
                    ? "Defeat"
                    : (r.result?.type ?? "report").replace(/_/g, " ");
            const lootEntries = Object.entries(r.result?.loot ?? {}).filter(
              ([, n]) => (n ?? 0) > 0,
            );
            const isScout = r.result?.type === "scout";
            const target = r.result?.target;
            return (
              <li
                key={r.id}
                className={`report-card rpt-report ${isScout ? "rpt-scout" : ""}`}
              >
                <header className="rpt-head">
                  <span className="rpt-headline">
                    <span className="rpt-headline-icon">
                      <Icon
                        name={headlineIcon(r.result?.type)}
                        size={18}
                        title="Battle report"
                      />
                    </span>
                    <h4 className="rpt-title">
                      {isScout ? "Scouting dispatch" : reportHeadline(r, player.id)}
                    </h4>
                  </span>
                  <time className="rpt-time">{fmtTime(r.createdAt)}</time>
                </header>

                {!isScout && (
                  <div className={`rpt-banner ${bannerClass}`}>
                    <Icon name={bannerIcon} size={16} />
                    <span>{bannerText}</span>
                  </div>
                )}

                {target && (
                  <p className="muted tiny rpt-meta">
                    Toward {targetPhrase(String(target.type ?? ""))} at{" "}
                    {target.x}, {target.y}
                    {r.result?.type === "pvp"
                      ? ` · ${defenseMode}`
                      : r.result?.harborLoot
                        ? ` · ${defenseMode}`
                        : ""}
                    {youAtk ? " · your march" : " · against you"}
                  </p>
                )}

                {r.result?.reason && (
                  <p className="rpt-reason">
                    <strong>Why:</strong>{" "}
                    {r.result.reason === "new_player_protection"
                      ? "The settlement is under new-lord protection."
                      : r.result.reason}
                  </p>
                )}

                {r.result?.intel && (
                  <div className="rpt-intel">
                    <span className="rpt-intel-label">Scout's intelligence</span>
                    <p className="rpt-intel-text">
                      {formatIntel(r.result.intel)}
                    </p>
                  </div>
                )}

                {b && (
                  <div className="rpt-battle">
                    <p className="rpt-battle-meta">
                      Rounds: {b.rounds ?? "—"}
                      {r.result?.harborLoot
                        ? ` · ${defenseMode}`
                        : " · fought in the field"}
                    </p>
                    <div className="rpt-loss-grid">
                      <div className="rpt-loss-col">
                        <span className="rpt-loss-head">
                          <Icon
                            name={youAtk ? "sword" : "shield"}
                            size={13}
                            title="Your losses"
                          />
                          Your losses
                        </span>
                        <span className="rpt-loss-val">
                          {lossList(
                            youAtk
                              ? b.losses?.attacker
                              : b.losses?.defender,
                          )}
                        </span>
                      </div>
                      <div className="rpt-loss-col">
                        <span className="rpt-loss-head">
                          <Icon
                            name={youAtk ? "shield" : "sword"}
                            size={13}
                            title="Enemy losses"
                          />
                          Enemy losses
                        </span>
                        <span className="rpt-loss-val">
                          {lossList(
                            youAtk
                              ? b.losses?.defender
                              : b.losses?.attacker,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rpt-loot">
                  <span className="rpt-loot-head">
                    <Icon name="crownmark" size={14} title="Loot" />
                    Spoils
                  </span>
                  {lootEntries.length > 0 ? (
                    <span className="rpt-chips">
                      {lootEntries.map(([key, amount]) => {
                        const icon = RESOURCE_ICONS[key];
                        return (
                          <span
                            key={key}
                            className={`rpt-chip${
                              key === "crownmark" ? " rpt-chip-crownmark" : ""
                            }`}
                          >
                            {icon && (
                              <span className="rpt-chip-icon">
                                <Icon name={icon} size={13} title={key} />
                              </span>
                            )}
                            +{amount} {key}
                          </span>
                        );
                      })}
                    </span>
                  ) : (
                    <span className="rpt-chip-none">
                      {lootList(r.result?.loot)}
                    </span>
                  )}
                </div>

                {target && target.x !== undefined && target.y !== undefined && (
                  <button
                    type="button"
                    className="rpt-locate"
                    onClick={() => onLocateReport(target.x!, target.y!)}
                  >
                    View the location on the map
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
