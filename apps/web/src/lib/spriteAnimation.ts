/**
 * Authoritative DragonWake Browser Sprite Animation Runtime.
 *
 * Engine-neutral runtime loader, validator, verified atlas decoder,
 * and interval-based playback clock:
 * - Fail-closed manifest validation (rejects invalid rects, zero durations, atlas overruns).
 * - Cryptographic atlas verification (fetches ArrayBuffer, hashes with crypto.subtle, decodes the verified bytes).
 * - Interval-based event timeline dispatch across [prevPlayhead, currentPlayhead].
 * - One-shot event guarantee (bite_impact fires exactly once per attack instance).
 * - Zero React re-renders in playback clock (pure state engine).
 */

export interface SpriteFrameRect {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
  duration_ms: number;
  offset_x: number;
  offset_y: number;
}

export interface SpriteAnimationEvent {
  frame: number;
  name: string;
  payload?: Record<string, unknown>;
}

export interface SpriteAnimationDef {
  state: string;
  loop: boolean;
  fps: number;
  duration_ms: number;
  review_disposition: string;
  logical_pivot: [number, number];
  gameplay_root: [number, number];
  events: SpriteAnimationEvent[];
  frames: SpriteFrameRect[];
}

export interface SpriteRuntimeManifest {
  schema_version: string;
  asset_id: string;
  subject_id: string;
  direction: string;
  runtime_status: "PREVIEW_ONLY" | "REVIEWED" | "PRODUCTION_APPROVED" | string;
  atlas: {
    file: string;
    width: number;
    height: number;
    sha256: string;
  };
  cell_dimensions: [number, number];
  animations: Record<string, SpriteAnimationDef>;
}

/**
 * Validates untrusted runtime manifest JSON fail-closed.
 */
export function validateSpriteRuntimeManifest(data: unknown): SpriteRuntimeManifest {
  if (!data || typeof data !== "object") {
    throw new Error("Manifest must be a non-null object.");
  }

  const d = data as Record<string, any>;
  const schemaVer = String(d.schema_version ?? "");
  if (!schemaVer.startsWith("1.")) {
    throw new Error(`Unsupported schema version: '${schemaVer}'. Expected 1.x`);
  }

  if (!d.asset_id || typeof d.asset_id !== "string") {
    throw new Error("Manifest missing valid 'asset_id'.");
  }

  const atlas = d.atlas;
  if (!atlas || typeof atlas !== "object") {
    throw new Error("Manifest missing 'atlas' definition.");
  }
  if (!atlas.file || typeof atlas.file !== "string") {
    throw new Error("Atlas missing 'file' path.");
  }
  if (typeof atlas.width !== "number" || atlas.width <= 0) {
    throw new Error(`Invalid atlas width: ${atlas.width}`);
  }
  if (typeof atlas.height !== "number" || atlas.height <= 0) {
    throw new Error(`Invalid atlas height: ${atlas.height}`);
  }
  if (!atlas.sha256 || typeof atlas.sha256 !== "string" || atlas.sha256.length !== 64) {
    throw new Error(`Invalid atlas sha256: '${atlas.sha256}'`);
  }

  const anims = d.animations;
  if (!anims || typeof anims !== "object" || Object.keys(anims).length === 0) {
    throw new Error("Manifest must define at least one animation.");
  }

  const validatedAnims: Record<string, SpriteAnimationDef> = {};

  for (const [key, animRaw] of Object.entries(anims)) {
    if (!animRaw || typeof animRaw !== "object") {
      throw new Error(`Animation '${key}' must be an object.`);
    }
    const a = animRaw as Record<string, any>;
    if (!Array.isArray(a.frames) || a.frames.length === 0) {
      throw new Error(`Animation '${key}' must have at least one frame.`);
    }

    const validatedFrames: SpriteFrameRect[] = [];
    let derivedDuration = 0;

    for (let i = 0; i < a.frames.length; i++) {
      const f = a.frames[i];
      if (typeof f.x !== "number" || f.x < 0) {
        throw new Error(`Animation '${key}' frame ${i} invalid x: ${f.x}`);
      }
      if (typeof f.y !== "number" || f.y < 0) {
        throw new Error(`Animation '${key}' frame ${i} invalid y: ${f.y}`);
      }
      if (typeof f.w !== "number" || f.w <= 0) {
        throw new Error(`Animation '${key}' frame ${i} invalid w: ${f.w}`);
      }
      if (typeof f.h !== "number" || f.h <= 0) {
        throw new Error(`Animation '${key}' frame ${i} invalid h: ${f.h}`);
      }
      if (f.x + f.w > atlas.width || f.y + f.h > atlas.height) {
        throw new Error(
          `Animation '${key}' frame ${i} rect [${f.x},${f.y},${f.w},${f.h}] exceeds atlas dimensions [${atlas.width},${atlas.height}]`
        );
      }
      if (typeof f.duration_ms !== "number" || f.duration_ms <= 0) {
        throw new Error(`Animation '${key}' frame ${i} non-positive duration_ms: ${f.duration_ms}`);
      }

      derivedDuration += f.duration_ms;
      validatedFrames.push({
        index: i,
        x: f.x,
        y: f.y,
        w: f.w,
        h: f.h,
        duration_ms: f.duration_ms,
        offset_x: Number(f.offset_x ?? 0),
        offset_y: Number(f.offset_y ?? 0),
      });
    }

    const validatedEvents: SpriteAnimationEvent[] = [];
    if (Array.isArray(a.events)) {
      for (const ev of a.events) {
        if (typeof ev.frame !== "number" || ev.frame < 0 || ev.frame >= validatedFrames.length) {
          throw new Error(
            `Animation '${key}' event references invalid frame ${ev.frame} (frames count: ${validatedFrames.length})`
          );
        }
        if (!ev.name || typeof ev.name !== "string") {
          throw new Error(`Animation '${key}' event missing name.`);
        }
        validatedEvents.push({
          frame: ev.frame,
          name: ev.name,
          payload: typeof ev.payload === "object" && ev.payload !== null ? ev.payload : undefined,
        });
      }
    }

    const pivot = Array.isArray(a.logical_pivot) && a.logical_pivot.length === 2
      ? [Number(a.logical_pivot[0]), Number(a.logical_pivot[1])] as [number, number]
      : [144, 252] as [number, number];

    const root = Array.isArray(a.gameplay_root) && a.gameplay_root.length === 2
      ? [Number(a.gameplay_root[0]), Number(a.gameplay_root[1])] as [number, number]
      : [144, 274] as [number, number];

    validatedAnims[key] = {
      state: String(a.state ?? key),
      loop: Boolean(a.loop),
      fps: Number(a.fps ?? 6.0),
      duration_ms: Math.round(derivedDuration * 1000) / 1000,
      review_disposition: String(a.review_disposition ?? "ACCEPT"),
      logical_pivot: pivot,
      gameplay_root: root,
      events: validatedEvents,
      frames: validatedFrames,
    };
  }

  const cdim = Array.isArray(d.cell_dimensions) && d.cell_dimensions.length === 2
    ? [Number(d.cell_dimensions[0]), Number(d.cell_dimensions[1])] as [number, number]
    : [288, 288] as [number, number];

  return {
    schema_version: schemaVer,
    asset_id: d.asset_id,
    subject_id: String(d.subject_id ?? d.asset_id),
    direction: String(d.direction ?? "southwest"),
    runtime_status: String(d.runtime_status ?? "PREVIEW_ONLY"),
    atlas: {
      file: atlas.file,
      width: atlas.width,
      height: atlas.height,
      sha256: atlas.sha256.toLowerCase(),
    },
    cell_dimensions: cdim,
    animations: validatedAnims,
  };
}

/**
 * Fetches atlas as ArrayBuffer, verifies SHA-256 via crypto.subtle,
 * and decodes the EXACT verified bytes.
 */
export async function loadVerifiedAtlas(
  atlasUrl: string,
  expectedSha256: string
): Promise<{
  image: HTMLImageElement;
  sha256: string;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  const resp = await fetch(atlasUrl);
  if (!resp.ok) {
    throw new Error(`Failed to fetch atlas from ${atlasUrl} (HTTP ${resp.status})`);
  }

  const buffer = await resp.arrayBuffer();

  // SHA-256 verification
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const actualSha256 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toLowerCase();

  if (actualSha256 !== expectedSha256.toLowerCase()) {
    throw new Error(
      `Atlas SHA-256 verification failed! Expected: ${expectedSha256}, Actual fetched: ${actualSha256}`
    );
  }

  // Decode the verified bytes
  const blob = new Blob([buffer], { type: "image/png" });
  const objectUrl = URL.createObjectURL(blob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to decode verified atlas image bytes."));
    img.src = objectUrl;
  });

  return {
    image: img,
    sha256: actualSha256,
    width: img.naturalWidth,
    height: img.naturalHeight,
    cleanup: () => {
      URL.revokeObjectURL(objectUrl);
    },
  };
}

/**
 * Deterministic interval-based playback clock.
 */
export class SpritePlaybackClock {
  private def: SpriteAnimationDef | null = null;
  private playheadMs: number = 0;
  private playbackSpeed: number = 1.0;
  private isPaused: boolean = false;
  private isComplete: boolean = false;
  private firedEventIds: Set<string> = new Set();
  private playbackInstanceId: number = 0;

  // Frame start times cache
  private frameStartTimes: number[] = [];
  private totalDurationMs: number = 0;

  constructor(initialDef?: SpriteAnimationDef) {
    if (initialDef) {
      this.setAnimation(initialDef);
    }
  }

  public setAnimation(def: SpriteAnimationDef, resetPlayhead = true): void {
    const isSameState = this.def?.state === def.state;
    this.def = def;
    this.totalDurationMs = def.duration_ms;

    // Cache cumulative start times
    this.frameStartTimes = [];
    let acc = 0;
    for (const f of def.frames) {
      this.frameStartTimes.push(acc);
      acc += f.duration_ms;
    }

    if (resetPlayhead || !isSameState) {
      this.playheadMs = 0;
      this.isComplete = false;
      this.firedEventIds.clear();
      this.playbackInstanceId++;
    }
  }

  public setSpeed(speed: number): void {
    if (speed > 0) {
      this.playbackSpeed = speed;
    }
  }

  public getSpeed(): number {
    return this.playbackSpeed;
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public paused(): boolean {
    return this.isPaused;
  }

  public getPlayhead(): number {
    return this.playheadMs;
  }

  public getCurrentFrameIndex(): number {
    if (!this.def || this.def.frames.length === 0) return 0;
    const t = this.def.loop && this.totalDurationMs > 0
      ? this.playheadMs % this.totalDurationMs
      : Math.min(this.playheadMs, Math.max(0, this.totalDurationMs - 0.001));

    return this.findFrameIndexAtTime(t);
  }

  public getCurrentFrame(): SpriteFrameRect | null {
    if (!this.def || this.def.frames.length === 0) return null;
    return this.def.frames[this.getCurrentFrameIndex()];
  }

  private findFrameIndexAtTime(timeMs: number): number {
    if (this.frameStartTimes.length <= 1) return 0;
    // Bounded search
    for (let i = this.frameStartTimes.length - 1; i >= 0; i--) {
      if (timeMs >= this.frameStartTimes[i]) {
        return i;
      }
    }
    return 0;
  }

  /**
   * Advances clock by deltaMs and dispatches crossed events over [prevPlayhead, currPlayhead].
   */
  public update(
    deltaMs: number,
    onEvent?: (event: SpriteAnimationEvent, frameIndex: number) => void,
    onComplete?: () => void
  ): {
    frame: SpriteFrameRect;
    frameIndex: number;
    isComplete: boolean;
    playheadMs: number;
  } {
    if (!this.def || this.def.frames.length === 0) {
      throw new Error("PlaybackClock: No animation definition set.");
    }

    if (this.isPaused) {
      const idx = this.getCurrentFrameIndex();
      return {
        frame: this.def.frames[idx],
        frameIndex: idx,
        isComplete: this.isComplete,
        playheadMs: this.playheadMs,
      };
    }

    const prevPlayhead = this.playheadMs;
    const effectiveDelta = deltaMs * this.playbackSpeed;
    const D = this.totalDurationMs;

    if (this.def.loop) {
      // Loop playback
      this.playheadMs += effectiveDelta;
      const tStart = prevPlayhead % D;
      const tEnd = this.playheadMs % D;
      const numCyclesPassed = Math.floor(this.playheadMs / D) - Math.floor(prevPlayhead / D);

      // Event checking
      if (onEvent && this.def.events.length > 0) {
        for (const ev of this.def.events) {
          const evTime = this.frameStartTimes[ev.frame];
          let firedInInterval = false;

          if (numCyclesPassed === 0) {
            // Within same cycle
            if (tStart <= evTime && evTime < tEnd) {
              firedInInterval = true;
            }
          } else {
            // Crossed cycle wrap
            if (tStart <= evTime || evTime < tEnd) {
              firedInInterval = true;
            }
          }

          if (firedInInterval) {
            onEvent(ev, ev.frame);
          }
        }
      }
    } else {
      // One-shot playback
      if (!this.isComplete) {
        this.playheadMs = Math.min(D, prevPlayhead + effectiveDelta);
        const tStart = prevPlayhead;
        const tEnd = this.playheadMs;

        // Check events across [tStart, tEnd]
        if (onEvent && this.def.events.length > 0) {
          for (const ev of this.def.events) {
            const evKey = `inst_${this.playbackInstanceId}_f${ev.frame}_${ev.name}`;
            const evTime = this.frameStartTimes[ev.frame];

            // Event fires if playhead crossed start of event frame and not yet fired in this instance
            if (tStart <= evTime && (evTime < tEnd || (tEnd >= D && evTime <= D))) {
              if (!this.firedEventIds.has(evKey)) {
                this.firedEventIds.add(evKey);
                onEvent(ev, ev.frame);
              }
            }
          }
        }

        if (this.playheadMs >= D) {
          this.isComplete = true;
          if (onComplete) {
            onComplete();
          }
        }
      }
    }

    const frameIdx = this.getCurrentFrameIndex();
    return {
      frame: this.def.frames[frameIdx],
      frameIndex: frameIdx,
      isComplete: this.isComplete,
      playheadMs: this.playheadMs,
    };
  }
}
