/**
 * In-process demo seed: two guests, troops, alliance ready for B to join.
 * Prints tokens/ids as JSON (no secrets beyond ephemeral demo tokens).
 *
 *   pnpm --filter @tideforge/server seed:demo
 */
import { World } from "./world.js";

const world = new World({ devFastTime: true, skipTutorial: true });

const a = world.createGuest("DemoA", "brinecant");
const b = world.createGuest("DemoB", "ashcoil");

world.adminGrant(a.player.id, {
  units: { levy: 200, reefbow: 150 },
  harness: true,
  brineholdUnlock: true,
  chronite: 80,
  skipProtection: true,
});
world.adminGrant(b.player.id, {
  units: { levy: 80 },
  skipProtection: true,
});

const ally = world.createAlliance(a.player.id, "Demo Tideband", "DEMO");

const out = {
  realm: "memory",
  dbMode: world.dbMode,
  alliance: { id: ally.id, name: ally.name, tag: ally.tag },
  playerA: {
    id: a.player.id,
    displayName: a.player.displayName,
    faction: a.player.faction,
    token: a.token,
    cityId: a.city.id,
    map: { x: a.city.mapX, y: a.city.mapY },
  },
  playerB: {
    id: b.player.id,
    displayName: b.player.displayName,
    faction: b.player.faction,
    token: b.token,
    cityId: b.city.id,
    map: { x: b.city.mapX, y: b.city.mapY },
  },
  howTo: {
    joinAsB: `POST /api/v1/alliances/join { "tag": "DEMO" } with Bearer token B`,
    note: "This CLI seeds an in-process World only; for live server use two guest logins in the UI.",
  },
};

console.log(JSON.stringify(out, null, 2));
