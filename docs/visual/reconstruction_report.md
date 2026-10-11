# Visual Comparison Report — reconstruction

- Target: `docs/design/reference-art/DragonWake-AlphaDesign.png` (1672×941)
- Current: `apps/web/e2e/artifacts/north-star-v2/after_desktop.png` (1672×941)
- Side-by-side: `[reconstruction_side_by_side.png](e2e/artifacts/visual-review/reconstruction_side_by_side.png)`
- 50% Overlay: `[reconstruction_overlay_50.png](e2e/artifacts/visual-review/reconstruction_overlay_50.png)`
- Heatmap: `[reconstruction_diff_heatmap.png](e2e/artifacts/visual-review/reconstruction_diff_heatmap.png)`

## Region Analysis

| Region ID | Name | Box [x1,y1,x2,y2] | MAE (0-255) | RMSE | PSNR (dB) |
|---|---|---|---|---|---|
| `full_bleed_world` | Full-Bleed World Canvas | `[0, 0, 1672, 941]` | 46.44 | 62.45 | 12.22 |
| `main_citadel` | Main Citadel | `[365, 50, 895, 390]` | 68.10 | 86.09 | 9.43 |
| `dragon_roost` | Dragon Roost | `[920, 65, 1320, 435]` | 59.70 | 75.58 | 10.56 |
| `settlement` | Dense Medieval Settlement Quarter | `[90, 345, 1050, 750]` | 48.84 | 63.59 | 12.06 |
| `fortifications` | Foreground Fortifications | `[0, 590, 1250, 845]` | 41.39 | 57.04 | 13.01 |
| `natural_environment` | Natural Environment & Harbor | `[0, 0, 1672, 941]` | 46.44 | 62.45 | 12.22 |
| `brand_logo_hud` | Brand / Logo HUD | `[0, 0, 445, 170]` | 33.61 | 48.65 | 14.39 |
| `top_resources` | Top Resource Bar | `[455, 0, 1180, 70]` | 46.58 | 63.09 | 12.13 |
| `upper_right_controls` | Upper-Right Controls | `[1290, 0, 1672, 75]` | 22.37 | 35.92 | 17.02 |
| `left_rail` | Left Portrait & Rail | `[0, 180, 155, 660]` | 25.95 | 39.67 | 16.16 |
| `right_objective_card` | Right Objective Card | `[1460, 85, 1660, 250]` | 42.52 | 58.17 | 12.84 |
| `bottom_dock` | Bottom Dock | `[530, 785, 1300, 941]` | 24.03 | 36.16 | 16.97 |
| `bottom_message_strip` | Bottom Message / Quest Strip | `[0, 860, 560, 941]` | 15.79 | 26.85 | 19.55 |
