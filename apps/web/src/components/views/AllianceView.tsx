import { fmtTime } from "../../lib/format";
import type {
  AllianceInfo,
  AllianceSummary,
  ChatMessage,
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
          <div className="row form-inline">
            <input
              value={chatBody}
              onChange={(e) => setChatBody(e.target.value)}
              placeholder="Alliance chat"
            />
            <button type="button" onClick={() => void sendChat()}>
              Send
            </button>
          </div>
          <ul>
            {chat.map((m, i) => (
              <li key={i}>
                <span className="muted tiny">
                  {m.fromPlayerName ?? "Messenger"}
                  {m.createdAt ? ` · ${fmtTime(m.createdAt)}` : ""}
                </span>
                : {m.body}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <h3>Create</h3>
          <div className="row form-inline">
            <input
              value={allyName}
              onChange={(e) => setAllyName(e.target.value)}
              placeholder="Name"
            />
            <input
              value={allyTag}
              onChange={(e) => setAllyTag(e.target.value)}
              placeholder="Tag"
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
