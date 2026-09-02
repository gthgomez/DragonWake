import { fmtTime } from "../../lib/format";
import type {
  AllianceInfo,
  AllianceSummary,
  ChatMessage,
  WorldEventDto,
} from "../../lib/types";

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
  return (
    <section className="card">
      <h2>Alliance</h2>
      {alliance ? (
        <>
          <p>
            {alliance.name} [{alliance.tag}]
          </p>
          <p className="muted tiny">
            Share tag <code>{alliance.tag}</code> so others can join.
          </p>
          <section aria-label="Alliance members">
            <h3>Members</h3>
            <ul className="plot-list">
              {(alliance.members ?? []).map((member) => (
                <li key={member.playerId} className="plot-row">
                  <span>{member.displayName ?? "Unnamed lord"}</span>
                  <span className="muted tiny">{member.rank}</span>
                </li>
              ))}
            </ul>
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
              <p className="muted tiny">Allied scouts have not shared a report yet.</p>
            ) : (
              <ul className="plot-list">
                {sharedIntel.map((event) => (
                  <li key={event.seq} className="plot-row">
                    <div>
                      <strong>{event.message}</strong>
                      <span className="muted tiny">
                        {event.data?.intel ? ` · ${JSON.stringify(event.data.intel)}` : ""}
                      </span>
                    </div>
                  </li>
                ))}
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
            <button
              type="button"
              onClick={() =>
                void loadAlliances().catch((e) =>
                  setError(String(e.message ?? e)),
                )
              }
            >
              Refresh list
            </button>
          </div>
          {allianceList.length > 0 && (
            <ul className="plot-list">
              {allianceList.map((a) => (
                <li key={a.id} className="plot-row">
                  <div>
                    {a.name} [{a.tag}] · {a.memberCount} members
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
          )}
        </>
      )}
    </section>
  );
}
