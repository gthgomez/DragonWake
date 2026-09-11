/**
 * Unit tests for DragonWake browser sprite runtime engine.
 */

import { describe, it, expect, vi } from "vitest";
import {
  validateSpriteRuntimeManifest,
  SpritePlaybackClock,
  type SpriteAnimationDef,
  type SpriteRuntimeManifest,
} from "./spriteAnimation";

describe("validateSpriteRuntimeManifest", () => {
  const validManifest: SpriteRuntimeManifest = {
    schema_version: "1.7.0",
    asset_id: "dragon_vale_drake",
    subject_id: "dragon_vale_drake",
    direction: "southwest",
    runtime_status: "PREVIEW_ONLY",
    atlas: {
      file: "atlas.png",
      width: 1152,
      height: 2592,
      sha256: "f2f0e66ac4425b28a60d82353b03631593b1e11743f714b418727fd58bf09ae8",
    },
    cell_dimensions: [288, 288],
    animations: {
      idle: {
        state: "idle",
        loop: true,
        fps: 6.0,
        duration_ms: 1333.333,
        review_disposition: "ACCEPT",
        logical_pivot: [144, 252],
        gameplay_root: [144, 274],
        events: [],
        frames: [
          { index: 0, x: 0, y: 0, w: 288, h: 288, duration_ms: 166.667, offset_x: 0, offset_y: 0 },
          { index: 1, x: 288, y: 0, w: 288, h: 288, duration_ms: 166.667, offset_x: 0, offset_y: 0 },
        ],
      },
    },
  };

  it("accepts a well-formed manifest", () => {
    const validated = validateSpriteRuntimeManifest(validManifest);
    expect(validated.asset_id).toBe("dragon_vale_drake");
    expect(validated.animations.idle.frames.length).toBe(2);
  });

  it("fails closed on unsupported major schema version", () => {
    const invalid = { ...validManifest, schema_version: "2.0.0" };
    expect(() => validateSpriteRuntimeManifest(invalid)).toThrow(/Unsupported schema version/);
  });

  it("fails closed on frame rect exceeding atlas dimensions", () => {
    const invalid = JSON.parse(JSON.stringify(validManifest));
    invalid.animations.idle.frames[0].x = 1000; // 1000 + 288 = 1288 > 1152
    expect(() => validateSpriteRuntimeManifest(invalid)).toThrow(/exceeds atlas dimensions/);
  });

  it("fails closed on zero or negative duration", () => {
    const invalid = JSON.parse(JSON.stringify(validManifest));
    invalid.animations.idle.frames[0].duration_ms = 0;
    expect(() => validateSpriteRuntimeManifest(invalid)).toThrow(/non-positive duration_ms/);
  });

  it("fails closed on event referencing out-of-bounds frame index", () => {
    const invalid = JSON.parse(JSON.stringify(validManifest));
    invalid.animations.idle.events = [{ frame: 99, name: "invalid_event" }];
    expect(() => validateSpriteRuntimeManifest(invalid)).toThrow(/event references invalid frame/);
  });
});

describe("SpritePlaybackClock", () => {
  const attackDef: SpriteAnimationDef = {
    state: "attack",
    loop: false,
    fps: 8.0,
    duration_ms: 500.0,
    review_disposition: "ACCEPT",
    logical_pivot: [144, 252],
    gameplay_root: [144, 274],
    events: [{ frame: 1, name: "bite_impact" }],
    frames: [
      { index: 0, x: 0, y: 576, w: 288, h: 288, duration_ms: 125.0, offset_x: 0, offset_y: 0 },
      { index: 1, x: 288, y: 576, w: 288, h: 288, duration_ms: 125.0, offset_x: 0, offset_y: 0 },
      { index: 2, x: 576, y: 576, w: 288, h: 288, duration_ms: 125.0, offset_x: 0, offset_y: 0 },
      { index: 3, x: 864, y: 576, w: 288, h: 288, duration_ms: 125.0, offset_x: 0, offset_y: 0 },
    ],
  };

  const idleDef: SpriteAnimationDef = {
    state: "idle",
    loop: true,
    fps: 6.0,
    duration_ms: 300.0,
    review_disposition: "ACCEPT",
    logical_pivot: [144, 252],
    gameplay_root: [144, 274],
    events: [],
    frames: [
      { index: 0, x: 0, y: 0, w: 288, h: 288, duration_ms: 100.0, offset_x: 0, offset_y: 0 },
      { index: 1, x: 288, y: 0, w: 288, h: 288, duration_ms: 100.0, offset_x: 0, offset_y: 0 },
      { index: 2, x: 576, y: 0, w: 288, h: 288, duration_ms: 100.0, offset_x: 0, offset_y: 0 },
    ],
  };

  it("plays looping animation and wraps playhead correctly", () => {
    const clock = new SpritePlaybackClock(idleDef);
    expect(clock.getCurrentFrameIndex()).toBe(0);

    clock.update(50); // t = 50ms -> frame 0
    expect(clock.getCurrentFrameIndex()).toBe(0);

    clock.update(60); // t = 110ms -> frame 1
    expect(clock.getCurrentFrameIndex()).toBe(1);

    clock.update(100); // t = 210ms -> frame 2
    expect(clock.getCurrentFrameIndex()).toBe(2);

    clock.update(100); // t = 310ms -> wraps to 10ms -> frame 0
    expect(clock.getCurrentFrameIndex()).toBe(0);
  });

  it("fires bite_impact exactly once per one-shot attack playback", () => {
    const clock = new SpritePlaybackClock(attackDef);
    const onEvent = vi.fn();
    const onComplete = vi.fn();

    // Advance to frame 0
    clock.update(50, onEvent, onComplete);
    expect(clock.getCurrentFrameIndex()).toBe(0);
    expect(onEvent).not.toHaveBeenCalled();

    // Advance across frame 1 start boundary (125ms)
    clock.update(80, onEvent, onComplete); // t = 130ms -> frame 1
    expect(clock.getCurrentFrameIndex()).toBe(1);
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ name: "bite_impact" }), 1);

    // Continue to finish
    clock.update(400, onEvent, onComplete); // t = 530ms -> complete
    expect(clock.getCurrentFrameIndex()).toBe(3);
    expect(onEvent).toHaveBeenCalledTimes(1); // STILL exactly once!
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Extra updates when complete must not re-fire event or onComplete
    clock.update(100, onEvent, onComplete);
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("handles large RAF delta skipping across event frame without losing event", () => {
    const clock = new SpritePlaybackClock(attackDef);
    const onEvent = vi.fn();
    const onComplete = vi.fn();

    // A single huge jump of 300ms (skipping frame 0 and frame 1 directly into frame 2)
    clock.update(300, onEvent, onComplete);
    expect(clock.getCurrentFrameIndex()).toBe(2);
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ name: "bite_impact" }), 1);
  });

  it("respects 2x playback speed scaling", () => {
    const clock = new SpritePlaybackClock(attackDef);
    clock.setSpeed(2.0);
    const onEvent = vi.fn();

    // In 70ms real time, clock advances 140ms (crossing frame 1 at 125ms)
    clock.update(70, onEvent);
    expect(clock.getCurrentFrameIndex()).toBe(1);
    expect(onEvent).toHaveBeenCalledTimes(1);
  });

  it("preserves playhead continuity during pause and resume", () => {
    const clock = new SpritePlaybackClock(attackDef);
    clock.update(50);
    expect(clock.getPlayhead()).toBe(50);

    clock.pause();
    clock.update(100);
    expect(clock.getPlayhead()).toBe(50); // did not advance while paused

    clock.resume();
    clock.update(50);
    expect(clock.getPlayhead()).toBe(100);
  });

  it("replaying attack resets state and fires bite_impact once again", () => {
    const clock = new SpritePlaybackClock(attackDef);
    const onEvent = vi.fn();

    clock.update(500, onEvent);
    expect(onEvent).toHaveBeenCalledTimes(1);

    // Replay attack by re-setting animation
    clock.setAnimation(attackDef, true);
    clock.update(200, onEvent);
    expect(onEvent).toHaveBeenCalledTimes(2); // fired once in instance 1, once in instance 2
  });

  it("handles animation transition midway through playback cleanly", () => {
    const clock = new SpritePlaybackClock(attackDef);
    clock.update(60);
    expect(clock.getCurrentFrameIndex()).toBe(0);

    // Switch to idle
    clock.setAnimation(idleDef);
    expect(clock.getCurrentFrameIndex()).toBe(0);
    clock.update(50);
    expect(clock.getCurrentFrameIndex()).toBe(0);
  });
});
