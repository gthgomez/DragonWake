#!/usr/bin/env python3
"""
tools/visual_compare.py — Visual comparison and verification tool for AlphaDesign reconstruction.

Generates:
1. Side-by-side image comparison (Target vs Current)
2. 50%-opacity blend overlay image
3. Per-region visual metric analysis using visual_regions.json
4. Region-specific crop comparisons
5. Formatted Markdown report
"""

import argparse
import json
import os
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

def load_regions(regions_path):
    if not os.path.exists(regions_path):
        return None
    with open(regions_path, "r", encoding="utf-8") as f:
        return json.load(f)

def compute_region_metrics(target_np, current_np, box):
    x1, y1, x2, y2 = box
    t_crop = target_np[y1:y2, x1:x2]
    c_crop = current_np[y1:y2, x1:x2]
    
    if t_crop.size == 0 or c_crop.size == 0:
        return {"mae": 0.0, "rmse": 0.0, "psnr": 0.0}
    
    diff = np.abs(t_crop.astype(np.float32) - c_crop.astype(np.float32))
    mae = float(np.mean(diff))
    mse = float(np.mean(diff ** 2))
    rmse = float(np.sqrt(mse))
    psnr = float(20 * np.log10(255.0 / (rmse + 1e-9))) if rmse > 0 else 99.0
    
    return {
        "mae": mae,
        "rmse": rmse,
        "psnr": psnr
    }

def main():
    parser = argparse.ArgumentParser(description="DragonWake AlphaDesign visual comparator")
    parser.add_argument("--target", default="docs/design/reference-art/DragonWake-AlphaDesign.png", help="Path to reference target image")
    parser.add_argument("--current", required=True, help="Path to current gameplay screenshot")
    parser.add_argument("--regions", default="visual_regions.json", help="Path to visual regions JSON")
    parser.add_argument("--outdir", default="e2e/artifacts/visual-review", help="Output directory for diff artifacts")
    parser.add_argument("--label", default="current", help="Label for current capture")
    args = parser.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    if not os.path.exists(args.target):
        print(f"Error: target {args.target} not found", file=sys.stderr)
        sys.exit(1)
    if not os.path.exists(args.current):
        print(f"Error: current {args.current} not found", file=sys.stderr)
        sys.exit(1)

    target_img = Image.open(args.target).convert("RGB")
    current_img = Image.open(args.current).convert("RGB")

    tw, th = target_img.size
    # Ensure current matches target dimensions for exact overlay
    if current_img.size != (tw, th):
        print(f"Resizing current image from {current_img.size} to target dimensions {(tw, th)}")
        current_img_scaled = current_img.resize((tw, th), Image.Resampling.LANCZOS)
    else:
        current_img_scaled = current_img

    # 1. 50% opacity overlay
    overlay = Image.blend(target_img, current_img_scaled, 0.5)
    overlay_path = os.path.join(args.outdir, f"{args.label}_overlay_50.png")
    overlay.save(overlay_path)

    # 2. Side-by-side (Target on left, Current on right)
    side_by_side = Image.new("RGB", (tw * 2, th))
    side_by_side.paste(target_img, (0, 0))
    side_by_side.paste(current_img_scaled, (tw, 0))
    sbs_path = os.path.join(args.outdir, f"{args.label}_side_by_side.png")
    side_by_side.save(sbs_path)

    # 3. Per-region analysis
    regions_data = load_regions(args.regions)
    target_np = np.array(target_img)
    current_np = np.array(current_img_scaled)

    results = []
    if regions_data and "regions" in regions_data:
        for r_id, r_info in regions_data["regions"].items():
            box = r_info["box"]
            metrics = compute_region_metrics(target_np, current_np, box)
            results.append({
                "id": r_id,
                "name": r_info.get("name", r_id),
                "box": box,
                "description": r_info.get("description", ""),
                **metrics
            })

    # 4. Generate visual difference heatmap
    diff_np = np.abs(target_np.astype(np.float32) - current_np.astype(np.float32))
    # grayscale diff
    diff_gray = np.mean(diff_np, axis=2).astype(np.uint8)
    diff_img = Image.fromarray(diff_gray, mode="L")
    diff_path = os.path.join(args.outdir, f"{args.label}_diff_heatmap.png")
    diff_img.save(diff_path)

    # 5. Output Markdown Summary
    report_path = os.path.join(args.outdir, f"{args.label}_report.md")
    with open(report_path, "w", encoding="utf-8") as rf:
        rf.write(f"# Visual Comparison Report — {args.label}\n\n")
        rf.write(f"- Target: `{args.target}` ({tw}×{th})\n")
        rf.write(f"- Current: `{args.current}` ({current_img.size[0]}×{current_img.size[1]})\n")
        rf.write(f"- Side-by-side: `[{os.path.basename(sbs_path)}]({sbs_path})`\n")
        rf.write(f"- 50% Overlay: `[{os.path.basename(overlay_path)}]({overlay_path})`\n")
        rf.write(f"- Heatmap: `[{os.path.basename(diff_path)}]({diff_path})`\n\n")
        rf.write("## Region Analysis\n\n")
        rf.write("| Region ID | Name | Box [x1,y1,x2,y2] | MAE (0-255) | RMSE | PSNR (dB) |\n")
        rf.write("|---|---|---|---|---|---|\n")
        for r in results:
            rf.write(f"| `{r['id']}` | {r['name']} | `{r['box']}` | {r['mae']:.2f} | {r['rmse']:.2f} | {r['psnr']:.2f} |\n")

    print(f"Generated comparison artifacts in {args.outdir}:")
    print(f"  Overlay: {overlay_path}")
    print(f"  Side-by-side: {sbs_path}")
    print(f"  Diff: {diff_path}")
    print(f"  Report: {report_path}")

if __name__ == "__main__":
    main()
