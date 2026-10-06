import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The hook talks to the server only through this module — mock it so tests
// assert the logout contract without a backend.
vi.mock("../lib/api", () => ({
  api: vi.fn(),
}));

import { api } from "../lib/api";
import { useGameActions, type UseGameActionsDeps } from "./useGameActions";

const apiMock = vi.mocked(api);

function makeDeps(overrides: Partial<UseGameActionsDeps> = {}) {
  const setters = {
    setToken: vi.fn(),
    setPlayer: vi.fn(),
    setCities: vi.fn(),
    setCityId: vi.fn(),
    setAlliance: vi.fn(),
    setChat: vi.fn(),
    setChatBody: vi.fn(),
    setTutorial: vi.fn(),
    setJobs: vi.fn(),
    setMarches: vi.fn(),
    setCommanders: vi.fn(),
    setCommandersReady: vi.fn(),
    setMarchLeaderId: vi.fn(),
  };
  const deps: UseGameActionsDeps = {
    token: "tok-123",
    city: null,
    loadMap: vi.fn(),
    setError: vi.fn(),
    setStatus: vi.fn(),
    pushToast: vi.fn(),
    refreshMe: vi.fn(),
    refreshQueues: vi.fn(),
    refreshMarches: vi.fn(),
    refreshKnowledge: vi.fn(),
    displayName: "Tester",
    faction: "northern_kingdom",
    units: [],
    researchDefs: [],
    comp: {},
    marchLeaderId: "",
    allyName: "",
    allyTag: "",
    alliance: null,
    chatBody: "",
    ...setters,
    ...overrides,
  };
  return { deps, setters };
}

describe("logout", () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = { dragonwake_token: "tok-123" };
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        store = {};
      },
    });
    apiMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the server logout endpoint before clearing local state", async () => {
    const events: string[] = [];
    apiMock.mockImplementation(() => {
      events.push("server-logout");
      return Promise.resolve(undefined);
    });
    const { deps, setters } = makeDeps();
    setters.setToken.mockImplementation(() => events.push("clear-local"));

    const actions = useGameActions(deps);
    await actions.logout();

    expect(apiMock).toHaveBeenCalledTimes(1);
    expect(apiMock).toHaveBeenCalledWith("/api/v1/auth/logout", "tok-123", {
      method: "POST",
    });
    // Server revocation happens first; local state clears after.
    expect(events).toEqual(["server-logout", "clear-local"]);
    expect(store.dragonwake_token).toBeUndefined();
    expect(setters.setToken).toHaveBeenCalledWith(null);
    expect(setters.setPlayer).toHaveBeenCalledWith(null);
    expect(setters.setCities).toHaveBeenCalledWith([]);
    expect(setters.setJobs).toHaveBeenCalledWith([]);
    expect(setters.setMarches).toHaveBeenCalledWith([]);
    expect(setters.setCommanders).toHaveBeenCalledWith([]);
    expect(setters.setCommandersReady).toHaveBeenCalledWith(false);
    expect(setters.setMarchLeaderId).toHaveBeenCalledWith("");
  });

  it("clears local state even when the server call fails", async () => {
    apiMock.mockRejectedValue(new Error("network down"));
    const { deps, setters } = makeDeps();

    const actions = useGameActions(deps);
    await expect(actions.logout()).resolves.toBeUndefined();

    expect(apiMock).toHaveBeenCalledWith("/api/v1/auth/logout", "tok-123", {
      method: "POST",
    });
    expect(store.dragonwake_token).toBeUndefined();
    expect(setters.setToken).toHaveBeenCalledWith(null);
    expect(setters.setPlayer).toHaveBeenCalledWith(null);
  });

  it("skips the server call when there is no token", async () => {
    const { deps, setters } = makeDeps({ token: null });

    const actions = useGameActions(deps);
    await actions.logout();

    expect(apiMock).not.toHaveBeenCalled();
    expect(store.dragonwake_token).toBeUndefined();
    expect(setters.setToken).toHaveBeenCalledWith(null);
  });
});
