'use strict';

window.Game = (() => {
  const BOARD_SIZE = 8;
  const GEM_TYPES = ['fire', 'shadow', 'void', 'storm', 'blood', 'arcane'];

  let gemIdCounter = 0;
  let state = null;
  let eventListeners = {};

  // ── Event bus ──────────────────────────────────────────────────────────────
  function on(event, fn) {
    if (!eventListeners[event]) eventListeners[event] = [];
    eventListeners[event].push(fn);
  }

  function emit(event, data) {
    (eventListeners[event] || []).forEach(fn => fn(data));
  }

  // ── Gem factory ───────────────────────────────────────────────────────────
  function makeGem(type, booster = null) {
    return {
      id: gemIdCounter++,
      type,
      booster,
      obstacleType: null,
      obstacleHp: 0,
      visualState: 'idle',
      animX: 0, animY: 0,
      targetX: 0, targetY: 0,
      alpha: 1, targetAlpha: 1,
      scale: 1, targetScale: 1,
    };
  }

  function makeObstacle(type, hp) {
    const gem = makeGem('void');
    gem.obstacleType = type;
    gem.obstacleHp = hp;
    return gem;
  }

  // ── Board initialisation ──────────────────────────────────────────────────
  function initBoard(levelDef) {
    const board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

    // Place obstacles first
    for (const obs of levelDef.obstacles) {
      const g = makeObstacle(obs.type, obs.hp);
      board[obs.row][obs.col] = g;
    }

    const typeCount = Math.min(levelDef.gemTypes, GEM_TYPES.length);
    const types = GEM_TYPES.slice(0, typeCount);

    // Fill remaining cells, ensuring no initial matches
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c]) continue; // obstacle already placed
        let type;
        let attempts = 0;
        do {
          type = types[Math.floor(Math.random() * types.length)];
          attempts++;
        } while (attempts < 10 && wouldMatch(board, r, c, type));
        board[r][c] = makeGem(type);
      }
    }
    // Guarantee at least one valid move; reshuffle if deadlocked
    let shuffleAttempts = 0;
    while (!hasValidMoves(board) && shuffleAttempts < 20) {
      shuffleGems(board, levelDef);
      shuffleAttempts++;
    }
    return board;
  }

  function hasValidMoves(board) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const dirs = [[0,1],[1,0]];
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr >= BOARD_SIZE || nc >= BOARD_SIZE) continue;
          const g1 = board[r][c], g2 = board[nr][nc];
          if (!g1 || !g2 || g1.obstacleType || g2.obstacleType) continue;
          board[r][c] = g2; board[nr][nc] = g1;
          const { matchSet } = findAllMatches(board);
          board[r][c] = g1; board[nr][nc] = g2;
          if (matchSet.size > 0) return true;
        }
      }
    }
    return false;
  }

  function shuffleGems(board, levelDef) {
    // Collect all non-obstacle gems, shuffle them, redistribute
    const typeCount = Math.min(levelDef.gemTypes, GEM_TYPES.length);
    const types = GEM_TYPES.slice(0, typeCount);
    const cells = [];
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        if (board[r][c] && !board[r][c].obstacleType) cells.push([r, c]);
    // Fisher-Yates shuffle of gem types
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const [r1, c1] = cells[i], [r2, c2] = cells[j];
      const tmp = board[r1][c1];
      board[r1][c1] = board[r2][c2];
      board[r2][c2] = tmp;
    }
  }

  function wouldMatch(board, row, col, type) {
    // Check horizontal: need two same-type gems to the left
    if (col >= 2 &&
        board[row][col - 1] && board[row][col - 1].type === type && !board[row][col - 1].obstacleType &&
        board[row][col - 2] && board[row][col - 2].type === type && !board[row][col - 2].obstacleType) {
      return true;
    }
    // Check vertical: need two same-type gems above
    if (row >= 2 &&
        board[row - 1][col] && board[row - 1][col].type === type && !board[row - 1][col].obstacleType &&
        board[row - 2][col] && board[row - 2][col].type === type && !board[row - 2][col].obstacleType) {
      return true;
    }
    return false;
  }

  // ── Public API: start a level ─────────────────────────────────────────────
  function startLevel(levelDef) {
    gemIdCounter = 0;
    eventListeners = {};
    state = {
      level: levelDef,
      board: initBoard(levelDef),
      score: 0,
      movesLeft: levelDef.moves,
      cascadeDepth: 0,
      phase: 'input',
      selectedCell: null,
      starsEarned: 0,
    };
    return state;
  }

  function getState() { return state; }

  // ── Match detection ───────────────────────────────────────────────────────
  // Returns {matchSet: Set of "r,c" strings, runs: array of cell arrays}
  function findAllMatches(board) {
    const runs = [];

    // Horizontal
    for (let r = 0; r < BOARD_SIZE; r++) {
      let run = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        const gem = board[r][c];
        if (gem && !gem.obstacleType && run.length > 0 && gem.type === run[0].gem.type) {
          run.push({ row: r, col: c, gem });
        } else {
          if (run.length >= 3) runs.push(run);
          run = gem && !gem.obstacleType ? [{ row: r, col: c, gem }] : [];
        }
      }
      if (run.length >= 3) runs.push(run);
    }

    // Vertical
    for (let c = 0; c < BOARD_SIZE; c++) {
      let run = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        const gem = board[r][c];
        if (gem && !gem.obstacleType && run.length > 0 && gem.type === run[0].gem.type) {
          run.push({ row: r, col: c, gem });
        } else {
          if (run.length >= 3) runs.push(run);
          run = gem && !gem.obstacleType ? [{ row: r, col: c, gem }] : [];
        }
      }
      if (run.length >= 3) runs.push(run);
    }

    const matchSet = new Set();
    for (const run of runs) run.forEach(c => matchSet.add(`${c.row},${c.col}`));

    return { matchSet, runs };
  }

  function hasAnyMatch(board) {
    return findAllMatches(board).matchSet.size > 0;
  }

  // ── Swap attempt ──────────────────────────────────────────────────────────
  function trySwap(r1, c1, r2, c2) {
    if (state.phase !== 'input') return;
    if (!inBounds(r1, c1) || !inBounds(r2, c2)) return;

    const g1 = state.board[r1][c1];
    const g2 = state.board[r2][c2];
    if (!g1 || !g2) return;
    if (g1.obstacleType || g2.obstacleType) return; // can't move obstacle cells

    // Booster + booster swap
    if (g1.booster && g2.booster) {
      state.phase = 'animating';
      emit('swap:start', { r1, c1, r2, c2 });
      // Resolve after animation
      pendingSwap = { r1, c1, r2, c2, isComboBoosters: true, triggerColor: g2.type };
      return;
    }

    // Perform swap on board
    state.board[r1][c1] = g2;
    state.board[r2][c2] = g1;

    const { matchSet } = findAllMatches(state.board);

    if (matchSet.size === 0) {
      // Swap back — no match
      state.board[r1][c1] = g1;
      state.board[r2][c2] = g2;
      emit('swap:invalid', { r1, c1, r2, c2 });
      return;
    }

    state.phase = 'animating';
    state.movesLeft--;
    const triggerColor = g2.type; // color entering g1's position (for void_orb)
    emit('swap:start', { r1, c1, r2, c2 });
    pendingSwap = { r1, c1, r2, c2, isComboBoosters: false, triggerColor };
  }

  let pendingSwap = null;

  // Called by ui.js once the swap animation completes
  function onSwapAnimDone() {
    if (!pendingSwap) return;
    const { r1, c1, r2, c2, isComboBoosters, triggerColor } = pendingSwap;
    pendingSwap = null;

    if (isComboBoosters) {
      state.movesLeft--;
      const activatedIds = new Set();
      const cells = Boosters.activateCombined(state.board, r1, c1, r2, c2, activatedIds);
      applyDestroyList(cells, state.board, triggerColor);
      runCascade(triggerColor);
    } else {
      // Board already swapped; just run cascade
      runCascade(triggerColor);
    }
  }

  // ── Cascade ───────────────────────────────────────────────────────────────
  // This is async-style: each step emits an event and waits for ui.js to call
  // the appropriate "done" callback before proceeding.

  let _cascadeTriggerColor = null;

  function runCascade(triggerColor) {
    _cascadeTriggerColor = triggerColor;
    state.phase = 'cascading';
    state.cascadeDepth = 0;
    _doCascadeStep();
  }

  function _doCascadeStep() {
    const { matchSet, runs } = findAllMatches(state.board);

    if (matchSet.size === 0) {
      state.cascadeDepth = 0;
      if (!hasValidMoves(state.board)) {
        shuffleGems(state.board, state.level);
        emit('board:shuffled', {});
      }
      state.phase = 'input';
      checkWinLose();
      emit('board:stable', {});
      return;
    }

    // Booster creation (before removal)
    const swapOrigin = _lastSwapOrigin || { row: 0, col: 0 };
    const boosterInstructions = Boosters.classifyRuns(runs, swapOrigin);

    // Collect all booster-activated cells
    const activatedIds = new Set();
    let extraCells = [];
    for (const run of runs) {
      for (const cell of run) {
        const g = state.board[cell.row][cell.col];
        if (g && g.booster && !activatedIds.has(g.id)) {
          const bc = Boosters.activate(state.board, cell.row, cell.col, _cascadeTriggerColor, activatedIds);
          extraCells.push(...bc);
        }
      }
    }

    // Merge matchSet with booster cells
    const toDestroy = new Set(matchSet);
    for (const c of extraCells) toDestroy.add(`${c.row},${c.col}`);

    // Damage adjacent obstacles
    damageAdjacentObstacles(toDestroy);

    // Score
    const baseScore = toDestroy.size * 50;
    const multiplier = 1 + state.cascadeDepth * 0.5;
    const gained = Math.floor(baseScore * multiplier);
    state.score += gained;
    emit('score:updated', { score: state.score, gained, multiplier });

    // Apply booster upgrades to cells (before marking for removal)
    for (const inst of boosterInstructions) {
      const key = `${inst.row},${inst.col}`;
      if (!toDestroy.has(key)) continue; // safety: only upgrade cells that are being removed
      // Remove from toDestroy so the booster gem survives
      toDestroy.delete(key);
      const g = state.board[inst.row][inst.col];
      if (g) {
        g.booster = inst.boosterType;
        g.visualState = 'booster_created';
        emit('booster:created', { row: inst.row, col: inst.col, boosterType: inst.boosterType });
      }
    }

    // Mark cells for removal
    const removalList = [];
    for (const key of toDestroy) {
      const [r, c] = key.split(',').map(Number);
      const g = state.board[r][c];
      if (!g) continue;
      if (g.obstacleType) {
        // Obstacles were handled in damageAdjacentObstacles, but direct matches also hit them
        g.obstacleHp--;
        if (g.obstacleHp <= 0) {
          g.visualState = 'matched';
          removalList.push({ row: r, col: c });
        }
      } else {
        g.visualState = 'matched';
        removalList.push({ row: r, col: c });
      }
    }

    state.cascadeDepth++;
    emit('gems:matched', { cells: removalList, cascadeDepth: state.cascadeDepth });
    // ui.js will call onMatchAnimDone() when removal animations finish
  }

  function onMatchAnimDone() {
    const board = state.board;
    // Remove matched gems
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        if (board[r][c] && board[r][c].visualState === 'matched') board[r][c] = null;

    // Gravity: column-wise compact downward, skipping fixed obstacles
    const fallList = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      let writePtr = BOARD_SIZE - 1;
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        const g = board[r][c];
        if (!g) continue;
        if (g.obstacleType) {
          // Obstacle stays fixed — skip the write pointer past it
          writePtr = r - 1;
          continue;
        }
        if (writePtr !== r) {
          board[writePtr][c] = g;
          board[r][c] = null;
          fallList.push({ row: writePtr, col: c, fromRow: r, gem: g });
          g.visualState = 'falling';
        }
        writePtr--;
      }

      // Fill empty non-obstacle slots from top
      const typeCount = Math.min(state.level.gemTypes, GEM_TYPES.length);
      const types = GEM_TYPES.slice(0, typeCount);
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (!board[r][c]) {
          const type = types[Math.floor(Math.random() * types.length)];
          const g = makeGem(type);
          g.visualState = 'spawning';
          board[r][c] = g;
          fallList.push({ row: r, col: c, fromRow: r - BOARD_SIZE, gem: g, isNew: true });
        }
      }
    }

    emit('gems:fell', { fallList });
    // ui.js will call onFallAnimDone()
  }

  function onFallAnimDone() {
    // Reset visual states
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        if (state.board[r][c]) state.board[r][c].visualState = 'idle';

    _doCascadeStep(); // check for new matches
  }

  // ── Obstacle damage ───────────────────────────────────────────────────────
  function damageAdjacentObstacles(toDestroyKeys) {
    const damaged = new Set();
    for (const key of toDestroyKeys) {
      const [r, c] = key.split(',').map(Number);
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r + dr, nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        const g = state.board[nr][nc];
        if (!g || !g.obstacleType) continue;
        const oKey = `${nr},${nc}`;
        if (damaged.has(oKey)) continue;
        damaged.add(oKey);
        g.obstacleHp--;
        emit('obstacle:damaged', { row: nr, col: nc, gem: g });
        if (g.obstacleHp <= 0) {
          g.obstacleType = null; // becomes a regular gem slot
          emit('obstacle:destroyed', { row: nr, col: nc });
        }
      }
    }
  }

  function applyDestroyList(cells, board, triggerColor) {
    for (const c of cells) {
      const g = board[c.row][c.col];
      if (!g) continue;
      g.visualState = 'matched';
    }
  }

  // ── Win/lose check ────────────────────────────────────────────────────────
  function checkWinLose() {
    const stars = computeStars();
    if (stars >= 1) {
      state.starsEarned = stars;
      state.phase = 'complete';
      saveProgress(state.level.id, stars, state.score);
      emit('level:complete', { stars, score: state.score });
    } else if (state.movesLeft <= 0) {
      state.phase = 'fail';
      emit('level:fail', { score: state.score });
    }
  }

  function computeStars() {
    if (state.score >= state.level.star3Score) return 3;
    if (state.score >= state.level.star2Score) return 2;
    if (state.score >= state.level.targetScore) return 1;
    return 0;
  }

  // ── Progress persistence ───────────────────────────────────────────────────
  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem('darkMagic_progress')) || { levelStars: Array(30).fill(0), highScores: Array(30).fill(0) };
    } catch { return { levelStars: Array(30).fill(0), highScores: Array(30).fill(0) }; }
  }

  function saveProgress(levelId, stars, score) {
    const prog = loadProgress();
    const idx = levelId - 1;
    if (stars > (prog.levelStars[idx] || 0)) prog.levelStars[idx] = stars;
    if (score > (prog.highScores[idx] || 0)) prog.highScores[idx] = score;
    try { localStorage.setItem('darkMagic_progress', JSON.stringify(prog)); } catch {}
  }

  // ── Player name ───────────────────────────────────────────────────────────
  function getPlayerName() {
    return localStorage.getItem('darkMagic_playerName') || 'Shadow Mage';
  }

  function setPlayerName(name) {
    const trimmed = (name || '').trim() || 'Shadow Mage';
    try { localStorage.setItem('darkMagic_playerName', trimmed); } catch {}
    return trimmed;
  }

  // ── High-score table ──────────────────────────────────────────────────────
  function loadHiScores() {
    try {
      return JSON.parse(localStorage.getItem('darkMagic_hiscores')) || [];
    } catch { return []; }
  }

  function saveHiScore(entry) {
    let table = loadHiScores();
    const existing = table.findIndex(e => e.name === entry.name && e.level === entry.level);
    if (existing !== -1) {
      if (entry.score > table[existing].score) table[existing] = entry;
    } else {
      table.push(entry);
    }
    table.sort((a, b) => b.score - a.score);
    table = table.slice(0, 10);
    try { localStorage.setItem('darkMagic_hiscores', JSON.stringify(table)); } catch {}
    return table;
  }

  // ── Utility ───────────────────────────────────────────────────────────────
  function inBounds(r, c) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
  }

  let _lastSwapOrigin = null;
  function setLastSwapOrigin(r, c) { _lastSwapOrigin = { row: r, col: c }; }

  return {
    on, emit,
    startLevel, getState,
    trySwap, setLastSwapOrigin,
    onSwapAnimDone, onMatchAnimDone, onFallAnimDone,
    findAllMatches, hasAnyMatch, loadProgress, computeStars,
    getPlayerName, setPlayerName, loadHiScores, saveHiScore,
    GEM_TYPES, BOARD_SIZE,
  };
})();
