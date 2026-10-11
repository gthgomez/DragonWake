# Visual Comparison Report — baseline

- Target: `docs/design/reference-art/DragonWake-AlphaDesign.png` (1672×941)
- Current: `apps/web/e2e/artifacts/north-star-v2/after_desktop.png` (1280×3714)
- Side-by-side: `[baseline_side_by_side.png](e2e/artifacts/visual-review/baseline_side_by_side.png)`
- 50% Overlay: `[baseline_overlay_50.png](e2e/artifacts/visual-review/baseline_overlay_50.png)`
- Heatmap: `[baseline_diff_heatmap.png](e2e/artifacts/visual-review/baseline_diff_heatmap.png)`

## Region Analysis

| Region ID | Name | Box [x1,y1,x2,y2] | MAE (0-255) | RMSE | PSNR (dB) |
|---|---|---|---|---|---|
| `full_bleed_world` | Full-Bleed World Canvas | `[0, 0, 1672, 941]` | 48.55 | 67.04 | 11.60 |
| `main_citadel` | Main Citadel | `[365, 50, 895, 390]` | 69.64 | 87.04 | 9.34 |
| `dragon_roost` | Dragon Roost | `[920, 65, 1320, 435]` | 60.37 | 76.42 | 10.47 |
| `settlement` | Dense Medieval Settlement Quarter | `[90, 345, 1050, 750]` | 45.33 | 59.85 | 12.59 |
| `fortifications` | Foreground Fortifications | `[0, 590, 1250, 845]` | 38.12 | 52.26 | 13.77 |
| `natural_environment` | Natural Environment & Harbor | `[0, 0, 1672, 941]` | 48.55 | 67.04 | 11.60 |
| `brand_logo_hud` | Brand / Logo HUD | `[0, 0, 445, 170]` | 34.07 | 50.14 | 14.13 |
| `top_resources` | Top Resource Bar | `[455, 0, 1180, 70]` | 43.66 | 62.68 | 12.19 |
| `upper_right_controls` | Upper-Right Controls | `[1290, 0, 1672, 75]` | 24.66 | 35.88 | 17.03 |
| `left_rail` | Left Portrait & Rail | `[0, 180, 155, 660]` | 25.95 | 39.67 | 16.16 |
| `right_objective_card` | Right Objective Card | `[1460, 85, 1660, 250]` | 41.17 | 56.42 | 13.10 |
| `bottom_dock` | Bottom Dock | `[530, 785, 1300, 941]` | 52.85 | 84.87 | 9.56 |
| `bottom_message_strip` | Bottom Message / Quest Strip | `[0, 860, 560, 941]` | 57.79 | 96.66 | 8.43 |
