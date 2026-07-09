# Changelog

All notable changes to Ragna-Memory are documented here.

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
