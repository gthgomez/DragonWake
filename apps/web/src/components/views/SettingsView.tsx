import type { FactionMeta } from "../../lib/gameConfig";
import type { City, Player } from "../../lib/types";

type SettingsViewProps = {
  player: Player;
  city: City;
  factionMeta: FactionMeta;
  devMode: boolean;
  setPosture: (posture: string) => Promise<void>;
  grantDev: (body: Record<string, unknown>, label: string) => Promise<void>;
  logout: () => void;
};

export function SettingsView({
  player,
  city,
  factionMeta,
  setPosture,
  logout,
}: SettingsViewProps) {
  return (
    <section className="card">
      <h2>Settings</h2>
      <p className="faction-blurb">{factionMeta.blurb}</p>
      <p>
        Protection:{" "}
        {player.protectionUntil
          ? `until ${player.protectionUntil}`
          : "none"}
      </p>
      <p>Defense posture: {city.defensePosture}</p>
      <div className="row">
        <button type="button" onClick={() => void setPosture("withdraw")}>
          Withdraw
        </button>
        <button type="button" onClick={() => void setPosture("garrison")}>
          Garrison
        </button>
        <button type="button" onClick={() => void setPosture("full")}>
          Full
        </button>
      </div>

      <button type="button" className="danger" onClick={logout}>
        Log out
      </button>
    </section>
  );
}
