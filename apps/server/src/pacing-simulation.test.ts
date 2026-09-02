import { describe, expect, it } from "vitest";

import {
  runPacingSimulation,
  runPveBandSimulation,
  runRecoverySimulation,
} from "./pacing-simulation.js";

describe("deterministic long-horizon pacing simulation", () => {
  it("covers every required horizon with parallel actions and low softlock risk", () => {
    const reports = runPacingSimulation();
    expect(reports.map((report) => report.id)).toEqual([
      "15m",
      "1h",
      "day1",
      "day3",
      "day7",
      "day14",
      "day30",
    ]);
    for (const report of reports) {
      expect(report.activeActions.length).toBeGreaterThanOrEqual(3);
      expect(report.productiveAlternatives).toHaveLength(2);
      expect(report.resourceBottlenecks.length).toBeGreaterThanOrEqual(1);
      expect(report.queuePlan.length).toBeGreaterThanOrEqual(2);
      expect(report.softlockRisk).toBe("low");
    }
    expect(reports.at(-1)!.resources.food).toBeGreaterThan(
      reports[0]!.resources.food,
    );
  });

  it("keeps PvE bands differentiated and scouting-informed", () => {
    const bands = runPveBandSimulation();
    expect(new Set(bands.map((band) => band.recommendedProfile)).size).toBe(4);
    expect(bands.map((band) => band.rewardValue)).toEqual([1, 3, 6, 12]);
    expect(bands.slice(1).every((band) => band.scoutingRequired)).toBe(true);
    expect(bands.slice(1).every((band) => band.rewardValue > band.lowTierFarmValue)).toBe(true);
  });

  it("keeps each listed novice mistake recoverable without a free bailout", () => {
    const recovery = runRecoverySimulation();
    expect(recovery).toHaveLength(6);
    expect(recovery.every((item) => item.recoverable)).toBe(true);
    expect(recovery.every((item) => item.bailoutResource === 0)).toBe(true);
  });
});
