import type { FactionMeta } from "../../lib/gameConfig";
import { postureLabel } from "../../lib/labels";
import type { City, Player } from "../../lib/types";

type SettingsViewProps = {
  player: Player;
  city: City;
  factionMeta: FactionMeta;
  devMode: boolean;
  setPosture: (posture: string) => Promise<void>;
  grantDev: (body: Record<string, unknown>, label: string) => Promise<void>;
  foundBrine: () => Promise<void>;
  foundStone: () => Promise<void>;
  foundHolding: (kind: string) => Promise<void>;
  logout: () => void;
};

export function SettingsView({
  player,
  city,
  factionMeta,
  devMode,
  setPosture,
  grantDev,
  foundBrine,
  foundStone,
  foundHolding,
  logout,
}: SettingsViewProps) {
  return (
    <section className="card">
      <h2>Settings</h2>
      <p className="faction-blurb">{factionMeta.blurb}</p>
      <p>
        Protection:{" "}
        {player.protectionUntil
          ? `until ${new Date(player.protectionUntil).toLocaleString()}`
          : "none — the realm is dangerous now"}
      </p>
      <p>Defense posture: {postureLabel(city.defensePosture)}</p>
      <div className="row">
        <button type="button" onClick={() => void setPosture("withdraw")}>
          Withdraw
        </button>
        <button type="button" onClick={() => void setPosture("garrison")}>
          Garrison
        </button>
        <button type="button" onClick={() => void setPosture("full")}>
          Full defense
        </button>
      </div>
      <p className="muted tiny">
        Withdraw keeps your people safe but leaves stores to raiders. Garrison
        meets the enemy with part of the army. Full defense answers with every
        sword in the keep.
      </p>

      <button type="button" className="danger" onClick={logout}>
        Log out
      </button>

      {city.kind === "stonekeel" && (
        <div className="charter-card">
          <strong>Forest Frontier</strong>
          <p className="muted tiny">Research the Forest Frontier Charter in the Castle, then found Cinderreach here. Its ranger and warhound companies are built for woodland campaigns.</p>
          <button type="button" onClick={() => void foundHolding("cinderreach")}>Found Cinderreach</button>
        </div>
      )}

      {devMode && (
        <details className="dev-panel">
          <summary>Developer tools</summary>
          <p className="muted tiny">
            Demo unlocks — not part of the player journey.
          </p>
          <div className="row">
            <button type="button" onClick={() => void foundBrine()}>
              Dev: found Brinehold
            </button>
            <button type="button" onClick={() => void foundStone()}>
              Dev: found Stonekeel
            </button>
            <button
              type="button"
              onClick={() =>
                void grantDev(
                  { units: { levy: 100, bowman: 50, scout: 10 } },
                  "Granted starter companies",
                )
              }
            >
              Dev: grant starter companies
            </button>
          </div>
        </details>
      )}
    </section>
  );
}
