# Past-Work Preservation Ledger

This ledger records recovered design intent and the current implementation
state. Stable internal ids are retained where changing persisted saves would
create needless migration risk.

| Decision/system | Intent and current state | Player-facing interpretation | Status | Next owner |
|---|---|---|---|---|
| DoA progression topology | City → economy → research → troops → camps → dragon evidence → wilds → expansion is implemented through the Alpha R2 ladder. | Every layer opens the next strategic question. | IMPLEMENTED | R3 systems |
| Differentiated settlements | Capital, Marcher Keep, Stonekeel/Mountain Hold, Cinderreach/Forest Citadel, and Galeari remain distinct content identities. | A new holding changes how the realm plays. | PARTIAL | R3 expansion |
| Cultures/factions | Medieval faction ids and translations replaced the old elemental presentation. | Regional architecture and traditions, not elemental skins. | IMPLEMENTED | Lore campaign |
| Defense postures | `withdraw`, `garrison`, and `full` are authoritative and persisted. | Choose how much of the garrison risks a fight. | IMPLEMENTED | Combat campaign |
| Population/manpower | Homes, population capacity, available manpower, and troop use are live. | Civilian growth competes with recruitment. | IMPLEMENTED | Economy campaign |
| Castle/Lands/Realm | Separate surfaces remain the administration, estate, and world-operation views. | Know where to build, produce, and act. | IMPLEMENTED | UX polish |
| Wilderness identity | Forest/Wood, fertile/Food, quarry/Stone, iron hills/Ore, Crossroads/logistics, Watch Hill/scouting are differentiated. | The map is strategic territory, not decoration. | IMPLEMENTED | R3 conflict |
| Deeper intelligence/walls | Watchtower and Watch Hill cover early intelligence; counterintelligence and richer wall play remain absent. | Better scouting reveals more of the threat. | PARTIAL | R3 intelligence |
| March/logistics | Crossroads and Muster Yard affect speed and operational capacity. | Routes and command capacity constrain reach. | PARTIAL | R3 logistics |
| Alliance/social warfare | Alliance and chat foundations exist; coordination and war depth are shallow. | Social warfare is a future layer. | DEFERRED | Alliance campaign |
| Later combat ideas | Formations, terrain resolution, siege depth, morale, dragon anatomy, anti-dragon weapons, and resolver redesign are preserved as later work. | Dragons do not erase conventional warfare. | DEFERRED | Combat campaign |
| Endgame/live game | Arena, bosses, events, market, deeper alliance war, hardcore realms, and broad endgame remain future scope. | Alpha R2 ends before live-game breadth. | DEFERRED | Endgame campaign |
| Shop/monetization naming | Chronite remains separate; generic legacy shop naming is not expanded here. | Crownmarks are normal currency, Chronite is convenience currency. | DEFERRED | Monetization freeze |
| Lore Bible | Lore Bible v1 remains incomplete; no irreversible canon was invented for closure. | The dragon mystery remains intentionally bounded. | PARTIAL | Lore campaign |
| Final resource domain | Aquatic → intermediate medieval → final Food/Wood/Stone/Ore/Crownmarks migration is implemented at shared, content, server, PG, cargo, and UI boundaries. | Players see Food, Wood, Stone, Ore, Crownmarks. | IMPLEMENTED | Migration maintenance |

## Untracked master recovery

The source was `DRAGON_WAKE_DOA_PARITY_IMPLEMENTATION_MASTER.md` in the repo
root. It remains intentionally untracked. Its progression topology,
settlement differentiation, population, defense, Castle/Lands/Realm split,
wilderness, intelligence, logistics, alliance, combat, endgame, shop, lore,
and final resource naming decisions are reconciled above. No known unique
decision remains only in that file.
