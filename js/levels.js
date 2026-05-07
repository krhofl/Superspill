'use strict';

window.LEVELS = [
  // ── Tutorial levels 1-4: 4 gem types, no obstacles ────────────────────────
  {
    id: 1, moves: 25, targetScore: 600, star2Score: 900, star3Score: 1200,
    gemTypes: 4, obstacles: [], lockedGems: []
  },
  {
    id: 2, moves: 22, targetScore: 800, star2Score: 1200, star3Score: 1600,
    gemTypes: 4, obstacles: [], lockedGems: []
  },
  {
    id: 3, moves: 24, targetScore: 1000, star2Score: 1500, star3Score: 2000,
    gemTypes: 5, obstacles: [], lockedGems: []
  },
  {
    id: 4, moves: 26, targetScore: 1200, star2Score: 1800, star3Score: 2400,
    gemTypes: 5, obstacles: [], lockedGems: []
  },

  // ── Levels 5-9: obstacles introduced ──────────────────────────────────────
  {
    id: 5, moves: 28, targetScore: 2000, star2Score: 3000, star3Score: 4000,
    gemTypes: 5,
    obstacles: [
      { type: 'frozen', row: 3, col: 3, hp: 2 },
      { type: 'frozen', row: 3, col: 4, hp: 2 },
      { type: 'stone',  row: 6, col: 1, hp: 1 },
      { type: 'stone',  row: 6, col: 6, hp: 1 }
    ],
    lockedGems: []
  },
  {
    id: 6, moves: 27, targetScore: 2400, star2Score: 3600, star3Score: 4800,
    gemTypes: 5,
    obstacles: [
      { type: 'stone',  row: 0, col: 0, hp: 1 },
      { type: 'stone',  row: 0, col: 7, hp: 1 },
      { type: 'frozen', row: 4, col: 2, hp: 2 },
      { type: 'frozen', row: 4, col: 5, hp: 2 }
    ],
    lockedGems: []
  },
  {
    id: 7, moves: 30, targetScore: 2800, star2Score: 4200, star3Score: 5600,
    gemTypes: 5,
    obstacles: [
      { type: 'frozen', row: 1, col: 1, hp: 2 },
      { type: 'frozen', row: 1, col: 6, hp: 2 },
      { type: 'frozen', row: 6, col: 1, hp: 2 },
      { type: 'frozen', row: 6, col: 6, hp: 2 },
      { type: 'stone',  row: 3, col: 3, hp: 1 },
      { type: 'stone',  row: 3, col: 4, hp: 1 }
    ],
    lockedGems: []
  },
  {
    id: 8, moves: 29, targetScore: 3200, star2Score: 4800, star3Score: 6400,
    gemTypes: 6,
    obstacles: [
      { type: 'stone',  row: 2, col: 2, hp: 1 },
      { type: 'stone',  row: 2, col: 5, hp: 1 },
      { type: 'frozen', row: 4, col: 1, hp: 2 },
      { type: 'frozen', row: 4, col: 3, hp: 2 },
      { type: 'frozen', row: 4, col: 4, hp: 2 },
      { type: 'frozen', row: 4, col: 6, hp: 2 }
    ],
    lockedGems: []
  },
  {
    id: 9, moves: 32, targetScore: 3600, star2Score: 5400, star3Score: 7200,
    gemTypes: 6,
    obstacles: [
      { type: 'frozen', row: 0, col: 3, hp: 2 },
      { type: 'frozen', row: 0, col: 4, hp: 2 },
      { type: 'stone',  row: 3, col: 0, hp: 1 },
      { type: 'stone',  row: 3, col: 7, hp: 1 },
      { type: 'stone',  row: 4, col: 0, hp: 1 },
      { type: 'stone',  row: 4, col: 7, hp: 1 },
      { type: 'frozen', row: 7, col: 3, hp: 2 },
      { type: 'frozen', row: 7, col: 4, hp: 2 }
    ],
    lockedGems: []
  },

  // ── Levels 10-19: 6 gem types, heavier obstacles ───────────────────────────
  {
    id: 10, moves: 30, targetScore: 4500, star2Score: 6750, star3Score: 9000,
    gemTypes: 6,
    obstacles: [
      { type: 'frozen', row: 1, col: 1, hp: 2 },
      { type: 'frozen', row: 1, col: 3, hp: 2 },
      { type: 'frozen', row: 1, col: 4, hp: 2 },
      { type: 'frozen', row: 1, col: 6, hp: 2 },
      { type: 'stone',  row: 5, col: 2, hp: 1 },
      { type: 'stone',  row: 5, col: 5, hp: 1 }
    ],
    lockedGems: []
  },
  {
    id: 11, moves: 28, targetScore: 5000, star2Score: 7500, star3Score: 10000,
    gemTypes: 6,
    obstacles: [
      { type: 'stone',  row: 2, col: 0, hp: 1 },
      { type: 'stone',  row: 2, col: 7, hp: 1 },
      { type: 'frozen', row: 3, col: 2, hp: 2 },
      { type: 'frozen', row: 3, col: 5, hp: 2 },
      { type: 'frozen', row: 5, col: 2, hp: 2 },
      { type: 'frozen', row: 5, col: 5, hp: 2 }
    ],
    lockedGems: []
  },
  {
    id: 12, moves: 27, targetScore: 5500, star2Score: 8250, star3Score: 11000,
    gemTypes: 6,
    obstacles: [
      { type: 'frozen', row: 0, col: 0, hp: 2 },
      { type: 'frozen', row: 0, col: 7, hp: 2 },
      { type: 'stone',  row: 2, col: 2, hp: 1 },
      { type: 'stone',  row: 2, col: 5, hp: 1 },
      { type: 'stone',  row: 5, col: 2, hp: 1 },
      { type: 'stone',  row: 5, col: 5, hp: 1 },
      { type: 'frozen', row: 7, col: 0, hp: 2 },
      { type: 'frozen', row: 7, col: 7, hp: 2 }
    ],
    lockedGems: []
  },
  {
    id: 13, moves: 31, targetScore: 6000, star2Score: 9000, star3Score: 12000,
    gemTypes: 6,
    obstacles: [
      { type: 'frozen', row: 2, col: 1, hp: 2 },
      { type: 'frozen', row: 2, col: 2, hp: 2 },
      { type: 'frozen', row: 2, col: 5, hp: 2 },
      { type: 'frozen', row: 2, col: 6, hp: 2 },
      { type: 'stone',  row: 4, col: 1, hp: 1 },
      { type: 'stone',  row: 4, col: 6, hp: 1 },
      { type: 'stone',  row: 6, col: 3, hp: 1 },
      { type: 'stone',  row: 6, col: 4, hp: 1 }
    ],
    lockedGems: []
  },
  {
    id: 14, moves: 29, targetScore: 6200, star2Score: 9300, star3Score: 12400,
    gemTypes: 6,
    obstacles: [
      { type: 'stone',  row: 1, col: 3, hp: 1 },
      { type: 'stone',  row: 1, col: 4, hp: 1 },
      { type: 'frozen', row: 3, col: 0, hp: 2 },
      { type: 'frozen', row: 3, col: 1, hp: 2 },
      { type: 'frozen', row: 3, col: 6, hp: 2 },
      { type: 'frozen', row: 3, col: 7, hp: 2 },
      { type: 'frozen', row: 5, col: 3, hp: 2 },
      { type: 'frozen', row: 5, col: 4, hp: 2 }
    ],
    lockedGems: []
  },
  {
    id: 15, moves: 30, targetScore: 6500, star2Score: 9750, star3Score: 13000,
    gemTypes: 6,
    obstacles: [
      { type: 'frozen', row: 0, col: 2, hp: 2 },
      { type: 'frozen', row: 0, col: 5, hp: 2 },
      { type: 'frozen', row: 2, col: 0, hp: 2 },
      { type: 'frozen', row: 2, col: 7, hp: 2 },
      { type: 'stone',  row: 4, col: 3, hp: 1 },
      { type: 'stone',  row: 4, col: 4, hp: 1 },
      { type: 'stone',  row: 7, col: 0, hp: 1 },
      { type: 'stone',  row: 7, col: 7, hp: 1 }
    ],
    lockedGems: []
  },
  {
    id: 16, moves: 28, targetScore: 7000, star2Score: 10500, star3Score: 14000,
    gemTypes: 6,
    obstacles: [
      { type: 'frozen', row: 1, col: 0, hp: 2 },
      { type: 'frozen', row: 1, col: 1, hp: 2 },
      { type: 'frozen', row: 1, col: 2, hp: 2 },
      { type: 'stone',  row: 3, col: 4, hp: 1 },
      { type: 'stone',  row: 4, col: 3, hp: 1 },
      { type: 'frozen', row: 6, col: 5, hp: 2 },
      { type: 'frozen', row: 6, col: 6, hp: 2 },
      { type: 'frozen', row: 6, col: 7, hp: 2 }
    ],
    lockedGems: []
  },
  {
    id: 17, moves: 32, targetScore: 7500, star2Score: 11250, star3Score: 15000,
    gemTypes: 6,
    obstacles: [
      { type: 'stone',  row: 0, col: 3, hp: 1 },
      { type: 'stone',  row: 0, col: 4, hp: 1 },
      { type: 'frozen', row: 2, col: 2, hp: 2 },
      { type: 'frozen', row: 2, col: 3, hp: 2 },
      { type: 'frozen', row: 2, col: 4, hp: 2 },
      { type: 'frozen', row: 2, col: 5, hp: 2 },
      { type: 'stone',  row: 5, col: 2, hp: 1 },
      { type: 'stone',  row: 5, col: 5, hp: 1 },
      { type: 'stone',  row: 7, col: 3, hp: 1 },
      { type: 'stone',  row: 7, col: 4, hp: 1 }
    ],
    lockedGems: []
  },
  {
    id: 18, moves: 26, targetScore: 8000, star2Score: 12000, star3Score: 16000,
    gemTypes: 6,
    obstacles: [
      { type: 'frozen', row: 0, col: 1, hp: 2 },
      { type: 'frozen', row: 0, col: 2, hp: 2 },
      { type: 'frozen', row: 0, col: 5, hp: 2 },
      { type: 'frozen', row: 0, col: 6, hp: 2 },
      { type: 'stone',  row: 3, col: 3, hp: 1 },
      { type: 'stone',  row: 3, col: 4, hp: 1 },
      { type: 'stone',  row: 4, col: 3, hp: 1 },
      { type: 'stone',  row: 4, col: 4, hp: 1 },
      { type: 'frozen', row: 7, col: 1, hp: 2 },
      { type: 'frozen', row: 7, col: 2, hp: 2 },
      { type: 'frozen', row: 7, col: 5, hp: 2 },
      { type: 'frozen', row: 7, col: 6, hp: 2 }
    ],
    lockedGems: []
  },
  {
    id: 19, moves: 30, targetScore: 9000, star2Score: 13500, star3Score: 18000,
    gemTypes: 6,
    obstacles: [
      { type: 'stone',  row: 1, col: 1, hp: 1 },
      { type: 'stone',  row: 1, col: 3, hp: 1 },
      { type: 'stone',  row: 1, col: 4, hp: 1 },
      { type: 'stone',  row: 1, col: 6, hp: 1 },
      { type: 'frozen', row: 3, col: 2, hp: 2 },
      { type: 'frozen', row: 3, col: 5, hp: 2 },
      { type: 'frozen', row: 4, col: 2, hp: 2 },
      { type: 'frozen', row: 4, col: 5, hp: 2 },
      { type: 'stone',  row: 6, col: 1, hp: 1 },
      { type: 'stone',  row: 6, col: 3, hp: 1 },
      { type: 'stone',  row: 6, col: 4, hp: 1 },
      { type: 'stone',  row: 6, col: 6, hp: 1 }
    ],
    lockedGems: []
  },

  // ── Levels 20-29: tighter budgets, dense obstacles ─────────────────────────
  {
    id: 20, moves: 27, targetScore: 10000, star2Score: 15000, star3Score: 20000,
    gemTypes: 6,
    obstacles: [
      { type: 'frozen', row: 0, col: 0, hp: 2 }, { type: 'frozen', row: 0, col: 1, hp: 2 },
      { type: 'frozen', row: 0, col: 6, hp: 2 }, { type: 'frozen', row: 0, col: 7, hp: 2 },
      { type: 'stone',  row: 2, col: 3, hp: 1 }, { type: 'stone',  row: 2, col: 4, hp: 1 },
      { type: 'stone',  row: 5, col: 3, hp: 1 }, { type: 'stone',  row: 5, col: 4, hp: 1 },
      { type: 'frozen', row: 7, col: 0, hp: 2 }, { type: 'frozen', row: 7, col: 1, hp: 2 },
      { type: 'frozen', row: 7, col: 6, hp: 2 }, { type: 'frozen', row: 7, col: 7, hp: 2 }
    ],
    lockedGems: []
  },
  {
    id: 21, moves: 25, targetScore: 11000, star2Score: 16500, star3Score: 22000,
    gemTypes: 6,
    obstacles: [
      { type: 'frozen', row: 1, col: 0, hp: 2 }, { type: 'stone',  row: 1, col: 2, hp: 1 },
      { type: 'stone',  row: 1, col: 5, hp: 1 }, { type: 'frozen', row: 1, col: 7, hp: 2 },
      { type: 'frozen', row: 3, col: 3, hp: 2 }, { type: 'frozen', row: 3, col: 4, hp: 2 },
      { type: 'frozen', row: 4, col: 3, hp: 2 }, { type: 'frozen', row: 4, col: 4, hp: 2 },
      { type: 'frozen', row: 6, col: 0, hp: 2 }, { type: 'stone',  row: 6, col: 2, hp: 1 },
      { type: 'stone',  row: 6, col: 5, hp: 1 }, { type: 'frozen', row: 6, col: 7, hp: 2 }
    ],
    lockedGems: []
  },
  {
    id: 22, moves: 28, targetScore: 12000, star2Score: 18000, star3Score: 24000,
    gemTypes: 6,
    obstacles: [
      { type: 'stone',  row: 0, col: 2, hp: 1 }, { type: 'stone',  row: 0, col: 5, hp: 1 },
      { type: 'frozen', row: 2, col: 0, hp: 2 }, { type: 'frozen', row: 2, col: 1, hp: 2 },
      { type: 'frozen', row: 2, col: 6, hp: 2 }, { type: 'frozen', row: 2, col: 7, hp: 2 },
      { type: 'stone',  row: 3, col: 3, hp: 1 }, { type: 'stone',  row: 4, col: 4, hp: 1 },
      { type: 'frozen', row: 5, col: 0, hp: 2 }, { type: 'frozen', row: 5, col: 1, hp: 2 },
      { type: 'frozen', row: 5, col: 6, hp: 2 }, { type: 'frozen', row: 5, col: 7, hp: 2 },
      { type: 'stone',  row: 7, col: 2, hp: 1 }, { type: 'stone',  row: 7, col: 5, hp: 1 }
    ],
    lockedGems: []
  },
  {
    id: 23, moves: 26, targetScore: 13000, star2Score: 19500, star3Score: 26000,
    gemTypes: 6,
    obstacles: [
      { type: 'frozen', row: 0, col: 3, hp: 2 }, { type: 'frozen', row: 0, col: 4, hp: 2 },
      { type: 'frozen', row: 1, col: 3, hp: 2 }, { type: 'frozen', row: 1, col: 4, hp: 2 },
      { type: 'stone',  row: 3, col: 1, hp: 1 }, { type: 'stone',  row: 3, col: 6, hp: 1 },
      { type: 'stone',  row: 4, col: 1, hp: 1 }, { type: 'stone',  row: 4, col: 6, hp: 1 },
      { type: 'frozen', row: 6, col: 3, hp: 2 }, { type: 'frozen', row: 6, col: 4, hp: 2 },
      { type: 'frozen', row: 7, col: 3, hp: 2 }, { type: 'frozen', row: 7, col: 4, hp: 2 }
    ],
    lockedGems: []
  },
  {
    id: 24, moves: 24, targetScore: 14000, star2Score: 21000, star3Score: 28000,
    gemTypes: 6,
    obstacles: [
      { type: 'stone',  row: 1, col: 1, hp: 1 }, { type: 'stone',  row: 1, col: 2, hp: 1 },
      { type: 'stone',  row: 1, col: 5, hp: 1 }, { type: 'stone',  row: 1, col: 6, hp: 1 },
      { type: 'frozen', row: 2, col: 3, hp: 2 }, { type: 'frozen', row: 2, col: 4, hp: 2 },
      { type: 'frozen', row: 3, col: 0, hp: 2 }, { type: 'frozen', row: 3, col: 7, hp: 2 },
      { type: 'frozen', row: 4, col: 0, hp: 2 }, { type: 'frozen', row: 4, col: 7, hp: 2 },
      { type: 'frozen', row: 5, col: 3, hp: 2 }, { type: 'frozen', row: 5, col: 4, hp: 2 },
      { type: 'stone',  row: 6, col: 1, hp: 1 }, { type: 'stone',  row: 6, col: 2, hp: 1 },
      { type: 'stone',  row: 6, col: 5, hp: 1 }, { type: 'stone',  row: 6, col: 6, hp: 1 }
    ],
    lockedGems: []
  },
  {
    id: 25, moves: 29, targetScore: 15000, star2Score: 22500, star3Score: 30000,
    gemTypes: 6,
    obstacles: [
      { type: 'frozen', row: 0, col: 0, hp: 2 }, { type: 'frozen', row: 0, col: 1, hp: 2 },
      { type: 'frozen', row: 0, col: 2, hp: 2 }, { type: 'frozen', row: 0, col: 5, hp: 2 },
      { type: 'frozen', row: 0, col: 6, hp: 2 }, { type: 'frozen', row: 0, col: 7, hp: 2 },
      { type: 'stone',  row: 3, col: 2, hp: 1 }, { type: 'stone',  row: 3, col: 3, hp: 1 },
      { type: 'stone',  row: 3, col: 4, hp: 1 }, { type: 'stone',  row: 3, col: 5, hp: 1 },
      { type: 'stone',  row: 4, col: 2, hp: 1 }, { type: 'stone',  row: 4, col: 3, hp: 1 },
      { type: 'stone',  row: 4, col: 4, hp: 1 }, { type: 'stone',  row: 4, col: 5, hp: 1 },
      { type: 'frozen', row: 7, col: 0, hp: 2 }, { type: 'frozen', row: 7, col: 1, hp: 2 },
      { type: 'frozen', row: 7, col: 2, hp: 2 }, { type: 'frozen', row: 7, col: 5, hp: 2 },
      { type: 'frozen', row: 7, col: 6, hp: 2 }, { type: 'frozen', row: 7, col: 7, hp: 2 }
    ],
    lockedGems: []
  },
  {
    id: 26, moves: 23, targetScore: 15500, star2Score: 23250, star3Score: 31000,
    gemTypes: 6,
    obstacles: [
      { type: 'frozen', row: 1, col: 1, hp: 2 }, { type: 'frozen', row: 1, col: 2, hp: 2 },
      { type: 'frozen', row: 1, col: 3, hp: 2 }, { type: 'frozen', row: 1, col: 4, hp: 2 },
      { type: 'frozen', row: 1, col: 5, hp: 2 }, { type: 'frozen', row: 1, col: 6, hp: 2 },
      { type: 'stone',  row: 4, col: 0, hp: 1 }, { type: 'stone',  row: 4, col: 7, hp: 1 },
      { type: 'frozen', row: 6, col: 1, hp: 2 }, { type: 'frozen', row: 6, col: 2, hp: 2 },
      { type: 'frozen', row: 6, col: 3, hp: 2 }, { type: 'frozen', row: 6, col: 4, hp: 2 },
      { type: 'frozen', row: 6, col: 5, hp: 2 }, { type: 'frozen', row: 6, col: 6, hp: 2 }
    ],
    lockedGems: []
  },
  {
    id: 27, moves: 25, targetScore: 16000, star2Score: 24000, star3Score: 32000,
    gemTypes: 6,
    obstacles: [
      { type: 'stone',  row: 0, col: 3, hp: 1 }, { type: 'stone',  row: 0, col: 4, hp: 1 },
      { type: 'frozen', row: 2, col: 1, hp: 2 }, { type: 'frozen', row: 2, col: 2, hp: 2 },
      { type: 'frozen', row: 2, col: 3, hp: 2 }, { type: 'frozen', row: 2, col: 4, hp: 2 },
      { type: 'frozen', row: 2, col: 5, hp: 2 }, { type: 'frozen', row: 2, col: 6, hp: 2 },
      { type: 'stone',  row: 3, col: 0, hp: 1 }, { type: 'stone',  row: 4, col: 7, hp: 1 },
      { type: 'frozen', row: 5, col: 1, hp: 2 }, { type: 'frozen', row: 5, col: 2, hp: 2 },
      { type: 'frozen', row: 5, col: 3, hp: 2 }, { type: 'frozen', row: 5, col: 4, hp: 2 },
      { type: 'frozen', row: 5, col: 5, hp: 2 }, { type: 'frozen', row: 5, col: 6, hp: 2 },
      { type: 'stone',  row: 7, col: 3, hp: 1 }, { type: 'stone',  row: 7, col: 4, hp: 1 }
    ],
    lockedGems: []
  },
  {
    id: 28, moves: 22, targetScore: 16500, star2Score: 24750, star3Score: 33000,
    gemTypes: 6,
    obstacles: [
      { type: 'frozen', row: 0, col: 0, hp: 2 }, { type: 'frozen', row: 0, col: 2, hp: 2 },
      { type: 'frozen', row: 0, col: 4, hp: 2 }, { type: 'frozen', row: 0, col: 6, hp: 2 },
      { type: 'stone',  row: 2, col: 1, hp: 1 }, { type: 'stone',  row: 2, col: 3, hp: 1 },
      { type: 'stone',  row: 2, col: 5, hp: 1 }, { type: 'stone',  row: 2, col: 7, hp: 1 },
      { type: 'frozen', row: 4, col: 0, hp: 2 }, { type: 'frozen', row: 4, col: 2, hp: 2 },
      { type: 'frozen', row: 4, col: 4, hp: 2 }, { type: 'frozen', row: 4, col: 6, hp: 2 },
      { type: 'stone',  row: 6, col: 1, hp: 1 }, { type: 'stone',  row: 6, col: 3, hp: 1 },
      { type: 'stone',  row: 6, col: 5, hp: 1 }, { type: 'stone',  row: 6, col: 7, hp: 1 }
    ],
    lockedGems: []
  },
  {
    id: 29, moves: 24, targetScore: 17000, star2Score: 25500, star3Score: 34000,
    gemTypes: 6,
    obstacles: [
      { type: 'frozen', row: 0, col: 0, hp: 2 }, { type: 'frozen', row: 0, col: 1, hp: 2 },
      { type: 'frozen', row: 0, col: 2, hp: 2 }, { type: 'frozen', row: 0, col: 3, hp: 2 },
      { type: 'frozen', row: 0, col: 4, hp: 2 }, { type: 'frozen', row: 0, col: 5, hp: 2 },
      { type: 'frozen', row: 0, col: 6, hp: 2 }, { type: 'frozen', row: 0, col: 7, hp: 2 },
      { type: 'stone',  row: 3, col: 1, hp: 1 }, { type: 'stone',  row: 3, col: 2, hp: 1 },
      { type: 'stone',  row: 3, col: 5, hp: 1 }, { type: 'stone',  row: 3, col: 6, hp: 1 },
      { type: 'stone',  row: 4, col: 1, hp: 1 }, { type: 'stone',  row: 4, col: 2, hp: 1 },
      { type: 'stone',  row: 4, col: 5, hp: 1 }, { type: 'stone',  row: 4, col: 6, hp: 1 },
      { type: 'frozen', row: 7, col: 0, hp: 2 }, { type: 'frozen', row: 7, col: 1, hp: 2 },
      { type: 'frozen', row: 7, col: 2, hp: 2 }, { type: 'frozen', row: 7, col: 3, hp: 2 },
      { type: 'frozen', row: 7, col: 4, hp: 2 }, { type: 'frozen', row: 7, col: 5, hp: 2 },
      { type: 'frozen', row: 7, col: 6, hp: 2 }, { type: 'frozen', row: 7, col: 7, hp: 2 }
    ],
    lockedGems: []
  },

  // ── Level 30: Endgame ──────────────────────────────────────────────────────
  {
    id: 30, moves: 20, targetScore: 18000, star2Score: 27000, star3Score: 36000,
    gemTypes: 6,
    obstacles: [
      { type: 'frozen', row: 0, col: 0, hp: 2 }, { type: 'frozen', row: 0, col: 1, hp: 2 },
      { type: 'frozen', row: 0, col: 2, hp: 2 }, { type: 'frozen', row: 0, col: 3, hp: 2 },
      { type: 'frozen', row: 0, col: 4, hp: 2 }, { type: 'frozen', row: 0, col: 5, hp: 2 },
      { type: 'frozen', row: 0, col: 6, hp: 2 }, { type: 'frozen', row: 0, col: 7, hp: 2 },
      { type: 'frozen', row: 7, col: 0, hp: 2 }, { type: 'frozen', row: 7, col: 1, hp: 2 },
      { type: 'frozen', row: 7, col: 2, hp: 2 }, { type: 'frozen', row: 7, col: 3, hp: 2 },
      { type: 'frozen', row: 7, col: 4, hp: 2 }, { type: 'frozen', row: 7, col: 5, hp: 2 },
      { type: 'frozen', row: 7, col: 6, hp: 2 }, { type: 'frozen', row: 7, col: 7, hp: 2 },
      { type: 'frozen', row: 1, col: 0, hp: 2 }, { type: 'frozen', row: 2, col: 0, hp: 2 },
      { type: 'frozen', row: 3, col: 0, hp: 2 }, { type: 'frozen', row: 4, col: 0, hp: 2 },
      { type: 'frozen', row: 5, col: 0, hp: 2 }, { type: 'frozen', row: 6, col: 0, hp: 2 },
      { type: 'frozen', row: 1, col: 7, hp: 2 }, { type: 'frozen', row: 2, col: 7, hp: 2 },
      { type: 'frozen', row: 3, col: 7, hp: 2 }, { type: 'frozen', row: 4, col: 7, hp: 2 },
      { type: 'frozen', row: 5, col: 7, hp: 2 }, { type: 'frozen', row: 6, col: 7, hp: 2 },
      { type: 'stone',  row: 3, col: 3, hp: 1 }, { type: 'stone',  row: 3, col: 4, hp: 1 },
      { type: 'stone',  row: 4, col: 3, hp: 1 }, { type: 'stone',  row: 4, col: 4, hp: 1 }
    ],
    lockedGems: []
  }
];
