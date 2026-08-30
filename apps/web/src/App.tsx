import { useEffect, useState } from "react";

import "./styles/factions.css";
import { LoginView } from "./components/LoginView";
import { Shell } from "./components/Shell";
import { CastleView } from "./components/views/CastleView";
import { LandsView } from "./components/views/LandsView";
import { RealmView } from "./components/views/RealmView";
import { WarView } from "./components/views/WarView";
import { AllianceView } from "./components/views/AllianceView";
import { KnowledgeView } from "./components/views/KnowledgeView";
import { SettingsView } from "./components/views/SettingsView";
import { useGame } from "./hooks/useGame";
import type { Tab } from "./lib/gameConfig";

export function App() {
  const [tab, setTab] = useState<Tab>("castle");
  const g = useGame();

  // Charter/expedition state drives the Castle objective card; keep it fresh
  // wherever the player is so the founding moment is never stale.
  useEffect(() => {
    if (g.token) void g.refreshKnowledge().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.token, tab]);

  if (!g.token || !g.player) {
    return (
      <LoginView
        toasts={g.toasts}
        error={g.error}
        factionMeta={g.factionMeta}
        displayName={g.displayName}
        setDisplayName={g.setDisplayName}
        faction={g.faction}
        setFaction={g.setFaction}
        loginGuest={g.loginGuest}
      />
    );
  }

  const city = g.city;

  return (
    <Shell
      activeTab={tab}
      onTabChange={setTab}
      player={g.player}
      factionMeta={g.factionMeta}
      error={g.error}
      status={g.status}
      onDismissError={() => g.setError(null)}
      toasts={g.toasts}
      jobs={g.jobs}
      marches={g.marches}
      now={g.now}
      tutorial={g.tutorial}
      unreadReports={g.unreadReports}
      setUnreadReports={g.setUnreadReports}
      loadMap={g.loadMap}
      loadReports={g.loadReports}
      loadCodex={g.loadCodex}
      refreshKnowledge={g.refreshKnowledge}
      loadAlliances={g.loadAlliances}
      setError={g.setError}
    >
      {tab === "castle" && city && (
        <CastleView
          city={city}
          cities={g.cities}
          setCityId={g.setCityId}
          units={g.units}
          researchDefs={g.researchDefs}
          unlockDefs={g.unlockDefs}
          dailyQuests={g.dailyQuests}
          jobs={g.jobs}
          now={g.now}
          expeditionStatus={g.expeditionStatus}
          doBuild={g.doBuild}
          doResearch={g.doResearch}
          doTrain={g.doTrain}
          foundMarcherKeep={g.foundMarcherKeep}
          claimQuest={g.claimQuest}
        />
      )}

      {tab === "lands" && city && (
        <LandsView
          city={city}
          assignPlot={g.assignPlot}
          upgradePlot={g.upgradePlot}
        />
      )}

      {tab === "realm" && (
        <RealmView
          city={city}
          player={g.player}
          mapFocus={g.mapFocus}
          setMapFocus={g.setMapFocus}
          mapData={g.mapData}
          selectedTile={g.selectedTile}
          setSelectedTile={g.setSelectedTile}
          comp={g.comp}
          setComp={g.setComp}
          commandersReady={g.commandersReady}
          commanders={g.commanders}
          marches={g.marches}
          units={g.units}
          marchLeaderId={g.marchLeaderId}
          setMarchLeaderId={g.setMarchLeaderId}
          loadMap={g.loadMap}
          setError={g.setError}
          recruitCommander={g.recruitCommander}
          sendMarch={g.sendMarch}
        />
      )}

      {tab === "war" && (
        <WarView
          player={g.player}
          reports={g.reports}
          setUnreadReports={g.setUnreadReports}
          loadReports={g.loadReports}
          setError={g.setError}
          onLocateReport={(x, y) => {
            const cols = g.mapFocus.x1 - g.mapFocus.x0 + 1;
            const rows = g.mapFocus.y1 - g.mapFocus.y0 + 1;
            const x0 = Math.max(0, Math.min(40 - cols, x - Math.floor(cols / 2)));
            const y0 = Math.max(0, Math.min(40 - rows, y - Math.floor(rows / 2)));
            const f = { x0, y0, x1: x0 + cols - 1, y1: y0 + rows - 1 };
            g.setMapFocus(f);
            void g
              .loadMap(f)
              .then(() => {
                g.setSelectedTile({ x, y });
                setTab("realm");
              })
              .catch((e) => g.setError(String(e.message ?? e)));
          }}
        />
      )}

      {tab === "alliance" && (
        <AllianceView
          alliance={g.alliance}
          chat={g.chat}
          chatBody={g.chatBody}
          setChatBody={g.setChatBody}
          sendChat={g.sendChat}
          allyName={g.allyName}
          setAllyName={g.setAllyName}
          allyTag={g.allyTag}
          setAllyTag={g.setAllyTag}
          createAlly={g.createAlly}
          joinTag={g.joinTag}
          setJoinTag={g.setJoinTag}
          joinAlly={g.joinAlly}
          loadAlliances={g.loadAlliances}
          setError={g.setError}
          allianceList={g.allianceList}
        />
      )}

      {tab === "knowledge" && (
        <KnowledgeView
          readinessStatus={g.readinessStatus}
          bestiaryEntries={g.bestiaryEntries}
          bestiaryDefs={g.bestiaryDefs}
          expeditionStatus={g.expeditionStatus}
          clueData={g.clueData}
          formulas={g.formulas}
          startDragonExpedition={g.startDragonExpedition}
          completeDragonStage={g.completeDragonStage}
          loadCodex={g.loadCodex}
        />
      )}

      {tab === "settings" && city && (
        <SettingsView
          player={g.player}
          city={city}
          factionMeta={g.factionMeta}
          devMode={g.devMode}
          setPosture={g.setPosture}
          grantDev={g.grantDev}
          foundBrine={g.foundBrine}
          foundStone={g.foundStone}
          logout={g.logout}
        />
      )}
    </Shell>
  );
}
