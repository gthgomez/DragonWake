import { useState } from "react";

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
      advanceTutorial={g.advanceTutorial}
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
          sovereigns={g.sovereigns}
          dailyQuests={g.dailyQuests}
          doBuild={g.doBuild}
          doResearch={g.doResearch}
          doTrain={g.doTrain}
          foundMarcherKeep={g.foundMarcherKeep}
          foundBrine={g.foundBrine}
          foundStone={g.foundStone}
          claimQuest={g.claimQuest}
        />
      )}

      {tab === "lands" && city && (
        <LandsView
          city={city}
          plotPick={g.plotPick}
          setPlotPick={g.setPlotPick}
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
          pvpX={g.pvpX}
          setPvpX={g.setPvpX}
          pvpY={g.pvpY}
          setPvpY={g.setPvpY}
          pvpIntent={g.pvpIntent}
          setPvpIntent={g.setPvpIntent}
          commandersReady={g.commandersReady}
          commanders={g.commanders}
          marches={g.marches}
          loadMap={g.loadMap}
          setError={g.setError}
          recruitCommander={g.recruitCommander}
          attackSelectedCamp={g.attackSelectedCamp}
          occupySelectedWild={g.occupySelectedWild}
          attackPvp={g.attackPvp}
        />
      )}

      {tab === "war" && (
        <WarView
          player={g.player}
          reports={g.reports}
          commandersReady={g.commandersReady}
          commanders={g.commanders}
          marchLeaderId={g.marchLeaderId}
          setMarchLeaderId={g.setMarchLeaderId}
          setUnreadReports={g.setUnreadReports}
          loadReports={g.loadReports}
          setError={g.setError}
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
          expeditionStatus={g.expeditionStatus}
          clueData={g.clueData}
          formulas={g.formulas}
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
          logout={g.logout}
        />
      )}
    </Shell>
  );
}
