/**
 * CastleHUD — DOM Overlay HUD for the AlphaDesign Visual Reconstruction.
 * Authority: docs/design/reference-art/DragonWake-AlphaDesign.png (1672×941)
 *
 * Implements:
 * R07: Brand Crest, DragonWake logotype, "A STRONGER TOMORROW", navigation tabs
 * R08: Top 5-Resource Ribbon (Crownmarks, Wood, Stone, Ore, Dracolith) + Upkeep indicator
 * R09: Upper-right controls (Profile, Alliance, Mail/War with badge, Menu/Settings)
 * R10: Left Portrait & Action Rail (Portrait, Realm Lv bar, Deeds, Objectives, Settings, Faction)
 * R11: Right Objective Card ("Forges Stronger Realms") & Dragon Watch panel
 * R12: Bottom 5-Dock (Build, Muster, Forge, Roost, Map)
 * R13: Bottom-Left Message Strip ("A greater realm rises.")
 */
import { memo } from "react";
import { fmtNum } from "../../../lib/format";
import { TAB_LABELS, type Tab } from "../../../lib/gameConfig";
import type { City, Player } from "../../../lib/types";
import { Icon } from "../../../ui/icons";

type FoodStatus = {
  foodPerHour: number;
  upkeepPerHour: number;
  netPerHour: number;
  starving: boolean;
};

type CastleHUDProps = {
  city: City;
  cities?: City[];
  player: Player;
  setCityId?: (id: string) => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  activeDrawer: string | null;
  onToggleDrawer: (drawer: string) => void;
  unreadReports: number;
  food: FoodStatus | null;
  dragonWatchLevel: number;
  upgradeKeep: () => Promise<void>;
};

export const CastleHUD = memo(function CastleHUD({
  city,
  player,
  activeTab,
  onTabChange,
  activeDrawer,
  onToggleDrawer,
  unreadReports,
  food,
  dragonWatchLevel,
  upgradeKeep,
}: CastleHUDProps) {
  const keepLevel = city.keepLevel ?? 1;

  return (
    <div className="castle-hud-overlay" aria-label="Settlement HUD">
      {/* ── R07: Brand Crest, Logo & Nav (Top-Left) ────────────────────── */}
      <header className="hud-brand castle-hud-interactive" aria-label="Kingdom Brand">
        <img
          src="/art/alpha/castle/ui/crest_dragon.png"
          alt="DragonWake Crest"
          className="hud-brand-crest"
          draggable={false}
        />
        <div className="hud-brand-copy">
          <h1 className="hud-brand-title">DragonWake</h1>
          <p className="hud-brand-subtitle">A STRONGER TOMORROW</p>

          <nav className="tabs hud-tabs hud-brand-nav" aria-label="Main">
            {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`hud-brand-tab ${activeTab === t ? "active" : ""}`}
                onClick={() => onTabChange(t)}
              >
                {TAB_LABELS[t]}
                {t === "war" && unreadReports > 0 ? (
                  <span className="badge">{unreadReports}</span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── R08: Top 5-Resource Ribbon & Upkeep Indicator (Top-Center) ─── */}
      <div className="hud-resources-wrap" aria-label="Kingdom Resources">
        <div className="hud-resource-ribbon">
          {/* 1. Crownmarks / Gold */}
          <div className="hud-res-item" title="Crownmarks (Realm resource)">
            <img
              src="/art/alpha/castle/ui/res_gold.png"
              alt="Crownmarks"
              className="hud-res-icon"
              draggable={false}
            />
            <span className="hud-res-val">{fmtNum(city.resources?.crownmark ?? 0)}</span>
          </div>

          {/* 2. Wood */}
          <div className="hud-res-item" title="Wood">
            <img
              src="/art/alpha/castle/ui/res_wood.png"
              alt="Wood"
              className="hud-res-icon"
              draggable={false}
            />
            <span className="hud-res-val">{fmtNum(city.resources?.wood ?? 0)}</span>
          </div>

          {/* 3. Stone */}
          <div className="hud-res-item" title="Stone">
            <img
              src="/art/alpha/castle/ui/res_stone.png"
              alt="Stone"
              className="hud-res-icon"
              draggable={false}
            />
            <span className="hud-res-val">{fmtNum(city.resources?.stone ?? 0)}</span>
          </div>

          {/* 4. Ore */}
          <div className="hud-res-item" title="Ore">
            <img
              src="/art/alpha/castle/ui/res_ore.png"
              alt="Ore"
              className="hud-res-icon"
              draggable={false}
            />
            <span className="hud-res-val">{fmtNum(city.resources?.ore ?? 0)}</span>
          </div>

          {/* 5. Dracolith / Crystal (Earned Premium) */}
          <div
            className="hud-res-item"
            data-testid="res-dracolith"
            title="Dracoliths (Earned premium via Daily Deeds)"
          >
            <img
              src="/art/alpha/castle/ui/res_crystal.png"
              alt="Dracoliths"
              className="hud-res-icon"
              draggable={false}
            />
            <span className="city-visually-hidden">Dracoliths: </span>
            <span className="hud-res-val">{fmtNum(player.dracolith ?? 0)}</span>
          </div>

          {/* Plus button -> opens Steward's Wares */}
          <button
            type="button"
            className="hud-res-plus"
            title="Steward's Wares (Shop)"
            aria-label="Open Steward's Wares shop"
            onClick={() => onToggleDrawer("shop")}
          >
            +
          </button>
        </div>

        {/* Authoritative Food Upkeep status */}
        {food ? (
          <p
            className={`hud-upkeep-ribbon ${
              food.netPerHour < 0 ? "hud-upkeep-negative" : ""
            } ${food.starving ? "hud-upkeep-starving" : ""}`}
            data-testid="upkeep-indicator"
          >
            <span className="hud-upkeep-item">
              <Icon name="food" size={13} /> Food +{fmtNum(food.foodPerHour)}/h
            </span>
            <span className="hud-upkeep-sep" aria-hidden="true">·</span>
            <span className="hud-upkeep-item">
              Upkeep −{fmtNum(food.upkeepPerHour)}/h
            </span>
            <span className="hud-upkeep-sep" aria-hidden="true">·</span>
            <span className="hud-upkeep-item hud-upkeep-net">
              Net {food.netPerHour >= 0 ? "+" : "−"}
              {fmtNum(Math.abs(food.netPerHour))}/h
            </span>
            {food.starving ? (
              <span className="hud-upkeep-warning" data-testid="upkeep-warning">
                The stores run dry — the host goes hungry
              </span>
            ) : food.netPerHour < 0 ? (
              <span className="hud-upkeep-warning hud-upkeep-warning-soft">
                The host eats more than the fields yield
              </span>
            ) : null}
          </p>
        ) : null}
      </div>

      {/* ── R09: Upper-Right Controls ──────────────────────────────────── */}
      <div className="hud-controls-right castle-hud-interactive" aria-label="Game Controls">
        <button
          type="button"
          className="hud-ctrl-btn"
          title={`Commander: ${player.displayName}`}
          aria-label="Commander Profile"
        >
          <img
            src="/art/alpha/castle/ui/btn_helmet.png"
            alt="Profile"
            draggable={false}
          />
        </button>

        <button
          type="button"
          className="hud-ctrl-btn"
          title="Alliance"
          aria-label="Alliance Roster"
          onClick={() => onTabChange("alliance")}
        >
          <img
            src="/art/alpha/castle/ui/btn_alliance.png"
            alt="Alliance Roster"
            draggable={false}
          />
        </button>

        <button
          type="button"
          className="hud-ctrl-btn"
          title="War Reports"
          aria-label="Combat Reports"
          onClick={() => onTabChange("war")}
        >
          <img
            src="/art/alpha/castle/ui/btn_mail.png"
            alt="Combat Reports"
            draggable={false}
          />
          {unreadReports > 0 && <span className="badge">{unreadReports}</span>}
        </button>

        <button
          type="button"
          className="hud-ctrl-btn"
          title="Settings"
          aria-label="Game Menu"
          onClick={() => onTabChange("settings")}
        >
          <img
            src="/art/alpha/castle/ui/btn_menu.png"
            alt="Game Menu"
            draggable={false}
          />
        </button>
      </div>

      {/* ── R10: Left Portrait & Action Rail ───────────────────────────── */}
      <aside className="hud-left-rail castle-hud-interactive" aria-label="Commander Rail">
        <div className="hud-portrait-frame">
          <img
            src="/art/alpha/castle/ui/commander_portrait.png"
            alt="Commander Portrait"
            className="hud-portrait-img"
            draggable={false}
          />
        </div>

        <div className="hud-realm-badge">
          <span className="hud-realm-label">Realm Lv. {keepLevel}</span>
          <div className="hud-realm-bar">
            <div
              className="hud-realm-bar-fill"
              style={{ width: `${Math.min(100, (keepLevel / 10) * 100)}%` }}
            />
          </div>
        </div>

        <div className="hud-rail-buttons">
          <button
            type="button"
            className="hud-rail-btn"
            title="Daily Deeds"
            aria-label="Daily Deeds"
            onClick={() => onToggleDrawer("deeds")}
          >
            <img
              src="/art/alpha/castle/ui/rail_btn_mail.png"
              alt="Daily Deeds"
              draggable={false}
            />
          </button>

          <button
            type="button"
            className="hud-rail-btn"
            title="Objectives & Expeditions"
            aria-label="Objectives"
            onClick={() => onToggleDrawer("objectives")}
          >
            <img
              src="/art/alpha/castle/ui/rail_btn_trophy.png"
              alt="Objectives"
              draggable={false}
            />
          </button>

          <button
            type="button"
            className="hud-rail-btn"
            title="Settings"
            aria-label="System Settings"
            onClick={() => onTabChange("settings")}
          >
            <img
              src="/art/alpha/castle/ui/rail_btn_cog.png"
              alt="System Settings"
              draggable={false}
            />
          </button>

          <button
            type="button"
            className="hud-rail-btn"
            title="Holdings & Lands"
            aria-label="Territory Holdings"
            onClick={() => onTabChange("lands")}
          >
            <img
              src="/art/alpha/castle/ui/rail_btn_banner.png"
              alt="Territory Holdings"
              draggable={false}
            />
          </button>
        </div>
      </aside>

      {/* ── R11: Right Objective Card & Dragon Watch ───────────────────── */}
      <div className="hud-right-stack castle-hud-interactive" aria-label="Objectives & Watch">
        <section className="hud-objective-card" aria-label="Current Objective">
          <img
            src="/art/alpha/castle/ui/objective_card_thumb.png"
            alt="Citadel Objective"
            className="hud-obj-thumb"
            draggable={false}
          />
          <strong className="hud-obj-title">Forges Stronger Realms</strong>
          <p className="hud-obj-desc">
            Forge-Heart Level {keepLevel} · Expand your settlement foundations
          </p>
          <button
            type="button"
            className="hud-obj-btn"
            disabled={keepLevel >= 10}
            onClick={() => void upgradeKeep()}
          >
            {keepLevel >= 10 ? "Mastered" : `Upgrade to L${keepLevel + 1}`}
          </button>
        </section>

        {/* Dragon Watch Panel */}
        <section
          className="hud-dragon-watch-card dragon-watch-panel"
          data-testid="dragon-watch-panel"
          aria-label="Dragon Watch"
        >
          <div className="hud-dragon-watch-mark" aria-hidden="true">
            <Icon name="dragon" size={24} />
          </div>
          <div className="hud-dragon-watch-copy">
            <strong>Dragon Watch</strong>
            <p className="muted tiny">
              {dragonWatchLevel > 0
                ? `Level ${dragonWatchLevel} · records sign evidence`
                : "Raise tower to record evidence"}
            </p>
          </div>
        </section>
      </div>

      {/* ── R12: Bottom Action Dock (5 Circular Buttons) ────────────────── */}
      <nav className="hud-bottom-dock castle-hud-interactive" aria-label="Action Dock">
        <div className="hud-dock-item">
          <button
            type="button"
            className="hud-dock-btn"
            title="Build & Structures"
            aria-label="Build"
            aria-pressed={activeDrawer === "build"}
            onClick={() => onToggleDrawer("build")}
          >
            <img
              src="/art/alpha/castle/ui/dock_btn_build.png"
              alt="Build"
              draggable={false}
            />
          </button>
          <span className="hud-dock-label">Build</span>
        </div>

        <div className="hud-dock-item">
          <button
            type="button"
            className="hud-dock-btn"
            title="Muster Host"
            aria-label="Muster"
            aria-pressed={activeDrawer === "muster"}
            onClick={() => onToggleDrawer("muster")}
          >
            <img
              src="/art/alpha/castle/ui/dock_btn_muster.png"
              alt="Muster"
              draggable={false}
            />
          </button>
          <span className="hud-dock-label">Muster</span>
        </div>

        <div className="hud-dock-item">
          <button
            type="button"
            className="hud-dock-btn"
            title="Forge & Studies"
            aria-label="Forge"
            aria-pressed={activeDrawer === "forge"}
            onClick={() => onToggleDrawer("forge")}
          >
            <img
              src="/art/alpha/castle/ui/dock_btn_forge.png"
              alt="Forge"
              draggable={false}
            />
          </button>
          <span className="hud-dock-label">Forge</span>
        </div>

        <div className="hud-dock-item">
          <button
            type="button"
            className="hud-dock-btn"
            title="Dragon Roost"
            aria-label="Roost"
            aria-pressed={activeDrawer === "roost"}
            onClick={() => onToggleDrawer("roost")}
          >
            <img
              src="/art/alpha/castle/ui/dock_btn_roost.png"
              alt="Roost"
              draggable={false}
            />
          </button>
          <span className="hud-dock-label">Roost</span>
        </div>

        <div className="hud-dock-item">
          <button
            type="button"
            className="hud-dock-btn"
            title="Realm Map"
            aria-label="Map"
            onClick={() => onTabChange("realm")}
          >
            <img
              src="/art/alpha/castle/ui/dock_btn_map.png"
              alt="Map"
              draggable={false}
            />
          </button>
          <span className="hud-dock-label">Map</span>
        </div>
      </nav>

      {/* ── R13: Bottom-Left Message Strip ─────────────────────────────── */}
      <footer className="hud-message-strip castle-hud-interactive" aria-label="Settlement Bulletin">
        <img
          src="/art/alpha/castle/ui/scroll_icon.png"
          alt=""
          className="hud-message-icon"
          draggable={false}
        />
        <span className="hud-message-text">A greater realm rises.</span>
      </footer>
    </div>
  );
});
