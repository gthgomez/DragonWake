/**
 * Isolated SpritePreviewHarness Component for DragonWake.
 *
 * Dedicated dev-only visual verification harness:
 * - PREVIEW ONLY banner with state review dispositions.
 * - State switcher: idle (loop), walk (loop), attack (one-shot).
 * - Attack event listener: logs bite_impact at frame 1 and transitions to idle on complete.
 * - Multi-scale preview: Native (288px), Roost Reference (180px), Experimental Map (72px).
 * - Movement simulator: moves sprite along 2D southwest isometric vector to evaluate foot slip.
 * - Debug overlays: logical pivot, gameplay root, frame bounds.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  type SpriteRuntimeManifest,
  type SpriteAnimationEvent,
  loadVerifiedAtlas,
} from "../lib/spriteAnimation";
import { AnimatedSprite } from "../ui/AnimatedSprite";

export interface SpritePreviewHarnessProps {
  manifest: SpriteRuntimeManifest;
  atlasUrl: string;
}

export const SpritePreviewHarness: React.FC<SpritePreviewHarnessProps> = ({ manifest, atlasUrl }) => {
  const [atlasImage, setAtlasImage] = useState<HTMLImageElement | null>(null);
  const [atlasError, setAtlasError] = useState<string | null>(null);
  const [verifiedSha, setVerifiedSha] = useState<string | null>(null);

  // Playback state
  const [currentState, setCurrentState] = useState<string>("idle");
  const [scale, setScale] = useState<number>(1.0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [paused, setPaused] = useState<boolean>(false);

  // Debug toggles
  const [showPivot, setShowPivot] = useState<boolean>(false);
  const [showRoot, setShowRoot] = useState<boolean>(false);
  const [showBounds, setShowBounds] = useState<boolean>(false);
  const [checkerboard, setCheckerboard] = useState<boolean>(true);

  // Movement track simulation (southwest isometric vector)
  const [simulateMovement, setSimulateMovement] = useState<boolean>(false);
  const [movementSpeed, setMovementSpeed] = useState<number>(90); // px/sec along travel vector
  const [trackPos, setTrackPos] = useState<{ x: number; y: number }>({ x: 250, y: 50 });

  // Event logging
  const [eventLogs, setEventLogs] = useState<Array<{ id: number; time: string; text: string }>>([]);
  const logIdRef = useRef(1);

  // Load and cryptographically verify atlas
  useEffect(() => {
    let active = true;
    let cleanupFn: (() => void) | null = null;

    setAtlasError(null);
    loadVerifiedAtlas(atlasUrl, manifest.atlas.sha256)
      .then((res) => {
        if (!active) {
          res.cleanup();
          return;
        }
        cleanupFn = res.cleanup;
        setAtlasImage(res.image);
        setVerifiedSha(res.sha256);
      })
      .catch((err) => {
        if (active) {
          setAtlasError(err.message);
        }
      });

    return () => {
      active = false;
      cleanupFn?.();
    };
  }, [atlasUrl, manifest.atlas.sha256]);

  // Movement simulation loop
  useEffect(() => {
    if (!simulateMovement || paused || currentState !== "walk") return;

    let rafId: number;
    let lastTime = performance.now();

    // Southwest normalized vector: (-1/sqrt(2), 1/sqrt(2))
    const vx = -0.7071;
    const vy = 0.7071;

    const tick = (now: number) => {
      const dtSec = (now - lastTime) / 1000;
      lastTime = now;

      setTrackPos((prev) => {
        let nx = prev.x + vx * movementSpeed * dtSec;
        let ny = prev.y + vy * movementSpeed * dtSec;

        // Wrap around track box (width 400, height 300)
        if (nx < 50 || ny > 280) {
          nx = 320;
          ny = 30;
        }
        return { x: nx, y: ny };
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [simulateMovement, paused, currentState, movementSpeed]);

  const addLog = (text: string) => {
    const timeStr = new Date().toLocaleTimeString();
    setEventLogs((prev) => [
      { id: logIdRef.current++, time: timeStr, text },
      ...prev.slice(0, 49),
    ]);
  };

  const handleEvent = (ev: SpriteAnimationEvent, frameIndex: number) => {
    addLog(`[EVENT] '${ev.name}' fired at frame ${frameIndex}`);
  };

  const handleComplete = () => {
    addLog(`[COMPLETE] Animation '${currentState}' finished.`);
    if (currentState === "attack") {
      addLog(`[TRANSITION] Returning from attack -> idle`);
      setCurrentState("idle");
    }
  };

  const triggerAttack = () => {
    addLog(`[TRIGGER] Attack initiated`);
    setCurrentState("attack");
  };

  return (
    <div
      data-testid="sprite-preview-harness"
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#12151c",
        color: "#e0e6ed",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          borderBottom: "2px solid #2a3442",
          paddingBottom: "16px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              data-testid="preview-status-badge"
              style={{
                background: "#d97706",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "12px",
                padding: "4px 8px",
                borderRadius: "4px",
                letterSpacing: "0.5px",
              }}
            >
              {manifest.runtime_status}
            </span>
            <h1 style={{ margin: 0, fontSize: "22px", color: "#f3f4f6" }}>
              DragonWake Runtime Sprite Preview —{" "}
              <span data-testid="preview-subject-id" style={{ color: "#60a5fa" }}>
                {manifest.subject_id}
              </span>
            </h1>
          </div>
          <p style={{ margin: "6px 0 0 0", color: "#9ca3af", fontSize: "14px" }}>
            Direction: {manifest.direction} | Atlas: {manifest.atlas.width}x{manifest.atlas.height} (
            {manifest.atlas.sha256.substring(0, 12)}...)
            {verifiedSha && (
              <span data-testid="cas-verified-indicator" style={{ color: "#34d399", marginLeft: "8px" }}>
                ✓ CAS Verified ({verifiedSha.substring(0, 8)})
              </span>
            )}
          </p>
        </div>

        {/* State review dispositions */}
        <div style={{ display: "flex", gap: "8px" }}>
          {Object.entries(manifest.animations).map(([sName, aDef]) => (
            <div
              key={sName}
              style={{
                background: "#1f2937",
                border: "1px solid #374151",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "#9ca3af" }}>{sName}: </span>
              <strong
                data-testid={`disposition-${sName}`}
                style={{
                  color:
                    aDef.review_disposition === "ACCEPT"
                      ? "#34d399"
                      : aDef.review_disposition === "WARN_CONDITIONAL"
                      ? "#fbbf24"
                      : "#f87171",
                }}
              >
                {aDef.review_disposition}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {atlasError && (
        <div
          data-testid="atlas-error"
          style={{
            background: "#7f1d1d",
            color: "#fecaca",
            padding: "12px 16px",
            borderRadius: "6px",
            marginBottom: "16px",
          }}
        >
          <strong>Verification Error:</strong> {atlasError}
        </div>
      )}

      {/* Main Controls Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          background: "#1a202c",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "24px",
          alignItems: "center",
        }}
      >
        {/* State Buttons */}
        <div style={{ display: "flex", gap: "6px" }}>
          {["idle", "walk", "attack"].map((s) => (
            <button
              key={s}
              data-testid={`btn-state-${s}`}
              onClick={() => {
                if (s === "attack") triggerAttack();
                else setCurrentState(s);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: currentState === s ? "2px solid #3b82f6" : "1px solid #4b5563",
                background: currentState === s ? "#1e3a8a" : "#374151",
                color: "#fff",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Speed Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", borderLeft: "1px solid #4b5563", paddingLeft: "16px" }}>
          <span style={{ fontSize: "13px", color: "#9ca3af" }}>Speed:</span>
          {[0.25, 0.5, 1.0, 2.0].map((sp) => (
            <button
              key={sp}
              data-testid={`btn-speed-${sp}`}
              onClick={() => setSpeed(sp)}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                background: speed === sp ? "#2563eb" : "#4b5563",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {sp}x
            </button>
          ))}
          <button
            data-testid="btn-pause-resume"
            onClick={() => setPaused(!paused)}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              background: paused ? "#059669" : "#dc2626",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>

        {/* Scale Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", borderLeft: "1px solid #4b5563", paddingLeft: "16px" }}>
          <span style={{ fontSize: "13px", color: "#9ca3af" }}>Display Scale:</span>
          {[0.5, 1.0, 2.0].map((sc) => (
            <button
              key={sc}
              data-testid={`btn-scale-${sc}`}
              onClick={() => setScale(sc)}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                background: scale === sc ? "#2563eb" : "#4b5563",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {sc}x
            </button>
          ))}
        </div>

        {/* Debug Toggles */}
        <div style={{ display: "flex", gap: "12px", borderLeft: "1px solid #4b5563", paddingLeft: "16px", fontSize: "13px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input
              type="checkbox"
              data-testid="chk-debug-pivot"
              checked={showPivot}
              onChange={(e) => setShowPivot(e.target.checked)}
            />
            Pivot
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input
              type="checkbox"
              data-testid="chk-debug-root"
              checked={showRoot}
              onChange={(e) => setShowRoot(e.target.checked)}
            />
            Root
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input
              type="checkbox"
              data-testid="chk-debug-bounds"
              checked={showBounds}
              onChange={(e) => setShowBounds(e.target.checked)}
            />
            Bounds
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input
              type="checkbox"
              data-testid="toggle-checkerboard"
              checked={checkerboard}
              onChange={(e) => setCheckerboard(e.target.checked)}
            />
            Checker
          </label>
        </div>
      </div>

      {/* Grid: Main Canvas Area + Event Log */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", marginBottom: "32px" }}>
        {/* Main Playback Viewport */}
        <div
          style={{
            background: "#161b24",
            border: "1px solid #2d3748",
            borderRadius: "8px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", alignSelf: "flex-start", fontSize: "15px", color: "#d1d5db" }}>
            Active State: <span style={{ color: "#38bdf8" }}>{currentState.toUpperCase()}</span> (
            {manifest.animations[currentState]?.frames.length} frames @ {manifest.animations[currentState]?.fps} FPS,{" "}
            {manifest.animations[currentState]?.duration_ms}ms)
          </h3>

          <div
            data-testid="sprite-viewport"
            style={{
              padding: "16px",
              borderRadius: "6px",
              background: checkerboard
                ? "repeating-conic-gradient(#1f2937 0% 25%, #111827 0% 50%) 50% / 20px 20px"
                : "#0b0f17",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6)",
              display: "inline-block",
            }}
          >
            {atlasImage ? (
              <AnimatedSprite
                manifest={manifest}
                animationState={currentState}
                atlasImage={atlasImage}
                scale={scale}
                playbackSpeed={speed}
                paused={paused}
                showDebugPivot={showPivot}
                showDebugRoot={showRoot}
                showDebugBounds={showBounds}
                onEvent={handleEvent}
                onComplete={handleComplete}
              />
            ) : (
              <div style={{ padding: "40px", color: "#9ca3af" }}>Loading and verifying atlas bytes...</div>
            )}
          </div>
        </div>

        {/* Event Log Panel */}
        <div
          style={{
            background: "#161b24",
            border: "1px solid #2d3748",
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "14px", color: "#f3f4f6" }}>Runtime Event Log</h3>
            <button
              data-testid="btn-clear-log"
              onClick={() => setEventLogs([])}
              style={{
                fontSize: "11px",
                background: "#374151",
                border: "none",
                color: "#9ca3af",
                padding: "2px 6px",
                borderRadius: "3px",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>

          <div
            data-testid="event-log"
            style={{
              flex: 1,
              overflowY: "auto",
              maxHeight: "360px",
              fontFamily: "ui-monospace, monospace",
              fontSize: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {eventLogs.length === 0 ? (
              <span style={{ color: "#6b7280", fontStyle: "italic" }}>No events dispatched yet.</span>
            ) : (
              eventLogs.map((item) => (
                <div
                  key={item.id}
                  data-testid="event-log-item"
                  style={{
                    background: item.text.includes("bite_impact") ? "#1e293b" : "#111827",
                    borderLeft: item.text.includes("bite_impact") ? "3px solid #ef4444" : "3px solid #3b82f6",
                    padding: "4px 8px",
                    borderRadius: "2px",
                  }}
                >
                  <span style={{ color: "#9ca3af" }}>[{item.time}] </span>
                  <span
                    style={{
                      color: item.text.includes("bite_impact") ? "#fca5a5" : "#e2e8f0",
                      fontWeight: item.text.includes("bite_impact") ? "bold" : "normal",
                    }}
                  >
                    {item.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Movement Simulation Box (Walk Evaluation) */}
      <div
        style={{
          background: "#161b24",
          border: "1px solid #2d3748",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", color: "#f3f4f6" }}>
              Locomotion Kinematic Simulator (Southwest Isometric Vector)
            </h3>
            <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: "13px" }}>
              Evaluates 2.43px foot drift by translating the root across a simulated ground track along vector (-0.707, 0.707).
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              type="button"
              data-testid="btn-toggle-sim-move"
              onClick={() => {
                const nextState = !simulateMovement;
                setSimulateMovement(nextState);
                if (nextState) setCurrentState("walk");
              }}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                background: simulateMovement ? "#2563eb" : "#374151",
                color: "#fff",
                border: "none",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {simulateMovement ? "Stop Movement" : "Simulate Movement"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "13px", color: "#9ca3af" }}>Speed:</span>
              {[60, 90, 140].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  data-testid={`btn-move-speed-${spd}`}
                  onClick={() => setMovementSpeed(spd)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: movementSpeed === spd ? "#2563eb" : "#4b5563",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  {spd} px/s
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          data-testid="movement-track-viewport"
          style={{
            height: "320px",
            background: "#0d1117",
            border: "1px dashed #30363d",
            borderRadius: "6px",
            position: "relative",
            overflow: "hidden",
            backgroundImage:
              "linear-gradient(45deg, #161b22 25%, transparent 25%), linear-gradient(-45deg, #161b22 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #161b22 75%), linear-gradient(-45deg, transparent 75%, #161b22 75%)",
            backgroundSize: "32px 32px",
            backgroundPosition: "0 0, 0 16px, 16px -16px, -16px 0px",
          }}
        >
          {atlasImage && (
            <div
              style={{
                position: "absolute",
                left: `${trackPos.x}px`,
                top: `${trackPos.y}px`,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            >
              <AnimatedSprite
                manifest={manifest}
                animationState={currentState}
                atlasImage={atlasImage}
                scale={0.75}
                playbackSpeed={speed}
                paused={paused}
                showDebugRoot={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Multi-Scale Comparison Strip */}
      <div
        style={{
          background: "#161b24",
          border: "1px solid #2d3748",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#f3f4f6" }}>
          Multi-Scale Readability & Silhouette Strip
        </h3>
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-end" }}>
          {/* Native 1x (288px) */}
          <div data-testid="scale-view-native" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>Native 1x (288px)</span>
            <div style={{ background: "#0b0f17", padding: "8px", borderRadius: "6px", border: "1px solid #1f2937" }}>
              {atlasImage && (
                <AnimatedSprite
                  manifest={manifest}
                  animationState={currentState}
                  atlasImage={atlasImage}
                  scale={1.0}
                  playbackSpeed={speed}
                  paused={paused}
                />
              )}
            </div>
          </div>

          {/* Roost Reference ~0.625x (180px) */}
          <div data-testid="scale-view-roost" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>CastleView Roost Reference (~180px)</span>
            <div style={{ background: "#0b0f17", padding: "8px", borderRadius: "6px", border: "1px solid #1f2937" }}>
              {atlasImage && (
                <AnimatedSprite
                  manifest={manifest}
                  animationState={currentState}
                  atlasImage={atlasImage}
                  scale={0.625}
                  playbackSpeed={speed}
                  paused={paused}
                />
              )}
            </div>
          </div>

          {/* Map Experimental ~0.25x (72px) */}
          <div data-testid="scale-view-map" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>Experimental Map Tactical (~72px)</span>
            <div style={{ background: "#0b0f17", padding: "8px", borderRadius: "6px", border: "1px solid #1f2937" }}>
              {atlasImage && (
                <AnimatedSprite
                  manifest={manifest}
                  animationState={currentState}
                  atlasImage={atlasImage}
                  scale={0.25}
                  playbackSpeed={speed}
                  paused={paused}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
