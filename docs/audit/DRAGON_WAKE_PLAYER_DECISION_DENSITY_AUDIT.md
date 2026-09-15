# DRAGON WAKE — PLAYER DECISION DENSITY AUDIT

**Audit date:** 2026-09-04 · **HEAD:** `8aba7c0` · Method: code/content inspection + committed browser-journey screenshots. A *meaningful decision* requires a tradeoff with consequence, risk, or foregone alternative. Navigation, clicking, and queue-emptying do not count.

## Per-loop analysis

| Loop | Meaningful decisions available | Tradeoff quality | Consequences | Reversibility | Information quality | Long-term interaction | Verdict |
|---|---|---|---|---|---|---|---|
| **Building construction** | Build order among 10 buildable types; when to upgrade Keep vs buildings | LOW — most buildings are mandatory keys; cost is the only brake | Gates (unlocks) | Slow-reversible (demolition not present; but nothing is ever wrong to have) | Good (costs shown; Keep UX missing exact costs per critic P2) | Low — build list exhausts | **Linear checklist** once the 10 buildings are known |
| **Land plots (12)** | Which 4 resource types to bias; which 12 plots at L1-5 | MEDIUM — food vs build-materials vs ore matters early | Production rates | Reversible (upgrade path) | Good | Low — caps at 12×L5 | The best *economic* decision space in DW, still shallow |
| **Research** | Order of 18 techs; 1 queue slot | LOW-MEDIUM — order matters only via unlock needs; stats don't apply | Unlocks; charter gates | Irreversible per queue slot but order-free long-term | Poor — no signal that +8%/level techs do nothing | Low | **Checklist with a clock**; single queue = pure time tax |
| **Troop training** | Mix of 20 units vs manpower + queue slots | MEDIUM — RPS exists but nothing demands counters (static camp seeds, thin PvP) | Army power; manpower locked | Reversible via losses (harsh) | Poor — no enemy composition visibility pre-scout; scout gives bands only | Medium | Under-exploited: good system, no pressure to engage it |
| **Commanders** | Whom to recruit (interchangeable); slot assignment | LOW — 16 commanders with no mechanical differentiation | XP/stars | Low | Good (stats shown) | Low | **A budget, not a choice** |
| **March composition** | 20 units × capacity 500; commander choice | MEDIUM — same as training | Battle outcome | No (losses permanent) | Medium — banded scout intel creates fog-of-war judgment | Medium | Best combat decision; capped by small numbers |
| **Camp engagement** | Which camp level to hit; counter profile | MEDIUM — level risk/reward is real; bands recommend profiles | Loot, clues, casualties | Losses permanent | Good (band labels + scout bands) | Low — 10 camps then done | Real decision, **finite content kills it** |
| **Wilderness occupation** | Which 6 typed bonuses; capacity 2+Keep−1; abandon timing | **HIGH** — production vs speed (Crossroads) vs intel (Watch Hill) genuinely compete | Production/logistics/intel | Reversible (abandon) | Good | Medium — capacity grows with Keep | **DW's best loop**; lacks only external contest |
| **Expedition (1)** | When to attempt; stage order | LOW — single linear chain, gated on counters | Charter + bond | No | Good | One-shot | A quest, not a system |
| **Dragon war plans** | Spend the single-use plan on which L8+ camp | LOW-MEDIUM — one-shot scarcity is real but binary | Trophy | No | Good | One-shot | Good *pattern*; needs repetition to become strategy |
| **PvP attack** | Target choice; posture exploitation; loot vs losses | MEDIUM — protection rules + plunder math make it risky | Loot; retribution risk | No | Good (scout + intel tiers) | Low — no rankings/territory | Under-developed; economically unfavorable by default |
| **Defense posture** | withdraw/garrison/full per city | MEDIUM-HIGH — genuine risk allocation | Army survival vs loot rate | 5-min cooldown | Good | Medium | Real decision, undermined by thin PvP |
| **Alliance actions** | Whom to reinforce; intel to share; ranks | LOW-MEDIUM | Stationed forces at risk | Recall | Good | Low — no collective stakes | Cooperation with **no payoff object** |
| **Shop/Chronite** | 4 convenience items | LOW | Time | n/a | Good | Low | Fine as-is |

## Where Dragon Wake is a linear checklist

1. **Research** — 18 keys in a queue; unwired stats remove even the "which bonus do I want" decision.
2. **Commanders** — no differentiation → no roster decisions.
3. **Building roster** — all 10 are mandatory; no mutually exclusive buildings, no specialization (e.g., DoA-lineage choice of economy vs military bias never arises because storage/upkeep don't force it).
4. **Tutorial ladder → post-tutorial vacuum** — the 10-objective ladder is excellent, but it ends around Marcher Keep; past it, no goal generator exists (no events, no endgame, no seasons).
5. **Expedition** — a single linear chain.

## Decision-density gaps vs Reign (evidence-based)

- Reign's tax/happiness system (Theater; quests reward adjusting tax rate; Gold as 5th resource) creates a continuous economic dial. DW has **zero continuous economic dials**. (wiki Buildings/Quests)
- Reign's upkeep (per-troop Food, Rationing) makes every army a standing cost → army size vs economy is a live tradeoff forever. DW armies cost nothing after training. (wiki Troops)
- Reign's storage pressure forces build-order choices (Vault vs growth). DW hoards freely. (wiki Buildings)
- Reign's positional combat + targeting priorities + dragon Battle Arts make composition *and* march order matter per battle. DW resolves by band efficiency — composition matters less than count. (wiki Combat)
- Reign's 100K-march scale turns every engagement into a multi-day commitment with real replacement economics. DW's 500-march scale makes losses trivial emotionally — nothing hurts enough to strategize about. (wiki Quests)

**Estimated decision density:** DW ≈ 3–5 meaningful decisions/hour in the first 2 hours, decaying toward ~1/hour by day 2 (INFERENCE from loop structure + pacing sim's own monotonic resource curves). The strategic ceiling is reached at wilderness occupation + defense posture — two systems — inside week 1.
