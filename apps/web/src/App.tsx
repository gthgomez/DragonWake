import { useEffect, useState } from "react";

type Health = {
  ok: boolean;
  service: string;
  version: string;
  time: string;
};

const apiBase = import.meta.env.VITE_API_URL ?? "";

export function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/health`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as Health;
        if (!cancelled) {
          setHealth(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="shell">
      <header>
        <h1>Tideforge Empires</h1>
        <p className="tag">MVP Beta · Scaffold A0</p>
      </header>
      <main>
        <section className="card">
          <h2>API health</h2>
          {error && (
            <p className="err">
              Cannot reach API ({error}). Start server:{" "}
              <code>pnpm dev:server</code>
            </p>
          )}
          {health && (
            <ul>
              <li>
                <strong>ok:</strong> {String(health.ok)}
              </li>
              <li>
                <strong>service:</strong> {health.service}
              </li>
              <li>
                <strong>version:</strong> {health.version}
              </li>
              <li>
                <strong>time:</strong> {health.time}
              </li>
            </ul>
          )}
          {!health && !error && <p>Checking…</p>}
        </section>
        <section className="card muted">
          <p>
            Placeholder UI. City / map / war screens land in slice A9. Next: A1
            combat resolver + matchup tests.
          </p>
        </section>
      </main>
    </div>
  );
}
