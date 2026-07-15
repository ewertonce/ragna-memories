# Changelog

All notable changes to Ragna-Memory are documented here.

## [1.5.0] - 2026-07-15
### Added
- Global leaderboard per rank, backed by Firebase, with a "View Leaderboard" modal showing the top 10 (issue #6)
- Cache-busting version query string on `game.js`, `firebase-config.js`, and `style.css`

### Fixed
- Game panel no longer touches the screen edges (padding now matches the page's own margin)
- "Adventurers Online" count no longer includes stale sessions from crashed/closed tabs (Firebase `onDisconnect` + age-filtered count)
- Leaderboard no longer silently skips a genuinely better score just because the playing device had unrelated local best-score history for that rank

## [1.4.0] - 2026-07-09
### Added
- 25 more monster cards (ambernite, andre, ant_egg, bigfoot, boa, chonchon, creamy, drops, fabre, honet, hydra, lunatic, mandragora, pecopeco_egg, poporing, poring, pupa, roda_frog, santa_poring, smokie, spore, steel_chonchon, thief_bug_egg, vadon, zombie), growing the pool from 19 to 44 monsters

## [1.3.0] - 2026-07-09
### Added
- 19th monster card (Argos), adding headroom above Lord Knight's 18-pair max
- Randomized monster subset per game for lower ranks, so Novice/Swordsman replays no longer show the same fixed cards every time
- Prontera map backdrop on the game board
- Adventurer nickname now persists across quest reloads

### Changed
- Renamed all card image files to their monster names (e.g. `toad.png`, `dracula.png`) instead of numbered filenames
- Retuned move allowances per rank and refunded moves on matches

### Fixed
- Full-screen panels no longer clip on Android (switched to `dvh` units)

## [1.2.1] - 2026-07-05
### Changed
- Downscaled the knight portrait to reduce runtime scaling blur
- Named the knight portrait "Darian"

## [1.2.0] - 2026-07-05
### Added
- Knight character portrait beside the welcome modal

### Fixed
- Blurry knight portrait on scaled displays

## [1.1.0] - 2026-07-05
### Added
- Full visual reskin to a Ragnarok Online aesthetic (parchment, carved wood, gold), split into separate HTML/CSS/JS files
- Combo/score system
- Themed result modal, replacing native `alert()` popups
- Synthesized sound effects with a mute toggle
- Persistent best score/time per rank (localStorage)

### Fixed
- Nickname input validation and low-contrast Tailwind bugs

## [1.0.0] - 2026-02-20
### Added
- Initial release: memory-matching game with 18 Ragnarok Online monster cards
- Mobile and iOS responsiveness, including Safari card-flip fixes
