import type { Toast, FactionMeta } from "../lib/gameConfig";
import { FACTION_META } from "../lib/gameConfig";
import "../styles/hud.css";

const ACCENT_COLOR: Record<string, string> = {
  brine: "var(--faction-brine)",
  ash: "var(--faction-ash)",
  sky: "var(--faction-sky)",
  moss: "var(--faction-moss)",
};

type LoginViewProps = {
  toasts: Toast[];
  error: string | null;
  factionMeta: FactionMeta;
  displayName: string;
  setDisplayName: (value: string) => void;
  faction: string;
  setFaction: (value: string) => void;
  loginGuest: () => Promise<void>;
};

export function LoginView({
  toasts,
  error,
  factionMeta,
  displayName,
  setDisplayName,
  faction,
  setFaction,
  loginGuest,
}: LoginViewProps) {
  return (
    <div className={`shell faction-${factionMeta.accent} hud-login`}>
      <div className="toast-stack hud-toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind} hud-toast`}>
            {t.message}
          </div>
        ))}
      </div>
      <header className="hero hud-hero">
        <p className="eyebrow">Tideforge Empires · MVP Beta</p>
        <h1>Claim a keep in a dangerous age</h1>
        <p className="tag">{factionMeta.blurb}</p>
      </header>
      <main>
        <section className="card hud-login-card">
          <h2>Create guest</h2>
          {error && <p className="err">{error}</p>}
          <label>
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label>
            Faction
            <select
              value={faction}
              onChange={(e) => setFaction(e.target.value)}
            >
              {Object.entries(FACTION_META).map(([id, meta]) => (
                <option
                  key={id}
                  value={id}
                  style={{
                    background: `color-mix(in srgb, ${
                      ACCENT_COLOR[meta.accent] ?? "var(--accent)"
                    } 28%, #201c16)`,
                    color: "var(--text)",
                  }}
                >
                  {meta.label}
                </option>
              ))}
            </select>
          </label>
          <p className="faction-blurb">{FACTION_META[faction]?.blurb}</p>
          <button
            type="button"
            className="primary"
            onClick={() => void loginGuest()}
          >
            Enter realm
          </button>
          <p className="muted">Guest keeps are saved on this realm.</p>
        </section>
      </main>
    </div>
  );
}
