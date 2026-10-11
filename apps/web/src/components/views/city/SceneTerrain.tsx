/**
 * Authored settlement terrain for the Castle scene — AlphaDesign Visual Reconstruction.
 *
 * Full-bleed illustrated environment plate matching the 1672×941 AlphaDesign specification:
 * alpine mountains, waterfalls, fjord harbor with bridge and ships, towering gothic citadel,
 * dragon roost fortress tower, dense medieval quarter, and articulated stone curtain walls.
 */
import { memo } from "react";

type SceneTerrainProps = {
  emptyRoost?: boolean;
};

export const SceneTerrain = memo(function SceneTerrain({ emptyRoost }: SceneTerrainProps) {
  const plateSrc = emptyRoost
    ? "/art/alpha/castle/environment_plate_empty_roost.webp"
    : "/art/alpha/castle/environment_plate.webp";

  return (
    <div className="castle-terrain-container" aria-hidden="true">
      <img
        src={plateSrc}
        alt=""
        className="castle-terrain-plate"
        draggable={false}
        loading="eager"
        decoding="sync"
      />
      <svg
        className="castle-terrain-atmosphere"
        viewBox="0 0 1672 941"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <radialGradient id="sunGlow" cx="0.48" cy="0.12" r="0.55">
            <stop offset="0%" stopColor="rgba(255, 235, 180, 0.18)" />
            <stop offset="60%" stopColor="rgba(255, 210, 140, 0.05)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
          <linearGradient id="warmHaze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(210, 190, 150, 0)" />
            <stop offset="65%" stopColor="rgba(215, 185, 130, 0.04)" />
            <stop offset="100%" stopColor="rgba(10, 8, 5, 0.25)" />
          </linearGradient>
        </defs>
        {/* Soft upper-center sunlight & atmospheric depth */}
        <rect width="1672" height="941" fill="url(#sunGlow)" />
        <rect width="1672" height="941" fill="url(#warmHaze)" />
      </svg>
    </div>
  );
});
