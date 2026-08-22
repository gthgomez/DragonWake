# Tideforge Empires — Art Directory

Original, in-repo art assets for the web client. **Everything here is
placeholder-for-quality**: shapes are deliberately simple so gameplay work can
proceed; replace file-by-file without changing names.

## Layout

```
public/art/
├── README.md      <- you are here
├── icons/         <- 24x24 stroke-based resource/UI glyphs (see ui/icons.tsx)
├── tiles/         <- reserved: map terrain tiles (tile-<terrain>.svg)
└── buildings/     <- reserved: city building art (bld-<building>.svg)
```

## Naming conventions

- kebab-case, ASCII, lowercase, no spaces: `iron-ingot.svg`, never `Iron Ingot.svg`.
- Resource/UI icons: `icon-<name>.svg` (e.g. `icon-food.svg`, `icon-coin.svg`).
- Map terrain tiles: `tile-<terrain>.svg` (e.g. `tile-grass.svg`, `tile-water.svg`).
- Buildings: `bld-<building>.svg` (e.g. `bld-barracks.svg`, `bld-farm.svg`).
- One asset per file; no variant suffixes (`-hover`, `-dark`) — variants belong
  in CSS (filters, opacity, `color-mix()` overlays), not duplicated files.

## Icon technical spec (`icons/`)

- `viewBox="0 0 24 24"`, legible at 16 px.
- Stroke-based line art (`fill="none"`), `stroke-width="1.5"`,
  round caps/joins.
- Palette: neutral strokes `#d6c7a8`, single gold accent `#c49a45`.
- The `.svg` files hardcode those colors because they may be used via `<img>`;
  the React twins in `src/ui/icons.tsx` re-declare the same paths with
  `stroke="currentColor"` so inline icons inherit text color (including
  faction accents).

## Usage guidance

- **HUD / resources / buttons** — do NOT reference these `.svg` files. Import
  the inline React components from `src/ui/icons.tsx`
  (`import { Icon, type IconName } from "../ui/icons"`). They ship zero extra
  requests, inherit `currentColor`, and stay in sync with the token system.
- **Large scenery** (tiles, buildings, backdrops) — use raw URLs under `/art/…`
  via `<img>` or CSS `background-image`; these live in `public/` precisely so
  they are cacheable, swappable files that don't bloat the JS bundle.
- When an icon needs a one-off tint, wrap it and set `color:` — don't fork the
  SVG.

## Adding a new icon

1. Draw it in `public/art/icons/icon-<name>.svg` following the spec above.
2. Mirror its paths in `src/ui/icons.tsx` (add the glyph, the named component,
   and extend the `IconName` union).
3. Both must match — the `.svg` is the canonical artwork record; the TSX copy
   is what the app renders.

## License note

All art in this directory must be **original or generated in-repo** — never
ripped from games or asset packs. Fonts are self-hosted via
[@fontsource](https://fontsource.org/) packages and are licensed under the
SIL Open Font License (Cinzel, EB Garamond).
