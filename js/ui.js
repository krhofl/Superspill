'use strict';

window.UI = (() => {
  // ── Constants ──────────────────────────────────────────────────────────────
  const CELL = 72;          // cell size in CSS pixels
  const BOARD_PX = CELL * 8;
  const ANIM_SPEED = 0.016; // lerp factor per ms (approx)
  const SNAP_DIST = 0.5;

  const GEM_COLORS = {
    fire:   { primary: '#ff6020', dark: '#8b2000', glow: '#ff8040' },
    shadow: { primary: '#8a2be2', dark: '#330066', glow: '#b44dff' },
    void:   { primary: '#3a3a8e', dark: '#08082a', glow: '#5555cc' },
    storm:  { primary: '#00aaff', dark: '#005580', glow: '#44ccff' },
    blood:  { primary: '#cc0020', dark: '#660010', glow: '#ff2244' },
    arcane: { primary: '#9b30ff', dark: '#4a0090', glow: '#cc77ff' },
  };

  const GEM_SYMBOLS = {
    fire: '🔥', shadow: '💜', void: '🔮', storm: '⚡', blood: '💎', arcane: '✨'
  };

  const BOOSTER_COLORS = {
    line_rune_row: '#ffe066',
    line_rune_col: '#ffe066',
    void_orb:      '#cc44ff',
    arcane_bomb:   '#ff4422',
  };

  const BOOSTER_SYMBOLS = {
    line_rune_row: '—',
    line_rune_col: '|',
    void_orb:      '◎',
    arcane_bomb:   '✦',
  };

  // ── State ──────────────────────────────────────────────────────────────────
  let canvas, ctx, dpr;
  let particles = [];
  let ambientParticles = [];
  let lastTs = 0;
  let rafId = null;
  let isVisible = true;

  // Per-cell pixel positions (top-left corner)
  function cellX(c) { return c * CELL; }
  function cellY(r) { return r * CELL; }
  function cellCX(c) { return c * CELL + CELL / 2; }
  function cellCY(r) { return r * CELL + CELL / 2; }

  // ── Canvas setup ──────────────────────────────────────────────────────────
  function initCanvas(canvasEl) {
    canvas = canvasEl;
    dpr = window.devicePixelRatio || 1;
    resize();
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width  = BOARD_PX * dpr;
    canvas.height = BOARD_PX * dpr;
    canvas.style.width  = BOARD_PX + 'px';
    canvas.style.height = BOARD_PX + 'px';
    if (ctx) { ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr, dpr); }
  }

  // ── Game-side animation callbacks ─────────────────────────────────────────
  // These drive the async cascade loop in game.js.

  let _invalidAnim = null; // truthy while snap-back anim running
  let _settledFn = null;   // callback once all tweens settle

  function waitForSettled(fn) { _settledFn = fn; }

  function allGemsTweensSettled() {
    const state = Game.getState();
    if (!state) return true;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const g = state.board[r][c];
        if (!g) continue;
        if (Math.abs(g.animX - g.targetX) > SNAP_DIST ||
            Math.abs(g.animY - g.targetY) > SNAP_DIST ||
            Math.abs(g.alpha - g.targetAlpha) > 0.01) return false;
      }
    }
    if (_invalidAnim) return false;
    return true;
  }

  // ── Screen management ─────────────────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  // ── Level select ──────────────────────────────────────────────────────────
  function buildLevelSelect() {
    const grid = document.getElementById('level-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const prog = Game.loadProgress();
    for (let i = 0; i < window.LEVELS.length; i++) {
      const lv = window.LEVELS[i];
      const stars = prog.levelStars[i] || 0;
      const unlocked = i === 0 || (prog.levelStars[i - 1] > 0);
      const btn = document.createElement('button');
      btn.className = 'level-btn' + (unlocked ? '' : ' locked');
      btn.dataset.level = lv.id;
      btn.innerHTML = `
        <span class="lv-num">${lv.id}</span>
        <span class="lv-stars">${starHTML(stars)}</span>
      `;
      if (unlocked) {
        btn.addEventListener('click', () => startLevelPlay(lv.id));
      }
      grid.appendChild(btn);
    }
  }

  function starHTML(n) {
    return [1,2,3].map(i => `<span class="star ${i<=n?'lit':'dim'}">★</span>`).join('');
  }

  // ── Start level ───────────────────────────────────────────────────────────
  function startLevelPlay(levelId) {
    const lv = window.LEVELS[levelId - 1];
    const state = Game.startLevel(lv);

    // Register game events
    Game.on('swap:start',  d => onSwapStart(d));
    Game.on('swap:invalid', d => onSwapInvalid(d));
    Game.on('gems:matched', d => onGemsMatched(d));
    Game.on('gems:fell',    d => onGemsFell(d));
    Game.on('score:updated', d => updateHUD());
    Game.on('level:complete', d => onLevelComplete(d));
    Game.on('level:fail',    d => onLevelFail(d));
    Game.on('booster:created', d => spawnBoosterParticles(d.row, d.col));

    // Initialise gem pixel positions
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const g = state.board[r][c];
        if (!g) continue;
        g.animX = g.targetX = cellX(c);
        g.animY = g.targetY = cellY(r);
      }
    }

    updateHUD();
    showScreen('screen-game');
    document.getElementById('level-title').textContent = `Level ${levelId}`;
  }

  function updateHUD() {
    const state = Game.getState();
    if (!state) return;
    const moves = document.getElementById('moves-count');
    const scoreEl = document.getElementById('score-val');
    const progressBar = document.getElementById('score-bar');
    if (moves) moves.textContent = state.movesLeft;
    if (scoreEl) scoreEl.textContent = state.score.toLocaleString();
    if (progressBar) {
      const pct = Math.min(1, state.score / state.level.star3Score);
      progressBar.style.width = (pct * 100) + '%';
    }

    // Star threshold highlights
    ['star1','star2','star3'].forEach((id, i) => {
      const thresholds = [state.level.targetScore, state.level.star2Score, state.level.star3Score];
      const el = document.getElementById(id);
      if (el) el.classList.toggle('lit', state.score >= thresholds[i]);
    });
  }

  // ── Swap animation ────────────────────────────────────────────────────────
  function onSwapStart({ r1, c1, r2, c2 }) {
    const state = Game.getState();
    // Board is already swapped in game.js: board[r1][c1] holds old-g2, board[r2][c2] holds old-g1.
    // Each gem's animX/Y still reflects its old visual position; set targets to new board positions.
    const gA = state.board[r1][c1]; // old-g2: needs to animate TO (c1,r1)
    const gB = state.board[r2][c2]; // old-g1: needs to animate TO (c2,r2)
    if (!gA || !gB) { Game.onSwapAnimDone(); return; }
    gA.targetX = cellX(c1); gA.targetY = cellY(r1);
    gB.targetX = cellX(c2); gB.targetY = cellY(r2);
    gA.visualState = 'swapping'; gB.visualState = 'swapping';

    waitForSettled(() => Game.onSwapAnimDone());
  }

  function onSwapInvalid({ r1, c1, r2, c2 }) {
    const state = Game.getState();
    const g1 = state.board[r1][c1], g2 = state.board[r2][c2];
    if (!g1 || !g2) return;
    // Briefly move toward each other then snap back
    const origX1 = cellX(c1), origY1 = cellY(r1);
    const origX2 = cellX(c2), origY2 = cellY(r2);
    // Move toward target
    g1.targetX = cellX(c2); g1.targetY = cellY(r2);
    g2.targetX = cellX(c1); g2.targetY = cellY(r1);
    _invalidAnim = { r1, c1, r2, c2, phase: 'out' };

    setTimeout(() => {
      if (!Game.getState()) return;
      const s = Game.getState();
      const ga = s.board[r1][c1], gb = s.board[r2][c2];
      if (ga) { ga.targetX = origX1; ga.targetY = origY1; }
      if (gb) { gb.targetX = origX2; gb.targetY = origY2; }
      _invalidAnim = null;
      s.phase = 'input';
    }, 250);
  }

  // ── Match animation ────────────────────────────────────────────────────────
  function onGemsMatched({ cells }) {
    for (const { row, col } of cells) {
      const state = Game.getState();
      const g = state && state.board[row][col];
      if (!g) continue;
      g.targetAlpha = 0;
      g.targetScale = 1.5;
      const col2 = GEM_COLORS[g.type] || GEM_COLORS.arcane;
      spawnMatchParticles(cellCX(col), cellCY(row), col2.glow, 10);
    }
    waitForSettled(() => {
      Game.onMatchAnimDone();
    });
  }

  // ── Fall animation ─────────────────────────────────────────────────────────
  function onGemsFell({ fallList }) {
    for (const { row, col, fromRow, gem, isNew } of fallList) {
      gem.animX = gem.targetX = cellX(col);
      gem.targetY = cellY(row);
      gem.animY = cellY(fromRow); // start above
      if (isNew) {
        gem.alpha = 0; gem.targetAlpha = 1;
        gem.scale = 0.5; gem.targetScale = 1;
      }
    }
    waitForSettled(() => {
      Game.onFallAnimDone();
    });
  }

  // ── Level complete / fail ─────────────────────────────────────────────────
  function onLevelComplete({ stars, score }) {
    updateHUD();
    const state = Game.getState();
    if (state) {
      Game.saveHiScore({
        name:  Game.getPlayerName(),
        score: score,
        level: state.level.id,
        stars: stars,
        date:  new Date().toLocaleDateString(),
      });
    }
    const el = document.getElementById('complete-score');
    if (el) el.textContent = score.toLocaleString();
    const starsEl = document.getElementById('complete-stars');
    if (starsEl) starsEl.innerHTML = starHTML(stars);
    showScreen('screen-complete');
  }

  function onLevelFail({ score }) {
    const el = document.getElementById('fail-score');
    if (el) el.textContent = score.toLocaleString();
    showScreen('screen-fail');
  }

  // ── Particles ─────────────────────────────────────────────────────────────
  function spawnMatchParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 0.8 + Math.random() * 2.5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0, maxLife: 400 + Math.random() * 300,
        color, size: 2 + Math.random() * 4, alpha: 1
      });
    }
  }

  function spawnBoosterParticles(row, col) {
    spawnMatchParticles(cellCX(col), cellCY(row), '#ffe066', 16);
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      p.x += p.vx * dt * 0.05;
      p.y += p.vy * dt * 0.05;
      p.vy += 0.002 * dt;
      p.alpha = 1 - p.life / p.maxLife;
      if (p.life >= p.maxLife) particles.splice(i, 1);
    }
  }

  // ── Main render loop ───────────────────────────────────────────────────────
  function gameLoop(ts) {
    rafId = requestAnimationFrame(gameLoop);
    if (!isVisible) return;
    const dt = Math.min(ts - lastTs, 50); // cap dt to avoid huge jumps
    lastTs = ts;

    // Update tweens
    const state = Game.getState();
    if (state) {
      let settled = true;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const g = state.board[r][c];
          if (!g) continue;
          const f = Math.min(1, 14 * dt / 1000);
          g.animX  += (g.targetX  - g.animX)  * f;
          g.animY  += (g.targetY  - g.animY)  * f;
          g.alpha  += (g.targetAlpha - g.alpha) * Math.min(1, 10 * dt / 1000);
          g.scale  += (g.targetScale - g.scale) * Math.min(1, 10 * dt / 1000);
          if (Math.abs(g.animX - g.targetX) > SNAP_DIST ||
              Math.abs(g.animY - g.targetY) > SNAP_DIST ||
              Math.abs(g.alpha - g.targetAlpha) > 0.02) settled = false;
        }
      }
      if (_invalidAnim) settled = false;

      if (settled && _settledFn) {
        const fn = _settledFn;
        _settledFn = null;
        fn();
      }
    }

    updateParticles(dt);
    drawGame(state, ts);
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  function drawGame(state, ts) {
    if (!ctx) return;
    ctx.clearRect(0, 0, BOARD_PX, BOARD_PX);

    // Board background
    ctx.fillStyle = '#0d0820';
    ctx.fillRect(0, 0, BOARD_PX, BOARD_PX);

    // Grid lines
    ctx.strokeStyle = 'rgba(90,58,159,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, BOARD_PX); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(BOARD_PX, i * CELL); ctx.stroke();
    }

    if (!state) return;

    const selR = state.selectedCell ? state.selectedCell.row : -1;
    const selC = state.selectedCell ? state.selectedCell.col : -1;

    // Draw gems
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const g = state.board[r][c];
        if (!g || g.alpha <= 0.01) continue;
        const isSelected = r === selR && c === selC;
        drawGem(g, isSelected, ts);
      }
    }

    // Draw particles
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawGem(g, isSelected, ts) {
    const x = g.animX, y = g.animY;
    const s = g.scale;
    const cx = x + CELL / 2, cy = y + CELL / 2;
    const r = (CELL / 2 - 4) * s;

    ctx.save();
    ctx.globalAlpha = g.alpha;
    ctx.translate(cx, cy);
    ctx.scale(s, s);

    if (g.obstacleType) {
      drawObstacle(g);
      ctx.restore();
      return;
    }

    const col = GEM_COLORS[g.type] || GEM_COLORS.arcane;

    // Glow shadow
    ctx.shadowColor = col.glow;
    ctx.shadowBlur = isSelected ? 20 : 10;

    // Rounded rect gem body
    const hw = CELL / 2 - 4;
    roundRect(ctx, -hw, -hw, hw * 2, hw * 2, 12);

    // Radial gradient fill
    const grad = ctx.createRadialGradient(-hw * 0.3, -hw * 0.3, 2, 0, 0, hw * 1.3);
    grad.addColorStop(0, col.primary);
    grad.addColorStop(1, col.dark);
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.strokeStyle = col.glow;
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Selection pulse ring
    if (isSelected) {
      const pulse = 0.7 + 0.3 * Math.sin(ts / 200);
      ctx.strokeStyle = `rgba(255,255,255,${pulse})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Top-left highlight
    ctx.globalAlpha *= 0.35;
    const hGrad = ctx.createRadialGradient(-hw * 0.4, -hw * 0.4, 1, -hw * 0.4, -hw * 0.4, hw * 0.7);
    hGrad.addColorStop(0, 'white');
    hGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = hGrad;
    roundRect(ctx, -hw, -hw, hw * 2, hw * 2, 12);
    ctx.fill();
    ctx.globalAlpha = g.alpha;

    // Symbol
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `${Math.floor(CELL * 0.38)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(GEM_SYMBOLS[g.type] || '?', 0, 1);

    // Booster overlay
    if (g.booster) {
      const bc = BOOSTER_COLORS[g.booster] || '#fff';
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.6 + 0.3 * Math.sin(ts / 300);
      ctx.fillStyle = bc;
      ctx.font = `bold ${Math.floor(CELL * 0.3)}px sans-serif`;
      ctx.fillText(BOOSTER_SYMBOLS[g.booster] || '!', 0, 2);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = g.alpha;

      // Outer glow ring for booster
      ctx.strokeStyle = bc;
      ctx.lineWidth = 2;
      ctx.shadowColor = bc;
      ctx.shadowBlur = 15;
      roundRect(ctx, -hw - 2, -hw - 2, hw * 2 + 4, hw * 2 + 4, 14);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  function drawObstacle(g) {
    const hw = CELL / 2 - 4;
    if (g.obstacleType === 'stone') {
      ctx.fillStyle = '#555577';
      roundRect(ctx, -hw, -hw, hw * 2, hw * 2, 10);
      ctx.fill();
      ctx.strokeStyle = '#9988aa';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = `${Math.floor(CELL * 0.4)}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🪨', 0, 1);
    } else if (g.obstacleType === 'frozen') {
      ctx.fillStyle = g.obstacleHp >= 2 ? '#3399ff' : '#88ccff';
      roundRect(ctx, -hw, -hw, hw * 2, hw * 2, 10);
      ctx.fill();
      ctx.strokeStyle = '#aaddff';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Crack lines if hp = 1
      if (g.obstacleHp === 1) {
        ctx.strokeStyle = 'rgba(200,220,255,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-hw * 0.2, -hw * 0.5); ctx.lineTo(hw * 0.4, hw * 0.3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-hw * 0.5, hw * 0.1); ctx.lineTo(hw * 0.1, hw * 0.6); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = `${Math.floor(CELL * 0.4)}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('❄️', 0, 1);
    }
  }

  function roundRect(ctx2, x, y, w, h, radius) {
    ctx2.beginPath();
    ctx2.moveTo(x + radius, y);
    ctx2.lineTo(x + w - radius, y);
    ctx2.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx2.lineTo(x + w, y + h - radius);
    ctx2.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx2.lineTo(x + radius, y + h);
    ctx2.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx2.lineTo(x, y + radius);
    ctx2.quadraticCurveTo(x, y, x + radius, y);
    ctx2.closePath();
  }

  // ── Input handling ─────────────────────────────────────────────────────────
  function setupInput(canvasEl) {
    let dragStart = null;

    function getCell(clientX, clientY) {
      const rect = canvasEl.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const c = Math.floor(x / CELL);
      const r = Math.floor(y / CELL);
      if (r < 0 || r >= 8 || c < 0 || c >= 8) return null;
      return { row: r, col: c };
    }

    function handleDown(cx, cy) {
      const state = Game.getState();
      if (!state || state.phase !== 'input') return;
      const cell = getCell(cx, cy);
      if (!cell) return;
      const g = state.board[cell.row][cell.col];
      if (!g || g.obstacleType) return;
      dragStart = cell;
      Game.setLastSwapOrigin(cell.row, cell.col);
      state.selectedCell = cell;
    }

    function handleUp(cx, cy) {
      const state = Game.getState();
      if (!state || state.phase !== 'input' || !dragStart) { dragStart = null; return; }
      const cell = getCell(cx, cy);
      if (!cell) { state.selectedCell = null; dragStart = null; return; }

      const dr = cell.row - dragStart.row;
      const dc = cell.col - dragStart.col;
      const dist = Math.abs(dr) + Math.abs(dc);

      if (dist === 0) {
        // Second click — wait for next down
        dragStart = null;
        return;
      }

      if (dist === 1) {
        state.selectedCell = null;
        Game.trySwap(dragStart.row, dragStart.col, cell.row, cell.col);
        dragStart = null;
        return;
      }

      // Dragged more than 1 cell — snap to dominant direction
      if (dist > 1) {
        const tr = dragStart.row + Math.sign(dr);
        const tc = dragStart.col + Math.sign(dc);
        if (Math.abs(dr) >= Math.abs(dc)) {
          Game.trySwap(dragStart.row, dragStart.col, dragStart.row + Math.sign(dr), dragStart.col);
        } else {
          Game.trySwap(dragStart.row, dragStart.col, dragStart.row, dragStart.col + Math.sign(dc));
        }
        state.selectedCell = null;
        dragStart = null;
      }
    }

    canvasEl.addEventListener('mousedown', e => handleDown(e.clientX, e.clientY));
    canvasEl.addEventListener('mouseup',   e => handleUp(e.clientX, e.clientY));

    canvasEl.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      handleDown(t.clientX, t.clientY);
    }, { passive: false });

    canvasEl.addEventListener('touchend', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      handleUp(t.clientX, t.clientY);
    }, { passive: false });

    canvasEl.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  }

  // ── Ambient particles (menu background) ────────────────────────────────────
  function startAmbientParticles(canvasEl) {
    const ac = canvasEl.getContext('2d');
    const w = canvasEl.width, h = canvasEl.height;
    const ap = [];
    const colors = ['#9b30ff','#c9a227','#3a3a8e','#cc0020','#00aaff'];
    for (let i = 0; i < 60; i++) {
      ap.push({ x: Math.random()*w, y: Math.random()*h,
        vx: (Math.random()-0.5)*0.3, vy: -0.1-Math.random()*0.3,
        size: 1+Math.random()*3, alpha: Math.random(), color: colors[Math.floor(Math.random()*colors.length)] });
    }
    function tick() {
      ac.clearRect(0,0,w,h);
      for (const p of ap) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -5) { p.y = h+5; p.x = Math.random()*w; }
        ac.globalAlpha = p.alpha * 0.6;
        ac.fillStyle = p.color;
        ac.beginPath(); ac.arc(p.x, p.y, p.size, 0, Math.PI*2); ac.fill();
      }
      ac.globalAlpha = 1;
      requestAnimationFrame(tick);
    }
    tick();
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    const boardCanvas = document.getElementById('board-canvas');
    if (!boardCanvas) return;
    initCanvas(boardCanvas);
    setupInput(boardCanvas);

    const ambCanvas = document.getElementById('particle-canvas');
    if (ambCanvas) startAmbientParticles(ambCanvas);

    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
    });

    buildLevelSelect();
    setupMenuButtons();

    lastTs = performance.now();
    rafId = requestAnimationFrame(gameLoop);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function buildHiScoreTable() {
    const tbody = document.querySelector('#hiscore-table tbody');
    if (!tbody) return;
    const table = Game.loadHiScores();
    if (table.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="hs-empty">No scores yet — play a level!</td></tr>';
      return;
    }
    tbody.innerHTML = table.map((e, i) => {
      const rank = i + 1;
      const rankClass = rank <= 3 ? ` class="hs-rank-${rank}"` : '';
      const stars = [1,2,3].map(s => `<span class="star ${s <= e.stars ? 'lit' : 'dim'}">★</span>`).join('');
      return `<tr>
        <td${rankClass}>${rank}</td>
        <td>${escapeHtml(e.name)}</td>
        <td class="hs-score">${Number(e.score).toLocaleString()}</td>
        <td>${e.level}</td>
        <td>${stars}</td>
      </tr>`;
    }).join('');
  }

  function setupMenuButtons() {
    // Main menu
    const playBtn = document.getElementById('btn-play');
    if (playBtn) playBtn.addEventListener('click', () => { buildLevelSelect(); showScreen('screen-levelselect'); });

    // Player name
    const nameInput   = document.getElementById('input-player-name');
    const setNameBtn  = document.getElementById('btn-set-name');
    const nameDisplay = document.getElementById('name-display');

    function refreshNameDisplay() {
      const n = Game.getPlayerName();
      if (nameDisplay) nameDisplay.textContent = `Playing as: ${n}`;
      if (nameInput)   nameInput.value = localStorage.getItem('darkMagic_playerName') ? n : '';
    }

    if (setNameBtn) setNameBtn.addEventListener('click', () => {
      const saved = Game.setPlayerName(nameInput ? nameInput.value : '');
      refreshNameDisplay();
    });

    if (nameInput) nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') setNameBtn && setNameBtn.click();
    });

    refreshNameDisplay();

    // High scores
    const hiScoresBtn = document.getElementById('btn-hiscores');
    if (hiScoresBtn) hiScoresBtn.addEventListener('click', () => {
      buildHiScoreTable();
      showScreen('screen-hiscores');
    });

    const hsBackBtn = document.getElementById('btn-hs-back');
    if (hsBackBtn) hsBackBtn.addEventListener('click', () => showScreen('screen-mainmenu'));

    // Level select back
    const lsBack = document.getElementById('btn-ls-back');
    if (lsBack) lsBack.addEventListener('click', () => showScreen('screen-mainmenu'));

    // In-game pause
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) pauseBtn.addEventListener('click', () => {
      const state = Game.getState();
      if (state && state.phase === 'input') { state.phase = 'paused'; showScreen('screen-pause'); }
    });

    // Pause screen
    const resumeBtn = document.getElementById('btn-resume');
    if (resumeBtn) resumeBtn.addEventListener('click', () => {
      const state = Game.getState();
      if (state) { state.phase = 'input'; showScreen('screen-game'); }
    });

    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) restartBtn.addEventListener('click', () => {
      const state = Game.getState();
      if (state) startLevelPlay(state.level.id);
    });

    const quitBtn = document.getElementById('btn-quit');
    if (quitBtn) quitBtn.addEventListener('click', () => showScreen('screen-levelselect'));

    // Complete screen
    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) nextBtn.addEventListener('click', () => {
      const state = Game.getState();
      if (!state) return;
      const nextId = state.level.id + 1;
      if (nextId <= window.LEVELS.length) startLevelPlay(nextId);
      else { buildLevelSelect(); showScreen('screen-levelselect'); }
    });

    const compLsBtn = document.getElementById('btn-comp-ls');
    if (compLsBtn) compLsBtn.addEventListener('click', () => { buildLevelSelect(); showScreen('screen-levelselect'); });

    // Fail screen
    const retryBtn = document.getElementById('btn-retry');
    if (retryBtn) retryBtn.addEventListener('click', () => {
      const state = Game.getState();
      if (state) startLevelPlay(state.level.id);
    });

    const failLsBtn = document.getElementById('btn-fail-ls');
    if (failLsBtn) failLsBtn.addEventListener('click', () => { buildLevelSelect(); showScreen('screen-levelselect'); });
  }

  return { init, showScreen, buildLevelSelect, startLevelPlay };
})();

document.addEventListener('DOMContentLoaded', () => UI.init());
