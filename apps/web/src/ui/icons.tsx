import type { ReactNode } from "react";

/**
 * Names of every built-in UI/resource glyph.
 * Each has a matching `icon-<name>.svg` record under `public/art/icons/`.
 */
export type IconName =
  | "food"
  | "wood"
  | "stone"
  | "ore"
  | "crownmark"
  | "sword"
  | "shield"
  | "scroll"
  | "dragon"
  | "hammer"
  | "flask"
  | "crown"
  | "keep"
  | "homes"
  | "barracks"
  | "scriptorium"
  | "yard"
  | "gallery"
  | "watchtower"
  | "store"
  | "camp";

type IconProps = {
  /** Rendered width/height in px (square icons). Defaults to 16. */
  size?: number;
  /** Accessible label; omit for decorative usage (aria-hidden). */
  title?: string;
};

const GLYPHS: Record<IconName, ReactNode> = {
  food: (
    <>
      <path d="M12 21V9" />
      <path d="M12 9C10.4 7.9 10.4 5.6 12 3.6c1.6 2 1.6 4.3 0 5.4Z" />
      <path d="M12 9c-2.3-.1-3.9-1.6-4.1-3.9 2.3.1 3.9 1.6 4.1 3.9Z" />
      <path d="M12 9c2.3-.1 3.9-1.6 4.1-3.9-2.3.1-3.9 1.6-4.1 3.9Z" />
      <path d="M12 13c-2.3-.1-3.9-1.6-4.1-3.9 2.3.1 3.9 1.6 4.1 3.9Z" />
      <path d="M12 13c2.3-.1 3.9-1.6 4.1-3.9-2.3.1-3.9 1.6-4.1 3.9Z" />
      <path d="M12 21c-3-.1-5-1.7-5.5-4.5 2.9.4 4.9 2 5.5 4.5Z" />
      <path d="M12 21c3-.1 5-1.7 5.5-4.5-2.9.4-4.9 2-5.5 4.5Z" />
    </>
  ),
  wood: (
    <>
      <circle cx="6" cy="17" r="2.5" />
      <circle cx="6" cy="10.5" r="2.5" />
      <path d="M6 14.5h11a2.5 2.5 0 0 1 0 5H6" />
      <path d="M6 8h7.5a2.5 2.5 0 0 1 0 5H6" />
    </>
  ),
  stone: (
    <>
      <path d="M12 4.5 19 8.5v7l-7 4-7-4v-7z" />
      <path d="m5 8.5 7 4 7-4" />
      <path d="M12 12.5v7" />
    </>
  ),
  ore: (
    <>
      <path d="M4.5 16.5 6.3 11.6a1.6 1.6 0 0 1 1.5-1.1h8.4a1.6 1.6 0 0 1 1.5 1.1l1.8 4.9z" />
      <path d="M9.5 13.5h5" />
    </>
  ),
  crownmark: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="4.8" />
      <path d="M12 9.8v4.4M9.8 12h4.4" />
    </>
  ),
  sword: (
    <>
      <path d="M9.7 13V5.3L12 3l2.3 2.3V13z" />
      <path d="M12 6.2V13" />
      <path d="M7 14h10" />
      <path d="M12 14v4.2" />
      <circle cx="12" cy="19.7" r="1.4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 2.4v5.1c0 4.6-2.9 8.4-7 10-4.1-1.6-7-5.4-7-10V5.4z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </>
  ),
  scroll: (
    <>
      <path d="M18.5 16.5V5.5a2 2 0 0 0-2-2H5.5" />
      <path d="M9 20.5h8a2 2 0 0 0 2-2v-1.3a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1.3a2 2 0 1 1-4 0v-13a2 2 0 1 0-4 0v2.2a1 1 0 0 0 1 1h3" />
    </>
  ),
  dragon: (
    <>
      <path d="M5 11.5C5 8.6 7 6.2 9.9 5.6l.9-2.6 2 1.9c4.1.3 7.2 2.9 7.2 6.3 0 1.7-1.1 2.9-2.7 2.9h-2.5l-1.7 3.2h-2.3l-.9-2.2H8.2C6.2 15.1 5 13.7 5 11.5Z" />
      <circle cx="13.9" cy="9.5" r="0.75" fill="currentColor" stroke="none" />
    </>
  ),
  hammer: (
    <>
      <path d="M12.8 4.6 18.9 10.7 16.2 13.4 10.1 7.3z" />
      <path d="M11 8.2 4.6 14.6a1.9 1.9 0 0 0 2.7 2.7l6.4-6.4" />
      <path d="m14.5 6.9 2.1 2.1" />
    </>
  ),
  flask: (
    <>
      <path d="M9.8 3.5h4.4" />
      <path d="M10.4 3.5v5.1l-5 8.2a2.5 2.5 0 0 0 2.1 3.7h9a2.5 2.5 0 0 0 2.1-3.7l-5-8.2V3.5" />
      <path d="M7.6 14.6h8.8" />
    </>
  ),
  crown: (
    <>
      <path d="M4.6 16.5 3.5 8l4.9 3.4L12 5.2l3.6 6.2L20.5 8l-1.1 8.5z" />
      <path d="M5.2 19.5h13.6" />
      <circle cx="12" cy="12.6" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  keep: (
    <>
      <path d="M6 20.5V9l6-4 6 4v11.5" />
      <path d="M4 20.5h16" />
      <path d="M10 20.5v-5h4v5" />
      <path d="M9 9.5h6" />
    </>
  ),
  homes: (
    <>
      <path d="m4 11 8-6.5L20 11" />
      <path d="M6 9.8V20h12V9.8" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  barracks: (
    <>
      <path d="m3.5 19 8.5-13 8.5 13z" />
      <path d="M7 19v-3.5h10V19" />
      <path d="M12 6V3.5" />
    </>
  ),
  scriptorium: (
    <>
      <path d="M12 6.5c-1.8-1.6-4.4-2-7-1.5v13c2.6-.5 5.2-.1 7 1.5 1.8-1.6 4.4-2 7-1.5v-13c-2.6-.5-5.2-.1-7 1.5Z" />
      <path d="M12 6.5v13" />
      <path d="M8 9.5c1.2-.2 2.4 0 3 .4" />
      <path d="M8 12.5c1.2-.2 2.4 0 3 .4" />
    </>
  ),
  yard: (
    <>
      <path d="M6 21V4" />
      <path d="M6 5h11l-2.5 3.5L17 12H6" />
    </>
  ),
  gallery: (
    <>
      <path d="M12 4.5 14 9l4.8.4-3.6 3.2 1.1 4.7-4.3-2.6-4.3 2.6 1.1-4.7L5.2 9.4 10 9z" />
      <path d="M5.5 19.5h13" />
    </>
  ),
  watchtower: (
    <>
      <path d="M9 20.5 10 8h4l1 12.5" />
      <path d="M8.5 8V4.5h7V8" />
      <path d="M7 20.5h10" />
      <path d="M12 4.5V3" />
    </>
  ),
  store: (
    <>
      <path d="M5.5 8.5h13l-1 12h-11z" />
      <path d="M4.5 8.5 6 4h12l1.5 4.5" />
      <path d="M9.5 12.5v4M14.5 12.5v4" />
    </>
  ),
  camp: (
    <>
      <path d="m4 19 8-12 8 12z" />
      <path d="m9.5 19 2.5-4 2.5 4" />
      <path d="M4 19h16" />
    </>
  ),
};

function IconSvg({
  size = 16,
  title,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Wheat sheaf (food resource). */
export function IconFood(props: IconProps) {
  return <IconSvg {...props}>{GLYPHS.food}</IconSvg>;
}

/** Stacked logs (wood resource). */
export function IconTimber(props: IconProps) {
  return <IconSvg {...props}>{GLYPHS.wood}</IconSvg>;
}

/** Isometric quarried block (stone resource). */
export function IconStone(props: IconProps) {
  return <IconSvg {...props}>{GLYPHS.stone}</IconSvg>;
}

/** Poured ingot (ore resource). */
export function IconIron(props: IconProps) {
  return <IconSvg {...props}>{GLYPHS.ore}</IconSvg>;
}

/** Stamped crownmark (gold resource). */
export function IconCoin(props: IconProps) {
  return <IconSvg {...props}>{GLYPHS.crownmark}</IconSvg>;
}

/** Upright arming sword (combat/military). */
export function IconSword(props: IconProps) {
  return <IconSvg {...props}>{GLYPHS.sword}</IconSvg>;
}

/** Heater shield with boss (defense). */
export function IconShield(props: IconProps) {
  return <IconSvg {...props}>{GLYPHS.shield}</IconSvg>;
}

/** Unrolled scroll (quests/reports). */
export function IconScroll(props: IconProps) {
  return <IconSvg {...props}>{GLYPHS.scroll}</IconSvg>;
}

/** Dragon head profile (dragons/bestiary). */
export function IconDragon(props: IconProps) {
  return <IconSvg {...props}>{GLYPHS.dragon}</IconSvg>;
}

/** War hammer (construction/siege). */
export function IconHammer(props: IconProps) {
  return <IconSvg {...props}>{GLYPHS.hammer}</IconSvg>;
}

/** Potion flask (alchemy/boosts). */
export function IconFlask(props: IconProps) {
  return <IconSvg {...props}>{GLYPHS.flask}</IconSvg>;
}

/** Three-point crown (prestige/rank). */
export function IconCrown(props: IconProps) {
  return <IconSvg {...props}>{GLYPHS.crown}</IconSvg>;
}

/**
 * Generic icon renderer: `<Icon name="food" size={18} title="Food" />`.
 * Inline SVG inheriting `currentColor`; no network requests.
 */
export function Icon({
  name,
  size,
  title,
}: IconProps & { name: IconName }) {
  return (
    <IconSvg size={size} title={title}>
      {GLYPHS[name]}
    </IconSvg>
  );
}
