# ZCode Capability Matrix for the Competitive Product Lab

Status: **CURRENT AUTHORITY** — what the ZCode + GLM environment actually
supports for [`COMPETITIVE_PRODUCT_LAB.md`](COMPETITIVE_PRODUCT_LAB.md)
workflows.

- **Test date:** 2026-09-05 (hardening pass)
- **Model:** GLM-5.3 Flash (`builtin:zai-coding-plan/GLM-5.3-Flash`)
- **ZCode version:** UNKNOWN — not CLI-discoverable in the installed
  environment (`~/.zcode/cli/` exposes no version file/flag)
- **Evidence used:** direct controlled tests this session (marked
  VERIFIED_*), the installed ZCode configuration documentation
  (`zcode-guide:zcode-configuration-guide` skill), and the installed skill
  registry. Anything not directly tested keeps its conservative label.

Re-verify after tool upgrades. Do not upgrade UNKNOWN/SUPPORTED_WITH_*
labels based on documentation alone.

## Capability results

| Capability | Result | Evidence |
| --- | --- | --- |
| Repository exploration | **VERIFIED_SUPPORTED** | File/terminal tools used throughout 2026-09-05 sessions |
| Terminal execution | **VERIFIED_SUPPORTED** | Bash tool (Git Bash, Windows); pnpm/git/playwright/node all exercised |
| Primary-agent browser automation (Playwright from terminal) | **VERIFIED_SUPPORTED** | 2026-09-05 smoke: launched Chromium 151.0.7922.34 via `@playwright/test` from apps/web, navigated `http://localhost:5173`, title "Dragon Wake", zero console errors, screenshot captured |
| ZCode Browser Use skill (main agent) | **VERIFIED_SUPPORTED** (skill installed; end-to-end game use still unexercised — treat deep interactive sessions as needing a first-time check) | `browser-use:control-browser` + `web-gui-tester` skills installed; constraint: **main-agent-only** |
| Subagent Browser Use (skill) | **VERIFIED_UNSUPPORTED** | Skill's own terms: main-agent-only; subagents must not load it |
| Subagent Playwright via terminal | **VERIFIED_SUPPORTED** | 2026-09-05 controlled test: fresh `general-purpose` subagent wrote and ran a Node/Playwright script against the dev server, captured a screenshot, cleaned up, reported version 151.0.7922.34 |
| Vision (screenshot interpretation) | **VERIFIED_SUPPORTED** | Both smoke screenshots read and described correctly (entry screen content verified against actual render) |
| Screenshot capture | **VERIFIED_SUPPORTED** | Playwright `page.screenshot` (verified); per-test `video`/`trace` options exist in the installed Playwright config |
| Video recording | **SUPPORTED_WITH_CONFIGURATION** | Playwright supports per-test `video: "on"` (global config currently `video: "off"`); enable per investigation. End-to-end video capture untested this session |
| Subagents (context isolation) | **VERIFIED_SUPPORTED** | Fresh `general-purpose` subagents start with isolated conversation context; see isolation findings below |
| Custom named agents (ZCode config) | **SUPPORTED_WITH_CONFIGURATION** | ZCode client Settings → Subagents (user scope) and plugin `agents` field exist per installed docs; **no documented per-launch "disable instructions injection" control** — do not rely on one existing |
| Web research | **SUPPORTED** | WebSearch tool installed (US-only); not exercised this session |
| Web page extraction | **SUPPORTED** | WebFetch tool + `web_reader` MCP installed; not exercised this session |
| MCP integrations | **SUPPORTED_WITH_CONFIGURATION** | Workspace scope `<repo>/.zcode/config.json` → `mcp.servers` per installed docs; never commit secrets |

## Isolation findings (2026-09-05, direct subagent probe)

A fresh `general-purpose` subagent spawned with working directory
`C:\Workspace\Project_Games\DragonWake` reported, without using tools:

- It **did** receive workspace instructions: `C:\Workspace\Project_Games\AGENTS.md`
  (the *parent* folder's generic agent guardrails — Godot/blast-radius
  routing; no DragonWake content).
- It did **not** receive `DragonWake/AGENTS.md` or any DragonWake doc
  content, and explicitly confirmed no Product Lab / direction /
  hypothesis material in its instructions. "DragonWake" appeared only as
  a directory path.

Consequences:

1. **Blind-playtest isolation is real and verified** for the
   subagent+Playwright method: the evaluator gets the parent guardrails
   file only, and the blind-player prompt is the sole DragonWake material
   it receives. Full method: [`FTUE_PLAYTEST_PROTOCOL.md`](FTUE_PLAYTEST_PROTOCOL.md).
2. **Discoverability must not rely on `DragonWake/AGENTS.md` in
   parent-workspace mode** (see below).

## Startup discoverability (instruction-file loading)

| Operating mode | What loads | Product Lab discovery path |
| --- | --- | --- |
| ZCode workspace = DragonWake repo root | `DragonWake/AGENTS.md` resolves as the workspace instruction file (documented workspace-scope rule) | Router injects the Lab rule directly |
| ZCode workspace = `C:\Workspace` or `C:\Workspace\Project_Games`, agent works inside DragonWake | The *workspace-root* `AGENTS.md` loads (verified: Project_Games file injected; **not** the DragonWake file) | Lab is discovered when the agent reads `README.md` or `docs/CURRENT_STATE.md` — both route to it; they are the guaranteed-read docs in this mode |
| Non-ZCode agents / tools | No ZCode instruction files | `README.md` → `docs/CURRENT_STATE.md` → Lab; both are canonical repo docs any tool reads |

Truthful summary: `DragonWake/AGENTS.md` is **only guaranteed when
DragonWake itself is the ZCode workspace**; in parent-workspace mode it
was observed *not* injected. `README.md` + `docs/CURRENT_STATE.md` are the
discovery path that works in every mode, which is why they carry the
routing. Do not modify workspace-root governance to fix this.

## Operating rules

1. **Role prompts are canonical; tool config is disposable** — ZCode
   GUI/CLI config is user-scoped and lossy; [`prompts/README.md`](prompts/README.md)
   is the durable copy.
2. **No fabricated tooling** — if a capability cannot be verified, keep it
   UNKNOWN with the exact test needed.
3. **Evidence provenance** — every claim records its tool, URL/capture
   path, and date; runs record a manifest
   ([`templates/PLAYTEST_RUN_MANIFEST.md`](templates/PLAYTEST_RUN_MANIFEST.md)).
4. **Smoke test before relying** on a browser capability marked
   UNTESTED/UNEXERCISED: run the Playwright entry-screen check against
   `pnpm dev` before a critical playtest session.
