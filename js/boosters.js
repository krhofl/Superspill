'use strict';

window.Boosters = (() => {
  const BOARD_SIZE = 8;

  function inBounds(r, c) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
  }

  // ── Classify a set of matched runs into booster creation instructions ──────
  // matchRuns: array of arrays, each inner array is [{row,col,gem}] from one run
  // swapOrigin: {row,col} — the cell the player moved FROM (for void_orb placement)
  // Returns array of {boosterType, row, col} to create BEFORE removing gems
  function classifyRuns(matchRuns, swapOrigin) {
    const result = [];
    // First pass: find L/T intersections
    const ltCells = new Set(); // "row,col" keys of cells already claimed by L/T
    for (let i = 0; i < matchRuns.length; i++) {
      for (let j = i + 1; j < matchRuns.length; j++) {
        const a = matchRuns[i], b = matchRuns[j];
        // Check if they go in different axes and share a cell
        const aHoriz = a[0].row === a[1].row;
        const bHoriz = b[0].row === b[1].row;
        if (aHoriz === bHoriz) continue; // same axis, no L/T
        const intersection = findIntersection(a, b);
        if (intersection) {
          ltCells.add(`${intersection.row},${intersection.col}`);
          result.push({ boosterType: 'arcane_bomb', row: intersection.row, col: intersection.col });
        }
      }
    }

    // Second pass: classify remaining straight runs
    for (const run of matchRuns) {
      // Check if entire run is claimed by L/T
      const notClaimed = run.filter(c => !ltCells.has(`${c.row},${c.col}`));
      const len = run.length;
      if (len >= 5) {
        // Place void_orb at swap origin if it falls within the run, else at center
        const origin = run.find(c => c.row === swapOrigin.row && c.col === swapOrigin.col)
          || run[Math.floor(len / 2)];
        result.push({ boosterType: 'void_orb', row: origin.row, col: origin.col });
      } else if (len === 4) {
        // Place line_rune at the end of the run (last cell matched)
        const isHoriz = run[0].row === run[1].row;
        const last = run[len - 1];
        result.push({
          boosterType: isHoriz ? 'line_rune_row' : 'line_rune_col',
          row: last.row, col: last.col
        });
      }
      // len 3 → no booster
    }
    return result;
  }

  function findIntersection(runA, runB) {
    for (const a of runA) {
      for (const b of runB) {
        if (a.row === b.row && a.col === b.col) return a;
      }
    }
    return null;
  }

  // ── Activate a booster, returning array of {row,col} cells to destroy ──────
  // activatedIds: Set of gem ids already activated this cascade pass (anti-loop)
  function activate(board, row, col, triggerColor, activatedIds) {
    const gem = board[row][col];
    if (!gem || !gem.booster) return [];
    if (activatedIds.has(gem.id)) return [];
    activatedIds.add(gem.id);

    let cells = [];

    switch (gem.booster) {
      case 'line_rune_row':
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (board[row][c]) cells.push({ row, col: c });
        }
        break;

      case 'line_rune_col':
        for (let r = 0; r < BOARD_SIZE; r++) {
          if (board[r][col]) cells.push({ row: r, col });
        }
        break;

      case 'void_orb': {
        const color = triggerColor || gem.type;
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const g = board[r][c];
            if (g && g.type === color && !g.obstacleType) cells.push({ row: r, col: c });
          }
        }
        break;
      }

      case 'arcane_bomb':
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = row + dr, nc = col + dc;
            if (inBounds(nr, nc) && board[nr][nc]) cells.push({ row: nr, col: nc });
          }
        }
        break;
    }

    // Chain-activate any boosters found in destroyed cells
    const chainCells = [];
    for (const c of cells) {
      const g = board[c.row][c.col];
      if (g && g.booster && !activatedIds.has(g.id) && !(c.row === row && c.col === col)) {
        const chained = activate(board, c.row, c.col, g.type, activatedIds);
        chainCells.push(...chained);
      }
    }
    cells.push(...chainCells);

    // Deduplicate
    const seen = new Set();
    return cells.filter(c => {
      const key = `${c.row},${c.col}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ── Handle swapping two boosters together ─────────────────────────────────
  // Returns array of {row,col} cells to destroy
  function activateCombined(board, rowA, colA, rowB, colB, activatedIds) {
    const a = board[rowA][colA];
    const b = board[rowB][colB];
    if (!a || !b || !a.booster || !b.booster) return [];
    activatedIds.add(a.id);
    activatedIds.add(b.id);

    const typeA = a.booster, typeB = b.booster;
    let cells = [];

    // Sort so we can use a canonical pair check
    const pair = [typeA, typeB].sort().join('+');

    if (pair === 'line_rune_col+line_rune_row' || pair === 'line_rune_row+line_rune_row' || pair === 'line_rune_col+line_rune_col') {
      // Cross: entire row + entire column centred on each booster
      const rows = new Set([rowA, rowB]);
      const cols = new Set([colA, colB]);
      rows.forEach(r => {
        for (let c = 0; c < BOARD_SIZE; c++) if (board[r][c]) cells.push({ row: r, col: c });
      });
      cols.forEach(c => {
        for (let r = 0; r < BOARD_SIZE; r++) if (board[r][c]) cells.push({ row: r, col: c });
      });
    } else if (pair === 'line_rune_row+void_orb' || pair === 'line_rune_col+void_orb') {
      // Row/col + all of one color
      const lineGem = typeA.startsWith('line') ? a : b;
      const orbGem  = typeA === 'void_orb' ? a : b;
      const lr = lineGem === a ? rowA : rowB;
      const lc = lineGem === a ? colA : colB;
      const color = orbGem.type;
      if (lineGem.booster === 'line_rune_row') {
        for (let c = 0; c < BOARD_SIZE; c++) if (board[lr][c]) cells.push({ row: lr, col: c });
      } else {
        for (let r = 0; r < BOARD_SIZE; r++) if (board[r][lc]) cells.push({ row: r, col: lc });
      }
      for (let r = 0; r < BOARD_SIZE; r++)
        for (let c = 0; c < BOARD_SIZE; c++) {
          const g = board[r][c];
          if (g && g.type === color && !g.obstacleType) cells.push({ row: r, col: c });
        }
    } else if (pair === 'arcane_bomb+line_rune_col' || pair === 'arcane_bomb+line_rune_row') {
      // 3 parallel rows or columns
      const lineGem = typeA.startsWith('line') ? a : b;
      const lr = lineGem === a ? rowA : rowB;
      const lc = lineGem === a ? colA : colB;
      if (lineGem.booster === 'line_rune_row') {
        for (let dr = -1; dr <= 1; dr++) {
          const r = lr + dr;
          if (r >= 0 && r < BOARD_SIZE)
            for (let c = 0; c < BOARD_SIZE; c++) if (board[r][c]) cells.push({ row: r, col: c });
        }
      } else {
        for (let dc = -1; dc <= 1; dc++) {
          const c = lc + dc;
          if (c >= 0 && c < BOARD_SIZE)
            for (let r = 0; r < BOARD_SIZE; r++) if (board[r][c]) cells.push({ row: r, col: c });
        }
      }
    } else if (pair === 'void_orb+void_orb') {
      // All gems of both colors
      const colA2 = a.type, colB2 = b.type;
      for (let r = 0; r < BOARD_SIZE; r++)
        for (let c = 0; c < BOARD_SIZE; c++) {
          const g = board[r][c];
          if (g && (g.type === colA2 || g.type === colB2) && !g.obstacleType)
            cells.push({ row: r, col: c });
        }
    } else if (pair === 'arcane_bomb+void_orb') {
      // All of one color + 5x5 area
      const orbGem  = typeA === 'void_orb' ? a : b;
      const bombRow = typeA === 'arcane_bomb' ? rowA : rowB;
      const bombCol = typeA === 'arcane_bomb' ? colA : colB;
      const color = orbGem.type;
      for (let r = 0; r < BOARD_SIZE; r++)
        for (let c = 0; c < BOARD_SIZE; c++) {
          const g = board[r][c];
          if (g && g.type === color && !g.obstacleType) cells.push({ row: r, col: c });
        }
      for (let dr = -2; dr <= 2; dr++)
        for (let dc = -2; dc <= 2; dc++) {
          const nr = bombRow + dr, nc = bombCol + dc;
          if (inBounds(nr, nc) && board[nr][nc]) cells.push({ row: nr, col: nc });
        }
    } else if (pair === 'arcane_bomb+arcane_bomb') {
      // 5x5 explosion centred on swap midpoint
      const cr = Math.round((rowA + rowB) / 2), cc = Math.round((colA + colB) / 2);
      for (let dr = -2; dr <= 2; dr++)
        for (let dc = -2; dc <= 2; dc++) {
          const nr = cr + dr, nc = cc + dc;
          if (inBounds(nr, nc) && board[nr][nc]) cells.push({ row: nr, col: nc });
        }
    }

    // Deduplicate
    const seen = new Set();
    return cells.filter(c => {
      const key = `${c.row},${c.col}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return { classifyRuns, activate, activateCombined };
})();
