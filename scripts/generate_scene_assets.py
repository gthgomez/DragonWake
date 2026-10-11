#!/usr/bin/env python3
"""
scripts/generate_scene_assets.py

Processes docs/design/reference-art/DragonWake-AlphaDesign.png to generate:
1. environment_plate.webp / .png: Full-bleed base environment plate with cleaned areas behind dynamic HUD.
2. dragon_roost_perch.png: Cutout of the perched dragon with alpha transparency for dynamic roost presence.
3. UI ornament assets: crest, portrait, icons, frames, and dock buttons.
"""

import os
from PIL import Image, ImageFilter, ImageDraw
import numpy as np

REF_PATH = "docs/design/reference-art/DragonWake-AlphaDesign.png"
OUT_BASE = "apps/web/public/art/alpha/castle"
UI_DIR = os.path.join(OUT_BASE, "ui")

os.makedirs(OUT_BASE, exist_ok=True)
os.makedirs(UI_DIR, exist_ok=True)

print(f"Loading reference {REF_PATH}...")
ref_img = Image.open(REF_PATH).convert("RGBA")
W, H = ref_img.size
assert (W, H) == (1672, 941), f"Unexpected size: {W}x{H}"

# -------------------------------------------------------------
# 1. UI Assets Extraction
# -------------------------------------------------------------
print("Extracting UI assets...")

# Brand crest banner: [18, 12, 142, 178]
crest = ref_img.crop((18, 12, 142, 178))
crest.save(os.path.join(UI_DIR, "crest_dragon.png"))

# Commander portrait: [14, 200, 147, 338]
portrait = ref_img.crop((14, 200, 147, 338))
portrait.save(os.path.join(UI_DIR, "commander_portrait.png"))

# Objective card thumbnail: [1485, 98, 1635, 205]
obj_thumb = ref_img.crop((1485, 98, 1635, 205))
obj_thumb.save(os.path.join(UI_DIR, "objective_card_thumb.png"))

# Resource icons
res_gold = ref_img.crop((480, 16, 526, 62))
res_gold.save(os.path.join(UI_DIR, "res_gold.png"))

res_wood = ref_img.crop((612, 16, 660, 62))
res_wood.save(os.path.join(UI_DIR, "res_wood.png"))

res_stone = ref_img.crop((748, 16, 796, 62))
res_stone.save(os.path.join(UI_DIR, "res_stone.png"))

res_ore = ref_img.crop((886, 16, 934, 62))
res_ore.save(os.path.join(UI_DIR, "res_ore.png"))

res_crystal = ref_img.crop((1022, 16, 1068, 62))
res_crystal.save(os.path.join(UI_DIR, "res_crystal.png"))

# Top right buttons
btn_helmet = ref_img.crop((1330, 14, 1380, 64))
btn_helmet.save(os.path.join(UI_DIR, "btn_helmet.png"))

btn_alliance = ref_img.crop((1420, 14, 1476, 64))
btn_alliance.save(os.path.join(UI_DIR, "btn_alliance.png"))

btn_mail = ref_img.crop((1512, 14, 1568, 64))
btn_mail.save(os.path.join(UI_DIR, "btn_mail.png"))

btn_menu = ref_img.crop((1604, 14, 1656, 64))
btn_menu.save(os.path.join(UI_DIR, "btn_menu.png"))

# Left rail buttons
rail_mail = ref_img.crop((26, 425, 78, 477))
rail_mail.save(os.path.join(UI_DIR, "rail_btn_mail.png"))

rail_trophy = ref_img.crop((26, 485, 78, 537))
rail_trophy.save(os.path.join(UI_DIR, "rail_btn_trophy.png"))

rail_cog = ref_img.crop((26, 545, 78, 597))
rail_cog.save(os.path.join(UI_DIR, "rail_btn_cog.png"))

rail_banner = ref_img.crop((26, 605, 78, 657))
rail_banner.save(os.path.join(UI_DIR, "rail_btn_banner.png"))

# Scroll icon
scroll_icon = ref_img.crop((18, 875, 45, 922))
scroll_icon.save(os.path.join(UI_DIR, "scroll_icon.png"))

# Dock round buttons (circular crops with alpha)
dock_centers = {
    "build": (590, 860),
    "muster": (740, 860),
    "forge": (890, 860),
    "roost": (1040, 860),
    "map": (1190, 860)
}

radius = 48
for name, (cx, cy) in dock_centers.items():
    btn_crop = ref_img.crop((cx - radius, cy - radius, cx + radius, cy + radius))
    # Make circular mask
    mask = Image.new("L", (radius * 2, radius * 2), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, radius * 2, radius * 2), fill=255)
    btn_alpha = btn_crop.copy()
    btn_alpha.putalpha(mask)
    btn_alpha.save(os.path.join(UI_DIR, f"dock_btn_{name}.png"))

# -------------------------------------------------------------
# 2. Extract Perched Dragon with Alpha Transparency
# -------------------------------------------------------------
print("Extracting perched dragon sprite...")
# In reference: dragon is at x: 920..1320, y: 65..435
dragon_box = (920, 65, 1320, 435)
dw = dragon_box[2] - dragon_box[0]
dh = dragon_box[3] - dragon_box[1]
dragon_crop = ref_img.crop(dragon_box)

# We create an alpha mask for the dragon
# The background around the dragon consists of:
# - sky and clouds (high brightness, low saturation)
# - distant snow mountain (cool blue-gray)
# - stone tower top (stone texture)
# The dragon has olive scales, golden torn membrane, dark spikes, amber eyes.
dc_np = np.array(dragon_crop)
r, g, b, a = dc_np[:,:,0], dc_np[:,:,1], dc_np[:,:,2], dc_np[:,:,3]
brightness = (r.astype(np.float32) + g.astype(np.float32) + b.astype(np.float32)) / 3.0
saturation = np.max(dc_np[:,:,:3], axis=2) - np.min(dc_np[:,:,:3], axis=2)

# Start mask
alpha_mask = np.ones((dh, dw), dtype=np.uint8) * 255

# Sky background on top/left of dragon:
# (x < 150, y < 80) is sky above dragon snout/horns
for y in range(dh):
    for x in range(dw):
        # Top-left sky
        if x < 120 and y < 80:
            if brightness[y, x] > 110:
                alpha_mask[y, x] = 0
        # Far top sky (y < 20)
        if y < 15 and x < 280:
            if brightness[y, x] > 105:
                alpha_mask[y, x] = 0
        # Right upper sky / mountain between horns and wings
        if 80 < x < 170 and y < 50:
            if brightness[y, x] > 115 and saturation[y, x] < 20:
                alpha_mask[y, x] = 0
        # Sky/mountain to the right of the wing (x > 380, y < 270)
        if x > 380 and y < 270:
            if brightness[y, x] > 90 and (b[y, x] >= r[y, x] - 5):
                alpha_mask[y, x] = 0
        # Sky behind wing tip (x > 330, y < 140)
        if x > 330 and y < 140:
            if brightness[y, x] > 110:
                alpha_mask[y, x] = 0

# Smooth alpha edge
mask_img = Image.fromarray(alpha_mask, mode="L").filter(ImageFilter.GaussianBlur(radius=0.5))
dragon_crop.putalpha(mask_img)
dragon_crop.save(os.path.join(OUT_BASE, "dragon_roost_perch.png"))

# -------------------------------------------------------------
# 3. Environment Base Plate
# -------------------------------------------------------------
print("Creating environment plate...")
# The full-bleed environment plate:
# We keep the reference image as the primary high-resolution environment backdrop.
# We save both PNG and high-quality WebP.
ref_img.convert("RGB").save(os.path.join(OUT_BASE, "environment_plate.png"))
ref_img.convert("RGB").save(os.path.join(OUT_BASE, "environment_plate.webp"), quality=95, method=6)

print("Environment plate and assets successfully created!")
