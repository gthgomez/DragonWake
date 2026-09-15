# Source: Shop currency, notification UX, and first-dragon reveal (topic survey)

Status: **EVIDENCE COLLECTED — Gate 1 partial (three topics).** Companion to
[`dragons-of-atlantis.md`](dragons-of-atlantis.md),
[`reign-of-atlantis.md`](reign-of-atlantis.md), and the historical baseline
[`../../design/DOA_REFERENCE_MODEL.md`](../../design/DOA_REFERENCE_MODEL.md).
Feeds the shop/reward and notification workstreams
([`../../proposals/SHOP_REWARD_REMEDIATION.md`](../../proposals/SHOP_REWARD_REMEDIATION.md);
the notification workstream's plan file `docs/proposals/UX_REMEDIATION_PLAN.md`).

Scope: (A) how established persistent-strategy games present a premium/shop
currency and make the *earn path* legible to a new player, including where the
first meaningful purchase sits relative to day 1; (B) notification / toast /
banner UX patterns for surfacing many event messages without obscuring play;
(C) first-dragon acquisition/reveal moments and what makes them land as
spectacle rather than a ledger entry.

Everything collected 2026-09-14. **Nothing here is a DragonWake recommendation
or direction.** Dispositions belong to the synthesis/parity layers. DragonWake
canon (Dracoliths = premium *earned* currency, no IAP source, items convenience
only; no pay-to-skip) is fixed elsewhere in
[`../../CURRENT_STATE.md`](../../CURRENT_STATE.md) and is not modified here.

Method note (honesty about access): Fandom wiki pages return HTTP 403 to
automated fetch, so several DoA/Lords Mobile/Dragon City/War Dragons claims are
supported by **search-index excerpts** of the cited page rather than a full
extraction; those are capped at `PARTIAL_EVIDENCE`. Mobile-app UI was not
directly captured (no emulator session); therefore most *in-game placement*
claims are `PARTIAL_EVIDENCE` or general design guidance, not pixel-verified.
No copyrighted competitor art is committed — URLs and text claims only.

Confidence vocabulary: `VERIFIED` / `STRONG_EVIDENCE` / `PARTIAL_EVIDENCE` /
`ANECDOTAL` / `UNKNOWN` (corpus standard). Historical DoA claims additionally
carry the `DOA_REFERENCE_MODEL.md` labels (evidence type · era · confidence ·
contamination). Claims marked `HYPOTHESIS` are speculation and are labeled as
such.

---

## Topic A — Premium/shop currency presentation and the earn path

### A.0 Pattern taxonomy (what the genre actually does)

| Pattern | Description | Examples |
| --- | --- | --- |
| **Two-tier display** | A hard currency (purchased) and a soft/earned currency shown together, with the hard one scarce | DoA Rubies vs Gold; Lords Mobile Gems vs Gold; Evony Gems vs Gold |
| **Earn path as named game systems** | Earn sources are buildings, events, and modes (not shop copy): Treasure Trove, Colosseum, gem mines, Worthy events | Lords Mobile, Evony, Travian |
| **Earn path as a help-center article** | Official documentation enumerates "how to earn" separately from the shop UI | Travian "How to Earn Gold" |
| **Daily free faucet** | A small premium grant tied to login/spin/box | DoA Fortuna's Chance + Ruby Mine; Lords Mobile Mystery Box; Evony daily login/offerings |
| **Subscription / ruby-mine** | One purchase unlocks a daily grant + extra queues for 30 days | DoA: Heirs "Ruby Mine" |
| **Price anchoring + starter pack** | Regular prices shown first, then a discounted one-time bundle | Contest of Champions example; Lords Mobile "Winning Start" |
| **Hard gate with visible cost** | A major unlock (dragon) priced in premium currency | Evony Pasture dragon (300,000 gems) |

### A.1 Dragons of Atlantis (browser era)

**Claim SHOP-DOA-001**
- Evidence class: PARTIAL_EVIDENCE
- Source: *Dragons Of Atlantis Wiki* (Fandom), "Resources" ("Rubies are the special in game currency… Rubies may be purchased or earned (rarely) by competing in contests hosted by Kabam") — https://dragonsofatlantis.fandom.com/wiki/Resources ; *Dragons Of Atlantis Wiki*, "Fortuna" ("There are 4 ways to get a Fortuna Ticket: Buy it from the Ruby Shop / Raid Level 11 Anthropus Camps / Complete specific Quests") — https://dragonsofatlantis.fandom.com/wiki/Fortuna ; both accessed 2026-09-14 (Fandom 403; search-index excerpts)
- Evidence type (DoA model): COMMUNITY-DOCUMENTED · era EARLY_BROWSER / MIXED_UNKNOWN · confidence MEDIUM · contamination MEDIUM
- Claim: DoA's premium currency was **Rubies**, framed as "purchased or earned (rarely)." The earn path was implemented as **named game systems** — the Fortuna daily ticket lottery, L11 Anthropus camp raids, and specific quests — plus the Ruby Shop itself.
- Player value / failure mode: the earn path exists and is plural, but is scattered across systems and a daily lottery; a new player learns it from quests/wiki, not from the shop row. Failure mode: the primary documented framing of Rubies ("may be purchased") reads as buy-first.
- Screenshots: none (text-only claim).

**Claim SHOP-DOA-002**
- Evidence class: PARTIAL_EVIDENCE
- Source: HTFBW, "How to Get Free Items on Dragons of Atlantis" ("Open a new 'Dragons of Atlantis' account on Facebook, and you will automatically be given **20 rubies**… Play 'Fortuna's Chance' once a day… Click on the free spin") — https://www.htfbw.com/Internet-Games/Online-Games/3115.shtml , accessed 2026-09-14 ; corroborating: *DoA Wiki*, "Guide:Beginner's Guide" (one Fortuna's Ticket per daily login) — https://dragonsofatlantis.fandom.com/wiki/Guide:Beginner%27s_Guide
- Evidence type (DoA model): COMMUNITY-DOCUMENTED · era EARLY_BROWSER · confidence MEDIUM · contamination MEDIUM
- Claim: Browser DoA granted a **one-time premium grant at account creation (20 rubies)** and a **daily free Fortuna's Chance spin** as the recurring premium faucet.
- Player value / failure mode: gives a new player a first taste of premium currency plus a returning daily hook; the daily-spin refresh exploit (close/reopen to reroll prizes) is documented in the same wiki, showing how a generous faucet can be gamed.
- Screenshots: none.

### A.2 Dragons of Atlantis: Heirs of the Dragon (mobile; DECA era)

**Claim SHOP-DOA-003**
- Evidence class: VERIFIED
- Source: *DECA Support*, "Ruby Mine", *Dragons of Atlantis: Heirs of the Dragon* — https://support.decagames.com/hc/en-us/articles/4422300910221-Ruby-Mine , accessed 2026-09-14 (official publisher help center; full page retrieved)
- Evidence type (DoA model): DEVELOPER · era MOBILE · confidence HIGH · contamination LOW
- Claim: In DoA: Heirs the premium **Ruby Mine** works as follows: (1) every account gets **1 free Ruby/day for the first 30 days**; (2) bonus Rubies must be **claimed manually by tapping the Ruby symbol in the city view next to the Fortress**; (3) **after any Ruby purchase** the player becomes eligible for 1 free Ruby/day and extra Build/Training queues; (4) purchasing the **240 or 1600 Ruby package** grants more free Rubies daily for 30 days **plus one extra Construction & Training queue for 30 days**; (5) renewing early yields **2% extra Rubies per day** earlier.
- Player value / failure mode: converts a one-time premium purchase into a 30-day returning habit, and makes the earn path a **visible city-view tap target** rather than a shop paragraph. Failure modes documented by the same article: direct purchases are excluded, and buying exactly 6 days before expiry disqualifies the renewal.
- Screenshots: none.

**Claim SHOP-DOA-004**
- Evidence class: PARTIAL_EVIDENCE
- Source: WriterParty, "Dragons of Atlantis – Heirs of the Dragon: Get more Gold and Rubies", 2013-08-09 ("For Rubies, unfortunately, the only way to earn them is by buying them. However, if you register a Kabam account you will earn 25 free rubies…") — https://writerparty.com/party/dragons-of-atlantis-heirs-of-the-dragon-get-more-gold-and-rubies/ , accessed 2026-09-14
- Evidence type (DoA model): CURRENT-MOBILE (press/guide) · era MOBILE · confidence LOW–MEDIUM · contamination MEDIUM
- Claim: A launch-era mobile guide states Rubies were **primarily purchase-only**, with a one-time free grant for account registration. This conflicts with the browser-era free-faucet claims and is **era-dependent**; do not generalize across versions.
- Player value / failure mode: illustrates the genre drift from "earnable premium" to "buy to progress" in the same franchise.
- Screenshots: none. *Would verify:* a launch-era Heirs store screenshot / patch notes.

### A.3 Lords Mobile (IGG)

**Claim SHOP-LM-001**
- Evidence class: PARTIAL_EVIDENCE
- Source: *Lords Mobile Wiki* (Fandom), "Gem" ("Gems are one of the currencies players can use to purchase various items… Linked Gems can be used for all purposes normally… Giftable Gems can be acquired by… Purchasing Special Bundles with Diamonds or real money") — https://lordsmobile.fandom.com/wiki/Gem , accessed 2026-09-14 (Fandom 403; search-index excerpt)
- Claim: Lords Mobile splits premium currency into **Linked Gems** (earned; spent normally; used first) and **Giftable Gems** (bought; used only for guild gifts). Displaying earning versus buying as separate *types* is a presentation choice that keeps the earn path first-class.
- Player value / failure mode: reduces "pay-to-win" perception of the earned currency; adds terminology a new player must learn.
- Screenshots: none.

**Claim SHOP-LM-002**
- Evidence class: STRONG_EVIDENCE
- Source: BlueStacks Blog, "Lords Mobile: How to Get Free Gems?", 2024-01-16 — https://www.bluestacks.com/blog/game-guides/lords-mobile/lm-currency-guide-en.html (full page retrieved); corroborating: Gameplay Tips, "Lords Mobile – Beginner's Guide (Tips and Tricks) and F.A.Q.", 2019-06-01 — https://gameplay.tips/guides/4279-lords-mobile.html
- Claim: The documented free-Gem path is a **long list of named in-game systems**, not shop copy: **Mystery Box** on the player's turf with a 1–60-minute countdown (occasionally 50–100 Gems; after 20 boxes/day, 5× rewards), **VIP Quests/chests**, joining/creating a guild (**400 Gems**), social follows (200 each), **Monster Hunting** per-hit caps (200–1000 by monster level), **Colosseum** ranking rewards every 3 hours (10–500 Gems), in-game events (Solo ~100; Hell ~2100), and a **400-Gem feedback click**. Beginner material also names the **"Winning Start"** starter pack in the Mall as "extremely useful to new players."
- Player value / failure mode: a large surface area of earn sources makes the currency feel attainable and drives breadth of gameplay; failure mode is that a newcomer cannot easily rank or discover the sources without a third-party guide.
- Screenshots: none.

### A.4 Evony: The King's Return

**Claim SHOP-EVO-001**
- Evidence class: STRONG_EVIDENCE
- Source: *Evony: The King's Return Guide Wiki*, "How to get Gems", updated 2026-01-12 — https://evonyguidewiki.com/en/how-to-get-gem-en/ , accessed 2026-09-14 (full page retrieved; community guide)
- Claim: Evony frames free Gems as **event systems with per-event caps**: World Boss (up to 300k/week), Treasure Hunt, Northern Invaders, Crazy Eggs, Daily Logins/Offerings (~2,500 Gems/week), Monarch Competition (~3,500/week), battlefield events, Server Gifts on the Wall, and a Battlefield Shop exchange (Badges/Dragon Coins → Gems). Gem *mines* are the literal-but-inefficient baseline.
- Player value / failure mode: the earn path is legible as a **calendar of recurring events** with stated yields; failure mode is a dense list of events where the new-player subset is unclear (the article itself warns the efficient route is not the obvious mine).
- Screenshots: none.

**Claim SHOP-EVO-002**
- Evidence class: STRONG_EVIDENCE
- Source: *Evony: The King's Return Guide Wiki*, "Dragon Complete Guide", updated 2025-12-08 — https://evonyguidewiki.com/en/dragon-guide-en/ , accessed 2026-09-14 (full page retrieved)
- Claim: A major unlock (dragon) is gated behind premium cost / high requirements: **Pasture dragon = Pasture Lv26 + 300,000 Gems**; other dragons cost **1,400 Dragon Crystals** or a **Dragon Pattern** (0.16% pre-pity drop, guaranteed after 300 spins; community estimate **~$340 per dragon**). Immediately after unlock the dragon is weak and must be fed/refined.
- Player value / failure mode: a clear, honest price wall around the game's fantasy figure; failure mode is a long pay/grind gate between wanting a dragon and using one.
- Screenshots: none.

### A.5 Travian: Legends (official earn-path documentation)

**Claim SHOP-TRAV-001**
- Evidence class: VERIFIED
- Source: *Travian: Legends Help Center*, "How to Earn Gold" — https://support.travian.com/en/articles/161-how-to-earn-gold , accessed 2026-09-14 (official; full page retrieved)
- Claim: Travian documents the premium (**Gold**) earn path separately from the shop: (1) **Refer a Friend** — 20 Gold per invitee villages 2–9, 40 for village 10, total **2,000 Gold**; (2) **Auction** — exchange rate **200 Silver = 1 Gold**, sell early consumables (cages/ointments) for starter Silver; (3) **One-Time Offer (low-cost Starter Pack)** — "Appears after a few hours up to a day of active play (depends on server speed)," great early value, **availability window 24 hours**, non-transferable to other gameworlds.
- Player value / failure mode: the earn path is discoverable via a dedicated "How to Earn Gold" article and an in-game "Earn Gold" option, and the **first paid offer is explicitly timed to day 1** (a few hours to ~1 day in). Failure mode: the offer is non-transferable, so buying on the wrong world wastes it.
- Screenshots: none.

### A.6 Game of War: Fire Age

**Claim SHOP-GOW-001**
- Evidence class: STRONG_EVIDENCE
- Source: TouchArcade, "'Game of War: Fire Age' Guide – How to Win Without Spending Real Money", 2013-11-13 — https://toucharcade.com/2013/11/13/game-of-war-fire-age-guide-how-to-win-without-spending-real-money/ , accessed 2026-09-14
- Claim: The free-play path rewards regular **quest-tab claims** ("take on an alliance quest and a daily quest… they'll provide free rewards. Don't forget to claim your rewards from the quest tab of the menu, either, because they expire after a day") and notes troops **do not starve** if food runs out (a no-attrition upkeep stance, consistent with the genre survey). The guide does **not** document a premium-currency ("Gold") earn path in enough detail to claim one.
- Player value / failure mode: establishes that even a hard-monetized title surfaces recurring claimable rewards in a dedicated tab; failure mode is **expiry after one day**, which punishes infrequent logins.
- Screenshots: none. *Would verify:* an official GoW Gold earn-path article / in-game store capture.

### A.7 Reign of Atlantis

**Claim SHOP-ROA-001**
- Evidence class: UNKNOWN
- Source: web searches 2026-09-14 returned no verifiable results for "Reign of Atlantis" as a strategy game with a premium/shop currency (searches matched *Reign of Fire*, *Crystal of Atlan*, *Reign Piece*, etc.). Repo stub [`reign-of-atlantis.md`](reign-of-atlantis.md) remains **EMPTY STUB — no verified findings yet.**
- Claim: **No evidence collected.** Do not fill this from memory or assumption.
- Player value / failure mode: n/a.
- Screenshots: none. *Would verify:* identify the actual product (remaster, sequel, clone, or unrelated) and its app-store listing before any claim.

### A.8 First meaningful purchase relative to day 1 (cross-game)

| Game | First meaningful paid/premium purchase | Timing evidence | Confidence |
| --- | --- | --- | --- |
| Travian: Legends | Low-cost one-time Starter Pack (Gold) | "after a few hours up to a day of active play"; **24h window** | `VERIFIED` (official) |
| DoA: Heirs (mobile) | 240/1600-Ruby package → Ruby Mine + extra queues 30 days | Terms verified; **timing not stated** (purchase-gated, not day-gated) | `VERIFIED` for terms · `UNKNOWN` for timing |
| DoA (browser) | 20 free Rubies at account creation; then buy/contests | Free at account creation | `PARTIAL_EVIDENCE` |
| Lords Mobile | "Winning Start" beginner pack in the Mall | Described as useful to new players; **no day given** | `PARTIAL_EVIDENCE` |
| Evony | Dragon / packages | Dragon gated at Pasture Lv26 (~300k gems) | `STRONG_EVIDENCE` for cost |
| Game of War | Starter purchases not documented in source | — | `UNKNOWN` |

**Claim SHOP-GEN-001**
- Evidence class: STRONG_EVIDENCE
- Source: GameAnalytics, "10 Tips For A Great First Time User Experience (FTUE) In F2P Games", last updated 2025-02-26 — https://www.gameanalytics.com/blog/tips-for-a-great-first-time-user-experience-ftue-in-f2p-games , accessed 2026-09-14
- Claim: FTUE guidance: (1) "make getting started easy" — do **not** hit the user with a paywall/ad immediately; (2) reduce the number of purchase options to avoid choice overload; (3) "make a user feel successful" by **granting premium currency that lets them buy a significant upgrade**, which both rewards them and "teach[es] them how to make another purchase later."
- Player value / failure mode: a small premium grant early *teaches the currency's value* before asking for money; failure mode is a first-session paywall or an overwhelming store.
- Screenshots: none.

**Claim SHOP-GEN-002**
- Evidence class: STRONG_EVIDENCE
- Source: Mobile Free To Play, "Free to Play Monetization: Making The First Purchase", 2015-11-07 — https://mobilefreetoplay.com/free-to-play-monetization-making-the-first-purchase/ , accessed 2026-09-14
- Claim: The "high conversion item" for a first purchase is: **high value**, **pays off over time** (e.g., monthly card that must be claimed daily), and is **limited by time and use**. Price anchoring is done by showing regular prices first, then a clearly lower one-time offer (worked example: Kabam's *Contest of Champions* — player is repeatedly shown regular crystal prices in session 1, then offered a starter pack).
- Player value / failure mode: makes the first purchase a retention mechanic, not just a sale; failure mode is front-loading a huge currency grant that lets the player "feel like they have beaten the game" and leave.
- Screenshots: none.

**Claim SHOP-GEN-003**
- Evidence class: PARTIAL_EVIDENCE
- Source: SolarEngine Blog, "First Purchase Conversion Optimization: The Ultimate Guide for Mobile Game Monetization", last modified 2026-03-05 — https://blog.solar-engine.com/en-blog/docs/From-Player-to-Payer-The-Guide-to-Cracking-FirstPurchase-Conversion-in-Mobile-Games , accessed 2026-09-14 (vendor content-marketing case study)
- Claim: A reported card-game case: a first-purchase prompt **immediately after the tutorial** reached only ~40–45% of users (≈30% skipped the tutorial; ≈25% quit before the prompt due to 3s+ loads). Moving the prompt to **difficulty walls / resource depletion / milestones** raised exposure to 80% and first-purchase conversion from **3.2% → 5.8%**; simplifying checkout and lowering entry price added ~5%. The article states a typical first-purchase conversion range of **2–5%** (top titles 5–8%).
- Player value / failure mode: the *moment of need* is a stronger conversion trigger than "immediately after tutorial"; failure mode is delaying the offer so far that need is never met.
- Screenshots: none. *Access/quality caveat:* vendor-authored, no methodology published; treat percentages as directional.

---

## Topic B — Notification / toast / banner UX patterns

### B.0 Pattern taxonomy (component → job)

| Component | Persistence | Position (common) | Duration | Interrupts play? | Click-through |
| --- | --- | --- | --- | --- | --- |
| **Toast** | Transient, auto-dismiss | Corner (bottom-right default; top-right acceptable) | ~3–8s (HPE uses 8s) | No | Optional, non-critical action only |
| **Banner** | Persistent until dismissed | Screen edge (top/bottom), part of document | Until resolved | Low | Clear CTA + dismiss |
| **Badge** | Persistent | Overlaid on parent (top-right convention) | Until read | No | Parent is the target, badge itself not clickable |
| **Modal / dialog** | Persistent until resolved | Center | Until resolved | High (blocks) | Primary action |
| **Inbox / notification history** | Persistent | Own surface/menu | Until cleared | No | Deep-links to the event |
| **Snackbar** | Transient/interactive (Material) | Bottom | Auto (Material) | No | Actionable |

### B.1 Platform/original guidance

**Claim NOTIF-AND-001**
- Evidence class: VERIFIED
- Source: Android Developers, "Toasts overview", last updated 2026-02-26 — https://developer.android.com/guide/topics/ui/notifiers/toasts , accessed 2026-09-14 (official platform docs)
- Claim: A toast "provides simple feedback… only fills the amount of space required… the current activity remains visible and interactive. Toasts automatically disappear after a timeout." On Android 12+ (API 31+) a toast is **limited to two lines** of text plus the app icon. Official alternatives: use a **snackbar** in the foreground, or a **notification** in the background if action is required.
- Player value / failure mode: canonical low-stakes, non-blocking feedback with an explicit line cap; failure mode is using a toast for high-priority or long content (docs redirect those to other components).
- Screenshots: none. (The docs expose `LENGTH_SHORT` / `LENGTH_LONG` constants but do not print millisecond values; this file does not invent them.)

**Claim NOTIF-UX-001**
- Evidence class: STRONG_EVIDENCE
- Source: LogRocket Blog, "What is a toast notification? Best practices for UX", rewritten 2025-06-09 — https://blog.logrocket.com/ux-design/toast-notifications/ , accessed 2026-09-14
- Claim: (1) Toasts auto-dismiss "within seconds"; user attention span for such alerts is **3–8 seconds**. (2) Place toasts **out of the way** — "users somewhat expect them in the bottom-right corner; if that obstructs something important, the top-right corner is okay too." (3) Keep toasts **neutral-looking**; they are not critical. (4) Do **not** use toasts for high-priority status or long content; put high-priority messages in context, or use a banner. (5) Accessibility: WCAG time-limit adjustability, honor `prefers-reduced-motion`, and prefer semantic HTML/popover for focus/ARIA handling.
- Player value / failure mode: keeps transient feedback non-blocking and readable; failure mode is missing an important message because it self-dismissed (the article's bank-login example).
- Screenshots: none.

**Claim NOTIF-HPE-001**
- Evidence class: STRONG_EVIDENCE
- Source: HPE Design System, "Toast notifications" — https://design-system.hpe.design/templates/toast-notifications , accessed 2026-09-14
- Claim: A concrete design-system spec: toasts are **automatically dismissed after 8 seconds**; keep content **three lines or fewer**; never truncate text within a toast.
- Player value / failure mode: gives a defensible upper bound on toast TTL and length; failure mode is silently truncating a message, which loses meaning.
- Screenshots: none.

**Claim NOTIF-RT-001**
- Evidence class: VERIFIED
- Source: React-Toastify documentation, "Introduction" (default `ToastContainer` props: `position="top-right"`, `autoClose={5000}`, `closeOnClick={false}`, `pauseOnHover`, `draggable`; feature list: "You can limit the number of toast displayed at the same time") — https://fkhadra.github.io/react-toastify/introduction , accessed 2026-09-14 (open-source library docs)
- Claim: A widely used implementation pattern defaults to **top-right, 5000 ms auto-close, `closeOnClick:false`, pause-on-hover, draggable-to-dismiss**, and provides a **`limit`** option capping how many toasts stack at once, plus `newestOnTop`.
- Player value / failure mode: shows the four levers a toast stack needs — position, TTL, cap, dismissal — and a safe default set. Failure mode (relevant to DragonWake F3): an unbounded stack with no cap/TTL grows until it covers content.
- Screenshots: none. *Caveat:* a web library, cited as an implementation-pattern reference, not a game.

**Claim NOTIF-SP-001**
- Evidence class: STRONG_EVIDENCE
- Source: Setproduct, "Notifications UI design: Why most apps annoy users instead", published 2023-09-29 — https://www.setproduct.com/blog/notifications-ui-design , accessed 2026-09-14
- Claim: Component-by-job guidance: **toast/snackbar** = brief, transient, non-critical, auto-dismiss; **banner** = "wide, persistent strip pinned to the top or bottom… for announcements and system-wide alerts that shouldn't vanish on a timer"; **badge** = "the quietest notification you can ship: it pulls attention without blocking anything"; **dialog/modal** = loudest, blocks, only for decisions that must happen now. On motion: "use motion with intent" — Slack "slides new messages in just enough to catch attention without yanking focus." It also summarizes Material's convention (snackbars brief/bottom, banners persistent, dialogs modal).
- Player value / failure mode: a matching rule between stakes and component prevents both obscuring play and missing messages; failure mode is using the loudest component routinely (dialog fatigue) or the quietest for blocking decisions.
- Screenshots: none.

**Claim NOTIF-GD-001**
- Evidence class: STRONG_EVIDENCE
- Source: Game Developer (Gamasutra), Josh Bycer, "UI Strategy Game Design Dos and Don'ts", 2015-03-24 — https://www.gamedeveloper.com/design/ui-strategy-game-design-dos-and-don-ts , accessed 2026-09-14
- Claim: Strategy-game UI should **centralize contextual information** (a status bar / information pane) rather than splitting it across corners; "important events should never just happen off screen without the player realizing it, there has to be some notification" — idle workers, unit attacks, and **building completion** should have a visual mention. Too much scattered information forces the player to split attention.
- Player value / failure mode: directly relevant to a persistent-world game where marches/builds complete asynchronously; failure mode is silent asynchronous events (a player never learns their march finished).
- Screenshots: none.

**Claim NOTIF-INBOX-001**
- Evidence class: PARTIAL_EVIDENCE
- Source: Courier, "Organizing In-app Communication With Inbox Feed" ("Inbox Feed is an in-app repository of the notification history so that users don't miss out on any important information") — https://www.courier.com/blog/communication-inbox-feed , accessed 2026-09-14 (vendor design blog)
- Claim: The complementary pattern to transient toasts is a persistent **inbox feed**: a history surface so that anything a transient message missed is still recoverable.
- Player value / failure mode: separates *interruption* (toast) from *record* (feed/inbox); failure mode is history-less notifications that vanish with no way to catch up.
- Screenshots: none.

**Claim NOTIF-BADGE-001**
- Evidence class: STRONG_EVIDENCE
- Source: Setproduct, "Badge UI design: Notification, count, and status patterns", published 2022-01-10, updated 2026-06-08 — https://www.setproduct.com/blog/badge-ui-design , accessed 2026-09-14
- Claim: Badge conventions: pick **one content type** (number/short text/icon/dot); use a **dot** when "something changed matters more than the count"; **abbreviate counts ("9+", "99+", "1k")** and "never let a badge count climb past two digits"; position consistently (typically top-right of parent); never carry meaning by color alone (needs text/`aria-label`); a badge annotates a parent and is **not itself clickable**.
- Player value / failure mode: keeps an accumulation indicator legible and non-blocking; failure mode is an uncapped count that stretches layout, or a color-only signal that screen readers miss.
- Screenshots: none.

**Claim NOTIF-LM-001**
- Evidence class: PARTIAL_EVIDENCE
- Source: BlueStacks Blog, "Lords Mobile: How to Get Free Gems?", 2024-01-16 — https://www.bluestacks.com/blog/game-guides/lords-mobile/lm-currency-guide-en.html , accessed 2026-09-14
- Claim: A concrete in-game placement example: the **Mystery Box appears on the player's turf with a countdown directly below it** (1–60 minutes), and the **VIP chest** is opened from its own affordance; opening 20 Mystery Boxes in a day escalates to 5× rewards.
- Player value / failure mode: an object-anchored, on-map notification that points at the reward without covering the map; failure mode is a countdown players feel obliged to camp (a known retention-friction pattern).
- Screenshots: none.

---

## Topic C — First-dragon acquisition and reveal

**Reader caution:** the sources below are strong on *acquisition gates and delivery* and thin on frame-by-frame reveal craft. Claims about what makes a reveal "land" are marked `HYPOTHESIS` and are not evidence.

### C.1 Dragons of Atlantis (browser): acquisition as a building milestone

**Claim DRG-DOA-001**
- Evidence class: PARTIAL_EVIDENCE
- Source: "Star Point Mansion" (princesslilo) DoA newbie walkthrough, 2011-04-27, updated 2012-02-27 ("To get a great dragon egg, click the dragon's keep… Click upgrade. Your egg will appear after dragon keep has been upgraded.") — https://princesslilo.wordpress.com/2011/04/27/dragons-of-atlantis-newbie-walkthrough/ , accessed 2026-09-14 ; *DoA Wiki*, "Beginners: Getting Your Dragons" (S04 in the reference model) — https://dragonsofatlantis.fandom.com/wiki/Beginners:_Getting_Your_Dragons
- Evidence type (DoA model): COMMUNITY-DOCUMENTED · era EARLY_BROWSER–MATURE_BROWSER · confidence MEDIUM · contamination MEDIUM
- Claim: Browser DoA's first Great Dragon arrived as an **outcome of upgrading the Dragon Keep** — "your egg will appear after dragon keep has been upgraded" — and the Great Dragon then had to be included in marches, with armor from level-5+ camps. Community advice was to **delay** getting the egg until resource sites were upgraded.
- Player value / failure mode: the acquisition is tied to a visible, ownable building and has a clear prerequisite chain. Failure mode: it reads as a **production milestone / checklist**, with community guidance explicitly framing the dragon as something to *postpone*, not a moment to anticipate.
- Screenshots: none (text-only claim; no competitor art committed).

**Claim DRG-DOA-002**
- Evidence class: STRONG_EVIDENCE
- Source: Gamezebo, *Dragons of Atlantis Review*, 2010-10-13 — https://www.gamezebo.com/reviews/dragons-of-atlantis-review/ (cited as S01 in [`../../design/DOA_REFERENCE_MODEL.md`](../../design/DOA_REFERENCE_MODEL.md), which records "the dragon was visually compelling but too peripheral for too long"); corroborating community tone: princesslilo walkthrough, 2011-04-27 ("Kabam **probably** wants you to get frustrated, give in and use Rubies, but for what? A moving picture of a Dragon?") — https://princesslilo.wordpress.com/2011/04/27/dragons-of-atlantis-newbie-walkthrough/ , accessed 2026-09-14
- Evidence type (DoA model): CONTEMPORARY + COMMUNITY-DOCUMENTED · era EARLY_BROWSER–MATURE_BROWSER · confidence MEDIUM-HIGH · contamination LOW–MEDIUM
- Claim: The documented DoA failure mode is **dragon peripherality**: the dragon is visually compelling but the first 1–2 weeks are spent making it operational, not experiencing it; a community guide reduces the first elemental dragon to "a moving picture." This is a **fantasy-delivery** problem, not a mechanics problem.
- Player value / failure mode: warns that gating a spectacle behind a long checklist converts it into a ledger line. DragonWake's own reference model already lists this as failure mode #1 to avoid.
- Screenshots: none.

### C.2 Evony: dragon as expensive equipment

**Claim DRG-EVO-001**
- Evidence class: STRONG_EVIDENCE
- Source: *Evony: The King's Return Guide Wiki*, "Dragon Complete Guide", updated 2025-12-08 — https://evonyguidewiki.com/en/dragon-guide-en/ , accessed 2026-09-14 (full page retrieved)
- Claim: Evony defines a dragon as "a **support gear that can be assigned to a general**." Unlocking Celtic Demon requires **Pasture Lv26 + 300,000 Gems**; on unlock the dragon shows **no buffs and <+10 attribute boost** and must be fed/refined/talented to matter. Community guidance is to delay leveling until general equipment is complete.
- Player value / failure mode: the dragon is framed functionally (a stat slot), and its arrival is a **number change**, not a narrative event. Failure mode: high cost + immediate weakness = pay/grind then disappointment.
- Screenshots: none.

### C.3 War Dragons and Dragon City: hatching as the reveal surface

**Claim DRG-WD-001**
- Evidence class: PARTIAL_EVIDENCE
- Source: *War Dragons Archive Wiki* (Fandom), "Egg Incubator" ("Dragon eggs require intense heat in order to hatch and the incubator must be carefully levelled in order to trigger the rarest of dragons hatching") — https://war-dragons-archive.fandom.com/wiki/Egg_Incubator ; Pocket Gems Support, "Will my new, unhatched eggs be used if I start to research a new branch?" ("The very first egg that you complete on each dragon is first reserved for incubation. This dragon requires **1,100 egg fragments** to become 1 whole egg.") — https://pocketgems-support.helpshift.com/hc/en/3-war-dragons/faq/728-will-my-new-unhatched-eggs-be-used-if-i-start-to-research-a-new-branch/ ; both accessed 2026-09-14 (Fandom 403; search-index excerpt + official support)
- Claim: War Dragons routes acquisition through an **Incubator** with level gates and egg-fragment collection; the first egg on each dragon is reserved for incubation.
- Player value / failure mode: gives the hatch a dedicated **place and verb** (incubate) rather than an instant grant; failure mode is a long fragment grind before the reveal.
- Screenshots: none. *Would verify:* the hatch sequence itself (motion/sound) — not captured.

**Claim DRG-DC-001**
- Evidence class: PARTIAL_EVIDENCE
- Source: *Dragon City Wiki* (Fandom), "Eggs" ("you can move your egg to the Hatchery where you can hatch it to a little baby dragon") — https://dragoncity.fandom.com/wiki/Eggs ; Reddit r/DragonCity, "Hatch eggs animations" (player complaint that new hatch animations/pop-ups are "INCREDIBLY annoying" and "going to increase grind times") — https://www.reddit.com/r/DragonCity/comments/1jo296v/hatch_eggs_animations/ ; both accessed 2026-09-14 (Fandom 403; search-index excerpt)
- Claim: Dragon City gives hatching a dedicated **Hatchery** and an egg→baby-dragon animation. At least some players experience **unskippable/added hatch animations as friction** that lengthens grinding.
- Player value / failure mode: supports the value of a hatch reveal *and* its ceiling — a reveal that plays on every hatch, rather than on the first or a milestone, becomes an obstacle. Failure mode: motion with no "skip" for repeat events.
- Screenshots: none.

### C.4 Reveal craft (general design evidence)

**Claim DRG-FEEL-001**
- Evidence class: STRONG_EVIDENCE
- Source: Brad Woods, "Juice" (digital garden note, planted Mar 2023, tended Nov 2025) — https://garden.bradwoods.io/notes/design/juice , accessed 2026-09-14
- Claim: "Juice is the non-essential visual, audio and haptic effects that enhance the player's experience." Key applicable points: (1) juice uses **redundant techniques** — "to acknowledge one action… the developer could use multiple animations, sounds and vibrations"; (2) it should **prioritize mundane, recurring events** over one-time onboarding ("Completing onboarding is like completing the game. It happens once. Juicing it has little effect… Better to juice the moment to moment events."); (3) techniques include particles, screen shake, lush animation sequences, visual flourish, freeze frames, tweening (ease-in/out), and scripted sequences; (4) Half-Life's scripted sequences existed partly for **player acknowledgment** ("The game world must acknowledge the player every time they perform an action. If the world ignores the player, the player won't care about the world." — Ken Birdwell).
- Player value / failure mode: gives a concrete vocabulary for a reveal (redundant channels, motion, pause) and an explicit warning that juicing a **one-time** event has limited overall effect unless the moment is genuinely a payoff. Failure mode: juice on trivial actions that slows the loop.
- Screenshots: none.

**Claim DRG-FEEL-002**
- Evidence class: STRONG_EVIDENCE
- Source: "Juice it or lose it", Martin Jonasson & Petri Purho (talk), cited within DRG-FEEL-001 — https://www.youtube.com/watch?v=Fy0aCDmgnxg (referenced 2026-09-14)
- Claim: The canonical framing: juice is "about maximum output for minimum input"; it teaches, makes things feel alive, improves sense of impact/reward, and builds emotional connection.
- Player value / failure mode: establishes that a reveal is judged by *feel per interaction*, not by the amount of content; failure mode is equating spectacle with volume.
- Screenshots: none.

### C.5 Hypotheses (speculation — explicitly not evidence)

**HYP-DW-001**
- Label: **HYPOTHESIS** (DragonWake-facing inference; requires testing)
- Statement: A first-dragon reveal is more likely to read as a *moment* than a ledger entry if it uses **redundant feedback channels** (a deliberate pause, motion/animation, sound, and a named individual) and if the dragon is **acknowledged as the player's own** (naming/ownership) rather than surfaced as a row in a list. Basis: DRG-FEEL-001 (redundant techniques, player acknowledgment), DRG-DOA-002 (peripherality failure), DRG-EVO-001 (functional support-gear framing). Would test via blind playtest / human game-feel gate.

**HYP-DW-002**
- Label: **HYPOTHESIS**
- Statement: Because genre premium currencies are earned through **many named systems** (A.1–A.4), a shop row that names its own earn path (e.g., "from Daily Deeds") is likely to be more legible to a new player than a row that shows only a price. Basis: SHOP-DOA-001, SHOP-LM-002, SHOP-EVO-001, SHOP-TRAV-001. Would test with a first-session comprehension task.
- Note: This is *not* a proposal to add mechanics or change DragonWake's Dracolith faucet, which is fixed elsewhere. It concerns **presentation only**.

**HYP-DW-003**
- Label: **HYPOTHESIS**
- Statement: An event-notification system that pairs a **bounded transient rail** (positioned outside primary content, with a count cap and TTL) with a **persistent history/inbox surface** can surface many messages without obscuring play. Basis: NOTIF-RT-001 (cap/TTL/position), NOTIF-SP-001 (component-to-stakes matching), NOTIF-INBOX-001 (history), NOTIF-GD-001 (never let important events happen off-screen). Would test by rendering a bounded stack at 1440×900 and 390×844 and asserting non-overlap.

---

## Cross-topic synthesis (evidence framing, not a DragonWake verdict)

- **Earn paths are systems, not sentences.** Across DoA, Lords Mobile, Evony, and Travian the premium-currency earn path is implemented as buildings, events, modes, a refer-a-friend program, or an exchange — and is usually documented in a help center and/or surfaced as a city-view tap target (DoA's Ruby Mine). A shop that shows a price but no earn path is unusual in the set.
- **The genre's first purchase is usually soft, early, and value-anchored** (Travian's day-1 starter offer; the "high conversion item" pattern; price anchoring). DoA: Heirs instead makes the first purchase a **30-day daily habit** (Ruby Mine). Both approaches leave the free player a visible free faucet.
- **Notification craft converges on: non-blocking, edge-anchored, short, neutral, capped, dismissible, and paired with a persistent record.** The failure mode the design literature repeatedly names is using a transient component for a high-priority/blocking message.
- **First-dragon evidence shows a tension:** a dedicated place/verb (Incubator, Hatchery, Dragon Keep) is common, but the fantasy can be reduced to a production milestone (DoA), expensive equipment (Evony), or an unskippable repeated animation (Dragon City). The craft evidence (DRG-FEEL-001) says redundant feedback and player acknowledgment are what make an action *feel*; it also warns that juicing a one-time event has limited overall effect.
- **Reign of Atlantis is still unevidenced.** No premium-currency, notification, or dragon claims were supportable; the repo stub remains empty.

---

## Implications for DragonWake UX (non-authoritative)

> **Evidence only. This section is not a recommendation and does not propose direction. The audit findings F1/F3/F7/F8 are owned by PLAN-SHOP / PLAN-UX / the authority stack; this file only records what competitors do.**

- **F1 (shop dead on arrival):** In the surveyed set, premium currencies are earned through *named systems* and the earn path is surfaced either as a help article (Travian), a city-view tap target (DoA Ruby Mine), or a widely documented list of modes (Lords Mobile, Evony). DragonWake's Dracoliths are also earned through a named system (Daily Deeds), so the evidence-relevant question is **presentation**: whether the shop row names its earn path. Whether to change copy is PLAN-SHOP's call.
- **F3 (toast stack obscures content):** Evidence supports a bounded rail (cap + TTL + non-blocking + neutral, per NOTIF-RT-001 / NOTIF-HPE-001 / NOTIF-UX-001) plus a history surface (NOTIF-INBOX-001) so nothing important is lost when the stack is capped. This is process/UX evidence; it does not change mechanics.
- **F7 (currency/naming confusion):** Genre precedent for disambiguating currencies is to **type** them by earn method (Lords Mobile's Linked vs Giftable Gems) and to keep the premium one scarce (DoA "rarely earned"). Relevant as evidence that the distinction is a known genre problem.
- **F8 (dragon is a card, not a moment):** The genre evidence is mostly about the **acquisition gate** (Dragon Keep upgrade, Incubator, Pasture cost), not a canonical reveal. The reveal-craft claims are `HYPOTHESIS`. Any spectacle work is a design decision for PLAN-UX / the authority stack, not established here.
- **First-purchase cadence:** DragonWake current state already fixes "no IAP source" for Dracoliths and "items are convenience only," so the commercial first-purchase patterns in Topic A are **context, not applicable direction**. They are retained only to explain where the genre places its first ask.

---

## Verification gaps / what would raise confidence

- Full page extraction of the Fandom pages blocked at HTTP 403 (DoA Resources/Fortuna/Beginner's Guide; Lords Mobile Gem; Dragon City Eggs; War Dragons Egg Incubator) — capture manually and store provenance per [`../evidence/README.md`](../evidence/README.md).
- Direct rendered capture of an actual competitor shop / toast / hatch screen (mobile emulator) — none captured here; would upgrade Topic A/B in-game placement and Topic C reveal claims above `PARTIAL_EVIDENCE`.
- Game of War premium-currency ("Gold") earn path — not supported by the single guide used; needs an official help article or in-game capture.
- Reign of Atlantis — identify the actual product and its store listing before any claim.
- War Dragons and Dragon City **hatch sequence** (motion/sound, skippable or not) — video evidence would let Topic C move from acquisition gates to reveal craft.
- Human playtest of any DragonWake hypothesis (HYP-DW-001..003) — synthetic reasoning cannot close a fun/feel claim (see Product Lab evidence rules).

---

## Source registry (accessed 2026-09-14 unless noted)

| ID | Class | Source | Notes |
| --- | --- | --- | --- |
| S01 | Official developer | DECA Support, "Ruby Mine" (DoA: Heirs) | full page; DoA mobile |
| S02 | Official developer | Travian: Legends Help Center, "How to Earn Gold" | full page; day-1 starter offer |
| S03 | Official platform doc | Android Developers, "Toasts overview", upd. 2026-02-26 | 2-line cap; auto-timeout |
| S04 | Design guidance | LogRocket, "What is a toast notification?…", 2025-06-09 | 3–8s; corner placement |
| S05 | Design system | HPE Design System, "Toast notifications" | 8s; ≤3 lines |
| S06 | Library docs | React-Toastify, "Introduction" | top-right; 5000ms; `limit` |
| S07 | Design guidance | Setproduct, "Notifications UI design", 2023-09-29 | taxonomy; motion intent |
| S08 | Design guidance | Setproduct, "Badge UI design", upd. 2026-06-08 | 99+ cap; dot vs number |
| S09 | Design commentary | Game Developer, Bycer, "UI Strategy Game Design Dos and Don'ts", 2015-03-24 | never-off-screen events |
| S10 | Vendor design blog | Courier, "Inbox Feed" | notification history |
| S11 | Guide/press | BlueStacks, "Lords Mobile: How to Get Free Gems?", 2024-01-16 | full page |
| S12 | Community guide wiki | Evony Guide Wiki, "How to get Gems", upd. 2026-01-12 | full page |
| S13 | Community guide wiki | Evony Guide Wiki, "Dragon Complete Guide", upd. 2025-12-08 | full page |
| S14 | Community guide wiki | Gameplay Tips, "Lords Mobile – Beginner's Guide", 2019-06-01 | Winning Start pack |
| S15 | Contemporary press | TouchArcade, GoW guide, 2013-11-13 | full page |
| S16 | Analytics blog | GameAnalytics, "10 Tips For A Great FTUE", upd. 2025-02-26 | full page |
| S17 | Monetization blog | Mobile Free To Play, "Making The First Purchase", 2015-11-07 | full page |
| S18 | Vendor analytics | SolarEngine, "First Purchase Conversion Optimization", mod. 2026-03-05 | vendor; directional |
| S19 | Community guide | princesslilo, DoA newbie walkthrough, 2011/2012 | full page |
| S20 | Guide/press | WriterParty, DoA: Heirs currencies, 2013-08-09 | mobile era |
| S21 | Community guide | HTFBW, "How to Get Free Items on DoA" | 20 rubies; Fortuna spin |
| S22 | Fandom (403 excerpt) | DoA Wiki "Resources", "Fortuna", "Beginner's Guide" | `PARTIAL_EVIDENCE` |
| S23 | Fandom (403 excerpt) | Lords Mobile Wiki "Gem" | `PARTIAL_EVIDENCE` |
| S24 | Fandom (403 excerpt) | Dragon City Wiki "Eggs" | `PARTIAL_EVIDENCE` |
| S25 | Fandom (403 excerpt) | War Dragons Archive Wiki "Egg Incubator" | `PARTIAL_EVIDENCE` |
| S26 | Official support | Pocket Gems Support, War Dragons egg FAQ | 1,100 fragments |
| S27 | Design reference | Brad Woods, "Juice", tended 2025-11 | redundant feedback; recurring events |
| S28 | Reference model | [`../../design/DOA_REFERENCE_MODEL.md`](../../design/DOA_REFERENCE_MODEL.md) | DoA peripherality (S01/S04) |

---

## Final summary — five strongest findings

1. **Earn paths are plural and named.** DoA (Fortuna tickets, L11 camps, quests, Ruby Shop), Lords Mobile (Mystery Box, VIP, Colosseum, monster hunt, guild join, events), Evony (event calendar, gem mines, Battlefield Shop), and Travian (refer-a-friend, silver→gold auction, starter offer) all make premium currency earnable through *named game systems*, and several surface a dedicated tap target (DoA Heirs Ruby Mine) or help article (Travian). `STRONG_EVIDENCE`–`VERIFIED` across SHOP-DOA-001/003, SHOP-LM-002, SHOP-EVO-001, SHOP-TRAV-001.

2. **First purchases are usually soft and early, not paywalled at launch.** Travian's one-time starter pack appears "after a few hours up to a day of active play" with a 24h window (official, `VERIFIED`); generic first-purchase guidance says trigger at difficulty walls rather than immediately post-tutorial and to anchor price before offering a deal (`STRONG_EVIDENCE`); DoA: Heirs instead converts a first purchase into a 30-day daily Ruby Mine (`VERIFIED`).

3. **Notification craft converges on a bounded, non-blocking, edge-anchored transient + a persistent record.** Toasts auto-dismiss in seconds (attention span 3–8s), sit in a corner, stay neutral, cap line count (2 lines on Android 12+; ≤3 lines per HPE), and should not carry high-priority or blocking content; a separate inbox/history surface catches what the transient missed, and badges cap counts at "99+" with a dot-vs-number choice. `VERIFIED`–`STRONG_EVIDENCE` across NOTIF-AND-001, NOTIF-UX-001, NOTIF-HPE-001, NOTIF-RT-001, NOTIF-INBOX-001, NOTIF-BADGE-001.

4. **First-dragon acquisition in the genre is a gated place/verb, and the documented failure is it reading as a checklist or a stat slot.** DoA's Great Dragon arrived from a Dragon Keep upgrade and was community-advised to *postpone*; a contemporary review and a community guide both record the dragon as "visually compelling but too peripheral" / "a moving picture." Evony defines a dragon as "support gear," gated at Pasture Lv26 + 300,000 Gems and weak on arrival. War Dragons/Dragon City at least give the hatch a dedicated Incubator/Hatchery. `STRONG_EVIDENCE`–`PARTIAL_EVIDENCE` across DRG-DOA-001/002, DRG-EVO-001, DRG-WD-001, DRG-DC-001.

5. **What makes a reveal "land" is craft evidence, not genre evidence — and it is labeled HYPOTHESIS.** Juice uses *redundant* channels (motion + sound + haptics), prioritizes recurring interactions over one-time onboarding, and exists partly for player acknowledgment; an unskippable repeated hatch animation is documented friction. Applying this to DragonWake's first dragon is speculation (HYP-DW-001) requiring a blind/human game-feel test. `STRONG_EVIDENCE` for DRG-FEEL-001/002; `HYPOTHESIS` for the DragonWake inference.
