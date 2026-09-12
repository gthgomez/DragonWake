# DragonWake Animated Sprite Runtime & Development Bridge

## 1. Overview

DragonWake includes an engine-neutral 2D sprite runtime and developer visual preview harness designed to render AGES-generated animated character and creature sprites with high fidelity and zero production game pollution.

The runtime supports:
- High-performance HTML5 Canvas rendering with automatic `devicePixelRatio` scaling.
- Native linear smoothing (`imageSmoothingQuality = "high"`) preventing pixelation of painted raster artwork.
- Interval-based frame and event clocks ensuring deterministic triggers (e.g. `bite_impact` combat events).
- Cryptographic Content-Addressable Storage (CAS) verification of imported sprite atlases.

---

## 2. Quickstart for Developers

### 2.1 Importing an AGES Runtime Package

To import the latest exported AGES sprite package into your local development environment:

```bash
pnpm --filter @dragonwake/web sprite:preview-import
```

By default, this imports from `tools/gamedev/artifacts/runtime_exports/dragonwake/vale_drake`.
You may also specify a custom path or package digest:

```bash
pnpm --filter @dragonwake/web sprite:preview-import --source path/to/export/package
```

The importer:
1. Validates `integrity.json` in the export folder.
2. Stages files into `apps/web/.preview-assets/<asset_id>/<package_digest>/`.
3. Updates `apps/web/.preview-assets/current.json` atomically.

### 2.2 Launching the Visual Preview Harness

Start the DragonWake dev server:

```bash
pnpm --filter @dragonwake/web dev
```

Open your browser to:
`http://localhost:5173/sprite-preview.html`

The preview harness provides:
- Live state switching: `IDLE`, `WALK`, `ATTACK`.
- Variable playback speeds ($0.25\times$, $0.5\times$, $1.0\times$, $2.0\times$).
- Debug overlays: Logical Pivot (cyan crosshair), Gameplay Root (green anchor dot), Frame Bounding Box (yellow dashed line).
- Locomotion Kinematic Simulator: Translates the sprite along a simulated ground track along the southwest isometric vector $(-0.707, 0.707)$ at variable speeds ($60, 90, 140\text{ px/s}$) to evaluate foot drift.
- Multi-Scale Strip: Evaluates silhouette readability simultaneously at $1.0\times$ ($288\text{px}$ Native), $0.625\times$ ($180\text{px}$ CastleView Roost), and $0.25\times$ ($72\text{px}$ World Map Tactical).

To run with the minimal headless synthetic test fixture:
`http://localhost:5173/sprite-preview.html?fixture=synthetic`

---

## 3. Isolation & Security Guarantees

- **No Public Leaks**: Preview assets are staged exclusively under `apps/web/.preview-assets/`, which is ignored by Git (`.gitignore`).
- **No Production Leaks**: `apps/web/vite.config.ts` configures Vite middleware that is active only during `vite dev` (`apply: "serve"`). The production build entry (`build.rollupOptions.input`) is strictly locked to `index.html`. Building production via `pnpm --filter @dragonwake/web build` outputs 0 bytes of preview code or assets.
- **Fail-Closed Atlas Loader**: `loadVerifiedAtlas()` verifies the downloaded image ArrayBuffer against the authoritative SHA-256 hash in `sprite.runtime.json` before creating an object URL. Any corrupted or tampered file is rejected immediately.

---

## 4. Component Reference

### `AnimatedSprite` (`apps/web/src/ui/AnimatedSprite.tsx`)

```tsx
import { AnimatedSprite } from "./ui/AnimatedSprite";

<AnimatedSprite
  manifest={manifest}
  animationState="idle"
  atlasImage={verifiedAtlasImage}
  scale={0.625}
  playbackSpeed={1.0}
  paused={false}
  onEvent={(event, frameIndex) => console.log(event.name)}
  onComplete={() => console.log("one-shot complete")}
  showDebugRoot={false}
  showDebugPivot={false}
  showDebugBounds={false}
/>
```

### `SpritePlaybackClock` (`apps/web/src/lib/spriteAnimation.ts`)

Pure TypeScript state clock with zero React re-render overhead. Manages delta time, frame index calculation, loop boundaries, one-shot clamping, and interval-based event dispatches.

---

## 5. Next Steps: Gameplay Placement

The bridge is engineered so that the upcoming gameplay placement mission can directly mount `AnimatedSprite` into real DragonWake views (e.g. `CastleView.tsx` Roost panel or `RealmView.tsx` tactical map) without altering the asset format, loader logic, or verification contract.
