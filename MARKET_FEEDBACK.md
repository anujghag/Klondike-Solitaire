# Market Feedback Research — Solitaire & Card Games (App Store / Google Play)

_Research date: 2026-07-07. Sources: App Store & Google Play review aggregations for the
top solitaire apps (MobilityWare Solitaire, Solebon, Microsoft Solitaire Collection,
Klondike Solitaire – Patience), web solitaire platforms (Solitaire Bliss, Solitaired,
online-solitaire.com), and India's top-grossing card apps (Teen Patti Gold, Octro Teen
Patti / Indian Rummy, Card Game 29)._

## 1. What players complain about (top negative review themes)

| # | Complaint | Frequency | Our answer |
|---|-----------|-----------|------------|
| 1 | **Ads everywhere** — unskippable 15s ads after every deal, ads when pausing, "free" apps that nag for a subscription | Overwhelming #1 across every major app | **Zero ads, zero IAP, ever.** The single biggest differentiator we can ship. |
| 2 | **Deceptive monetization** — advertised ad-free, then paywalled | Very high | Fully offline, one purchase price, no server calls needed to play. |
| 3 | **Slow "new game"** — 15–20s of forced animation/delay before a new deal | High | Instant redeal; victory animation is skippable with one tap. |
| 4 | **Limited or paid undo** | High | Unlimited undo on Easy & Normal (Hard stays undo-free as the challenge mode). |
| 5 | **Losing progress** — app restart wipes the game in progress | High | Auto-save after every move; Resume button on the home screen. |
| 6 | **Unwinnable deals waste time** | Medium-high | Already solved: pre-verified winnable seed pools + live dead-end detection. |
| 7 | **Battery drain / heavy app size** | Medium | WebP assets (~400px), Tauri desktop ≈5 MB, procedural audio (no audio files). |

## 2. What players ask for (top requested features)

| # | Request | Status in this app |
|---|---------|--------------------|
| 1 | **More games in one app** — Spider and FreeCell are the two most-requested siblings of Klondike | ✅ Shipped: Spider (1/2/4-suit) + FreeCell in this release |
| 2 | **Daily challenges & streaks** | ✅ Already shipped (deterministic worldwide daily seed) |
| 3 | **Winnable-deal mode** | ✅ Already shipped (2,000 solver-verified seeds) |
| 4 | **Unlimited undo & hints** | ✅ This release: Normal mode undo cap removed; multi-step dependency hints already shipped |
| 5 | **A "show me how to win" solver** | ✅ Already shipped (Auto-Play deep solver + "Why did I lose?" analyzer) |
| 6 | **Themes / custom card faces & backs** | ✅ 4 fully-illustrated themes; theme engine now applies to every game |
| 7 | **Save/resume game in progress** | ✅ This release: auto-save + Resume |
| 8 | **Portrait & landscape, left-hand mode, big print** | ✅ Responsive grid, left-handed mirroring, large-print mode |
| 9 | **Statistics & win-rate tracking** | ✅ Per-difficulty stats; this release adds per-game stats for every new game |
| 10 | **Skippable win animation** | ✅ This release: tap to skip |

## 3. India market findings

Teen Patti and Rummy dominate India's card-game grossing charts (Teen Patti Gold: 6M+
MAU; Octro Indian Rummy: 10M+ downloads), but those are real-money-adjacent social
casino apps. The underserved niche is **family/household games played offline at
gatherings** — the games people play physically but can't find quality ad-free digital
versions of:

- **Bluff / Challenge (चैलेंज)** — India's version of Cheat/BS. Hugely popular with
  groups; almost no polished single-player-vs-AI version exists. ✅ Shipped this release.
- **Mendikot / Mendhi Coat (मेंढीकोट)** — Maharashtra/Gujarat 2v2 trick-taking game where
  teams capture tens. Pairs perfectly with our existing **Maratha Glory** theme.
  ✅ Shipped this release.
- **Satte pe Satta (सत्ते पे सत्ता)** — Indian Sevens/Badam Satti. Simple, nostalgic,
  ideal casual session length. ✅ Shipped this release.
- **29 / Court Piece (Hokm) / Teen Patti / Rummy** — strong candidates for the next
  release (Teen Patti & Rummy require chip economies; 29 and Court Piece fit the
  existing trick-taking engine built for Mendikot).

## 4. Wave 2 — expanding the roster (Indian + international demand)

Global signals: one in five mobile gamers plays a digital card game regularly; the card
game market is projected at ~$9.8B. Solitaire variants (TriPeaks, Pyramid, Spider,
FreeCell) dominate Western casual play — Microsoft Solitaire Collection made TriPeaks
and Pyramid household names. Hearts remains the most popular trick-taking game in the
English-speaking world (Windows bundling legacy). Rummy is the most popular casual
multiplayer card family worldwide — Indian online rummy platforms alone report 100M+
registered users.

Prioritized roster additions, chosen for demand × engine reuse:

| Priority | Game | Market | Why |
|----------|------|--------|-----|
| ✅ Shipped | **TriPeaks** | International | #2 mode in Microsoft Solitaire Collection; fast dopamine loops |
| ✅ Shipped | **Pyramid** | International | #3 mode in MSC; "pair to 13" is instantly learnable |
| ✅ Shipped | **Hearts** | International | Most-loved trick-taker; Windows nostalgia; reuses trick engine |
| ✅ Shipped | **Court Piece (Hokm/Coat Pees)** | India/Pakistan/Iran | Huge in North India; 2v2, first to 7 tricks; reuses Mendikot engine |
| ✅ Shipped | **Teen Patti** | India | India's #1 grossing card genre; play-chips only (no real money) |
| ✅ Shipped | **Indian Rummy (13-card)** | India | 100M+ player market; pure-sequence rules, wild jokers |
| Next | 29 (Twenty-Nine) | Bengal/Bangladesh | Bidding trick-taker; needs bidding UI |
| Next | Andar Bahar, Callbreak | India/Nepal | Callbreak is Nepal/India's top multiplayer |
| Next | Gin Rummy, Euchre, Spades | US | Natural follow-ons to the Rummy + trick engines |

## 5. Sources

- https://play.google.com/store/apps/details?id=at.ner.SolitaireKlondike
- https://apps.apple.com/us/app/solitaire/id359917414
- https://justuseapp.com/en/app/284791396/solitaire-by-mobilityware/reviews
- https://justuseapp.com/en/app/287197884/solitaire-by-solebon/reviews
- https://apps.microsoft.com/detail/9p62nrr9w999 (Microsoft Solitaire Collection)
- https://www.solitairebliss.com/ , https://online-solitaire.com/klondike-solitaire
- https://play.google.com/store/apps/details?id=com.teenpatti.hd.gold
- https://play.google.com/store/apps/details?id=com.octro.rummy
- https://app.appfigures.com/top-apps/google-play/india/games/card
- https://www.statista.com/topics/9940/card-game-and-puzzle-market-worldwide/
- https://solitairewave.com/articles/most-popular-card-games/
- https://www.similarweb.com/top-apps/google/games/cards/
- https://www.amraandelma.com/card-game-marketing-statistics/
