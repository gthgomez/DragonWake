/**
 * Generic DragonWake AnimatedSprite Component.
 *
 * Renders an AGES runtime sprite onto an HTML5 canvas:
 * - Painted-raster aware: DPR backing-store scaling with high-quality linear smoothing.
 * - Zero React re-renders in RAF loop: animation updates direct to 2D context.
 * - Supports arbitrary frame rects, visual offsets, pivots, roots, and scale.
 * - Configurable debug overlays: logical pivot, gameplay root, frame bounds.
 * - Safe lifecycle management: cancels RAF on unmount or pause.
 */

import React, { useEffect, useRef } from "react";
import {
  SpritePlaybackClock,
  type SpriteAnimationEvent,
  type SpriteRuntimeManifest,
} from "../lib/spriteAnimation";

export interface AnimatedSpriteProps {
  manifest: SpriteRuntimeManifest;
  animationState: string;
  atlasImage: HTMLImageElement | ImageBitmap | null;
  scale?: number;
  playbackSpeed?: number;
  paused?: boolean;
  showDebugPivot?: boolean;
  showDebugRoot?: boolean;
  showDebugBounds?: boolean;
  samplingPolicy?: "linear" | "nearest";
  onEvent?: (event: SpriteAnimationEvent, frameIndex: number) => void;
  onComplete?: () => void;
  onFrameChange?: (frameIndex: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedSprite: React.FC<AnimatedSpriteProps> = ({
  manifest,
  animationState,
  atlasImage,
  scale = 1.0,
  playbackSpeed = 1.0,
  paused = false,
  showDebugPivot = false,
  showDebugRoot = false,
  showDebugBounds = false,
  samplingPolicy = "linear",
  onEvent,
  onComplete,
  onFrameChange,
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const clockRef = useRef<SpritePlaybackClock | null>(null);
  const currentFrameIdxRef = useRef<number>(-1);
  const lastTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number>(0);

  // Callbacks refs to avoid stale closures in RAF loop
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onFrameChangeRef = useRef(onFrameChange);
  onFrameChangeRef.current = onFrameChange;

  const currentAnim = manifest.animations[animationState];

  // Initialize or update animation state
  useEffect(() => {
    if (!currentAnim) return;

    if (!clockRef.current) {
      clockRef.current = new SpritePlaybackClock(currentAnim);
    } else {
      clockRef.current.setAnimation(currentAnim, true);
    }
    currentFrameIdxRef.current = -1;
  }, [currentAnim, animationState]);

  // Update speed
  useEffect(() => {
    if (clockRef.current) {
      clockRef.current.setSpeed(playbackSpeed);
    }
  }, [playbackSpeed]);

  // Update pause state
  useEffect(() => {
    if (clockRef.current) {
      if (paused) clockRef.current.pause();
      else clockRef.current.resume();
    }
  }, [paused]);

  // Main RAF rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentAnim || !atlasImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;
    lastTimeRef.current = performance.now();

    const renderTick = (now: number) => {
      if (!isRunning) return;

      const deltaMs = Math.max(0, now - lastTimeRef.current);
      lastTimeRef.current = now;

      const clock = clockRef.current;
      if (clock) {
        const updateRes = clock.update(
          deltaMs,
          (ev, idx) => {
            onEventRef.current?.(ev, idx);
          },
          () => {
            onCompleteRef.current?.();
          }
        );

        // Notify frame change only when index actually changed
        if (updateRes.frameIndex !== currentFrameIdxRef.current) {
          currentFrameIdxRef.current = updateRes.frameIndex;
          onFrameChangeRef.current?.(updateRes.frameIndex);
        }

        const frame = updateRes.frame;
        const dpr = window.devicePixelRatio || 1;

        // Logical CSS dimensions
        const cssW = frame.w * scale;
        const cssH = frame.h * scale;

        // Backing-store dimensions
        if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
          canvas.width = Math.round(cssW * dpr);
          canvas.height = Math.round(cssH * dpr);
        }

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, cssW, cssH);

        // High quality linear smoothing for painted raster art
        ctx.imageSmoothingEnabled = samplingPolicy !== "nearest";
        if (ctx.imageSmoothingEnabled) {
          ctx.imageSmoothingQuality = "high";
        }

        // Draw equation:
        // Position frame in center of canvas with logical visual offsets
        const destX = frame.offset_x * scale;
        const destY = frame.offset_y * scale;

        ctx.drawImage(
          atlasImage,
          frame.x,
          frame.y,
          frame.w,
          frame.h,
          destX,
          destY,
          frame.w * scale,
          frame.h * scale
        );

        // Debug overlays
        if (showDebugBounds) {
          ctx.strokeStyle = "rgba(0, 220, 255, 0.75)";
          ctx.lineWidth = 1;
          ctx.strokeRect(destX + 0.5, destY + 0.5, frame.w * scale - 1, frame.h * scale - 1);
        }

        if (showDebugPivot && currentAnim.logical_pivot) {
          const px = destX + currentAnim.logical_pivot[0] * scale;
          const py = destY + currentAnim.logical_pivot[1] * scale;
          ctx.strokeStyle = "rgba(255, 30, 180, 0.9)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px - 10, py);
          ctx.lineTo(px + 10, py);
          ctx.moveTo(px, py - 10);
          ctx.lineTo(px, py + 10);
          ctx.stroke();
        }

        if (showDebugRoot && currentAnim.gameplay_root) {
          const rx = destX + currentAnim.gameplay_root[0] * scale;
          const ry = destY + currentAnim.gameplay_root[1] * scale;
          ctx.fillStyle = "rgba(50, 255, 70, 0.95)";
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(rx, ry, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      }

      rafIdRef.current = requestAnimationFrame(renderTick);
    };

    rafIdRef.current = requestAnimationFrame(renderTick);

    return () => {
      isRunning = false;
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [currentAnim, atlasImage, scale, samplingPolicy, showDebugBounds, showDebugPivot, showDebugRoot]);

  const frameWidth = currentAnim?.frames[0]?.w ?? 288;
  const frameHeight = currentAnim?.frames[0]?.h ?? 288;
  const cssWidth = frameWidth * scale;
  const cssHeight = frameHeight * scale;

  return (
    <canvas
      ref={canvasRef}
      data-testid="animated-sprite-canvas"
      role="img"
      aria-label={`${manifest.subject_id} animated sprite (${animationState})`}
      className={className}
      style={{
        width: `${cssWidth}px`,
        height: `${cssHeight}px`,
        display: "block",
        ...style,
      }}
    />
  );
};
