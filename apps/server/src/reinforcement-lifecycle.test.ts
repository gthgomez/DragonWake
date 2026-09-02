import { describe, expect, it } from "vitest";

import { World } from "./world";

describe("reinforcement lifecycle", () => {
  it("stations an allied force, preserves attribution, and recalls it exactly once", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const a = world.createGuest("Garrison Sender", "northern_kingdom");
    const b = world.createGuest("Garrison Receiver", "mountain_realm");
    const alliance = world.createAlliance(a.player.id, "Stonewatch", "STNW");
    world.joinAlliance(b.player.id, alliance.id);
    world.adminGrant(a.player.id, { units: { levy: 40 } });

    const march = world.createMarch(a.player.id, {
      fromCityId: a.city.id,
      intent: "reinforce",
      targetType: "city",
      targetId: b.city.id,
      targetX: b.city.mapX,
      targetY: b.city.mapY,
      composition: { levy: 40 },
    });
    march.arriveAt = 0;
    expect(world.landMarch(march, world.now())).toBeNull();
    expect(march.status).toBe("stationed");
    expect(march.reinforcement).toMatchObject({
      targetCityId: b.city.id,
      composition: { levy: 40 },
    });
    expect(b.city.stacks.levy).toBe(90);
    expect(a.city.stacks.levy).toBe(50);

    const recalled = world.recallReinforcement(a.player.id, march.id);
    expect(recalled.status).toBe("returning");
    expect(recalled.reinforcement).toBeNull();
    expect(b.city.stacks.levy).toBe(50);
    expect(() => world.recallReinforcement(a.player.id, march.id)).toThrow(/not stationed/);

    world.processMarches(world.now() + 10_000);
    expect(march.status).toBe("completed");
    expect(a.city.stacks.levy).toBe(90);
  });

  it("does not let a non-member or an unknown owner recall another force", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const a = world.createGuest("Owner", "northern_kingdom");
    const b = world.createGuest("Target", "mountain_realm");
    world.adminGrant(a.player.id, { units: { levy: 10 } });
    const march = world.createMarch(a.player.id, {
      fromCityId: a.city.id,
      intent: "reinforce",
      targetType: "city",
      targetId: b.city.id,
      targetX: b.city.mapX,
      targetY: b.city.mapY,
      composition: { levy: 10 },
    });
    expect(() => world.landMarch(march, world.now())).not.toThrow();
    expect(march.status).toBe("returning");
    expect(() => world.recallReinforcement(b.player.id, march.id)).toThrow(/reinforcement not found/);
  });

  it("recalls stationed forces when the receiving member leaves", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const a = world.createGuest("Leaving Sender", "northern_kingdom");
    const b = world.createGuest("Leaving Receiver", "mountain_realm");
    const alliance = world.createAlliance(a.player.id, "Last Watch", "LSTW");
    world.joinAlliance(b.player.id, alliance.id);
    world.adminGrant(a.player.id, { units: { levy: 10 } });
    const march = world.createMarch(a.player.id, {
      fromCityId: a.city.id,
      intent: "reinforce",
      targetType: "city",
      targetId: b.city.id,
      targetX: b.city.mapX,
      targetY: b.city.mapY,
      composition: { levy: 10 },
    });
    march.arriveAt = 0;
    world.landMarch(march, world.now());
    expect(march.status).toBe("stationed");
    world.leaveAlliance(b.player.id, alliance.id);
    expect(march.status).toBe("returning");
    expect(b.city.stacks.levy).toBe(50);
  });

  it("attributes defender losses before a stationed force is recalled", () => {
    const world = new World({ devFastTime: true, skipTutorial: true });
    const sender = world.createGuest("Loss Sender", "northern_kingdom");
    const receiver = world.createGuest("Loss Receiver", "mountain_realm");
    const alliance = world.createAlliance(sender.player.id, "Shieldline", "SHLD");
    world.joinAlliance(receiver.player.id, alliance.id);
    world.adminGrant(sender.player.id, { units: { levy: 20 } });
    const march = world.createMarch(sender.player.id, {
      fromCityId: sender.city.id,
      intent: "reinforce",
      targetType: "city",
      targetId: receiver.city.id,
      targetX: receiver.city.mapX,
      targetY: receiver.city.mapY,
      composition: { levy: 20 },
    });
    march.arriveAt = 0;
    world.landMarch(march, world.now());
    receiver.city.stacks.levy = 55;
    const attacker = world.createGuest("Loss Attacker", "forest_people");
    attacker.city.buildings.push({ slotIndex: 7, buildingType: "rally_quay", level: 20 });
    world.adminGrant(attacker.player.id, { units: { knight: 800 } });
    const attack = world.createMarch(attacker.player.id, {
      fromCityId: attacker.city.id,
      intent: "attack",
      targetType: "city",
      targetId: receiver.city.id,
      targetX: receiver.city.mapX,
      targetY: receiver.city.mapY,
      composition: { knight: 800 },
    });
    attack.arriveAt = 0;
    world.landMarch(attack, world.now());
    expect((march.reinforcement?.composition.levy ?? 0)).toBeLessThanOrEqual(20);
    expect(() => world.recallReinforcement(sender.player.id, march.id)).not.toThrow();
  });

  it("keeps alliance rank changes leader-authoritative", () => {
    const world = new World({ persist: false });
    const leader = world.createGuest("Rank Leader", "northern_kingdom");
    const member = world.createGuest("Rank Member", "mountain_realm");
    const outsider = world.createGuest("Rank Outsider", "forest_people");
    const alliance = world.createAlliance(leader.player.id, "Rank Watch", "RNKW");
    world.joinAlliance(member.player.id, alliance.id);
    expect(world.setAllianceRank(leader.player.id, alliance.id, member.player.id, "officer").rank).toBe("officer");
    expect(() => world.setAllianceRank(member.player.id, alliance.id, outsider.player.id, "member")).toThrow(/only the alliance leader/);
    expect(() => world.setAllianceRank(leader.player.id, alliance.id, outsider.player.id, "member")).toThrow(/not an alliance member/);
  });
});
