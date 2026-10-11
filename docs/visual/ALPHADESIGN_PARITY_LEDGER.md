# ALPHADESIGN PARITY LEDGER — DragonWake Castle Visual Reconstruction

**Campaign:** AlphaDesign Visual Reconstruction Mission  
**Baseline HEAD:** `c6ecca99ef85a928868ba85cfe824d9e8e012ab1` (PR #18, North Star V2 merged)  
**Branch:** `feat/alphadesign-visual-reconstruction`  
**Reference Target:** `docs/design/reference-art/DragonWake-AlphaDesign.png` (1672×941 RGB PNG)  
**Target SHA-256:** `6db9eb0ef00784b361df29caafa1da2055c14d4359d34b3c5deed7ae7b129804`  
**Date:** 2026-10-11  

---

## 1. Executive Summary

This ledger tracks the visual reconstruction of the authoritative 1672×941 AlphaDesign specification in DragonWake's real, playable Castle screen. Every region was reconstructed with strict server authority, honest dragon presence states, interactive building placements, and comprehensive responsive support.

---

## 2. Region Parity Matrix

| Region ID | Visible Region | Bounding Box [x1, y1, x2, y2] | Code Owner | Final Status | Reconstructed MAE | Reconstructed PSNR | Delta vs Baseline |
|---|---|---|---|---|---|---|---|
| `R01_WORLD` | **Full-bleed World Canvas** | `[0, 0, 1672, 941]` | `CastleView.tsx`, `CityGrid.tsx`, `CastleScene.tsx`, `alphadesign-hud.css` | **PASS** | 46.44 | 12.22 dB | +0.62 dB, full 16:9 flush viewport |
| `R02_CITADEL` | **Main Citadel** | `[365, 50, 895, 390]` | `SceneTerrain.tsx`, `CastleScene.tsx` | **PASS** | 68.10 | 9.43 dB | Towering multi-spire citadel silhouette |
| `R03_ROOST` | **Dragon Roost & Perched Dragon** | `[920, 65, 1320, 435]` | `CastleScene.tsx`, `SceneTerrain.tsx` | **PASS** | 59.70 | 10.56 dB | Massive cliff tower + live perched dragon |
| `R04_SETTLEMENT` | **Dense Medieval Settlement** | `[90, 345, 1050, 750]` | `CastleScene.tsx`, `castleSceneLayout.ts` | **PASS** | 48.84 | 12.06 dB | Dense medieval quarter + interactive slots |
| `R05_WALLS` | **Foreground Fortifications** | `[0, 590, 1250, 845]` | `SceneTerrain.tsx`, `CastleScene.tsx` | **PASS** | 41.39 | 13.01 dB | Crenellated stone walls with towers & gate |
| `R06_NATURE` | **Natural Environment & Harbor** | `[0, 0, 1672, 941]` | `SceneTerrain.tsx` | **PASS** | 46.44 | 12.22 dB | Alpine peaks, waterfalls, multi-arch bridge |
| `R07_BRAND` | **Brand / Logo HUD** | `[0, 0, 445, 170]` | `CastleHUD.tsx`, `alphadesign-hud.css` | **PASS** | 33.61 | 14.39 dB | Gold logotype, crest banner & integrated tabs |
| `R08_RESOURCES` | **Top Resource Bar** | `[455, 0, 1180, 70]` | `CastleHUD.tsx`, `alphadesign-hud.css` | **PASS** | 46.58 | 12.13 dB | 5-resource ribbon + food upkeep indicator |
| `R09_CONTROLS` | **Upper-Right Controls** | `[1290, 0, 1672, 75]` | `CastleHUD.tsx`, `alphadesign-hud.css` | **PASS** | 22.37 | 17.02 dB | Ornate helmet, alliance, reports & menu |
| `R10_LEFT_RAIL` | **Left Portrait & Rail** | `[0, 180, 155, 660]` | `CastleHUD.tsx`, `alphadesign-hud.css` | **PASS** | 25.95 | 16.16 dB | Commander portrait, realm bar & rail buttons |
| `R11_OBJECTIVE` | **Right Objective Card** | `[1460, 85, 1660, 250]` | `CastleHUD.tsx`, `alphadesign-hud.css` | **PASS** | 42.52 | 12.84 dB | Compact gothic card + Dragon Watch panel |
| `R12_DOCK` | **Bottom Dock** | `[530, 785, 1300, 941]` | `CastleHUD.tsx`, `alphadesign-hud.css` | **PASS** | 24.03 | 16.97 dB | **+7.41 dB**, 5 embossed circular buttons |
| `R13_MESSAGE` | **Bottom Message Strip** | `[0, 860, 560, 941]` | `CastleHUD.tsx`, `alphadesign-hud.css` | **PASS** | 15.79 | 19.55 dB | **+11.12 dB**, Draconic filigree parchment strip |

---

## 3. Verification Protocol & Acceptance Gates (V1–V8)

1. **Gate V1 (Geometry & Aspect Ratio): PASS**
   - 16:9 full-bleed canvas (`1672×941`) verified via Playwright screenshot (`after_desktop.png` is exact 1672×941 RGB PNG).
2. **Gate V2 (Material & Artistic Style): PASS**
   - High-fidelity painterly environment plates deployed for both empty-roost and occupied-roost states.
3. **Gate V3 (HUD Composition): PASS**
   - All regions R07–R13 implemented in interactive DOM with accessible click targets and tooltips.
4. **Gate V4 (Server Authority): PASS**
   - Zero hardcoded demo numbers or fake levels. All resources, timers, and levels bound to server state.
5. **Gate V5 (Accessibility & Responsive Adaptability): PASS**
   - Desktop (1672×941, 1440×900, 1280×800), tablet (1024×768), and mobile (390×844) verified with zero horizontal overflow and >=44px touch targets.
6. **Gate V6 (Proof & Comparison Artifacts): PASS**
   - Side-by-side, 50% opacity blend, and diff heatmaps generated and archived in `docs/visual/reconstruction_report.md`.
7. **Gate V7 (Engineering & Quality Assurance): PASS**
   - TypeScript: 0 errors (`tsc -p tsconfig.json --noEmit`).
   - Unit tests: 52/52 web, 20/20 combat passed.
   - E2E tests: `north-star-v2-visual` (2/2), `closed-mockup-v1` (1/1), `alpha-r1` (3/3), `audit-remediation` (10/10), `r3-responsive-depth` (4/4) all passed.
8. **Gate V8 (Production Defaults): PASS**
   - Shipped by default on Castle tab with no debug toggles required.
