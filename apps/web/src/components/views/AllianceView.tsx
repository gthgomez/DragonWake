import { useEffect, useState } from "react";

import { fmtTime, formatIntel } from "../../lib/format";
import type {
  AllianceInfo,
  AllianceSummary,
  ChatMessage,
  WorldEventDto,
} from "../../lib/types";
import "../../styles/remediation-social.css";

type AllianceMember = NonNullable<AllianceInfo["members"]>[number];

type AllianceViewProps = {
  alliance: AllianceInfo | null;
  chat: ChatMessage[];
  chatBody: string;
  setChatBody: (value: string) => void;
  sendChat: () => Promise<void>;
  allyName: string;
  setAllyName: (value: string) => void;
  allyTag: string;
  setAllyTag: (value: string) => void;
  createAlly: () => Promise<void>;
  joinTag: string;
  setJoinTag: (value: string) => void;
  joinAlly: (tagOrId: { tag?: string; allianceId?: string }) => Promise<void>;
  loadAlliances: () => Promise<void>;
  setError: (message: string | null) => void;
  allianceList: AllianceSummary[];
  sharedIntel: WorldEventDto[];
};

/** Rank nouns for the member roster — no raw enums reach the player. */
const RANK_LABELS: Record<string, string> = {
  leader: "Leader",
  officer: "Officer",
  member: "Member",
};

const RANK_ORDER: Record<string, number> = {
  leader: 0,
  officer: 1,
  member: 2,
};

function rankLabel(rank: string): string {
  return RANK_LABELS[rank] ?? "Member";
}

function memberCountLabel(count: number): string {
  return `${count} ${count === 1 ? "member" : "members"}`;
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Player-readable summary of shared scout intel. Reuses the canonical
 * `formatIntel` (also used by the War ledger) so raw payload keys and ids
 * never reach the player; `formatIntel`'s JSON last-resort is suppressed.
 */
function sharedIntelText(intel: unknown): string {
  if (typeof intel === "string") return intel;
  if (!intel || typeof intel !== "object") return "";
  const record = intel as Record<string, unknown>;
  if (typeof record.summary === "string" && record.summary) return record.summary;
  const formatted = formatIntel(record);
  return formatted.trim().startsWith("{") ? "" : formatted;
}

export function AllianceView({
  alliance,
  chat,
  chatBody,
  setChatBody,
  sendChat,
  allyName,
  setAllyName,
  allyTag,
  setAllyTag,
  createAlly,
  joinTag,
  setJoinTag,
  joinAlly,
  loadAlliances,
  setError,
  allianceList,
  sharedIntel,
}: AllianceViewProps) {
  const [listBusy, setListBusy] = useState(false);
  const [listLoaded, setListLoaded] = useState(false);
  // The roster survives the `/me` poll, which refreshes the banner without
  // its member list every couple of seconds.
  const [roster, setRoster] = useState<AllianceMember[]>([]);

  // Auto-load the banner list when the view opens, and re-pull the roster
  // whenever the sworn banner changes (create/join moves alliance.id).
  useEffect(() => {
    let active = true;
    setListBusy(true);
    void loadAlliances()
      .catch((e) => {
        if (active) setError(errorText(e));
      })
      .finally(() => {
        if (active) {
          setListBusy(false);
          setListLoaded(true);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alliance?.id]);

  // Keep the last complete roster; a banner summary without members must not
  // erase what we already know.
  useEffect(() => {
    if (alliance?.members && alliance.members.length > 0) {
      setRoster(alliance.members);
    }
  }, [alliance?.members]);

  useEffect(() => {
    if (!alliance) setRoster([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alliance?.id]);

  const refreshList = () => {
    setListBusy(true);
    void loadAlliances()
      .catch((e) => setError(errorText(e)))
      .finally(() => {
        setListBusy(false);
        setListLoaded(true);
      });
  };

  const members = [...roster].sort(
    (a, b) => (RANK_ORDER[a.rank] ?? 9) - (RANK_ORDER[b.rank] ?? 9),
  );

  return (
    <section className="card">
      <header className="castle-head">
        <div>
          <h2>Alliance</h2>
          <p className="muted tiny">
            Banners bind lords together — a shared tag, a shared roster, and one
            war council.
          </p>
        </div>
      </header>

      {alliance ? (
        <>
          <div className="ally-banner" data-testid="alliance-banner">
            <div>
              <h3>
                {alliance.name} <span className="muted tiny">[{alliance.tag}]</span>
              </h3>
              <p className="muted tiny">
                Share tag <code>{alliance.tag}</code> so others can join.
              </p>
            </div>
            <span className="ally-count">{memberCountLabel(members.length)}</span>
          </div>

          <section aria-label="Alliance members">
            <h3>Members</h3>
            {members.length === 0 ? (
              <p className="muted tiny" data-testid="alliance-roster-empty">
                The roster is being mustered — refresh the banner list in a
                moment.
              </p>
            ) : (
              <ul className="plot-list" data-testid="alliance-roster">
                {members.map((member) => (
                  <li key={member.playerId} className="plot-row">
                    <span>{member.displayName ?? "Unnamed lord"}</span>
                    <span className="muted tiny">{rankLabel(member.rank)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="row form-inline">
            <input
              value={chatBody}
              onChange={(e) => setChatBody(e.target.value)}
              placeholder="Alliance chat"
              aria-label="Message to the alliance"
            />
            <button type="button" onClick={() => void sendChat()}>
              Send
            </button>
          </div>
          <ul>
            {chat.map((m, i) => (
              <li key={m.id ?? i}>
                <span className="muted tiny">
                  {m.fromPlayerName ?? "Messenger"}
                  {m.createdAt ? ` · ${fmtTime(m.createdAt)}` : ""}
                </span>
                : {m.body}
              </li>
            ))}
          </ul>

          <section aria-label="Shared intelligence">
            <h3>Shared intelligence</h3>
            {sharedIntel.length === 0 ? (
              <p className="muted tiny">
                Allied scouts have not shared a report yet.
              </p>
            ) : (
              <ul className="plot-list">
                {sharedIntel.map((event) => {
                  const intel = sharedIntelText(event.data?.intel);
                  return (
                    <li key={event.seq} className="plot-row">
                      <div>
                        <strong>{event.message}</strong>
                        {intel ? (
                          <span className="muted tiny"> · {intel}</span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : (
        <>
          <h3>Create</h3>
          <div className="row form-inline">
            <input
              value={allyName}
              onChange={(e) => setAllyName(e.target.value)}
              placeholder="Name"
              aria-label="Alliance name"
            />
            <input
              value={allyTag}
              onChange={(e) => setAllyTag(e.target.value)}
              placeholder="Tag"
              aria-label="Alliance tag"
            />
            <button type="button" onClick={() => void createAlly()}>
              Create alliance
            </button>
          </div>

          <h3>Join by tag</h3>
          <div className="row form-inline">
            <input
              value={joinTag}
              onChange={(e) => setJoinTag(e.target.value)}
              placeholder="e.g. TIDE"
              aria-label="Alliance tag to join"
            />
            <button
              type="button"
              onClick={() => void joinAlly({ tag: joinTag })}
            >
              Join tag
            </button>
          </div>

          <section aria-label="Alliances" className="ally-discovery">
            <div className="ally-list-head">
              <h3>Banners of the realm</h3>
              <button
                type="button"
                onClick={refreshList}
                disabled={listBusy}
                data-testid="alliance-refresh"
              >
                {listBusy ? "Refreshing…" : "Refresh list"}
              </button>
            </div>
            {allianceList.length > 0 ? (
              <ul className="plot-list" data-testid="alliance-list">
                {allianceList.map((a) => (
                  <li key={a.id} className="plot-row">
                    <div>
                      <strong>{a.name}</strong>{" "}
                      <span className="muted tiny">[{a.tag}]</span>
                      <span className="muted tiny">
                        {" "}
                        · {memberCountLabel(a.memberCount)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void joinAlly({ allianceId: a.id })}
                    >
                      Join
                    </button>
                  </li>
                ))}
              </ul>
            ) : listBusy && !listLoaded ? (
              <p className="muted tiny" data-testid="alliance-loading">
                Searching the realm for banners…
              </p>
            ) : (
              <div className="ally-empty" data-testid="alliance-empty">
                <p>
                  <strong>
                    No alliances have been founded yet — be the first.
                  </strong>
                </p>
                <p className="muted tiny">
                  Found one above with a name and a banner tag, then share the
                  tag so other lords can swear to it.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
