# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

Start the local HTTP server (required — the CSP blocks `file://` origins):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
```

Then open `http://localhost:3333` in Chrome/Edge. The server runs on port 3333.

To stop the server: `Ctrl+C` in the terminal running it.

There are no build steps, package managers, linters, or test runners — this is plain HTML/CSS/JS.

## Architecture

Game files live in `public/` (served as the web root). Four script files load in dependency order (`levels.js` → `boosters.js` → `game.js` → `ui.js`). Each exposes a single global on `window`.

### `public/js/levels.js` — `window.LEVELS`
Array of 30 level definition objects. Shape:
```js
{ id, moves, targetScore, star2Score, star3Score, gemTypes, obstacles: [{type, row, col, hp}], lockedGems }
```

### `public/js/boosters.js` — `window.Boosters`
Pure functions; no state. Three exports:
- `classifyRuns(matchRuns, swapOrigin)` — called *before* gem removal; converts matched runs into booster-creation instructions. L/T intersections are detected first (→ `arcane_bomb`), then 5-in-a-line (→ `void_orb`), then 4-in-a-line (→ `line_rune_row/col`).
- `activate(board, row, col, triggerColor, activatedIds)` — fires a single booster, chains recursively, deduplicates via `activatedIds` Set.
- `activateCombined(board, rA, cA, rB, cB, activatedIds)` — 8-entry combination matrix for booster+booster swaps.

### `public/js/game.js` — `window.Game`
Owns all game state and logic. No DOM access. Key internals:

**Gem object**: `{ id, type, booster, obstacleType, obstacleHp, visualState, animX, animY, targetX, targetY, alpha, targetAlpha, scale, targetScale }`  
**GameState**: `{ level, board[8][8], score, movesLeft, cascadeDepth, phase, selectedCell, starsEarned }`  
**`phase`** controls input gating: `'input' | 'animating' | 'cascading' | 'complete' | 'fail'`

**Async cascade pipeline** — game.js and ui.js communicate via an event bus (`Game.on` / emit):
1. `trySwap` → performs swap → emits `swap:start` → sets `phase = 'animating'`
2. ui.js animates swap → calls `Game.onSwapAnimDone()`
3. `runCascade` → `_doCascadeStep` → finds matches → emits `gems:matched`
4. ui.js animates removal → calls `Game.onMatchAnimDone()`
5. game.js applies gravity / spawns new gems → emits `gems:fell`
6. ui.js animates fall → calls `Game.onFallAnimDone()`
7. Back to `_doCascadeStep`; loop until no matches, then `phase = 'input'`

**Deadlock prevention**: after cascade settles, `hasValidMoves(board)` tests all 112 adjacent swaps; if none yield a match, `shuffleGems` (Fisher-Yates on non-obstacle cells) is called and `board:shuffled` is emitted.

**localStorage keys**:
- `darkMagic_progress` — `{ levelStars: number[30], highScores: number[30] }`
- `darkMagic_playerName` — string, max 20 chars enforced in `setPlayerName()`
- `darkMagic_hiscores` — top-10 array of `{ name, score, level, stars, date }`

### `public/js/ui.js` — `window.UI`
Owns the `requestAnimationFrame` render loop, canvas drawing, DOM wiring, and all animation state. Key points:

- **High-DPI**: canvas physical size = `BOARD_PX * devicePixelRatio`; `ctx.scale(dpr, dpr)` so all drawing uses CSS pixels.
- **Tweening**: every gem has `animX/Y`, `targetX/Y`, `alpha/targetAlpha`, `scale/targetScale`. Each rAF tick lerps toward targets. `allGemsTweensSettled()` returns `true` when all positions/alphas are within `SNAP_DIST` of their targets — this is the gate used by `waitForSettled(fn)` to advance the cascade pipeline.
- **`onSwapStart({ r1, c1, r2, c2 })`**: called *after* the board has already been swapped in game.js. So `board[r1][c1]` holds old-g2 and needs its `targetX/Y` set to the `(c1, r1)` position, and vice versa.
- **Particle system**: two layers — ambient background (`ambientParticles`) and board burst particles (`particles`). Both drawn on a single `#particle-canvas` behind the board.
- **Screen management**: `showScreen(id)` toggles `.active` CSS class; only one screen is active at a time. Screens: `mainmenu`, `hiscores`, `levelselect`, `game`, `pause`, `complete`, `fail`.
- **XSS**: all user-controlled strings go through `escapeHtml()` before `innerHTML`; numeric fields are wrapped in `Number()`.

## Critical Invariants

- **Run elements are `{row, col, gem}` objects** — never index `run[i].type` directly; always use `run[i].gem.type`.
- **Booster creation happens before gem removal** — `classifyRuns` runs on the match set, then matching cells that receive a booster are removed from `toDestroy`, so the booster gem survives and is upgraded in-place.
- **Obstacle cells are fixed** — gravity write-pointer skips them: `writePtr = r - 1` when an obstacle is encountered, preserving its row position.
- **`triggerColor`** for `void_orb` is captured from `g2.type` *before* the board is mutated in `trySwap`.
- **Phase gate**: `phase` returns to `'input'` only after the full cascade + all fall animations resolve. Never restore it early.
