import "../../styles/reports.css";
import {
  fmtTime,
  formatIntel,
  lossList,
  lootList,
  postureLabel,
  reportHeadline,
} from "../../lib/format";
import type { BattleReport, Commander, Player } from "../../lib/types";
import { Icon } from "../../ui/icons";
import type { IconName } from "../../ui/icons";

type WarViewProps = {
  player: Player;
  reports: BattleReport[];
  commandersReady: boolean;
  commanders: Commander[];
  marchLeaderId: string;
  setMarchLeaderId: (value: string) => void;
  setUnreadReports: (value: number) => void;
  loadReports: () => Promise<void>;
  setError: (message: string | null) => void;
};

const RESOURCE_ICONS: Partial<Record<string, IconName>> = {
  food: "food",
  timber: "timber",
  stone: "stone",
  iron: "iron",
  coin: "coin",
};

function headlineIcon(type?: string): IconName {
  if (type === "scout") return "scroll";
  if (type === "haul") return "coin";
  if (type === "pvp" || type === "pvp_blocked") return "crown";
  if (type === "occupy") return "shield";
  return "sword";
}

export function WarView({
  player,
  reports,
  commandersReady,
  commanders,
  marchLeaderId,
  setMarchLeaderId,
  setUnreadReports,
  loadReports,
  setError,
}: WarViewProps) {
  return (
    <section className="card">
      <h2>War / Reports</h2>
      <p className="muted">
        Dispatches from the front — raids, sieges, and scouting missions
        across the realm.
      </p>
      {commandersReady && (
        <div className="row form-inline">
          <label>
            Leader
            <select
              value={marchLeaderId}
              onChange={(e) => setMarchLeaderId(e.target.value)}
            >
              <option value="">None</option>
              {commanders
                .filter((c) => c.state === "available")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {"★".repeat(Math.max(0, c.stars))}
                  </option>
                ))}
            </select>
          </label>
          <span className="muted tiny">
            Optional leader joins marches sent from Realm actions
            (attack/occupy/scout/reinforce).
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setUnreadReports(0);
          void loadReports().catch((e) =>
            setError(String(e.message ?? e)),
          );
        }}
      >
        Refresh reports
      </button>
      {reports.length === 0 ? (
        <div className="rpt-empty">
          <Icon name="scroll" size={20} title="No reports" />
          <p className="muted">No reports yet — attack a camp or player</p>
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
            return (
              <li key={r.id} className="report-card rpt-report">
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
                      {reportHeadline(r, player.id)}
                    </h4>
                  </span>
                  <time className="rpt-time">{fmtTime(r.createdAt)}</time>
                </header>

                <div className={`rpt-banner ${bannerClass}`}>
                  <Icon name={bannerIcon} size={16} />
                  <span>{bannerText}</span>
                </div>

                {r.result?.target && (
                  <p className="muted tiny rpt-meta">
                    Target {r.result.target.type} @ {r.result.target.x},
                    {r.result.target.y}
                    {r.result.type === "pvp"
                      ? ` · ${defenseMode}`
                      : r.result.harborLoot
                        ? " · harbor loot"
                        : ""}
                    {youAtk ? " · you attacked" : " · you defended"}
                  </p>
                )}

                {r.result?.reason && (
                  <p className="rpt-reason">
                    <strong>Reason:</strong> {r.result.reason}
                  </p>
                )}

                {r.result?.intel && (
                  <div className="rpt-intel">
                    <span className="rpt-intel-label">Scout's intel</span>
                    <p className="rpt-intel-text">
                      {formatIntel(r.result.intel)}
                    </p>
                  </div>
                )}

                {b && (
                  <div className="rpt-battle">
                    <p className="rpt-battle-meta">
                      Rounds: {b.rounds ?? "—"}
                      {b.note ? ` · ${b.note}` : ""}
                      {r.result?.harborLoot
                        ? " · no combat (harbor)"
                        : " · combat resolved"}
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
                    <Icon name="coin" size={14} title="Loot" />
                    Loot
                  </span>
                  {lootEntries.length > 0 ? (
                    <span className="rpt-chips">
                      {lootEntries.map(([key, amount]) => {
                        const icon = RESOURCE_ICONS[key];
                        return (
                          <span
                            key={key}
                            className={`rpt-chip${
                              key === "coin" ? " rpt-chip-coin" : ""
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
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
